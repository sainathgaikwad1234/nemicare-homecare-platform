import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const employees = await (p as any).employee.findMany({
    where: { deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true, employeeIdNumber: true,
      designation: true, department: true, status: true, onboardingStatus: true,
      facilityId: true, hourlyRate: true, hireDate: true, userRole: true,
    },
    orderBy: { id: 'asc' },
  });
  console.log(`Total employees: ${employees.length}\n`);
  for (const e of employees) {
    console.log(`  #${e.id} ${e.firstName} ${e.lastName}  id=${e.employeeIdNumber}  role=${e.userRole}  designation=${e.designation || '—'}  dept=${e.department || '—'}  rate=${e.hourlyRate || '—'}  onboard=${e.onboardingStatus}  status=${e.status}`);
  }
  const facilities = await (p as any).facility.findMany({ select: { id: true, name: true, companyId: true }});
  console.log('\nFacilities:');
  for (const f of facilities) console.log(`  #${f.id} ${f.name}`);
  await p.$disconnect();
})();
