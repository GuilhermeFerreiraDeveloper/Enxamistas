import { NextFunction, Request, Response } from 'express';
import { InstitutionalService } from '../services/institutional.service';
import { AppError } from '../errors/AppError';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

const service = new InstitutionalService();

function decodeHeaderValue(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export class InstitutionalController {
  async getPublicPortal(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getPublicPortalData();
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  // Mansions & Gallery
  async getMansions(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getMansions());
    } catch (error) {
      next(error);
    }
  }

  async getAllAlbums(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getAllAlbums());
    } catch (error) {
      next(error);
    }
  }

  async getAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const album = await service.getAlbumByIdOrSlug(req.params.idOrSlug);
      if (!album) throw new AppError('Mansão/Álbum não encontrado', 404, 'ALBUM_NOT_FOUND');
      res.status(200).json(album);
    } catch (error) {
      next(error);
    }
  }

  async updateMansion(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.updateMansion(req.params.id, req.body, req.user.id));
    } catch (error) {
      next(error);
    }
  }

  async addAlbumMedia(req: any, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await service.addAlbumMedia(req.params.id, req.body, req.user.id));
    } catch (error) {
      next(error);
    }
  }

  async deleteAlbumMedia(req: any, res: Response, next: NextFunction) {
    try {
      await service.deleteAlbumMedia(req.params.mediaId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async requestKey(req: any, res: Response, next: NextFunction) {
    try {
      const result = await service.requestMansionKey(req.params.id, req.user.profile.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMyKeyRequests(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getMyKeyRequests(req.user.profile.id));
    } catch (error) {
      next(error);
    }
  }

  async reviewKeyRequest(req: any, res: Response, next: NextFunction) {
    try {
      const { status, responseNote } = req.body;
      if (status !== 'APPROVED' && status !== 'REJECTED') {
        throw new AppError('Status inválido.', 400, 'INVALID_STATUS');
      }
      const reviewed = await service.reviewKeyRequest(
        req.params.requestId,
        status,
        responseNote,
        req.user.profile.id,
        req.user.id
      );
      res.status(200).json(reviewed);
    } catch (error) {
      next(error);
    }
  }

  // Announcements
  async getAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getAnnouncements(req.query.category as string | undefined));
    } catch (error) {
      next(error);
    }
  }

  async createAnnouncement(req: any, res: Response, next: NextFunction) {
    try {
      const item = await service.createAnnouncement(req.user.profile.id, req.user.id, req.body);
      res.status(201).json(item);
    } catch (error) {
      next(error);
    }
  }

  async updateAnnouncement(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.updateAnnouncement(req.params.id, req.user.id, req.body));
    } catch (error) {
      next(error);
    }
  }

  async deleteAnnouncement(req: any, res: Response, next: NextFunction) {
    try {
      await service.deleteAnnouncement(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Projects
  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getProjects(req.query));
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await service.getProjectById(req.params.id);
      if (!project) throw new AppError('Projeto não encontrado', 404, 'PROJECT_NOT_FOUND');
      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  }

  async createProject(req: any, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await service.createProject(req.user.profile.id, req.body));
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: any, res: Response, next: NextFunction) {
    try {
      await service.deleteProject(req.params.id, req.user.profile.id, req.user.role);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Guestbook
  async getGuestbook(req: any, res: Response, next: NextFunction) {
    try {
      const isMod =
        req.user &&
        (RoleHierarchy[req.user.role as UserRole] ?? 0) >= RoleHierarchy[UserRole.ABELHA_PRINCESA];
      res.status(200).json(await service.getGuestbook(Boolean(req.user), Boolean(isMod && req.query.all === 'true')));
    } catch (error) {
      next(error);
    }
  }

  async createGuestbook(req: any, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await service.createGuestbookEntry(req.body, req.user));
    } catch (error) {
      next(error);
    }
  }

  async moderateGuestbook(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(
        await service.moderateGuestbookEntry(req.params.id, Boolean(req.body.isHidden), req.user.id)
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteGuestbook(req: any, res: Response, next: NextFunction) {
    try {
      await service.deleteGuestbookEntry(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Highlights
  async getHighlights(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getMonthlyHighlights());
    } catch (error) {
      next(error);
    }
  }

  async createHighlight(req: any, res: Response, next: NextFunction) {
    try {
      res.status(201).json(
        await service.createMonthlyHighlight(req.body, req.user.profile.id, req.user.id)
      );
    } catch (error) {
      next(error);
    }
  }

  // Radio
  async getRadio(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getRadioData());
    } catch (error) {
      next(error);
    }
  }

  async addRadioTrack(req: any, res: Response, next: NextFunction) {
    try {
      res.status(201).json(
        await service.addRadioTrack(req.body, req.user.profile.id, req.user.id)
      );
    } catch (error) {
      next(error);
    }
  }

  async createRadioPlaylist(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.body.name) throw new AppError('Nome da playlist obrigatório.', 400, 'NAME_REQUIRED');
      res.status(201).json(
        await service.createRadioPlaylist(req.body.name, req.body.description, req.user.id)
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteRadioTrack(req: any, res: Response, next: NextFunction) {
    try {
      await service.deleteRadioTrack(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // --- Importação de áudio do dispositivo (celular/PC) ---
  async uploadRadioAudio(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user?.profile?.id) {
        throw new AppError('Perfil do usuário não encontrado.', 403, 'PROFILE_REQUIRED');
      }
      if (!Buffer.isBuffer(req.body)) {
        throw new AppError(
          'Envie o arquivo de áudio binário com Content-Type adequado.',
          400,
          'INVALID_UPLOAD'
        );
      }

      const mimeType = String(req.headers['content-type'] || '').split(';')[0].trim();
      const title = decodeHeaderValue(req.headers['x-radio-title']);
      const artist = decodeHeaderValue(req.headers['x-radio-artist']);
      const durationHeader = decodeHeaderValue(req.headers['x-radio-duration']);
      const duration = durationHeader ? parseInt(durationHeader, 10) : undefined;

      const created = await service.uploadRadioAudio({
        authorProfileId: req.user.profile.id,
        actorUserId: req.user.id,
        title,
        artist,
        duration,
        mimeType,
        buffer: req.body,
      });

      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }

  // --- Stream de áudio armazenado (com suporte a range/seek) ---
  async streamRadioAudio(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.getRadioAudioStreamFile(req.params.id);

      if (item.url && item.url.startsWith('http') && !item.fileData) {
        return res.redirect(item.url);
      }

      if (!item.fileData) {
        throw new AppError('Áudio indisponível no momento.', 404, 'AUDIO_UNAVAILABLE');
      }

      const buffer = Buffer.from(item.fileData);
      const totalSize = buffer.length;
      const mimeType = item.mimeType || 'audio/mpeg';
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
}
