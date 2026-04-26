import { apiClient, ApiResponse } from './api';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Task {
  id: number;
  companyId: number;
  facilityId: number;
  assignedToId: number;
  createdById: number;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  assignedTo?: { id: number; firstName?: string; lastName?: string; profilePictureUrl?: string; designation?: string };
  createdBy?: { id: number; firstName?: string; lastName?: string };
}

export interface TaskStats { total: number; completed: number; pending: number; due: number; }

class TaskService {
  async list(opts: { assignedToId?: number; status?: string; page?: number; pageSize?: number } = {}): Promise<ApiResponse<Task[]>> {
    const p = new URLSearchParams();
    if (opts.assignedToId) p.append('assignedToId', String(opts.assignedToId));
    if (opts.status) p.append('status', opts.status);
    if (opts.page) p.append('page', String(opts.page));
    if (opts.pageSize) p.append('pageSize', String(opts.pageSize));
    return apiClient.get<Task[]>(`/api/v1/tasks${p.toString() ? '?' + p.toString() : ''}`);
  }
  async myList(status?: string, page = 1, pageSize = 25): Promise<ApiResponse<Task[]>> {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) p.append('status', status);
    return apiClient.get<Task[]>(`/api/v1/me/tasks?${p.toString()}`);
  }
  async myStats(): Promise<ApiResponse<TaskStats>> {
    return apiClient.get<TaskStats>('/api/v1/me/tasks/stats');
  }
  async create(input: Partial<Task>): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>('/api/v1/tasks', input);
  }
  async update(id: number, input: Partial<Task>): Promise<ApiResponse<Task>> {
    return apiClient.put<Task>(`/api/v1/tasks/${id}`, input);
  }
  async remove(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/tasks/${id}`);
  }
  async markComplete(id: number): Promise<ApiResponse<Task>> {
    return apiClient.post<Task>(`/api/v1/me/tasks/${id}/complete`, {});
  }
}
export const taskService = new TaskService();

export type ReviewStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface PerformanceReview {
  id: number;
  companyId: number;
  employeeId: number;
  reviewerId: number;
  periodStart: string;
  periodEnd: string;
  overallRating?: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  comments?: string;
  status: ReviewStatus;
  // Sprint 5.5 fields
  supervisorSignature?: string | null;
  supervisorSignedAt?: string | null;
  compensationNotes?: string | null;
  trainingNeeds?: string | null;
  lockedAt?: string | null;
  pdfPath?: string | null;
  employeeViewedAt?: string | null;
  approvedAt?: string;
  daysLeft?: number;
  employee?: any;
  reviewer?: any;
}

class PerformanceService {
  async list(status?: string, page = 1, pageSize = 10): Promise<ApiResponse<PerformanceReview[]>> {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) p.append('status', status);
    return apiClient.get<PerformanceReview[]>(`/api/v1/performance-reviews?${p.toString()}`);
  }
  async getById(id: number): Promise<ApiResponse<PerformanceReview>> {
    return apiClient.get<PerformanceReview>(`/api/v1/performance-reviews/${id}`);
  }
  async create(input: Partial<PerformanceReview>): Promise<ApiResponse<PerformanceReview>> {
    return apiClient.post<PerformanceReview>('/api/v1/performance-reviews', input);
  }
  // Sprint 5.5 — Supervisor: edit + submit with signature
  async update(id: number, input: Partial<PerformanceReview>): Promise<ApiResponse<PerformanceReview>> {
    return apiClient.put<PerformanceReview>(`/api/v1/performance-reviews/${id}`, input);
  }
  async submit(id: number, signature: string): Promise<ApiResponse<PerformanceReview>> {
    return apiClient.post<PerformanceReview>(`/api/v1/performance-reviews/${id}/submit`, { signature });
  }
  // Sprint 5.5 — HR finalize with comp + training notes
  async finalize(id: number, hrFields: { compensationNotes?: string; trainingNeeds?: string } = {}): Promise<ApiResponse<PerformanceReview>> {
    return apiClient.post<PerformanceReview>(`/api/v1/performance-reviews/${id}/finalize`, hrFields);
  }
  async approve(id: number): Promise<ApiResponse<PerformanceReview>> {
    return apiClient.post<PerformanceReview>(`/api/v1/performance-reviews/${id}/approve`, {});
  }
  async reject(id: number, reason?: string): Promise<ApiResponse<PerformanceReview>> {
    return apiClient.post<PerformanceReview>(`/api/v1/performance-reviews/${id}/reject`, { reason });
  }
  // Sprint 5.5 — Employee read-only
  async myList(): Promise<ApiResponse<PerformanceReview[]>> {
    return apiClient.get<PerformanceReview[]>('/api/v1/me/performance-reviews');
  }
  async myGet(id: number): Promise<ApiResponse<PerformanceReview>> {
    return apiClient.get<PerformanceReview>(`/api/v1/me/performance-reviews/${id}`);
  }
  pdfUrl(id: number, side: 'me' | 'admin' = 'admin'): string {
    return side === 'me' ? `/api/v1/me/performance-reviews/${id}/pdf` : `/api/v1/performance-reviews/${id}/pdf`;
  }
}
export const performanceService = new PerformanceService();

export type ExitStatus = 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED';

export interface AssetReturnItem {
  name: string;
  returned: boolean;
  notes?: string;
  returnedAt?: string;
}

export interface ExitRecord {
  id: number;
  companyId: number;
  employeeId: number;
  exitReason: string;
  exitType: string;
  noticeDate: string;
  lastWorkingDay: string;
  exitInterviewNotes?: string;
  exitInterviewDate?: string;
  finalPayAmount?: number;
  benefitsTerminated: boolean;
  portalAccessRevoked: boolean;
  status: ExitStatus;
  completedAt?: string;
  createdAt: string;
  employee?: any;
  assetReturns?: AssetReturnItem[] | null;
}

class ExitService {
  async list(status?: string, page = 1, pageSize = 20): Promise<ApiResponse<ExitRecord[]>> {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) p.append('status', status);
    return apiClient.get<ExitRecord[]>(`/api/v1/exits?${p.toString()}`);
  }
  async getById(id: number): Promise<ApiResponse<ExitRecord>> {
    return apiClient.get<ExitRecord>(`/api/v1/exits/${id}`);
  }
  async initiate(input: Partial<ExitRecord>): Promise<ApiResponse<ExitRecord>> {
    return apiClient.post<ExitRecord>('/api/v1/exits', input);
  }
  async update(id: number, input: Partial<ExitRecord>): Promise<ApiResponse<ExitRecord>> {
    return apiClient.put<ExitRecord>(`/api/v1/exits/${id}`, input);
  }
  async finalize(id: number): Promise<ApiResponse<ExitRecord>> {
    return apiClient.post<ExitRecord>(`/api/v1/exits/${id}/finalize`, {});
  }
}
export const exitService = new ExitService();
