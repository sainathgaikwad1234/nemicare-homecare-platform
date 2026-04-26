import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

export const incidentService = {
  async list(companyId: number, opts: { status?: string; employeeId?: number; page?: number; pageSize?: number } = {}) {
    const where: any = { companyId };
    if (opts.status) where.status = opts.status;
    if (opts.employeeId) where.involvedEmployeeId = opts.employeeId;
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 25;
    const total = await (prisma as any).incidentReport.count({ where });
    const data = await (prisma as any).incidentReport.findMany({
      where, orderBy: { incidentDate: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
    });
    return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async create(companyId: number, reportedById: number, input: any) {
    const required = ['incidentDate', 'category', 'severity', 'title', 'description'];
    for (const f of required) if (!input[f]) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `${f} required`);
    return (prisma as any).incidentReport.create({
      data: {
        companyId,
        facilityId: input.facilityId ?? null,
        reportedById,
        involvedEmployeeId: input.involvedEmployeeId ?? null,
        incidentDate: new Date(input.incidentDate),
        category: input.category,
        severity: input.severity,
        title: input.title,
        description: input.description,
        actionTaken: input.actionTaken ?? null,
        status: input.status ?? 'OPEN',
        attachmentUrl: input.attachmentUrl ?? null,
      },
    });
  },

  async update(companyId: number, id: number, input: any) {
    const existing = await (prisma as any).incidentReport.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Incident not found');
    const data: any = {};
    for (const f of ['actionTaken', 'status', 'attachmentUrl', 'severity', 'category', 'title', 'description']) {
      if (input[f] !== undefined) data[f] = input[f];
    }
    if (input.status === 'RESOLVED' || input.status === 'CLOSED') data.resolvedAt = new Date();
    return (prisma as any).incidentReport.update({ where: { id }, data });
  },
};

export const recognitionService = {
  async list(companyId: number, opts: { employeeId?: number; page?: number; pageSize?: number } = {}) {
    const where: any = { companyId };
    if (opts.employeeId) where.employeeId = opts.employeeId;
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 25;
    const total = await (prisma as any).employeeRecognition.count({ where });
    const data = await (prisma as any).employeeRecognition.findMany({
      where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
    });
    // Hydrate names
    const empIds = Array.from(new Set([...data.map((r: any) => r.employeeId), ...data.map((r: any) => r.recognizedById)]));
    const employees = await (prisma as any).employee.findMany({
      where: { id: { in: empIds } }, select: { id: true, firstName: true, lastName: true, designation: true },
    });
    const empMap = new Map(employees.map((e: any) => [e.id, e]));
    return {
      data: data.map((r: any) => ({ ...r, employee: empMap.get(r.employeeId), recognizedBy: empMap.get(r.recognizedById) })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async create(companyId: number, recognizedByEmployeeId: number, input: any) {
    if (!input.employeeId || !input.title) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'employeeId and title required');
    }
    return (prisma as any).employeeRecognition.create({
      data: {
        companyId,
        employeeId: Number(input.employeeId),
        recognizedById: recognizedByEmployeeId,
        category: input.category || 'Excellence',
        title: input.title,
        description: input.description ?? null,
        visibility: input.visibility || 'TEAM',
      },
    });
  },
};

export const payrollSettingsService = {
  async get(companyId: number) {
    let s = await (prisma as any).companyPayrollSettings.findUnique({ where: { companyId } });
    if (!s) {
      s = await (prisma as any).companyPayrollSettings.create({ data: { companyId } });
    }
    return s;
  },
  async update(companyId: number, userId: number, input: any) {
    const allowed = [
      'payPeriodType', 'workweekStartDay', 'dailyOtThresholdHours', 'weeklyOtThresholdHours',
      'doubletimeThresholdHours', 'nightShiftDifferentialPercent', 'weekendDifferentialPercent',
      'holidayMultiplier', 'payrollProvider',
    ];
    const data: any = { updatedById: userId };
    for (const f of allowed) if (input[f] !== undefined) data[f] = input[f];
    await this.get(companyId); // ensure exists
    return (prisma as any).companyPayrollSettings.update({ where: { companyId }, data });
  },
};

export const trainingService = {
  async listModules(companyId: number) {
    return (prisma as any).trainingModule.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  },
  async createModule(companyId: number, input: any) {
    if (!input.title) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'title required');
    return (prisma as any).trainingModule.create({
      data: {
        companyId,
        title: input.title,
        description: input.description ?? null,
        category: input.category ?? null,
        durationHours: input.durationHours ?? null,
        isMandatory: !!input.isMandatory,
      },
    });
  },
  async listAssignmentsForEmployee(companyId: number, employeeId: number) {
    return (prisma as any).trainingAssignment.findMany({
      where: { companyId, employeeId },
      include: { trainingModule: true },
      orderBy: { assignedAt: 'desc' },
    });
  },
  async assign(companyId: number, employeeId: number, moduleId: number, dueDate?: string) {
    return (prisma as any).trainingAssignment.create({
      data: {
        companyId,
        employeeId,
        trainingModuleId: moduleId,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'ASSIGNED',
      },
      include: { trainingModule: true },
    });
  },
  async markComplete(id: number, score?: number) {
    const data: any = { status: 'COMPLETED', completedAt: new Date() };
    if (score !== undefined) data.score = score;
    return (prisma as any).trainingAssignment.update({ where: { id }, data, include: { trainingModule: true } });
  },
};

export const activityLogService = {
  async recent(companyId: number, limit = 30) {
    return (prisma as any).auditLog.findMany({
      where: { companyId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  },
};
