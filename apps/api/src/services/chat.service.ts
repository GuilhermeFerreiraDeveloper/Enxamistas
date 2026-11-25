import { prisma } from '../lib/prisma';
import { MessageInput } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

export class ChatService {
  private async ensureParticipant(conversationId: string, profileId: string) {
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_profileId: { conversationId, profileId },
      },
    });
    if (!member) {
      throw new AppError('Você não tem acesso a esta conversa.', 403, 'CHAT_FORBIDDEN');
    }
    return member;
  }

  async getConversations(profileId: string, search?: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        members: { some: { profileId } },
      },
      include: {
        members: {
          include: {
            profile: {
              select: {
                id: true,
                name: true,
                avatar: true,
                user: { select: { passport: true, role: true } },
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: profileId },
            reads: { none: { profileId } },
          },
        });
        return { ...conv, unreadCount };
      })
    );

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      return enriched.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(term)) ||
          c.members.some(
            (m) =>
              m.profileId !== profileId &&
              (m.profile.name.toLowerCase().includes(term) ||
                m.profile.user.passport.toLowerCase().includes(term))
          )
      );
    }

    return enriched;
  }

  async createConversation(creatorProfileId: string, targetProfileIds: string[], name?: string, isGroup = false) {
    const uniqueIds = Array.from(new Set([creatorProfileId, ...targetProfileIds]));
    if (uniqueIds.length < 2) {
      throw new AppError('Selecione pelo menos um participante válido.', 400, 'INVALID_PARTICIPANTS');
    }

    // Reuse existing 1-on-1 conversation if present
    if (!isGroup && uniqueIds.length === 2) {
      const [p1, p2] = uniqueIds;
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { profileId: p1 } } },
            { members: { some: { profileId: p2 } } },
          ],
        },
        include: {
          members: {
            include: {
              profile: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  user: { select: { passport: true, role: true } },
                },
              },
            },
          },
        },
      });
      if (existing && existing.members.length === 2) {
        return existing;
      }
    }

    return prisma.conversation.create({
      data: {
        isGroup,
        name: isGroup ? name : null,
        members: {
          create: uniqueIds.map((profileId) => ({ profileId })),
        },
      },
      include: {
        members: {
          include: {
            profile: {
              select: {
                id: true,
                name: true,
                avatar: true,
                user: { select: { passport: true, role: true } },
              },
            },
          },
        },
      },
    });
  }

  async getMessages(conversationId: string, requesterProfileId: string, page = 1, limit = 50) {
    await this.ensureParticipant(conversationId, requesterProfileId);

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      skip,
      take: limitNum,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            user: { select: { passport: true, role: true } },
          },
        },
        attachments: true,
        reads: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return messages.reverse();
  }

  async sendMessage(conversationId: string, senderId: string, data: MessageInput) {
    await this.ensureParticipant(conversationId, senderId);

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: data.content,
        attachments: data.attachments?.length
          ? {
              create: data.attachments.map((a) => ({
                url: a.url,
                type: a.type,
              })),
            }
          : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            user: { select: { passport: true, role: true } },
          },
        },
        attachments: true,
        reads: true,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const otherMembers = await prisma.conversationMember.findMany({
      where: { conversationId, profileId: { not: senderId } },
      select: { profileId: true },
    });

    await Promise.all(
      otherMembers.map((m) =>
        notificationService.createNotification(m.profileId, {
          title: `Nova mensagem de ${message.sender.name}`,
          content: data.content.slice(0, 80),
          link: `/chat?c=${conversationId}`,
          type: 'CHAT',
        })
      )
    );

    return message;
  }

  async markConversationAsRead(conversationId: string, profileId: string) {
    await this.ensureParticipant(conversationId, profileId);

    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: profileId },
        reads: { none: { profileId } },
      },
      select: { id: true },
    });

    if (unreadMessages.length === 0) return { marked: 0 };

    await prisma.messageRead.createMany({
      data: unreadMessages.map((m) => ({ messageId: m.id, profileId })),
      skipDuplicates: true,
    });

    return { marked: unreadMessages.length };
  }
}
