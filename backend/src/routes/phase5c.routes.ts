import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import {
  incidentService, recognitionService, payrollSettingsService, trainingService, activityLogService,
} from '../services/incident.service';
import { shiftChangeService } from '../services/shiftChange.service';
import { employeeService } from '../services/employee.service';

const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

// =========== Activity Log (HR Dashboard feed) ===========
const activity = Router();
activity.get('/recent', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = parseInt((req as any).query.limit) || 30;
    const result = await activityLogService.recent(req.user!.companyId, limit);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// =========== Incidents ===========
const incidents = Router();
incidents.get('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await incidentService.list(req.user!.companyId, {
      status: (req as any).query.status,
      employeeId: (req as any).query.employeeId ? parseInt((req as any).query.employeeId) : undefined,
      page: parseInt((req as any).query.page) || 1,
      pageSize: parseInt((req as any).query.pageSize) || 25,
    });
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);
incidents.post('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await incidentService.create(req.user!.companyId, req.user!.userId, (req as any).body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);
incidents.put('/:id', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await incidentService.update(req.user!.companyId, id, (req as any).body);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// =========== Recognitions ===========
const recognitions = Router();
recognitions.get('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await recognitionService.list(req.user!.companyId, {
      employeeId: (req as any).query.employeeId ? parseInt((req as any).query.employeeId) : undefined,
      page: parseInt((req as any).query.page) || 1,
      pageSize: parseInt((req as any).query.pageSize) || 25,
    });
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);
recognitions.post('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Resolve recognizer's Employee record
    const recognizerEmp = await (prisma as any).employee.findFirst({
      where: { userId: req.user!.userId, companyId: req.user!.companyId, deletedAt: null },
      select: { id: true },
    });
    const recognizedById = recognizerEmp?.id ?? 1;
    const result = await recognitionService.create(req.user!.companyId, recognizedById, (req as any).body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

// =========== Payroll Settings ===========
const settings = Router();
settings.get('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await payrollSettingsService.get(req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);
settings.put('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await payrollSettingsService.update(req.user!.companyId, req.user!.userId, (req as any).body);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// =========== Training ===========
const training = Router();
training.get('/modules', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await trainingService.listModules(req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);
training.post('/modules', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await trainingService.createModule(req.user!.companyId, (req as any).body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

// Employee training assignments under /employees/:employeeId/training
const employeeTraining = Router({ mergeParams: true });
employeeTraining.get('/:employeeId/training', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = parseInt((req as any).params.employeeId);
    const result = await trainingService.listAssignmentsForEmployee(req.user!.companyId, employeeId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);
employeeTraining.post('/:employeeId/training', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = parseInt((req as any).params.employeeId);
    const { moduleId, dueDate } = (req as any).body;
    const result = await trainingService.assign(req.user!.companyId, employeeId, parseInt(moduleId), dueDate);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);
employeeTraining.patch('/:employeeId/training/:assignmentId/complete', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.assignmentId);
    const result = await trainingService.markComplete(id, (req as any).body?.score);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// =========== Peer-to-peer Shift Swap ===========
const peerSwap = Router();
peerSwap.get('/pending-for-me', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await shiftChangeService.listPendingForPeer(req.user!.userId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);
peerSwap.post('/:id/peer-accept', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await shiftChangeService.peerAccept(req.user!.userId, id);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);
peerSwap.post('/:id/peer-decline', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await shiftChangeService.peerDecline(req.user!.userId, id, (req as any).body?.reason);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// =========== Document signing ===========
const docSign = Router({ mergeParams: true });
docSign.post('/:employeeId/documents/:docId/sign', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employeeId = parseInt((req as any).params.employeeId);
    const docId = parseInt((req as any).params.docId);
    const { signatureText } = (req as any).body || {};
    if (!signatureText?.trim()) {
      throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, 'signatureText required');
    }
    const doc = await (prisma as any).employeeDocument.findFirst({
      where: { id: docId, employeeId, employee: { companyId: req.user!.companyId } },
    });
    if (!doc) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, 'Document not found');
    const updated = await (prisma as any).employeeDocument.update({
      where: { id: docId },
      data: {
        signedAt: new Date(),
        signedById: req.user!.userId,
        signatureText: signatureText.trim(),
        status: 'SIGNED',
      },
    });
    res.json({ success: true, status: 200, data: updated, meta: meta(req) });
  })
);

// =========== Cross-employee Documents dashboard (Phase 5.13) ===========
const documents = Router();
documents.get('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await employeeService.listAllDocuments(req.user!.companyId, {
      status: (req as any).query.status as any,
      search: (req as any).query.search as string | undefined,
      page: parseInt((req as any).query.page) || 1,
      pageSize: parseInt((req as any).query.pageSize) || 10,
    });
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

export const activityLogRoutes = activity;
export const incidentRoutes = incidents;
export const recognitionRoutes = recognitions;
export const payrollSettingsRoutes = settings;
export const trainingRoutes = training;
export const employeeTrainingRoutes = employeeTraining;
export const peerSwapRoutes = peerSwap;
export const docSignRoutes = docSign;
export const documentsRoutes = documents;
