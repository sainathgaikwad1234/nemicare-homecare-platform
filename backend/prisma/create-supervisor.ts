import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Create or update a dedicated "Supervisor" role (no employees.create)
  const supervisorPerms = [
    'shifts.read', 'shifts.create', 'shifts.update',
    'leaves.read', 'leaves.approve',
    'timecards.read', 'timecards.approve',
    'tasks.read', 'tasks.create', 'tasks.update',
    'reviews.read', 'reviews.create', 'reviews.update',
    'employees.read',
  ];

  const company = await prisma.company.findFirst();
  if (!company) throw new Error('No company found — run seed first');

  let role = await prisma.role.findFirst({ where: { companyId: company.id, name: 'Supervisor' } });
  if (role) {
    role = await prisma.role.update({
      where: { id: role.id },
      data: { permissions: supervisorPerms, active: true },
    });
    console.log(`✓ Updated Supervisor role (id=${role.id})`);
  } else {
    role = await prisma.role.create({
      data: {
        companyId: company.id,
        name: 'Supervisor',
        description: 'Shift, leave, and timecard approver',
        permissions: supervisorPerms,
        active: true,
      },
    });
    console.log(`✓ Created Supervisor role (id=${role.id})`);
  }

  // 2. Create or update a Supervisor user
  const facility = await prisma.facility.findFirst({ where: { companyId: company.id } });
  if (!facility) throw new Error('No facility found');

  const email = 'supervisor@demo.nemicare.local';
  const password = 'Supervisor@123456';
  const passwordHash = await bcrypt.hash(password, 10);

  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, roleId: role.id, active: true },
    });
    console.log(`✓ Updated Supervisor user (id=${user.id})`);
  } else {
    user = await prisma.user.create({
      data: {
        companyId: company.id,
        facilityId: facility.id,
        email,
        firstName: 'Eleanor',
        lastName: 'Pena',
        phone: '555-0199',
        passwordHash,
        roleId: role.id,
        active: true,
      },
    });
    console.log(`✓ Created Supervisor user (id=${user.id})`);
  }

  // 3. Optionally also remove employees.create from Manager so it stops showing up as HR Admin in the UI
  const manager = await prisma.role.findFirst({ where: { companyId: company.id, name: 'Manager' } });
  if (manager) {
    const current = Array.isArray(manager.permissions) ? (manager.permissions as string[]) : [];
    const stripped = current.filter((p) => p !== 'employees.create');
    if (stripped.length !== current.length) {
      await prisma.role.update({ where: { id: manager.id }, data: { permissions: stripped } });
      console.log(`✓ Removed employees.create from Manager role so it now displays as Supervisor`);
    }
  }

  console.log(`\nLogin: ${email} / ${password}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
