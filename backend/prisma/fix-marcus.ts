import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const u = await (p as any).user.findUnique({ where: { email: 'marcus.chen@nemicare.test' }});
  if (!u) { console.log('No user'); process.exit(1); }
  const hireDate = new Date(); hireDate.setMonth(hireDate.getMonth() - 18); hireDate.setHours(9,0,0,0);
  const e = await (p as any).employee.create({
    data: {
      companyId: u.companyId, facilityId: u.facilityId, userId: u.id,
      firstName: 'Marcus', lastName: 'Chen', email: u.email,
      employeeIdNumber: 'EMP-002', designation: 'Registered Nurse',
      department: 'Clinical', clinicalRole: 'RN',
      userRole: 'EMPLOYEE', hrmsRole: 'EMPLOYEE',
      hireDate, hourlyRate: 35.00, baseSalary: 0, overtimeAllowed: true,
      employmentType: 'FULL_TIME', payFrequency: 'BIWEEKLY',
      status: 'ACTIVE', onboardingStatus: 'COMPLETED', onboardingStep: 3,
      officialStartDate: hireDate, ssn: '555-00-1234', activatedAt: new Date(),
    },
  });
  console.log(`Created Employee #${e.id} ${e.firstName} ${e.lastName}`);
  await p.$disconnect();
})();
