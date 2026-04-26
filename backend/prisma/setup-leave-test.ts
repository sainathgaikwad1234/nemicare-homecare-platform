import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  // Find Sarah's existing or create future shifts for tomorrow + day after
  const sarah = await (prisma as any).employee.findFirst({ where: { firstName: 'Sarah' } });
  if (!sarah) { console.log('Sarah not found'); process.exit(1); }

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0);
  const dayAfter = new Date(); dayAfter.setDate(dayAfter.getDate() + 2); dayAfter.setHours(0,0,0,0);

  // Clean previous test shifts in those days
  await (prisma as any).shiftSchedule.deleteMany({
    where: { employeeId: sarah.id, shiftDate: { in: [tomorrow, dayAfter] } },
  });

  await (prisma as any).shiftSchedule.createMany({
    data: [
      { companyId: sarah.companyId, facilityId: sarah.facilityId, employeeId: sarah.id, shiftDate: tomorrow, shiftType: 'FIRST', startTime: '9:00 AM', endTime: '8:00 PM', status: 'SCHEDULED', createdById: 1 },
      { companyId: sarah.companyId, facilityId: sarah.facilityId, employeeId: sarah.id, shiftDate: dayAfter, shiftType: 'FIRST', startTime: '9:00 AM', endTime: '8:00 PM', status: 'SCHEDULED', createdById: 1 },
    ],
  });

  // Create a leave request that's already supervisor-approved (so HR can approve it next)
  const lr = await (prisma as any).leaveRequest.create({
    data: {
      companyId: sarah.companyId,
      employeeId: sarah.id,
      leaveType: 'PERSONAL',
      fromDate: tomorrow,
      toDate: dayAfter,
      totalDays: 2,
      reason: 'Test — verify roster block on HR approve',
      status: 'PENDING',
      supervisorApprovalStatus: 'APPROVED',
      supervisorApprovedById: 1,
      supervisorApprovedAt: new Date(),
      hrApprovalStatus: 'PENDING',
    },
  });

  console.log(`Leave request id=${lr.id} created, dates ${tomorrow.toISOString().slice(0,10)} - ${dayAfter.toISOString().slice(0,10)}`);
  console.log(`Pre-approval shifts:`);
  const before = await (prisma as any).shiftSchedule.findMany({
    where: { employeeId: sarah.id, shiftDate: { in: [tomorrow, dayAfter] } },
    select: { id: true, shiftDate: true, status: true },
  });
  for (const s of before) console.log(`  shift ${s.id} ${s.shiftDate.toISOString().slice(0,10)} → status=${s.status}`);
  await prisma.$disconnect();
})();
