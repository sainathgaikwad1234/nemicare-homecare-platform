import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { noticeBoardService } from '../services/noticeBoard.service';
import { messageService } from '../services/message.service';
import { reportsService } from '../services/reports.service';

const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

// =========== Notice Board ===========
const notices = Router();

notices.get('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const facilityId = (req as any).query.facilityId
      ? parseInt((req as any).query.facilityId)
      : (req as any).user?.facilityId ?? null;
    const result = await noticeBoardService.list(req.user!.companyId, {
      facilityId,
      category: (req as any).query.category as string | undefined,
      page: parseInt((req as any).query.page) || 1,
      pageSize: parseInt((req as any).query.pageSize) || 20,
    });
    res.json({ success: true, status: 200, data: result.data, pagination: result.pagination, meta: meta(req) });
  })
);

notices.post('/', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await noticeBoardService.create(req.user!.companyId, req.user!.userId, (req as any).body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

notices.put('/:id', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await noticeBoardService.update(req.user!.companyId, id, (req as any).body);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

notices.delete('/:id', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await noticeBoardService.remove(req.user!.companyId, id);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// =========== Messages ===========
const msgs = Router();

msgs.get('/threads', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await messageService.listMyThreads(req.user!.userId, req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

msgs.get('/threads/:id', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await messageService.getThread(id, req.user!.userId, req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

msgs.post('/threads', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await messageService.createThread(req.user!.userId, req.user!.companyId, (req as any).body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

msgs.post('/threads/:id/messages', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const id = parseInt((req as any).params.id);
    const result = await messageService.sendMessage(req.user!.userId, id, (req as any).body?.body);
    res.status(201).json({ success: true, status: 201, data: result, meta: meta(req) });
  })
);

msgs.get('/unread-count', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await messageService.unreadCount(req.user!.userId, req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

// =========== Reports ===========
const reports = Router();

reports.get('/headcount', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await reportsService.headcount(req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

reports.get('/turnover', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const months = parseInt((req as any).query.months) || 12;
    const result = await reportsService.turnover(req.user!.companyId, months);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

reports.get('/attendance', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const days = parseInt((req as any).query.days) || 30;
    const result = await reportsService.attendanceSummary(req.user!.companyId, days);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

reports.get('/leave-utilization', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await reportsService.leaveUtilization(req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

reports.get('/compliance', authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await reportsService.compliance(req.user!.companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const noticeBoardRoutes = notices;
export const messageRoutes = msgs;
export const reportsRoutes = reports;
