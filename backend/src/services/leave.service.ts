import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const includeBlock = {
  employee: {
    select: {
      id: true, firstName: true, lastName: true, profilePictureUrl: true,
      email: true, phone: true, employeeIdNumber: true, designation: true, clinicalRole: true,
      leaveBalance: true,
    },
  },
};

interface ListOptions {
  companyId: number;
  status?: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED';
  page: number;
  pageSize: number;
}

const recomputeOverallStatus = (sup: string, hr: string): string => {
  if (sup === 'REJECTED' || hr === 'REJECTED') return 'REJECTED';
  if (sup === 'APPROVED' && hr === 'APPROVED') return 'APPROVED';
  return 'PENDING';
};

export const leaveService = {
  async listLeaves(opts: ListOptions) {
    const where: any = { companyId: Number(opts.companyId) };
    if (opts.status === 'PENDING') where.status = 'PENDING';
    else if (opts.status === 'APPROVED') where.status = 'APPROVED';
    else if (opts.status === 'REJECTED') where.status = 'REJECTED';

    const total = await (prisma as any).leaveRequest.count({ where });
    const data = await (prisma as any).leaveRequest.findMany({
      where,
      include: includeBlock,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    });

    return {
      data,
      pagination: {
        page: opts.page, pageSize: opts.pageSize, total, totalPages: Math.ceil(total / opts.pageSize),
      },
    };
  },

  async getById(id: number, companyId: number) {
    const lr = await (prisma as any).leaveRequest.findFirst({
      where: { id: Number(id), companyId: Number(companyId) },
      include: includeBlock,
    });
    if (!lr) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Leave request not found');
    return lr;
  },

  async createLeave(input: any, employeeId: number, companyId: number) {
    if (!input.leaveType) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'leaveType is required');
    if (!input.fromDate || !input.toDate) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'fromDate and toDate are required');
    const from = new Date(input.fromDate);
    const to = new Date(input.toDate);
    if (to < from) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'toDate must be on or after fromDate');
    const totalDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1);

    return (prisma as any).leaveRequest.create({
      data: {
        companyId: Number(companyId),
        employeeId: Number(employeeId),
        leaveType: input.leaveType,
        fromDate: from,
        toDate: to,
        totalDays,
        reason: input.reason || null,
        status: 'PENDING',
        supervisorApprovalStatus: 'PENDING',
        hrApprovalStatus: 'WAITING',
      },
      include: includeBlock,
    });
  },

  async supervisorApprove(id: number, companyId: number, userId: number, replacementEmployeeId?: number | null) {
    const existing = await this.getById(id, companyId);
    if (existing.supervisorApprovalStatus !== 'PENDING') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `Supervisor already ${existing.supervisorApprovalStatus.toLowerCase()}`);
    }
    return (prisma as any).leaveRequest.update({
      where: { id: Number(id) },
      data: {
        supervisorApprovalStatus: 'APPROVED',
        supervisorApprovedById: Number(userId),
        supervisorApprovedAt: new Date(),
        hrApprovalStatus: 'PENDING', // now HR's turn
        status: 'PENDING',
        replacementEmployeeId: replacementEmployeeId ?? existing.replacementEmployeeId ?? null,
        // Clear any pending info request once supervisor decides
        infoRequestMessage: null,
        infoRequestedById: null,
        infoRequestedAt: null,
      },
      include: includeBlock,
    });
  },

  // Sprint 5.4 — Quota check (called inline before submit; also returns balance for UI)
  async checkQuota(employeeId: number, leaveType: string, days: number) {
    const balance = await (prisma as any).leaveBalance.findUnique({
      where: { employeeId: Number(employeeId) },
    });
    if (!balance) {
      // No balance record — treat as 0
      return { remaining: 0, sufficient: false, balance: null, leaveType };
    }
    const map: Record<string, keyof typeof balance> = {
      ANNUAL: 'annualBalance', SICK: 'sickBalance', PERSONAL: 'personalBalance', UNPAID: 'unpaidBalance',
      MATERNITY: 'unpaidBalance', BEREAVEMENT: 'unpaidBalance', OTHER: 'unpaidBalance',
    };
    const field = map[leaveType] || 'unpaidBalance';
    const remaining = Number(balance[field] || 0);
    return {
      remaining,
      sufficient: remaining >= Number(days),
      balance: {
        annualBalance: Number(balance.annualBalance),
        sickBalance: Number(balance.sickBalance),
        personalBalance: Number(balance.personalBalance),
        unpaidBalance: Number(balance.unpaidBalance),
      },
      leaveType,
    };
  },

  // Sprint 5.4 — Coverage preview (run before supervisor approves)
  // Returns the shifts impacted and how many remaining staff per shift type per affected day.
  async coveragePreview(id: number, companyId: number) {
    const lr = await this.getById(id, companyId);
    const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

    const COVERAGE_MIN: Record<string, number> = { FIRST: 5, SECOND: 3, THIRD: 3 };
    const fromD = startOfDay(new Date(lr.fromDate));
    const toD = endOfDay(new Date(lr.toDate));

    // Shifts assigned to this employee within the leave window — those would be lost
    const affected = await (prisma as any).shiftSchedule.findMany({
      where: {
        employeeId: lr.employeeId,
        shiftDate: { gte: fromD, lte: toD },
        status: { in: ['SCHEDULED'] },
      },
      orderBy: { shiftDate: 'asc' },
    });

    // For each affected shift compute counts of remaining same-day same-type SCHEDULED staff
    const days: any[] = [];
    let undercoverage = false;
    for (const s of affected) {
      const startOfThatDay = startOfDay(s.shiftDate);
      const endOfThatDay = endOfDay(s.shiftDate);
      const total = await (prisma as any).shiftSchedule.count({
        where: {
          facilityId: s.facilityId,
          shiftDate: { gte: startOfThatDay, lte: endOfThatDay },
          shiftType: s.shiftType,
          status: 'SCHEDULED',
        },
      });
      const remaining = total - 1; // would be -1 if this employee's shift moves to LEAVE_BLOCKED
      const min = COVERAGE_MIN[s.shiftType] ?? 0;
      const adequate = remaining >= min;
      if (!adequate) undercoverage = true;
      days.push({
        shiftId: s.id,
        date: s.shiftDate,
        shiftType: s.shiftType,
        currentCount: total,
        remainingIfApproved: remaining,
        minimum: min,
        adequate,
      });
    }

    // Suggest replacements: same-facility employees not already scheduled that day for the same shift type
    const candidates: any[] = [];
    if (affected.length) {
      const sample = affected[0];
      const allEmps = await (prisma as any).employee.findMany({
        where: {
          companyId: lr.companyId,
          facilityId: sample.facilityId,
          status: 'ACTIVE',
          deletedAt: null,
          id: { not: lr.employeeId },
        },
        select: { id: true, firstName: true, lastName: true, designation: true, clinicalRole: true },
      });
      // Filter out anyone scheduled for any of the affected shifts already
      for (const emp of allEmps) {
        const conflict = await (prisma as any).shiftSchedule.count({
          where: {
            employeeId: emp.id,
            shiftDate: { gte: fromD, lte: toD },
            status: { in: ['SCHEDULED', 'LEAVE_BLOCKED'] },
          },
        });
        if (conflict === 0) candidates.push(emp);
      }
    }

    return {
      undercoverage,
      affectedDays: days,
      replacementCandidates: candidates.slice(0, 20),
    };
  },

  // Sprint 5.4 — Need Info loopback
  async requestInfo(id: number, companyId: number, userId: number, message: string) {
    if (!message || !message.trim()) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'message is required');
    }
    const existing = await this.getById(id, companyId);
    if (existing.supervisorApprovalStatus !== 'PENDING') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Cannot request info; supervisor already ${existing.supervisorApprovalStatus.toLowerCase()}`);
    }
    const updated = await (prisma as any).leaveRequest.update({
      where: { id: Number(id) },
      data: {
        infoRequestMessage: message.trim(),
        infoRequestedById: Number(userId),
        infoRequestedAt: new Date(),
        infoResponseMessage: null,
        infoRespondedAt: null,
      },
      include: includeBlock,
    });
    // Notify employee via NoticeBoard
    try {
      const { notificationService } = await import('./notification.service');
      await notificationService.send({
        companyId: existing.companyId,
        facilityId: updated.employee?.facilityId ?? null,
        title: 'Supervisor needs info on your leave request',
        body: message.trim(),
        category: 'leave-info-request',
        emailTo: updated.employee?.email ? [updated.employee.email] : undefined,
      });
    } catch (e) { console.error('[leave.requestInfo] notify failed', e); }
    return updated;
  },

  async respondToInfoRequest(id: number, companyId: number, employeeId: number, response: string) {
    if (!response || !response.trim()) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'response is required');
    }
    const existing = await this.getById(id, companyId);
    if (existing.employeeId !== Number(employeeId)) {
      throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.UNAUTHORIZED, 'You can only respond to your own leave requests');
    }
    if (!existing.infoRequestMessage) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'No info request is pending');
    }
    return (prisma as any).leaveRequest.update({
      where: { id: Number(id) },
      data: {
        infoResponseMessage: response.trim(),
        infoRespondedAt: new Date(),
      },
      include: includeBlock,
    });
  },

  async supervisorReject(id: number, companyId: number, userId: number, rejectionReason?: string) {
    const existing = await this.getById(id, companyId);
    if (existing.supervisorApprovalStatus !== 'PENDING') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `Supervisor already ${existing.supervisorApprovalStatus.toLowerCase()}`);
    }
    if (!rejectionReason || rejectionReason.trim() === '') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'rejectionReason is required');
    }
    return (prisma as any).leaveRequest.update({
      where: { id: Number(id) },
      data: {
        supervisorApprovalStatus: 'REJECTED',
        supervisorApprovedById: Number(userId),
        supervisorApprovedAt: new Date(),
        rejectionReason,
        status: 'REJECTED',
      },
      include: includeBlock,
    });
  },

  async hrApprove(id: number, companyId: number, userId: number) {
    const existing = await this.getById(id, companyId);
    if (existing.supervisorApprovalStatus !== 'APPROVED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Supervisor must approve before HR can act');
    }
    if (existing.hrApprovalStatus !== 'PENDING') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `HR already ${existing.hrApprovalStatus.toLowerCase()}`);
    }
    const updated = await (prisma as any).leaveRequest.update({
      where: { id: Number(id) },
      data: {
        hrApprovalStatus: 'APPROVED',
        hrApprovedById: Number(userId),
        hrApprovedAt: new Date(),
        status: 'APPROVED',
        approvedById: Number(userId),
        approvedAt: new Date(),
      },
      include: includeBlock,
    });

    // Sprint 5.2 — Lane 4 hand-off: when leave is APPROVED, block matching shifts in roster.
    try {
      const { blockRosterForLeave } = await import('../jobs/handlers');
      await blockRosterForLeave(updated.id);
    } catch (e) {
      // Don't fail the approval if the side-effect fails; log for ops.
      console.error('[leave.hrApprove] blockRosterForLeave failed:', e);
    }

    return updated;
  },

  async hrReject(id: number, companyId: number, userId: number, rejectionReason?: string) {
    const existing = await this.getById(id, companyId);
    if (existing.supervisorApprovalStatus !== 'APPROVED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Supervisor must approve before HR can reject');
    }
    if (existing.hrApprovalStatus !== 'PENDING') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `HR already ${existing.hrApprovalStatus.toLowerCase()}`);
    }
    if (!rejectionReason || rejectionReason.trim() === '') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'rejectionReason is required');
    }
    return (prisma as any).leaveRequest.update({
      where: { id: Number(id) },
      data: {
        hrApprovalStatus: 'REJECTED',
        hrApprovedById: Number(userId),
        hrApprovedAt: new Date(),
        rejectionReason,
        status: 'REJECTED',
      },
      include: includeBlock,
    });
  },
};
