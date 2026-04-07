import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { leadService } from '../services/lead.service';
import { asyncHandler, errorHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireSameCompany, requireSameFacility } from '../middleware/rbac';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * GET /api/v1/leads
 * Get all leads for company with pagination and filtering
 * Required permission: VIEW_LEADS
 */
router.get(
  '/',
  authenticate,
  requirePermission('leads.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;
    const source = req.query.source as string | undefined;
    const searchQuery = req.query.q as string | undefined;
    const facilityId = req.query.facilityId as string | undefined;

    const result = await leadService.getLeads({
      companyId: req.user!.companyId,
      facilityId,
      status,
      source,
      searchQuery,
      page,
      pageSize,
    });

    res.status(200).json({
      success: true,
      status: 200,
      data: result.data,
      pagination: result.pagination,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
      },
    });
  })
);

/**
 * GET /api/v1/leads/:id
 * Get single lead by ID
 * Required permission: VIEW_LEADS
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('leads.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const lead = await leadService.getLeadById(req.params.id, req.user!.companyId);

    res.status(200).json({
      success: true,
      status: 200,
      data: lead,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
      },
    });
  })
);

/**
 * POST /api/v1/leads
 * Create new lead
 * Required permission: CREATE_LEADS
 * Required body: firstName, lastName, email, phone, address, city, state, zipCode, dateOfBirth, gender, source
 */
router.post(
  '/',
  authenticate,
  requirePermission('leads.create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const input = {
      ...req.body,
      companyId: req.body.companyId || req.user!.companyId,
      facilityId: req.body.facilityId || req.user!.facilityId,
    };
    const lead = await leadService.createLead(input, req.user!.userId);

    res.status(201).json({
      success: true,
      status: 201,
      data: lead,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        created: true,
      },
    });
  })
);

/**
 * PUT /api/v1/leads/:id
 * Update lead
 * Required permission: EDIT_LEADS
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('leads.update'),
  validate('updateLead'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const lead = await leadService.updateLead(
      parseInt(req.params.id),
      req.user!.companyId,
      req.body,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      status: 200,
      data: lead,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        updated: true,
      },
    });
  })
);

/**
 * DELETE /api/v1/leads/:id
 * Delete lead (soft delete)
 * Required permission: DELETE_LEADS
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('leads.delete'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await leadService.deleteLead(parseInt(req.params.id), req.user!.companyId, req.user!.userId);

    res.status(200).json({
      success: true,
      status: 200,
      data: { message: 'Lead deleted successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        deleted: true,
      },
    });
  })
);

/**
 * POST /api/v1/leads/:id/convert
 * Convert lead to resident
 * Required permission: CONVERT_LEADS
 */
router.post(
  '/:id/convert',
  authenticate,
  requirePermission('leads.convert'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = req.body.facilityId || req.query.facilityId;

    if (!facilityId) {
      res.status(400).json({
        success: false,
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'facilityId is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    const resident = await leadService.convertLeadToResident(
      req.params.id,
      req.user!.companyId,
      facilityId,
      req.user!.userId
    );

    res.status(201).json({
      success: true,
      status: 201,
      data: resident,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        converted: true,
      },
    });
  })
);

export const leadRoutes = router;
