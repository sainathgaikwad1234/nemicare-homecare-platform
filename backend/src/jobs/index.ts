import cron, { ScheduledTask } from 'node-cron';
import { JobDefinition, runJob } from './runner';
import {
  monitorDocExpiry,
  triggerReviewCycle,
  monitorCoverage,
  runWeeklyPayroll,
  generateAttendanceSummary,
  generateOvertimeAnalysis,
  generateComplianceStatus,
} from './handlers';

export const JOBS: JobDefinition[] = [
  {
    name: 'monitorDocExpiry',
    description: 'Scan documents for expiry; alert at 60/30/7 days.',
    schedule: '0 2 * * *', // daily 2am
    handler: monitorDocExpiry,
  },
  {
    name: 'triggerReviewCycle',
    description: 'At hire-anniversary minus 30 days, create review draft and notify supervisor.',
    schedule: '0 3 * * *', // daily 3am
    handler: triggerReviewCycle,
  },
  {
    name: 'monitorCoverage',
    description: 'Check today/tomorrow shift coverage vs minimums; alert if understaffed.',
    schedule: '0 * * * *', // hourly
    handler: monitorCoverage,
  },
  {
    name: 'runWeeklyPayroll',
    description: 'Bi-weekly payroll: compile prior 14 days of APPROVED timecards → ADP.',
    // Every other Friday 6pm — node-cron does not natively support "every other" so we
    // run every Friday and check inside the handler whether it is an even or odd ISO week.
    // For now, run every Friday 6pm and let HR decide via UI; cron stays weekly.
    schedule: '0 18 * * 5',
    handler: runWeeklyPayroll,
  },
  {
    name: 'generateAttendanceSummary',
    description: 'Weekly attendance summary report posted to NoticeBoard per facility.',
    schedule: '0 6 * * 1', // Monday 6am
    handler: generateAttendanceSummary,
  },
  {
    name: 'generateOvertimeAnalysis',
    description: 'Weekly OT analysis by department.',
    schedule: '0 6 * * 1', // Monday 6am
    handler: generateOvertimeAnalysis,
  },
  {
    name: 'generateComplianceStatus',
    description: 'Daily compliance status — expired or expiring documents.',
    schedule: '0 4 * * *', // daily 4am
    handler: generateComplianceStatus,
  },
];

const tasks: ScheduledTask[] = [];

export function startCronJobs() {
  if (process.env.DISABLE_CRON === 'true') {
    console.log('[jobs] DISABLE_CRON=true; cron jobs not started.');
    return;
  }
  for (const job of JOBS) {
    const task = cron.schedule(job.schedule, () => {
      runJob(job, 'cron').catch((e) =>
        console.error(`[jobs] ${job.name} crashed:`, e)
      );
    });
    tasks.push(task);
    console.log(`[jobs] registered ${job.name} (${job.schedule}) — ${job.description}`);
  }
}

export function stopCronJobs() {
  for (const t of tasks) t.stop();
}

export function findJob(name: string): JobDefinition | undefined {
  return JOBS.find((j) => j.name === name);
}
