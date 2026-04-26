import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const SHIFT_DEFAULTS: Record<string, { start: string; end: string }> = {
  FIRST: { start: '9:00 AM', end: '8:00 PM' },
  SECOND: { start: '3:00 PM', end: '12:00 AM' },
  THIRD: { start: '12:00 AM', end: '9:00 AM' },
};

interface CalendarOptions {
  companyId: number;
  facilityId?: number;
  view: 'DAY' | 'WEEK' | 'MONTH';
  date: string; // YYYY-MM-DD anchor
}

const getRange = (view: string, anchor: Date) => {
  const from = new Date(anchor);
  const to = new Date(anchor);
  if (view === 'DAY') {
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
  } else if (view === 'WEEK') {
    from.setDate(anchor.getDate() - anchor.getDay()); // Sunday
    from.setHours(0, 0, 0, 0);
    to.setTime(from.getTime());
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  } else {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
    to.setMonth(anchor.getMonth() + 1, 0);
    to.setHours(23, 59, 59, 999);
  }
  return { from, to };
};

export const shiftService = {
  async listShifts(opts: { companyId: number; facilityId?: number; from?: string; to?: string }) {
    const where: any = { companyId: Number(opts.companyId) };
    if (opts.facilityId) where.facilityId = Number(opts.facilityId);
    if (opts.from) where.shiftDate = { ...(where.shiftDate || {}), gte: new Date(opts.from) };
    if (opts.to) where.shiftDate = { ...(where.shiftDate || {}), lte: new Date(opts.to) };
    return (prisma as any).shiftSchedule.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, designation: true, clinicalRole: true } },
      },
      orderBy: [{ shiftDate: 'asc' }, { startTime: 'asc' }],
    });
  },

  async getCalendar(opts: CalendarOptions) {
    const anchor = new Date(opts.date);
    const { from, to } = getRange(opts.view, anchor);
    const where: any = { companyId: Number(opts.companyId), shiftDate: { gte: from, lte: to } };
    if (opts.facilityId) where.facilityId = Number(opts.facilityId);

    const [shifts, leaveRequests] = await Promise.all([
      (prisma as any).shiftSchedule.findMany({
        where,
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, designation: true, clinicalRole: true } },
        },
        orderBy: [{ shiftDate: 'asc' }],
      }),
      (prisma as any).leaveRequest.findMany({
        where: {
          companyId: Number(opts.companyId),
          OR: [
            { fromDate: { gte: from, lte: to } },
            { toDate: { gte: from, lte: to } },
            { AND: [{ fromDate: { lte: from } }, { toDate: { gte: to } }] },
          ],
        },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true, profilePictureUrl: true, designation: true, clinicalRole: true } },
        },
      }),
    ]);

    // Get all active employees for the facility (for column headers in week/month, and Day-Off bucket)
    const employees = await (prisma as any).employee.findMany({
      where: {
        companyId: Number(opts.companyId),
        ...(opts.facilityId ? { facilityId: Number(opts.facilityId) } : {}),
        deletedAt: null,
        onboardingStatus: 'COMPLETED',
        status: 'ACTIVE',
      },
      select: {
        id: true, firstName: true, lastName: true, profilePictureUrl: true, designation: true, clinicalRole: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return { range: { from, to }, view: opts.view, shifts, leaveRequests, employees };
  },

  async createShift(input: any, userId: number) {
    if (!input.employeeId || !input.shiftDate || !input.shiftType) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'employeeId, shiftDate, and shiftType are required');
    }
    const dft = SHIFT_DEFAULTS[input.shiftType] || { start: input.startTime, end: input.endTime };
    const employee = await (prisma as any).employee.findFirst({
      where: { id: Number(input.employeeId), companyId: Number(input.companyId), deletedAt: null },
    });
    if (!employee) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 'Invalid employee');

    return (prisma as any).shiftSchedule.create({
      data: {
        companyId: Number(input.companyId),
        facilityId: Number(input.facilityId || employee.facilityId),
        employeeId: Number(input.employeeId),
        shiftDate: new Date(input.shiftDate),
        shiftType: input.shiftType,
        startTime: input.startTime || dft.start,
        endTime: input.endTime || dft.end,
        status: input.status || 'SCHEDULED',
        notes: input.notes || null,
        createdById: Number(userId),
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });
  },

  async updateShift(id: number, companyId: number, input: any) {
    const existing = await (prisma as any).shiftSchedule.findFirst({
      where: { id: Number(id), companyId: Number(companyId) },
    });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Shift not found');

    const update: any = {};
    if (input.shiftDate) update.shiftDate = new Date(input.shiftDate);
    if (input.shiftType) {
      update.shiftType = input.shiftType;
      const dft = SHIFT_DEFAULTS[input.shiftType];
      if (dft) { update.startTime = input.startTime || dft.start; update.endTime = input.endTime || dft.end; }
    }
    if (input.startTime) update.startTime = input.startTime;
    if (input.endTime) update.endTime = input.endTime;
    if (input.status) update.status = input.status;
    if (input.notes !== undefined) update.notes = input.notes;

    return (prisma as any).shiftSchedule.update({ where: { id: Number(id) }, data: update });
  },

  async deleteShift(id: number, companyId: number) {
    const existing = await (prisma as any).shiftSchedule.findFirst({
      where: { id: Number(id), companyId: Number(companyId) },
    });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Shift not found');
    await (prisma as any).shiftSchedule.delete({ where: { id: Number(id) } });
    return { message: 'Shift removed' };
  },

  async bulkAssign(input: any, userId: number) {
    if (!Array.isArray(input.employeeIds) || input.employeeIds.length === 0) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'employeeIds must be a non-empty array');
    }
    if (!Array.isArray(input.dates) || input.dates.length === 0) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'dates must be a non-empty array');
    }
    if (!input.shiftType) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'shiftType is required');
    }
    const dft = SHIFT_DEFAULTS[input.shiftType] || { start: '9:00 AM', end: '5:00 PM' };
    const facilityId = Number(input.facilityId);
    const companyId = Number(input.companyId);

    const records: any[] = [];
    for (const empId of input.employeeIds) {
      for (const date of input.dates) {
        records.push({
          companyId,
          facilityId,
          employeeId: Number(empId),
          shiftDate: new Date(date),
          shiftType: input.shiftType,
          startTime: input.startTime || dft.start,
          endTime: input.endTime || dft.end,
          status: 'SCHEDULED',
          createdById: Number(userId),
        });
      }
    }

    const result = await (prisma as any).shiftSchedule.createMany({ data: records, skipDuplicates: true });
    return { created: result.count, total: records.length };
  },
};
