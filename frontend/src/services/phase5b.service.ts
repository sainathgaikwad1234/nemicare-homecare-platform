import { apiClient, ApiResponse } from './api';

// ============== Notice Board ==============
export interface Notice {
  id: number;
  companyId: number;
  facilityId: number | null;
  title: string;
  body: string;
  category: string | null;
  postedById: number;
  expiresAt: string | null;
  createdAt: string;
}

class NoticeBoardService {
  list(opts: { facilityId?: number; category?: string; page?: number; pageSize?: number } = {}): Promise<ApiResponse<Notice[]>> {
    const p = new URLSearchParams();
    if (opts.facilityId !== undefined) p.append('facilityId', String(opts.facilityId));
    if (opts.category) p.append('category', opts.category);
    if (opts.page) p.append('page', String(opts.page));
    if (opts.pageSize) p.append('pageSize', String(opts.pageSize));
    return apiClient.get(`/api/v1/notices${p.toString() ? '?' + p.toString() : ''}`);
  }
  create(input: Partial<Notice>): Promise<ApiResponse<Notice>> {
    return apiClient.post('/api/v1/notices', input);
  }
  update(id: number, input: Partial<Notice>): Promise<ApiResponse<Notice>> {
    return apiClient.put(`/api/v1/notices/${id}`, input);
  }
  remove(id: number): Promise<ApiResponse<{ id: number }>> {
    return apiClient.delete(`/api/v1/notices/${id}`);
  }
}
export const noticeBoardService = new NoticeBoardService();

// ============== Messages ==============
export interface MessageThread {
  id: number;
  companyId: number;
  subject: string | null;
  threadType: 'DIRECT' | 'DEPARTMENT' | 'ANNOUNCEMENT';
  lastMessageAt: string;
  participants: Array<{ userId: number; lastReadAt: string | null; user?: { id: number; firstName: string; lastName: string } }>;
  messages: Array<{ id: number; senderId: number; body: string; createdAt: string; sender?: { id: number; firstName: string; lastName: string } }>;
}

class MessageService {
  listThreads(): Promise<ApiResponse<MessageThread[]>> {
    return apiClient.get('/api/v1/messages/threads');
  }
  getThread(id: number): Promise<ApiResponse<MessageThread>> {
    return apiClient.get(`/api/v1/messages/threads/${id}`);
  }
  createThread(input: { recipientUserIds: number[]; subject?: string; body: string }): Promise<ApiResponse<MessageThread>> {
    return apiClient.post('/api/v1/messages/threads', input);
  }
  sendMessage(threadId: number, body: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/messages/threads/${threadId}/messages`, { body });
  }
  unreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    return apiClient.get('/api/v1/messages/unread-count');
  }
}
export const messageService = new MessageService();

// ============== Reports ==============
export interface HeadcountReport { total: number; active: number; onboarding: number; terminated: number; byDepartment: Array<{ department: string; count: number }>; byClinicalRole: Array<{ role: string; count: number }>; }
export interface TurnoverReport { windowMonths: number; totalEmployees: number; exitsInWindow: number; turnoverRatePercent: number; byMonth: Record<string, number>; recentExits: Array<{ id: number; employeeName: string; department: string | null; completedAt: string; exitType: string }>; }
export interface AttendanceReport { windowDays: number; timesheetsCount: number; totalHours: number; regularHours: number; overtimeHours: number; totalBreakHours: number; totalPunches: number; }
export interface LeaveUtilizationReport { remainingBalances: { annual: number; sick: number; personal: number; unpaid: number }; requestsThisYear: number; byStatus: Record<string, number>; approvedDaysThisYear: number; }
export interface ComplianceReport { documents: { expired: number; expiringIn7: number; expiringIn30: number }; tests: { expired: number; expiringIn7: number }; onboardingInProgress: number; }

class ReportsService {
  headcount(): Promise<ApiResponse<HeadcountReport>> { return apiClient.get('/api/v1/reports/headcount'); }
  turnover(months = 12): Promise<ApiResponse<TurnoverReport>> { return apiClient.get(`/api/v1/reports/turnover?months=${months}`); }
  attendance(days = 30): Promise<ApiResponse<AttendanceReport>> { return apiClient.get(`/api/v1/reports/attendance?days=${days}`); }
  leaveUtilization(): Promise<ApiResponse<LeaveUtilizationReport>> { return apiClient.get('/api/v1/reports/leave-utilization'); }
  compliance(): Promise<ApiResponse<ComplianceReport>> { return apiClient.get('/api/v1/reports/compliance'); }
}
export const reportsService = new ReportsService();
