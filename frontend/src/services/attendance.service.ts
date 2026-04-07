import { apiClient, ApiResponse } from './api';

class AttendanceService {
  async getDailyRoster(date: string, facilityId?: number): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ date });
    if (facilityId) params.append('facilityId', facilityId.toString());
    return apiClient.get<any>(`/api/v1/attendance/daily?${params}`);
  }
  async getWeeklyRoster(weekStart: string, facilityId?: number): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({ weekStart });
    if (facilityId) params.append('facilityId', facilityId.toString());
    return apiClient.get<any>(`/api/v1/attendance/weekly?${params}`);
  }
  async checkIn(residentId: number, date?: string): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/api/v1/attendance/check-in', { residentId, date });
  }
  async checkOut(residentId: number, date?: string): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/api/v1/attendance/check-out', { residentId, date });
  }
  async markAbsent(residentId: number, reason: string, date?: string, notes?: string): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/api/v1/attendance/mark-absent', { residentId, reason, date, notes });
  }
}

export const attendanceService = new AttendanceService();
