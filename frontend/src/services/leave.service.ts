import { apiClient, ApiResponse } from './api';

export type LeaveType = 'ANNUAL' | 'SICK' | 'PERSONAL' | 'UNPAID' | 'MATERNITY' | 'BEREAVEMENT' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type DualApprovalStatus = 'WAITING' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: number;
  companyId: number;
  employeeId: number;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  rejectionReason?: string;
  supervisorApprovalStatus: DualApprovalStatus;
  supervisorApprovedAt?: string;
  hrApprovalStatus: DualApprovalStatus;
  hrApprovedAt?: string;
  // Sprint 5.4 fields
  infoRequestMessage?: string | null;
  infoRequestedAt?: string | null;
  infoResponseMessage?: string | null;
  infoRespondedAt?: string | null;
  replacementEmployeeId?: number | null;
  createdAt: string;
  employee?: {
    id: number;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string;
    email?: string;
    phone?: string;
    employeeIdNumber?: string;
    designation?: string;
    clinicalRole?: string;
    leaveBalance?: { annualBalance: number; sickBalance: number; personalBalance: number };
  };
}

class LeaveService {
  async list(status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'ALL', page = 1, pageSize = 10): Promise<ApiResponse<LeaveRequest[]>> {
    const p = new URLSearchParams({ status, page: String(page), pageSize: String(pageSize) });
    return apiClient.get<LeaveRequest[]>(`/api/v1/leaves?${p.toString()}`);
  }

  async getById(id: number): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.get<LeaveRequest>(`/api/v1/leaves/${id}`);
  }

  async create(input: Partial<LeaveRequest> & { employeeId?: number }): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>('/api/v1/leaves', input);
  }

  async supervisorApprove(id: number, replacementEmployeeId?: number | null): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>(`/api/v1/leaves/${id}/supervisor-approve`, { replacementEmployeeId });
  }
  async supervisorReject(id: number, rejectionReason: string): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>(`/api/v1/leaves/${id}/supervisor-reject`, { rejectionReason });
  }
  async hrApprove(id: number): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>(`/api/v1/leaves/${id}/hr-approve`, {});
  }
  async hrReject(id: number, rejectionReason: string): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>(`/api/v1/leaves/${id}/hr-reject`, { rejectionReason });
  }

  // Sprint 5.4 — Coverage preview before approving
  async coveragePreview(id: number): Promise<ApiResponse<CoveragePreview>> {
    return apiClient.get<CoveragePreview>(`/api/v1/leaves/${id}/coverage-preview`);
  }

  // Sprint 5.4 — Need Info loopback
  async requestInfo(id: number, message: string): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>(`/api/v1/leaves/${id}/request-info`, { message });
  }

  // Sprint 5.4 — Inline quota check (employee-side)
  async quota(leaveType: LeaveType, days: number): Promise<ApiResponse<QuotaCheck>> {
    const p = new URLSearchParams({ leaveType, days: String(days) });
    return apiClient.get<QuotaCheck>(`/api/v1/me/leaves/quota?${p.toString()}`);
  }

  // Sprint 5.4 — Employee responds to info request
  async respondToInfoRequest(id: number, response: string): Promise<ApiResponse<LeaveRequest>> {
    return apiClient.post<LeaveRequest>(`/api/v1/me/leaves/${id}/respond-info`, { response });
  }
}

export interface CoveragePreview {
  undercoverage: boolean;
  affectedDays: Array<{
    shiftId: number;
    date: string;
    shiftType: string;
    currentCount: number;
    remainingIfApproved: number;
    minimum: number;
    adequate: boolean;
  }>;
  replacementCandidates: Array<{
    id: number;
    firstName: string | null;
    lastName: string | null;
    designation: string | null;
    clinicalRole: string | null;
  }>;
}

export interface QuotaCheck {
  remaining: number;
  sufficient: boolean;
  balance: { annualBalance: number; sickBalance: number; personalBalance: number; unpaidBalance: number } | null;
  leaveType: LeaveType;
}

export const leaveService = new LeaveService();
