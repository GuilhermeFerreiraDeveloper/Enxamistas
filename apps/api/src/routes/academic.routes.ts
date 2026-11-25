import { Router } from 'express';
import { AcademicController } from '../controllers/academic.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/role.middleware';
import { UserRole } from '@enxamistas/shared';

const router = Router();
const academicController = new AcademicController();

router.post('/enroll', authMiddleware, academicController.enroll);
router.delete('/enroll/:courseId', authMiddleware, academicController.dropSecondary);
router.get('/my-enrollments', authMiddleware, academicController.getMyEnrollments);
router.post('/proofs', authMiddleware, academicController.submitProof);

// Teacher / Leadership routes
router.post(
  '/courses/:courseId/sessions',
  authMiddleware,
  permissionMiddleware('academic.manage', UserRole.ABELHA_PRINCESA),
  academicController.createSession
);
router.get('/courses/:courseId/sessions', authMiddleware, academicController.getSessions);
router.post(
  '/proofs/:proofId/validate',
  authMiddleware,
  permissionMiddleware('academic.manage', UserRole.ABELHA_PRINCESA),
  academicController.validateProof
);
router.post(
  '/courses/:courseId/materials',
  authMiddleware,
  permissionMiddleware('academic.manage', UserRole.ABELHA_PRINCESA),
  academicController.addMaterial
);
router.delete(
  '/materials/:materialId',
  authMiddleware,
  permissionMiddleware('academic.manage', UserRole.ABELHA_PRINCESA),
  academicController.deleteMaterial
);
router.post(
  '/courses/:courseId/complete',
  authMiddleware,
  permissionMiddleware('academic.manage', UserRole.ABELHA_PRINCESA),
  academicController.completeCourse
);
router.get('/courses/:courseId/completions', authMiddleware, academicController.getCourseCompletions);

export default router;
