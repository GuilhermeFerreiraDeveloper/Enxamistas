import { prisma } from '../lib/prisma';
import { UpdateProfileInput } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';
import { env } from '../config/env';
import { UserRole } from '@enxamistas/shared';

export class ProfileService {
  private getPublicImagePath(imageUrl: string | null) {
    if (!imageUrl) return null;
    const pathPattern = /^uploads\/(avatars|gallery|profile)\/([0-9a-f-]{36}\/([0-9a-f-]{36})\.(jpg|png|webp))$/i;
    const storedPath = imageUrl.replace(/^\/+/, '');
    if (pathPattern.test(storedPath)) return storedPath;

    try {
      const imageUrlObject = new URL(imageUrl);
      const storageEndpoint = new URL(env.STORAGE_ENDPOINT);
      const bucketPath = `${storageEndpoint.pathname.replace(/\/$/, '')}/${env.STORAGE_BUCKET}/`;
      if (imageUrlObject.origin === storageEndpoint.origin && imageUrlObject.pathname.startsWith(bucketPath)) {
        const key = imageUrlObject.pathname.slice(bucketPath.length);
        if (pathPattern.test(`uploads/${key}`)) return `uploads/${key}`;
      }
    } catch {
      return imageUrl;
    }

    return imageUrl;
  }

  private toPublicMember(profile: any) {
    return {
      id: profile.id,
      name: profile.name,
      avatar: this.getPublicImagePath(profile.avatar),
      banner: this.getPublicImagePath(profile.banner),
      nickname: profile.nickname,
      age: profile.age,
      zodiac: profile.zodiac,
      bio: profile.bio,
      description: profile.description,
      favoriteMusic: profile.favoriteMusic,
      favoriteFilm: profile.favoriteFilm,
      personalQuote: profile.personalQuote,
      socialLinks: profile.socialLinks,
      formationArea: profile.formationArea,
      honors: profile.honors,
      musicGenre: profile.musicGenre,
      interests: profile.interests,
      joinDate: profile.joinDate,
      role: profile.user.role,
      mainCourse: profile.mainCourse,
      medals: profile.medals?.map((award: any) => ({
        id: award.id,
        name: award.medal.name,
        course: award.medal.course?.name || null,
      })) || [],
    };
  }

  async getPublicMembers(filters: any) {
    const page = Math.max(1, parseInt(String(filters.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(filters.limit || '24'), 10) || 24));
    const query = typeof filters.q === 'string' ? filters.q.trim().slice(0, 100) : '';
    const role = Object.values(UserRole).includes(filters.role) ? filters.role : undefined;
    const where: any = { user: { isSuspended: false, role } };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { nickname: { contains: query, mode: 'insensitive' } },
        { mainCourse: { is: { name: { contains: query, mode: 'insensitive' } } } },
      ];
    }

    const [profiles, total] = await prisma.$transaction([
      prisma.profile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          avatar: true,
          banner: true,
          nickname: true,
          age: true,
          zodiac: true,
          bio: true,
          description: true,
          favoriteMusic: true,
          favoriteFilm: true,
          personalQuote: true,
          socialLinks: true,
          formationArea: true,
          honors: true,
          musicGenre: true,
          interests: true,
          joinDate: true,
          user: { select: { role: true } },
          mainCourse: { select: { id: true, name: true } },
          medals: {
            take: 12,
            orderBy: { createdAt: 'desc' },
            select: { id: true, medal: { select: { name: true, course: { select: { name: true } } } } },
          },
        },
        orderBy: [{ user: { role: 'asc' } }, { name: 'asc' }],
      }),
      prisma.profile.count({ where }),
    ]);

    return {
      items: profiles.map((profile) => this.toPublicMember(profile)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getPublicMember(profileId: string) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, user: { isSuspended: false } },
      select: {
        id: true,
        name: true,
        avatar: true,
        banner: true,
        nickname: true,
        age: true,
        zodiac: true,
        bio: true,
        description: true,
        favoriteMusic: true,
        favoriteFilm: true,
        personalQuote: true,
        socialLinks: true,
        formationArea: true,
        honors: true,
        musicGenre: true,
        interests: true,
        joinDate: true,
        user: { select: { role: true } },
        mainCourse: { select: { id: true, name: true } },
        medals: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: { id: true, medal: { select: { name: true, course: { select: { name: true } } } } },
        },
      },
    });
    return profile ? this.toPublicMember(profile) : null;
  }

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
    return {
      ...profile,
      avatar: this.getPublicImagePath(profile.avatar),
      banner: this.getPublicImagePath(profile.banner),
    };
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const currentProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!currentProfile) throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');

    for (const imagePath of [data.avatar, data.banner]) {
      if (imagePath?.startsWith('uploads/')) {
        const expectedPrefix = /^uploads\/(avatars|profile)\/([0-9a-f-]{36})\//i.exec(imagePath);
        if (!expectedPrefix || expectedPrefix[2] !== currentProfile.id) {
          throw new AppError('A imagem enviada não pertence ao seu perfil.', 400, 'INVALID_PROFILE_IMAGE');
        }
      }
    }

    if (data.socialLinks) {
      const links = data.socialLinks.split(/\r?\n/).map((link) => link.trim()).filter(Boolean);
      if (links.length > 5 || links.some((link) => {
        try {
          return !['http:', 'https:'].includes(new URL(link).protocol);
        } catch {
          return true;
        }
      })) {
        throw new AppError('Informe até 5 links sociais válidos usando https://.', 400, 'INVALID_SOCIAL_LINKS');
      }
    }

    const updateData: Record<string, any> = {};
    if (data.avatar !== undefined) updateData.avatar = data.avatar || null;
    if (data.banner !== undefined) updateData.banner = data.banner || null;
    if (data.nickname !== undefined) updateData.nickname = data.nickname.trim() || null;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.zodiac !== undefined) updateData.zodiac = data.zodiac.trim() || null;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.favoriteMusic !== undefined) updateData.favoriteMusic = data.favoriteMusic;
    if (data.favoriteFilm !== undefined) updateData.favoriteFilm = data.favoriteFilm;
    if (data.personalQuote !== undefined) updateData.personalQuote = data.personalQuote;
    if (data.socialLinks !== undefined) updateData.socialLinks = data.socialLinks.trim() || null;
    if (data.formationArea !== undefined) updateData.formationArea = data.formationArea;
    if (data.honors !== undefined) updateData.honors = data.honors;
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

    return profile ? {
      ...profile,
      avatar: this.getPublicImagePath(profile.avatar),
      banner: this.getPublicImagePath(profile.banner),
    } : null;
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

    const [items, total] = await prisma.$transaction([
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
      items: items.map((item) => ({ ...item, avatar: this.getPublicImagePath(item.avatar) })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    };
  }
}
