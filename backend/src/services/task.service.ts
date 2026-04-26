import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const includeBlock = {
  assignedTo: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, designation: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

export const taskService = {
  async list(opts: { companyId: number; assignedToId?: number; status?: string; page: number; pageSize: number }) {
    const where: any = { companyId: Number(opts.companyId) };
    if (opts.assignedToId) where.assignedToId = Number(opts.assignedToId);
    if (opts.status) where.status = opts.status;

    const total = await (prisma as any).employeeTask.count({ where });
    const data = await (prisma as any).employeeTask.findMany({
      where,
      include: includeBlock,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    });
    return { data, pagination: { page: opts.page, pageSize: opts.pageSize, total, totalPages: Math.ceil(total / opts.pageSize) } };
  },

  async listForEmployee(employeeId: number, companyId: number, status?: string, page = 1, pageSize = 50) {
    return this.list({ companyId, assignedToId: employeeId, status, page, pageSize });
  },

  async getStats(employeeId: number, companyId: number) {
    const where: any = { companyId: Number(companyId), assignedToId: Number(employeeId) };
    const [total, completed, pending, overdue] = await Promise.all([
      (prisma as any).employeeTask.count({ where }),
      (prisma as any).employeeTask.count({ where: { ...where, status: 'COMPLETED' } }),
      (prisma as any).employeeTask.count({ where: { ...where, status: 'PENDING' } }),
      (prisma as any).employeeTask.count({
        where: { ...where, status: { in: ['PENDING', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } },
      }),
    ]);
    return { total, completed, pending, due: overdue };
  },

  async create(input: any, creatorEmployeeId: number, companyId: number, facilityId: number) {
    if (!input.assignedToId || !input.title) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'assignedToId and title are required');
    }
    return (prisma as any).employeeTask.create({
      data: {
        companyId,
        facilityId,
        assignedToId: Number(input.assignedToId),
        createdById: Number(creatorEmployeeId),
        title: input.title,
        description: input.description || null,
        priority: (input.priority || 'MEDIUM') as any,
        status: 'PENDING',
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
      include: includeBlock,
    });
  },

  async update(id: number, companyId: number, input: any) {
    const existing = await (prisma as any).employeeTask.findFirst({ where: { id: Number(id), companyId: Number(companyId) } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Task not found');
    const update: any = {};
    for (const f of ['title', 'description', 'priority', 'status']) if (input[f] !== undefined) update[f] = input[f];
    if (input.dueDate !== undefined) update.dueDate = input.dueDate ? new Date(input.dueDate) : null;
    return (prisma as any).employeeTask.update({ where: { id: Number(id) }, data: update, include: includeBlock });
  },

  async markComplete(id: number, companyId: number, employeeId: number) {
    const task = await (prisma as any).employeeTask.findFirst({ where: { id: Number(id), companyId: Number(companyId) } });
    if (!task) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Task not found');
    if (task.assignedToId !== Number(employeeId)) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, 'You can only complete tasks assigned to you');
    }
    return (prisma as any).employeeTask.update({
      where: { id: Number(id) },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: includeBlock,
    });
  },

  async remove(id: number, companyId: number) {
    const existing = await (prisma as any).employeeTask.findFirst({ where: { id: Number(id), companyId: Number(companyId) } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Task not found');
    await (prisma as any).employeeTask.delete({ where: { id: Number(id) } });
    return { message: 'Task removed' };
  },
};
