import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '@enxamistas/shared';

const router = Router();
const eventController = new EventController();

// Institutional Calendar
router.get('/calendar', optionalAuthMiddleware, eventController.getCommitments);
router.post(
  '/calendar',
  authMiddleware,
  permissionMiddleware('calendar.manage', UserRole.ABELHA_PRINCESA),
  eventController.createCommitment
);
router.delete(
  '/calendar/:id',
  authMiddleware,
  permissionMiddleware('calendar.manage', UserRole.ABELHA_PRINCESA),
  eventController.deleteCommitment
);

// Events (public visibility respected for unauthenticated callers)
router.get('/', optionalAuthMiddleware, eventController.getAll);
router.get('/:id', optionalAuthMiddleware, eventController.getById);
router.post('/:id/rsvp', authMiddleware, eventController.rsvp);

// Leadership routes
router.post(
  '/',
  authMiddleware,
  permissionMiddleware('events.manage', UserRole.ABELHA_PRINCESA),
  eventController.create
);
router.put(
  '/:id',
  authMiddleware,
  permissionMiddleware('events.manage', UserRole.ABELHA_PRINCESA),
  eventController.update
);

export default router;
