import { prisma } from '../lib/prisma';
import {
  proofSchema,
  RoleHierarchy,
  UserRole,
  sessionSchema,
  materialSchema,
} from '@enxamistas/shared';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { MedalService } from './medal.service';

const notificationService = new NotificationService();
const medalService = new MedalService();

export class AcademicService {
  async enroll(profileId: string, courseId: string, type: 'MAIN' | 'SECONDARY') {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new AppError('Curso não encontrado', 404, 'COURSE_NOT_FOUND');
    }

    const existing = await prisma.courseEnrollment.findUnique({
      where: { courseId_profileId: { courseId, profileId } },
    });
    if (existing) {
      throw new AppError('Você já está matriculado neste curso', 409, 'ALREADY_ENROLLED');
    }

    if (type === 'MAIN') {
      const existingMain = await prisma.courseEnrollment.findFirst({
        where: { profileId, type: 'MAIN' },
      });
      if (existingMain) {
        throw new AppError(
          'Curso principal protegido: já existe um curso principal vinculado.',
          403,
          'MAIN_COURSE_LOCKED'
        );
      }

      await prisma.profile.update({
        where: { id: profileId },
        data: { mainCourseId: courseId },
      });
    }

    return prisma.courseEnrollment.create({
      data: { profileId, courseId, type },
      include: {
        course: { include: { teacher: true, schedules: true } },
      },
    });
  }

  async dropSecondaryEnrollment(profileId: string, courseId: string) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { courseId_profileId: { courseId, profileId } },
    });

    if (!enrollment) {
      throw new AppError('Matrícula não encontrada', 404, 'ENROLLMENT_NOT_FOUND');
    }
    if (enrollment.type === 'MAIN') {
      throw new AppError(
        'O curso principal não pode ser removido sem autorização da liderança.',
        403,
        'MAIN_COURSE_PROTECTED'
      );
    }

    await prisma.courseEnrollment.delete({
      where: { id: enrollment.id },
    });
  }

  async getEnrollments(profileId: string) {
    return prisma.courseEnrollment.findMany({
      where: { profileId },
      include: {
        course: {
          include: {
            teacher: true,
            schedules: true,
            medal: true,
            _count: { select: { sessions: true } },
          },
        },
      },
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createSession(courseId: string, rawData: any, actorUserId: string) {
    const data = sessionSchema.parse(rawData);
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError('Curso não encontrado', 404, 'COURSE_NOT_FOUND');

    const session = await prisma.classSession.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        startTime: data.startTime,
        status: data.status,
        teacherNote: data.teacherNote,
      },
    });

    await AuditService.log(actorUserId, 'ACADEMIC_CREATE_SESSION', 'ClassSession', {
      courseId,
      sessionId: session.id,
    });

    return session;
  }

  async getSessions(courseId: string, requesterProfileId: string, requesterRole: string) {
    const canViewAllProofs =
      (RoleHierarchy[requesterRole as UserRole] ?? 0) >= RoleHierarchy[UserRole.ABELHA_PRINCESA];

    return prisma.classSession.findMany({
      where: { courseId },
      include: {
        proofs: {
          where: canViewAllProofs ? undefined : { profileId: requesterProfileId },
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
      orderBy: { date: 'desc' },
    });
  }

  async submitProof(profileId: string, rawData: any) {
    const validated = proofSchema.parse(rawData);

    const session = await prisma.classSession.findUnique({
      where: { id: validated.sessionId },
      include: { course: true },
    });
    if (!session) throw new AppError('Aula não encontrada', 404, 'SESSION_NOT_FOUND');

    const proof = await prisma.lessonProof.upsert({
      where: {
        sessionId_profileId: {
          sessionId: validated.sessionId,
          profileId,
        },
      },
      update: {
        imageUrl: validated.imageUrl,
        observation: validated.observation,
        status: 'PENDING',
        feedback: null,
      },
      create: {
        sessionId: validated.sessionId,
        profileId,
        imageUrl: validated.imageUrl,
        observation: validated.observation,
      },
    });

    await notificationService.notifyRoles(
      [UserRole.STAFF_ZANGAO, UserRole.ABELHA_RAINHA, UserRole.ABELHA_PRINCESA],
      {
        title: 'Novo comprovante de aula enviado',
        content: `Comprovante pendente para "${session.title}" (${session.course.name}).`,
        link: `/cursos/${session.courseId}`,
        type: 'ACADEMIC',
      }
    );

    return proof;
  }

  async validateProof(
    proofId: string,
    status: 'VALIDATED' | 'REJECTED',
    feedback: string | undefined,
    reviewerProfileId: string,
    reviewerUserId: string
  ) {
    if (status === 'REJECTED' && (!feedback || feedback.trim().length < 3)) {
      throw new AppError('Informe o motivo ao recusar o comprovante.', 400, 'FEEDBACK_REQUIRED');
    }

    const existing = await prisma.lessonProof.findUnique({
      where: { id: proofId },
      include: { session: { include: { course: true } } },
    });
    if (!existing) throw new AppError('Comprovante não encontrado', 404, 'PROOF_NOT_FOUND');

    const updated = await prisma.lessonProof.update({
      where: { id: proofId },
      data: {
        status,
        feedback: feedback?.trim() || null,
        reviewedById: reviewerProfileId,
        reviewedAt: new Date(),
      },
    });

    await AuditService.log(reviewerUserId, 'ACADEMIC_VALIDATE_PROOF', 'LessonProof', {
      proofId,
      status,
      feedback,
    });

    await notificationService.createNotification(existing.profileId, {
      title: status === 'VALIDATED' ? 'Presença validada!' : 'Comprovante recusado',
      content:
        status === 'VALIDATED'
          ? `Sua presença na aula "${existing.session.title}" (${existing.session.course.name}) foi validada.`
          : `Seu comprovante em "${existing.session.title}" foi recusado. Motivo: ${feedback}`,
      link: `/cursos/${existing.session.courseId}`,
      type: 'ACADEMIC',
    });

    if (status === 'VALIDATED') {
      await medalService.grantAutoAchievementByName(
        existing.profileId,
        'Primeira Presença Validada'
      );
    }

    return updated;
  }

  async addMaterial(courseId: string, rawData: any, actorUserId: string) {
    const data = materialSchema.parse(rawData);
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new AppError('Curso não encontrado', 404, 'COURSE_NOT_FOUND');

    const material = await prisma.studyMaterial.create({
      data: {
        courseId,
        title: data.title,
        url: data.url,
        type: data.type,
      },
    });

    await AuditService.log(actorUserId, 'ACADEMIC_ADD_MATERIAL', 'StudyMaterial', {
      courseId,
      materialId: material.id,
    });

    return material;
  }

  async deleteMaterial(materialId: string, actorUserId: string) {
    await prisma.studyMaterial.delete({ where: { id: materialId } });
    await AuditService.log(actorUserId, 'ACADEMIC_DELETE_MATERIAL', 'StudyMaterial', {
      materialId,
    });
  }

  async completeCourse(
    courseId: string,
    targetProfileId: string,
    status: 'APPROVED' | 'REJECTED',
    notes: string | undefined,
    emitMedal: boolean,
    validatorProfileId: string,
    validatorUserId: string
  ) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { medal: true },
    });
    if (!course) throw new AppError('Curso não encontrado', 404, 'COURSE_NOT_FOUND');

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { courseId_profileId: { courseId, profileId: targetProfileId } },
    });
    if (!enrollment) {
      throw new AppError('O membro não possui matrícula neste curso.', 400, 'NOT_ENROLLED');
    }

    if (status === 'APPROVED') {
      const validatedProofs = await prisma.lessonProof.count({
        where: {
          profileId: targetProfileId,
          status: 'VALIDATED',
          session: { courseId },
        },
      });
      if (validatedProofs < (course.requiredAttendance || 1)) {
        throw new AppError(
          `Conclusão exige ao menos ${course.requiredAttendance || 1} presença(s) validada(s). O aluno possui ${validatedProofs}.`,
          400,
          'INSUFFICIENT_ATTENDANCE'
        );
      }
    }

    const completion = await prisma.courseCompletion.upsert({
      where: { courseId_profileId: { courseId, profileId: targetProfileId } },
      update: {
        status,
        notes,
        validatedById: validatorProfileId,
        completedAt: new Date(),
      },
      create: {
        courseId,
        profileId: targetProfileId,
        status,
        notes,
        validatedById: validatorProfileId,
      },
    });

    if (status === 'APPROVED') {
      await prisma.courseEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'COMPLETED' },
      });

      if (emitMedal && course.medal) {
        await prisma.userMedal.upsert({
          where: {
            medalId_profileId: { medalId: course.medal.id, profileId: targetProfileId },
          },
          update: {},
          create: {
            medalId: course.medal.id,
            profileId: targetProfileId,
            emittedById: validatorProfileId,
            reason: notes || `Conclusão oficial do curso ${course.name}`,
          },
        });
      }

      await medalService.grantAutoAchievementByName(
        targetProfileId,
        'Primeira Formação Concluída'
      );

      await notificationService.createNotification(targetProfileId, {
        title: `Conclusão oficial: ${course.name}`,
        content: `Sua conclusão em ${course.name} foi validada e sua medalha foi registrada.`,
        link: `/medalhas`,
        type: 'ACADEMIC',
      });
    }

    await AuditService.log(validatorUserId, 'ACADEMIC_COMPLETE_COURSE', 'CourseCompletion', {
      courseId,
      targetProfileId,
      status,
    });

    return completion;
  }

  async getCourseCompletions(courseId: string) {
    return prisma.courseCompletion.findMany({
      where: { courseId },
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
      orderBy: { completedAt: 'desc' },
    });
  }
}
