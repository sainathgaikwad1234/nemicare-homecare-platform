import { apiClient, ApiResponse } from './api';

export interface Employee {
  id?: number;
  companyId?: number;
  facilityId?: number;
  userId?: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  salutation?: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  profilePictureUrl?: string;
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  language?: string;
  about?: string;
  ssn?: string;
  maritalStatus?: string;
  businessAddress?: string;
  slackMemberId?: string;
  socialLinks?: { platform: string; url: string }[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  employeeIdNumber?: string;
  positionTitle?: string;
  designation?: string;
  clinicalRole?: string;
  department?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  hrmsRole?: 'HR_ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
  userRole?: 'HR_ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
  hireDate?: string;
  terminationDate?: string;
  reportingManagerId?: number;
  reportingManager?: { id: number; firstName?: string; lastName?: string; designation?: string };
  probationEndDate?: string;
  noticeEndDate?: string;
  overtimeAllowed?: boolean;
  onboardingStatus?: 'IN_PROGRESS' | 'COMPLETED';
  onboardingStep?: number;
  officialStartDate?: string;
  welcomeEmailHistory?: { sentAt: string; sentById: number; subject: string }[];
  licenseType?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  baseSalary?: number;
  hourlyRate?: number;
  payFrequency?: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  welcomeEmailSentAt?: string;
  activatedAt?: string;
  facility?: { id: number; name: string };
  user?: { id: number; email: string; firstName: string; lastName: string; phone?: string };
  documents?: EmployeeDocument[];
  leaveBalance?: LeaveBalance;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeDocument {
  id: number;
  employeeId: number;
  documentType: string;
  documentName: string;
  fileUrl?: string;
  expiryDate?: string;
  status: string;
  notes?: string;
  uploadedById: number;
  createdAt: string;
  requiresSignature?: boolean;
  signedAt?: string | null;
  signedById?: number | null;
  signatureText?: string | null;
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  annualBalance: number;
  sickBalance: number;
  personalBalance: number;
  unpaidBalance: number;
  year: number;
}

export interface EmployeeListOptions {
  page?: number;
  pageSize?: number;
  status?: string;
  hrmsRole?: string;
  department?: string;
  facilityId?: number;
  q?: string;
}

class EmployeeService {
  async listEmployees(options: EmployeeListOptions = {}): Promise<ApiResponse<Employee[]>> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', String(options.page));
    if (options.pageSize) params.append('pageSize', String(options.pageSize));
    if (options.status) params.append('status', options.status);
    if (options.hrmsRole) params.append('hrmsRole', options.hrmsRole);
    if (options.department) params.append('department', options.department);
    if (options.facilityId) params.append('facilityId', String(options.facilityId));
    if (options.q) params.append('q', options.q);
    const qs = params.toString();
    return apiClient.get<Employee[]>(`/api/v1/employees${qs ? `?${qs}` : ''}`);
  }

  async getEmployeeById(id: number): Promise<ApiResponse<Employee>> {
    return apiClient.get<Employee>(`/api/v1/employees/${id}`);
  }

  async createEmployee(input: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return apiClient.post<Employee>('/api/v1/employees', input);
  }

  async updateEmployee(id: number, input: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return apiClient.put<Employee>(`/api/v1/employees/${id}`, input);
  }

  async deleteEmployee(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/employees/${id}`);
  }

  async activateEmployee(id: number): Promise<ApiResponse<Employee>> {
    return apiClient.post<Employee>(`/api/v1/employees/${id}/activate`, {});
  }

  async terminateEmployee(id: number, terminationDate?: string): Promise<ApiResponse<Employee>> {
    return apiClient.post<Employee>(`/api/v1/employees/${id}/terminate`, { terminationDate });
  }

  async sendWelcomeEmail(id: number): Promise<ApiResponse<{ message: string; sentAt: string }>> {
    return apiClient.post(`/api/v1/employees/${id}/welcome-email`, {});
  }

  async getDocuments(employeeId: number): Promise<ApiResponse<EmployeeDocument[]>> {
    return apiClient.get<EmployeeDocument[]>(`/api/v1/employees/${employeeId}/documents`);
  }

  async addDocument(employeeId: number, doc: Partial<EmployeeDocument>): Promise<ApiResponse<EmployeeDocument>> {
    return apiClient.post<EmployeeDocument>(`/api/v1/employees/${employeeId}/documents`, doc);
  }

  async deleteDocument(employeeId: number, documentId: number): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete(`/api/v1/employees/${employeeId}/documents/${documentId}`);
  }

  async signDocument(employeeId: number, documentId: number, signatureText: string): Promise<ApiResponse<EmployeeDocument>> {
    return apiClient.post<EmployeeDocument>(`/api/v1/employees/${employeeId}/documents/${documentId}/sign`, { signatureText });
  }
}

export const employeeService = new EmployeeService();
