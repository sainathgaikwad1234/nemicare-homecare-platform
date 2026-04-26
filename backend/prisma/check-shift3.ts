import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const s = await (p as any).shiftSchedule.findUnique({ where: { id: 3 } });
  console.log(`  shift 3: type=${s.shiftType}  date=${s.shiftDate.toISOString().slice(0,10)}  status=${s.status}`);
  await p.$disconnect();
})();
