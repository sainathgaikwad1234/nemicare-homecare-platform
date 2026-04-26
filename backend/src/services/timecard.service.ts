import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const DAILY_OT_THRESHOLD_HOURS = 8;
// Weekly OT (>40h) is computed server-side at payroll-batch time, not per-day.

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

function diffMs(a: Date, b: Date) { return b.getTime() - a.getTime(); }
function msToHours(ms: number) { return Math.max(0, ms / (1000 * 60 * 60)); }
function msToMinutes(ms: number) { return Math.max(0, Math.round(ms / (1000 * 60))); }

export async function computeAndUpsertDailyTimecard(employeeId: number, date: Date, taskDetails?: string) {
  const emp = await (prisma as any).employee.findUnique({
    where: { id: employeeId },
    select: { id: true, companyId: true, facilityId: true, overtimeAllowed: true },
  });
  if (!emp) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');

  const day = startOfDay(date);
  const dayEnd = endOfDay(date);

  const punches = await (prisma as any).employeePunch.findMany({
    where: { employeeId, timestamp: { gte: day, lte: dayEnd } },
    orderBy: { timestamp: 'asc' },
  });

  const clockIn = punches.find((p: any) => p.punchType === 'CLOCK_IN');
  const clockOut = [...punches].reverse().find((p: any) => p.punchType === 'CLOCK_OUT');

  // Compute total raw shift duration
  let rawHours = 0;
  if (clockIn && clockOut) {
    rawHours = msToHours(diffMs(new Date(clockIn.timestamp), new Date(clockOut.timestamp)));
  }

  // Compute break minutes by pairing BREAK_START → BREAK_END
  let breakMinutes = 0;
  let pendingStart: Date | null = null;
  for (const p of punches) {
    if (p.punchType === 'BREAK_START') pendingStart = new Date(p.timestamp);
    else if (p.punchType === 'BREAK_END' && pendingStart) {
      breakMinutes += msToMinutes(diffMs(pendingStart, new Date(p.timestamp)));
      pendingStart = null;
    }
  }

  const netHours = Math.max(0, rawHours - breakMinutes / 60);
  const overtimeHours = netHours > DAILY_OT_THRESHOLD_HOURS ? netHours - DAILY_OT_THRESHOLD_HOURS : 0;
  const regularHours = Math.min(netHours, DAILY_OT_THRESHOLD_HOURS);

  // Phase 5.10 — late-clock-in detection: compare actual punch-in to scheduled startTime
  let lateMinutes = 0;
  if (clockIn) {
    const scheduledShift = await (prisma as any).shiftSchedule.findFirst({
      where: { employeeId, shiftDate: { gte: day, lte: dayEnd }, status: { in: ['SCHEDULED', 'COMPLETED'] } },
    });
    if (scheduledShift && scheduledShift.startTime) {
      // Parse "9:00 AM" / "12:00 AM" etc against today's date
      const m = String(scheduledShift.startTime).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (m) {
        let hr = parseInt(m[1]);
        const min = parseInt(m[2]);
        const ampm = m[3].toUpperCase();
        if (ampm === 'PM' && hr < 12) hr += 12;
        if (ampm === 'AM' && hr === 12) hr = 0;
        const scheduled = new Date(day);
        scheduled.setHours(hr, min, 0, 0);
        const actual = new Date(clockIn.timestamp);
        if (actual > scheduled) lateMinutes = Math.round((actual.getTime() - scheduled.getTime()) / 60000);
      }
    }
  }

  const flags: string[] = [];
  if (!clockIn) flags.push('MISSING_PUNCH_IN');
  if (!clockOut) flags.push('MISSING_PUNCH_OUT');
  if (overtimeHours > 0) flags.push('OVERTIME');
  if (netHours > 0 && netHours < 4) flags.push('SHORT');
  if (lateMinutes > 5) flags.push('LATE_IN');

  // Upsert: 1 timecard per employee per day (period = single day)
  const existing = await (prisma as any).timesheet.findFirst({
    where: { employeeId, periodStart: day, periodEnd: dayEnd },
  });

  const data = {
    companyId: emp.companyId,
    facilityId: emp.facilityId,
    employeeId: emp.id,
    periodStart: day,
    periodEnd: dayEnd,
    regularHours,
    overtimeHours,
    paidLeaveHours: 0,
    unpaidLeaveHours: 0,
    totalHours: netHours,
    netHours,
    breakMinutes,
    lateMinutes,
    status: existing?.status === 'APPROVED' || existing?.status === 'PAID' ? existing.status : 'DRAFT' as const,
    flags,
    taskDetails: taskDetails ?? existing?.taskDetails ?? null,
  };

  if (existing) {
    return (prisma as any).timesheet.update({ where: { id: existing.id }, data });
  }
  return (prisma as any).timesheet.create({ data });
}

export const timecardService = {
  computeAndUpsertDailyTimecard,

  async listMine(userId: number, page = 1, pageSize = 10) {
    const emp = await (prisma as any).employee.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!emp) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');
    const where = { employeeId: emp.id };
    const total = await (prisma as any).timesheet.count({ where });
    const data = await (prisma as any).timesheet.findMany({
      where,
      orderBy: { periodStart: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async submit(userId: number, timesheetId: number, taskDetails?: string) {
    const emp = await (prisma as any).employee.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!emp) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');

    const ts = await (prisma as any).timesheet.findUnique({ where: { id: timesheetId } });
    if (!ts || ts.employeeId !== emp.id) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Timecard not found');
    }
    if (ts.status !== 'DRAFT' && ts.status !== 'REJECTED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Cannot submit a timecard in status ${ts.status}`);
    }
    if (!taskDetails || !taskDetails.trim()) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        'Task details are required before submitting a timecard.');
    }
    return (prisma as any).timesheet.update({
      where: { id: timesheetId },
      data: {
        status: 'SUBMITTED',
        taskDetails,
        submittedById: userId,
        submittedAt: new Date(),
        rejectionReason: null,
      },
    });
  },

  async listForApproval(supervisorUserId: number, status?: string, page = 1, pageSize = 10) {
    // Supervisor sees all SUBMITTED timecards in their facility(ies)
    const supervisor = await (prisma as any).user.findUnique({
      where: { id: supervisorUserId },
      select: { facilityId: true, companyId: true },
    });
    if (!supervisor) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'User not found');

    const where: any = {
      companyId: supervisor.companyId,
      facilityId: supervisor.facilityId,
    };
    if (status) where.status = status;
    else where.status = { in: ['SUBMITTED', 'APPROVED', 'REJECTED'] };

    const total = await (prisma as any).timesheet.count({ where });
    const data = await (prisma as any).timesheet.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeIdNumber: true, designation: true, overtimeAllowed: true } },
      },
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async approve(supervisorUserId: number, timesheetId: number) {
    const ts = await (prisma as any).timesheet.findUnique({
      where: { id: timesheetId },
      include: { employee: { select: { overtimeAllowed: true } } },
    });
    if (!ts) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Timecard not found');
    if (ts.status !== 'SUBMITTED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Only SUBMITTED timecards can be approved (current: ${ts.status}).`);
    }
    const hasOvertime = Number(ts.overtimeHours) > 0;
    if (hasOvertime && !ts.overtimeApproved && !ts.employee?.overtimeAllowed) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        'Timecard contains overtime but employee is not allowed OT. Use approve-overtime endpoint or reject.');
    }
    return (prisma as any).timesheet.update({
      where: { id: timesheetId },
      data: { status: 'APPROVED', approvedById: supervisorUserId, approvedAt: new Date() },
    });
  },

  async reject(supervisorUserId: number, timesheetId: number, reason: string) {
    if (!reason || !reason.trim()) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Rejection reason required');
    }
    const ts = await (prisma as any).timesheet.findUnique({ where: { id: timesheetId } });
    if (!ts) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Timecard not found');
    if (ts.status !== 'SUBMITTED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Only SUBMITTED timecards can be rejected (current: ${ts.status}).`);
    }
    return (prisma as any).timesheet.update({
      where: { id: timesheetId },
      data: { status: 'REJECTED', rejectionReason: reason, approvedById: supervisorUserId, approvedAt: new Date() },
    });
  },

  async approveOvertime(supervisorUserId: number, timesheetId: number) {
    const ts = await (prisma as any).timesheet.findUnique({ where: { id: timesheetId } });
    if (!ts) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Timecard not found');
    if (ts.status !== 'SUBMITTED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Only SUBMITTED timecards can have OT approved (current: ${ts.status}).`);
    }
    if (Number(ts.overtimeHours) <= 0) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        'No overtime hours on this timecard.');
    }
    return (prisma as any).timesheet.update({
      where: { id: timesheetId },
      data: { overtimeApproved: true, status: 'APPROVED', approvedById: supervisorUserId, approvedAt: new Date() },
    });
  },
};
