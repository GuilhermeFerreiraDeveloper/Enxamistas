import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();
const authController = new AuthController();

router.post(
  '/register',
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'auth_register' }),
  authController.register
);
router.post(
  '/login',
  rateLimit({ windowMs: 60_000, max: 15, keyPrefix: 'auth_login' }),
  authController.login
);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

export default router;
