import express, { Router } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { prisma } from './lib/prisma';
import { securityHeadersMiddleware } from './middlewares/security.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import courseRoutes from './routes/course.routes';
import eventRoutes from './routes/event.routes';
import academicRoutes from './routes/academic.routes';
import medalRoutes from './routes/medal.routes';
import feedRoutes from './routes/feed.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import institutionalRoutes from './routes/institutional.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();

app.set('trust proxy', 1);
app.use(securityHeadersMiddleware);
app.use(
  cors({
    origin: env.FRONTEND_URL.split(',').map((s) => s.trim()),
    credentials: true,
  })
);

app.use('/api/uploads', uploadRoutes);
app.use('/api/v1/uploads', uploadRoutes);

app.use(express.json({ limit: '12mb' }));
app.use(cookieParser());

function buildApiRouter() {
  const api = Router();
  api.use('/auth', authRoutes);
  api.use('/profiles', profileRoutes);
  api.use('/courses', courseRoutes);
  api.use('/events', eventRoutes);
  api.use('/academic', academicRoutes);
  api.use('/medals', medalRoutes);
  api.use('/feed', feedRoutes);
  api.use('/chat', chatRoutes);
  api.use('/notifications', notificationRoutes);
  api.use('/admin', adminRoutes);
  api.use('/', institutionalRoutes);
  return api;
}

const apiRouter = buildApiRouter();
app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

// Health check
app.get('/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'unavailable';
  }

  res.status(200).json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

app.use(errorMiddleware);

export default app;
