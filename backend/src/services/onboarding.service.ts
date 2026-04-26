import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const STEP1_DOC_TYPES = ['BACKGROUND_CHECK_REPORT', 'DRUG_SCREEN_REPORT', 'DMV_BACKGROUND_CHECK'];

const ensureEmployeeInProgress = async (employeeId: number, companyId: number) => {
  const emp = await (prisma as any).employee.findFirst({
    where: { id: Number(employeeId), companyId: Number(companyId), deletedAt: null },
  });
  if (!emp) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');
  if (emp.onboardingStatus === 'COMPLETED') {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Employee onboarding already completed');
  }
  return emp;
};

export const onboardingService = {
  async getOnboardingState(employeeId: number, companyId: number) {
    const emp = await (prisma as any).employee.findFirst({
      where: { id: Number(employeeId), companyId: Number(companyId), deletedAt: null },
      include: {
        onboardingDocuments: { orderBy: { createdAt: 'asc' } },
        onboardingMandatoryDocs: { orderBy: { uploadedAt: 'desc' } },
        reportingManager: { select: { id: true, firstName: true, lastName: true, designation: true } },
      },
    });
    if (!emp) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');

    return {
      employeeId: emp.id,
      onboardingStatus: emp.onboardingStatus,
      onboardingStep: emp.onboardingStep,
      welcomeEmailHistory: emp.welcomeEmailHistory || [],
      step1: {
        documents: emp.onboardingDocuments,
        allComplete: STEP1_DOC_TYPES.every((t) =>
          (emp.onboardingDocuments || []).some((d: any) => d.documentType === t && d.status === 'COMPLETE')
        ),
      },
      step2: {
        mandatoryDocs: emp.onboardingMandatoryDocs,
        slotsCompleted: (emp.onboardingMandatoryDocs || []).map((d: any) => d.slot),
      },
      step3: {
        officialStartDate: emp.officialStartDate,
        summary: {
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          department: emp.department,
          jobTitle: emp.designation || emp.positionTitle,
          supervisor: emp.reportingManager
            ? `${emp.reportingManager.firstName || ''} ${emp.reportingManager.lastName || ''}`.trim()
            : null,
        },
      },
    };
  },

  async addStep1Document(employeeId: number, companyId: number, input: any, userId: number) {
    await ensureEmployeeInProgress(employeeId, companyId);
    if (!STEP1_DOC_TYPES.includes(input.documentType)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `Invalid documentType. Allowed: ${STEP1_DOC_TYPES.join(', ')}`);
    }
    return (prisma as any).onboardingDocument.create({
      data: {
        companyId: Number(companyId),
        employeeId: Number(employeeId),
        documentType: input.documentType,
        status: 'PENDING',
        agencyId: input.agencyId ? Number(input.agencyId) : null,
        createdById: Number(userId),
      },
    });
  },

  async sendStep1Document(employeeId: number, companyId: number, docId: number) {
    await ensureEmployeeInProgress(employeeId, companyId);
    const doc = await (prisma as any).onboardingDocument.findFirst({
      where: { id: Number(docId), employeeId: Number(employeeId), companyId: Number(companyId) },
    });
    if (!doc) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Document not found');
    return (prisma as any).onboardingDocument.update({
      where: { id: Number(docId) },
      data: { status: 'SENT', sentAt: new Date() },
    });
  },

  async completeStep1Document(employeeId: number, companyId: number, docId: number, fileUrl: string) {
    await ensureEmployeeInProgress(employeeId, companyId);
    const doc = await (prisma as any).onboardingDocument.findFirst({
      where: { id: Number(docId), employeeId: Number(employeeId), companyId: Number(companyId) },
    });
    if (!doc) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Document not found');
    return (prisma as any).onboardingDocument.update({
      where: { id: Number(docId) },
      data: { status: 'COMPLETE', fileUrl: fileUrl || doc.fileUrl, completedAt: new Date() },
    });
  },

  async deleteStep1Document(employeeId: number, companyId: number, docId: number) {
    await ensureEmployeeInProgress(employeeId, companyId);
    const doc = await (prisma as any).onboardingDocument.findFirst({
      where: { id: Number(docId), employeeId: Number(employeeId), companyId: Number(companyId) },
    });
    if (!doc) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Document not found');
    await (prisma as any).onboardingDocument.delete({ where: { id: Number(docId) } });
    return { message: 'Document removed' };
  },

  async setStep1Agency(employeeId: number, companyId: number, location: string, agencyId: number | null) {
    await ensureEmployeeInProgress(employeeId, companyId);
    // Apply agency to all current Step 1 docs
    await (prisma as any).onboardingDocument.updateMany({
      where: { employeeId: Number(employeeId), companyId: Number(companyId) },
      data: { agencyId: agencyId ? Number(agencyId) : null },
    });
    return { location, agencyId };
  },

  async markStep1Satisfactory(employeeId: number, companyId: number) {
    const emp = await ensureEmployeeInProgress(employeeId, companyId);
    if ((emp.onboardingStep ?? 1) < 1) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Already past Step 1');
    }
    const docs = await (prisma as any).onboardingDocument.findMany({
      where: { employeeId: Number(employeeId), companyId: Number(companyId) },
    });
    const allComplete = STEP1_DOC_TYPES.every((t) => docs.some((d: any) => d.documentType === t && d.status === 'COMPLETE'));
    if (!allComplete) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR,
        `All 3 pre-employment screening documents must be Complete before marking satisfactory. Required: ${STEP1_DOC_TYPES.join(', ')}`);
    }
    return (prisma as any).employee.update({
      where: { id: Number(employeeId) },
      data: { onboardingStep: 2 },
    });
  },

  async uploadStep2Document(employeeId: number, companyId: number, input: any, userId: number) {
    await ensureEmployeeInProgress(employeeId, companyId);
    const validSlots = ['LICENSES', 'CPR_CERTIFICATES', 'TB_TESTS', 'I9_W4_FORMS', 'VISA_DETAILS'];
    if (!validSlots.includes(input.slot)) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `Invalid slot. Allowed: ${validSlots.join(', ')}`);
    }
    if (!input.fileUrl) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'fileUrl is required');
    }
    return (prisma as any).onboardingMandatoryDoc.upsert({
      where: { employeeId_slot: { employeeId: Number(employeeId), slot: input.slot } },
      update: { fileUrl: input.fileUrl, uploadedById: Number(userId) },
      create: {
        companyId: Number(companyId),
        employeeId: Number(employeeId),
        slot: input.slot,
        fileUrl: input.fileUrl,
        uploadedById: Number(userId),
      },
    });
  },

  async advanceToStep3(employeeId: number, companyId: number) {
    const emp = await ensureEmployeeInProgress(employeeId, companyId);
    if ((emp.onboardingStep ?? 1) < 2) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Complete Step 1 first');
    }
    return (prisma as any).employee.update({
      where: { id: Number(employeeId) },
      data: { onboardingStep: 3 },
    });
  },

  async activate(employeeId: number, companyId: number, officialStartDate: string) {
    const emp = await ensureEmployeeInProgress(employeeId, companyId);
    if (!officialStartDate) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'officialStartDate is required');
    }
    return prisma.$transaction(async (tx: any) => {
      const updated = await tx.employee.update({
        where: { id: Number(employeeId) },
        data: {
          onboardingStatus: 'COMPLETED',
          status: 'ACTIVE',
          onboardingStep: 3,
          officialStartDate: new Date(officialStartDate),
          activatedAt: new Date(),
        },
        include: {
          user: { select: { id: true, email: true } },
          facility: { select: { id: true, name: true } },
        },
      });
      // Activate the underlying user account
      await tx.user.update({
        where: { id: emp.userId },
        data: { active: true },
      });
      return updated;
    });
  },

  async sendWelcomeEmail(employeeId: number, companyId: number, sentById: number, subject?: string) {
    const emp = await (prisma as any).employee.findFirst({
      where: { id: Number(employeeId), companyId: Number(companyId), deletedAt: null },
    });
    if (!emp) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Employee not found');

    const history = Array.isArray(emp.welcomeEmailHistory) ? [...emp.welcomeEmailHistory] : [];
    history.push({
      sentAt: new Date().toISOString(),
      sentById: Number(sentById),
      subject: subject || 'Welcome to Nemicare',
    });

    const updated = await (prisma as any).employee.update({
      where: { id: Number(employeeId) },
      data: { welcomeEmailHistory: history, welcomeEmailSentAt: new Date() },
    });

    // TODO: integrate real email/SES sender. Placeholder logs to console.
    console.log(`[HRMS] Welcome email queued for ${emp.email} (history: ${history.length})`);
    return { sentAt: updated.welcomeEmailSentAt, totalSends: history.length };
  },

  // Background check agency directory
  async listAgencies(companyId: number, location?: string) {
    return (prisma as any).backgroundCheckAgency.findMany({
      where: {
        companyId: Number(companyId),
        active: true,
        ...(location ? { location } : {}),
      },
      orderBy: [{ location: 'asc' }, { agencyName: 'asc' }],
    });
  },

  async createAgency(companyId: number, input: any) {
    if (!input.location || !input.agencyName) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'location and agencyName are required');
    }
    return (prisma as any).backgroundCheckAgency.create({
      data: {
        companyId: Number(companyId),
        location: input.location,
        agencyName: input.agencyName,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone || null,
        active: true,
      },
    });
  },
};
