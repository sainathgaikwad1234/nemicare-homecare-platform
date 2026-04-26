import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const e = await (prisma as any).employee.update({
    where: { id: 1 },
    data: {
      employeeIdNumber: 'EMP-001',
      department: 'Clinical',
      hourlyRate: 22.50,
    },
  });
  console.log(`Updated ${e.firstName} ${e.lastName}: id=${e.employeeIdNumber} dept=${e.department} rate=$${e.hourlyRate}/hr`);
  await prisma.$disconnect();
})();
