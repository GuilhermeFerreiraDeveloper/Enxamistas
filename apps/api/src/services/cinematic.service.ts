import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';
import { storageService } from './storage.service';
import { cinematicYoutubeSchema } from '@enxamistas/shared';

const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_DB_VIDEO_BYTES = 25 * 1024 * 1024; // 25MB when stored in Neon Postgres fallback
const MAX_S3_VIDEO_BYTES = 80 * 1024 * 1024; // 80MB when S3 is configured

export function extractYoutubeId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    let candidate: string | null = null;
    if (host === 'youtu.be') {
      candidate = parsed.pathname.split('/').filter(Boolean)[0] || null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') {
        candidate = parsed.searchParams.get('v');
      } else {
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live', 'v'].includes(segments[0])) {
          candidate = segments[1] || null;
        }
      }
    }

    if (candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
      return candidate;
    }
    return null;
  } catch {
    return null;
  }
}

function validateVideoMagicBytes(mimeType: string, buffer: Buffer) {
  if (!buffer || buffer.length < 12) {
    throw new AppError('Arquivo de vídeo inválido ou corrompido.', 400, 'INVALID_VIDEO');
  }

  if (mimeType === 'video/mp4' || mimeType === 'video/quicktime') {
    const boxType = buffer.subarray(4, 8).toString('ascii');
    if (boxType !== 'ftyp') {
      throw new AppError(
        'Conteúdo do arquivo não corresponde a um vídeo MP4/MOV válido.',
        400,
        'INVALID_SIGNATURE'
      );
    }
  } else if (mimeType === 'video/webm') {
    if (!buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
      throw new AppError(
        'Conteúdo do arquivo não corresponde a um vídeo WebM válido.',
        400,
        'INVALID_SIGNATURE'
      );
    }
  }
}

const PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  sourceType: true,
  videoUrl: true,
  youtubeId: true,
  thumbnailUrl: true,
  mimeType: true,
  fileSize: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      avatar: true,
      user: { select: { role: true } },
    },
  },
} as const;

export class CinematicService {
  async listCinematics(category?: string) {
    return prisma.cinematic.findMany({
      where: category && category !== 'Todas' ? { category } : undefined,
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createYoutubeCinematic(authorProfileId: string, actorUserId: string, rawData: any) {
    const data = cinematicYoutubeSchema.parse(rawData);
    const youtubeId = extractYoutubeId(data.youtubeUrl);

    if (!youtubeId) {
      throw new AppError(
        'URL do YouTube inválida. Use links como youtube.com/watch?v=..., youtu.be/... ou youtube.com/shorts/...',
        400,
        'INVALID_YOUTUBE_URL'
      );
    }

    const created = await prisma.cinematic.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category || 'Fraternidade',
        sourceType: 'YOUTUBE',
        videoUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
        youtubeId,
        thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
        authorId: authorProfileId,
      },
      select: PUBLIC_SELECT,
    });

    await AuditService.log(actorUserId, 'CINEMATIC_CREATE_YOUTUBE', 'Cinematic', {
      id: created.id,
      title: created.title,
      youtubeId,
    });

    return created;
  }

  async createUploadedCinematic(params: {
    authorProfileId: string;
    actorUserId: string;
    title: string;
    description?: string;
    category?: string;
    mimeType: string;
    buffer: Buffer;
  }) {
    const cleanTitle = (params.title || '').trim();
    if (cleanTitle.length < 2 || cleanTitle.length > 140) {
      throw new AppError('Título da cinemática deve ter entre 2 e 140 caracteres.', 400, 'INVALID_TITLE');
    }

    if (!ALLOWED_VIDEO_MIMES.includes(params.mimeType)) {
      throw new AppError(
        `Formato de vídeo não permitido (${params.mimeType}). Envie MP4, WebM ou MOV.`,
        400,
        'INVALID_FILE_TYPE'
      );
    }

    const useS3 = storageService.isConfigured();
    const maxBytes = useS3 ? MAX_S3_VIDEO_BYTES : MAX_DB_VIDEO_BYTES;
    if (!params.buffer || params.buffer.length === 0) {
      throw new AppError('Arquivo de vídeo vazio.', 400, 'EMPTY_FILE');
    }
    if (params.buffer.length > maxBytes) {
      throw new AppError(
        `O vídeo excede o limite de ${Math.round(maxBytes / (1024 * 1024))}MB. Para vídeos maiores, use uma URL do YouTube.`,
        400,
        'FILE_TOO_LARGE'
      );
    }

    validateVideoMagicBytes(params.mimeType, params.buffer);

    const id = crypto.randomUUID();
    let videoUrl = `/api/cinematics/${id}/stream`;
    let fileData: Buffer | null = params.buffer;

    if (useS3) {
      const uploaded = await storageService.uploadBuffer({
        scope: 'cinematics',
        mimeType: params.mimeType,
        buffer: params.buffer,
        ownerId: params.authorProfileId,
      });
      videoUrl = uploaded.url;
      fileData = null;
    }

    const created = await prisma.cinematic.create({
      data: {
        id,
        title: cleanTitle,
        description: (params.description || '').trim() || null,
        category: (params.category || '').trim() || 'Fraternidade',
        sourceType: 'UPLOAD',
        videoUrl,
        mimeType: params.mimeType,
        fileSize: params.buffer.length,
        fileData,
        authorId: params.authorProfileId,
      },
      select: PUBLIC_SELECT,
    });

    await AuditService.log(actorUserIdSafe(params.actorUserId), 'CINEMATIC_UPLOAD_VIDEO', 'Cinematic', {
      id: created.id,
      title: created.title,
      mimeType: params.mimeType,
      fileSize: params.buffer.length,
      storage: useS3 ? 's3' : 'database',
    });

    return created;
  }

  async getStreamFile(id: string) {
    const item = await prisma.cinematic.findUnique({
      where: { id },
      select: {
        id: true,
        sourceType: true,
        videoUrl: true,
        mimeType: true,
        fileData: true,
      },
    });

    if (!item) {
      throw new AppError('Cinemática não encontrada.', 404, 'CINEMATIC_NOT_FOUND');
    }

    return item;
  }

  async deleteCinematic(id: string, actorUserId: string) {
    const existing = await prisma.cinematic.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existing) {
      throw new AppError('Cinemática não encontrada.', 404, 'CINEMATIC_NOT_FOUND');
    }

    await prisma.cinematic.delete({ where: { id } });
    await AuditService.log(actorUserId, 'CINEMATIC_DELETE', 'Cinematic', {
      id: existing.id,
      title: existing.title,
    });
  }
}

function actorUserIdSafe(id: string) {
  return id;
}
