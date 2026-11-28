import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const profileController = new ProfileController();

router.get('/public/members', profileController.getPublicMembers);
router.get('/public/members/:profileId', profileController.getPublicMember);
router.get('/me', authMiddleware, profileController.getMe);
router.put('/me', authMiddleware, profileController.updateMe);
router.get('/members', authMiddleware, profileController.getMembers);
router.get('/:passport', authMiddleware, profileController.getProfileByPassport);

export default router;
