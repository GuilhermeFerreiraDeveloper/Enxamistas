import { prisma } from '../lib/prisma';

export class AuditService {
  static async log(userId: string | null, action: string, resource: string, details?: any) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}
