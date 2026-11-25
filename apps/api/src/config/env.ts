import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET;

if (nodeEnv === 'production' && (!jwtSecret || jwtSecret === 'your-super-secret-key-change-it-in-production')) {
  throw new Error('FATAL: JWT_SECRET inseguro ou ausente em ambiente de produção.');
}

if (!jwtSecret || jwtSecret === 'your-super-secret-key-change-it-in-production') {
  console.warn('WARNING: JWT_SECRET não configurado ou usando valor padrão de exemplo.');
}

if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL is not defined in environment variables.');
}

export const env = {
  NODE_ENV: nodeEnv,
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',
  JWT_SECRET: jwtSecret || 'dev-only-insecure-secret-replace-in-env',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT || '',
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || '',
  STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY || '',
  STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY || '',
};
