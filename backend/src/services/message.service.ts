import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

export const messageService = {
  async listMyThreads(userId: number, companyId: number) {
    const threads = await (prisma as any).messageThread.findMany({
      where: {
        companyId,
        participants: { some: { userId } },
      },
      include: {
        participants: { include: { /* lightweight */ } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
    // Hydrate participant user names
    const userIds = Array.from(new Set(threads.flatMap((t: any) => t.participants.map((p: any) => p.userId))));
    const users = await (prisma as any).user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map((u: any) => [u.id, u]));
    for (const t of threads) {
      t.participants = t.participants.map((p: any) => ({ ...p, user: userMap.get(p.userId) || null }));
    }
    return threads;
  },

  async getThread(threadId: number, userId: number, companyId: number) {
    const thread = await (prisma as any).messageThread.findFirst({
      where: { id: threadId, companyId, participants: { some: { userId } } },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!thread) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Thread not found');
    // Mark as read
    await (prisma as any).messageThreadParticipant.updateMany({
      where: { threadId, userId },
      data: { lastReadAt: new Date() },
    });
    // Hydrate sender names
    const senderIds = Array.from(new Set(thread.messages.map((m: any) => m.senderId)));
    const users = await (prisma as any).user.findMany({
      where: { id: { in: senderIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const m = new Map(users.map((u: any) => [u.id, u]));
    thread.messages = thread.messages.map((msg: any) => ({ ...msg, sender: m.get(msg.senderId) || null }));
    return thread;
  },

  async createThread(userId: number, companyId: number, input: { recipientUserIds: number[]; subject?: string; body: string }) {
    if (!input.body?.trim()) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'body required');
    if (!input.recipientUserIds?.length) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'at least one recipient required');
    const allIds = Array.from(new Set([userId, ...input.recipientUserIds]));
    const thread = await (prisma as any).messageThread.create({
      data: {
        companyId,
        subject: input.subject || null,
        threadType: 'DIRECT',
        createdById: userId,
        lastMessageAt: new Date(),
        participants: {
          create: allIds.map((id) => ({ userId: id })),
        },
        messages: {
          create: { senderId: userId, body: input.body.trim() },
        },
      },
      include: { participants: true, messages: true },
    });
    return thread;
  },

  async sendMessage(userId: number, threadId: number, body: string) {
    if (!body?.trim()) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'body required');
    const participant = await (prisma as any).messageThreadParticipant.findFirst({
      where: { threadId, userId },
    });
    if (!participant) throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.UNAUTHORIZED, 'Not a participant of this thread');
    const msg = await (prisma as any).message.create({
      data: { threadId, senderId: userId, body: body.trim() },
    });
    await (prisma as any).messageThread.update({
      where: { id: threadId }, data: { lastMessageAt: new Date() },
    });
    return msg;
  },

  async unreadCount(userId: number, companyId: number) {
    // For each thread the user participates in, count messages newer than lastReadAt
    const parts = await (prisma as any).messageThreadParticipant.findMany({
      where: { userId, thread: { companyId } },
      include: { thread: { select: { lastMessageAt: true, id: true } } },
    });
    let total = 0;
    for (const p of parts) {
      const since = p.lastReadAt ?? new Date(0);
      const c = await (prisma as any).message.count({
        where: { threadId: p.threadId, createdAt: { gt: since }, senderId: { not: userId } },
      });
      total += c;
    }
    return { unreadCount: total };
  },
};
