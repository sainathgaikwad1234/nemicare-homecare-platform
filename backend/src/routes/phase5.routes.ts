import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { employeeAttendanceService } from '../services/employeeAttendance.service';
import { timecardService } from '../services/timecard.service';
import { payrollService } from '../services/payroll.service';
import { facilityConfigService } from '../services/facilityConfig.service';

const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });
const clientIp = (req: AuthRequest) =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || (req.socket as any)?.remoteAddress;

// ============================================
// /api/v1/me/attendance — Employee EVV punches
// ============================================
const attendanceRouter = Router();

attendanceRouter.get(
  '/state',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await employeeAttendanceService.getTodayState(req.user!.userId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

attendanceRouter.post(
  '/clock-in',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { lat, lng } = req.body || {};
    const result = await employeeAttendanceService.clockIn(req.user!.userId, { ip: clientIp(req), lat, lng });
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

attendanceRouter.post(
  '/break/start',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { lat, lng } = req.body || {};
    const result = await employeeAttendanceService.startBreak(req.user!.userId, { ip: clientIp(req), lat, lng });
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

attendanceRouter.post(
  '/break/end',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { lat, lng } = req.body || {};
    const result = await employeeAttendanceService.endBreak(req.user!.userId, { ip: clientIp(req), lat, lng });
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

attendanceRouter.post(
  '/clock-out',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { lat, lng, taskDetails } = req.body || {};
    const result = await employeeAttendanceService.clockOut(req.user!.userId, { ip: clientIp(req), lat, lng, taskDetails });
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

// ============================================
// /api/v1/me/timecards — Employee timecard list + submit
// ============================================
const meTimecardRouter = Router();

meTimecardRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const result = await timecardService.listMine(req.user!.userId, page, pageSize);
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

meTimecardRouter.post(
  '/:id/submit',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const { taskDetails } = req.body || {};
    const result = await timecardService.submit(req.user!.userId, id, taskDetails);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// ============================================
// /api/v1/timecards — Supervisor approval queue
// ============================================
const supervisorTimecardRouter = Router();

supervisorTimecardRouter.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const result = await timecardService.listForApproval(req.user!.userId, status, page, pageSize);
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

supervisorTimecardRouter.patch(
  '/:id/approve',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await timecardService.approve(req.user!.userId, id);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

supervisorTimecardRouter.patch(
  '/:id/reject',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const { reason } = req.body || {};
    const result = await timecardService.reject(req.user!.userId, id, reason);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

supervisorTimecardRouter.patch(
  '/:id/approve-overtime',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await timecardService.approveOvertime(req.user!.userId, id);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// ============================================
// /api/v1/payroll — HR payroll batches
// ============================================
const payrollRouter = Router();

payrollRouter.get(
  '/batches',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await payrollService.listBatches(req.user!.companyId, page, pageSize);
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

payrollRouter.get(
  '/batches/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await payrollService.getBatch(id);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

payrollRouter.post(
  '/batches',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { facilityId, payPeriodStart, payPeriodEnd } = req.body || {};
    const result = await payrollService.runWeeklyPayroll({
      companyId: req.user!.companyId,
      facilityId: facilityId ? Number(facilityId) : undefined,
      payPeriodStart: new Date(payPeriodStart),
      payPeriodEnd: new Date(payPeriodEnd),
      runById: req.user!.userId,
    });
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

payrollRouter.post(
  '/batches/:id/send-to-adp',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const result = await payrollService.sendToAdp(id);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// ============================================
// /api/v1/facility-config — IP whitelist + geofence
// ============================================
const facilityConfigRouter = Router();

facilityConfigRouter.get(
  '/:facilityId/ip-whitelist',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = parseInt(req.params.facilityId);
    const result = await facilityConfigService.listWhitelist(facilityId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

facilityConfigRouter.post(
  '/:facilityId/ip-whitelist',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = parseInt(req.params.facilityId);
    const { cidr, description } = req.body || {};
    const result = await facilityConfigService.addWhitelistEntry(facilityId, cidr, description);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

facilityConfigRouter.patch(
  '/ip-whitelist/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const { active } = req.body || {};
    const result = await facilityConfigService.toggleWhitelistEntry(id, !!active);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

facilityConfigRouter.delete(
  '/ip-whitelist/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    await facilityConfigService.deleteWhitelistEntry(id);
    res.json({ success: true, status: 200, data: { id }, meta: meta(req) });
  })
);

facilityConfigRouter.get(
  '/:facilityId/geofence',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = parseInt(req.params.facilityId);
    const result = await facilityConfigService.getGeofence(facilityId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

facilityConfigRouter.put(
  '/:facilityId/geofence',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = parseInt(req.params.facilityId);
    const { lat, lng, radiusMeters, active } = req.body || {};
    const result = await facilityConfigService.upsertGeofence(facilityId, Number(lat), Number(lng), Number(radiusMeters), active !== false);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const employeeAttendanceRoutes = attendanceRouter;
export const meTimecardRoutes = meTimecardRouter;
export const supervisorTimecardRoutes = supervisorTimecardRouter;
export const payrollRoutes = payrollRouter;
export const facilityConfigRoutes = facilityConfigRouter;
