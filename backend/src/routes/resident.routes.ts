import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { residentService } from '../services/resident.service';
import { asyncHandler, errorHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate } from '../middleware/validation';

const router = Router();

/**
 * GET /api/v1/residents
 * Get all residents for company with pagination and filtering
 * Required permission: VIEW_RESIDENTS
 */
router.get(
  '/',
  authenticate,
  requirePermission('residents.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string | undefined;
    const facilityId = req.query.facilityId as string | undefined;

    const result = await residentService.getResidents({
      companyId: req.user!.companyId,
      facilityId: facilityId ? parseInt(facilityId) : undefined,
      status,
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
 * GET /api/v1/residents/:id
 * Get single resident by ID
 * Required permission: VIEW_RESIDENTS
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('residents.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const resident = await residentService.getResidentById(req.params.id, req.user!.companyId);

    res.status(200).json({
      success: true,
      status: 200,
      data: resident,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
      },
    });
  })
);

/**
 * POST /api/v1/residents
 * Create new resident
 * Required permission: CREATE_RESIDENTS
 */
router.post(
  '/',
  authenticate,
  requirePermission('residents.create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const input = {
      ...req.body,
      companyId: req.body.companyId || req.user!.companyId,
      facilityId: req.body.facilityId || req.user!.facilityId,
    };
    const resident = await residentService.createResident(input, req.user!.userId);

    res.status(201).json({
      success: true,
      status: 201,
      data: resident,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        created: true,
      },
    });
  })
);

/**
 * PUT /api/v1/residents/:id
 * Update resident
 * Required permission: EDIT_RESIDENTS
 */
router.put(
  '/:id',
  authenticate,
  requirePermission('residents.update'),
  validate('updateResident'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const resident = await residentService.updateResident(
      req.params.id,
      req.user!.companyId,
      req.body,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      status: 200,
      data: resident,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        updated: true,
      },
    });
  })
);

/**
 * DELETE /api/v1/residents/:id
 * Delete resident (soft delete)
 * Required permission: DELETE_RESIDENTS
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('residents.delete'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await residentService.deleteResident(req.params.id, req.user!.companyId, req.user!.id);

    res.status(200).json({
      success: true,
      status: 200,
      data: { message: 'Resident deleted successfully' },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        deleted: true,
      },
    });
  })
);

/**
 * POST /api/v1/residents/:id/discharge
 * Discharge resident
 * Required permission: DISCHARGE_RESIDENTS
 */
router.post(
  '/:id/discharge',
  authenticate,
  requirePermission('residents.discharge'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { dischargeDate, dischargeReason } = req.body;

    if (!dischargeDate || !dischargeReason) {
      res.status(400).json({
        success: false,
        status: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'dischargeDate and dischargeReason are required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).requestId,
        },
      });
      return;
    }

    const resident = await residentService.dischargeResident(
      req.params.id,
      req.user!.companyId,
      new Date(dischargeDate),
      dischargeReason,
      req.user!.id
    );

    res.status(200).json({
      success: true,
      status: 200,
      data: resident,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId,
        discharged: true,
      },
    });
  })
);

export const residentRoutes = router;
