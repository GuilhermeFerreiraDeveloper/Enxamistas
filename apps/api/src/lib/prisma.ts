import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const logLevels: ('query' | 'info' | 'warn' | 'error')[] =
  process.env.PRISMA_LOG_QUERIES === 'true'
    ? ['query', 'warn', 'error']
    : process.env.NODE_ENV === 'production'
      ? ['error']
      : ['warn', 'error'];

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
