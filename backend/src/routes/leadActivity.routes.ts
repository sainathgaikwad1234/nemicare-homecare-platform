import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { leadActivityService } from '../services/leadActivity.service';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

/**
 * GET /api/v1/leads/:leadId/activities
 * Get activity timeline for a lead
 */
router.get(
  '/:leadId/activities',
  authenticate,
  requirePermission('leads.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const leadId = parseInt(req.params.leadId);
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const result = await leadActivityService.getActivities(leadId, req.user!.companyId, page, pageSize);

    res.status(200).json({
      success: true,
      status: 200,
      data: result.data,
      pagination: result.pagination,
      meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId },
    });
  })
);

/**
 * GET /api/v1/leads/:leadId/notes
 * Get notes for a lead (public + current user's private)
 */
router.get(
  '/:leadId/notes',
  authenticate,
  requirePermission('leads.read'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const leadId = parseInt(req.params.leadId);
    const notes = await leadActivityService.getNotes(leadId, req.user!.companyId, req.user!.userId);

    res.status(200).json({
      success: true,
      status: 200,
      data: notes,
      meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId },
    });
  })
);

/**
 * POST /api/v1/leads/:leadId/notes
 * Add a note to a lead
 */
router.post(
  '/:leadId/notes',
  authenticate,
  requirePermission('leads.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const leadId = parseInt(req.params.leadId);
    const { content, isPrivate } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        status: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Note content is required' },
        meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId },
      });
      return;
    }

    const note = await leadActivityService.addNote({
      leadId,
      companyId: req.user!.companyId,
      content: content.trim(),
      isPrivate: isPrivate || false,
      createdById: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      status: 201,
      data: note,
      meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId },
    });
  })
);

/**
 * PUT /api/v1/leads/:leadId/notes/:noteId
 * Update an existing note (only by creator)
 */
router.put(
  '/:leadId/notes/:noteId',
  authenticate,
  requirePermission('leads.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const noteId = parseInt(req.params.noteId);
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        status: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Note content is required' },
        meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId },
      });
      return;
    }

    const note = await leadActivityService.updateNote(noteId, req.user!.companyId, req.user!.userId, content.trim());

    res.status(200).json({
      success: true,
      status: 200,
      data: note,
      meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId },
    });
  })
);

/**
 * POST /api/v1/leads/:leadId/reject
 * Reject a lead with reason
 */
router.post(
  '/:leadId/reject',
  authenticate,
  requirePermission('leads.update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const leadId = parseInt(req.params.leadId);
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        status: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Rejection reason is required' },
        meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId },
      });
      return;
    }

    const lead = await leadActivityService.rejectLead(leadId, req.user!.companyId, reason.trim(), req.user!.userId);

    res.status(200).json({
      success: true,
      status: 200,
      data: lead,
      meta: { timestamp: new Date().toISOString(), requestId: (req as any).requestId },
    });
  })
);

export const leadActivityRoutes = router;
