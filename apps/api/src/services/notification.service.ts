import { prisma } from '../lib/prisma';
import { UserRole } from '@enxamistas/shared';

export class NotificationService {
  async createNotification(
    profileId: string,
    data: { title: string; content: string; link?: string; type: string }
  ) {
    const pref = await prisma.notificationPreference.findUnique({ where: { profileId } });
    if (pref) {
      const typeKey = data.type.toLowerCase() as keyof typeof pref;
      if (typeKey in pref && pref[typeKey] === false) {
        return null;
      }
    }

    return prisma.notification.create({
      data: {
        profileId,
        title: data.title,
        content: data.content,
        link: data.link,
        type: data.type,
      },
    });
  }

  async notifyRoles(
    roles: UserRole[],
    data: { title: string; content: string; link?: string; type: string }
  ) {
    const profiles = await prisma.profile.findMany({
      where: {
        user: {
          role: { in: roles },
          isSuspended: false,
        },
      },
      select: { id: true },
    });

    await Promise.all(profiles.map((p) => this.createNotification(p.id, data)));
  }

  async getNotifications(profileId: string) {
    const [items, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { profileId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { profileId, isRead: false },
      }),
    ]);

    return { items, unreadCount };
  }

  async markAsRead(id: string, profileId: string) {
    return prisma.notification.updateMany({
      where: { id, profileId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(profileId: string) {
    return prisma.notification.updateMany({
      where: { profileId, isRead: false },
      data: { isRead: true },
    });
  }

  async getPreferences(profileId: string) {
    return prisma.notificationPreference.upsert({
      where: { profileId },
      update: {},
      create: { profileId },
    });
  }

  async updatePreferences(
    profileId: string,
    data: Partial<{ events: boolean; academic: boolean; feed: boolean; chat: boolean; admin: boolean }>
  ) {
    return prisma.notificationPreference.upsert({
      where: { profileId },
      update: data,
      create: { profileId, ...data },
    });
  }
}
