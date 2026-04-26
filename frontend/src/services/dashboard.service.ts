import { apiClient, ApiResponse } from './api';

export interface CoverageRow {
  shiftType: string;
  current: number;
  minimum: number;
  adequate: boolean;
}

export interface EmployeeRef {
  id: number;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string | null;
  employeeIdNumber?: string | null;
  designation?: string | null;
}

export interface PendingLeaveQueueItem {
  id: number;
  leaveType: string;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string | null;
  createdAt: string;
  supervisorApprovalStatus?: string;
  hrApprovalStatus?: string;
  employee: EmployeeRef;
}

export interface ComplianceAlertItem {
  kind: 'document' | 'test';
  name: string;
  expiryDate: string;
  employee: EmployeeRef;
}

export interface WorkforceMovement {
  newJoiners: Array<EmployeeRef & { hireDate: string }>;
  exits: Array<EmployeeRef & { completedAt: string; exitType: string }>;
}

export interface PerFacilityHeadcount {
  id: number;
  name: string;
  facilityType: string | null;
  count: number;
}

export interface ActivityLogEvent {
  type: 'NEW_HIRE' | 'EXIT_RECORDED' | 'SHIFT_CANCELLED' | 'COMPLIANCE_REVIEW';
  title: string;
  timestamp: string;
  employeeId?: number;
}

export interface HrAdminDashboard {
  kpis: { pendingApprovals: number; complianceAlerts: number; onboardingInProgress: number; activeEmployees: number };
  pendingBreakdown: { leaves: number; timecards: number; shiftChanges: number; reviews: number; exits: number };
  compliance: { expiredDocuments: number; testsExpiringIn7Days: number };
  coverage: { today: CoverageRow[]; tomorrow: CoverageRow[] };
  systemHealth: { failedJobsToday: number };
  recentNotices: Array<{ id: number; title: string; category: string | null; createdAt: string }>;
  lastPayroll: {
    id: number; status: string; runDate: string; totalEmployees: number; totalRegularHours: number; totalOvertimeHours: number;
  } | null;
  recentActivity?: Array<{ id: number; actionType: string; entityType: string; entityId: number | null; userId: number | null; timestamp: string }>;
  pendingLeaveQueue: PendingLeaveQueueItem[];
  complianceAlertQueue: ComplianceAlertItem[];
  workforceMovement: WorkforceMovement;
  perFacilityHeadcount: PerFacilityHeadcount[];
  activityLog: ActivityLogEvent[];
}

export interface StaffingChartDay {
  date: string;
  label: string;
  assigned: number;
  required: number;
  byShift: { FIRST: number; SECOND: number; THIRD: number };
}

export interface SupervisorDashboard {
  supervisor: { id: number; name: string } | null;
  kpis: { pendingApprovals: number; myReviewsToComplete: number; directReports: number };
  pendingBreakdown: { leaves: number; timecards: number; shiftChanges: number };
  coverage: { today: CoverageRow[]; tomorrow: CoverageRow[] };
  todayRoster: Array<{ id: number; shiftType: string; startTime: string; endTime: string; employee: string; designation: string | null }>;
  recentNotices: Array<{ id: number; title: string; category: string | null; createdAt: string }>;
  pendingLeaveQueue: PendingLeaveQueueItem[];
  staffingChart: StaffingChartDay[];
  coveragePercent: number;
  overtimeAlertsThisWeek: number;
}

class DashboardService {
  hrAdmin(): Promise<ApiResponse<HrAdminDashboard>> { return apiClient.get('/api/v1/dashboard/hr-admin'); }
  supervisor(): Promise<ApiResponse<SupervisorDashboard>> { return apiClient.get('/api/v1/dashboard/supervisor'); }
}
export const dashboardService = new DashboardService();
