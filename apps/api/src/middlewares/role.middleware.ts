import { Response, NextFunction } from 'express';
import { UserRole, RoleHierarchy } from '@enxamistas/shared';
import { prisma } from '../lib/prisma';

export const roleMiddleware = (requiredRole: UserRole) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const userRoleValue = RoleHierarchy[user.role as UserRole] ?? 0;
    const requiredRoleValue = RoleHierarchy[requiredRole];

    if (userRoleValue < requiredRoleValue) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }

    next();
  };
};

export const permissionMiddleware = (permissionCode: string, fallbackMinRole?: UserRole) => {
  return async (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (Array.isArray(user.permissions) && user.permissions.includes(permissionCode)) {
      return next();
    }

    // Check DB RolePermission mapped to primary role code
    const dbMatch = await prisma.rolePermission.findFirst({
      where: {
        role: { code: user.role },
        permission: { code: permissionCode },
      },
    });

    if (dbMatch) {
      return next();
    }

    if (fallbackMinRole) {
      const userRoleValue = RoleHierarchy[user.role as UserRole] ?? 0;
      if (userRoleValue >= RoleHierarchy[fallbackMinRole]) {
        return next();
      }
    }

    return res.status(403).json({ error: 'Permissão insuficiente para esta operação' });
  };
};
