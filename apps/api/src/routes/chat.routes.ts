import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();
const chatController = new ChatController();

router.get('/conversations', authMiddleware, chatController.getConversations);
router.post('/conversations', authMiddleware, chatController.createConversation);
router.get('/conversations/:conversationId/messages', authMiddleware, chatController.getMessages);
router.post(
  '/conversations/:conversationId/messages',
  authMiddleware,
  rateLimit({ windowMs: 60_000, max: 40, keyPrefix: 'chat_msg' }),
  chatController.sendMessage
);
router.post('/conversations/:conversationId/read', authMiddleware, chatController.markAsRead);

export default router;
