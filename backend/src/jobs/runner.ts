import { prisma } from '../config/database';

export interface JobResult {
  itemsProcessed?: number;
  alertsSent?: number;
  summary?: string;
  errors?: Array<{ context: string; message: string }>;
}

export type JobHandler = (companyId?: number) => Promise<JobResult>;

export interface JobDefinition {
  name: string;
  description: string;
  schedule: string; // cron expression
  handler: JobHandler;
}

/**
 * Wraps a job handler with JobRunLog lifecycle: create RUNNING row → run → mark SUCCESS / PARTIAL / FAILED.
 * Used by both cron-driven invocations and manual triggers.
 */
export async function runJob(
  job: JobDefinition,
  triggeredBy = 'cron',
  companyId?: number,
): Promise<{ logId: number; status: 'SUCCESS' | 'PARTIAL' | 'FAILED'; result: JobResult }> {
  const log = await (prisma as any).jobRunLog.create({
    data: {
      companyId: companyId ?? null,
      jobName: job.name,
      status: 'RUNNING',
      triggeredBy,
    },
  });

  const start = Date.now();
  let status: 'SUCCESS' | 'PARTIAL' | 'FAILED' = 'SUCCESS';
  let result: JobResult = {};

  try {
    result = await job.handler(companyId);
    if (result.errors && result.errors.length > 0) {
      status = result.itemsProcessed && result.itemsProcessed > 0 ? 'PARTIAL' : 'FAILED';
    }
  } catch (e: any) {
    status = 'FAILED';
    result = {
      errors: [{ context: 'unhandled', message: e?.message ?? String(e) }],
      summary: `Job failed: ${e?.message ?? e}`,
    };
  }

  await (prisma as any).jobRunLog.update({
    where: { id: log.id },
    data: {
      status,
      finishedAt: new Date(),
      durationMs: Date.now() - start,
      itemsProcessed: result.itemsProcessed ?? 0,
      alertsSent: result.alertsSent ?? 0,
      errors: result.errors?.length ? result.errors : null,
      summary: result.summary ?? null,
    },
  });

  return { logId: log.id, status, result };
}
