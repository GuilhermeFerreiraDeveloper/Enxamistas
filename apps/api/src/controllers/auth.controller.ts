import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '@enxamistas/shared';
import { env } from '../config/env';

const authService = new AuthService();

function getCookieOptions() {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const token = await authService.register(validatedData);

      res.cookie('token', token, getCookieOptions());
      res.status(201).json({ message: 'Usuário criado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const token = await authService.login(validatedData);

      res.cookie('token', token, getCookieOptions());
      res.status(200).json({ message: 'Login realizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response) {
    const isProd = env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    });
    res.status(200).json({ message: 'Logout realizado com sucesso' });
  }

  async me(req: any, res: Response) {
    res.status(200).json({ user: req.user });
  }
}
