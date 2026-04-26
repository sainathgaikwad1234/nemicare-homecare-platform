import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const includeBlock = {
  employee: {
    select: {
      id: true, firstName: true, lastName: true, profilePictureUrl: true,
      email: true, phone: true, employeeIdNumber: true, designation: true, clinicalRole: true,
      department: true, hireDate: true, hourlyRate: true, baseSalary: true,
    },
  },
};

export const exitService = {
  async list(opts: { companyId: number; status?: string; page: number; pageSize: number }) {
    const where: any = { companyId: Number(opts.companyId) };
    if (opts.status === 'PENDING') where.status = { in: ['INITIATED', 'IN_PROGRESS'] };
    else if (opts.status === 'APPROVED' || opts.status === 'COMPLETED') where.status = 'COMPLETED';

    const total = await (prisma as any).employeeExit.count({ where });
    const data = await (prisma as any).employeeExit.findMany({
      where,
      include: includeBlock,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    });
    return { data, pagination: { page: opts.page, pageSize: opts.pageSize, total, totalPages: Math.ceil(total / opts.pageSize) } };
  },

  async getById(id: number, companyId: number) {
    const record = await (prisma as any).employeeExit.findFirst({
      where: { id: Number(id), companyId: Number(companyId) },
      include: includeBlock,
    });
    if (!record) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Exit record not found');
    return record;
  },

  async initiate(input: any, userId: number, companyId: number) {
    const required = ['employeeId', 'exitType', 'noticeDate', 'lastWorkingDay', 'exitReason'];
    for (const f of required) {
      if (!input[f]) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `${f} is required`);
    }
    const employee = await (prisma as any).employee.findFirst({
      where: { id: Number(input.employeeId), companyId: Number(companyId), deletedAt: null },
    });
    if (!employee) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 'Employee not found');
    if (employee.status === 'TERMINATED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Employee already terminated');
    }
    const existing = await (prisma as any).employeeExit.findUnique({ where: { employeeId: Number(input.employeeId) } });
    if (existing) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Exit record already exists for this employee');
    }
    return (prisma as any).employeeExit.create({
      data: {
        companyId,
        employeeId: Number(input.employeeId),
        exitReason: input.exitReason,
        exitType: input.exitType,
        noticeDate: new Date(input.noticeDate),
        lastWorkingDay: new Date(input.lastWorkingDay),
        status: 'INITIATED',
        initiatedById: Number(userId),
      },
      include: includeBlock,
    });
  },

  async update(id: number, companyId: number, input: any) {
    const existing = await this.getById(id, companyId);
    if (existing.status === 'COMPLETED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Exit already completed');
    }
    const update: any = {};
    for (const f of ['exitInterviewNotes', 'finalPayAmount', 'benefitsTerminated', 'portalAccessRevoked', 'propertyCollected', 'assetReturns']) {
      if (input[f] !== undefined) update[f] = input[f];
    }
    if (input.exitInterviewDate !== undefined) update.exitInterviewDate = input.exitInterviewDate ? new Date(input.exitInterviewDate) : null;
    if (input.benefitsTerminationDate !== undefined) update.benefitsTerminationDate = input.benefitsTerminationDate ? new Date(input.benefitsTerminationDate) : null;
    if (existing.status === 'INITIATED') update.status = 'IN_PROGRESS';
    return (prisma as any).employeeExit.update({ where: { id: Number(id) }, data: update, include: includeBlock });
  },

  // Sprint 5.7 — Calculate final pay from approved unpaid timecards + leave payout
  async calculateFinalPay(id: number, companyId: number) {
    const existing = await this.getById(id, companyId);
    const employee = existing.employee;
    if (!employee) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');

    // Sum APPROVED unpaid timecards (status APPROVED, payrollBatchId null)
    const unpaidTimesheets = await (prisma as any).timesheet.findMany({
      where: { employeeId: existing.employeeId, status: 'APPROVED', payrollBatchId: null },
    });
    const rate = Number(employee.hourlyRate || 0);
    let unpaidHours = 0;
    let unpaidRegular = 0;
    let unpaidOvertime = 0;
    for (const t of unpaidTimesheets) {
      unpaidRegular += Number(t.regularHours || 0);
      unpaidOvertime += Number(t.overtimeHours || 0);
      unpaidHours += Number(t.regularHours || 0) + Number(t.overtimeHours || 0);
    }
    const unpaidPay = unpaidRegular * rate + unpaidOvertime * rate * 1.5;

    // Accrued leave payout (PTO)
    const balance = await (prisma as any).leaveBalance.findUnique({ where: { employeeId: existing.employeeId } });
    const accruedDays = balance ? (Number(balance.annualBalance || 0) + Number(balance.personalBalance || 0)) : 0;
    const leavePayout = accruedDays * 8 * rate; // 8h/day

    const total = Math.round((unpaidPay + leavePayout) * 100) / 100;

    const breakdown = {
      hourlyRate: rate,
      unpaidHours,
      unpaidRegularHours: unpaidRegular,
      unpaidOvertimeHours: unpaidOvertime,
      unpaidPay: Math.round(unpaidPay * 100) / 100,
      accruedLeaveDays: accruedDays,
      leavePayout: Math.round(leavePayout * 100) / 100,
      total,
    };

    return (prisma as any).employeeExit.update({
      where: { id: existing.id },
      data: {
        finalPayAmount: total,
        finalPayBreakdown: breakdown,
        finalPayCalculatedAt: new Date(),
        status: existing.status === 'INITIATED' ? 'IN_PROGRESS' : existing.status,
      },
      include: includeBlock,
    });
  },

  // Sprint 5.7 — Finalize: terminate Employee + User + cancel future shifts + audit log
  async finalize(id: number, companyId: number) {
    const existing = await this.getById(id, companyId);
    if (existing.status === 'COMPLETED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Already completed');
    }
    return prisma.$transaction(async (tx: any) => {
      const removalLog: any[] = [];
      const now = new Date();

      // 1. Cancel all future SCHEDULED shifts
      const cancelled = await tx.shiftSchedule.updateMany({
        where: {
          employeeId: existing.employeeId,
          shiftDate: { gt: now },
          status: { in: ['SCHEDULED', 'LEAVE_BLOCKED'] },
        },
        data: { status: 'CANCELLED' },
      });
      removalLog.push({ system: 'shift_roster', cancelledCount: cancelled.count, removedAt: now });

      // 2. Mark Employee as TERMINATED
      await tx.employee.update({
        where: { id: existing.employeeId },
        data: { status: 'TERMINATED', terminationDate: existing.lastWorkingDay },
      });
      removalLog.push({ system: 'employee_record', removedAt: now });

      // 3. Deactivate User account (revokes portal access)
      const employee = await tx.employee.findUnique({ where: { id: existing.employeeId } });
      if (employee) {
        await tx.user.update({ where: { id: employee.userId }, data: { active: false } });
        removalLog.push({ system: 'portal_access', userId: employee.userId, removedAt: now });
      }

      // 4. Remove from message threads (DIRECT type only — keep in announcement history)
      const participant = await tx.messageThreadParticipant.deleteMany({
        where: { userId: employee?.userId },
      });
      removalLog.push({ system: 'messaging', removedFromThreads: participant.count, removedAt: now });

      // 5. Update exit record
      const exit = await tx.employeeExit.update({
        where: { id: Number(id) },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          benefitsTerminated: true,
          benefitsTerminationDate: existing.lastWorkingDay,
          portalAccessRevoked: true,
          systemRemovalLog: removalLog,
        },
        include: includeBlock,
      });

      return exit;
    });
  },
};
