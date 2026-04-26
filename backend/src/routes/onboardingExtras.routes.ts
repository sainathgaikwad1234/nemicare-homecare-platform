import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { employeeTestService, bgCheckDispatchService } from '../services/employeeTest.service';

const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

// Mounted at /api/v1/employees/:employeeId/...
const router = Router({ mergeParams: true });

// ============ Employee Tests ============
router.get(
  '/:employeeId/tests',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = parseInt((req as any).params.employeeId);
    const result = await employeeTestService.listForEmployee(req.user!.companyId, employeeId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/:employeeId/tests',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = parseInt((req as any).params.employeeId);
    const result = await employeeTestService.create(req.user!.companyId, employeeId, req.user!.userId, (req as any).body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

router.put(
  '/:employeeId/tests/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await employeeTestService.update(req.user!.companyId, id, (req as any).body);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.delete(
  '/:employeeId/tests/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await employeeTestService.remove(req.user!.companyId, id);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// ============ Background Check Dispatch ============
router.get(
  '/:employeeId/bg-check-dispatches',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = parseInt((req as any).params.employeeId);
    const result = await bgCheckDispatchService.listForEmployee(req.user!.companyId, employeeId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/:employeeId/bg-check-dispatches',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = parseInt((req as any).params.employeeId);
    const result = await bgCheckDispatchService.dispatch(req.user!.companyId, employeeId, req.user!.userId, (req as any).body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

router.patch(
  '/:employeeId/bg-check-dispatches/:id/record-report',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await bgCheckDispatchService.recordReport(req.user!.companyId, id, (req as any).body);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const onboardingExtrasRoutes = router;
