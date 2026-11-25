import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '@enxamistas/shared';

const router = Router();
const controller = new AdminController();

router.use(authMiddleware, permissionMiddleware('admin.access', UserRole.ABELHA_PRINCESA));

router.get('/metrics', controller.metrics);
router.get('/members', controller.listMembers);
router.put(
  '/members/:userId/role',
  permissionMiddleware('roles.manage', UserRole.ABELHA_PRINCESA),
  controller.changeRole
);
router.put(
  '/members/:userId/suspend',
  permissionMiddleware('members.moderate', UserRole.ABELHA_PRINCESA),
  controller.suspendUser
);
router.put(
  '/profiles/:profileId/main-course',
  permissionMiddleware('academic.manage', UserRole.ABELHA_PRINCESA),
  controller.changeMainCourse
);

router.get('/roles', controller.getRoles);
router.post(
  '/roles',
  permissionMiddleware('roles.manage', UserRole.ABELHA_PRINCESA),
  controller.createRole
);
router.put(
  '/roles/:roleId/permissions',
  permissionMiddleware('roles.manage', UserRole.ABELHA_PRINCESA),
  controller.updateRolePermissions
);

router.get('/proofs/pending', controller.pendingProofs);
router.get('/reports', controller.listReports);
router.put('/reports/:id', controller.updateReport);
router.get('/key-requests', controller.listKeyRequests);
router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);
router.get('/audit-logs', controller.auditLogs);

export default router;
