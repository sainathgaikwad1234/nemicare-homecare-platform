import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';

const meta = (req: AuthRequest) => ({
  timestamp: new Date().toISOString(),
  requestId: (req as any).requestId,
});

const router = Router();

/**
 * Authorization helper — verify the current user is linked to this resident as a family contact.
 * Returns the link record or null.
 */
const requireFamilyAccess = async (userId: number, residentId: number) => {
  const link = await (prisma as any).familyResidentLink.findUnique({
    where: { userId_residentId: { userId, residentId } },
  });
  return link;
};

// ============================================
// GET /api/v1/family/residents
// List residents linked to the current family contact
// ============================================
router.get('/residents', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const links = await (prisma as any).familyResidentLink.findMany({
      where: { userId: req.user!.userId },
      include: {
        resident: {
          select: {
            id: true, firstName: true, lastName: true, middleName: true,
            primaryService: true, admissionDate: true, dischargeDate: true,
            facility: { select: { id: true, name: true } },
            // room comes from a Visit / Bed model in some setups; fallback to address as proxy
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
    const data = links.map((l: any) => ({
      id: l.resident.id,
      firstName: l.resident.firstName,
      lastName: l.resident.lastName,
      middleName: l.resident.middleName,
      programType: l.resident.primaryService === 'ADULT_DAY_HEALTH' ? 'ADH' : 'ALF',
      relation: l.relation,
      isPrimary: l.isPrimary,
      facility: l.resident.facility?.name || 'CareBridge Home Health',
      room: '—',
      admissionDate: l.resident.admissionDate,
      expectedDischarge: l.resident.dischargeDate,
    }));
    res.json({ success: true, status: 200, data, meta: meta(req) });
  })
);

// ============================================
// GET /api/v1/family/residents/:id/dashboard
// Aggregate dashboard data for a single resident
// ============================================
router.get('/residents/:id/dashboard', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) {
      res.status(403).json({ success: false, status: 403, error: 'Not linked to this resident' });
      return;
    }

    const [resident, recentIncidents, openTickets, latestPainScale, recentVitals] = await Promise.all([
      (prisma as any).resident.findUnique({
        where: { id: residentId },
        include: {
          facility: { select: { id: true, name: true } },
          caseManager: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      }),
      (prisma as any).incident.findMany({
        where: { residentId, status: { not: 'Resolved' } },
        orderBy: { date: 'desc' }, take: 3,
      }),
      (prisma as any).ticket.count({
        where: { residentId, status: 'Open' },
      }),
      (prisma as any).painScale.findFirst({
        where: { residentId }, orderBy: { date: 'desc' },
      }),
      (prisma as any).vital.findMany({
        where: { residentId }, orderBy: { date: 'desc' }, take: 5,
      }),
    ]);

    const days = (a: Date, b: Date) => Math.round((+a - +b) / 86400000);
    const daysRemaining = resident?.dischargeDate
      ? Math.max(0, days(new Date(resident.dischargeDate), new Date()))
      : null;

    res.json({
      success: true, status: 200,
      data: {
        resident: {
          id: resident.id,
          firstName: resident.firstName,
          lastName: resident.lastName,
          programType: resident.primaryService === 'ADULT_DAY_HEALTH' ? 'ADH' : 'ALF',
          facility: resident.facility?.name,
          relation: link.relation,
          admissionDate: resident.admissionDate,
          expectedDischarge: resident.dischargeDate,
          billingType: resident.billingType,
          caseManager: resident.caseManager
            ? `${resident.caseManager.firstName} ${resident.caseManager.lastName}`
            : null,
          caseManagerPhone: resident.caseManager?.phone,
        },
        kpis: {
          alerts: 0, // Phase 2: derive from health alerts table
          openTickets,
          daysRemaining,
        },
        painScale: latestPainScale ? {
          level: latestPainScale.painLevel,
          label: latestPainScale.painLevel <= 2 ? 'Comfortable'
                 : latestPainScale.painLevel <= 4 ? 'Mild'
                 : latestPainScale.painLevel <= 6 ? 'Moderate'
                 : latestPainScale.painLevel <= 8 ? 'Severe' : 'Worst',
        } : null,
        recentIncidents: recentIncidents.map((i: any) => ({
          id: i.id, title: i.type, severity: i.severity,
          date: i.date, time: i.time, location: i.location,
        })),
        recentVitals: recentVitals.map((v: any) => ({
          id: v.id, date: v.date,
          bloodPressure: `${v.bloodPressureSystolic ?? '-'}/${v.bloodPressureDiastolic ?? '-'}`,
          pulse: v.pulse, temperature: v.temperature, weight: v.weight,
        })),
      },
      meta: meta(req),
    });
  })
);

// ============================================
// GET /api/v1/family/residents/:id/tickets
// ============================================
router.get('/residents/:id/tickets', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const status = req.query.status as string | undefined;
    const tickets = await (prisma as any).ticket.findMany({
      where: { residentId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, status: 200, data: tickets, meta: meta(req) });
  })
);

router.post('/residents/:id/tickets', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const { title, category, priority, description } = req.body;
    if (!title?.trim()) {
      res.status(400).json({ success: false, status: 400, error: 'title is required' });
      return;
    }
    const ticket = await (prisma as any).ticket.create({
      data: {
        residentId,
        companyId: req.user!.companyId,
        title, category: category || 'General',
        priority: priority || 'Medium',
        status: 'Open',
        description, addedById: req.user!.userId,
      },
    });
    res.status(201).json({ success: true, status: 201, data: ticket, meta: meta(req) });
  })
);

// ============================================
// GET /api/v1/family/residents/:id/inventory
// POST /api/v1/family/residents/:id/inventory
// ============================================
router.get('/residents/:id/inventory', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const items = await (prisma as any).inventoryItem.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, status: 200, data: items, meta: meta(req) });
  })
);

router.post('/residents/:id/inventory', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const { itemName, category, quantity, condition, currentStatus, notes } = req.body;
    if (!itemName?.trim()) {
      res.status(400).json({ success: false, status: 400, error: 'itemName is required' });
      return;
    }
    const item = await (prisma as any).inventoryItem.create({
      data: {
        residentId, companyId: req.user!.companyId,
        itemName, category: category || 'Other',
        quantity: quantity || 1,
        condition: condition || 'New',
        status: currentStatus || 'Active',
        notes, addedById: req.user!.userId,
      },
    });
    res.status(201).json({ success: true, status: 201, data: item, meta: meta(req) });
  })
);

// ============================================
// GET /api/v1/family/residents/:id/incidents
// ============================================
router.get('/residents/:id/incidents', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const status = req.query.status as string | undefined;
    const items = await (prisma as any).incident.findMany({
      where: { residentId, ...(status ? { status } : {}) },
      orderBy: { date: 'desc' }, take: 50,
    });
    res.json({ success: true, status: 200, data: items, meta: meta(req) });
  })
);

// ============================================
// GET /api/v1/family/residents/:id/medications
// ============================================
router.get('/residents/:id/medications', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const items = await (prisma as any).medication.findMany({
      where: { residentId },
      orderBy: { startDate: 'desc' }, take: 100,
    });
    res.json({ success: true, status: 200, data: items, meta: meta(req) });
  })
);

// ============================================
// GET /api/v1/family/residents/:id/vitals
// ============================================
router.get('/residents/:id/vitals', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const items = await (prisma as any).vital.findMany({
      where: { residentId },
      orderBy: { date: 'desc' }, take: 100,
    });
    res.json({ success: true, status: 200, data: items, meta: meta(req) });
  })
);

// ============================================
// GET /api/v1/family/residents/:id/allergies
// ============================================
router.get('/residents/:id/allergies', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const items = await (prisma as any).allergy.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' }, take: 50,
    });
    res.json({ success: true, status: 200, data: items, meta: meta(req) });
  })
);

// ============================================
// GET /api/v1/family/residents/:id/documents
// ============================================
router.get('/residents/:id/documents', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number(req.params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const items = await (prisma as any).document.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
    res.json({ success: true, status: 200, data: items, meta: meta(req) });
  })
);

// ============================================
// BILLING — Statement / Payment / History
// ============================================

// GET /family/residents/:id/billing/statement — most recent billing period summary
router.get('/residents/:id/billing/statement', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number((req as any).params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const latest = await (prisma as any).billing.findFirst({
      where: { residentId },
      orderBy: { billingPeriodEnd: 'desc' },
    });
    const totalUnpaid = await (prisma as any).billing.aggregate({
      where: { residentId, status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'OVERDUE'] } },
      _sum: { totalAmount: true, amountPaid: true },
      _count: true,
    });
    const totalPaid = await (prisma as any).billing.aggregate({
      where: { residentId, status: 'PAID' },
      _sum: { totalAmount: true },
      _count: true,
    });
    res.json({
      success: true, status: 200,
      data: {
        currentStatement: latest,
        kpis: {
          totalUnpaid: Number(totalUnpaid._sum.totalAmount || 0) - Number(totalUnpaid._sum.amountPaid || 0),
          unpaidCount: totalUnpaid._count,
          totalPaid: Number(totalPaid._sum.totalAmount || 0),
          paidCount: totalPaid._count,
        },
      },
      meta: meta(req),
    });
  })
);

// GET /family/residents/:id/billing/unpaid — for Payment page
router.get('/residents/:id/billing/unpaid', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number((req as any).params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const items = await (prisma as any).billing.findMany({
      where: { residentId, status: { in: ['DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'OVERDUE'] } },
      orderBy: { billingPeriodEnd: 'desc' },
      take: 100,
    });
    res.json({ success: true, status: 200, data: items, meta: meta(req) });
  })
);

// GET /family/residents/:id/billing/history — for History page (paid only)
router.get('/residents/:id/billing/history', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number((req as any).params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const items = await (prisma as any).billing.findMany({
      where: { residentId, status: 'PAID' },
      orderBy: { paidDate: 'desc' },
      take: 100,
    });
    res.json({ success: true, status: 200, data: items, meta: meta(req) });
  })
);

// ============================================
// DOCUMENTS — Upload (metadata-only for demo; S3 integration in Phase 3)
// ============================================

router.post('/residents/:id/documents', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const residentId = Number((req as any).params.id);
    const link = await requireFamilyAccess(req.user!.userId, residentId);
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const body = (req as any).body || {};
    const { title, documentType, fileUrl, fileSize, mimeType } = body;
    if (!title?.trim()) {
      res.status(400).json({ success: false, status: 400, error: 'title is required' });
      return;
    }

    const resident = await (prisma as any).resident.findUnique({
      where: { id: residentId }, select: { facilityId: true },
    });
    if (!resident) {
      res.status(404).json({ success: false, status: 404, error: 'Resident not found' });
      return;
    }

    const doc = await (prisma as any).document.create({
      data: {
        companyId: req.user!.companyId,
        facilityId: resident.facilityId,
        residentId,
        title,
        documentType: documentType || 'OTHER',
        fileUrl: fileUrl || `placeholder://${Date.now()}-${title.replace(/\s+/g, '_')}.pdf`,
        fileSize: fileSize || null,
        mimeType: mimeType || 'application/pdf',
        status: 'EXECUTED',
        createdById: req.user!.userId,
      },
    });

    // Drop a notification
    await (prisma as any).familyNotification.create({
      data: {
        companyId: req.user!.companyId, userId: req.user!.userId, residentId,
        type: 'DOCUMENT', title: 'Document Uploaded',
        description: `"${title}" was added to the documents library.`,
      },
    });

    res.status(201).json({ success: true, status: 201, data: doc, meta: meta(req) });
  })
);

// ============================================
// APPOINTMENTS
// ============================================

// GET /api/v1/family/appointments?scope=upcoming|past
router.get('/appointments', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const scope = ((req as any).query?.scope as string) || 'upcoming';
    const userId = req.user!.userId;
    const now = new Date();

    const where: any = { requestedById: userId };
    if (scope === 'upcoming') {
      where.scheduledDate = { gte: now };
      where.status = { in: ['REQUESTED', 'SCHEDULED'] };
    } else if (scope === 'past') {
      where.OR = [
        { scheduledDate: { lt: now } },
        { status: { in: ['COMPLETED', 'CANCELLED'] } },
      ];
    }

    const items = await (prisma as any).familyAppointment.findMany({
      where,
      include: {
        resident: { select: { id: true, firstName: true, lastName: true, primaryService: true, dob: true } },
      },
      orderBy: { scheduledDate: scope === 'past' ? 'desc' : 'asc' },
      take: 50,
    });

    const data = items.map((a: any) => {
      const yrs = a.resident?.dob
        ? Math.floor((Date.now() - new Date(a.resident.dob).getTime()) / (365.25 * 86400000))
        : null;
      return {
        id: a.id,
        residentId: a.residentId,
        residentName: `${a.resident.firstName} ${a.resident.lastName}`,
        residentAge: yrs,
        programType: a.resident.primaryService === 'ADULT_DAY_HEALTH' ? 'ADH' : 'ALF',
        mode: a.mode,
        status: a.status,
        scheduledDate: a.scheduledDate,
        scheduledTime: a.scheduledTime,
        durationMinutes: a.durationMinutes,
        preferredProvider: a.preferredProvider,
        reason: a.reason,
        notes: a.notes,
        facilityName: a.facilityName,
        facilityAddress: a.facilityAddress,
        telehealthUrl: a.telehealthUrl,
      };
    });
    res.json({ success: true, status: 200, data, meta: meta(req) });
  })
);

// POST /api/v1/family/appointments — Request Meet
router.post('/appointments', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const body = (req as any).body;
    const { residentId, mode, scheduledDate, scheduledTime, preferredProvider, reason, notes } = body;
    if (!residentId || !scheduledDate || !scheduledTime) {
      res.status(400).json({ success: false, status: 400, error: 'residentId, scheduledDate, scheduledTime are required' });
      return;
    }
    const link = await requireFamilyAccess(req.user!.userId, Number(residentId));
    if (!link) { res.status(403).json({ success: false, status: 403, error: 'Forbidden' }); return; }

    const appt = await (prisma as any).familyAppointment.create({
      data: {
        companyId: req.user!.companyId,
        residentId: Number(residentId),
        requestedById: req.user!.userId,
        mode: mode === 'VIRTUAL' ? 'VIRTUAL' : 'IN_PERSON',
        status: 'REQUESTED',
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        preferredProvider, reason, notes,
      },
    });

    // Side effect — drop a notification for the requester so it appears in their feed
    await (prisma as any).familyNotification.create({
      data: {
        companyId: req.user!.companyId,
        userId: req.user!.userId,
        residentId: Number(residentId),
        type: 'APPOINTMENT',
        title: 'Appointment Requested',
        description: `Your meet request for ${new Date(scheduledDate).toLocaleDateString()} has been submitted.`,
      },
    });

    res.status(201).json({ success: true, status: 201, data: appt, meta: meta(req) });
  })
);

// PATCH /api/v1/family/appointments/:id/cancel
router.patch('/appointments/:id/cancel', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = Number((req as any).params.id);
    const reason = (req as any).body?.reason as string | undefined;
    const a = await (prisma as any).familyAppointment.findUnique({ where: { id } });
    if (!a || a.requestedById !== req.user!.userId) {
      res.status(404).json({ success: false, status: 404, error: 'Not found' });
      return;
    }
    const updated = await (prisma as any).familyAppointment.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledReason: reason },
    });
    res.json({ success: true, status: 200, data: updated, meta: meta(req) });
  })
);

// ============================================
// NOTIFICATIONS
// ============================================

// GET /api/v1/family/notifications
router.get('/notifications', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const items = await (prisma as any).familyNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const unreadCount = items.filter((n: any) => !n.readAt).length;
    res.json({ success: true, status: 200, data: { items, unreadCount }, meta: meta(req) });
  })
);

// PATCH /api/v1/family/notifications/:id/read
router.patch('/notifications/:id/read', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = Number((req as any).params.id);
    const n = await (prisma as any).familyNotification.findUnique({ where: { id } });
    if (!n || n.userId !== req.user!.userId) {
      res.status(404).json({ success: false, status: 404, error: 'Not found' });
      return;
    }
    const updated = await (prisma as any).familyNotification.update({
      where: { id }, data: { readAt: new Date() },
    });
    res.json({ success: true, status: 200, data: updated, meta: meta(req) });
  })
);

// POST /api/v1/family/notifications/mark-all-read
router.post('/notifications/mark-all-read', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await (prisma as any).familyNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ success: true, status: 200, data: { updated: result.count }, meta: meta(req) });
  })
);

// GET /api/v1/family/notifications/settings
router.get('/notifications/settings', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    let s = await (prisma as any).familyNotificationSetting.findUnique({ where: { userId } });
    if (!s) {
      s = await (prisma as any).familyNotificationSetting.create({ data: { userId } });
    }
    res.json({ success: true, status: 200, data: s, meta: meta(req) });
  })
);

// PATCH /api/v1/family/notifications/settings
router.patch('/notifications/settings', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const body = (req as any).body || {};
    const allowed = ['password', 'document', 'alert', 'incident', 'message', 'ticket', 'invoice', 'appointment', 'allowAll'];
    const update: any = {};
    for (const k of allowed) if (typeof body[k] === 'boolean') update[k] = body[k];
    const s = await (prisma as any).familyNotificationSetting.upsert({
      where: { userId },
      update,
      create: { userId, ...update },
    });
    res.json({ success: true, status: 200, data: s, meta: meta(req) });
  })
);

export const familyRoutes = router;
