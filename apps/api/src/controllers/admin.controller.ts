import { NextFunction, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { AppError } from '../errors/AppError';

const adminService = new AdminService();

export class AdminController {
  async metrics(_req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await adminService.getDashboardMetrics());
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await adminService.listMembers(req.query.q as string | undefined));
    } catch (error) {
      next(error);
    }
  }

  async changeRole(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(
        await adminService.changeUserRole(req.params.userId, req.body, req.user.id, req.user.role)
      );
    } catch (error) {
      next(error);
    }
  }

  async suspendUser(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(
        await adminService.suspendUser(req.params.userId, req.body, req.user.id, req.user.role)
      );
    } catch (error) {
      next(error);
    }
  }

  async changeMainCourse(req: any, res: Response, next: NextFunction) {
    try {
      const { courseId } = req.body;
      if (!courseId) throw new AppError('courseId obrigatório', 400, 'COURSE_REQUIRED');
      res.status(200).json(
        await adminService.changeMemberMainCourse(req.params.profileId, courseId, req.user.id)
      );
    } catch (error) {
      next(error);
    }
  }

  async getRoles(_req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await adminService.getRolesAndPermissions());
    } catch (error) {
      next(error);
    }
  }

  async createRole(req: any, res: Response, next: NextFunction) {
    try {
      const { code, name, description, level } = req.body;
      if (!code || !name) throw new AppError('Código e nome obrigatórios.', 400, 'INVALID_ROLE');
      res.status(201).json(
        await adminService.createRole(
          { code, name, description, level: Number(level) || 15 },
          req.user.id
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async updateRolePermissions(req: any, res: Response, next: NextFunction) {
    try {
      const { permissionIds } = req.body;
      if (!Array.isArray(permissionIds)) {
        throw new AppError('permissionIds deve ser um array.', 400, 'INVALID_PERMISSIONS');
      }
      await adminService.setRolePermissions(req.params.roleId, permissionIds, req.user.id);
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async pendingProofs(_req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await adminService.getPendingProofs());
    } catch (error) {
      next(error);
    }
  }

  async listReports(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await adminService.listReports(req.query.status as string | undefined));
    } catch (error) {
      next(error);
    }
  }

  async updateReport(req: any, res: Response, next: NextFunction) {
    try {
      const { status, resolutionNote } = req.body;
      res.status(200).json(
        await adminService.updateReport(
          req.params.id,
          status,
          resolutionNote,
          req.user.profile.id,
          req.user.id
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async listKeyRequests(_req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await adminService.listKeyRequests());
    } catch (error) {
      next(error);
    }
  }

  async getSettings(_req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await adminService.getSettings());
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: any, res: Response, next: NextFunction) {
    try {
      res.status(200).json(await adminService.upsertSettings(req.body || {}, req.user.id));
    } catch (error) {
      next(error);
    }
  }

  async auditLogs(req: any, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      res.status(200).json(await adminService.getAuditLogs(page));
    } catch (error) {
      next(error);
    }
  }
}
