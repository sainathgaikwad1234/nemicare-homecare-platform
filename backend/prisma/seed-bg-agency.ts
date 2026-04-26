import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const a = await (p as any).backgroundCheckAgency.findMany();
  if (a.length === 0) {
    const created = await (p as any).backgroundCheckAgency.create({
      data: { companyId: 1, location: 'Chicago', agencyName: 'Sterling Background Checks', contactEmail: 'dispatch@sterlingcheck.example', active: true },
    });
    console.log('Seeded:', created.id);
  } else {
    for (const ag of a) console.log(`  #${ag.id} ${ag.agencyName} (${ag.location})`);
  }
  await p.$disconnect();
})();
