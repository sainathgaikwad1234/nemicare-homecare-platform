import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const adminEmployeePerms = [
  'employees.read', 'employees.create', 'employees.update', 'employees.delete',
  'shifts.read', 'shifts.create', 'shifts.update', 'shifts.delete',
  'leaves.read', 'leaves.create', 'leaves.approve',
  'timecards.read', 'timecards.approve',
  'tasks.read', 'tasks.create', 'tasks.update', 'tasks.delete',
  'reviews.read', 'reviews.create', 'reviews.update', 'reviews.approve',
  'exits.read', 'exits.create', 'exits.update',
];
const managerEmployeePerms = [
  'employees.read', 'employees.create', 'employees.update',
  'shifts.read', 'shifts.create', 'shifts.update',
  'leaves.read', 'leaves.approve',
  'timecards.read', 'timecards.approve',
  'tasks.read', 'tasks.create', 'tasks.update',
  'reviews.read', 'reviews.create', 'reviews.update',
];

async function main() {
  const roles = await prisma.role.findMany();
  for (const role of roles) {
    const current = Array.isArray(role.permissions) ? (role.permissions as string[]) : [];
    let toAdd: string[] = [];
    if (role.name === 'Admin') toAdd = adminEmployeePerms;
    else if (role.name === 'Manager') toAdd = managerEmployeePerms;
    else continue;

    const merged = Array.from(new Set([...current, ...toAdd]));
    if (merged.length === current.length) {
      console.log(`✓ ${role.name} (id=${role.id}) already has all employee permissions`);
      continue;
    }
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: merged },
    });
    console.log(`✓ Patched ${role.name} (id=${role.id}) — added ${toAdd.filter((p) => !current.includes(p)).join(', ')}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
