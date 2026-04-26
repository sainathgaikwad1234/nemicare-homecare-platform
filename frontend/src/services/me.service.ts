import { apiClient, ApiResponse } from './api';
import { Employee } from './employee.service';
import { CalendarPayload } from './shift.service';
import { LeaveRequest, LeaveType } from './leave.service';

export interface DashboardSummary {
  upcomingShift: any | null;
  pendingLeavesCount: number;
  leaveBalance: {
    annualBalance: number; sickBalance: number; personalBalance: number; unpaidBalance: number; year: number;
  } | null;
  performance: { overall: number | null; lastReviewedAt: string | null };
}

class MeService {
  async getProfile(): Promise<ApiResponse<Employee>> {
    return apiClient.get<Employee>('/api/v1/me/profile');
  }
  async getDashboard(): Promise<ApiResponse<DashboardSummary>> {
    return apiClient.get<DashboardSummary>('/api/v1/me/dashboard');
  }
  async getCalendar(view: 'DAY' | 'WEEK' | 'MONTH', date: string): Promise<ApiResponse<CalendarPayload>> {
    const p = new URLSearchParams({ view, date });
    return apiClient.get<CalendarPayload>(`/api/v1/me/shifts/calendar?${p.toString()}`);
  }
  async getLeaves(status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL', page = 1, pageSize = 10): Promise<ApiResponse<LeaveRequest[]>> {
    const p = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
    return apiClient.get<LeaveRequest[]>(`/api/v1/me/leaves?${p.toString()}`);
  }
  async getLeaveBalance(): Promise<ApiResponse<any>> {
    return apiClient.get('/api/v1/me/leave-balance');
  }
  async submitLeave(input: { leaveType: LeaveType; fromDate: string; toDate: string; reason?: string }): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post('/api/v1/me/leaves', input);
  }
}

export const meService = new MeService();
