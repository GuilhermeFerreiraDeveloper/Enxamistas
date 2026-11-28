import express, { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { rateLimit } from '../middlewares/rateLimit.middleware';
import { storageService, UploadScope } from '../services/storage.service';
import { AppError } from '../errors/AppError';
import { RoleHierarchy, UserRole } from '@enxamistas/shared';

const router = Router();
const VALID_SCOPES: UploadScope[] = [
  'avatars',
  'profile',
  'feed',
  'events',
  'materials',
  'proofs',
  'gallery',
  'projects',
  'audios',
];

router.get('/status', authMiddleware, (_req, res) => {
  res.status(200).json(storageService.getStatus());
});

router.get('/:scope(avatars|gallery|profile)/:ownerId/:filename', async (req, res, next) => {
  try {
    const { scope, ownerId, filename } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(ownerId) || !/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(filename)) {
      throw new AppError('Caminho de imagem inválido.', 400, 'INVALID_KEY');
    }

    const file = await storageService.fetchPrivateObject(`${scope}/${ownerId}/${filename}`);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.contentType)) {
      throw new AppError('Tipo de imagem inválido no armazenamento.', 415, 'INVALID_FILE_TYPE');
    }
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(200).send(file.buffer);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:scope',
  authMiddleware,
  rateLimit({ windowMs: 60_000, max: 20, keyPrefix: 'upload' }),
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
    limit: '11mb',
  }),
  async (req: any, res, next) => {
    try {
      const scope = req.params.scope as UploadScope;
      if (!VALID_SCOPES.includes(scope)) {
        throw new AppError('Escopo de upload inválido.', 400, 'INVALID_SCOPE');
      }

      if (!req.user?.profile?.id) {
        throw new AppError('Perfil do usuário não encontrado.', 403, 'PROFILE_REQUIRED');
      }

      let buffer: Buffer;
      let mimeType: string;

      if (Buffer.isBuffer(req.body)) {
        buffer = req.body;
        mimeType = String(req.headers['content-type'] || '').split(';')[0].trim();
      } else if (req.body && typeof req.body.dataBase64 === 'string' && typeof req.body.mimeType === 'string') {
        const cleaned = req.body.dataBase64.replace(/^data:[^;]+;base64,/, '');
        buffer = Buffer.from(cleaned, 'base64');
        mimeType = req.body.mimeType;
      } else {
        throw new AppError('Envie o arquivo binário ou em base64 com mimeType.', 400, 'INVALID_UPLOAD_PAYLOAD');
      }

      const result = await storageService.uploadBuffer({
        scope,
        mimeType,
        buffer,
        ownerId: req.user.profile.id,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/private/*', authMiddleware, async (req: any, res, next) => {
  try {
    const key = decodeURIComponent(req.params[0] || '');
    if (!key || key.includes('..')) {
      throw new AppError('Caminho de arquivo inválido.', 400, 'INVALID_KEY');
    }

    const parts = key.split('/');
    const ownerProfileId = parts[1];
    const isStaffOrLeadership =
      (RoleHierarchy[req.user.role as UserRole] ?? 0) >= RoleHierarchy[UserRole.ABELHA_PRINCESA];

    if (ownerProfileId !== req.user.profile?.id && !isStaffOrLeadership) {
      throw new AppError('Sem permissão para acessar este comprovante privado.', 403, 'FORBIDDEN');
    }

    const file = await storageService.fetchPrivateObject(key);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.status(200).send(file.buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
