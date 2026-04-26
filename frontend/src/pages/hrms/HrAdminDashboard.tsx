import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress, Avatar, Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, PeopleAlt as PeopleIcon, AssignmentLate as PendingIcon,
  GppMaybe as ComplianceIcon, PersonAdd as OnboardingIcon, AttachMoney as PayrollIcon,
  Warning as WarningIcon, ArrowForward as ArrowIcon, ExitToApp as ExitIcon,
  Cancel as CancelIcon, FactCheck as ComplianceCheckIcon, Apartment as FacilityIcon,
  Description as DocumentIcon, Quiz as TestIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardService, HrAdminDashboard, ActivityLogEvent } from '../../services/dashboard.service';

const SHIFT_LABEL: Record<string, string> = { FIRST: '1st Shift', SECOND: '2nd Shift', THIRD: '3rd Shift' };

const initials = (firstName?: string, lastName?: string) =>
  `${(firstName || '?').charAt(0)}${(lastName || '?').charAt(0)}`.toUpperCase();

const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
};

const ACTIVITY_META: Record<ActivityLogEvent['type'], { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  NEW_HIRE: { color: '#065f46', bg: '#d1fae5', label: 'New Hire', icon: <OnboardingIcon sx={{ fontSize: 16 }} /> },
  EXIT_RECORDED: { color: '#991b1b', bg: '#fee2e2', label: 'Exit', icon: <ExitIcon sx={{ fontSize: 16 }} /> },
  SHIFT_CANCELLED: { color: '#92400e', bg: '#fef3c7', label: 'Shift Cancelled', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
  COMPLIANCE_REVIEW: { color: '#1e3a5f', bg: '#dbeafe', label: 'Compliance Review', icon: <ComplianceCheckIcon sx={{ fontSize: 16 }} /> },
};

export const HrAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<HrAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await dashboardService.hrAdmin();
      if (r.success && r.data) setData(r.data);
    } catch (e: any) {
      console.error('Dashboard load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <DashboardIcon sx={{ color: '#1e3a5f' }} />
        <Typography sx={{ fontWeight: 600, color: '#1e3a5f', fontSize: '1.1rem' }}>HR Admin Dashboard</Typography>
      </Box>

      {/* Quick Links action bar */}
      <Paper sx={{ p: 1.5, mb: 2.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/employees')} sx={{ textTransform: 'none' }}>
          Employees
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/onboarding')} sx={{ textTransform: 'none' }}>
          Onboarding
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/leaves')} sx={{ textTransform: 'none' }}>
          Leaves
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/payroll')} sx={{ textTransform: 'none' }}>
          Payroll
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/reports')} sx={{ textTransform: 'none' }}>
          Reports
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/notices')} sx={{ textTransform: 'none' }}>
          Notice Board
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/console')} sx={{ textTransform: 'none' }}>
          Console
        </Button>
      </Paper>

      {/* KPI cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        <Kpi icon={<PendingIcon />} label="Pending Approvals" value={data.kpis.pendingApprovals}
          sub="Leaves + Timecards + Reviews + Exits" color={data.kpis.pendingApprovals > 0 ? '#f59e0b' : '#10b981'} />
        <Kpi icon={<ComplianceIcon />} label="Compliance Alerts" value={data.kpis.complianceAlerts}
          sub="Expired docs + tests expiring 7d" color={data.kpis.complianceAlerts > 0 ? '#dc2626' : '#10b981'} />
        <Kpi icon={<OnboardingIcon />} label="Onboarding" value={data.kpis.onboardingInProgress}
          sub="Employees in onboarding" color="#1e3a5f" />
        <Kpi icon={<PeopleIcon />} label="Active Employees" value={data.kpis.activeEmployees}
          sub="Total active workforce" color="#1e3a5f" />
      </Box>

      {/* Per-facility headcount */}
      {data.perFacilityHeadcount && data.perFacilityHeadcount.length > 0 && (
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', mb: 3 }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>Headcount by Facility</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.perFacilityHeadcount.length, 4)}, 1fr)`, gap: 1.5 }}>
            {data.perFacilityHeadcount.map((f) => (
              <Box key={f.id} sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 1, bgcolor: '#fafbfc' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                  <FacilityIcon sx={{ fontSize: 16, color: '#1e3a5f' }} />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e3a5f' }}>{f.name}</Typography>
                </Box>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e3a5f' }}>{f.count}</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                  {f.facilityType || 'Facility'} • Active staff
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Pending breakdown grid + Today's coverage */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Pending Approvals</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5 }}>
            <PendingTile label="Leaves" count={data.pendingBreakdown.leaves} onClick={() => navigate('/hrms/leaves')} />
            <PendingTile label="Timecards" count={data.pendingBreakdown.timecards} onClick={() => navigate('/hrms/timecards')} />
            <PendingTile label="Shift Changes" count={data.pendingBreakdown.shiftChanges} onClick={() => navigate('/hrms/shift-changes')} />
            <PendingTile label="Reviews" count={data.pendingBreakdown.reviews} onClick={() => navigate('/hrms/reviews')} />
            <PendingTile label="Exits" count={data.pendingBreakdown.exits} onClick={() => navigate('/hrms/exits')} />
          </Box>
        </Paper>

        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>Today's Coverage</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {data.coverage.today.map((c) => (
              <Box key={c.shiftType} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: c.adequate ? '#d1fae5' : '#fee2e2', borderRadius: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{SHIFT_LABEL[c.shiftType] || c.shiftType}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: c.adequate ? '#065f46' : '#991b1b' }}>
                    {c.current}/{c.minimum}
                  </Typography>
                  {!c.adequate && <WarningIcon sx={{ fontSize: 16, color: '#991b1b' }} />}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Named-employee Pending Leave Queue + Compliance Alert Queue */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Leave Approval Queue</Typography>
            <Button size="small" endIcon={<ArrowIcon fontSize="small" />} onClick={() => navigate('/hrms/leaves')}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}>View all</Button>
          </Box>
          {(!data.pendingLeaveQueue || data.pendingLeaveQueue.length === 0) ? (
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>No pending leaves at HR level.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.pendingLeaveQueue.map((lr) => (
                <Box key={lr.id} onClick={() => navigate('/hrms/leaves')}
                  sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f5f6fa' } }}>
                  <Avatar src={lr.employee.profilePictureUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#1e3a5f' }}>
                    {initials(lr.employee.firstName, lr.employee.lastName)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e3a5f' }} noWrap>
                      {lr.employee.firstName} {lr.employee.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }} noWrap>
                      {lr.leaveType} • {lr.numberOfDays}d • {new Date(lr.fromDate).toLocaleDateString()} → {new Date(lr.toDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip label="L2 PENDING" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#fef3c7', color: '#92400e' }} />
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Compliance Alerts</Typography>
            <Button size="small" endIcon={<ArrowIcon fontSize="small" />} onClick={() => navigate('/hrms/employees')}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}>View all</Button>
          </Box>
          {(!data.complianceAlertQueue || data.complianceAlertQueue.length === 0) ? (
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>No upcoming expiries.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.complianceAlertQueue.map((c, idx) => {
                const expiryDate = new Date(c.expiryDate);
                const daysUntil = Math.ceil((expiryDate.getTime() - Date.now()) / 86400000);
                const isExpired = daysUntil < 0;
                return (
                  <Box key={`${c.kind}-${idx}`} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 1, '&:hover': { bgcolor: '#f5f6fa' } }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: '50%',
                      bgcolor: isExpired ? '#fee2e2' : '#fef3c7',
                      color: isExpired ? '#991b1b' : '#92400e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {c.kind === 'document' ? <DocumentIcon sx={{ fontSize: 18 }} /> : <TestIcon sx={{ fontSize: 18 }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e3a5f' }} noWrap>
                        {c.employee.firstName} {c.employee.lastName} — {c.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: isExpired ? '#991b1b' : '#92400e' }}>
                        {isExpired ? `Expired ${Math.abs(daysUntil)}d ago` : `Expires in ${daysUntil}d`} ({expiryDate.toLocaleDateString()})
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>

      {/* Workforce Movement: New Joiners + Recent Exits */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>New Joiners (last 90d)</Typography>
          {(!data.workforceMovement?.newJoiners || data.workforceMovement.newJoiners.length === 0) ? (
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>No recent hires.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.workforceMovement.newJoiners.map((j) => (
                <Box key={j.id} onClick={() => navigate(`/hrms/employees/${j.id}`)}
                  sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f0fdf4' } }}>
                  <Avatar src={j.profilePictureUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#10b981' }}>
                    {initials(j.firstName, j.lastName)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e3a5f' }}>
                      {j.firstName} {j.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {j.designation || 'Employee'} • Joined {new Date(j.hireDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip label="JOINED" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#d1fae5', color: '#065f46' }} />
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>Recent Exits (last 90d)</Typography>
          {(!data.workforceMovement?.exits || data.workforceMovement.exits.length === 0) ? (
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>No recent exits.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.workforceMovement.exits.map((e) => (
                <Box key={e.id} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 1, '&:hover': { bgcolor: '#fef2f2' } }}>
                  <Avatar src={e.profilePictureUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#dc2626' }}>
                    {initials(e.firstName, e.lastName)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e3a5f' }}>
                      {e.firstName} {e.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {e.designation || 'Employee'} • {new Date(e.completedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip label={e.exitType} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#fee2e2', color: '#991b1b' }} />
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      {/* System health + Last payroll + Compliance counts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>System Health</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: data.systemHealth.failedJobsToday > 0 ? '#fee2e2' : '#d1fae5', borderRadius: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>Failed cron jobs today</Typography>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 600, color: data.systemHealth.failedJobsToday > 0 ? '#991b1b' : '#065f46' }}>
                {data.systemHealth.failedJobsToday}
              </Typography>
            </Box>
            <Button size="small" endIcon={<ArrowIcon fontSize="small" />} onClick={() => navigate('/hrms/system-jobs')}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
              System Jobs
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>Last Payroll Run</Typography>
          {data.lastPayroll ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontSize: '0.85rem' }}>Batch #{data.lastPayroll.id}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {new Date(data.lastPayroll.runDate).toLocaleDateString()} • {data.lastPayroll.totalEmployees} employees
                </Typography>
                <Chip label={data.lastPayroll.status} size="small" sx={{
                  height: 20, fontSize: '0.65rem', mt: 0.5,
                  bgcolor: data.lastPayroll.status === 'COMPLETE' ? '#d1fae5' : data.lastPayroll.status === 'FAILED' ? '#fee2e2' : '#fef3c7',
                  color: data.lastPayroll.status === 'COMPLETE' ? '#065f46' : data.lastPayroll.status === 'FAILED' ? '#991b1b' : '#92400e',
                }} />
              </Box>
              <Button size="small" endIcon={<PayrollIcon fontSize="small" />} onClick={() => navigate('/hrms/payroll')}
                sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                Payroll
              </Button>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>No payroll runs yet.</Typography>
          )}
        </Paper>

        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>Compliance Snapshot</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Expired Documents</span><b style={{ color: data.compliance.expiredDocuments > 0 ? '#dc2626' : '#065f46' }}>{data.compliance.expiredDocuments}</b>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Tests expiring 7d</span><b style={{ color: data.compliance.testsExpiringIn7Days > 0 ? '#f59e0b' : '#065f46' }}>{data.compliance.testsExpiringIn7Days}</b>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Domain Activity Log */}
      <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', mb: 3 }}>
        <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>Activity Log</Typography>
        {(!data.activityLog || data.activityLog.length === 0) ? (
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>No recent activity.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {data.activityLog.map((a, idx) => {
              const meta = ACTIVITY_META[a.type] || ACTIVITY_META.NEW_HIRE;
              return (
                <React.Fragment key={`${a.type}-${idx}-${a.timestamp}`}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: '50%',
                      bgcolor: meta.bg, color: meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {meta.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.85rem', color: '#1e3a5f' }}>{a.title}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{formatRelative(a.timestamp)}</Typography>
                    </Box>
                    <Chip label={meta.label} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: meta.bg, color: meta.color }} />
                  </Box>
                  {idx < data.activityLog.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Recent notices + Tomorrow coverage */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Recent Notices</Typography>
            <Button size="small" endIcon={<ArrowIcon fontSize="small" />} onClick={() => navigate('/hrms/notices')}
              sx={{ textTransform: 'none', fontSize: '0.75rem' }}>View all</Button>
          </Box>
          {data.recentNotices.length === 0 ? (
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>No notices.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.recentNotices.map((n) => (
                <Box key={n.id} sx={{ p: 1, bgcolor: '#f5f6fa', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{n.title}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{new Date(n.createdAt).toLocaleString()}</Typography>
                  </Box>
                  {n.category && <Chip label={n.category} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />}
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>Tomorrow's Coverage</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {data.coverage.tomorrow.map((c) => (
              <Box key={c.shiftType} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: c.adequate ? '#d1fae5' : '#fee2e2', borderRadius: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{SHIFT_LABEL[c.shiftType] || c.shiftType}</Typography>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: c.adequate ? '#065f46' : '#991b1b' }}>
                  {c.current}/{c.minimum}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

    </Box>
  );
};

const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: any; sub?: string; color: string }> = ({ icon, label, value, sub, color }) => (
  <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color }}>
      {icon}
      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase' }}>{label}</Typography>
    </Box>
    <Typography sx={{ fontSize: '1.7rem', fontWeight: 600, color }}>{value}</Typography>
    {sub && <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{sub}</Typography>}
  </Paper>
);

const PendingTile: React.FC<{ label: string; count: number; onClick: () => void }> = ({ label, count, onClick }) => (
  <Box onClick={onClick}
    sx={{
      p: 1.5, border: '1px solid #e5e7eb', borderRadius: 1, textAlign: 'center', cursor: 'pointer',
      bgcolor: count > 0 ? '#fff7ed' : '#f5f6fa',
      '&:hover': { bgcolor: count > 0 ? '#fed7aa' : '#eff4fb' },
    }}>
    <Typography sx={{ fontSize: '1.4rem', fontWeight: 600, color: count > 0 ? '#92400e' : '#6b7280' }}>{count}</Typography>
    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase' }}>{label}</Typography>
  </Box>
);

export default HrAdminDashboardPage;
