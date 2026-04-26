import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const targetEmail = process.argv[2] || 'sarah.johnson@nemicare.test';
  const newPassword = process.argv[3] || 'Employee@123456';
  const hash = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { email: targetEmail },
    data: { passwordHash: hash, active: true },
  });
  console.log(`✓ Password set for ${user.email}: ${newPassword}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
