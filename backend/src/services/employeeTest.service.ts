import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const TEST_LABELS: Record<string, string> = {
  TB_TEST: 'TB Skin Test (PPD)',
  DRUG_SCREEN: 'Drug Screen',
  PHYSICAL_EXAM: 'Physical Exam',
  FINGERPRINT_DMV: 'Fingerprint / DMV Background',
  CPR_CERTIFICATION: 'CPR Certification',
  HIV_TEST: 'HIV Test',
  COVID_TEST: 'COVID Test',
  HEPATITIS_B: 'Hepatitis B',
  OTHER: 'Other',
};

export const employeeTestService = {
  async listForEmployee(companyId: number, employeeId: number) {
    return (prisma as any).employeeTest.findMany({
      where: { companyId, employeeId },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
    });
  },

  async create(companyId: number, employeeId: number, recordedById: number, input: any) {
    if (!input.testType) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'testType required');
    return (prisma as any).employeeTest.create({
      data: {
        companyId,
        employeeId,
        recordedById,
        testType: input.testType,
        testName: input.testName || TEST_LABELS[input.testType] || input.testType,
        passedDate: input.passedDate ? new Date(input.passedDate) : null,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        status: input.status || (input.passedDate ? 'PASSED' : 'PENDING'),
        fileUrl: input.fileUrl || null,
        notes: input.notes || null,
      },
    });
  },

  async update(companyId: number, id: number, input: any) {
    const existing = await (prisma as any).employeeTest.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Test not found');
    const data: any = {};
    for (const f of ['testType', 'testName', 'status', 'fileUrl', 'notes']) {
      if (input[f] !== undefined) data[f] = input[f];
    }
    if (input.passedDate !== undefined) data.passedDate = input.passedDate ? new Date(input.passedDate) : null;
    if (input.expiryDate !== undefined) data.expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    return (prisma as any).employeeTest.update({ where: { id }, data });
  },

  async remove(companyId: number, id: number) {
    const existing = await (prisma as any).employeeTest.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Test not found');
    await (prisma as any).employeeTest.delete({ where: { id } });
    return { id };
  },
};

export const bgCheckDispatchService = {
  async listForEmployee(companyId: number, employeeId: number) {
    return (prisma as any).bgCheckDispatch.findMany({
      where: { companyId, employeeId },
      include: { agency: { select: { id: true, agencyName: true, location: true, contactEmail: true } } },
      orderBy: { dispatchedAt: 'desc' },
    });
  },

  async dispatch(companyId: number, employeeId: number, dispatchedById: number, input: { agencyId: number; consentDate: string; notes?: string }) {
    if (!input.agencyId) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'agencyId required');
    if (!input.consentDate) throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'consentDate required');

    const agency = await (prisma as any).backgroundCheckAgency.findFirst({
      where: { id: Number(input.agencyId), companyId, active: true },
    });
    if (!agency) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Agency not found');

    const employee = await (prisma as any).employee.findFirst({
      where: { id: employeeId, companyId, deletedAt: null },
      select: { firstName: true, lastName: true, email: true },
    });
    if (!employee) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');

    const dispatch = await (prisma as any).bgCheckDispatch.create({
      data: {
        companyId,
        employeeId,
        agencyId: agency.id,
        consentDate: new Date(input.consentDate),
        dispatchedById,
        status: 'SENT',
        notes: input.notes || null,
      },
      include: { agency: { select: { id: true, agencyName: true, contactEmail: true } } },
    });

    // Stub email dispatch — log only
    console.log(`[bgCheckDispatch] Sent ${employee.firstName} ${employee.lastName}'s BG check consent to ${agency.agencyName} <${agency.contactEmail || 'no email'}>`);

    return dispatch;
  },

  async recordReport(companyId: number, id: number, input: { reportFileUrl?: string; status?: string; notes?: string }) {
    const existing = await (prisma as any).bgCheckDispatch.findFirst({ where: { id, companyId } });
    if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Dispatch not found');
    return (prisma as any).bgCheckDispatch.update({
      where: { id },
      data: {
        reportReceivedAt: new Date(),
        reportFileUrl: input.reportFileUrl || existing.reportFileUrl,
        status: input.status || 'REPORT_RECEIVED',
        notes: input.notes ?? existing.notes,
      },
    });
  },
};
