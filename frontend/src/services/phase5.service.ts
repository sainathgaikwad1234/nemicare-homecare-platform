import { apiClient, ApiResponse } from './api';

// ============== Attendance / EVV ==============
export type PunchType = 'CLOCK_IN' | 'BREAK_START' | 'BREAK_END' | 'CLOCK_OUT';
export type PunchState = 'OFF' | 'CLOCKED_IN' | 'ON_BREAK' | 'CLOCKED_OUT';

export interface Punch {
  id: number;
  employeeId: number;
  punchType: PunchType;
  timestamp: string;
  ipAddress: string | null;
  ipValidated: boolean;
  geoLat: number | null;
  geoLng: number | null;
  geoValidated: boolean;
  notes: string | null;
}

export interface AttendanceState {
  state: PunchState;
  lastPunch: Punch | null;
  punches: Punch[];
  employee: { id: number; facilityId: number };
}

class AttendanceService {
  state(): Promise<ApiResponse<AttendanceState>> {
    return apiClient.get('/api/v1/me/attendance/state');
  }
  clockIn(opts?: { lat?: number; lng?: number }): Promise<ApiResponse<Punch>> {
    return apiClient.post('/api/v1/me/attendance/clock-in', opts || {});
  }
  startBreak(opts?: { lat?: number; lng?: number }): Promise<ApiResponse<Punch>> {
    return apiClient.post('/api/v1/me/attendance/break/start', opts || {});
  }
  endBreak(opts?: { lat?: number; lng?: number }): Promise<ApiResponse<Punch>> {
    return apiClient.post('/api/v1/me/attendance/break/end', opts || {});
  }
  clockOut(opts?: { lat?: number; lng?: number; taskDetails?: string }): Promise<ApiResponse<Punch>> {
    return apiClient.post('/api/v1/me/attendance/clock-out', opts || {});
  }
}
export const evvAttendanceService = new AttendanceService();

// ============== Timecards ==============
export type TimecardStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface Timecard {
  id: number;
  employeeId: number;
  periodStart: string;
  periodEnd: string;
  regularHours: string | number;
  overtimeHours: string | number;
  totalHours: string | number;
  netHours: string | number;
  breakMinutes: number;
  status: TimecardStatus;
  flags: string[] | null;
  taskDetails: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedById: number | null;
  overtimeApproved: boolean;
  payrollBatchId: number | null;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeIdNumber: string | null;
    designation: string | null;
    overtimeAllowed: boolean;
  };
}

class TimecardService {
  myList(page = 1, pageSize = 10): Promise<ApiResponse<Timecard[]>> {
    return apiClient.get(`/api/v1/me/timecards?page=${page}&pageSize=${pageSize}`);
  }
  submit(id: number, taskDetails: string): Promise<ApiResponse<Timecard>> {
    return apiClient.post(`/api/v1/me/timecards/${id}/submit`, { taskDetails });
  }
  approvalQueue(status?: TimecardStatus, page = 1, pageSize = 10): Promise<ApiResponse<Timecard[]>> {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) p.append('status', status);
    return apiClient.get(`/api/v1/timecards?${p.toString()}`);
  }
  approve(id: number): Promise<ApiResponse<Timecard>> {
    return apiClient.patch(`/api/v1/timecards/${id}/approve`, {});
  }
  reject(id: number, reason: string): Promise<ApiResponse<Timecard>> {
    return apiClient.patch(`/api/v1/timecards/${id}/reject`, { reason });
  }
  approveOvertime(id: number): Promise<ApiResponse<Timecard>> {
    return apiClient.patch(`/api/v1/timecards/${id}/approve-overtime`, {});
  }
}
export const timecardService = new TimecardService();

// ============== Payroll ==============
export type PayrollBatchStatus = 'COMPILING' | 'VALIDATING' | 'EXPORTED' | 'SENT_TO_ADP' | 'COMPLETE' | 'FAILED';

export interface PayrollBatch {
  id: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  runDate: string;
  status: PayrollBatchStatus;
  totalRegularHours: string | number;
  totalOvertimeHours: string | number;
  totalEmployees: number;
  adpExportPath: string | null;
  adpTransferAt: string | null;
  errors: any[] | null;
  facility?: { id: number; name: string } | null;
  timesheets?: Timecard[];
}

class PayrollService {
  listBatches(page = 1, pageSize = 20): Promise<ApiResponse<PayrollBatch[]>> {
    return apiClient.get(`/api/v1/payroll/batches?page=${page}&pageSize=${pageSize}`);
  }
  getBatch(id: number): Promise<ApiResponse<PayrollBatch>> {
    return apiClient.get(`/api/v1/payroll/batches/${id}`);
  }
  runBatch(payPeriodStart: string, payPeriodEnd: string, facilityId?: number): Promise<ApiResponse<PayrollBatch>> {
    return apiClient.post('/api/v1/payroll/batches', { payPeriodStart, payPeriodEnd, facilityId });
  }
  sendToAdp(id: number): Promise<ApiResponse<PayrollBatch>> {
    return apiClient.post(`/api/v1/payroll/batches/${id}/send-to-adp`, {});
  }
}
export const payrollService = new PayrollService();

// ============== Facility config (IP whitelist + geofence) ==============
export interface IpWhitelistEntry {
  id: number;
  facilityId: number;
  cidr: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}
export interface Geofence {
  id: number;
  facilityId: number;
  lat: number;
  lng: number;
  radiusMeters: number;
  active: boolean;
}

class FacilityConfigService {
  listWhitelist(facilityId: number): Promise<ApiResponse<IpWhitelistEntry[]>> {
    return apiClient.get(`/api/v1/facility-config/${facilityId}/ip-whitelist`);
  }
  addWhitelistEntry(facilityId: number, cidr: string, description?: string): Promise<ApiResponse<IpWhitelistEntry>> {
    return apiClient.post(`/api/v1/facility-config/${facilityId}/ip-whitelist`, { cidr, description });
  }
  toggleWhitelistEntry(id: number, active: boolean): Promise<ApiResponse<IpWhitelistEntry>> {
    return apiClient.patch(`/api/v1/facility-config/ip-whitelist/${id}`, { active });
  }
  deleteWhitelistEntry(id: number): Promise<ApiResponse<{ id: number }>> {
    return apiClient.delete(`/api/v1/facility-config/ip-whitelist/${id}`);
  }
  getGeofence(facilityId: number): Promise<ApiResponse<Geofence | null>> {
    return apiClient.get(`/api/v1/facility-config/${facilityId}/geofence`);
  }
  upsertGeofence(facilityId: number, lat: number, lng: number, radiusMeters: number, active = true): Promise<ApiResponse<Geofence>> {
    return apiClient.put(`/api/v1/facility-config/${facilityId}/geofence`, { lat, lng, radiusMeters, active });
  }
}
export const facilityConfigService = new FacilityConfigService();

// ============== System Jobs (Sprint 5.2) ==============
export type JobRunStatus = 'RUNNING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';

export interface JobDefinition {
  name: string;
  description: string;
  schedule: string;
}

export interface JobRunLog {
  id: number;
  jobName: string;
  status: JobRunStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  itemsProcessed: number;
  alertsSent: number;
  errors: any | null;
  summary: string | null;
  triggeredBy: string | null;
}

export interface JobRunResult {
  logId: number;
  status: JobRunStatus;
  result: {
    itemsProcessed?: number;
    alertsSent?: number;
    summary?: string;
    errors?: Array<{ context: string; message: string }>;
  };
}

class JobsService {
  list(): Promise<ApiResponse<JobDefinition[]>> {
    return apiClient.get('/api/v1/jobs');
  }
  runs(jobName?: string, page = 1, pageSize = 25): Promise<ApiResponse<JobRunLog[]>> {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (jobName) p.append('jobName', jobName);
    return apiClient.get(`/api/v1/jobs/runs?${p.toString()}`);
  }
  trigger(name: string): Promise<ApiResponse<JobRunResult>> {
    return apiClient.post(`/api/v1/jobs/${name}/run`, {});
  }
}
export const jobsService = new JobsService();

// ============== Shift Change Requests (Sprint 5.3) ==============
export type ShiftChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ShiftChangeRequestItem {
  id: number;
  employeeId: number;
  originalShiftId: number;
  originalShift?: {
    id: number;
    shiftDate: string;
    shiftType: string;
    startTime: string;
    endTime: string;
    status: string;
  };
  requestedDate: string | null;
  requestedShiftType: string | null;
  requestedStartTime: string | null;
  requestedEndTime: string | null;
  reason: string;
  status: ShiftChangeStatus;
  decidedById: number | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeIdNumber: string | null;
    designation: string | null;
  };
}

export interface ShiftChangeSubmitInput {
  originalShiftId: number;
  reason: string;
  requestedDate?: string | null;
  requestedShiftType?: string | null;
  requestedStartTime?: string | null;
  requestedEndTime?: string | null;
}

class ShiftChangeService {
  myList(status?: ShiftChangeStatus, page = 1, pageSize = 10): Promise<ApiResponse<ShiftChangeRequestItem[]>> {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) p.append('status', status);
    return apiClient.get(`/api/v1/me/shift-change-requests?${p.toString()}`);
  }
  submit(input: ShiftChangeSubmitInput): Promise<ApiResponse<ShiftChangeRequestItem>> {
    return apiClient.post('/api/v1/me/shift-change-requests', input);
  }
  approvalQueue(status?: ShiftChangeStatus, page = 1, pageSize = 10): Promise<ApiResponse<ShiftChangeRequestItem[]>> {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) p.append('status', status);
    return apiClient.get(`/api/v1/shift-change-requests?${p.toString()}`);
  }
  approve(id: number): Promise<ApiResponse<ShiftChangeRequestItem>> {
    return apiClient.patch(`/api/v1/shift-change-requests/${id}/approve`, {});
  }
  reject(id: number, reason: string): Promise<ApiResponse<ShiftChangeRequestItem>> {
    return apiClient.patch(`/api/v1/shift-change-requests/${id}/reject`, { reason });
  }
}
export const shiftChangeService = new ShiftChangeService();
