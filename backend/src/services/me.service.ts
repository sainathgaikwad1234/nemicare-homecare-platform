import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { shiftService } from './shift.service';
import { leaveService } from './leave.service';

const resolveEmployee = async (userId: number) => {
  const emp = await (prisma as any).employee.findFirst({
    where: { userId: Number(userId), deletedAt: null },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      facility: { select: { id: true, name: true } },
      reportingManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
      leaveBalance: true,
    },
  });
  if (!emp) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND,
      'No employee record linked to this user. Contact HR.');
  }
  return emp;
};

export const meService = {
  async getProfile(userId: number) {
    return resolveEmployee(userId);
  },

  async getShiftsCalendar(userId: number, view: 'DAY' | 'WEEK' | 'MONTH', date: string) {
    const emp = await resolveEmployee(userId);
    const calendar = await shiftService.getCalendar({
      companyId: emp.companyId,
      facilityId: emp.facilityId,
      view,
      date,
    });
    // Filter to self only
    return {
      ...calendar,
      shifts: calendar.shifts.filter((s: any) => s.employeeId === emp.id),
      leaveRequests: calendar.leaveRequests.filter((l: any) => l.employeeId === emp.id),
      employees: calendar.employees.filter((e: any) => e.id === emp.id),
    };
  },

  async getLeaves(userId: number, status: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' = 'ALL', page = 1, pageSize = 10) {
    const emp = await resolveEmployee(userId);
    const where: any = { companyId: emp.companyId, employeeId: emp.id };
    if (status === 'PENDING') where.status = 'PENDING';
    else if (status === 'APPROVED') where.status = 'APPROVED';
    else if (status === 'REJECTED') where.status = 'REJECTED';

    const total = await (prisma as any).leaveRequest.count({ where });
    const data = await (prisma as any).leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getLeaveBalance(userId: number) {
    const emp = await resolveEmployee(userId);
    if (emp.leaveBalance) return emp.leaveBalance;
    // Auto-create if missing
    const currentYear = new Date().getFullYear();
    return (prisma as any).leaveBalance.create({
      data: {
        companyId: emp.companyId,
        employeeId: emp.id,
        annualBalance: 15,
        sickBalance: 10,
        personalBalance: 5,
        unpaidBalance: 0,
        year: currentYear,
      },
    });
  },

  async submitLeave(userId: number, input: any) {
    const emp = await resolveEmployee(userId);
    return leaveService.createLeave(input, emp.id, emp.companyId);
  },

  // Sprint 5.4 — quota check inline
  async checkLeaveQuota(userId: number, leaveType: string, days: number) {
    const emp = await resolveEmployee(userId);
    return leaveService.checkQuota(emp.id, leaveType, days);
  },

  // Sprint 5.4 — respond to supervisor's info request
  async respondToInfoRequest(userId: number, leaveId: number, response: string) {
    const emp = await resolveEmployee(userId);
    return leaveService.respondToInfoRequest(leaveId, emp.companyId, emp.id, response);
  },

  async getUpcomingShift(userId: number) {
    const emp = await resolveEmployee(userId);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return (prisma as any).shiftSchedule.findFirst({
      where: {
        employeeId: emp.id,
        companyId: emp.companyId,
        shiftDate: { gte: now },
        status: 'SCHEDULED',
      },
      orderBy: { shiftDate: 'asc' },
    });
  },

  async getDashboardSummary(userId: number) {
    const emp = await resolveEmployee(userId);
    const now = new Date();

    const [upcomingShift, pendingLeaves, balance] = await Promise.all([
      (prisma as any).shiftSchedule.findFirst({
        where: { employeeId: emp.id, companyId: emp.companyId, shiftDate: { gte: now }, status: 'SCHEDULED' },
        orderBy: { shiftDate: 'asc' },
      }),
      (prisma as any).leaveRequest.count({
        where: { employeeId: emp.id, companyId: emp.companyId, status: 'PENDING' },
      }),
      this.getLeaveBalance(userId),
    ]);

    return {
      upcomingShift,
      pendingLeavesCount: pendingLeaves,
      leaveBalance: balance,
      performance: { overall: null, lastReviewedAt: null }, // Phase 4
    };
  },
};
