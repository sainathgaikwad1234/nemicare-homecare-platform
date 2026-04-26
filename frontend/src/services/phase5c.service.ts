import { apiClient, ApiResponse } from './api';

// =============== Incidents ===============
export type IncidentCategory = 'ATTENDANCE' | 'PERFORMANCE' | 'CONDUCT' | 'SAFETY' | 'POLICY_VIOLATION' | 'COMPLAINT' | 'OTHER';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface Incident {
  id: number;
  reportedById: number;
  involvedEmployeeId: number | null;
  incidentDate: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  actionTaken: string | null;
  status: IncidentStatus;
  resolvedAt: string | null;
  attachmentUrl: string | null;
  createdAt: string;
}

class IncidentService {
  list(opts: { status?: string; employeeId?: number; page?: number; pageSize?: number } = {}): Promise<ApiResponse<Incident[]>> {
    const p = new URLSearchParams();
    if (opts.status) p.append('status', opts.status);
    if (opts.employeeId) p.append('employeeId', String(opts.employeeId));
    if (opts.page) p.append('page', String(opts.page));
    if (opts.pageSize) p.append('pageSize', String(opts.pageSize));
    return apiClient.get(`/api/v1/incidents${p.toString() ? '?' + p.toString() : ''}`);
  }
  create(input: Partial<Incident>): Promise<ApiResponse<Incident>> {
    return apiClient.post('/api/v1/incidents', input);
  }
  update(id: number, input: Partial<Incident>): Promise<ApiResponse<Incident>> {
    return apiClient.put(`/api/v1/incidents/${id}`, input);
  }
}
export const incidentService = new IncidentService();

// =============== Recognitions ===============
export interface Recognition {
  id: number;
  employeeId: number;
  recognizedById: number;
  category: string;
  title: string;
  description: string | null;
  visibility: string;
  createdAt: string;
  employee?: { id: number; firstName: string; lastName: string; designation: string | null };
  recognizedBy?: { id: number; firstName: string; lastName: string };
}

class RecognitionService {
  list(opts: { employeeId?: number; page?: number; pageSize?: number } = {}): Promise<ApiResponse<Recognition[]>> {
    const p = new URLSearchParams();
    if (opts.employeeId) p.append('employeeId', String(opts.employeeId));
    if (opts.page) p.append('page', String(opts.page));
    if (opts.pageSize) p.append('pageSize', String(opts.pageSize));
    return apiClient.get(`/api/v1/recognitions${p.toString() ? '?' + p.toString() : ''}`);
  }
  create(input: { employeeId: number; category?: string; title: string; description?: string; visibility?: string }): Promise<ApiResponse<Recognition>> {
    return apiClient.post('/api/v1/recognitions', input);
  }
}
export const recognitionService = new RecognitionService();

// =============== Payroll Settings ===============
export interface PayrollSettings {
  id: number;
  companyId: number;
  payPeriodType: string;
  workweekStartDay: number;
  dailyOtThresholdHours: number;
  weeklyOtThresholdHours: number;
  doubletimeThresholdHours: number;
  nightShiftDifferentialPercent: number;
  weekendDifferentialPercent: number;
  holidayMultiplier: number;
  payrollProvider: string;
}

class PayrollSettingsService {
  get(): Promise<ApiResponse<PayrollSettings>> { return apiClient.get('/api/v1/payroll-settings'); }
  update(input: Partial<PayrollSettings>): Promise<ApiResponse<PayrollSettings>> { return apiClient.put('/api/v1/payroll-settings', input); }
}
export const payrollSettingsService = new PayrollSettingsService();

// =============== Training ===============
export interface TrainingModule {
  id: number; title: string; description: string | null; category: string | null; durationHours: number | null; isMandatory: boolean;
}
export interface TrainingAssignment {
  id: number; employeeId: number; trainingModuleId: number; assignedAt: string; dueDate: string | null; completedAt: string | null; status: string; score: number | null;
  trainingModule?: TrainingModule;
}

class TrainingService {
  listModules(): Promise<ApiResponse<TrainingModule[]>> { return apiClient.get('/api/v1/training/modules'); }
  createModule(input: Partial<TrainingModule>): Promise<ApiResponse<TrainingModule>> { return apiClient.post('/api/v1/training/modules', input); }
  listForEmployee(employeeId: number): Promise<ApiResponse<TrainingAssignment[]>> { return apiClient.get(`/api/v1/employees/${employeeId}/training`); }
  assign(employeeId: number, moduleId: number, dueDate?: string): Promise<ApiResponse<TrainingAssignment>> {
    return apiClient.post(`/api/v1/employees/${employeeId}/training`, { moduleId, dueDate });
  }
  markComplete(employeeId: number, assignmentId: number, score?: number): Promise<ApiResponse<TrainingAssignment>> {
    return apiClient.patch(`/api/v1/employees/${employeeId}/training/${assignmentId}/complete`, { score });
  }
}
export const trainingService = new TrainingService();

// =============== Peer-to-peer Shift Swap ===============
export interface PeerSwapPending {
  id: number;
  employee: { id: number; firstName: string; lastName: string; designation: string | null };
  originalShift: { id: number; shiftDate: string; shiftType: string; startTime: string; endTime: string };
  reason: string;
  requestedDate: string | null;
  requestedShiftType: string | null;
  createdAt: string;
}

class PeerSwapService {
  pendingForMe(): Promise<ApiResponse<PeerSwapPending[]>> { return apiClient.get('/api/v1/shift-change-requests/pending-for-me'); }
  accept(id: number): Promise<ApiResponse<any>> { return apiClient.post(`/api/v1/shift-change-requests/${id}/peer-accept`, {}); }
  decline(id: number, reason?: string): Promise<ApiResponse<any>> { return apiClient.post(`/api/v1/shift-change-requests/${id}/peer-decline`, { reason }); }
}
export const peerSwapService = new PeerSwapService();

// =============== Cross-employee Documents (Phase 5.13) ===============
export interface DocumentRow {
  id: number;
  documentType: string;
  documentName: string;
  fileUrl: string | null;
  expiryDate: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  computedStatus: 'Active' | 'Soon' | 'Expired';
  daysLeft: number | null;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeIdNumber: string | null;
    designation: string | null;
    profilePictureUrl: string | null;
  };
}

class DocumentsDashboardService {
  list(opts: { status?: 'ALL' | 'ACTIVE' | 'SOON' | 'EXPIRED'; search?: string; page?: number; pageSize?: number } = {}): Promise<ApiResponse<DocumentRow[]>> {
    const p = new URLSearchParams();
    if (opts.status && opts.status !== 'ALL') p.append('status', opts.status);
    if (opts.search) p.append('search', opts.search);
    if (opts.page) p.append('page', String(opts.page));
    if (opts.pageSize) p.append('pageSize', String(opts.pageSize));
    return apiClient.get(`/api/v1/documents${p.toString() ? '?' + p.toString() : ''}`);
  }
}
export const documentsDashboardService = new DocumentsDashboardService();
