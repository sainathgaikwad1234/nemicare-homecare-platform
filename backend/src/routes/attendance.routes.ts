import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { attendanceService } from '../services/attendance.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router({ mergeParams: true });

router.get('/daily', authenticate, requirePermission('residents.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = parseInt(req.query.facilityId as string);
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    if (!facilityId) {
      res.status(400).json({ success: false, error: { message: 'facilityId is required' } });
      return;
    }
    const result = await attendanceService.getDailyRoster(facilityId, req.user!.companyId, date);
    res.json({ success: true, status: 200, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.get('/weekly', authenticate, requirePermission('residents.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = parseInt(req.query.facilityId as string);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    if (!facilityId) {
      res.status(400).json({ success: false, error: { message: 'facilityId is required' } });
      return;
    }
    const result = await attendanceService.getWeeklyRoster(facilityId, req.user!.companyId, startDate);
    res.json({ success: true, status: 200, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.post('/check-in', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { residentId, facilityId, date } = req.body;
    if (!residentId || !facilityId) {
      res.status(400).json({ success: false, error: { message: 'residentId and facilityId are required' } });
      return;
    }
    const result = await attendanceService.checkIn(Number(residentId), req.user!.companyId, Number(facilityId), req.user!.userId, date ? new Date(date) : undefined);
    res.status(201).json({ success: true, status: 201, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.post('/check-out', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { residentId, facilityId, date } = req.body;
    if (!residentId || !facilityId) {
      res.status(400).json({ success: false, error: { message: 'residentId and facilityId are required' } });
      return;
    }
    const result = await attendanceService.checkOut(Number(residentId), req.user!.companyId, Number(facilityId), req.user!.userId, date ? new Date(date) : undefined);
    res.json({ success: true, status: 200, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.post('/mark-absent', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { residentId, facilityId, reason, date, notes } = req.body;
    if (!residentId || !facilityId || !reason) {
      res.status(400).json({ success: false, error: { message: 'residentId, facilityId, and reason are required' } });
      return;
    }
    const result = await attendanceService.markAbsent(Number(residentId), req.user!.companyId, Number(facilityId), req.user!.userId, reason, date ? new Date(date) : undefined, notes);
    res.json({ success: true, status: 200, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

export const attendanceRoutes = router;
