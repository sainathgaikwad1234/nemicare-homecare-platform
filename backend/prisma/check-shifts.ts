import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const shifts = await (prisma as any).shiftSchedule.findMany({
    where: { id: { in: [5, 6] } },
    select: { id: true, shiftDate: true, status: true, appliedLeaveRequestId: true },
  });
  for (const s of shifts) console.log(`  shift ${s.id} ${s.shiftDate.toISOString().slice(0,10)} → status=${s.status}  appliedLeaveRequestId=${s.appliedLeaveRequestId}`);
  await prisma.$disconnect();
})();
