import { prisma } from '../lib/prisma';
import { EventInput, CommitmentInput } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { MedalService } from './medal.service';

const notificationService = new NotificationService();
const medalService = new MedalService();

export class EventService {
  async createEvent(creatorProfileId: string, creatorUserId: string, data: EventInput) {
    const eventDate = new Date(data.date);
    if (Number.isNaN(eventDate.getTime())) {
      throw new AppError('Data/hora do evento inválida.', 400, 'INVALID_DATE');
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        date: eventDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
        category: data.category,
        coverImage: data.coverImage || null,
        attractions: data.attractions,
        extraInfo: data.extraInfo,
        visibility: data.visibility,
        limit: data.limit,
        creatorId: creatorProfileId,
      },
    });

    await AuditService.log(creatorUserId, 'EVENT_CREATE', 'Event', {
      eventId: event.id,
      title: event.title,
      visibility: event.visibility,
    });

    return event;
  }

  async getEvents(filters: any, isAuthenticated: boolean) {
    const { visibility, status, category } = filters;

    const where: any = {
      status: status || undefined,
      category: category || undefined,
    };

    // Unauthenticated users can ONLY view PUBLIC events
    if (!isAuthenticated) {
      where.visibility = 'PUBLIC';
    } else if (visibility) {
      where.visibility = visibility;
    }

    return prisma.event.findMany({
      where,
      include: {
        attendees: {
          where: { status: 'CONFIRMED' },
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
      orderBy: { date: 'asc' },
    });
  }

  async getEventById(id: string, isAuthenticated: boolean) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        attendees: {
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

    if (!event) return null;
    if (!isAuthenticated && event.visibility !== 'PUBLIC') {
      throw new AppError('Evento privado requer autenticação.', 401, 'UNAUTHORIZED');
    }
    return event;
  }

  async updateEvent(id: string, data: any, actorUserId: string) {
    const existing = await prisma.event.findUnique({
      where: { id },
      include: { attendees: { where: { status: 'CONFIRMED' } } },
    });
    if (!existing) throw new AppError('Evento não encontrado', 404, 'EVENT_NOT_FOUND');

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...data,
        coverImage: data.coverImage === '' ? null : data.coverImage,
        date: data.date ? new Date(data.date) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });

    const isCancelled = data.status === 'CANCELLED';
    await Promise.all(
      existing.attendees.map((att) =>
        notificationService.createNotification(att.profileId, {
          title: isCancelled ? `Evento cancelado: ${updated.title}` : `Evento atualizado: ${updated.title}`,
          content: isCancelled
            ? `O evento "${updated.title}" foi cancelado pela liderança.`
            : `O evento "${updated.title}" teve informações atualizadas.`,
          link: '/eventos',
          type: 'EVENT',
        })
      )
    );

    await AuditService.log(actorUserId, isCancelled ? 'EVENT_CANCEL' : 'EVENT_UPDATE', 'Event', {
      eventId: id,
    });

    return updated;
  }

  async rsvp(eventId: string, profileId: string, status: 'CONFIRMED' | 'CANCELLED') {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
      });

      if (!event) throw new AppError('Evento não encontrado', 404, 'EVENT_NOT_FOUND');
      if (event.status === 'CANCELLED') {
        throw new AppError('Não é possível confirmar presença em um evento cancelado.', 400, 'EVENT_CANCELLED');
      }

      const existingRsvp = await tx.eventAttendee.findUnique({
        where: { eventId_profileId: { eventId, profileId } },
      });

      if (status === 'CONFIRMED') {
        if (existingRsvp?.status === 'CONFIRMED') {
          throw new AppError('Sua presença já está confirmada neste evento.', 409, 'DUPLICATE_RSVP');
        }
        if (event.limit) {
          const confirmedCount = await tx.eventAttendee.count({
            where: { eventId, status: 'CONFIRMED' },
          });
          if (confirmedCount >= event.limit) {
            throw new AppError('Limite de participantes atingido.', 400, 'EVENT_FULL');
          }
        }
      }

      return tx.eventAttendee.upsert({
        where: { eventId_profileId: { eventId, profileId } },
        update: { status },
        create: { eventId, profileId, status },
      });
    });

    if (status === 'CONFIRMED') {
      await medalService.grantAutoAchievementByName(profileId, 'Presença em Evento');
    }

    return result;
  }

  // --- INSTITUTIONAL CALENDAR ---
  async getCommitments(isAuthenticated: boolean) {
    return prisma.institutionalCommitment.findMany({
      where: isAuthenticated ? undefined : { visibility: 'PUBLIC' },
      orderBy: { startAt: 'asc' },
    });
  }

  async createCommitment(creatorProfileId: string, creatorUserId: string, data: CommitmentInput) {
    const startAt = new Date(data.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new AppError('Data inicial inválida.', 400, 'INVALID_DATE');
    }

    const commitment = await prisma.institutionalCommitment.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        startAt,
        endAt: data.endAt ? new Date(data.endAt) : null,
        location: data.location,
        visibility: data.visibility,
        creatorId: creatorProfileId,
      },
    });

    await AuditService.log(creatorUserId, 'CALENDAR_CREATE_COMMITMENT', 'InstitutionalCommitment', {
      id: commitment.id,
    });

    return commitment;
  }

  async deleteCommitment(id: string, actorUserId: string) {
    await prisma.institutionalCommitment.delete({ where: { id } });
    await AuditService.log(actorUserId, 'CALENDAR_DELETE_COMMITMENT', 'InstitutionalCommitment', { id });
  }
}
