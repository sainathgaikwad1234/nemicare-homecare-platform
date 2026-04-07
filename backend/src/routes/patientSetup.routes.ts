import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { patientSetupService } from '../services/patientSetup.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router({ mergeParams: true });

router.get('/', authenticate, requirePermission('residents.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const setup = await patientSetupService.getSetup(
      Number(req.params.residentId), req.user!.companyId
    );
    res.json({ success: true, status: 200, data: setup, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.put('/step/:stepKey', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const setup = await patientSetupService.updateStep(
      Number(req.params.residentId), req.user!.companyId, req.params.stepKey, req.body, req.user!.userId
    );
    res.json({ success: true, status: 200, data: setup, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.post('/complete/:stepIndex', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const setup = await patientSetupService.completeStep(
      Number(req.params.residentId), req.user!.companyId, Number(req.params.stepIndex), req.user!.userId
    );
    res.json({ success: true, status: 200, data: setup, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

export const patientSetupRoutes = router;
