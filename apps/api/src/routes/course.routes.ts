import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const courseController = new CourseController();

router.get('/', courseController.getAllCourses);
router.get('/teachers', courseController.getTeachers);
router.get('/:id', courseController.getCourseById);
router.get('/:id/students', authMiddleware, courseController.getCourseStudents);

export default router;
