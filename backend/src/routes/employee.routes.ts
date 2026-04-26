import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { employeeService } from '../services/employee.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

router.get(
  '/',
  authenticate,
  requirePermission('employees.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await employeeService.listEmployees({
      companyId: req.user!.companyId,
      facilityId: req.query.facilityId ? parseInt(req.query.facilityId as string) : undefined,
      status: req.query.status as string | undefined,
      userRole: (req.query.userRole || req.query.hrmsRole) as string | undefined,
      department: req.query.department as string | undefined,
      onboardingStatus: req.query.onboardingStatus as any,
      searchQuery: req.query.q as string | undefined,
      page,
      pageSize,
    });

    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

router.get(
  '/:id',
  authenticate,
  requirePermission('employees.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employee = await employeeService.getEmployeeById(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: employee, meta: meta(req) });
  })
);

router.post(
  '/',
  authenticate,
  requirePermission('employees.create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const input = {
      ...req.body,
      companyId: req.body.companyId || req.user!.companyId,
      facilityId: req.body.facilityId || req.user!.facilityId,
    };
    const employee = await employeeService.createEmployee(input, req.user!.userId);
    res.status(201).json({ success: true, status: 201, data: employee, meta: meta(req) });
  })
);

router.put(
  '/:id',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employee = await employeeService.updateEmployee(parseInt(req.params.id), req.user!.companyId, req.body);
    res.json({ success: true, status: 200, data: employee, meta: meta(req) });
  })
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('employees.delete'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await employeeService.deleteEmployee(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.post(
  '/:id/activate',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employee = await employeeService.activateEmployee(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: employee, meta: meta(req) });
  })
);

router.post(
  '/:id/terminate',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const employee = await employeeService.terminateEmployee(
      parseInt(req.params.id),
      req.user!.companyId,
      req.body.terminationDate
    );
    res.json({ success: true, status: 200, data: employee, meta: meta(req) });
  })
);

router.post(
  '/:id/welcome-email',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await employeeService.sendWelcomeEmail(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

router.get(
  '/:id/documents',
  authenticate,
  requirePermission('employees.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const docs = await employeeService.getEmployeeDocuments(parseInt(req.params.id), req.user!.companyId);
    res.json({ success: true, status: 200, data: docs, meta: meta(req) });
  })
);

router.post(
  '/:id/documents',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const doc = await employeeService.addEmployeeDocument(
      parseInt(req.params.id),
      req.user!.companyId,
      req.body,
      req.user!.userId
    );
    res.status(201).json({ success: true, status: 201, data: doc, meta: meta(req) });
  })
);

router.delete(
  '/:id/documents/:documentId',
  authenticate,
  requirePermission('employees.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await employeeService.deleteEmployeeDocument(
      parseInt(req.params.id),
      parseInt(req.params.documentId),
      req.user!.companyId
    );
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const employeeRoutes = router;
