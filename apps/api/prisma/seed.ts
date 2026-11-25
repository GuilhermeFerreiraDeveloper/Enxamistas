import { PrismaClient, UserRole } from '@prisma/client';
import { RoleHierarchy, RoleLabels } from '@enxamistas/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Enxamistas database...');

  // 1. Roles & Permissions (RBAC)
  const rolesList = Object.values(UserRole);
  for (const roleCode of rolesList) {
    await prisma.role.upsert({
      where: { code: roleCode },
      update: {
        name: RoleLabels[roleCode],
        level: RoleHierarchy[roleCode],
        isSystem: true,
      },
      create: {
        code: roleCode,
        name: RoleLabels[roleCode],
        level: RoleHierarchy[roleCode],
        isSystem: true,
        description: `Cargo institucional ${RoleLabels[roleCode]}`,
      },
    });
  }

  const defaultPermissions = [
    { code: 'admin.access', name: 'Acessar painel administrativo', module: 'admin' },
    { code: 'roles.manage', name: 'Gerir cargos e permissões', module: 'admin' },
    { code: 'members.moderate', name: 'Suspender e moderar membros', module: 'admin' },
    { code: 'events.manage', name: 'Criar, editar e cancelar eventos', module: 'events' },
    { code: 'calendar.manage', name: 'Gerir calendário institucional', module: 'calendar' },
    { code: 'academic.manage', name: 'Gerir aulas, materiais, presenças e conclusões', module: 'academic' },
    { code: 'medals.emit', name: 'Emitir medalhas e conquistas', module: 'medals' },
    { code: 'feed.moderate', name: 'Moderar feed, comentários e denúncias', module: 'feed' },
    { code: 'announcements.manage', name: 'Gerir avisos institucionais', module: 'announcements' },
    { code: 'gallery.manage', name: 'Gerir galeria e solicitações de mansões', module: 'gallery' },
    { code: 'radio.manage', name: 'Gerir faixas e playlists da rádio', module: 'radio' },
    { code: 'highlights.manage', name: 'Definir Enxamista do mês', module: 'highlights' },
    { code: 'settings.manage', name: 'Alterar configurações institucionais', module: 'admin' },
  ];

  for (const perm of defaultPermissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module },
      create: perm,
    });
  }

  const leadershipRoles = [UserRole.STAFF_ZANGAO, UserRole.ABELHA_RAINHA, UserRole.ABELHA_PRINCESA];
  const allPerms = await prisma.permission.findMany();
  for (const rCode of leadershipRoles) {
    const role = await prisma.role.findUnique({ where: { code: rCode } });
    if (!role) continue;
    for (const perm of allPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  // 2. Cursos e horários obrigatórios (18 disciplinas, 20 ocorrências)
  const coursesData = [
    // Domingo
    { name: 'Técnicas de Espionagem', teacher: 'Anastasia Volkova', day: 0, time: '17:00' },
    { name: 'Demonologia', teacher: 'Astrid Castro', day: 0, time: '17:00' },
    { name: 'Dança', teacher: 'Rave Mars', day: 0, time: '20:00' },
    { name: 'Ocultismo', teacher: 'Minako Mars', day: 0, time: '20:00' },
    { name: 'Educação Física', teacher: 'John Maverick', day: 0, time: '20:00' },
    { name: 'Bruxaria Natural', teacher: 'Glendah Vance', day: 0, time: '20:30' },
    { name: 'Investigação', teacher: 'Alex Putin Martinet', day: 0, time: '20:30' },
    // Segunda
    { name: 'Engenharia Mecânica', teacher: 'John Maverick', day: 1, time: '20:00' },
    { name: 'Moda', teacher: 'Dante Blight', day: 1, time: '20:00' },
    { name: 'Design Gráfico', teacher: 'Rochelle dos Eventos', day: 1, time: '20:30' },
    { name: 'Demonologia', teacher: 'Astrid Castro', day: 1, time: '22:00' },
    { name: 'Parapsicologia', teacher: 'Anastasia Volkova', day: 1, time: '22:00' },
    // Terça
    { name: 'Japonês', teacher: 'Yuta Kunimoto', day: 2, time: '20:00' },
    // Quarta
    { name: 'Artes Performáticas', teacher: 'Simone Terremoto', day: 3, time: '20:00' },
    { name: 'Educação Física', teacher: 'John Maverick', day: 3, time: '20:00' },
    { name: 'Artes', teacher: 'Zoe Saito', day: 3, time: '20:30' },
    { name: 'Direito', teacher: 'Paula Rae', day: 3, time: '21:00' },
    { name: 'Etiqueta', teacher: 'Esmeralda Fontinelle', day: 3, time: '21:30' },
    { name: 'Sexologia', teacher: 'Leviatá Mortandade', day: 3, time: '22:00' },
    { name: 'Jornalismo', teacher: 'Lara Coff', day: 3, time: '23:00' },
  ];

  for (const item of coursesData) {
    let teacher = await prisma.teacher.findFirst({
      where: { name: item.teacher },
    });

    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: { name: item.teacher },
      });
    }

    let course = await prisma.course.findFirst({
      where: { name: item.name },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          name: item.name,
          teacherId: teacher.id,
          description: `Disciplina oficial ministrada por ${item.teacher} na fundação acadêmica dos Enxamistas.`,
        },
      });
    }

    const existingSchedule = await prisma.classSchedule.findFirst({
      where: {
        courseId: course.id,
        dayOfWeek: item.day,
        startTime: item.time,
      },
    });

    if (!existingSchedule) {
      await prisma.classSchedule.create({
        data: {
          courseId: course.id,
          dayOfWeek: item.day,
          startTime: item.time,
        },
      });
    }

    // Medalha padrão do curso
    await prisma.courseMedal.upsert({
      where: { courseId: course.id },
      update: {},
      create: {
        courseId: course.id,
        name: `Mérito em ${item.name}`,
        description: `Concedida aos membros que concluíram com distinção a disciplina de ${item.name}.`,
        icon: 'award',
        criteria: 'Participação ativa, presenças validadas e aprovação do docente responsável.',
      },
    });
  }

  // 3. Mansões iniciais (Álbuns institucionais)
  const mansions = [
    {
      slug: 'mansao-real',
      name: 'Mansão Real',
      location: 'Vinewood Hills',
      typeLabel: 'SEDE PRINCIPAL',
      description:
        'O epicentro do poder dos Enxamistas. Localizada estrategicamente, oferece luxo e segurança máxima para as operações da alta cúpula.',
      features: ['Sala de Guerra', 'Heliponto Privado', 'Segurança 24h', 'Salão de Cerimônias'],
    },
    {
      slug: 'refugio-da-montanha',
      name: 'Refúgio da Montanha',
      location: 'Mount Chiliad Base',
      typeLabel: 'TREINAMENTO',
      description:
        'Um local discreto para operações que exigem silêncio e foco absoluto. O centro de treinamento avançado da organização.',
      features: ['Centro Tático', 'Garagem Oculta', 'Vista Estratégica', 'Arquivo Reservado'],
    },
  ];

  for (const m of mansions) {
    await prisma.album.upsert({
      where: { slug: m.slug },
      update: {},
      create: {
        slug: m.slug,
        name: m.name,
        description: m.description,
        category: 'MANSION',
        location: m.location,
        typeLabel: m.typeLabel,
        features: m.features,
        isMansion: true,
      },
    });
  }

  // 4. Conquistas automáticas base
  const achievements = [
    {
      name: 'Primeira Presença Validada',
      description: 'Teve seu primeiro comprovante de aula validado pela academia.',
      icon: 'check-circle',
      category: 'ACADEMIC',
      type: 'AUTO',
      criteria: 'Validar ao menos 1 presença em aula.',
    },
    {
      name: 'Primeira Formação Concluída',
      description: 'Concluiu oficialmente sua primeira disciplina na colmeia.',
      icon: 'award',
      category: 'ACADEMIC',
      type: 'AUTO',
      criteria: 'Obter 1 conclusão oficial de curso.',
    },
    {
      name: 'Presença em Evento',
      description: 'Confirmou participação em um evento oficial da organização.',
      icon: 'calendar',
      category: 'EVENTS',
      type: 'AUTO',
      criteria: 'Confirmar presença (RSVP) em 1 evento.',
    },
    {
      name: 'Contribuidor de Projetos',
      description: 'Publicou um projeto relevante para a comunidade Enxamistas.',
      icon: 'sparkles',
      category: 'PROJECTS',
      type: 'AUTO',
      criteria: 'Cadastrar 1 projeto aprovado/ativo.',
    },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { name: ach.name },
      update: {},
      create: ach,
    });
  }

  // 5. Configurações institucionais iniciais
  const defaultSettings = [
    { key: 'guestbook_public', value: 'true' },
    { key: 'social_instagram', value: '' },
    { key: 'social_discord', value: '' },
    { key: 'social_twitter', value: '' },
    { key: 'lore_origin', value: 'Nascida nas sombras e forjada na união, a organização Enxamistas surgiu como um refúgio para aqueles que buscavam excelência e lealdade absoluta no universo RP.' },
    { key: 'lore_philosophy', value: 'Acreditamos que o conhecimento é a arma mais poderosa. Através da nossa fundação acadêmica, cultivamos disciplina, mistério e elegância estratégica.' },
    { key: 'lore_culture', value: 'Cada membro conhece seu papel na colmeia: respeito à hierarquia, aprimoramento técnico contínuo e proteção mútua.' },
    { key: 'lore_objectives', value: 'Consolidar influência, formar especialistas em múltiplas áreas e manter o mais alto padrão institucional da cidade.' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
