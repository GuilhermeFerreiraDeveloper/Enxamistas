import { PrismaClient, UserRole } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passport = process.env.STAFF_PASSPORT || '1';
  const name = process.env.STAFF_NAME || 'Staff Zangão';
  const password = process.env.STAFF_PASSWORD;

  if (!password || password.length < 6) {
    throw new Error('Defina STAFF_PASSWORD (mínimo 6 caracteres) nas variáveis de ambiente.');
  }

  const course = await prisma.course.findFirst({ orderBy: { name: 'asc' } });
  if (!course) {
    throw new Error('Nenhum curso encontrado. Execute o seed antes de criar a conta Staff.');
  }

  const passwordHash = await argon2.hash(password);
  const staffRole = await prisma.role.findUnique({ where: { code: UserRole.STAFF_ZANGAO } });

  const existing = await prisma.user.findUnique({
    where: { passport },
    include: { profile: true },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        password: passwordHash,
        role: UserRole.STAFF_ZANGAO,
        isSuspended: false,
        suspendedAt: null,
        suspendedReason: null,
      },
      include: { profile: true },
    });

    if (staffRole) {
      await prisma.userRoleAssignment.upsert({
        where: { userId_roleId: { userId: updated.id, roleId: staffRole.id } },
        update: {},
        create: { userId: updated.id, roleId: staffRole.id },
      });
    }

    console.log(`STAFF_UPDATED passport=${updated.passport} role=${updated.role} name=${updated.profile?.name}`);
    return;
  }

  const created = await prisma.user.create({
    data: {
      passport,
      password: passwordHash,
      role: UserRole.STAFF_ZANGAO,
      profile: {
        create: {
          name,
          mainCourseId: course.id,
          enrollments: {
            create: {
              courseId: course.id,
              type: 'MAIN',
            },
          },
        },
      },
    },
    include: { profile: true },
  });

  if (staffRole) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: created.id, roleId: staffRole.id } },
      update: {},
      create: { userId: created.id, roleId: staffRole.id },
    });
  }

  console.log(`STAFF_CREATED passport=${created.passport} role=${created.role} name=${created.profile?.name} course=${course.name}`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
