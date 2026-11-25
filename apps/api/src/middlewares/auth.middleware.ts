import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

async function loadAuthenticatedUser(token: string) {
  const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      passport: true,
      role: true,
      isSuspended: true,
      suspendedReason: true,
      profile: true,
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  return user;
}

export const authMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const user = await loadAuthenticatedUser(token);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: user.suspendedReason
          ? `Conta suspensa: ${user.suspendedReason}`
          : 'Sua conta está suspensa e não pode interagir.',
      });
    }

    const permissionSet = new Set<string>();
    for (const assignment of user.userRoles || []) {
      for (const rp of assignment.role.rolePermissions || []) {
        permissionSet.add(rp.permission.code);
      }
    }

    req.user = {
      ...user,
      permissions: Array.from(permissionSet),
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const optionalAuthMiddleware = async (req: any, _res: Response, next: NextFunction) => {
  const token = req.cookies?.token;
  if (!token) {
    return next();
  }

  try {
    const user = await loadAuthenticatedUser(token);
    if (user && !user.isSuspended) {
      req.user = user;
    }
  } catch {
    // Ignore invalid optional token for public routes
  }
  return next();
};
