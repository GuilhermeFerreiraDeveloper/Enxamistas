import { NextFunction, Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { AppError } from '../errors/AppError';

const courseService = new CourseService();

export class CourseController {
  async getAllCourses(_req: Request, res: Response, next: NextFunction) {
    try {
      const courses = await courseService.getAllCourses();
      res.status(200).json(courses);
    } catch (error) {
      next(error);
    }
  }

  async getCourseById(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await courseService.getCourseById(req.params.id);
      if (!course) {
        throw new AppError('Curso não encontrado', 404, 'COURSE_NOT_FOUND');
      }
      res.status(200).json(course);
    } catch (error) {
      next(error);
    }
  }

  async getCourseStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const students = await courseService.getCourseStudents(req.params.id);
      res.status(200).json(students);
    } catch (error) {
      next(error);
    }
  }

  async getTeachers(_req: Request, res: Response, next: NextFunction) {
    try {
      const teachers = await courseService.getTeachers();
      res.status(200).json(teachers);
    } catch (error) {
      next(error);
    }
  }
}
