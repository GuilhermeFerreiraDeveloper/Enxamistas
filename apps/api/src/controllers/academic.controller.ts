import { NextFunction, Response } from 'express';
import { AcademicService } from '../services/academic.service';
import { enrollSchema, validateProofSchema, courseCompletionSchema } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';

const academicService = new AcademicService();

export class AcademicController {
  async enroll(req: any, res: Response, next: NextFunction) {
    try {
      const { courseId, type } = enrollSchema.parse(req.body);
      const enrollment = await academicService.enroll(req.user.profile.id, courseId, type);
      res.status(201).json(enrollment);
    } catch (error) {
      next(error);
    }
  }

  async dropSecondary(req: any, res: Response, next: NextFunction) {
    try {
      await academicService.dropSecondaryEnrollment(req.user.profile.id, req.params.courseId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getMyEnrollments(req: any, res: Response, next: NextFunction) {
    try {
      const enrollments = await academicService.getEnrollments(req.user.profile.id);
      res.status(200).json(enrollments);
    } catch (error) {
      next(error);
    }
  }

  async createSession(req: any, res: Response, next: NextFunction) {
    try {
      const session = await academicService.createSession(req.params.courseId, req.body, req.user.id);
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user?.profile?.id) {
        throw new AppError('Perfil não encontrado', 403, 'PROFILE_REQUIRED');
      }
      const sessions = await academicService.getSessions(
        req.params.courseId,
        req.user.profile.id,
        req.user.role
      );
      res.status(200).json(sessions);
    } catch (error) {
      next(error);
    }
  }

  async submitProof(req: any, res: Response, next: NextFunction) {
    try {
      const proof = await academicService.submitProof(req.user.profile.id, req.body);
      res.status(201).json(proof);
    } catch (error) {
      next(error);
    }
  }

  async validateProof(req: any, res: Response, next: NextFunction) {
    try {
      const { status, feedback } = validateProofSchema.parse(req.body);
      const proof = await academicService.validateProof(
        req.params.proofId,
        status,
        feedback,
        req.user.profile.id,
        req.user.id
      );
      res.status(200).json(proof);
    } catch (error) {
      next(error);
    }
  }

  async addMaterial(req: any, res: Response, next: NextFunction) {
    try {
      const material = await academicService.addMaterial(req.params.courseId, req.body, req.user.id);
      res.status(201).json(material);
    } catch (error) {
      next(error);
    }
  }

  async deleteMaterial(req: any, res: Response, next: NextFunction) {
    try {
      await academicService.deleteMaterial(req.params.materialId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async completeCourse(req: any, res: Response, next: NextFunction) {
    try {
      const parsed = courseCompletionSchema.parse(req.body);
      const completion = await academicService.completeCourse(
        req.params.courseId,
        parsed.profileId,
        parsed.status,
        parsed.notes,
        parsed.emitMedal,
        req.user.profile.id,
        req.user.id
      );
      res.status(201).json(completion);
    } catch (error) {
      next(error);
    }
  }

  async getCourseCompletions(req: any, res: Response, next: NextFunction) {
    try {
      const completions = await academicService.getCourseCompletions(req.params.courseId);
      res.status(200).json(completions);
    } catch (error) {
      next(error);
    }
  }
}
