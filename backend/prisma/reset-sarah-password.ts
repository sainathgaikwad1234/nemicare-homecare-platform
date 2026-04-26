import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

(async () => {
  const password = 'Sarah@123456';
  const hash = await bcrypt.hash(password, 10);
  const u = await (prisma as any).user.update({
    where: { email: 'sarah.johnson@nemicare.test' },
    data: { passwordHash: hash, active: true },
  });
  console.log(`Reset password for ${u.email} -> ${password}`);
  await prisma.$disconnect();
})();
