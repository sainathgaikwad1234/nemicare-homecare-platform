import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { attendanceService } from '../services/attendance.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.get('/daily', authenticate, requirePermission('residents.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = req.query.facilityId ? parseInt(req.query.facilityId as string) : req.user!.facilityId;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const result = await attendanceService.getDailyRoster(facilityId, req.user!.companyId, new Date(date + 'T00:00:00Z'));
    res.json({ success: true, status: 200, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.get('/weekly', authenticate, requirePermission('residents.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = req.query.facilityId ? parseInt(req.query.facilityId as string) : req.user!.facilityId;
    const startDate = (req.query.weekStart as string) || new Date().toISOString().split('T')[0];
    const result = await attendanceService.getWeeklyRoster(facilityId, req.user!.companyId, new Date(startDate + 'T00:00:00Z'));
    res.json({ success: true, status: 200, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.post('/check-in', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { residentId, date } = req.body;
    if (!residentId) { res.status(400).json({ success: false, error: { message: 'residentId required' } }); return; }
    const facilityId = req.body.facilityId || req.user!.facilityId;
    const result = await attendanceService.checkIn(Number(residentId), req.user!.companyId, Number(facilityId), req.user!.userId, date ? new Date(date + 'T00:00:00Z') : undefined);
    res.status(201).json({ success: true, status: 201, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.post('/check-out', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { residentId, date } = req.body;
    if (!residentId) { res.status(400).json({ success: false, error: { message: 'residentId required' } }); return; }
    const facilityId = req.body.facilityId || req.user!.facilityId;
    const result = await attendanceService.checkOut(Number(residentId), req.user!.companyId, Number(facilityId), req.user!.userId, date ? new Date(date + 'T00:00:00Z') : undefined);
    res.json({ success: true, status: 200, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.post('/mark-absent', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { residentId, reason, date, notes } = req.body;
    if (!residentId || !reason) { res.status(400).json({ success: false, error: { message: 'residentId and reason required' } }); return; }
    const facilityId = req.body.facilityId || req.user!.facilityId;
    const result = await attendanceService.markAbsent(Number(residentId), req.user!.companyId, Number(facilityId), req.user!.userId, reason, date ? new Date(date + 'T00:00:00Z') : undefined, notes);
    res.status(201).json({ success: true, status: 201, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

export const attendanceRoutes = router;
