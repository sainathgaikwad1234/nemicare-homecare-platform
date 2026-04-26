import { prisma } from '../config/database';
import { notificationService } from '../services/notification.service';
import { payrollService } from '../services/payroll.service';
import { JobResult } from './runner';

const ALERT_OFFSETS_DAYS = [60, 30, 7];
const REVIEW_LEAD_DAYS = 30;
const COVERAGE_MINIMUMS: Record<string, number> = { FIRST: 5, SECOND: 3, THIRD: 3 };

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const daysBetween = (a: Date, b: Date) => Math.floor((startOfDay(b).getTime() - startOfDay(a).getTime()) / (1000 * 60 * 60 * 24));

// ============================================
// 1. Document expiry monitor (60/30/7 days)
// ============================================
export const monitorDocExpiry = async (): Promise<JobResult> => {
  const today = startOfDay(new Date());
  let alerts = 0;
  let scanned = 0;

  // Scan EmployeeDocument with expiryDate
  const docs = await (prisma as any).employeeDocument.findMany({
    where: { expiryDate: { not: null } },
    include: {
      employee: {
        select: { id: true, companyId: true, facilityId: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  for (const doc of docs) {
    scanned++;
    if (!doc.expiryDate || !doc.employee) continue;
    const daysToExpiry = daysBetween(today, new Date(doc.expiryDate));
    if (ALERT_OFFSETS_DAYS.includes(daysToExpiry)) {
      const isExpired = daysToExpiry <= 0;
      await notificationService.send({
        companyId: doc.employee.companyId,
        facilityId: doc.employee.facilityId,
        title: isExpired ? `EXPIRED: ${doc.documentName}` : `Document expiring in ${daysToExpiry}d: ${doc.documentName}`,
        body: `${doc.employee.firstName} ${doc.employee.lastName} — ${doc.documentName} ${isExpired ? 'has expired' : `expires in ${daysToExpiry} days`} (${new Date(doc.expiryDate).toLocaleDateString()}).`,
        category: 'doc-expiry',
        emailTo: doc.employee.email ? [doc.employee.email] : undefined,
      });
      alerts++;
    }
  }

  // Sprint 5.6 — Also scan EmployeeTest expiries (TB tests, drug screens, physicals, etc.)
  const tests = await (prisma as any).employeeTest.findMany({
    where: { expiryDate: { not: null }, status: { in: ['PASSED', 'PENDING'] } },
    include: {
      employee: {
        select: { id: true, companyId: true, facilityId: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  for (const t of tests) {
    scanned++;
    if (!t.expiryDate || !t.employee) continue;
    const daysToExpiry = daysBetween(today, new Date(t.expiryDate));
    if (ALERT_OFFSETS_DAYS.includes(daysToExpiry)) {
      const isExpired = daysToExpiry <= 0;
      await notificationService.send({
        companyId: t.employee.companyId,
        facilityId: t.employee.facilityId,
        title: isExpired ? `EXPIRED: ${t.testName || t.testType}` : `Test expiring in ${daysToExpiry}d: ${t.testName || t.testType}`,
        body: `${t.employee.firstName} ${t.employee.lastName} — ${t.testName || t.testType} ${isExpired ? 'has expired' : `expires in ${daysToExpiry} days`} (${new Date(t.expiryDate).toLocaleDateString()}). Schedule re-test.`,
        category: 'test-expiry',
        emailTo: t.employee.email ? [t.employee.email] : undefined,
      });
      // Auto-mark expired tests
      if (isExpired) {
        await (prisma as any).employeeTest.update({ where: { id: t.id }, data: { status: 'EXPIRED' } });
      }
      alerts++;
    }
  }

  return {
    itemsProcessed: scanned,
    alertsSent: alerts,
    summary: `Scanned ${scanned} item(s) (documents + tests); sent ${alerts} expiry alert(s).`,
  };
};

// ============================================
// 2. Performance review cycle trigger (anniversary - 30d)
// ============================================
export const triggerReviewCycle = async (): Promise<JobResult> => {
  const today = startOfDay(new Date());
  const target = addDays(today, REVIEW_LEAD_DAYS); // 30 days from today
  let created = 0;
  let scanned = 0;

  const employees = await (prisma as any).employee.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    select: {
      id: true, companyId: true, facilityId: true, firstName: true, lastName: true,
      hireDate: true, reportingManagerId: true,
    },
  });

  for (const emp of employees) {
    scanned++;
    if (!emp.hireDate) continue;
    // Check if anniversary in this calendar year falls on `target` date
    const hire = new Date(emp.hireDate);
    const anniversaryThisYear = new Date(target.getFullYear(), hire.getMonth(), hire.getDate());
    if (
      anniversaryThisYear.getFullYear() === target.getFullYear() &&
      anniversaryThisYear.getMonth() === target.getMonth() &&
      anniversaryThisYear.getDate() === target.getDate()
    ) {
      // Check no review already exists for this period
      const periodStart = startOfDay(new Date(anniversaryThisYear.getFullYear() - 1, hire.getMonth(), hire.getDate()));
      const periodEnd = endOfDay(anniversaryThisYear);
      const existing = await (prisma as any).performanceReview.findFirst({
        where: { employeeId: emp.id, periodStart, periodEnd },
      });
      if (existing) continue;

      const reviewerId = emp.reportingManagerId ?? emp.id; // fallback: self
      await (prisma as any).performanceReview.create({
        data: {
          companyId: emp.companyId,
          employeeId: emp.id,
          reviewerId,
          periodStart,
          periodEnd,
          status: 'DRAFT',
        },
      });
      await notificationService.send({
        companyId: emp.companyId,
        facilityId: emp.facilityId,
        title: `Review due in ${REVIEW_LEAD_DAYS} days: ${emp.firstName} ${emp.lastName}`,
        body: `Annual performance review for ${emp.firstName} ${emp.lastName} is due ${anniversaryThisYear.toLocaleDateString()}. A draft has been created — please complete it.`,
        category: 'review-due',
      });
      created++;
    }
  }

  return {
    itemsProcessed: scanned,
    alertsSent: created,
    summary: `Scanned ${scanned} employees; created ${created} review draft(s).`,
  };
};

// ============================================
// 3. 24/7 coverage monitoring
// ============================================
export const monitorCoverage = async (): Promise<JobResult> => {
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  let alerts = 0;
  let scanned = 0;

  const facilities = await (prisma as any).facility.findMany({
    where: { active: true, deletedAt: null },
    select: { id: true, companyId: true, name: true },
  });

  for (const f of facilities) {
    for (const date of [today, tomorrow]) {
      const startOfRange = startOfDay(date);
      const endOfRange = endOfDay(date);
      const shifts = await (prisma as any).shiftSchedule.findMany({
        where: {
          facilityId: f.id,
          shiftDate: { gte: startOfRange, lte: endOfRange },
          status: 'SCHEDULED',
        },
      });
      const counts: Record<string, number> = { FIRST: 0, SECOND: 0, THIRD: 0 };
      for (const s of shifts) {
        if (counts[s.shiftType] !== undefined) counts[s.shiftType]++;
      }
      scanned++;
      const understaffed: string[] = [];
      for (const type of Object.keys(COVERAGE_MINIMUMS)) {
        if (counts[type] < COVERAGE_MINIMUMS[type]) {
          understaffed.push(`${type} shift: ${counts[type]}/${COVERAGE_MINIMUMS[type]}`);
        }
      }
      if (understaffed.length) {
        await notificationService.send({
          companyId: f.companyId,
          facilityId: f.id,
          title: `Understaffed for ${date.toLocaleDateString()} — ${f.name}`,
          body: `Coverage gaps: ${understaffed.join('; ')}. Review the roster and assign replacements.`,
          category: 'coverage',
        });
        alerts++;
      }
    }
  }

  return {
    itemsProcessed: scanned,
    alertsSent: alerts,
    summary: `Checked ${scanned} facility-day(s); ${alerts} understaffing alert(s).`,
  };
};

// ============================================
// 4. Block roster on leave approved (event-driven, called from leave service)
// Exported as a function called when LeaveRequest flips to APPROVED.
// ============================================
export async function blockRosterForLeave(leaveRequestId: number) {
  const lr = await (prisma as any).leaveRequest.findUnique({
    where: { id: leaveRequestId },
    select: { id: true, employeeId: true, fromDate: true, toDate: true, status: true },
  });
  if (!lr || lr.status !== 'APPROVED') return { blocked: 0 };

  const result = await (prisma as any).shiftSchedule.updateMany({
    where: {
      employeeId: lr.employeeId,
      shiftDate: { gte: startOfDay(new Date(lr.fromDate)), lte: endOfDay(new Date(lr.toDate)) },
      status: { in: ['SCHEDULED', 'DAY_OFF'] },
    },
    data: { status: 'LEAVE_BLOCKED', appliedLeaveRequestId: lr.id },
  });
  return { blocked: result.count };
}

// ============================================
// 5. Weekly payroll process (every other Friday)
// ============================================
export const runWeeklyPayroll = async (companyId?: number): Promise<JobResult> => {
  const cId = companyId ?? 1;
  const today = startOfDay(new Date());
  // Pay period = previous 14 days (bi-weekly)
  const periodEnd = endOfDay(addDays(today, -1));
  const periodStart = startOfDay(addDays(today, -14));

  try {
    const batch = await payrollService.runWeeklyPayroll({
      companyId: cId,
      payPeriodStart: periodStart,
      payPeriodEnd: periodEnd,
    });
    if (batch.status === 'EXPORTED') {
      // Auto-send to ADP after export
      await payrollService.sendToAdp(batch.id);
    }
    return {
      itemsProcessed: batch.totalEmployees,
      alertsSent: 1,
      summary: `Batch #${batch.id} — ${batch.totalEmployees} employees, status ${batch.status}.`,
      errors: batch.errors ? (Array.isArray(batch.errors) ? batch.errors.map((e: any) => ({ context: 'validation', message: JSON.stringify(e) })) : null) : undefined,
    };
  } catch (e: any) {
    if (e?.message?.includes('No approved timecards')) {
      return { itemsProcessed: 0, summary: 'No approved timecards for this pay period; nothing to run.' };
    }
    throw e;
  }
};

// ============================================
// 6. Attendance summary report (weekly)
// ============================================
export const generateAttendanceSummary = async (): Promise<JobResult> => {
  const today = startOfDay(new Date());
  const weekStart = addDays(today, -7);

  const stats = await (prisma as any).timesheet.groupBy({
    by: ['companyId', 'facilityId'],
    where: { periodStart: { gte: weekStart, lt: today } },
    _sum: { totalHours: true, regularHours: true, overtimeHours: true },
    _count: { id: true },
  });

  let alerts = 0;
  for (const s of stats) {
    await notificationService.send({
      companyId: s.companyId,
      facilityId: s.facilityId,
      title: `Weekly attendance summary — ${weekStart.toLocaleDateString()} to ${today.toLocaleDateString()}`,
      body: `Timecards: ${s._count.id}. Total: ${Number(s._sum.totalHours || 0).toFixed(1)}h (regular ${Number(s._sum.regularHours || 0).toFixed(1)}h, OT ${Number(s._sum.overtimeHours || 0).toFixed(1)}h).`,
      category: 'report-attendance',
    });
    alerts++;
  }
  return { itemsProcessed: stats.length, alertsSent: alerts, summary: `Posted ${alerts} attendance summary notice(s).` };
};

// ============================================
// 7. Overtime analysis report (weekly)
// ============================================
export const generateOvertimeAnalysis = async (): Promise<JobResult> => {
  const today = startOfDay(new Date());
  const weekStart = addDays(today, -7);

  const overtimeRows = await (prisma as any).timesheet.findMany({
    where: {
      periodStart: { gte: weekStart, lt: today },
      overtimeHours: { gt: 0 },
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true, department: true, companyId: true, facilityId: true } },
    },
  });

  // Group by department
  const byDept = new Map<string, { dept: string; otHours: number; count: number; companyId: number; facilityId: number | null }>();
  for (const t of overtimeRows) {
    const key = `${t.facilityId}|${t.employee?.department ?? 'Unassigned'}`;
    const cur = byDept.get(key) || {
      dept: t.employee?.department ?? 'Unassigned',
      otHours: 0,
      count: 0,
      companyId: t.companyId,
      facilityId: t.facilityId,
    };
    cur.otHours += Number(t.overtimeHours);
    cur.count++;
    byDept.set(key, cur);
  }

  let alerts = 0;
  for (const v of byDept.values()) {
    await notificationService.send({
      companyId: v.companyId,
      facilityId: v.facilityId,
      title: `OT analysis — ${v.dept}`,
      body: `${v.count} employee-day(s) flagged in ${v.dept}. Total OT: ${v.otHours.toFixed(1)} hours.`,
      category: 'report-overtime',
    });
    alerts++;
  }
  return { itemsProcessed: overtimeRows.length, alertsSent: alerts, summary: `${overtimeRows.length} OT timecards across ${byDept.size} dept(s).` };
};

// ============================================
// 8. Compliance status report (daily)
// ============================================
export const generateComplianceStatus = async (): Promise<JobResult> => {
  const today = startOfDay(new Date());

  // Expired or expiring-within-7d documents per facility
  const next7 = addDays(today, 7);
  const docs = await (prisma as any).employeeDocument.findMany({
    where: {
      expiryDate: { not: null, lte: next7 },
    },
    include: {
      employee: { select: { companyId: true, facilityId: true, firstName: true, lastName: true } },
    },
  });

  const byFacility = new Map<number, { companyId: number; facilityId: number; expired: number; expiring: number }>();
  for (const d of docs) {
    if (!d.employee) continue;
    const key = d.employee.facilityId ?? 0;
    const cur = byFacility.get(key) || { companyId: d.employee.companyId, facilityId: d.employee.facilityId, expired: 0, expiring: 0 };
    if (new Date(d.expiryDate) < today) cur.expired++;
    else cur.expiring++;
    byFacility.set(key, cur);
  }

  let alerts = 0;
  for (const v of byFacility.values()) {
    if (!v.expired && !v.expiring) continue;
    await notificationService.send({
      companyId: v.companyId,
      facilityId: v.facilityId,
      title: `Compliance status — ${today.toLocaleDateString()}`,
      body: `${v.expired} document(s) EXPIRED, ${v.expiring} expiring within 7 days. Review HR Documents.`,
      category: 'report-compliance',
    });
    alerts++;
  }
  return { itemsProcessed: docs.length, alertsSent: alerts, summary: `${docs.length} doc(s) flagged across ${byFacility.size} facility(ies).` };
};
