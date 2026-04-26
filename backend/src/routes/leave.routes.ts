import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { leaveService } from '../services/leave.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

router.get(
  '/',
  authenticate,
  requirePermission('leaves.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await leaveService.listLeaves({
      companyId: req.user!.companyId,
      status: (req.query.status as any) || 'ALL',
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
    });
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

router.get(
  '/:id',
  authenticate,
  requirePermission('leaves.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await leaveService.getById(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/',
  authenticate,
  requirePermission('leaves.create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = req.body.employeeId || req.user!.userId; // for HR creating on behalf
    const result = await leaveService.createLeave(req.body, employeeId, req.user!.companyId);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

router.post(
  '/:id/supervisor-approve',
  authenticate,
  requirePermission('leaves.approve'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await leaveService.supervisorApprove(
      parseInt(req.params.id),
      req.user!.companyId,
      req.user!.userId,
      req.body?.replacementEmployeeId ? Number(req.body.replacementEmployeeId) : null,
    );
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// Sprint 5.4 — Coverage preview before approving
router.get(
  '/:id/coverage-preview',
  authenticate,
  requirePermission('leaves.approve'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await leaveService.coveragePreview(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// Sprint 5.4 — Need Info loopback (supervisor → employee)
router.post(
  '/:id/request-info',
  authenticate,
  requirePermission('leaves.approve'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await leaveService.requestInfo(
      parseInt(req.params.id), req.user!.companyId, req.user!.userId, req.body?.message,
    );
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/:id/supervisor-reject',
  authenticate,
  requirePermission('leaves.approve'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await leaveService.supervisorReject(parseInt(req.params.id), req.user!.companyId, req.user!.userId, req.body.rejectionReason);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/:id/hr-approve',
  authenticate,
  requirePermission('leaves.approve'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await leaveService.hrApprove(parseInt(req.params.id), req.user!.companyId, req.user!.userId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/:id/hr-reject',
  authenticate,
  requirePermission('leaves.approve'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await leaveService.hrReject(parseInt(req.params.id), req.user!.companyId, req.user!.userId, req.body.rejectionReason);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const leaveRoutes = router;
