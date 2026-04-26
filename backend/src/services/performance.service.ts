import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

const includeBlock = {
  employee: {
    select: {
      id: true, firstName: true, lastName: true, profilePictureUrl: true,
      email: true, phone: true, employeeIdNumber: true, designation: true, clinicalRole: true,
      department: true, hireDate: true,
    },
  },
  reviewer: { select: { id: true, firstName: true, lastName: true } },
};

const calcDaysLeft = (review: any): number => {
  if (!review.periodEnd) return 0;
  const end = new Date(review.periodEnd).getTime();
  const now = Date.now();
  return Math.round((end - now) / (24 * 60 * 60 * 1000));
};

export const performanceService = {
  async list(opts: { companyId: number; status?: string; page: number; pageSize: number }) {
    const where: any = { companyId: Number(opts.companyId) };
    if (opts.status === 'PENDING') where.status = { in: ['DRAFT', 'SUBMITTED'] };
    else if (opts.status) where.status = opts.status;

    const total = await (prisma as any).performanceReview.count({ where });
    const reviews = await (prisma as any).performanceReview.findMany({
      where,
      include: includeBlock,
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    });
    const data = reviews.map((r: any) => ({ ...r, daysLeft: calcDaysLeft(r) }));
    return { data, pagination: { page: opts.page, pageSize: opts.pageSize, total, totalPages: Math.ceil(total / opts.pageSize) } };
  },

  async getById(id: number, companyId: number) {
    const review = await (prisma as any).performanceReview.findFirst({
      where: { id: Number(id), companyId: Number(companyId) },
      include: includeBlock,
    });
    if (!review) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Review not found');
    return { ...review, daysLeft: calcDaysLeft(review) };
  },

  async create(input: any, reviewerEmployeeId: number, companyId: number) {
    if (!input.employeeId || !input.periodStart || !input.periodEnd) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'employeeId, periodStart, periodEnd are required');
    }
    return (prisma as any).performanceReview.create({
      data: {
        companyId,
        employeeId: Number(input.employeeId),
        reviewerId: Number(reviewerEmployeeId),
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        overallRating: input.overallRating ?? null,
        strengths: input.strengths || null,
        areasForImprovement: input.areasForImprovement || null,
        goals: input.goals || null,
        comments: input.comments || null,
        status: 'DRAFT',
      },
      include: includeBlock,
    });
  },

  async update(id: number, companyId: number, input: any) {
    const existing = await this.getById(id, companyId);
    if (existing.status === 'APPROVED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Approved reviews cannot be edited');
    }
    if (existing.lockedAt) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Locked reviews cannot be edited');
    }
    const update: any = {};
    for (const f of ['overallRating', 'strengths', 'areasForImprovement', 'goals', 'comments']) {
      if (input[f] !== undefined) update[f] = input[f];
    }
    return (prisma as any).performanceReview.update({ where: { id: Number(id) }, data: update, include: includeBlock });
  },

  // Sprint 5.5 — Supervisor submits to HR with electronic signature
  async submit(id: number, companyId: number, signature?: string) {
    const existing = await this.getById(id, companyId);
    if (existing.status !== 'DRAFT') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, `Can only submit drafts; current status: ${existing.status}`);
    }
    if (!signature || !signature.trim()) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Electronic signature required');
    }
    return (prisma as any).performanceReview.update({
      where: { id: Number(id) },
      data: {
        status: 'SUBMITTED',
        supervisorSignature: signature.trim(),
        supervisorSignedAt: new Date(),
      },
      include: includeBlock,
    });
  },

  // Sprint 5.5 — HR finalizes: adds compensation notes + training needs + locks the document
  async finalize(id: number, companyId: number, userId: number, hrFields: { compensationNotes?: string; trainingNeeds?: string }) {
    const existing = await this.getById(id, companyId);
    if (existing.status !== 'SUBMITTED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Only submitted reviews can be finalized');
    }
    const updated = await (prisma as any).performanceReview.update({
      where: { id: Number(id) },
      data: {
        status: 'APPROVED',
        approvedById: Number(userId),
        approvedAt: new Date(),
        compensationNotes: hrFields.compensationNotes || existing.compensationNotes,
        trainingNeeds: hrFields.trainingNeeds || existing.trainingNeeds,
        lockedAt: new Date(),
        lockedById: Number(userId),
      },
      include: includeBlock,
    });

    // Generate PDF asynchronously (don't fail the finalize on PDF errors)
    try {
      const pdfPath = await generateReviewPdf(updated);
      await (prisma as any).performanceReview.update({
        where: { id: updated.id },
        data: { pdfPath },
      });
      updated.pdfPath = pdfPath;
    } catch (e) {
      console.error('[finalize] PDF generation failed', e);
    }

    // Notify employee
    try {
      const { notificationService } = await import('./notification.service');
      await notificationService.send({
        companyId: existing.companyId,
        facilityId: updated.employee?.facilityId ?? null,
        title: 'Your performance review is ready',
        body: `Your review for the period ${new Date(updated.periodStart).toLocaleDateString()} – ${new Date(updated.periodEnd).toLocaleDateString()} has been finalized. Open the HRMS portal to view it.`,
        category: 'review-ready',
        emailTo: updated.employee?.email ? [updated.employee.email] : undefined,
      });
    } catch (e) { console.error('[finalize] notify failed', e); }

    return updated;
  },

  async reject(id: number, companyId: number, userId: number, reason?: string) {
    const existing = await this.getById(id, companyId);
    if (existing.status !== 'SUBMITTED') {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'Only submitted reviews can be rejected');
    }
    return (prisma as any).performanceReview.update({
      where: { id: Number(id) },
      data: { status: 'REJECTED', approvedById: Number(userId), approvedAt: new Date(), comments: reason || existing.comments },
      include: includeBlock,
    });
  },

  // Sprint 5.5 — Employee-side: list own finalized reviews
  async listForEmployee(employeeId: number, companyId: number) {
    return (prisma as any).performanceReview.findMany({
      where: { employeeId, companyId, status: 'APPROVED', lockedAt: { not: null } },
      include: includeBlock,
      orderBy: { lockedAt: 'desc' },
    });
  },

  // Sprint 5.5 — Employee-side: get single (records first viewedAt)
  async getForEmployee(employeeId: number, companyId: number, id: number) {
    const review = await (prisma as any).performanceReview.findFirst({
      where: { id, companyId, employeeId, status: 'APPROVED', lockedAt: { not: null } },
      include: includeBlock,
    });
    if (!review) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Review not found or not yet finalized');
    }
    if (!review.employeeViewedAt) {
      await (prisma as any).performanceReview.update({
        where: { id }, data: { employeeViewedAt: new Date() },
      });
    }
    return review;
  },

  async getPdfPath(id: number, companyId: number, employeeId?: number): Promise<string> {
    const where: any = { id, companyId };
    if (employeeId) where.employeeId = employeeId;
    const r = await (prisma as any).performanceReview.findFirst({ where });
    if (!r || !r.pdfPath) {
      throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'PDF not available');
    }
    return r.pdfPath;
  },
};

// ============================================
// PDF generation helper (no external deps — writes a simple HTML "PDF" stub)
// In production, swap to `pdfkit` or puppeteer.
// ============================================
async function generateReviewPdf(review: any): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');
  const dir = path.resolve(process.cwd(), 'exports', 'reviews');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `review-${review.id}.html`);
  const fmt = (s: any) => (s ? String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!)) : '—');
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Performance Review #${review.id}</title>
<style>
body { font-family: Arial, sans-serif; max-width: 800px; margin: 24px auto; color: #1e3a5f; }
h1 { border-bottom: 3px solid #1e3a5f; padding-bottom: 8px; }
.field { margin-bottom: 16px; }
.label { font-weight: 600; color: #6b7280; font-size: 0.85rem; text-transform: uppercase; }
.value { font-size: 1rem; margin-top: 4px; white-space: pre-wrap; }
.signature { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
</style></head><body>
<h1>Performance Review</h1>
<div class="field"><div class="label">Employee</div><div class="value">${fmt(review.employee?.firstName)} ${fmt(review.employee?.lastName)} (${fmt(review.employee?.employeeIdNumber)})</div></div>
<div class="field"><div class="label">Designation</div><div class="value">${fmt(review.employee?.designation)}</div></div>
<div class="field"><div class="label">Period</div><div class="value">${new Date(review.periodStart).toLocaleDateString()} – ${new Date(review.periodEnd).toLocaleDateString()}</div></div>
<div class="field"><div class="label">Overall Rating</div><div class="value">${fmt(review.overallRating)} / 5</div></div>
<div class="field"><div class="label">Strengths</div><div class="value">${fmt(review.strengths)}</div></div>
<div class="field"><div class="label">Areas for Improvement</div><div class="value">${fmt(review.areasForImprovement)}</div></div>
<div class="field"><div class="label">Goals</div><div class="value">${fmt(review.goals)}</div></div>
<div class="field"><div class="label">Comments</div><div class="value">${fmt(review.comments)}</div></div>
<div class="field"><div class="label">HR Compensation Notes</div><div class="value">${fmt(review.compensationNotes)}</div></div>
<div class="field"><div class="label">Training Needs</div><div class="value">${fmt(review.trainingNeeds)}</div></div>
<div class="signature">
  <div class="field"><div class="label">Supervisor Signature</div><div class="value">${fmt(review.supervisorSignature)} on ${review.supervisorSignedAt ? new Date(review.supervisorSignedAt).toLocaleString() : '—'}</div></div>
  <div class="field"><div class="label">Finalized</div><div class="value">${review.lockedAt ? new Date(review.lockedAt).toLocaleString() : '—'}</div></div>
</div>
</body></html>`;
  fs.writeFileSync(file, html, 'utf8');
  return file;
}
