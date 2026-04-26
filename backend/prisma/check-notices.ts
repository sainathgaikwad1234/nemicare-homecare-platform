import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const notices = await (prisma as any).noticeBoard.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: { id: true, title: true, category: true, createdAt: true },
  });
  console.log('Recent NoticeBoard posts:');
  for (const n of notices) console.log(`  #${n.id} [${n.category}] ${n.title}`);
  await prisma.$disconnect();
})();
