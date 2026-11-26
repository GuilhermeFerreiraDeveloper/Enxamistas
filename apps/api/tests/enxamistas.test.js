const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const argon2 = require('argon2');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const shared = require('@enxamistas/shared');
const { prisma } = require('../dist/lib/prisma.js');
const { AuthService } = require('../dist/services/auth.service.js');
const { AdminService } = require('../dist/services/admin.service.js');
const { AcademicService } = require('../dist/services/academic.service.js');
const { EventService } = require('../dist/services/event.service.js');
const { ChatService } = require('../dist/services/chat.service.js');
const { StorageService } = require('../dist/services/storage.service.js');
const { CinematicService, extractYoutubeId } = require('../dist/services/cinematic.service.js');
const { InstitutionalService } = require('../dist/services/institutional.service.js');
const { roleMiddleware } = require('../dist/middlewares/role.middleware.js');

describe('Enxamistas Critical Suite', () => {
  const authService = new AuthService();
  const adminService = new AdminService();
  const academicService = new AcademicService();
  const eventService = new EventService();
  const chatService = new ChatService();
  const institutionalService = new InstitutionalService();

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

  it('Radio request service binds the authenticated profile/passport and rejects invalid URLs', async () => {
    const musicRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'enxamistas-radio-request-'));
    const previousMusicDir = process.env.RADIO_MUSIC_DIR;
    process.env.RADIO_MUSIC_DIR = musicRoot;

    try {
      prisma.profile.findUnique = async () => ({
        id: 'profile-1',
        user: { passport: '123456' },
      });
      prisma.radioPlaylist.findUnique = async () => ({ id: 'playlist-1', profileId: 'profile-1' });
      let created = null;
      prisma.radioTrack.create = async (args) => {
        created = args.data;
        return { id: 'track-1', ...args.data };
      };

      await institutionalService.createRadioRequest(
        { title: 'Musica Teste', artist: 'Artista Teste', referenceUrl: 'https://music.example.com/song' },
        'profile-1',
        'user-1'
      );

      assert.equal(created.authorId, 'profile-1');
      assert.equal(created.passport, '123456');
      assert.equal(created.status, 'SOLICITADA');
      assert.equal(fs.existsSync(path.join(musicRoot, '123456')), true);

      await assert.rejects(
        () => institutionalService.createRadioRequest(
          { title: 'Musica Teste', artist: 'Artista Teste', referenceUrl: 'ftp://example.com/song' },
          'profile-1',
          'user-1'
        ),
        /URL válida/
      );
    } finally {
      if (previousMusicDir === undefined) delete process.env.RADIO_MUSIC_DIR;
      else process.env.RADIO_MUSIC_DIR = previousMusicDir;
      fs.rmSync(musicRoot, { recursive: true, force: true });
    }
  });

  it('Radio member request history excludes accepted tracks moved to the playlist', async () => {
    let query;
    prisma.radioTrack.findMany = async (args) => {
      query = args;
      return [];
    };

    await institutionalService.getMyRadioRequests('profile-1');

    assert.equal(query.where.authorId, 'profile-1');
    assert.deepEqual(query.where.status, { not: 'ADICIONADA_PLAYLIST' });
  });

  it('Radio staff decisions link a selected library MP3 and notify only its member', async () => {
    const musicRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'enxamistas-radio-approval-'));
    const previousMusicDir = process.env.RADIO_MUSIC_DIR;
    process.env.RADIO_MUSIC_DIR = musicRoot;
    const selectedFilePath = '123456/Sunflower.mp3';
    fs.mkdirSync(path.dirname(path.join(musicRoot, selectedFilePath)), { recursive: true });
    fs.writeFileSync(path.join(musicRoot, selectedFilePath), 'audio');

    try {
      let requestStatus = 'SOLICITADA';
      let updated = null;
      let playlistEntry = null;
      const notifications = [];
      prisma.radioTrack.findUnique = async () => ({
        id: 'track-1',
        passport: '123456',
        authorId: 'profile-1',
        status: requestStatus,
        title: 'Musica Teste',
        artist: 'Artista Teste',
        author: { id: 'profile-1', name: 'Membro', user: { passport: '123456' } },
      });
      prisma.radioTrack.update = async (args) => {
        updated = args.data;
        requestStatus = args.data.status;
        return {
          id: 'track-1',
          authorId: 'profile-1',
          title: 'Musica Teste',
          artist: 'Artista Teste',
          ...args.data,
        };
      };
      prisma.radioPlaylist.findUnique = async () => ({ id: 'playlist-1', profileId: 'profile-1' });
      prisma.radioPlaylistTrack.findFirst = async () => null;
      prisma.radioPlaylistTrack.upsert = async (args) => {
        playlistEntry = args.create;
        return { id: 'playlist-track-1' };
      };
      prisma.notification.create = async (args) => {
        notifications.push(args.data);
        return { id: `notif-${notifications.length}` };
      };

      await assert.rejects(
        () => institutionalService.updateRadioRequestStatus(
          'track-1', 'ADICIONADA_PLAYLIST', 'staff-profile', 'staff-user'
        ),
        /Selecione um arquivo MP3/
      );
      assert.equal(requestStatus, 'SOLICITADA');

      await institutionalService.updateRadioRequestStatus(
        'track-1', 'ADICIONADA_PLAYLIST', 'staff-profile', 'staff-user', undefined, selectedFilePath
      );
      assert.equal(updated.reviewedById, 'staff-profile');
      assert.equal(updated.status, 'ADICIONADA_PLAYLIST');
      assert.equal(updated.filePath, selectedFilePath);
      assert.equal(playlistEntry.trackId, 'track-1');
      assert.equal(notifications[0].profileId, 'profile-1');
      assert.match(notifications[0].title, /aceito/);

      prisma.radioTrack.findMany = async () => [{
        title: 'Musica Teste',
        artist: 'Artista Teste',
        filePath: selectedFilePath,
        passport: '123456',
        author: { id: 'profile-1', name: 'Membro' },
      }];
      const radioLibrary = await institutionalService.getRadioData();
      const approvedRadioTrack = radioLibrary.tracks.find((item) => item.filePath === selectedFilePath);
      assert.equal(approvedRadioTrack.title, 'Musica Teste');
      assert.equal(approvedRadioTrack.artist, 'Artista Teste');
      assert.match(approvedRadioTrack.url, /radio\/library\/stream/);

      requestStatus = 'SOLICITADA';
      await institutionalService.updateRadioRequestStatus(
        'track-1', 'RECUSADA', 'staff-profile', 'staff-user', 'Direitos autorais'
      );
      assert.equal(updated.status, 'RECUSADA');
      assert.equal(updated.rejectionReason, 'Direitos autorais');
      assert.equal(notifications[1].profileId, 'profile-1');
      assert.match(notifications[1].content, /Direitos autorais/);

      await assert.rejects(
        () => institutionalService.updateRadioRequestStatus(
          'track-1', 'RECUSADA', 'staff-profile', 'staff-user'
        ),
        /já foi decidido/
      );
    } finally {
      if (previousMusicDir === undefined) delete process.env.RADIO_MUSIC_DIR;
      else process.env.RADIO_MUSIC_DIR = previousMusicDir;
      fs.rmSync(musicRoot, { recursive: true, force: true });
    }
  });

  it('Radio library recursively lists MP3 files and rejects paths outside its root', async () => {
    const musicRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'enxamistas-radio-'));
    const previousMusicDir = process.env.RADIO_MUSIC_DIR;
    process.env.RADIO_MUSIC_DIR = musicRoot;
    fs.mkdirSync(path.join(musicRoot, '4796'), { recursive: true });
    fs.mkdirSync(path.join(musicRoot, 'outro-membro'), { recursive: true });
    fs.writeFileSync(path.join(musicRoot, '4796', 'Sunflower.mp3'), 'audio');
    fs.writeFileSync(path.join(musicRoot, 'outro-membro', 'outra.MP3'), 'audio');
    fs.writeFileSync(path.join(musicRoot, 'nao-audio.txt'), 'ignored');
    prisma.radioTrack.findMany = async () => [];

    try {
      const result = await institutionalService.getRadioData();
      assert.deepEqual(result.tracks.map((track) => track.filePath), [
        '4796/Sunflower.mp3',
        'outro-membro/outra.MP3',
      ]);
      assert.match(result.tracks[0].url, /radio\/library\/stream/);
      assert.equal(
        await institutionalService.getRadioLibraryFile('4796/Sunflower.mp3'),
        path.join(musicRoot, '4796', 'Sunflower.mp3')
      );
      await assert.rejects(
        () => institutionalService.getRadioLibraryFile('../secret.mp3'),
        /Caminho da música inválido/
      );
    } finally {
      if (previousMusicDir === undefined) delete process.env.RADIO_MUSIC_DIR;
      else process.env.RADIO_MUSIC_DIR = previousMusicDir;
      fs.rmSync(musicRoot, { recursive: true, force: true });
    }
  });

  it('CinematicService validates YouTube links, video signatures, and 20 fraternity rules', async () => {
    const cinematicService = new CinematicService();

    assert.equal(shared.FRATERNITY_RULES.length, 20);
    assert.equal(shared.isLeadershipOrStaff(shared.UserRole.STAFF_ZANGAO), true);
    assert.equal(shared.isLeadershipOrStaff(shared.UserRole.ABELHA_PRINCESA), true);
    assert.equal(shared.isLeadershipOrStaff(shared.UserRole.ABELHA_OPERARIA), false);

    assert.equal(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
    assert.equal(extractYoutubeId('https://example.com/video.mp4'), null);

    await assert.rejects(
      () =>
        cinematicService.createYoutubeCinematic('prof-1', 'user-1', {
          title: 'Teste YouTube',
          youtubeUrl: 'https://vimeo.com/123456',
        }),
      /URL do YouTube inválida/
    );

    await assert.rejects(
      () =>
        cinematicService.createUploadedCinematic({
          authorProfileId: 'prof-1',
          actorUserId: 'user-1',
          title: 'Arquivo Falso',
          mimeType: 'video/mp4',
          buffer: Buffer.from('not-an-mp4-video-header'),
        }),
      /MP4\/MOV válido/
    );
  });
});
