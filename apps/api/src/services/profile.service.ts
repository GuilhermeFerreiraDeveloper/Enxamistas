import { prisma } from '../lib/prisma';
import { UpdateProfileInput } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';

export class ProfileService {
  async getProfile(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            passport: true,
            role: true,
            createdAt: true,
          },
        },
        mainCourse: {
          include: { teacher: true, schedules: true },
        },
        enrollments: {
          include: {
            course: { include: { teacher: true, schedules: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        courseCompletions: {
          where: { status: 'APPROVED' },
          include: { course: true },
          orderBy: { completedAt: 'desc' },
        },
        medals: {
          include: {
            medal: { include: { course: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        achievements: {
          include: { achievement: true },
          orderBy: { createdAt: 'desc' },
        },
        projectsList: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado', 404, 'PROFILE_NOT_FOUND');
    }
    return profile;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const updateData: Record<string, any> = {};
    if (data.avatar !== undefined) updateData.avatar = data.avatar || null;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.favoriteMusic !== undefined) updateData.favoriteMusic = data.favoriteMusic;
    if (data.musicGenre !== undefined) updateData.musicGenre = data.musicGenre;
    if (data.interests !== undefined) updateData.interests = data.interests;
    if (data.projects !== undefined) updateData.projects = data.projects;

    const updated = await prisma.profile.update({
      where: { userId },
      data: updateData,
      include: {
        user: { select: { passport: true, role: true, createdAt: true } },
        mainCourse: true,
      },
    });

    await AuditService.log(userId, 'PROFILE_UPDATE', 'Profile', { fields: Object.keys(updateData) });
    return updated;
  }

  async getProfileByPassport(passport: string) {
    const profile = await prisma.profile.findFirst({
      where: {
        user: { passport, isSuspended: false },
      },
      include: {
        user: {
          select: {
            passport: true,
            role: true,
            createdAt: true,
          },
        },
        mainCourse: { include: { teacher: true } },
        enrollments: {
          include: { course: { include: { teacher: true } } },
        },
        courseCompletions: {
          where: { status: 'APPROVED' },
          include: { course: true },
        },
        medals: {
          include: { medal: { include: { course: true } } },
          orderBy: { createdAt: 'desc' },
        },
        achievements: {
          include: { achievement: true },
          orderBy: { createdAt: 'desc' },
        },
        projectsList: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return profile;
  }

  async getMembers(filters: any) {
    const {
      q,
      name,
      passport,
      role,
      courseId,
      medalId,
      completedCourseId,
      page = '1',
      limit = '12',
    } = filters;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      user: {
        isSuspended: false,
        role: role || undefined,
        passport: passport ? { contains: String(passport), mode: 'insensitive' } : undefined,
      },
    };

    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { user: { passport: { contains: String(q), mode: 'insensitive' } } },
      ];
    } else if (name) {
      where.name = { contains: String(name), mode: 'insensitive' };
    }

    if (courseId) {
      where.OR = [
        ...(where.OR || []),
      ];
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { mainCourseId: String(courseId) },
            { enrollments: { some: { courseId: String(courseId) } } },
          ],
        },
      ];
    }

    if (medalId) {
      where.medals = { some: { medalId: String(medalId) } };
    }

    if (completedCourseId) {
      where.courseCompletions = {
        some: { courseId: String(completedCourseId), status: 'APPROVED' },
      };
    }

    const [items, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          name: true,
          avatar: true,
          bio: true,
          joinDate: true,
          user: {
            select: {
              passport: true,
              role: true,
            },
          },
          mainCourse: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              medals: true,
              courseCompletions: true,
              achievements: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.profile.count({ where }),
    ]);

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    };
  }
}
