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

export interface WeekShiftCell {
  shiftType: 'FIRST' | 'SECOND' | 'THIRD';
  startTime: string;
  endTime: string;
}
export interface WeekShiftEmployee {
  id: number;
  firstName: string;
  lastName: string;
  designation: string | null;
  profilePictureUrl: string | null;
  cells: (WeekShiftCell | null)[];
}
export interface WeekShiftMatrix {
  days: { date: string; label: string; weekday: string }[];
  employees: WeekShiftEmployee[];
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
  weekShiftMatrix: WeekShiftMatrix;
}

export interface FacilityDashboardKpis {
  activeMembers: number; newLeads: number; attendanceMtd: number; visitsToday: number;
}
export interface FacilityTodayMember {
  id: number; name: string; avatar: string; time: string;
  serviceType: 'ADH' | 'ALF' | 'Home Care'; transport: string; status: string;
  profilePictureUrl?: string | null;
}
export interface FacilityAttendanceDay {
  day: string; adh: number; alf: number; homeCare: number;
}
export interface FacilityDashboard {
  kpis: FacilityDashboardKpis;
  todaysMembers: FacilityTodayMember[];
  attendanceChart: FacilityAttendanceDay[];
  paAuthorizations: any[];
  vitalsDue: any[];
}

class DashboardService {
  hrAdmin(): Promise<ApiResponse<HrAdminDashboard>> { return apiClient.get('/api/v1/dashboard/hr-admin'); }
  supervisor(): Promise<ApiResponse<SupervisorDashboard>> { return apiClient.get('/api/v1/dashboard/supervisor'); }
  facility(): Promise<ApiResponse<FacilityDashboard>> { return apiClient.get('/api/v1/dashboard/facility'); }
}
export const dashboardService = new DashboardService();
