import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const users = await (prisma as any).user.findMany({
    where: { OR: [{ email: { contains: 'sarah' } }, { firstName: { contains: 'Sarah' } }] },
    select: { id: true, email: true, firstName: true, lastName: true, active: true },
  });
  console.log('users:', JSON.stringify(users, null, 2));
  const emp = await (prisma as any).employee.findFirst({
    where: { firstName: { contains: 'Sarah' } },
    select: { id: true, firstName: true, lastName: true, userId: true, status: true },
  });
  console.log('employee:', JSON.stringify(emp, null, 2));
  await prisma.$disconnect();
})();
