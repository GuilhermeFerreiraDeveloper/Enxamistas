import { NextFunction, Request, Response } from 'express';
import { MedalService } from '../services/medal.service';

const medalService = new MedalService();

export class MedalController {
  async listCatalog(_req: Request, res: Response, next: NextFunction) {
    try {
      const catalog = await medalService.listAllCatalog();
      res.status(200).json(catalog);
    } catch (error) {
      next(error);
    }
  }

  async createMedal(req: Request, res: Response, next: NextFunction) {
    try {
      const medal = await medalService.createMedal(req.params.courseId, req.body);
      res.status(201).json(medal);
    } catch (error) {
      next(error);
    }
  }

  async emitMedal(req: any, res: Response, next: NextFunction) {
    try {
      const { profileId, medalId, reason } = req.body;
      const userMedal = await medalService.emitMedal(
        profileId,
        medalId,
        req.user.profile.id,
        reason,
        req.user.id
      );
      res.status(201).json(userMedal);
    } catch (error) {
      next(error);
    }
  }

  async getMyMedals(req: any, res: Response, next: NextFunction) {
    try {
      const medals = await medalService.getProfileMedals(req.user.profile.id);
      res.status(200).json(medals);
    } catch (error) {
      next(error);
    }
  }

  async getMyAchievements(req: any, res: Response, next: NextFunction) {
    try {
      const achievements = await medalService.getProfileAchievements(req.user.profile.id);
      res.status(200).json(achievements);
    } catch (error) {
      next(error);
    }
  }

  async createAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const achievement = await medalService.createAchievement(req.body);
      res.status(201).json(achievement);
    } catch (error) {
      next(error);
    }
  }

  async grantAchievement(req: any, res: Response, next: NextFunction) {
    try {
      const { profileId, achievementId, reason } = req.body;
      const granted = await medalService.grantAchievement(
        profileId,
        achievementId,
        req.user.profile.id,
        reason,
        req.user.id
      );
      res.status(201).json(granted);
    } catch (error) {
      next(error);
    }
  }
}
