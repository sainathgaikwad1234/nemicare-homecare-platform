import { prisma } from '../config/database';

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export const reportsService = {
  async headcount(companyId: number) {
    const total = await (prisma as any).employee.count({ where: { companyId, deletedAt: null } });
    const active = await (prisma as any).employee.count({ where: { companyId, deletedAt: null, status: 'ACTIVE' } });
    const onboarding = await (prisma as any).employee.count({ where: { companyId, deletedAt: null, onboardingStatus: 'IN_PROGRESS' } });
    const terminated = await (prisma as any).employee.count({ where: { companyId, deletedAt: null, status: 'TERMINATED' } });

    const byDeptRaw = await (prisma as any).employee.groupBy({
      by: ['department'],
      where: { companyId, deletedAt: null, status: 'ACTIVE' },
      _count: { id: true },
    });
    const byDepartment = byDeptRaw.map((r: any) => ({ department: r.department || 'Unassigned', count: r._count.id }));

    const byClinicalRoleRaw = await (prisma as any).employee.groupBy({
      by: ['clinicalRole'],
      where: { companyId, deletedAt: null, status: 'ACTIVE' },
      _count: { id: true },
    });
    const byClinicalRole = byClinicalRoleRaw.map((r: any) => ({ role: r.clinicalRole || 'Other', count: r._count.id }));

    return { total, active, onboarding, terminated, byDepartment, byClinicalRole };
  },

  async turnover(companyId: number, monthsBack = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - monthsBack);
    const total = await (prisma as any).employee.count({ where: { companyId, deletedAt: null } });
    const exits = await (prisma as any).employeeExit.findMany({
      where: { companyId, status: 'COMPLETED', completedAt: { gte: since } },
      include: { employee: { select: { firstName: true, lastName: true, department: true, hireDate: true } } },
      orderBy: { completedAt: 'desc' },
    });
    const exitedCount = exits.length;
    const turnoverRate = total > 0 ? (exitedCount / total) * 100 : 0;

    // By month
    const byMonth: Record<string, number> = {};
    for (const e of exits) {
      const m = new Date(e.completedAt!);
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    }

    return {
      windowMonths: monthsBack,
      totalEmployees: total,
      exitsInWindow: exitedCount,
      turnoverRatePercent: Math.round(turnoverRate * 100) / 100,
      byMonth,
      recentExits: exits.slice(0, 20).map((e: any) => ({
        id: e.id,
        employeeName: `${e.employee?.firstName || ''} ${e.employee?.lastName || ''}`.trim(),
        department: e.employee?.department,
        completedAt: e.completedAt,
        exitType: e.exitType,
      })),
    };
  },

  async attendanceSummary(companyId: number, daysBack = 30) {
    const since = startOfDay(addDays(new Date(), -daysBack));
    const timesheets = await (prisma as any).timesheet.findMany({
      where: { companyId, periodStart: { gte: since } },
    });
    let totalHours = 0;
    let totalRegular = 0;
    let totalOvertime = 0;
    let totalBreakMinutes = 0;
    for (const t of timesheets) {
      totalHours += Number(t.totalHours || 0);
      totalRegular += Number(t.regularHours || 0);
      totalOvertime += Number(t.overtimeHours || 0);
      totalBreakMinutes += t.breakMinutes || 0;
    }

    const punches = await (prisma as any).employeePunch.count({
      where: { employee: { companyId }, timestamp: { gte: since } },
    });

    return {
      windowDays: daysBack,
      timesheetsCount: timesheets.length,
      totalHours: Math.round(totalHours * 10) / 10,
      regularHours: Math.round(totalRegular * 10) / 10,
      overtimeHours: Math.round(totalOvertime * 10) / 10,
      totalBreakHours: Math.round(totalBreakMinutes / 60 * 10) / 10,
      totalPunches: punches,
    };
  },

  async leaveUtilization(companyId: number) {
    const balances = await (prisma as any).leaveBalance.findMany({
      where: { companyId },
      include: { employee: { select: { id: true, firstName: true, lastName: true, department: true } } },
    });
    let totalAnnual = 0, totalSick = 0, totalPersonal = 0, totalUnpaid = 0;
    for (const b of balances) {
      totalAnnual += Number(b.annualBalance || 0);
      totalSick += Number(b.sickBalance || 0);
      totalPersonal += Number(b.personalBalance || 0);
      totalUnpaid += Number(b.unpaidBalance || 0);
    }
    const requestsThisYear = await (prisma as any).leaveRequest.findMany({
      where: { companyId, fromDate: { gte: new Date(new Date().getFullYear(), 0, 1) } },
    });
    const byStatus: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    let approvedDays = 0;
    for (const r of requestsThisYear) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      if (r.status === 'APPROVED') approvedDays += Number(r.totalDays);
    }
    return {
      remainingBalances: { annual: totalAnnual, sick: totalSick, personal: totalPersonal, unpaid: totalUnpaid },
      requestsThisYear: requestsThisYear.length,
      byStatus,
      approvedDaysThisYear: approvedDays,
    };
  },

  async compliance(companyId: number) {
    const today = startOfDay(new Date());
    const next30 = addDays(today, 30);
    const next7 = addDays(today, 7);

    const expired = await (prisma as any).employeeDocument.count({
      where: { employee: { companyId }, expiryDate: { not: null, lt: today } },
    });
    const expiringIn7 = await (prisma as any).employeeDocument.count({
      where: { employee: { companyId }, expiryDate: { gte: today, lte: next7 } },
    });
    const expiringIn30 = await (prisma as any).employeeDocument.count({
      where: { employee: { companyId }, expiryDate: { gte: today, lte: next30 } },
    });

    const testsExpired = await (prisma as any).employeeTest.count({
      where: { companyId, expiryDate: { not: null, lt: today }, status: { not: 'EXPIRED' } },
    });
    const testsExpiringIn7 = await (prisma as any).employeeTest.count({
      where: { companyId, expiryDate: { gte: today, lte: next7 }, status: { in: ['PASSED', 'PENDING'] } },
    });

    const onboardingInProgress = await (prisma as any).employee.count({
      where: { companyId, deletedAt: null, onboardingStatus: 'IN_PROGRESS' },
    });

    return {
      documents: { expired, expiringIn7, expiringIn30 },
      tests: { expired: testsExpired, expiringIn7: testsExpiringIn7 },
      onboardingInProgress,
    };
  },
};
