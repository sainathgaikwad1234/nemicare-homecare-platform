/**
 * Phase 4 routes — Tasks, Performance Reviews, Exit Management.
 * Mounted in index.ts at:
 *   /api/v1/tasks
 *   /api/v1/performance-reviews
 *   /api/v1/exits
 *   /api/v1/me/tasks (employee self)
 */
import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { taskService } from '../services/task.service';
import { performanceService } from '../services/performance.service';
import { exitService } from '../services/exit.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { prisma } from '../config/database';

const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

// Helper: resolve current user's Employee record
const resolveMyEmployee = async (userId: number) => {
  return (prisma as any).employee.findFirst({ where: { userId: Number(userId), deletedAt: null } });
};

// =============================
// Tasks routes
// =============================
const tasks = Router();

tasks.get('/', authenticate, requirePermission('tasks.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await taskService.list({
      companyId: req.user!.companyId,
      assignedToId: req.query.assignedToId ? parseInt(req.query.assignedToId as string) : undefined,
      status: req.query.status as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 25,
    });
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

tasks.post('/', authenticate, requirePermission('tasks.create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const me = await resolveMyEmployee(req.user!.userId);
    const creatorEmpId = me?.id || req.user!.userId; // fallback to userId for HR Admin who isn't an Employee
    const result = await taskService.create(
      req.body,
      creatorEmpId,
      req.user!.companyId,
      req.body.facilityId || req.user!.facilityId,
    );
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

tasks.put('/:id', authenticate, requirePermission('tasks.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await taskService.update(parseInt(req.params.id), req.user!.companyId, req.body);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

tasks.delete('/:id', authenticate, requirePermission('tasks.delete'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await taskService.remove(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const taskRoutes = tasks;

// =============================
// Me Tasks routes (employee self)
// =============================
const meTasks = Router();

meTasks.get('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const me = await resolveMyEmployee(req.user!.userId);
    if (!me) return res.json({ success: true, status: 200, data: [], pagination: { page: 1, pageSize: 0, total: 0, totalPages: 0 }, meta: meta(req) });
    const result = await taskService.listForEmployee(
      me.id,
      req.user!.companyId,
      req.query.status as string | undefined,
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.pageSize as string) || 25,
    );
    return res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

meTasks.get('/stats', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const me = await resolveMyEmployee(req.user!.userId);
    if (!me) return res.json({ success: true, status: 200, data: { total: 0, completed: 0, pending: 0, due: 0 }, meta: meta(req) });
    const stats = await taskService.getStats(me.id, req.user!.companyId);
    return res.json({ success: true, status: 200, data: stats, meta: meta(req) });
  })
);

meTasks.post('/:id/complete', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const me = await resolveMyEmployee(req.user!.userId);
    if (!me) return res.status(404).json({ success: false, status: 404, error: { code: 'NOT_FOUND', message: 'No employee record' } });
    const result = await taskService.markComplete(parseInt(req.params.id), req.user!.companyId, me.id);
    return res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const meTaskRoutes = meTasks;

// =============================
// Performance Reviews routes
// =============================
const reviews = Router();

reviews.get('/', authenticate, requirePermission('reviews.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await performanceService.list({
      companyId: req.user!.companyId,
      status: req.query.status as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
    });
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

reviews.get('/:id', authenticate, requirePermission('reviews.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await performanceService.getById(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

reviews.post('/', authenticate, requirePermission('reviews.create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const me = await resolveMyEmployee(req.user!.userId);
    const reviewerEmpId = me?.id || req.user!.userId;
    const result = await performanceService.create(req.body, reviewerEmpId, req.user!.companyId);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

reviews.put('/:id', authenticate, requirePermission('reviews.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await performanceService.update(parseInt(req.params.id), req.user!.companyId, req.body);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

reviews.post('/:id/submit', authenticate, requirePermission('reviews.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await performanceService.submit(parseInt(req.params.id), req.user!.companyId, (req as any).body?.signature);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// Sprint 5.5 — HR finalize: replaces /approve. Accepts { compensationNotes?, trainingNeeds? }
reviews.post('/:id/finalize', authenticate, requirePermission('reviews.approve'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await performanceService.finalize(
      parseInt(req.params.id), req.user!.companyId, req.user!.userId,
      { compensationNotes: (req as any).body?.compensationNotes, trainingNeeds: (req as any).body?.trainingNeeds },
    );
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// Backwards-compat alias
reviews.post('/:id/approve', authenticate, requirePermission('reviews.approve'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await performanceService.finalize(
      parseInt(req.params.id), req.user!.companyId, req.user!.userId,
      { compensationNotes: (req as any).body?.compensationNotes, trainingNeeds: (req as any).body?.trainingNeeds },
    );
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

reviews.post('/:id/reject', authenticate, requirePermission('reviews.approve'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await performanceService.reject(parseInt(req.params.id), req.user!.companyId, req.user!.userId, req.body.reason);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// Sprint 5.5 — Download PDF (HR-side). Streams the locked PDF.
reviews.get('/:id/pdf', authenticate, requirePermission('reviews.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const fs = await import('fs');
    const path = await performanceService.getPdfPath(parseInt(req.params.id), req.user!.companyId);
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

export const reviewRoutes = reviews;

// =============================
// Exit Management routes
// =============================
const exits = Router();

exits.get('/', authenticate, requirePermission('exits.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await exitService.list({
      companyId: req.user!.companyId,
      status: req.query.status as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
    });
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

exits.get('/:id', authenticate, requirePermission('exits.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await exitService.getById(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

exits.post('/', authenticate, requirePermission('exits.create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await exitService.initiate(req.body, req.user!.userId, req.user!.companyId);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

exits.put('/:id', authenticate, requirePermission('exits.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await exitService.update(parseInt(req.params.id), req.user!.companyId, req.body);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

exits.post('/:id/finalize', authenticate, requirePermission('exits.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await exitService.finalize(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// Sprint 5.7 — Calculate final pay
exits.post('/:id/calculate-final-pay', authenticate, requirePermission('exits.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await exitService.calculateFinalPay(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const exitRoutes = exits;
