import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { chartingService } from '../services/charting.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router({ mergeParams: true });

const typeMap: Record<string, keyof typeof chartingService> = {
  vitals: 'vitals', allergies: 'allergies', medications: 'medications',
  'care-plans': 'carePlans', events: 'events', 'progress-notes': 'progressNotes',
  services: 'services', tickets: 'tickets', inventory: 'inventory',
  incidents: 'incidents', 'pain-scale': 'painScale', 'face-to-face': 'faceToFace',
};

const resolveType = (req: any, res: Response, next: any) => {
  const serviceKey = typeMap[req.params.type];
  if (!serviceKey) { res.status(400).json({ success: false, error: { message: `Invalid type: ${req.params.type}` } }); return; }
  req.chartingType = serviceKey;
  next();
};

router.get('/:type', authenticate, requirePermission('charting.read'), resolveType,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const service = chartingService[(req as any).chartingType as keyof typeof chartingService];
    const result = await service.list(Number(req.params.residentId), req.user!.companyId, parseInt(req.query.page as string) || 1, parseInt(req.query.pageSize as string) || 50);
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.post('/:type', authenticate, requirePermission('charting.create'), resolveType,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = { ...req.body };
    for (const key of ['date', 'onsetDate', 'startDate', 'endDate', 'refillDate', 'targetDate']) { if (data[key]) data[key] = new Date(data[key]); }
    const service = chartingService[(req as any).chartingType as keyof typeof chartingService];
    const item = await service.create(Number(req.params.residentId), req.user!.companyId, data, req.user!.userId);
    res.status(201).json({ success: true, status: 201, data: item, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.put('/:type/:recordId', authenticate, requirePermission('charting.create'), resolveType,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = { ...req.body };
    for (const key of ['date', 'onsetDate', 'startDate', 'endDate', 'refillDate', 'targetDate']) { if (data[key]) data[key] = new Date(data[key]); }
    const service = chartingService[(req as any).chartingType as keyof typeof chartingService];
    const item = await service.update(Number(req.params.recordId), req.user!.companyId, data);
    res.json({ success: true, status: 200, data: item, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

router.delete('/:type/:recordId', authenticate, requirePermission('charting.create'), resolveType,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const service = chartingService[(req as any).chartingType as keyof typeof chartingService];
    const result = await service.remove(Number(req.params.recordId), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId } });
  }));

export const chartingRoutes = router;
