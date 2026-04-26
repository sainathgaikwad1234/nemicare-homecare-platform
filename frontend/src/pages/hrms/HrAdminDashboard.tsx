import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress, Avatar, Divider,
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  EventBusy as LeaveIcon,
  Description as DocIcon,
  Payments as PayrollIcon,
  ArrowForward as ArrowIcon,
  ArrowOutward as ArrowOutwardIcon,
  PersonAdd as JoinerIcon,
  ExitToApp as ExitIcon,
  Apartment as FacilityIcon,
  Update as UpdateIcon,
  FactCheck as ComplianceCheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardService, HrAdminDashboard, ActivityLogEvent } from '../../services/dashboard.service';

const initials = (firstName?: string, lastName?: string) =>
  `${(firstName || '?').charAt(0)}${(lastName || '?').charAt(0)}`.toUpperCase();

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}/${d.getFullYear()}`;
};

const fmtTimestamp = (iso: string) => {
  const d = new Date(iso);
  return `${fmtDate(iso)} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
};

const ACTIVITY_META: Record<ActivityLogEvent['type'], { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  NEW_HIRE:           { color: '#065f46', bg: '#d1fae5', label: 'New Hire Onboarded',   icon: <JoinerIcon sx={{ fontSize: 16 }} /> },
  EXIT_RECORDED:      { color: '#991b1b', bg: '#fee2e2', label: 'Exit Processed',       icon: <ExitIcon sx={{ fontSize: 16 }} /> },
  SHIFT_CANCELLED:    { color: '#92400e', bg: '#fef3c7', label: 'Shift Schedule Updated', icon: <UpdateIcon sx={{ fontSize: 16 }} /> },
  COMPLIANCE_REVIEW:  { color: '#1e40af', bg: '#dbeafe', label: 'Compliance Review',    icon: <ComplianceCheckIcon sx={{ fontSize: 16 }} /> },
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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  const payrollStatus = data.lastPayroll?.status;
  const payrollLabel =
    payrollStatus === 'COMPLETE' ? 'On Track' :
    payrollStatus === 'FAILED'   ? 'Failed'   :
    payrollStatus === 'PENDING'  ? 'Pending'  : '—';
  const payrollColor =
    payrollStatus === 'COMPLETE' ? '#10b981' :
    payrollStatus === 'FAILED'   ? '#dc2626' : '#f59e0b';
  const payrollSub = data.lastPayroll
    ? `Last run ${fmtDate(data.lastPayroll.runDate)}`
    : 'No runs yet';

  const understaffing = data.coverage.today.filter((c) => !c.adequate);
  const newJoinerCount = data.workforceMovement?.newJoiners?.length || 0;
  const exitsCount = data.workforceMovement?.exits?.length || 0;
  const netChange = newJoinerCount - exitsCount;

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa' }}>
      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 2 }}>
        <KpiCard
          label="Total Employees"
          value={data.kpis.activeEmployees}
          sub="Active workforce"
          icon={<PeopleIcon />}
          iconBg="#dbeafe"
          iconColor="#1e40af"
          onClick={() => navigate('/hrms/employees')}
        />
        <KpiCard
          label="Pending Leave Approvals"
          value={data.pendingLeaveQueue?.length || 0}
          sub="Level 2 review"
          icon={<LeaveIcon />}
          iconBg="#d1fae5"
          iconColor="#10b981"
          onClick={() => navigate('/hrms/leaves')}
        />
        <KpiCard
          label="Documents Expiring"
          value={data.kpis.complianceAlerts}
          sub="Next 30 days"
          icon={<DocIcon />}
          iconBg="#fef3c7"
          iconColor="#f59e0b"
          onClick={() => navigate('/hrms/documents')}
        />
        <KpiCard
          label="Payroll Status"
          value={payrollLabel}
          valueIsText
          sub={payrollSub}
          icon={<PayrollIcon />}
          iconBg="#dbeafe"
          iconColor={payrollColor}
          onClick={() => navigate('/hrms/payroll')}
        />
      </Box>

      {/* Row 1: Leave Approval (1.4fr) | Compliance Alerts (1fr) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 2, mb: 2 }}>
        <SectionCard
          title="Leave Requests Awaiting Approval"
          count={data.pendingLeaveQueue?.length || 0}
          onViewAll={() => navigate('/hrms/leaves')}
        >
          {(!data.pendingLeaveQueue || data.pendingLeaveQueue.length === 0) ? (
            <EmptyRow text="No pending leaves." />
          ) : (
            data.pendingLeaveQueue.slice(0, 5).map((lr, idx) => (
              <Box key={lr.id} onClick={() => navigate('/hrms/leaves')}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, px: 0.5,
                  cursor: 'pointer', '&:hover': { bgcolor: '#f9fafb' },
                  borderBottom: idx < Math.min(data.pendingLeaveQueue.length, 5) - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                <Avatar src={lr.employee.profilePictureUrl || undefined}
                  sx={{ width: 36, height: 36, fontSize: '0.78rem', bgcolor: '#1e3a5f' }}>
                  {initials(lr.employee.firstName, lr.employee.lastName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }} noWrap>
                    {lr.employee.firstName} {lr.employee.lastName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    From: {fmtDate(lr.fromDate)} &nbsp;&nbsp;To: {fmtDate(lr.toDate)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#6b7280' }} noWrap>
                    Leave Request • {lr.leaveType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Typography>
                  <Chip label="Pending" size="small"
                    sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, height: 20, fontSize: '0.68rem' }} />
                </Box>
              </Box>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Compliance Alerts"
          count={data.complianceAlertQueue?.length || 0}
          onViewAll={() => navigate('/hrms/documents')}
        >
          {(!data.complianceAlertQueue || data.complianceAlertQueue.length === 0) ? (
            <EmptyRow text="No upcoming expiries." />
          ) : (
            data.complianceAlertQueue.slice(0, 5).map((c, idx) => (
              <Box key={`${c.kind}-${idx}`}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, px: 0.5,
                  borderBottom: idx < Math.min(data.complianceAlertQueue.length, 5) - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                <Avatar src={c.employee.profilePictureUrl || undefined}
                  sx={{ width: 36, height: 36, fontSize: '0.78rem', bgcolor: '#1e3a5f' }}>
                  {initials(c.employee.firstName, c.employee.lastName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }} noWrap>
                    {c.employee.firstName} {c.employee.lastName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }} noWrap>
                    {c.name} {c.kind === 'document' ? 'Expiring' : 'Test Expiring'}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', flexShrink: 0 }}>
                  {fmtDate(c.expiryDate)}
                </Typography>
              </Box>
            ))
          )}
        </SectionCard>
      </Box>

      {/* Row 2: Workforce Movement (1.5fr) | Understaffing (0.8fr) | Activity Log (1.2fr) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1.2fr', gap: 2 }}>
        <SectionCard
          title="Workforce Movement"
          rightSlot={
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>New Hires</Typography>
              <Chip label={String(newJoinerCount).padStart(2, '0')} size="small"
                sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', ml: 1 }}>Net Change</Typography>
              <Chip label={`${netChange >= 0 ? '+' : ''}${String(Math.abs(netChange)).padStart(2, '0')}`} size="small"
                sx={{
                  bgcolor: netChange >= 0 ? '#dbeafe' : '#fee2e2',
                  color: netChange >= 0 ? '#1e40af' : '#991b1b',
                  fontWeight: 700, height: 20, fontSize: '0.7rem',
                }} />
            </Box>
          }
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f' }}>New Joiners</Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/hrms/onboarding')}
                  sx={{ textTransform: 'none', fontSize: '0.68rem', minWidth: 0, p: 0.25, color: '#1e3a5f' }}>
                  View All
                </Button>
              </Box>
              {(!data.workforceMovement?.newJoiners || data.workforceMovement.newJoiners.length === 0) ? (
                <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', mt: 1 }}>No recent hires.</Typography>
              ) : (
                data.workforceMovement.newJoiners.slice(0, 4).map((j) => (
                  <Box key={j.id} onClick={() => navigate(`/hrms/employees/${j.id}`)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1, py: 0.75, cursor: 'pointer',
                      '&:hover': { bgcolor: '#f0fdf4' },
                    }}>
                    <Avatar src={j.profilePictureUrl || undefined} sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: '#10b981' }}>
                      {initials(j.firstName, j.lastName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f' }} noWrap>
                        {j.firstName} {j.lastName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.66rem', color: '#9ca3af' }}>
                        {j.designation || 'Employee'}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.66rem', color: '#9ca3af' }}>
                      {fmtDate(j.hireDate)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626' }} />
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f' }}>Exits</Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/hrms/exits')}
                  sx={{ textTransform: 'none', fontSize: '0.68rem', minWidth: 0, p: 0.25, color: '#1e3a5f' }}>
                  View All
                </Button>
              </Box>
              {(!data.workforceMovement?.exits || data.workforceMovement.exits.length === 0) ? (
                <Typography sx={{ fontSize: '0.78rem', color: '#9ca3af', mt: 1 }}>No recent exits.</Typography>
              ) : (
                data.workforceMovement.exits.slice(0, 4).map((e) => (
                  <Box key={e.id}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, '&:hover': { bgcolor: '#fef2f2' } }}>
                    <Avatar src={e.profilePictureUrl || undefined} sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: '#dc2626' }}>
                      {initials(e.firstName, e.lastName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f' }} noWrap>
                        {e.firstName} {e.lastName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.66rem', color: '#9ca3af' }}>
                        {e.designation || 'Employee'}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.66rem', color: '#9ca3af' }}>
                      {fmtDate(e.completedAt)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </SectionCard>

        <SectionCard
          title="Understaffing Alerts"
          onViewAll={() => navigate('/hrms/shifts')}
        >
          {understaffing.length === 0 ? (
            <EmptyRow text="All shifts adequately staffed." />
          ) : (
            understaffing.map((s, idx) => (
              <Box key={s.shiftType}
                onClick={() => navigate('/hrms/shifts')}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.25, px: 0.5,
                  cursor: 'pointer', '&:hover': { bgcolor: '#f9fafb' },
                  borderBottom: idx < understaffing.length - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#fee2e2', color: '#dc2626' }}>
                    <FacilityIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                      Facility
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {s.shiftType === 'FIRST' ? '1st' : s.shiftType === 'SECOND' ? '2nd' : '3rd'} Shift
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label="Staff Short" size="small"
                    sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600, height: 22, fontSize: '0.7rem' }} />
                  <ArrowOutwardIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                </Box>
              </Box>
            ))
          )}
        </SectionCard>

        <SectionCard
          title="Activity Log"
          onViewAll={() => navigate('/hrms/reports')}
        >
          {(!data.activityLog || data.activityLog.length === 0) ? (
            <EmptyRow text="No recent activity." />
          ) : (
            data.activityLog.slice(0, 5).map((a, idx) => {
              const meta = ACTIVITY_META[a.type] || ACTIVITY_META.NEW_HIRE;
              return (
                <React.Fragment key={`${a.type}-${idx}-${a.timestamp}`}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 1, px: 0.5 }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%',
                      bgcolor: meta.bg, color: meta.color, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.25,
                    }}>
                      {meta.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f' }} noWrap>
                        {meta.label}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }} noWrap>
                        {a.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: '#9ca3af', mt: 0.25 }}>
                        {fmtTimestamp(a.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                  {idx < Math.min(data.activityLog.length, 5) - 1 && <Divider />}
                </React.Fragment>
              );
            })
          )}
        </SectionCard>
      </Box>
    </Box>
  );
};

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  valueIsText?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, valueIsText, icon, iconBg, iconColor, onClick }) => (
  <Paper
    onClick={onClick}
    sx={{
      p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 150ms ease',
      '&:hover': onClick ? { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : {},
    }}
  >
    <Box>
      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: valueIsText ? '1.05rem' : '1.6rem',
        fontWeight: 700, color: '#1e3a5f', lineHeight: 1.1,
      }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: '0.66rem', color: '#9ca3af', mt: 0.5 }}>
          {sub}
        </Typography>
      )}
    </Box>
    <Box sx={{
      width: 40, height: 40, borderRadius: '8px',
      bgcolor: iconBg, color: iconColor, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </Box>
  </Paper>
);

interface SectionCardProps {
  title: string;
  count?: number;
  onViewAll?: () => void;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}
const SectionCard: React.FC<SectionCardProps> = ({ title, count, onViewAll, rightSlot, children }) => (
  <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
    <Box sx={{
      p: 1.75, borderBottom: '1px solid #f3f4f6',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>
          {title}
        </Typography>
        {count !== undefined && count > 0 && (
          <Chip label={String(count).padStart(2, '0')} size="small"
            sx={{ bgcolor: '#eff4fb', color: '#1e3a5f', fontWeight: 600, height: 20, fontSize: '0.68rem' }} />
        )}
      </Box>
      {rightSlot ? rightSlot : (onViewAll && (
        <Button size="small" endIcon={<ArrowIcon sx={{ fontSize: 14 }} />} onClick={onViewAll}
          sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#1e3a5f', fontWeight: 600, p: 0.5 }}>
          View All
        </Button>
      ))}
    </Box>
    <Box sx={{ p: 1.5 }}>{children}</Box>
  </Paper>
);

const EmptyRow: React.FC<{ text: string }> = ({ text }) => (
  <Box sx={{ py: 3, textAlign: 'center' }}>
    <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>{text}</Typography>
  </Box>
);

export default HrAdminDashboardPage;
