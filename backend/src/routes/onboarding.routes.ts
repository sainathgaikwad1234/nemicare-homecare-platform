import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { onboardingService } from '../services/onboarding.service';
import { employeeService } from '../services/employee.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();
const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

// Onboarding employees list (= IN_PROGRESS employees)
router.get(
  '/employees',
  authenticate,
  requirePermission('employees.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const result = await employeeService.listEmployees({
      companyId: req.user!.companyId,
      facilityId: req.query.facilityId ? parseInt(req.query.facilityId as string) : undefined,
      onboardingStatus: 'IN_PROGRESS',
      searchQuery: req.query.q as string | undefined,
      page,
      pageSize,
    });
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

// Get full onboarding state for one employee
router.get(
  '/employees/:id',
  authenticate,
  requirePermission('employees.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const state = await onboardingService.getOnboardingState(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: state, meta: meta(req) });
  })
);

// === Step 1: Pre-Employment Screening ===

router.post(
  '/employees/:id/step1/documents',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const doc = await onboardingService.addStep1Document(
      parseInt(req.params.id),
      req.user!.companyId,
      req.body,
      req.user!.userId
    );
    res.status(201).json({ success: true, status: 201, data: doc, meta: meta(req) });
  })
);

router.post(
  '/employees/:id/step1/documents/:docId/send',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const doc = await onboardingService.sendStep1Document(
      parseInt(req.params.id),
      req.user!.companyId,
      parseInt(req.params.docId)
    );
    res.json({ success: true, status: 200, data: doc, meta: meta(req) });
  })
);

router.post(
  '/employees/:id/step1/documents/:docId/complete',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const doc = await onboardingService.completeStep1Document(
      parseInt(req.params.id),
      req.user!.companyId,
      parseInt(req.params.docId),
      req.body.fileUrl
    );
    res.json({ success: true, status: 200, data: doc, meta: meta(req) });
  })
);

router.delete(
  '/employees/:id/step1/documents/:docId',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await onboardingService.deleteStep1Document(
      parseInt(req.params.id),
      req.user!.companyId,
      parseInt(req.params.docId)
    );
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.put(
  '/employees/:id/step1/agency',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await onboardingService.setStep1Agency(
      parseInt(req.params.id),
      req.user!.companyId,
      req.body.location,
      req.body.agencyId ?? null
    );
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/employees/:id/step1/satisfactory',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const emp = await onboardingService.markStep1Satisfactory(
      parseInt(req.params.id),
      req.user!.companyId
    );
    res.json({ success: true, status: 200, data: emp, meta: meta(req) });
  })
);

// === Step 2: Mandatory Document Collection ===

router.post(
  '/employees/:id/step2/upload',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const doc = await onboardingService.uploadStep2Document(
      parseInt(req.params.id),
      req.user!.companyId,
      req.body,
      req.user!.userId
    );
    res.json({ success: true, status: 200, data: doc, meta: meta(req) });
  })
);

router.post(
  '/employees/:id/step2/next',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const emp = await onboardingService.advanceToStep3(
      parseInt(req.params.id),
      req.user!.companyId
    );
    res.json({ success: true, status: 200, data: emp, meta: meta(req) });
  })
);

// === Step 3: Employment Activation ===

router.post(
  '/employees/:id/step3/activate',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const emp = await onboardingService.activate(
      parseInt(req.params.id),
      req.user!.companyId,
      req.body.officialStartDate
    );
    res.json({ success: true, status: 200, data: emp, meta: meta(req) });
  })
);

// Welcome email (callable from any onboarding step)
router.post(
  '/employees/:id/welcome-email',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await onboardingService.sendWelcomeEmail(
      parseInt(req.params.id),
      req.user!.companyId,
      req.user!.userId,
      req.body.subject
    );
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// Background check agencies
router.get(
  '/agencies',
  authenticate,
  requirePermission('employees.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const agencies = await onboardingService.listAgencies(
      req.user!.companyId,
      req.query.location as string | undefined
    );
    res.json({ success: true, status: 200, data: agencies, meta: meta(req) });
  })
);

router.post(
  '/agencies',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const agency = await onboardingService.createAgency(req.user!.companyId, req.body);
    res.status(201).json({ success: true, status: 201, data: agency, meta: meta(req) });
  })
);

export const onboardingRoutes = router;
