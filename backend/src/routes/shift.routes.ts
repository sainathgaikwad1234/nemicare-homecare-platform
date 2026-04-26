import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { shiftService } from '../services/shift.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

router.get(
  '/',
  authenticate,
  requirePermission('shifts.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await shiftService.listShifts({
      companyId: req.user!.companyId,
      facilityId: req.query.facilityId ? parseInt(req.query.facilityId as string) : undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
    });
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.get(
  '/calendar',
  authenticate,
  requirePermission('shifts.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const view = ((req.query.view as string) || 'MONTH').toUpperCase() as 'DAY' | 'WEEK' | 'MONTH';
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const result = await shiftService.getCalendar({
      companyId: req.user!.companyId,
      facilityId: req.query.facilityId ? parseInt(req.query.facilityId as string) : req.user!.facilityId,
      view,
      date,
    });
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/',
  authenticate,
  requirePermission('shifts.create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const input = {
      ...req.body,
      companyId: req.body.companyId || req.user!.companyId,
      facilityId: req.body.facilityId || req.user!.facilityId,
    };
    const shift = await shiftService.createShift(input, req.user!.userId);
    res.status(201).json({ success: true, status: 201, data: shift, meta: meta(req) });
  })
);

router.put(
  '/:id',
  authenticate,
  requirePermission('shifts.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const shift = await shiftService.updateShift(parseInt(req.params.id), req.user!.companyId, req.body);
    res.json({ success: true, status: 200, data: shift, meta: meta(req) });
  })
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('shifts.delete'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await shiftService.deleteShift(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/bulk',
  authenticate,
  requirePermission('shifts.create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const input = {
      ...req.body,
      companyId: req.body.companyId || req.user!.companyId,
      facilityId: req.body.facilityId || req.user!.facilityId,
    };
    const result = await shiftService.bulkAssign(input, req.user!.userId);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

export const shiftRoutes = router;
