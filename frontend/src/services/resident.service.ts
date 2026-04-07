/**
 * Resident Service - API methods for Resident management
 */

import { apiClient, ApiResponse } from './api';

export interface Resident {
  id?: number;
  companyId?: number;
  facilityId?: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  admissionDate?: string;
  admissionType?: string;
  status?: string;
  billingType?: string;
  primaryService?: string;
  dischargeDate?: string;
  dischargeReason?: string;
  facility?: { name: string };
  room?: { number: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ResidentListOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  facilityId?: string;
  search?: string;
}

class ResidentService {
  async getResidents(options: ResidentListOptions = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.pageSize) params.append('pageSize', options.pageSize.toString());
    if (options.status) params.append('status', options.status);
    if (options.facilityId) params.append('facilityId', options.facilityId);
    if (options.search) params.append('search', options.search);

    const qs = params.toString();
    return apiClient.get<Resident[]>(`/api/v1/residents${qs ? `?${qs}` : ''}`);
  }

  async getResidentById(id: number): Promise<ApiResponse<Resident>> {
    return apiClient.get<Resident>(`/api/v1/residents/${id}`);
  }

  async createResident(input: Partial<Resident>): Promise<ApiResponse<Resident>> {
    return apiClient.post<Resident>('/api/v1/residents', input);
  }

  async updateResident(id: number, input: Partial<Resident>): Promise<ApiResponse<Resident>> {
    return apiClient.put<Resident>(`/api/v1/residents/${id}`, input);
  }

  async deleteResident(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/residents/${id}`);
  }

  async dischargeResident(id: number, dischargeDate: string, dischargeReason: string): Promise<ApiResponse<Resident>> {
    return apiClient.post<Resident>(`/api/v1/residents/${id}/discharge`, { dischargeDate, dischargeReason });
  }
}

export const residentService = new ResidentService();
