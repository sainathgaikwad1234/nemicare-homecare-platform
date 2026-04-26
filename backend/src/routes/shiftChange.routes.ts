import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { shiftChangeService } from '../services/shiftChange.service';

const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

// ============ /api/v1/me/shift-change-requests (employee) ============
const meRouter = Router();

meRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const status = (req as any).query.status as string | undefined;
    const page = parseInt((req as any).query.page) || 1;
    const pageSize = parseInt((req as any).query.pageSize) || 10;
    const result = await shiftChangeService.listMine((req as any).user.userId, status, page, pageSize);
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

meRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await shiftChangeService.submit((req as any).user.userId, (req as any).body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

// ============ /api/v1/shift-change-requests (supervisor) ============
const supRouter = Router();

supRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const status = (req as any).query.status as string | undefined;
    const page = parseInt((req as any).query.page) || 1;
    const pageSize = parseInt((req as any).query.pageSize) || 10;
    const result = await shiftChangeService.listForApproval((req as any).user.userId, status, page, pageSize);
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

supRouter.patch(
  '/:id/approve',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await shiftChangeService.approve((req as any).user.userId, id);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

supRouter.patch(
  '/:id/reject',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const { reason } = (req as any).body || {};
    const result = await shiftChangeService.reject((req as any).user.userId, id, reason);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const meShiftChangeRoutes = meRouter;
export const supervisorShiftChangeRoutes = supRouter;
