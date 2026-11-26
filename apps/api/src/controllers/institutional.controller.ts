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

  // Radio: Sistema de Pedidos de Músicas
  async getRadio(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getRadioData());
    } catch (error) {
      next(error);
    }
  }

  async createRadioRequest(req: any, res: Response, next: NextFunction) {
    try {
      res.status(201).json(
        await service.createRadioRequest(req.body, req.user.profile.id, req.user.id)
      );
    } catch (error) {
      next(error);
    }
  }

  async getMyRadioRequests(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getMyRadioRequests(req.user.profile.id));
    } catch (error) {
      next(error);
    }
  }

  async getMyRadioPlaylist(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.getMyRadioPlaylist(req.user.profile.id));
    } catch (error) {
      next(error);
    }
  }

  async listAllRadioRequests(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await service.listAllRadioRequests());
    } catch (error) {
      next(error);
    }
  }

  async updateRadioRequestStatus(req: any, res: Response, next: NextFunction) {
    try {
      const { status, rejectionReason, filePath } = req.body;
      const validStatuses = ['SOLICITADA', 'EM_ANALISE', 'ADICIONADA_PLAYLIST', 'RECUSADA'];
      if (!validStatuses.includes(status)) {
        throw new AppError('Status inválido.', 400, 'INVALID_STATUS');
      }
      res.status(200).json(
        await service.updateRadioRequestStatus(
          req.params.id,
          status,
          req.user.profile.id,
          req.user.id,
          rejectionReason,
          filePath
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteRadioRequest(req: any, res: Response, next: NextFunction) {
    try {
      await service.deleteRadioRequest(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Stream de arquivo .mp3 da pasta musicas/PASSAPORTE/
  async streamRadioFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { passport, filename } = req.params;
      const filePath = await service.getAuthorizedRadioFile(passport, filename);
      const fs = require('fs');

      const stat = fs.statSync(filePath);
      const totalSize = stat.size;
      const mimeType = 'audio/mpeg';
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

        const chunk = fs.readFileSync(filePath, { start, end: end + 1 });
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
      return res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }
}
