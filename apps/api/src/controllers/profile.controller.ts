import { NextFunction, Request, Response } from 'express';
import { ProfileService } from '../services/profile.service';
import { updateProfileSchema } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';

const profileService = new ProfileService();

export class ProfileController {
  async getMe(req: any, res: Response, next: NextFunction) {
    try {
      const profile = await profileService.getProfile(req.user.id);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: any, res: Response, next: NextFunction) {
    try {
      const validated = updateProfileSchema.parse(req.body);
      const profile = await profileService.updateProfile(req.user.id, validated);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await profileService.getMembers(req.query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProfileByPassport(req: Request, res: Response, next: NextFunction) {
    try {
      const { passport } = req.params;
      const profile = await profileService.getProfileByPassport(passport);
      if (!profile) {
        throw new AppError('Perfil não encontrado', 404, 'PROFILE_NOT_FOUND');
      }
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }
}
