import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { dashboardService } from '../services/dashboard.service';

const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

const router = Router();

router.get('/hr-admin', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await dashboardService.hrAdmin(req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.get('/supervisor', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await dashboardService.supervisor(req.user!.userId, req.user!.companyId, req.user!.facilityId ?? null);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const dashboardRoutes = router;
