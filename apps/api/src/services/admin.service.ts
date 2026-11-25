import { prisma } from '../lib/prisma';
import { RoleHierarchy, UserRole, roleChangeSchema, suspendUserSchema } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

export class AdminService {
  async getDashboardMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      newMembers30d,
      suspendedMembers,
      roleDistribution,
      courses,
      totalEnrollments,
      totalCompletions,
      totalMedals,
      totalEvents,
      totalSessions,
      pendingProofs,
      pendingReports,
      pendingKeyRequests,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
      prisma.course.findMany({
        select: { id: true, name: true, _count: { select: { profiles: true, enrollments: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.courseEnrollment.count(),
      prisma.courseCompletion.count({ where: { status: 'APPROVED' } }),
      prisma.userMedal.count(),
      prisma.event.count(),
      prisma.classSession.count(),
      prisma.lessonProof.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: { in: ['PENDING', 'ANALYZING'] } } }),
      prisma.mansionKeyRequest.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { passport: true, role: true, profile: { select: { name: true } } },
          },
        },
      }),
    ]);

    return {
      totals: {
        members: totalMembers,
        newMembers30d,
        suspendedMembers,
        courses: courses.length,
        enrollments: totalEnrollments,
        completions: totalCompletions,
        medals: totalMedals,
        events: totalEvents,
        sessions: totalSessions,
        pendingProofs,
        pendingReports,
        pendingKeyRequests,
      },
      roleDistribution: roleDistribution.map((r) => ({ role: r.role, count: r._count.role })),
      courseDistribution: courses.map((c) => ({
        id: c.id,
        name: c.name,
        mainCount: c._count.profiles,
        enrollmentsCount: c._count.enrollments,
      })),
      recentAuditLogs,
    };
  }

  async listMembers(q?: string) {
    return prisma.user.findMany({
      where: q
        ? {
            OR: [
              { passport: { contains: q, mode: 'insensitive' } },
              { profile: { name: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      select: {
        id: true,
        passport: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedReason: true,
        createdAt: true,
        profile: {
          include: {
            mainCourse: { select: { id: true, name: true } },
            _count: { select: { medals: true, courseCompletions: true, achievements: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async changeUserRole(
    targetUserId: string,
    rawBody: any,
    actorUserId: string,
    actorRole: UserRole
  ) {
    if (targetUserId === actorUserId) {
      throw new AppError('Você não pode alterar o próprio cargo.', 403, 'SELF_ROLE_FORBIDDEN');
    }

    const { role: newRole, reason } = roleChangeSchema.parse(rawBody);
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!targetUser) throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');

    const actorLevel = RoleHierarchy[actorRole] ?? 0;
    const targetCurrentLevel = RoleHierarchy[targetUser.role as UserRole] ?? 0;
    const newRoleLevel = RoleHierarchy[newRole] ?? 0;

    if (actorRole !== UserRole.STAFF_ZANGAO) {
      if (targetCurrentLevel >= actorLevel || newRoleLevel >= actorLevel) {
        throw new AppError(
          'Você não tem hierarquia para alterar este cargo ou conceder cargo igual/superior ao seu.',
          403,
          'HIERARCHY_FORBIDDEN'
        );
      }
    }

    const previousRole = targetUser.role;
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, passport: true, role: true },
    });

    const roleEntity = await prisma.role.findUnique({ where: { code: newRole } });
    if (roleEntity) {
      await prisma.userRoleAssignment.upsert({
        where: { userId_roleId: { userId: targetUserId, roleId: roleEntity.id } },
        update: { assignedById: actorUserId, assignedAt: new Date() },
        create: { userId: targetUserId, roleId: roleEntity.id, assignedById: actorUserId },
      });
    }

    await AuditService.log(actorUserId, 'ADMIN_ROLE_CHANGE', 'User', {
      targetUserId,
      previousRole,
      newRole,
      reason,
    });

    if (targetUser.profile) {
      await notificationService.createNotification(targetUser.profile.id, {
        title: 'Atualização de cargo na Colmeia',
        content: `Seu cargo foi atualizado de ${previousRole} para ${newRole}.`,
        link: '/perfil',
        type: 'ADMIN',
      });
    }

    return updated;
  }

  async suspendUser(targetUserId: string, rawBody: any, actorUserId: string, actorRole: UserRole) {
    if (targetUserId === actorUserId) {
      throw new AppError('Você não pode suspender a si mesmo.', 403, 'SELF_SUSPEND_FORBIDDEN');
    }

    const { isSuspended, reason } = suspendUserSchema.parse(rawBody);
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');

    if (
      actorRole !== UserRole.STAFF_ZANGAO &&
      (RoleHierarchy[targetUser.role as UserRole] ?? 0) >= (RoleHierarchy[actorRole] ?? 0)
    ) {
      throw new AppError('Sem hierarquia para suspender este membro.', 403, 'HIERARCHY_FORBIDDEN');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        isSuspended,
        suspendedAt: isSuspended ? new Date() : null,
        suspendedReason: isSuspended ? reason || 'Suspenso pela administração' : null,
      },
      select: { id: true, passport: true, isSuspended: true, suspendedReason: true },
    });

    await AuditService.log(
      actorUserId,
      isSuspended ? 'ADMIN_SUSPEND_USER' : 'ADMIN_REACTIVATE_USER',
      'User',
      { targetUserId, reason }
    );

    return updated;
  }

  async changeMemberMainCourse(targetProfileId: string, courseId: string, actorUserId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError('Curso não encontrado', 404, 'COURSE_NOT_FOUND');

    const updated = await prisma.$transaction(async (tx) => {
      await tx.courseEnrollment.updateMany({
        where: { profileId: targetProfileId, type: 'MAIN' },
        data: { type: 'SECONDARY' },
      });

      await tx.courseEnrollment.upsert({
        where: { courseId_profileId: { courseId, profileId: targetProfileId } },
        update: { type: 'MAIN' },
        create: { courseId, profileId: targetProfileId, type: 'MAIN' },
      });

      return tx.profile.update({
        where: { id: targetProfileId },
        data: { mainCourseId: courseId },
      });
    });

    await AuditService.log(actorUserId, 'ADMIN_CHANGE_MAIN_COURSE', 'Profile', {
      targetProfileId,
      courseId,
    });

    return updated;
  }

  // --- EXTENSIBLE RBAC ---
  async getRolesAndPermissions() {
    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        include: {
          rolePermissions: { include: { permission: true } },
          _count: { select: { userRoles: true } },
        },
        orderBy: { level: 'desc' },
      }),
      prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] }),
    ]);

    return { roles, permissions };
  }

  async createRole(data: { code: string; name: string; description?: string; level: number }, actorUserId: string) {
    const role = await prisma.role.create({
      data: {
        code: data.code.toUpperCase().replace(/\s+/g, '_'),
        name: data.name,
        description: data.description,
        level: data.level,
        isSystem: false,
      },
    });
    await AuditService.log(actorUserId, 'ADMIN_CREATE_ROLE', 'Role', { roleId: role.id, code: role.code });
    return role;
  }

  async setRolePermissions(roleId: string, permissionIds: string[], actorUserId: string) {
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      ...(permissionIds.length
        ? [
            prisma.rolePermission.createMany({
              data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
    await AuditService.log(actorUserId, 'ADMIN_UPDATE_ROLE_PERMISSIONS', 'Role', {
      roleId,
      permissionIds,
    });
  }

  // --- PENDING PROOFS OVERVIEW ---
  async getPendingProofs() {
    return prisma.lessonProof.findMany({
      where: { status: 'PENDING' },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            avatar: true,
            user: { select: { passport: true } },
          },
        },
        session: {
          include: { course: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // --- REPORTS / MODERATION ---
  async listReports(status?: string) {
    return prisma.report.findMany({
      where: status ? { status } : undefined,
      include: {
        reporter: { select: { id: true, name: true, user: { select: { passport: true } } } },
        post: { select: { id: true, content: true, authorId: true } },
        comment: { select: { id: true, content: true, authorId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReport(
    reportId: string,
    status: 'PENDING' | 'ANALYZING' | 'RESOLVED' | 'REJECTED',
    resolutionNote: string | undefined,
    analystProfileId: string,
    actorUserId: string
  ) {
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status, resolutionNote, analystId: analystProfileId },
    });
    await AuditService.log(actorUserId, 'ADMIN_MODERATE_REPORT', 'Report', {
      reportId,
      status,
      resolutionNote,
    });
    return updated;
  }

  // --- MANSION KEY REQUESTS ---
  async listKeyRequests() {
    return prisma.mansionKeyRequest.findMany({
      include: {
        album: { select: { id: true, name: true, slug: true } },
        profile: {
          select: {
            id: true,
            name: true,
            user: { select: { passport: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- SETTINGS & AUDIT LOGS ---
  async getSettings() {
    return prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertSettings(entries: Record<string, string>, actorUserId: string) {
    await Promise.all(
      Object.entries(entries).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );
    await AuditService.log(actorUserId, 'ADMIN_UPDATE_SETTINGS', 'Setting', {
      keys: Object.keys(entries),
    });
    return this.getSettings();
  }

  async getAuditLogs(page = 1, limit = 30) {
    const skip = (Math.max(1, page) - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: { passport: true, role: true, profile: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);
    return { items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}
