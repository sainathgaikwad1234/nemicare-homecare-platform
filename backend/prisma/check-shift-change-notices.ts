import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const notices = await (p as any).noticeBoard.findMany({
    where: { category: { in: ['shift-change', 'shift-change-decision'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, body: true, category: true, createdAt: true },
  });
  console.log('Shift-change notices:');
  for (const n of notices) console.log(`  #${n.id} [${n.category}] ${n.title}\n      ${n.body}`);
  await p.$disconnect();
})();
