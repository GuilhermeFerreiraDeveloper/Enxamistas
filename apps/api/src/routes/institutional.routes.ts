import express, { Router } from 'express';
import { InstitutionalController } from '../controllers/institutional.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/role.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { UserRole } from '@enxamistas/shared';

const router = Router();
const controller = new InstitutionalController();

// Public Portal
router.get('/institutional/public', controller.getPublicPortal);

// Mansions & Gallery
router.get('/gallery/mansions', controller.getMansions);
router.get('/gallery/albums', authMiddleware, controller.getAllAlbums);
router.get('/gallery/mansions/key-requests/my', authMiddleware, controller.getMyKeyRequests);
router.get('/gallery/mansions/:idOrSlug', controller.getAlbum);
router.post('/gallery/mansions/:id/key-request', authMiddleware, controller.requestKey);
router.put(
  '/gallery/mansions/:id',
  authMiddleware,
  permissionMiddleware('gallery.manage', UserRole.ABELHA_PRINCESA),
  controller.updateMansion
);
router.put(
  '/gallery/key-requests/:requestId',
  authMiddleware,
  permissionMiddleware('gallery.manage', UserRole.ABELHA_PRINCESA),
  controller.reviewKeyRequest
);
router.post(
  '/gallery/albums/:id/media',
  authMiddleware,
  permissionMiddleware('gallery.manage', UserRole.ABELHA_PRINCESA),
  controller.addAlbumMedia
);
router.delete(
  '/gallery/media/:mediaId',
  authMiddleware,
  permissionMiddleware('gallery.manage', UserRole.ABELHA_PRINCESA),
  controller.deleteAlbumMedia
);

// Announcements
router.get('/announcements', authMiddleware, controller.getAnnouncements);
router.post(
  '/announcements',
  authMiddleware,
  permissionMiddleware('announcements.manage', UserRole.ABELHA_PRINCESA),
  controller.createAnnouncement
);
router.put(
  '/announcements/:id',
  authMiddleware,
  permissionMiddleware('announcements.manage', UserRole.ABELHA_PRINCESA),
  controller.updateAnnouncement
);
router.delete(
  '/announcements/:id',
  authMiddleware,
  permissionMiddleware('announcements.manage', UserRole.ABELHA_PRINCESA),
  controller.deleteAnnouncement
);

// Projects
router.get('/projects', optionalAuthMiddleware, controller.getProjects);
router.get('/projects/:id', optionalAuthMiddleware, controller.getProjectById);
router.post('/projects', authMiddleware, controller.createProject);
router.delete('/projects/:id', authMiddleware, controller.deleteProject);

// Guestbook
router.get('/guestbook', optionalAuthMiddleware, controller.getGuestbook);
router.post(
  '/guestbook',
  optionalAuthMiddleware,
  rateLimit({ windowMs: 300_000, max: 5, keyPrefix: 'guestbook' }),
  controller.createGuestbook
);
router.put(
  '/guestbook/:id/moderate',
  authMiddleware,
  permissionMiddleware('feed.moderate', UserRole.ABELHA_PRINCESA),
  controller.moderateGuestbook
);
router.delete(
  '/guestbook/:id',
  authMiddleware,
  permissionMiddleware('feed.moderate', UserRole.ABELHA_PRINCESA),
  controller.deleteGuestbook
);

// Monthly Highlights (Enxamista do Mês)
router.get('/highlights', authMiddleware, controller.getHighlights);
router.post(
  '/highlights',
  authMiddleware,
  permissionMiddleware('highlights.manage', UserRole.ABELHA_PRINCESA),
  controller.createHighlight
);

// Public radio playback exposes only approved library tracks and opaque stream tokens.
router.get('/radio/public', controller.getPublicRadio);
router.get('/radio/public/stream/:trackToken', controller.streamPublicRadioFile);

// Radio: Sistema de Pedidos de Músicas
router.get('/radio', authMiddleware, controller.getRadio);
router.post(
  '/radio/requests',
  authMiddleware,
  controller.createRadioRequest
);
router.get(
  '/radio/my-requests',
  authMiddleware,
  controller.getMyRadioRequests
);
router.get(
  '/radio/my-playlist',
  authMiddleware,
  controller.getMyRadioPlaylist
);

// Moderação de pedidos de rádio (apenas Staff e Liderança)
router.get(
  '/radio/requests',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.listAllRadioRequests
);
router.put(
  '/radio/requests/:id/status',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.updateRadioRequestStatus
);
router.delete(
  '/radio/requests/:id',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.deleteRadioRequest
);

// Biblioteca MP3 da rádio: somente Staff pode gerenciar os arquivos.
router.post(
  '/radio/library',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  express.raw({ type: ['audio/mpeg', 'audio/mp3'], limit: '50mb' }),
  controller.uploadRadioLibraryFile
);
router.delete(
  '/radio/library/all',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.deleteAllRadioLibraryFiles
);
router.delete(
  '/radio/library',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.deleteRadioLibraryFile
);
router.get('/radio/library/stream', authMiddleware, controller.streamRadioLibraryFile);

// Stream de arquivo .mp3 da pasta musicas/PASSAPORTE/
router.get(
  '/radio/stream/:passport/:filename',
  authMiddleware,
  controller.streamRadioFile
);

export default router;
