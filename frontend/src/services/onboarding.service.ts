import { apiClient, ApiResponse } from './api';
import { Employee } from './employee.service';

export interface OnboardingDocument {
  id: number;
  employeeId: number;
  documentType: 'BACKGROUND_CHECK_REPORT' | 'DRUG_SCREEN_REPORT' | 'DMV_BACKGROUND_CHECK';
  status: 'PENDING' | 'SENT' | 'COMPLETE';
  fileUrl?: string;
  agencyId?: number;
  sentAt?: string;
  completedAt?: string;
  createdById: number;
  createdAt: string;
}

export interface MandatoryDoc {
  id: number;
  employeeId: number;
  slot: 'LICENSES' | 'CPR_CERTIFICATES' | 'TB_TESTS' | 'I9_W4_FORMS' | 'VISA_DETAILS';
  fileUrl: string;
  uploadedById: number;
  uploadedAt: string;
}

export interface OnboardingState {
  employeeId: number;
  onboardingStatus: 'IN_PROGRESS' | 'COMPLETED';
  onboardingStep: number;
  welcomeEmailHistory: { sentAt: string; sentById: number; subject: string }[];
  step1: {
    documents: OnboardingDocument[];
    allComplete: boolean;
  };
  step2: {
    mandatoryDocs: MandatoryDoc[];
    slotsCompleted: string[];
  };
  step3: {
    officialStartDate: string | null;
    summary: { name: string; department?: string; jobTitle?: string; supervisor?: string };
  };
}

export interface BackgroundCheckAgency {
  id: number;
  location: string;
  agencyName: string;
  contactEmail?: string;
  contactPhone?: string;
}

class OnboardingService {
  async listEmployees(opts: { page?: number; pageSize?: number; q?: string } = {}): Promise<ApiResponse<Employee[]>> {
    const p = new URLSearchParams();
    if (opts.page) p.append('page', String(opts.page));
    if (opts.pageSize) p.append('pageSize', String(opts.pageSize));
    if (opts.q) p.append('q', opts.q);
    return apiClient.get<Employee[]>(`/api/v1/onboarding/employees${p.toString() ? '?' + p.toString() : ''}`);
  }

  async getState(employeeId: number): Promise<ApiResponse<OnboardingState>> {
    return apiClient.get<OnboardingState>(`/api/v1/onboarding/employees/${employeeId}`);
  }

  // Step 1 —
  async addStep1Doc(employeeId: number, documentType: string): Promise<ApiResponse<OnboardingDocument>> {
    return apiClient.post(`/api/v1/onboarding/employees/${employeeId}/step1/documents`, { documentType });
  }
  async sendStep1Doc(employeeId: number, docId: number): Promise<ApiResponse<OnboardingDocument>> {
    return apiClient.post(`/api/v1/onboarding/employees/${employeeId}/step1/documents/${docId}/send`, {});
  }
  async completeStep1Doc(employeeId: number, docId: number, fileUrl?: string): Promise<ApiResponse<OnboardingDocument>> {
    return apiClient.post(`/api/v1/onboarding/employees/${employeeId}/step1/documents/${docId}/complete`, { fileUrl });
  }
  async deleteStep1Doc(employeeId: number, docId: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/onboarding/employees/${employeeId}/step1/documents/${docId}`);
  }
  async setAgency(employeeId: number, location: string, agencyId: number | null): Promise<ApiResponse<any>> {
    return apiClient.put(`/api/v1/onboarding/employees/${employeeId}/step1/agency`, { location, agencyId });
  }
  async markSatisfactory(employeeId: number): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/onboarding/employees/${employeeId}/step1/satisfactory`, {});
  }

  // Step 2 —
  async uploadMandatoryDoc(employeeId: number, slot: string, fileUrl: string): Promise<ApiResponse<MandatoryDoc>> {
    return apiClient.post(`/api/v1/onboarding/employees/${employeeId}/step2/upload`, { slot, fileUrl });
  }
  async advanceToStep3(employeeId: number): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/onboarding/employees/${employeeId}/step2/next`, {});
  }

  // Step 3 —
  async activate(employeeId: number, officialStartDate: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/onboarding/employees/${employeeId}/step3/activate`, { officialStartDate });
  }

  // Welcome email
  async sendWelcomeEmail(employeeId: number, subject?: string): Promise<ApiResponse<{ sentAt: string; totalSends: number }>> {
    return apiClient.post(`/api/v1/onboarding/employees/${employeeId}/welcome-email`, { subject });
  }

  // Agencies
  async listAgencies(location?: string): Promise<ApiResponse<BackgroundCheckAgency[]>> {
    const p = new URLSearchParams();
    if (location) p.append('location', location);
    return apiClient.get(`/api/v1/onboarding/agencies${p.toString() ? '?' + p.toString() : ''}`);
  }
}

export const onboardingService = new OnboardingService();
