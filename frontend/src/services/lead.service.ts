/**
 * Lead Service - Service methods for Lead API
 * Pattern: Wraps apiClient with type-safe methods for lead operations
 */

import { apiClient, ApiResponse, PaginatedResponse } from './api';

export interface Lead {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  source: string;
  status: 'PROSPECT' | 'QUALIFIED' | 'IN_PROCESS' | 'CONVERTED' | 'REJECTED';
  followUpDate?: string;
  notes?: string;
  companyId?: string;
  facilityId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  source: string;
  companyId: string;
  facilityId: string;
  notes?: string;
}

export interface LeadUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  source?: string;
  status?: 'PROSPECT' | 'QUALIFIED' | 'IN_PROCESS' | 'CONVERTED' | 'REJECTED';
  followUpDate?: string;
  notes?: string;
}

export interface LeadActivity {
  id: number;
  leadId: number;
  activityType: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdById: number;
  createdAt: string;
}

export interface LeadNote {
  id: number;
  leadId: number;
  content: string;
  isPrivate: boolean;
  createdById: number;
  editedAt?: string;
  createdAt: string;
}

export interface LeadListOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  source?: string;
  facilityId?: string;
  search?: string;
}

class LeadService {
  /**
   * Get all leads with pagination and filtering
   */
  async getLeads(options: LeadListOptions = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.pageSize) params.append('pageSize', options.pageSize.toString());
    if (options.status) params.append('status', options.status);
    if (options.source) params.append('source', options.source);
    if (options.facilityId) params.append('facilityId', options.facilityId);
    if (options.search) params.append('q', options.search);

    const queryString = params.toString();
    const endpoint = `/api/v1/leads${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<Lead[]>(endpoint);
  }

  /**
   * Get lead by ID
   */
  async getLeadById(id: string): Promise<ApiResponse<Lead>> {
    return apiClient.get<Lead>(`/api/v1/leads/${id}`);
  }

  /**
   * Create new lead
   */
  async createLead(input: LeadCreateInput): Promise<ApiResponse<Lead>> {
    return apiClient.post<Lead>('/api/v1/leads', input);
  }

  /**
   * Update lead
   */
  async updateLead(id: string, input: LeadUpdateInput): Promise<ApiResponse<Lead>> {
    return apiClient.put<Lead>(`/api/v1/leads/${id}`, input);
  }

  /**
   * Delete lead (soft delete)
   */
  async deleteLead(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/leads/${id}`);
  }

  /**
   * Convert lead to resident
   */
  async convertLeadToResident(leadId: string, facilityId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`/api/v1/leads/${leadId}/convert`, { facilityId });
  }

  /**
   * Get activity timeline for a lead
   */
  async getActivities(leadId: string, page = 1, pageSize = 50) {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    return apiClient.get<LeadActivity[]>(`/api/v1/leads/${leadId}/activities?${params}`);
  }

  /**
   * Get notes for a lead
   */
  async getNotes(leadId: string): Promise<ApiResponse<LeadNote[]>> {
    return apiClient.get<LeadNote[]>(`/api/v1/leads/${leadId}/notes`);
  }

  /**
   * Add a note to a lead
   */
  async addNote(leadId: string, content: string, isPrivate: boolean): Promise<ApiResponse<LeadNote>> {
    return apiClient.post<LeadNote>(`/api/v1/leads/${leadId}/notes`, { content, isPrivate });
  }

  /**
   * Update an existing note
   */
  async updateNote(leadId: string, noteId: number, content: string): Promise<ApiResponse<LeadNote>> {
    return apiClient.put<LeadNote>(`/api/v1/leads/${leadId}/notes/${noteId}`, { content });
  }

  /**
   * Reject a lead with reason
   */
  async rejectLead(leadId: string, reason: string): Promise<ApiResponse<Lead>> {
    return apiClient.post<Lead>(`/api/v1/leads/${leadId}/reject`, { reason });
  }
}

export const leadService = new LeadService();
