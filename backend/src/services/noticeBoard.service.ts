import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

export const noticeBoardService = {
  async list(companyId: number, opts: { facilityId?: number | null; category?: string; page?: number; pageSize?: number } = {}) {
    const where: any = { companyId };
    if (opts.facilityId !== undefined) {
      // Show notices targeted to this facility OR company-wide (facilityId null)
      where.OR = [{ facilityId: opts.facilityId }, { facilityId: null }];
    }
    if (opts.category) where.category = opts.category;
    // Filter out expired
    where.AND = [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }];

    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;
    const total = await (prisma as any).noticeBoard.count({ where });
    const data = await (prisma as any).noticeBoard.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize, take: pageSize,
    });
    return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async create(companyId: number, postedById: number, input: {
    title: string; body: string; category?: string; facilityId?: number | null; expiresAt?: string | null;
  }) {
    if (!input.title?.trim() || !input.body?.trim()) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'title and body required');
    }
    return (prisma as any).noticeBoard.create({
      data: {
        companyId,
        facilityId: input.facilityId ?? null,
        title: input.title.trim(),
        body: input.body.trim(),
        category: input.category || null,
        postedById,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
  },

  async update(companyId: number, id: number, input: any) {
    const existing = await (prisma as any).noticeBoard.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Notice not found');
    const data: any = {};
    for (const f of ['title', 'body', 'category']) if (input[f] !== undefined) data[f] = input[f];
    if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    return (prisma as any).noticeBoard.update({ where: { id }, data });
  },

  async remove(companyId: number, id: number) {
    const existing = await (prisma as any).noticeBoard.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Notice not found');
    await (prisma as any).noticeBoard.delete({ where: { id } });
    return { id };
  },
};
