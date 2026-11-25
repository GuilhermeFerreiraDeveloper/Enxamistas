import { Router } from 'express';
import { MedalController } from '../controllers/medal.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '@enxamistas/shared';

const router = Router();
const medalController = new MedalController();

router.get('/catalog', authMiddleware, medalController.listCatalog);
router.get('/my', authMiddleware, medalController.getMyMedals);
router.get('/my-achievements', authMiddleware, medalController.getMyAchievements);

// Leadership routes
router.post(
  '/emit',
  authMiddleware,
  permissionMiddleware('medals.emit', UserRole.ABELHA_PRINCESA),
  medalController.emitMedal
);
router.post(
  '/courses/:courseId',
  authMiddleware,
  permissionMiddleware('medals.emit', UserRole.ABELHA_PRINCESA),
  medalController.createMedal
);
router.post(
  '/achievements',
  authMiddleware,
  permissionMiddleware('medals.emit', UserRole.ABELHA_PRINCESA),
  medalController.createAchievement
);
router.post(
  '/achievements/grant',
  authMiddleware,
  permissionMiddleware('medals.emit', UserRole.ABELHA_PRINCESA),
  medalController.grantAchievement
);

export default router;
