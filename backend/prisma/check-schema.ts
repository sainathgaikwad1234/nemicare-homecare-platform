import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const cols: any[] = await p.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Employee' ORDER BY column_name`);
  console.log('Employee columns (' + cols.length + '):');
  cols.forEach((c: any) => console.log(' -', c.column_name));
  const tables: any[] = await p.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'Onboarding%' OR table_name = 'BackgroundCheckAgency') ORDER BY table_name`);
  console.log('\nNew tables (' + tables.length + '):');
  tables.forEach((t: any) => console.log(' -', t.table_name));
  await p.$disconnect();
})();
