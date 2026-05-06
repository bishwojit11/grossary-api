import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!',
    12,
  );

  await prisma.user.upsert({
    where: { email: 'admin@grosery.local' },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      email: 'admin@grosery.local',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.info('Seed: admin user ensured (admin@grosery.local).');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
