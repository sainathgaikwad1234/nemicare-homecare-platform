import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const EXPORT_ROOT = path.resolve(process.cwd(), 'exports', 'adp');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(v: any): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const payrollService = {
  async listBatches(companyId: number, page = 1, pageSize = 20) {
    const where = { companyId };
    const total = await (prisma as any).payrollBatch.count({ where });
    const data = await (prisma as any).payrollBatch.findMany({
      where,
      orderBy: { runDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { facility: { select: { id: true, name: true } } },
    });
    return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  },

  async getBatch(id: number) {
    const batch = await (prisma as any).payrollBatch.findUnique({
      where: { id },
      include: {
        facility: { select: { id: true, name: true } },
        timesheets: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeIdNumber: true, department: true, hourlyRate: true },
            },
          },
        },
      },
    });
    if (!batch) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Batch not found');
    return batch;
  },

  async runWeeklyPayroll(opts: {
    companyId: number;
    facilityId?: number;
    payPeriodStart: Date;
    payPeriodEnd: Date;
    runById?: number;
  }) {
    const { companyId, facilityId, payPeriodStart, payPeriodEnd, runById } = opts;

    const where: any = {
      companyId,
      status: 'APPROVED',
      payrollBatchId: null,
      periodStart: { gte: payPeriodStart },
      periodEnd: { lte: payPeriodEnd },
    };
    if (facilityId) where.facilityId = facilityId;

    const timesheets = await (prisma as any).timesheet.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeIdNumber: true, department: true, ssn: true, hourlyRate: true },
        },
      },
    });

    if (!timesheets.length) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        'No approved timecards available for the requested pay period.');
    }

    // Validate
    const errors: any[] = [];
    for (const t of timesheets) {
      if (!t.employee?.employeeIdNumber) errors.push({ employeeId: t.employee?.id, reason: 'Missing employeeIdNumber' });
      if (!t.employee?.department) errors.push({ employeeId: t.employee?.id, reason: 'Missing department' });
      if (!t.employee?.hourlyRate) errors.push({ employeeId: t.employee?.id, reason: 'Missing hourlyRate' });
    }

    let totalRegular = 0;
    let totalOt = 0;
    const employeeIds = new Set<number>();
    for (const t of timesheets) {
      totalRegular += Number(t.regularHours || 0);
      totalOt += Number(t.overtimeHours || 0);
      employeeIds.add(t.employeeId);
    }

    const batch = await (prisma as any).payrollBatch.create({
      data: {
        companyId,
        facilityId: facilityId ?? null,
        payPeriodStart,
        payPeriodEnd,
        status: errors.length ? 'FAILED' : 'VALIDATING',
        totalRegularHours: totalRegular,
        totalOvertimeHours: totalOt,
        totalEmployees: employeeIds.size,
        errors: errors.length ? errors : null,
        createdById: runById ?? null,
      },
    });

    if (errors.length) return batch;

    // Link timesheets to batch
    await (prisma as any).timesheet.updateMany({
      where: { id: { in: timesheets.map((t: any) => t.id) } },
      data: { payrollBatchId: batch.id },
    });

    // Generate ADP export CSV
    ensureDir(EXPORT_ROOT);
    const filename = `adp_${batch.id}_${payPeriodStart.toISOString().slice(0, 10)}_to_${payPeriodEnd.toISOString().slice(0, 10)}.csv`;
    const filepath = path.join(EXPORT_ROOT, filename);

    // Aggregate by employee for ADP (one row per employee per pay period)
    const byEmployee = new Map<number, { emp: any; regular: number; overtime: number; dept: string | null }>();
    for (const t of timesheets) {
      const cur = byEmployee.get(t.employeeId) || { emp: t.employee, regular: 0, overtime: 0, dept: t.employee?.department ?? null };
      cur.regular += Number(t.regularHours || 0);
      cur.overtime += Number(t.overtimeHours || 0);
      byEmployee.set(t.employeeId, cur);
    }

    const header = ['EmployeeID', 'FirstName', 'LastName', 'Department', 'RegularHours', 'OvertimeHours'].join(',');
    const lines = [header];
    for (const { emp, regular, overtime, dept } of byEmployee.values()) {
      lines.push([
        csvEscape(emp.employeeIdNumber),
        csvEscape(emp.firstName),
        csvEscape(emp.lastName),
        csvEscape(dept),
        regular.toFixed(2),
        overtime.toFixed(2),
      ].join(','));
    }
    fs.writeFileSync(filepath, lines.join('\n'), 'utf8');

    const updated = await (prisma as any).payrollBatch.update({
      where: { id: batch.id },
      data: {
        status: 'EXPORTED',
        adpExportPath: filepath,
      },
    });

    return updated;
  },

  async sendToAdp(batchId: number) {
    // Stubbed secure transfer — in production this would SFTP / API call to ADP.
    // We simulate by flipping state and recording the timestamp.
    const batch = await (prisma as any).payrollBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Batch not found');
    if (batch.status !== 'EXPORTED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `Batch must be in EXPORTED state (current: ${batch.status}).`);
    }
    const now = new Date();
    // Mark all linked timesheets as PAID
    await (prisma as any).timesheet.updateMany({
      where: { payrollBatchId: batchId },
      data: { status: 'PAID' },
    });
    return (prisma as any).payrollBatch.update({
      where: { id: batchId },
      data: { status: 'COMPLETE', adpTransferAt: now },
    });
  },
};
