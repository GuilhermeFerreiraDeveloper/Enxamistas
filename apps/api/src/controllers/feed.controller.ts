import { NextFunction, Response } from 'express';
import { FeedService } from '../services/feed.service';
import { postSchema, updatePostSchema, commentSchema, reportSchema } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';

const feedService = new FeedService();

export class FeedController {
  async getPublicGallery(req: any, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const gallery = await feedService.getPublicGallery(req.user?.profile?.id, page);
      res.status(200).json(gallery);
    } catch (error) {
      next(error);
    }
  }

  async createGalleryPhoto(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user?.profile?.id) throw new AppError('Perfil necessário.', 403, 'PROFILE_REQUIRED');
      const photo = await feedService.createGalleryPhoto(req.user.profile.id, req.body);
      res.status(201).json(photo);
    } catch (error) {
      next(error);
    }
  }

  async deleteGalleryPhoto(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user?.profile?.id) throw new AppError('Perfil necessário.', 403, 'PROFILE_REQUIRED');
      await feedService.deleteGalleryPhoto(req.params.photoId, req.user.profile.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async createPost(req: any, res: Response, next: NextFunction) {
    try {
      if (!req.user?.profile?.id) throw new AppError('Perfil necessário.', 403, 'PROFILE_REQUIRED');
      const validated = postSchema.parse(req.body);
      const post = await feedService.createPost(req.user.profile.id, validated);
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  }

  async getPosts(req: any, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const posts = await feedService.getPosts(req.user.profile?.id || '', page, limit);
      res.status(200).json(posts);
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req: any, res: Response, next: NextFunction) {
    try {
      const validated = updatePostSchema.parse(req.body);
      const post = await feedService.updatePost(req.params.postId, req.user.profile.id, validated.content);
      res.status(200).json(post);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: any, res: Response, next: NextFunction) {
    try {
      await feedService.deletePost(
        req.params.postId,
        req.user.profile.id,
        req.user.id,
        req.user.role
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async likePost(req: any, res: Response, next: NextFunction) {
    try {
      const result = await feedService.likePost(req.params.postId, req.user.profile.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req: any, res: Response, next: NextFunction) {
    try {
      const result = await feedService.unlikePost(req.params.postId, req.user.profile.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: any, res: Response, next: NextFunction) {
    try {
      const validated = commentSchema.parse(req.body);
      const comment = await feedService.addComment(req.params.postId, req.user.profile.id, validated);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req: any, res: Response, next: NextFunction) {
    try {
      const validated = updatePostSchema.parse(req.body);
      const comment = await feedService.updateComment(
        req.params.commentId,
        req.user.profile.id,
        validated.content
      );
      res.status(200).json(comment);
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: any, res: Response, next: NextFunction) {
    try {
      await feedService.deleteComment(
        req.params.commentId,
        req.user.profile.id,
        req.user.id,
        req.user.role
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async likeComment(req: any, res: Response, next: NextFunction) {
    try {
      const result = await feedService.likeComment(req.params.commentId, req.user.profile.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unlikeComment(req: any, res: Response, next: NextFunction) {
    try {
      const result = await feedService.unlikeComment(req.params.commentId, req.user.profile.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async report(req: any, res: Response, next: NextFunction) {
    try {
      const validated = reportSchema.parse(req.body);
      const report = await feedService.report(req.user.profile.id, validated);
      res.status(201).json(report);
    } catch (error) {
      next(error);
    }
  }
}
