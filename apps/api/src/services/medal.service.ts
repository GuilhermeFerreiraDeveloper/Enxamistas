import { prisma } from '../lib/prisma';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

export class MedalService {
  async listAllCatalog() {
    const [medals, achievements] = await Promise.all([
      prisma.courseMedal.findMany({
        include: {
          course: { select: { id: true, name: true } },
          _count: { select: { userMedals: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.achievement.findMany({
        include: {
          _count: { select: { users: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { medals, achievements };
  }

  async createMedal(courseId: string, data: any) {
    return prisma.courseMedal.upsert({
      where: { courseId },
      update: {
        name: data.name,
        description: data.description,
        icon: data.icon || 'award',
        criteria: data.criteria,
      },
      create: {
        courseId,
        name: data.name,
        description: data.description,
        icon: data.icon || 'award',
        criteria: data.criteria,
      },
    });
  }

  async emitMedal(profileId: string, medalId: string, emittedById: string, reason?: string, actorUserId?: string) {
    const existing = await prisma.userMedal.findUnique({
      where: { medalId_profileId: { medalId, profileId } },
    });
    if (existing) {
      throw new AppError('O membro já possui esta medalha de conclusão.', 409, 'MEDAL_ALREADY_GRANTED');
    }

    const userMedal = await prisma.userMedal.create({
      data: {
        profileId,
        medalId,
        emittedById,
        reason,
      },
      include: {
        medal: { include: { course: true } },
      },
    });

    await notificationService.createNotification(profileId, {
      title: 'Nova medalha conquistada!',
      content: `Você recebeu a medalha "${userMedal.medal.name}".`,
      link: '/medalhas',
      type: 'ACADEMIC',
    });

    if (actorUserId) {
      await AuditService.log(actorUserId, 'MEDAL_EMIT', 'UserMedal', {
        profileId,
        medalId,
        reason,
      });
    }

    return userMedal;
  }

  async getProfileMedals(profileId: string) {
    return prisma.userMedal.findMany({
      where: { profileId },
      include: {
        medal: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAchievement(data: any) {
    return prisma.achievement.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon || 'star',
        category: data.category || 'GENERAL',
        type: data.type || 'MANUAL',
        criteria: data.criteria,
      },
    });
  }

  async grantAchievement(
    profileId: string,
    achievementId: string,
    emittedById?: string,
    reason?: string,
    actorUserId?: string
  ) {
    const existing = await prisma.userAchievement.findUnique({
      where: { achievementId_profileId: { achievementId, profileId } },
    });
    if (existing) {
      throw new AppError('O membro já possui esta conquista.', 409, 'ACHIEVEMENT_ALREADY_GRANTED');
    }

    const granted = await prisma.userAchievement.create({
      data: {
        profileId,
        achievementId,
        emittedById,
        reason,
      },
      include: { achievement: true },
    });

    await notificationService.createNotification(profileId, {
      title: 'Nova conquista desbloqueada!',
      content: `Conquista recebida: "${granted.achievement.name}".`,
      link: '/medalhas',
      type: 'ACADEMIC',
    });

    if (actorUserId) {
      await AuditService.log(actorUserId, 'ACHIEVEMENT_GRANT', 'UserAchievement', {
        profileId,
        achievementId,
        reason,
      });
    }

    return granted;
  }

  async grantAutoAchievementByName(profileId: string, achievementName: string) {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { name: achievementName },
      });
      if (!achievement) return null;

      return await prisma.userAchievement.upsert({
        where: { achievementId_profileId: { achievementId: achievement.id, profileId } },
        update: {},
        create: {
          achievementId: achievement.id,
          profileId,
          reason: 'Concessão automática pelo sistema',
        },
      });
    } catch {
      return null;
    }
  }

  async getProfileAchievements(profileId: string) {
    return prisma.userAchievement.findMany({
      where: { profileId },
      include: { achievement: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
