import { prisma } from '../lib/prisma';

export class CourseService {
  async getAllCourses() {
    return prisma.course.findMany({
      include: {
        teacher: true,
        schedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        medal: true,
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            materials: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCourseById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        teacher: true,
        schedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        materials: {
          orderBy: { createdAt: 'desc' },
        },
        announcements: {
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
        },
        medal: true,
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            completions: true,
          },
        },
      },
    });
  }

  async getCourseStudents(courseId: string) {
    return prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            avatar: true,
            user: { select: { passport: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTeachers() {
    return prisma.teacher.findMany({
      include: {
        courses: {
          include: { schedules: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
