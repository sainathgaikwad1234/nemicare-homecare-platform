import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  // Seed shifts for May 15-17 for several employees so coverage check has data
  const employees = await (p as any).employee.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    select: { id: true, companyId: true, facilityId: true, employeeIdNumber: true },
    orderBy: { id: 'asc' },
  });
  const empByIdNum: Record<string, any> = {};
  for (const e of employees) if (e.employeeIdNumber) empByIdNum[e.employeeIdNum || e.employeeIdNumber] = e;
  for (const e of employees) if (e.employeeIdNumber) empByIdNum[e.employeeIdNumber] = e;

  const dates = [new Date('2026-05-15'), new Date('2026-05-16'), new Date('2026-05-17')];
  for (const d of dates) d.setHours(0,0,0,0);

  // 1st shift: 5 employees per day; 2nd: 3; 3rd: 3
  const FIRST = ['EMP-001','EMP-002','EMP-003','EMP-007','EMP-008'];
  const SECOND = ['EMP-004','EMP-005','EMP-011'];
  const THIRD = ['EMP-006','EMP-012','EMP-013'];

  let inserted = 0;
  for (const date of dates) {
    for (const id of FIRST) {
      const emp = empByIdNum[id]; if (!emp) continue;
      const exists = await (p as any).shiftSchedule.findFirst({ where: { employeeId: emp.id, shiftDate: date }});
      if (exists) continue;
      await (p as any).shiftSchedule.create({
        data: { companyId: emp.companyId, facilityId: emp.facilityId, employeeId: emp.id, shiftDate: date, shiftType: 'FIRST', startTime: '9:00 AM', endTime: '8:00 PM', status: 'SCHEDULED', createdById: 1 },
      });
      inserted++;
    }
    for (const id of SECOND) {
      const emp = empByIdNum[id]; if (!emp) continue;
      const exists = await (p as any).shiftSchedule.findFirst({ where: { employeeId: emp.id, shiftDate: date }});
      if (exists) continue;
      await (p as any).shiftSchedule.create({ data: { companyId: emp.companyId, facilityId: emp.facilityId, employeeId: emp.id, shiftDate: date, shiftType: 'SECOND', startTime: '3:00 PM', endTime: '12:00 AM', status: 'SCHEDULED', createdById: 1 }});
      inserted++;
    }
    for (const id of THIRD) {
      const emp = empByIdNum[id]; if (!emp) continue;
      const exists = await (p as any).shiftSchedule.findFirst({ where: { employeeId: emp.id, shiftDate: date }});
      if (exists) continue;
      await (p as any).shiftSchedule.create({ data: { companyId: emp.companyId, facilityId: emp.facilityId, employeeId: emp.id, shiftDate: date, shiftType: 'THIRD', startTime: '12:00 AM', endTime: '9:00 AM', status: 'SCHEDULED', createdById: 1 }});
      inserted++;
    }
  }
  console.log(`Inserted ${inserted} shifts for May 15-17`);
  await p.$disconnect();
})();
