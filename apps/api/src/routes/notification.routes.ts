import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const controller = new NotificationController();

router.get('/', authMiddleware, controller.list);
router.post('/:id/read', authMiddleware, controller.markRead);
router.post('/read-all', authMiddleware, controller.markAllRead);
router.get('/preferences', authMiddleware, controller.getPreferences);
router.put('/preferences', authMiddleware, controller.updatePreferences);

export default router;
