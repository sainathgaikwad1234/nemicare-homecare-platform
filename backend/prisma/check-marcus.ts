import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const u = await (p as any).user.findUnique({ where: { email: 'marcus.chen@nemicare.test' }, include: { employee: true } });
  console.log(JSON.stringify(u, null, 2));
  await p.$disconnect();
})();
