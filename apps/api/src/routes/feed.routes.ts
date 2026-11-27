import { Router } from 'express';
import { FeedController } from '../controllers/feed.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';

const router = Router();
const feedController = new FeedController();

router.get('/gallery', optionalAuthMiddleware, feedController.getPublicGallery);
router.post('/gallery', authMiddleware, rateLimit({ windowMs: 300_000, max: 10, keyPrefix: 'gallery_photo' }), feedController.createGalleryPhoto);
router.delete('/gallery/:photoId', authMiddleware, feedController.deleteGalleryPhoto);

router.get('/', authMiddleware, feedController.getPosts);
router.post(
  '/',
  authMiddleware,
  rateLimit({ windowMs: 300_000, max: 12, keyPrefix: 'feed_post' }),
  feedController.createPost
);
router.put('/:postId', authMiddleware, feedController.updatePost);
router.delete('/:postId', authMiddleware, feedController.deletePost);

router.post('/:postId/like', authMiddleware, feedController.likePost);
router.delete('/:postId/like', authMiddleware, feedController.unlikePost);

router.post(
  '/:postId/comments',
  authMiddleware,
  rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'feed_comment' }),
  feedController.addComment
);
router.put('/comments/:commentId', authMiddleware, feedController.updateComment);
router.delete('/comments/:commentId', authMiddleware, feedController.deleteComment);
router.post('/comments/:commentId/like', authMiddleware, feedController.likeComment);
router.delete('/comments/:commentId/like', authMiddleware, feedController.unlikeComment);

router.post(
  '/report',
  authMiddleware,
  rateLimit({ windowMs: 300_000, max: 10, keyPrefix: 'feed_report' }),
  feedController.report
);

export default router;
