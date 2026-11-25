import { Request, Response, NextFunction } from 'express';
import { CinematicService } from '../services/cinematic.service';
import { AppError } from '../errors/AppError';

const service = new CinematicService();

function decodeHeaderValue(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export class CinematicController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      res.status(200).json(await service.listCinematics(category));
    } catch (error) {
      next(error);
    }
  }

  async createYoutube(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user?.profile?.id) {
        throw new AppError('Perfil do usuário não encontrado.', 403, 'PROFILE_REQUIRED');
      }
      const created = await service.createYoutubeCinematic(req.user.profile.id, req.user.id, req.body);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  async uploadVideo(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user?.profile?.id) {
        throw new AppError('Perfil do usuário não encontrado.', 403, 'PROFILE_REQUIRED');
      }

      if (!Buffer.isBuffer(req.body)) {
        throw new AppError('Envie o arquivo de vídeo binário com Content-Type adequado.', 400, 'INVALID_UPLOAD');
      }

      const mimeType = String(req.headers['content-type'] || '').split(';')[0].trim();
      const title = decodeHeaderValue(req.headers['x-cinematic-title']);
      const description = decodeHeaderValue(req.headers['x-cinematic-description']);
      const category = decodeHeaderValue(req.headers['x-cinematic-category']) || 'Fraternidade';

      const created = await service.createUploadedCinematic({
        authorProfileId: req.user.profile.id,
        actorUserId: req.user.id,
        title,
        description,
        category,
        mimeType,
        buffer: req.body,
      });

      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  async stream(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.getStreamFile(req.params.id);

      if (!item.fileData) {
        if (item.videoUrl && item.videoUrl.startsWith('http')) {
          return res.redirect(item.videoUrl);
        }
        throw new AppError('Arquivo de vídeo indisponível.', 404, 'VIDEO_UNAVAILABLE');
      }

      const buffer = Buffer.from(item.fileData);
      const totalSize = buffer.length;
      const mimeType = item.mimeType || 'video/mp4';
      const range = req.headers.range;

      if (range) {
        const match = range.match(/bytes=(\d+)-(\d*)/);
        if (!match) {
          return res.status(416).setHeader('Content-Range', `bytes */${totalSize}`).end();
        }
        const start = parseInt(match[1], 10);
        const end = match[2] ? Math.min(parseInt(match[2], 10), totalSize - 1) : totalSize - 1;

        if (start >= totalSize || end < start) {
          return res.status(416).setHeader('Content-Range', `bytes */${totalSize}`).end();
        }

        const chunk = buffer.subarray(start, end + 1);
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', String(chunk.length));
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(chunk);
      }

      res.status(200);
      res.setHeader('Content-Length', String(totalSize));
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: any, res: Response, next: NextFunction) {
    try {
      await service.deleteCinematic(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
