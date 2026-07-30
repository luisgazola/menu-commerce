import { PrismaClient, RecordStatus, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@local.test').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@123456';
  const name = process.env.ADMIN_NAME ?? 'Administrador';

  const passwordHash = await argon2.hash(password);

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: UserRole.ADMIN, status: RecordStatus.ACTIVE },
    create: { name, email, passwordHash, role: UserRole.ADMIN, status: RecordStatus.ACTIVE }
  });

  console.log(`Administrador disponível em ${email}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
