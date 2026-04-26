import { Router, Response } from 'express';
import { AuthRequest } from '../types';
import { asyncHandler } from '../middleware/errors';
import { authenticate } from '../middleware/auth';
import { prisma } from '../config/database';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { JOBS, findJob } from '../jobs';
import { runJob } from '../jobs/runner';

const router = Router();
const meta = (req: AuthRequest) => ({ timestamp: new Date().toISOString(), requestId: (req as any).requestId });

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({
      success: true,
      status: 200,
      data: JOBS.map((j) => ({ name: j.name, description: j.description, schedule: j.schedule })),
      meta: meta(req),
    });
  })
);

router.get(
  '/runs',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt((req as any).query.page) || 1;
    const pageSize = parseInt((req as any).query.pageSize) || 25;
    const jobName = (req as any).query.jobName as string | undefined;
    const where: any = {};
    if (jobName) where.jobName = jobName;
    const total = await (prisma as any).jobRunLog.count({ where });
    const data = await (prisma as any).jobRunLog.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    res.json({
      success: true,
      status: 200,
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      meta: meta(req),
    });
  })
);

router.post(
  '/:name/run',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const name = (req as any).params.name;
    const job = findJob(name);
    if (!job) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, `Unknown job: ${name}`);
    const userId = (req as any).user?.userId;
    const companyId = (req as any).user?.companyId;
    const result = await runJob(job, `manual:${userId}`, companyId);
    res.json({ success: true, status: 200, data: result, meta: meta(req) });
  })
);

export const jobsRoutes = router;
