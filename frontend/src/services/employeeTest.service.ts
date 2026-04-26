import { apiClient, ApiResponse } from './api';

export type EmployeeTestType =
  | 'TB_TEST' | 'DRUG_SCREEN' | 'PHYSICAL_EXAM' | 'FINGERPRINT_DMV'
  | 'CPR_CERTIFICATION' | 'HIV_TEST' | 'COVID_TEST' | 'HEPATITIS_B' | 'OTHER';
export type EmployeeTestStatus = 'PENDING' | 'PASSED' | 'FAILED' | 'EXPIRED' | 'WAIVED';

export interface EmployeeTest {
  id: number;
  employeeId: number;
  testType: EmployeeTestType;
  testName: string | null;
  passedDate: string | null;
  expiryDate: string | null;
  status: EmployeeTestStatus;
  fileUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export type BgCheckDispatchStatus = 'SENT' | 'IN_PROGRESS' | 'REPORT_RECEIVED' | 'CLEARED' | 'FAILED' | 'CANCELLED';

export interface BgCheckDispatch {
  id: number;
  employeeId: number;
  agencyId: number | null;
  agency?: { id: number; agencyName: string; location: string; contactEmail: string | null };
  consentDate: string;
  dispatchedAt: string;
  reportReceivedAt: string | null;
  reportFileUrl: string | null;
  status: BgCheckDispatchStatus;
  notes: string | null;
}

export const TEST_TYPE_LABELS: Record<EmployeeTestType, string> = {
  TB_TEST: 'TB Skin Test (PPD)',
  DRUG_SCREEN: 'Drug Screen',
  PHYSICAL_EXAM: 'Physical Exam',
  FINGERPRINT_DMV: 'Fingerprint / DMV Background',
  CPR_CERTIFICATION: 'CPR Certification',
  HIV_TEST: 'HIV Test',
  COVID_TEST: 'COVID Test',
  HEPATITIS_B: 'Hepatitis B',
  OTHER: 'Other',
};

class EmployeeTestService {
  list(employeeId: number): Promise<ApiResponse<EmployeeTest[]>> {
    return apiClient.get(`/api/v1/employees/${employeeId}/tests`);
  }
  create(employeeId: number, input: Partial<EmployeeTest>): Promise<ApiResponse<EmployeeTest>> {
    return apiClient.post(`/api/v1/employees/${employeeId}/tests`, input);
  }
  update(employeeId: number, id: number, input: Partial<EmployeeTest>): Promise<ApiResponse<EmployeeTest>> {
    return apiClient.put(`/api/v1/employees/${employeeId}/tests/${id}`, input);
  }
  remove(employeeId: number, id: number): Promise<ApiResponse<{ id: number }>> {
    return apiClient.delete(`/api/v1/employees/${employeeId}/tests/${id}`);
  }

  // BG Check dispatches
  listDispatches(employeeId: number): Promise<ApiResponse<BgCheckDispatch[]>> {
    return apiClient.get(`/api/v1/employees/${employeeId}/bg-check-dispatches`);
  }
  dispatch(employeeId: number, input: { agencyId: number; consentDate: string; notes?: string }): Promise<ApiResponse<BgCheckDispatch>> {
    return apiClient.post(`/api/v1/employees/${employeeId}/bg-check-dispatches`, input);
  }
  recordReport(employeeId: number, id: number, input: { reportFileUrl?: string; status?: BgCheckDispatchStatus; notes?: string }): Promise<ApiResponse<BgCheckDispatch>> {
    return apiClient.patch(`/api/v1/employees/${employeeId}/bg-check-dispatches/${id}/record-report`, input);
  }
}
export const employeeTestService = new EmployeeTestService();
