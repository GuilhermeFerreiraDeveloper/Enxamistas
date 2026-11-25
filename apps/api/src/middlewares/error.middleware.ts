import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function errorMiddleware(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return res.status(400).json({
      error: firstIssue?.message || 'Dados de entrada inválidos',
      code: 'VALIDATION_ERROR',
    });
  }

  // Prisma known error codes without leaking SQL/internal schema details
  if (err?.code === 'P2002') {
    return res.status(409).json({
      error: 'Registro já existente.',
      code: 'CONFLICT',
    });
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro não encontrado.',
      code: 'NOT_FOUND',
    });
  }

  console.error('[API_ERROR]', err?.message || err);
  return res.status(500).json({
    error: 'Erro interno do servidor.',
    code: 'INTERNAL_ERROR',
  });
}
