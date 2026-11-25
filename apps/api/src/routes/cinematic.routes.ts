import express, { Router } from 'express';
import { CinematicController } from '../controllers/cinematic.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/role.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { UserRole } from '@enxamistas/shared';

const router = Router();
const controller = new CinematicController();

router.get('/', controller.list);
router.get('/:id/stream', controller.stream);

router.post(
  '/',
  authMiddleware,
  permissionMiddleware('cinematics.manage', UserRole.ABELHA_PRINCESA),
  controller.createYoutube
);

router.post(
  '/upload',
  authMiddleware,
  permissionMiddleware('cinematics.manage', UserRole.ABELHA_PRINCESA),
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'cinematic_upload' }),
  express.raw({
    type: ['video/mp4', 'video/webm', 'video/quicktime'],
    limit: '81mb',
  }),
  controller.uploadVideo
);

router.delete(
  '/:id',
  authMiddleware,
  permissionMiddleware('cinematics.manage', UserRole.ABELHA_PRINCESA),
  controller.remove
);

export default router;
