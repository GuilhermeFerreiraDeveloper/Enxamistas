const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const argon2 = require('argon2');

const shared = require('@enxamistas/shared');
const { prisma } = require('../dist/lib/prisma.js');
const { AuthService } = require('../dist/services/auth.service.js');
const { AdminService } = require('../dist/services/admin.service.js');
const { AcademicService } = require('../dist/services/academic.service.js');
const { EventService } = require('../dist/services/event.service.js');
const { ChatService } = require('../dist/services/chat.service.js');
const { StorageService } = require('../dist/services/storage.service.js');
const { roleMiddleware } = require('../dist/middlewares/role.middleware.js');

describe('Enxamistas Critical Suite', () => {
  const authService = new AuthService();
  const adminService = new AdminService();
  const academicService = new AcademicService();
  const eventService = new EventService();
  const chatService = new ChatService();

  beforeEach(() => {
    prisma.auditLog.create = async () => ({ id: 'audit-1' });
    prisma.notification.create = async () => ({ id: 'notif-1' });
    prisma.notificationPreference.findUnique = async () => null;
    prisma.profile.findMany = async () => [];
    prisma.achievement.findUnique = async () => null;
  });

  it('Shared Zod schemas enforce mandatory mainCourseId and guestbook limit', () => {
    assert.throws(() =>
      shared.registerSchema.parse({
        name: 'John',
        passport: '101',
        password: 'password123',
        mainCourseId: '',
      })
    );

    assert.throws(() =>
      shared.guestbookSchema.parse({
        content: 'a'.repeat(401),
      })
    );

    const valid = shared.registerSchema.parse({
      name: 'John Maverick',
      passport: '101',
      password: 'password123',
      mainCourseId: 'course-1',
    });
    assert.equal(valid.passport, '101');
  });

  it('AuthService blocks duplicate passport and invalid mainCourseId', async () => {
    prisma.user.findUnique = async () => ({ id: 'u1', passport: '101' });
    await assert.rejects(
      () =>
        authService.register({
          name: 'Maverick',
          passport: '101',
          password: 'password123',
          mainCourseId: 'c1',
        }),
      /Passaporte já cadastrado/
    );

    prisma.user.findUnique = async () => null;
    prisma.course.findUnique = async () => null;
    await assert.rejects(
      () =>
        authService.register({
          name: 'Maverick',
          passport: '102',
          password: 'password123',
          mainCourseId: 'non-existent',
        }),
      /Curso principal não encontrado/
    );
  });

  it('AuthService hashes password with Argon2, assigns CONVIDADO default, and blocks suspended user on login', async () => {
    let createdPayload = null;
    prisma.user.findUnique = async () => null;
    prisma.course.findUnique = async () => ({ id: 'c1', name: 'Espionagem' });
    prisma.user.create = async (args) => {
      createdPayload = args.data;
      return { id: 'u2', passport: args.data.passport, role: 'CONVIDADO', profile: { id: 'p2' } };
    };

    const token = await authService.register({
      name: 'New Recruit',
      passport: '200',
      password: 'secretPassword',
      mainCourseId: 'c1',
    });

    assert.ok(token.length > 10);
    assert.notEqual(createdPayload.password, 'secretPassword');
    assert.ok(createdPayload.password.startsWith('$argon2'));
    assert.equal(createdPayload.profile.create.enrollments.create.type, 'MAIN');

    const hash = await argon2.hash('secretPassword');
    prisma.user.findUnique = async () => ({
      id: 'u2',
      passport: '200',
      password: hash,
      isSuspended: true,
      suspendedReason: 'Conduta inadequada',
    });

    await assert.rejects(
      () => authService.login({ passport: '200', password: 'secretPassword' }),
      /Conta suspensa/
    );
  });

  it('RBAC middleware blocks CONVIDADO from leadership routes and AdminService blocks self-role alteration', async () => {
    const middleware = roleMiddleware(shared.UserRole.ABELHA_PRINCESA);
    let statusCode = 200;
    let passed = false;

    middleware(
      { user: { id: 'u1', role: shared.UserRole.CONVIDADO } },
      {
        status(code) {
          statusCode = code;
          return { json() {} };
        },
      },
      () => {
        passed = true;
      }
    );

    assert.equal(passed, false);
    assert.equal(statusCode, 403);

    await assert.rejects(
      () =>
        adminService.changeUserRole(
          'u1',
          { role: shared.UserRole.STAFF_ZANGAO },
          'u1',
          shared.UserRole.ABELHA_RAINHA
        ),
      /próprio cargo/
    );
  });

  it('AcademicService enforces proof privacy, rejection reason, and prevents duplicate medals', async () => {
    let capturedWhere = null;
    prisma.classSession.findMany = async (args) => {
      capturedWhere = args.include.proofs.where;
      return [];
    };

    await academicService.getSessions('c1', 'prof-1', shared.UserRole.CONVIDADO);
    assert.deepEqual(capturedWhere, { profileId: 'prof-1' });

    await academicService.getSessions('c1', 'prof-admin', shared.UserRole.ABELHA_PRINCESA);
    assert.equal(capturedWhere, undefined);

    await assert.rejects(
      () => academicService.validateProof('proof-1', 'REJECTED', '', 'rev-1', 'u-rev'),
      /motivo/
    );

    prisma.course.findUnique = async () => ({ id: 'c1', name: 'Dança', requiredAttendance: 2, medal: { id: 'm1' } });
    prisma.courseEnrollment.findUnique = async () => ({ id: 'en1', status: 'ACTIVE' });
    prisma.lessonProof.count = async () => 1;

    await assert.rejects(
      () => academicService.completeCourse('c1', 'prof-1', 'APPROVED', '', true, 'rev-1', 'u-rev'),
      /presença\(s\) validada\(s\)/
    );
  });

  it('EventService blocks duplicate RSVP, capacity overflow, and cancelled events', async () => {
    prisma.$transaction = async (fn) => fn(prisma);

    prisma.event.findUnique = async () => ({ id: 'e1', status: 'CANCELLED', limit: 10 });
    prisma.eventAttendee.findUnique = async () => null;
    await assert.rejects(() => eventService.rsvp('e1', 'p1', 'CONFIRMED'), /cancelado/);

    prisma.event.findUnique = async () => ({ id: 'e1', status: 'SCHEDULED', limit: 1 });
    prisma.eventAttendee.findUnique = async () => ({ id: 'r1', status: 'CONFIRMED' });
    await assert.rejects(() => eventService.rsvp('e1', 'p1', 'CONFIRMED'), /já está confirmada/);

    prisma.eventAttendee.findUnique = async () => null;
    prisma.eventAttendee.count = async () => 1;
    await assert.rejects(() => eventService.rsvp('e1', 'p2', 'CONFIRMED'), /Limite de participantes/);
  });

  it('ChatService prevents IDOR cross-access for non-participants', async () => {
    prisma.conversationMember.findUnique = async () => null;
    await assert.rejects(() => chatService.getMessages('conv-secret', 'intruder-profile'), /não tem acesso/);
    await assert.rejects(
      () => chatService.sendMessage('conv-secret', 'intruder-profile', { content: 'hi' }),
      /não tem acesso/
    );
  });

  it('StorageService validates file types/magic bytes and reports clearly when S3 is unconfigured', async () => {
    const storage = new StorageService();
    assert.throws(
      () => storage.validateFile('proofs', 'text/plain', Buffer.from('not-an-image')),
      /Tipo de arquivo não permitido/
    );
    assert.throws(
      () => storage.validateFile('proofs', 'image/png', Buffer.from('fake-png-bytes')),
      /PNG válido/
    );

    await assert.rejects(
      () =>
        storage.uploadBuffer({
          scope: 'proofs',
          mimeType: 'image/png',
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          ownerId: 'p1',
        }),
      /Armazenamento externo S3 não configurado/
    );
  });
});
