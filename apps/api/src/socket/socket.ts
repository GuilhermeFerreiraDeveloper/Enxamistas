import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { ChatService } from '../services/chat.service';
import { messageSchema } from '@enxamistas/shared';

const chatService = new ChatService();
let ioInstance: Server | null = null;

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      result[k] = v;
    }
  }
  return result;
}

export function getIO(): Server | null {
  return ioInstance;
}

export function initSocketIO(server: http.Server): Server {
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL.split(',').map((s) => s.trim()),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies.token || (socket.handshake.auth?.token as string | undefined);
      if (!token) return next(new Error('Não autorizado'));

      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          passport: true,
          role: true,
          isSuspended: true,
          profile: { select: { id: true, name: true, avatar: true } },
        },
      });

      if (!user || user.isSuspended || !user.profile) {
        return next(new Error('Acesso negado'));
      }

      (socket as any).user = user;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  const lastMessageAt = new Map<string, number>();

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    const profileId = user.profile.id as string;

    socket.join(`profile:${profileId}`);

    socket.on('join_conversation', async (conversationId: string, ack?: (res: any) => void) => {
      try {
        const member = await prisma.conversationMember.findUnique({
          where: { conversationId_profileId: { conversationId, profileId } },
        });
        if (!member) {
          ack?.({ ok: false, error: 'Acesso negado à conversa.' });
          return;
        }
        socket.join(`conv:${conversationId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: 'Erro ao entrar na conversa.' });
      }
    });

    socket.on(
      'send_message',
      async (
        payload: { conversationId: string; content: string; attachments?: { url: string; type: string }[] },
        ack?: (res: any) => void
      ) => {
        try {
          const now = Date.now();
          const prev = lastMessageAt.get(profileId) || 0;
          if (now - prev < 400) {
            ack?.({ ok: false, error: 'Aguarde um instante antes de enviar outra mensagem.' });
            return;
          }
          lastMessageAt.set(profileId, now);

          const validated = messageSchema.parse({
            content: payload.content,
            attachments: payload.attachments,
          });

          const message = await chatService.sendMessage(
            payload.conversationId,
            profileId,
            validated
          );

          io.to(`conv:${payload.conversationId}`).emit('new_message', message);

          // Notify participants in their personal profile rooms for unread badge updates
          const members = await prisma.conversationMember.findMany({
            where: { conversationId: payload.conversationId, profileId: { not: profileId } },
            select: { profileId: true },
          });
          for (const m of members) {
            io.to(`profile:${m.profileId}`).emit('notification_ping', {
              type: 'CHAT',
              conversationId: payload.conversationId,
            });
          }

          ack?.({ ok: true, message });
        } catch (err: any) {
          ack?.({ ok: false, error: err?.message || 'Erro ao enviar mensagem.' });
        }
      }
    );
  });

  ioInstance = io;
  return io;
}
