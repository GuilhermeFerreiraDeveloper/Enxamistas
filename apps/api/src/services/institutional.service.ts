import { prisma } from '../lib/prisma';
import {
  announcementSchema,
  guestbookSchema,
  mansionKeyRequestSchema,
  monthlyHighlightSchema,
  projectSchema,
  RoleHierarchy,
  UserRole,
} from '@enxamistas/shared';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { MedalService } from './medal.service';
import fs from 'node:fs';
import path from 'node:path';

const notificationService = new NotificationService();
const medalService = new MedalService();

function getRadioMusicRoot() {
  if (process.env.RADIO_MUSIC_DIR?.trim()) {
    return path.resolve(process.env.RADIO_MUSIC_DIR.trim());
  }

  const cwdRoot = path.resolve(process.cwd(), 'musicas');
  if (fs.existsSync(cwdRoot)) return cwdRoot;

  const monorepoRoot = path.resolve(process.cwd(), '..', '..', 'musicas');
  return fs.existsSync(monorepoRoot) ? monorepoRoot : cwdRoot;
}

export class InstitutionalService {
  // --- PUBLIC PORTAL / SETTINGS ---
  async getPublicPortalData() {
    const [settingsRows, courses, publicEvents, mansions, featuredProjects] =
      await prisma.$transaction([
        prisma.setting.findMany(),
        prisma.course.findMany({
          take: 6,
          include: { teacher: true, schedules: true },
          orderBy: { name: 'asc' },
        }),
        prisma.event.findMany({
          where: { visibility: 'PUBLIC', status: 'SCHEDULED' },
          orderBy: { date: 'asc' },
          take: 4,
        }),
        prisma.album.findMany({
          where: { isMansion: true },
          include: { _count: { select: { media: true } } },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.project.findMany({
          where: { status: 'ACTIVE' },
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: 4,
        }),
      ]);

    const settings: Record<string, string> = {};
    for (const s of settingsRows) settings[s.key] = s.value;

    return {
      settings,
      courses,
      publicEvents,
      mansions,
      featuredProjects,
    };
  }

  // --- MANSIONS / GALLERY ---
  async getMansions() {
    return prisma.album.findMany({
      where: { isMansion: true },
      include: {
        media: { orderBy: { order: 'asc' } },
        _count: { select: { media: true, keyRequests: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllAlbums() {
    return prisma.album.findMany({
      include: {
        media: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAlbumByIdOrSlug(idOrSlug: string) {
    return prisma.album.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        media: { orderBy: [{ environmentCategory: 'asc' }, { order: 'asc' }] },
      },
    });
  }

  async updateMansion(id: string, data: any, actorUserId: string) {
    const updated = await prisma.album.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        coverImage: data.coverImage,
        tourVideoUrl: data.tourVideoUrl,
        location: data.location,
        typeLabel: data.typeLabel,
        features: Array.isArray(data.features) ? data.features : undefined,
      },
    });
    await AuditService.log(actorUserId, 'GALLERY_UPDATE_ALBUM', 'Album', { id });
    return updated;
  }

  async addAlbumMedia(albumId: string, data: any, actorUserId: string) {
    const media = await prisma.albumMedia.create({
      data: {
        albumId,
        url: data.url,
        type: data.type || 'IMAGE',
        title: data.title,
        description: data.description,
        environmentCategory: data.environmentCategory || 'Geral',
        order: data.order || 0,
      },
    });
    await AuditService.log(actorUserId, 'GALLERY_ADD_MEDIA', 'AlbumMedia', { albumId, mediaId: media.id });
    return media;
  }

  async deleteAlbumMedia(mediaId: string, actorUserId: string) {
    await prisma.albumMedia.delete({ where: { id: mediaId } });
    await AuditService.log(actorUserId, 'GALLERY_DELETE_MEDIA', 'AlbumMedia', { mediaId });
  }

  async requestMansionKey(albumId: string, profileId: string, rawData: any) {
    const { reason } = mansionKeyRequestSchema.parse(rawData);
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) throw new AppError('Mansão não encontrada', 404, 'ALBUM_NOT_FOUND');

    const pending = await prisma.mansionKeyRequest.findFirst({
      where: { albumId, profileId, status: 'PENDING' },
    });
    if (pending) {
      throw new AppError('Você já possui uma solicitação pendente para esta mansão.', 409, 'DUPLICATE_REQUEST');
    }

    const request = await prisma.mansionKeyRequest.create({
      data: { albumId, profileId, reason },
      include: { album: true },
    });

    await notificationService.notifyRoles(
      [UserRole.STAFF_ZANGAO, UserRole.ABELHA_RAINHA, UserRole.ABELHA_PRINCESA],
      {
        title: `Solicitação de chave: ${album.name}`,
        content: `Novo pedido de acesso à ${album.name}. Motivo: ${reason}`,
        link: '/admin?tab=mansions',
        type: 'ADMIN',
      }
    );

    return request;
  }

  async getMyKeyRequests(profileId: string) {
    return prisma.mansionKeyRequest.findMany({
      where: { profileId },
      include: { album: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewKeyRequest(
    requestId: string,
    status: 'APPROVED' | 'REJECTED',
    responseNote: string | undefined,
    reviewerProfileId: string,
    reviewerUserId: string
  ) {
    const req = await prisma.mansionKeyRequest.update({
      where: { id: requestId },
      data: {
        status,
        responseNote,
        reviewedById: reviewerProfileId,
      },
      include: { album: true },
    });

    await notificationService.createNotification(req.profileId, {
      title: `Chave de ${req.album.name}: ${status === 'APPROVED' ? 'Aprovada' : 'Recusada'}`,
      content: responseNote || `Sua solicitação para ${req.album.name} foi ${status === 'APPROVED' ? 'aprovada' : 'recusada'}.`,
      link: `/mansoes/${req.album.slug || req.albumId}`,
      type: 'ADMIN',
    });

    await AuditService.log(reviewerUserId, 'MANSION_KEY_REVIEW', 'MansionKeyRequest', {
      requestId,
      status,
    });

    return req;
  }

  // --- ANNOUNCEMENTS ---
  async getAnnouncements(category?: string) {
    const now = new Date();
    return prisma.announcement.findMany({
      where: {
        category: category || undefined,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            user: { select: { role: true } },
          },
        },
        course: { select: { id: true, name: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAnnouncement(authorId: string, actorUserId: string, rawData: any) {
    const data = announcementSchema.parse(rawData);
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority,
        isPinned: data.isPinned,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        courseId: data.courseId || null,
        authorId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    await AuditService.log(actorUserId, 'ANNOUNCEMENT_CREATE', 'Announcement', {
      id: announcement.id,
      title: announcement.title,
    });

    const allActive = await prisma.profile.findMany({
      where: { user: { isSuspended: false } },
      select: { id: true },
    });
    await Promise.all(
      allActive.map((p) =>
        notificationService.createNotification(p.id, {
          title: `Aviso: ${announcement.title}`,
          content: announcement.content.slice(0, 100),
          link: '/avisos',
          type: 'ADMIN',
        })
      )
    );

    return announcement;
  }

  async updateAnnouncement(id: string, actorUserId: string, rawData: any) {
    const data = announcementSchema.partial().parse(rawData);
    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt === null ? null : data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    });
    await AuditService.log(actorUserId, 'ANNOUNCEMENT_UPDATE', 'Announcement', { id });
    return updated;
  }

  async deleteAnnouncement(id: string, actorUserId: string) {
    await prisma.announcement.delete({ where: { id } });
    await AuditService.log(actorUserId, 'ANNOUNCEMENT_DELETE', 'Announcement', { id });
  }

  // --- PROJECTS ---
  async getProjects(filters: any) {
    const { q, category } = filters;
    return prisma.project.findMany({
      where: {
        category: category || undefined,
        ...(q
          ? {
              OR: [
                { title: { contains: String(q), mode: 'insensitive' } },
                { description: { contains: String(q), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            user: { select: { passport: true, role: true } },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getProjectById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
            user: { select: { passport: true, role: true } },
          },
        },
      },
    });
  }

  async createProject(authorId: string, rawData: any) {
    const data = projectSchema.parse(rawData);
    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || null,
        category: data.category,
        link: data.link || null,
        status: data.status,
        authorId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    await medalService.grantAutoAchievementByName(authorId, 'Contribuidor de Projetos');
    return project;
  }

  async deleteProject(id: string, actorProfileId: string, actorRole: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new AppError('Projeto não encontrado', 404, 'PROJECT_NOT_FOUND');

    const isLeadership =
      (RoleHierarchy[actorRole as UserRole] ?? 0) >= RoleHierarchy[UserRole.ABELHA_PRINCESA];
    if (project.authorId !== actorProfileId && !isLeadership) {
      throw new AppError('Sem permissão para excluir este projeto.', 403, 'FORBIDDEN');
    }

    await prisma.project.delete({ where: { id } });
  }

  // --- GUESTBOOK ---
  async getGuestbook(isAuthenticated: boolean, includeHidden = false) {
    const setting = await prisma.setting.findUnique({ where: { key: 'guestbook_public' } });
    const isPublic = setting?.value !== 'false';
    if (!isPublic && !isAuthenticated) {
      throw new AppError('O livro de visitas está restrito a membros.', 401, 'UNAUTHORIZED');
    }

    return prisma.guestbookEntry.findMany({
      where: includeHidden ? undefined : { isHidden: false, isApproved: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createGuestbookEntry(rawData: any, user?: any) {
    const data = guestbookSchema.parse(rawData);
    const setting = await prisma.setting.findUnique({ where: { key: 'guestbook_public' } });
    const isPublic = setting?.value !== 'false';
    if (!isPublic && !user) {
      throw new AppError('Faça login para assinar o livro de visitas.', 401, 'UNAUTHORIZED');
    }

    const authorName = user?.profile?.name || data.authorName || 'Visitante';
    return prisma.guestbookEntry.create({
      data: {
        content: data.content,
        authorName,
        authorId: user?.profile?.id || null,
      },
    });
  }

  async moderateGuestbookEntry(id: string, isHidden: boolean, actorUserId: string) {
    const entry = await prisma.guestbookEntry.update({
      where: { id },
      data: { isHidden },
    });
    await AuditService.log(actorUserId, 'GUESTBOOK_MODERATE', 'GuestbookEntry', { id, isHidden });
    return entry;
  }

  async deleteGuestbookEntry(id: string, actorUserId: string) {
    await prisma.guestbookEntry.delete({ where: { id } });
    await AuditService.log(actorUserId, 'GUESTBOOK_DELETE', 'GuestbookEntry', { id });
  }

  // --- MONTHLY HIGHLIGHTS (ENXAMISTA DO MÊS) ---
  async getMonthlyHighlights() {
    return prisma.monthlyHighlight.findMany({
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            avatar: true,
            user: { select: { passport: true, role: true } },
            mainCourse: { select: { name: true } },
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createMonthlyHighlight(rawData: any, actorProfileId: string, actorUserId: string) {
    const data = monthlyHighlightSchema.parse(rawData);

    const existing = await prisma.monthlyHighlight.findUnique({
      where: {
        profileId_month_year: {
          profileId: data.profileId,
          month: data.month,
          year: data.year,
        },
      },
    });
    if (existing) {
      throw new AppError('Este membro já foi destacado neste mês/ano.', 409, 'DUPLICATE_HIGHLIGHT');
    }

    const highlight = await prisma.monthlyHighlight.create({
      data: {
        profileId: data.profileId,
        month: data.month,
        year: data.year,
        description: data.description,
        reason: data.reason,
        contributions: data.contributions,
        imageUrl: data.imageUrl || null,
        createdById: actorProfileId,
      },
      include: {
        profile: { select: { id: true, name: true, avatar: true } },
      },
    });

    await notificationService.createNotification(data.profileId, {
      title: 'Você foi eleito Enxamista do Mês!',
      content: `Reconhecimento em ${data.month}/${data.year}: ${data.reason}`,
      link: '/reconhecimento',
      type: 'ADMIN',
    });

    await AuditService.log(actorUserId, 'HIGHLIGHT_CREATE', 'MonthlyHighlight', {
      highlightId: highlight.id,
      profileId: data.profileId,
      month: data.month,
      year: data.year,
    });

    return highlight;
  }

  // --- RADIO: SISTEMA DE PEDIDOS DE MÚSICAS ---

  async getRadioData() {
    const approvedTracks = await prisma.radioTrack.findMany({
      where: { status: 'ADICIONADA_PLAYLIST' },
      include: {
        author: { select: { id: true, name: true, avatar: true, user: { select: { passport: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const approvedByFile = new Map(
      approvedTracks
        .filter((track) => track.filePath)
        .map((track) => [track.filePath!.replace(/\\/g, '/'), track])
    );
    const musicRoot = getRadioMusicRoot();
    const libraryFiles: string[] = [];

    const scanDirectory = (directory: string, relativeDirectory = '') => {
      if (!fs.existsSync(directory)) return;
      for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          scanDirectory(absolutePath, relativePath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp3')) {
          libraryFiles.push(relativePath);
        }
      }
    };

    scanDirectory(musicRoot);

    const tracks = libraryFiles.map((relativePath) => {
      const registeredTrack = approvedByFile.get(relativePath);
      const filename = path.posix.basename(relativePath);
      return {
        id: relativePath,
        title: registeredTrack?.title || filename.replace(/\.mp3$/i, ''),
        artist: registeredTrack?.artist || 'Biblioteca da rádio',
        passport: relativePath.includes('/') ? relativePath.split('/')[0] : null,
        filePath: relativePath,
        url: `/radio/library/stream?file=${encodeURIComponent(relativePath)}`,
        status: 'ADICIONADA_PLAYLIST',
        author: registeredTrack?.author || null,
      };
    });

    return { tracks };
  }

  async createRadioRequest(
    rawData: { title: string; artist: string; referenceUrl?: string },
    actorProfileId: string,
    actorUserId: string
  ) {
    const { title, artist, referenceUrl } = rawData;

    if (!title || title.trim().length < 2) {
      throw new AppError('Título da música é obrigatório.', 400, 'INVALID_TITLE');
    }
    if (!artist || artist.trim().length < 2) {
      throw new AppError('Artista é obrigatório.', 400, 'INVALID_ARTIST');
    }

    if (referenceUrl?.trim()) {
      try {
        const url = new URL(referenceUrl.trim());
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch {
        throw new AppError('O link de referência deve ser uma URL válida começando com http:// ou https://.', 400, 'INVALID_REFERENCE_URL');
      }
    }

    const profile = await prisma.profile.findUnique({
      where: { id: actorProfileId },
      include: { user: { select: { passport: true } } },
    });

    if (!profile) {
      throw new AppError('Perfil não encontrado.', 404, 'PROFILE_NOT_FOUND');
    }

    const passport = profile.user.passport;
    fs.mkdirSync(path.resolve(getRadioMusicRoot(), passport), { recursive: true });

    let playlist = await prisma.radioPlaylist.findUnique({
      where: { profileId: actorProfileId },
    });

    if (!playlist) {
      playlist = await prisma.radioPlaylist.create({
        data: {
          name: `Playlist de ${passport}`,
          description: `Playlist individual do membro ${passport}`,
          profileId: actorProfileId,
        },
      });
    }

    const request = await prisma.radioTrack.create({
      data: {
        title: title.trim(),
        artist: artist.trim(),
        passport,
        referenceUrl: referenceUrl?.trim() || null,
        status: 'SOLICITADA',
        authorId: actorProfileId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, user: { select: { passport: true } } } },
      },
    });

    await AuditService.log(actorUserId, 'RADIO_REQUEST_CREATE', 'RadioTrack', {
      id: request.id,
      title: request.title,
      artist: request.artist,
      passport,
    });

    return request;
  }

  async getMyRadioRequests(profileId: string) {
    return prisma.radioTrack.findMany({
      where: { authorId: profileId, status: { not: 'ADICIONADA_PLAYLIST' } },
      include: {
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyRadioPlaylist(profileId: string) {
    const playlist = await prisma.radioPlaylist.findUnique({
      where: { profileId },
      include: {
        tracks: {
          include: {
            track: {
              select: {
                id: true,
                title: true,
                artist: true,
                filePath: true,
                passport: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return playlist;
  }

  async listAllRadioRequests() {
    return prisma.radioTrack.findMany({
      where: { status: { in: ['SOLICITADA', 'EM_ANALISE'] } },
      include: {
        author: { select: { id: true, name: true, avatar: true, user: { select: { passport: true } } } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async updateRadioRequestStatus(
    id: string,
    status: 'ADICIONADA_PLAYLIST' | 'RECUSADA',
    actorProfileId: string,
    actorUserId: string,
    rejectionReason?: string,
    selectedFilePath?: string
  ) {
    const existing = await prisma.radioTrack.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true, user: { select: { passport: true } } } } },
    });

    if (!existing) {
      throw new AppError('Pedido não encontrado.', 404, 'REQUEST_NOT_FOUND');
    }

    if (!['SOLICITADA', 'EM_ANALISE'].includes(existing.status)) {
      throw new AppError('Este pedido já foi decidido.', 409, 'REQUEST_ALREADY_REVIEWED');
    }

    let playlist: { id: string } | null = null;
    let nextPlaylistOrder = 1;
    if (status === 'ADICIONADA_PLAYLIST') {
      if (!selectedFilePath) {
        throw new AppError('Selecione um arquivo MP3 da biblioteca para aprovar o pedido.', 400, 'AUDIO_FILE_REQUIRED');
      }
      await this.getRadioLibraryFile(selectedFilePath);

      playlist = await prisma.radioPlaylist.findUnique({
        where: { profileId: existing.authorId },
      });
      if (!playlist) {
        playlist = await prisma.radioPlaylist.create({
          data: {
            name: `Playlist de ${existing.passport}`,
            description: `Playlist individual do membro ${existing.passport}`,
            profileId: existing.authorId,
          },
        });
      }

      const lastOrder = await prisma.radioPlaylistTrack.findFirst({
        where: { playlistId: playlist.id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      nextPlaylistOrder = (lastOrder?.order || 0) + 1;
    }

    const track = await prisma.radioTrack.update({
      where: { id },
      data: {
        status,
        filePath: status === 'ADICIONADA_PLAYLIST' ? selectedFilePath : null,
        reviewedById: actorProfileId,
        reviewedAt: new Date(),
        rejectionReason: status === 'RECUSADA' ? rejectionReason?.trim() || null : null,
      },
      include: {
        author: { select: { id: true, name: true, user: { select: { passport: true } } } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    await AuditService.log(actorUserId, `RADIO_REQUEST_${status}`, 'RadioTrack', {
      id: track.id,
      title: track.title,
      status,
      rejectionReason,
      filePath: status === 'ADICIONADA_PLAYLIST' ? selectedFilePath : undefined,
    });

    if (status === 'ADICIONADA_PLAYLIST' && playlist) {
      await prisma.radioPlaylistTrack.upsert({
        where: {
          playlistId_trackId: {
            playlistId: playlist.id,
            trackId: track.id,
          },
        },
        update: {},
        create: {
          playlistId: playlist.id,
          trackId: track.id,
          order: nextPlaylistOrder,
        },
      });
    }

    await prisma.notification.create({
      data: {
        profileId: track.authorId,
        title: status === 'ADICIONADA_PLAYLIST' ? 'Pedido de música aceito' : 'Pedido de música recusado',
        content: status === 'ADICIONADA_PLAYLIST'
          ? `A Staff aceitou o pedido de “${track.title}”${track.artist ? `, de ${track.artist}` : ''}.`
          : `A Staff recusou o pedido de “${track.title}”${track.artist ? `, de ${track.artist}` : ''}.${rejectionReason?.trim() ? ` Motivo: ${rejectionReason.trim()}` : ''}`,
        link: '/radio',
        type: 'ADMIN',
      },
    });

    return track;
  }

  async deleteRadioRequest(id: string, actorUserId: string) {
    const track = await prisma.radioTrack.findUnique({
      where: { id },
      select: { id: true, title: true, authorId: true, status: true },
    });

    if (!track) {
      throw new AppError('Pedido não encontrado.', 404, 'REQUEST_NOT_FOUND');
    }

    await prisma.radioTrack.delete({ where: { id } });

    await AuditService.log(actorUserId, 'RADIO_REQUEST_DELETE', 'RadioTrack', {
      id: track.id,
      title: track.title,
    });
  }

  async getRadioLibraryFile(relativePath: string) {
    if (!relativePath || relativePath.includes('\\') || path.posix.isAbsolute(relativePath)) {
      throw new AppError('Caminho da música inválido.', 400, 'INVALID_AUDIO_PATH');
    }

    const normalizedPath = path.posix.normalize(relativePath);
    if (normalizedPath !== relativePath || normalizedPath === '..' || normalizedPath.startsWith('../')) {
      throw new AppError('Caminho da música inválido.', 400, 'INVALID_AUDIO_PATH');
    }

    if (!normalizedPath.toLowerCase().endsWith('.mp3')) {
      throw new AppError('A biblioteca aceita apenas arquivos MP3.', 400, 'INVALID_AUDIO_TYPE');
    }

    const root = path.resolve(getRadioMusicRoot());
    const filePath = path.resolve(root, ...normalizedPath.split('/'));
    const relativeToRoot = path.relative(root, filePath);
    if (relativeToRoot === '..' || relativeToRoot.startsWith(`..${path.sep}`) || path.isAbsolute(relativeToRoot)) {
      throw new AppError('Caminho da música inválido.', 400, 'INVALID_AUDIO_PATH');
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      throw new AppError('Arquivo de áudio não encontrado.', 404, 'AUDIO_FILE_NOT_FOUND');
    }

    const realRoot = fs.realpathSync(root);
    const realFilePath = fs.realpathSync(filePath);
    const realRelativePath = path.relative(realRoot, realFilePath);
    if (realRelativePath === '..' || realRelativePath.startsWith(`..${path.sep}`) || path.isAbsolute(realRelativePath)) {
      throw new AppError('Caminho da música inválido.', 400, 'INVALID_AUDIO_PATH');
    }

    return realFilePath;
  }

  async getAuthorizedRadioFile(passport: string, filename: string) {
    if (!/^[-a-zA-Z0-9]+$/.test(passport)) {
      throw new AppError('Passaporte inválido.', 400, 'INVALID_PASSPORT');
    }

    if (path.basename(filename) !== filename || !filename.toLowerCase().endsWith('.mp3')) {
      throw new AppError('Nome de arquivo de áudio inválido.', 400, 'INVALID_AUDIO_FILENAME');
    }

    const track = await prisma.radioTrack.findFirst({
      where: {
        passport,
        filePath: filename,
        status: 'ADICIONADA_PLAYLIST',
      },
      select: { id: true },
    });

    if (!track) {
      throw new AppError('Faixa não autorizada para reprodução.', 404, 'AUDIO_NOT_AUTHORIZED');
    }

    const filePath = path.resolve(getRadioMusicRoot(), passport, filename);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      throw new AppError('Arquivo de áudio não encontrado.', 404, 'AUDIO_FILE_NOT_FOUND');
    }

    return filePath;
  }

  // Os arquivos MP3 são adicionados manualmente pela Staff em musicas/PASSAPORTE/.
}
