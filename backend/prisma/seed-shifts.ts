import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Realistic 24/7 staffing for the next 7 days
// 1st shift (9am-8pm): 5 employees | 2nd (3pm-12am): 3 | 3rd (12am-9am): 3
// Same employees rotate but distinct per day
const ROSTER: { day: number; employeeIdNumber: string; shiftType: 'FIRST' | 'SECOND' | 'THIRD'; startTime: string; endTime: string }[] = [];

const FIRST_POOL  = ['EMP-001','EMP-002','EMP-003','EMP-007','EMP-008','EMP-009','EMP-010']; // 7 names rotate to fill 5 slots/day
const SECOND_POOL = ['EMP-004','EMP-005','EMP-011'];
const THIRD_POOL  = ['EMP-006','EMP-012','EMP-013'];

const SHIFT_TIMES = {
  FIRST:  { start: '9:00 AM',  end: '8:00 PM' },
  SECOND: { start: '3:00 PM',  end: '12:00 AM' },
  THIRD:  { start: '12:00 AM', end: '9:00 AM' },
} as const;

for (let day = 0; day < 7; day++) {
  // Pick 5 of 7 from FIRST_POOL by rotating offset
  for (let i = 0; i < 5; i++) {
    ROSTER.push({ day, employeeIdNumber: FIRST_POOL[(i + day) % FIRST_POOL.length], shiftType: 'FIRST', ...{ startTime: SHIFT_TIMES.FIRST.start, endTime: SHIFT_TIMES.FIRST.end }});
  }
  for (const id of SECOND_POOL) {
    ROSTER.push({ day, employeeIdNumber: id, shiftType: 'SECOND', startTime: SHIFT_TIMES.SECOND.start, endTime: SHIFT_TIMES.SECOND.end });
  }
  for (const id of THIRD_POOL) {
    ROSTER.push({ day, employeeIdNumber: id, shiftType: 'THIRD', startTime: SHIFT_TIMES.THIRD.start, endTime: SHIFT_TIMES.THIRD.end });
  }
}

(async () => {
  const today = new Date(); today.setHours(0,0,0,0);
  const employees = await (prisma as any).employee.findMany({ where: { deletedAt: null }, select: { id: true, employeeIdNumber: true, companyId: true, facilityId: true } });
  const empByIdNum = new Map(employees.filter((e: any) => e.employeeIdNumber).map((e: any) => [e.employeeIdNumber, e]));

  let inserted = 0, dupSkipped = 0;
  for (const r of ROSTER) {
    const emp = empByIdNum.get(r.employeeIdNumber);
    if (!emp) continue;
    const date = new Date(today);
    date.setDate(today.getDate() + r.day);

    // Don't double-create if a shift already exists for this employee + date
    const existing = await (prisma as any).shiftSchedule.findFirst({
      where: { employeeId: emp.id, shiftDate: date },
    });
    if (existing) { dupSkipped++; continue; }

    await (prisma as any).shiftSchedule.create({
      data: {
        companyId: emp.companyId,
        facilityId: emp.facilityId,
        employeeId: emp.id,
        shiftDate: date,
        shiftType: r.shiftType,
        startTime: r.startTime,
        endTime: r.endTime,
        status: 'SCHEDULED',
        createdById: 1,
      },
    });
    inserted++;
  }
  console.log(`Inserted ${inserted} shift(s); skipped ${dupSkipped} duplicate(s).`);

  // Summary: shifts per day per type
  for (let day = 0; day < 7; day++) {
    const date = new Date(today); date.setDate(today.getDate() + day);
    const start = new Date(date);
    const end = new Date(date); end.setHours(23,59,59,999);
    const shifts = await (prisma as any).shiftSchedule.findMany({
      where: { shiftDate: { gte: start, lte: end }, status: { in: ['SCHEDULED'] } },
    });
    const counts: Record<string, number> = { FIRST: 0, SECOND: 0, THIRD: 0 };
    for (const s of shifts) counts[s.shiftType]++;
    console.log(`  ${date.toISOString().slice(0,10)}: 1st=${counts.FIRST}  2nd=${counts.SECOND}  3rd=${counts.THIRD}  (mins 5/3/3)`);
  }
  await prisma.$disconnect();
})();
