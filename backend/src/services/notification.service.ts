import { prisma } from '../config/database';

export interface NotificationPayload {
  companyId: number;
  facilityId?: number | null;
  title: string;
  body: string;
  category?: string;     // "doc-expiry" | "review-due" | "coverage" | "payroll" | "leave-approved"
  postedById?: number;   // optional — defaults to system user 1
  expiresAt?: Date | null;
  // Optional email delivery (currently logged-only — wire to SMTP later)
  emailTo?: string[];
}

export const notificationService = {
  /**
   * Post to NoticeBoard (visible in employee portal) and optionally enqueue email.
   * Email is currently a no-op stub; logs to stdout so jobs can be observed.
   */
  async send(payload: NotificationPayload) {
    const notice = await (prisma as any).noticeBoard.create({
      data: {
        companyId: payload.companyId,
        facilityId: payload.facilityId ?? null,
        title: payload.title,
        body: payload.body,
        category: payload.category ?? null,
        postedById: payload.postedById ?? 1,
        expiresAt: payload.expiresAt ?? null,
      },
    });
    if (payload.emailTo?.length) {
      console.log(`[notification] email stub → ${payload.emailTo.join(', ')} | ${payload.title}`);
    }
    return notice;
  },
};
