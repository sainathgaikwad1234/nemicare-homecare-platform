import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { meService } from '../services/me.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';

const router = Router();
const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await meService.getProfile(req.user!.userId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.get(
  '/dashboard',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await meService.getDashboardSummary(req.user!.userId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.get(
  '/shifts/calendar',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const view = ((req.query.view as string) || 'WEEK').toUpperCase() as 'DAY' | 'WEEK' | 'MONTH';
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const result = await meService.getShiftsCalendar(req.user!.userId, view, date);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.get(
  '/leaves',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const status = (req.query.status as any) || 'ALL';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const result = await meService.getLeaves(req.user!.userId, status, page, pageSize);
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

router.get(
  '/leave-balance',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await meService.getLeaveBalance(req.user!.userId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/leaves',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await meService.submitLeave(req.user!.userId, req.body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

// Sprint 5.4 — Inline quota check before submit
router.get(
  '/leaves/quota',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const leaveType = (req as any).query.leaveType as string;
    const days = parseInt((req as any).query.days as string) || 1;
    const result = await meService.checkLeaveQuota(req.user!.userId, leaveType, days);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// Sprint 5.4 — Employee responds to supervisor's info request
router.post(
  '/leaves/:id/respond-info',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await meService.respondToInfoRequest(req.user!.userId, id, req.body?.response);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// Sprint 5.5 — Employee read-only performance reviews
router.get(
  '/performance-reviews',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { performanceService } = await import('../services/performance.service');
    const { prisma } = await import('../config/database');
    const emp = await (prisma as any).employee.findFirst({
      where: { userId: req.user!.userId, deletedAt: null }, select: { id: true, companyId: true },
    });
    if (!emp) {
      res.json({ success: true, status: 200, data: [], meta: meta(req) });
      return;
    }
    const data = await performanceService.listForEmployee(emp.id, emp.companyId);
    res.json({ success: true, status: 200, data, meta: meta(req) });
  })
);

router.get(
  '/performance-reviews/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { performanceService } = await import('../services/performance.service');
    const { prisma } = await import('../config/database');
    const emp = await (prisma as any).employee.findFirst({
      where: { userId: req.user!.userId, deletedAt: null }, select: { id: true, companyId: true },
    });
    if (!emp) throw new Error('No employee record');
    const data = await performanceService.getForEmployee(emp.id, emp.companyId, parseInt((req as any).params.id));
    res.json({ success: true, status: 200, data, meta: meta(req) });
  })
);

router.get(
  '/performance-reviews/:id/pdf',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const fs = await import('fs');
    const { performanceService } = await import('../services/performance.service');
    const { prisma } = await import('../config/database');
    const emp = await (prisma as any).employee.findFirst({
      where: { userId: req.user!.userId, deletedAt: null }, select: { id: true, companyId: true },
    });
    if (!emp) throw new Error('No employee record');
    const path = await performanceService.getPdfPath(parseInt((req as any).params.id), emp.companyId, emp.id);
    if (!fs.existsSync(path)) {
      res.status(404).json({ success: false, status: 404, error: { message: 'PDF file missing on disk' }, meta: meta(req) });
      return;
    }
    const ext = path.endsWith('.html') ? 'html' : 'pdf';
    res.setHeader('Content-Type', ext === 'html' ? 'text/html' : 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="review-${req.params.id}.${ext}"`);
    fs.createReadStream(path).pipe(res);
  })
);

export const meRoutes = router;
