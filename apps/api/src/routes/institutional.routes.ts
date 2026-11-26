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

// Radio
router.get('/radio', authMiddleware, controller.getRadio);
router.post(
  '/radio/tracks',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.addRadioTrack
);
router.post(
  '/radio/playlists',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.createRadioPlaylist
);
router.delete(
  '/radio/tracks/:id',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.deleteRadioTrack
);

// Moderação de faixas de rádio (apenas Staff e Liderança)
router.get(
  '/radio/pending',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.listPendingRadioTracks
);
router.put(
  '/radio/tracks/:id/approve',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.approveRadioTrack
);
router.put(
  '/radio/tracks/:id/reject',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  controller.rejectRadioTrack
);

// Importar áudio do dispositivo (celular/PC) para a rádio
router.post(
  '/radio/uploads/audio',
  authMiddleware,
  permissionMiddleware('radio.manage', UserRole.ABELHA_PRINCESA),
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: 'radio_upload' }),
  express.raw({
    type: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/*'],
    limit: '16mb',
  }),
  controller.uploadRadioAudio
);

// Stream de áudio armazenado (com suporte a range/seek)
router.get('/radio/audio/:id/stream', authMiddleware, controller.streamRadioAudio);

export default router;
