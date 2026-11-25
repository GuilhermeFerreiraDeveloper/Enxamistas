import { NextFunction, Response } from 'express';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();

export class NotificationController {
  async list(req: any, res: Response, next: NextFunction) {
    try {
      const data = await notificationService.getNotifications(req.user.profile.id);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }

  async markRead(req: any, res: Response, next: NextFunction) {
    try {
      await notificationService.markAsRead(req.params.id, req.user.profile.id);
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req: any, res: Response, next: NextFunction) {
    try {
      await notificationService.markAllAsRead(req.user.profile.id);
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  }

  async getPreferences(req: any, res: Response, next: NextFunction) {
    try {
      const prefs = await notificationService.getPreferences(req.user.profile.id);
      res.status(200).json(prefs);
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: any, res: Response, next: NextFunction) {
    try {
      const { events, academic, feed, chat, admin } = req.body;
      const prefs = await notificationService.updatePreferences(req.user.profile.id, {
        ...(typeof events === 'boolean' ? { events } : {}),
        ...(typeof academic === 'boolean' ? { academic } : {}),
        ...(typeof feed === 'boolean' ? { feed } : {}),
        ...(typeof chat === 'boolean' ? { chat } : {}),
        ...(typeof admin === 'boolean' ? { admin } : {}),
      });
      res.status(200).json(prefs);
    } catch (error) {
      next(error);
    }
  }
}
