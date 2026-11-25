import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { RegisterInput, LoginInput } from '@enxamistas/shared';
import { AppError } from '../errors/AppError';
import { AuditService } from './audit.service';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { passport: data.passport },
    });

    if (existingUser) {
      throw new AppError('Passaporte já cadastrado', 409, 'PASSPORT_EXISTS');
    }

    const mainCourse = await prisma.course.findUnique({
      where: { id: data.mainCourseId },
    });

    if (!mainCourse) {
      throw new AppError('Curso principal não encontrado', 400, 'COURSE_NOT_FOUND');
    }

    const hashedPassword = await argon2.hash(data.password);

    const user = await prisma.user.create({
      data: {
        passport: data.passport,
        password: hashedPassword,
        profile: {
          create: {
            name: data.name,
            mainCourseId: data.mainCourseId,
            enrollments: {
              create: {
                courseId: data.mainCourseId,
                type: 'MAIN',
              },
            },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    await AuditService.log(user.id, 'AUTH_REGISTER', 'User', {
      passport: user.passport,
      mainCourseId: data.mainCourseId,
    });

    return this.generateToken(user.id);
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { passport: data.passport },
    });

    if (!user) {
      throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
    }

    if (user.isSuspended) {
      throw new AppError(
        user.suspendedReason
          ? `Conta suspensa: ${user.suspendedReason}`
          : 'Sua conta está suspensa e impedida de acessar o portal.',
        403,
        'ACCOUNT_SUSPENDED'
      );
    }

    const isValidPassword = await argon2.verify(user.password, data.password);

    if (!isValidPassword) {
      throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
    }

    await AuditService.log(user.id, 'AUTH_LOGIN', 'User', { passport: user.passport });

    return this.generateToken(user.id);
  }

  private generateToken(userId: string) {
    return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '7d' });
  }
}
