import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const u = await (p as any).user.findUnique({
    where: { email: 'admin@demo.nemicare.local' },
    include: { role: true },
  });
  console.log(`User: ${u.email}  role=${u.role.name}`);
  const perms = u.role.permissions as string[];
  console.log(`Permissions (${perms.length}):`);
  for (const p of perms) console.log(`  - ${p}`);
  await p.$disconnect();
})();
