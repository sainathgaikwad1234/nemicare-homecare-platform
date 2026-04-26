import { apiClient, ApiResponse } from './api';

export type ShiftType = 'FIRST' | 'SECOND' | 'THIRD' | 'CUSTOM';
export type ShiftStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'DAY_OFF' | 'LEAVE';

export interface Shift {
  id: number;
  companyId: number;
  facilityId: number;
  employeeId: number;
  shiftDate: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  notes?: string;
  appliedLeaveRequestId?: number;
  employee?: {
    id: number;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    designation?: string;
    clinicalRole?: string;
  };
}

export interface CalendarPayload {
  range: { from: string; to: string };
  view: 'DAY' | 'WEEK' | 'MONTH';
  shifts: Shift[];
  leaveRequests: any[];
  employees: {
    id: number;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    designation?: string;
    clinicalRole?: string;
  }[];
}

class ShiftService {
  async getCalendar(view: 'DAY' | 'WEEK' | 'MONTH', date: string, facilityId?: number): Promise<ApiResponse<CalendarPayload>> {
    const p = new URLSearchParams({ view, date });
    if (facilityId) p.append('facilityId', String(facilityId));
    return apiClient.get<CalendarPayload>(`/api/v1/shifts/calendar?${p.toString()}`);
  }

  async list(opts: { from?: string; to?: string; facilityId?: number } = {}): Promise<ApiResponse<Shift[]>> {
    const p = new URLSearchParams();
    if (opts.from) p.append('from', opts.from);
    if (opts.to) p.append('to', opts.to);
    if (opts.facilityId) p.append('facilityId', String(opts.facilityId));
    const qs = p.toString();
    return apiClient.get<Shift[]>(`/api/v1/shifts${qs ? '?' + qs : ''}`);
  }

  async create(input: Partial<Shift>): Promise<ApiResponse<Shift>> {
    return apiClient.post<Shift>('/api/v1/shifts', input);
  }

  async update(id: number, input: Partial<Shift>): Promise<ApiResponse<Shift>> {
    return apiClient.put<Shift>(`/api/v1/shifts/${id}`, input);
  }

  async remove(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/shifts/${id}`);
  }

  async bulkAssign(input: {
    employeeIds: number[];
    shiftType: ShiftType;
    dates: string[];
    facilityId?: number;
  }): Promise<ApiResponse<{ created: number; total: number }>> {
    return apiClient.post('/api/v1/shifts/bulk', input);
  }
}

export const shiftService = new ShiftService();
