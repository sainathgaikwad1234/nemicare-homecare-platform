import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface EmployeeSeed {
  email: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  clinicalRole?: string;
  userRole: 'EMPLOYEE' | 'SUPERVISOR' | 'HR_ADMIN';
  hourlyRate: number;
  employeeIdNumber: string;
  monthsBack: number;        // how many months ago they were hired
  overtimeAllowed: boolean;
  reportingManagerEmail?: string;  // resolved after first pass
}

const SEED: EmployeeSeed[] = [
  // RNs / LPNs
  { email: 'marcus.chen@nemicare.test',     firstName: 'Marcus',   lastName: 'Chen',      designation: 'Registered Nurse',    clinicalRole: 'RN',  department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 35.00, employeeIdNumber: 'EMP-002', monthsBack: 18, overtimeAllowed: true  },
  { email: 'priya.patel@nemicare.test',     firstName: 'Priya',    lastName: 'Patel',     designation: 'Licensed Practical Nurse', clinicalRole: 'LPN', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 27.50, employeeIdNumber: 'EMP-003', monthsBack: 14, overtimeAllowed: true  },
  { email: 'kenji.tanaka@nemicare.test',    firstName: 'Kenji',    lastName: 'Tanaka',    designation: 'Registered Nurse',    clinicalRole: 'RN',  department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 33.00, employeeIdNumber: 'EMP-004', monthsBack: 24, overtimeAllowed: true  },
  { email: 'david.lee@nemicare.test',       firstName: 'David',    lastName: 'Lee',       designation: 'Licensed Practical Nurse', clinicalRole: 'LPN', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 26.00, employeeIdNumber: 'EMP-005', monthsBack: 8,  overtimeAllowed: true  },
  { email: 'emma.wilson@nemicare.test',     firstName: 'Emma',     lastName: 'Wilson',    designation: 'Licensed Practical Nurse', clinicalRole: 'LPN', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 25.50, employeeIdNumber: 'EMP-006', monthsBack: 6,  overtimeAllowed: false },
  // CNAs (caregivers — OT allowed per MOM)
  { email: 'james.williams@nemicare.test',  firstName: 'James',    lastName: 'Williams',  designation: 'Certified Nursing Assistant', clinicalRole: 'CNA', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 18.00, employeeIdNumber: 'EMP-007', monthsBack: 12, overtimeAllowed: true },
  { email: 'aisha.brown@nemicare.test',     firstName: 'Aisha',    lastName: 'Brown',     designation: 'Certified Nursing Assistant', clinicalRole: 'CNA', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 17.50, employeeIdNumber: 'EMP-008', monthsBack: 9,  overtimeAllowed: true },
  { email: 'carlos.rodriguez@nemicare.test',firstName: 'Carlos',   lastName: 'Rodriguez', designation: 'Certified Nursing Assistant', clinicalRole: 'CNA', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 17.00, employeeIdNumber: 'EMP-009', monthsBack: 15, overtimeAllowed: true },
  { email: 'sofia.garcia@nemicare.test',    firstName: 'Sofia',    lastName: 'Garcia',    designation: 'Certified Nursing Assistant', clinicalRole: 'CNA', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 17.25, employeeIdNumber: 'EMP-010', monthsBack: 4,  overtimeAllowed: true },
  { email: 'olivia.martinez@nemicare.test', firstName: 'Olivia',   lastName: 'Martinez',  designation: 'Certified Nursing Assistant', clinicalRole: 'CNA', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 17.75, employeeIdNumber: 'EMP-011', monthsBack: 22, overtimeAllowed: true },
  { email: 'noah.anderson@nemicare.test',   firstName: 'Noah',     lastName: 'Anderson',  designation: 'Certified Nursing Assistant', clinicalRole: 'CNA', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 16.50, employeeIdNumber: 'EMP-012', monthsBack: 3,  overtimeAllowed: true },
  // Anniversary-soon test case: hire date such that anniversary is ~30 days from today
  { email: 'liam.thompson@nemicare.test',   firstName: 'Liam',     lastName: 'Thompson',  designation: 'Certified Nursing Assistant', clinicalRole: 'CNA', department: 'Clinical', userRole: 'EMPLOYEE', hourlyRate: 17.00, employeeIdNumber: 'EMP-013', monthsBack: 12, overtimeAllowed: true },
  // Non-clinical
  { email: 'frances.obrien@nemicare.test',  firstName: 'Frances',  lastName: "O'Brien",   designation: 'Cook',                department: 'Kitchen',  userRole: 'EMPLOYEE', hourlyRate: 19.00, employeeIdNumber: 'EMP-014', monthsBack: 16, overtimeAllowed: false },
  { email: 'michael.kim@nemicare.test',     firstName: 'Michael',  lastName: 'Kim',       designation: 'Maintenance Technician', department: 'Facilities', userRole: 'EMPLOYEE', hourlyRate: 21.00, employeeIdNumber: 'EMP-015', monthsBack: 11, overtimeAllowed: false },
];

function makeHireDate(monthsBack: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsBack);
  d.setHours(9, 0, 0, 0);
  return d;
}

// For Liam's anniversary trigger test: tweak hireDate so anniversary is exactly 30 days from today
function makeAnniversaryDate(daysFromNow: number): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(9, 0, 0, 0);
  return d;
}

(async () => {
  const company = await (prisma as any).company.findFirst();
  const facility = await (prisma as any).facility.findFirst({ where: { companyId: company.id } });
  const role = await (prisma as any).role.findFirst({ where: { companyId: company.id, name: { contains: 'Manager' } } })
    ?? await (prisma as any).role.findFirst({ where: { companyId: company.id } });

  if (!company || !facility || !role) throw new Error('Need company/facility/role to seed');
  console.log(`Company=${company.id} Facility=${facility.id} default Role=${role.id} (${role.name})`);

  const password = 'Employee@123456';
  const passwordHash = await bcrypt.hash(password, 10);
  let created = 0, skipped = 0;

  for (const s of SEED) {
    const existing = await (prisma as any).user.findUnique({ where: { email: s.email } });
    if (existing) { skipped++; continue; }

    const hireDate = s.firstName === 'Liam' ? makeAnniversaryDate(30) : makeHireDate(s.monthsBack);

    const user = await (prisma as any).user.create({
      data: {
        companyId: company.id,
        facilityId: facility.id,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        passwordHash,
        roleId: role.id,
        active: true,
      },
    });

    await (prisma as any).employee.create({
      data: {
        companyId: company.id,
        facilityId: facility.id,
        userId: user.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        employeeIdNumber: s.employeeIdNumber,
        designation: s.designation,
        department: s.department,
        clinicalRole: s.clinicalRole ?? null,
        userRole: s.userRole,
        hrmsRole: s.userRole,
        hireDate,
        hourlyRate: s.hourlyRate,
        baseSalary: 0,
        overtimeAllowed: s.overtimeAllowed,
        employmentType: 'FULL_TIME',
        payFrequency: 'BIWEEKLY',
        status: 'ACTIVE',
        onboardingStatus: 'COMPLETED',
        onboardingStep: 3,
        officialStartDate: hireDate,
        ssn: `${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 90) + 10)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        activatedAt: new Date(),
      },
    });
    created++;
    console.log(`  ✓ ${s.firstName} ${s.lastName}  ${s.designation}  hired ${hireDate.toISOString().slice(0, 10)}`);
  }

  // Find Liam and report his hireDate so we can verify the anniversary cron picks him up
  const liam = await (prisma as any).employee.findFirst({ where: { firstName: 'Liam' }, select: { id: true, hireDate: true }});
  if (liam) {
    const daysToAnniversary = (() => {
      const today = new Date(); today.setHours(0,0,0,0);
      const ann = new Date(today.getFullYear(), liam.hireDate.getMonth(), liam.hireDate.getDate());
      if (ann < today) ann.setFullYear(ann.getFullYear() + 1);
      return Math.ceil((ann.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    })();
    console.log(`\nLiam's anniversary is in ${daysToAnniversary} day(s) — triggerReviewCycle should create a draft when run.`);
  }

  console.log(`\nSeed complete. Created ${created}, skipped ${skipped} (already existed).`);
  console.log(`Login any of the new accounts with password: ${password}`);
  await prisma.$disconnect();
})();
