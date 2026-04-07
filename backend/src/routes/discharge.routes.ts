import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { dischargeService } from '../services/discharge.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router({ mergeParams: true });

router.post('/', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = { ...req.body };
    if (data.dischargeDate) data.dischargeDate = new Date(data.dischargeDate);
    const record = await dischargeService.createDischargeRecord(
      Number(req.params.residentId), req.user!.companyId, data, req.user!.userId
    );
    res.status(201).json({ success: true, status: 201, data: record, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.get('/', authenticate, requirePermission('residents.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const record = await dischargeService.getDischargeRecord(
      Number(req.params.residentId), req.user!.companyId
    );
    res.json({ success: true, status: 200, data: record, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.put('/:recordId/approval', authenticate, requirePermission('residents.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.body;
    const record = await dischargeService.updateApproval(
      Number(req.params.recordId), req.user!.companyId, status, req.user!.userId
    );
    res.json({ success: true, status: 200, data: record, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

export const dischargeRoutes = router;
