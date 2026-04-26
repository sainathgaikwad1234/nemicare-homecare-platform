import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress, Avatar,
} from '@mui/material';
import {
  TrendingUp as CoverageIcon,
  EventBusy as LeaveIcon,
  SwapHoriz as SwapIcon,
  AccessTime as OtIcon,
  ArrowForward as ArrowIcon,
  Add as AddIcon,
  PersonAdd as AddEmployeeIcon,
  Label as LabelIcon,
  KeyboardArrowDown as ChevronDownIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardService, SupervisorDashboard, WeekShiftCell } from '../../services/dashboard.service';

const initials = (firstName?: string, lastName?: string) =>
  `${(firstName || '?').charAt(0)}${(lastName || '?').charAt(0)}`.toUpperCase();

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}/${d.getFullYear()}`;
};

const SHIFT_LABEL: Record<string, string> = { FIRST: '1st', SECOND: '2nd', THIRD: '3rd' };
// Cells in Figma: pastel bg with thick left-border in shift accent color
const SHIFT_BG: Record<string, string> = { FIRST: '#fff7ed', SECOND: '#d1fae5', THIRD: '#dbeafe' };
const SHIFT_FG: Record<string, string> = { FIRST: '#9a3412', SECOND: '#065f46', THIRD: '#1e40af' };
const SHIFT_BORDER: Record<string, string> = { FIRST: '#f59e0b', SECOND: '#10b981', THIRD: '#3b82f6' };

export const SupervisorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SupervisorDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await dashboardService.supervisor();
      if (r.success && r.data) setData(r.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  const matrix = data.weekShiftMatrix;
  const employees = matrix?.employees || [];
  const days = matrix?.days || [];
  const maxStaffing = Math.max(1, ...data.staffingChart.map((d) => Math.max(d.assigned, d.required)));

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f6fa' }}>
      {/* Quick Links bar */}
      <Paper sx={{
        p: 1, mb: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
        display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap',
      }}>
        <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600, ml: 1, mr: 1 }}>
          Quick Links
        </Typography>
        <QuickLinkChip icon={<AddIcon sx={{ fontSize: 14 }} />} label="New Shift" onClick={() => navigate('/hrms/shifts')} />
        <QuickLinkChip icon={<AddEmployeeIcon sx={{ fontSize: 14 }} />} label="New Employee" onClick={() => navigate('/hrms/onboarding')} />
        <QuickLinkChip icon={<LabelIcon sx={{ fontSize: 14 }} />} label="Approvals" onClick={() => navigate('/hrms/leaves')} />
        <QuickLinkChip icon={<LabelIcon sx={{ fontSize: 14 }} />} label="Timecards" onClick={() => navigate('/hrms/timecards')} />
        <QuickLinkChip icon={<LabelIcon sx={{ fontSize: 14 }} />} label="Reviews" onClick={() => navigate('/hrms/reviews')} />
        <QuickLinkChip icon={<LabelIcon sx={{ fontSize: 14 }} />} label="Reports" onClick={() => navigate('/hrms/reports')} />
      </Paper>

      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 2 }}>
        <KpiCard
          label="Today's Coverage"
          value={`${data.coveragePercent}%`}
          icon={<CoverageIcon />}
          iconBg="#d1fae5"
          iconColor="#10b981"
          trend={data.coveragePercent >= 90 ? '+2%' : undefined}
          trendColor="#10b981"
        />
        <KpiCard
          label="Pending Leave Requests"
          value={data.pendingBreakdown.leaves}
          icon={<LeaveIcon />}
          iconBg="#fef3c7"
          iconColor="#f59e0b"
          onClick={() => navigate('/hrms/leaves')}
        />
        <KpiCard
          label="Shift Swap Requests"
          value={data.pendingBreakdown.shiftChanges}
          icon={<SwapIcon />}
          iconBg="#dbeafe"
          iconColor="#1e40af"
          onClick={() => navigate('/hrms/shift-changes')}
        />
        <KpiCard
          label="Overtime Alerts (This Week)"
          value={String(data.overtimeAlertsThisWeek).padStart(2, '0')}
          icon={<OtIcon />}
          iconBg="#fee2e2"
          iconColor="#dc2626"
          onClick={() => navigate('/hrms/timecards')}
        />
      </Box>

      {/* Main Grid: Shift Calendar (2fr) + Staffing Coverage (1fr) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, mb: 2 }}>
        {/* Employee × Day Shift Calendar */}
        <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>Shift Calendar</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <FilterPill label="ALF" />
              <FilterPill label="Week" />
              <Button size="small" endIcon={<ArrowIcon sx={{ fontSize: 14 }} />}
                onClick={() => navigate('/hrms/shifts')}
                sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#1e3a5f', fontWeight: 600, p: 0.5 }}>
                View All
              </Button>
            </Box>
          </Box>
          {employees.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center', color: '#9ca3af' }}>
              <Typography sx={{ fontSize: '0.85rem' }}>No team members assigned.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              {/* Header row: empty corner + employee avatars */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: `64px repeat(${employees.length}, minmax(120px, 1fr))`,
                borderBottom: '1px solid #f3f4f6',
                bgcolor: '#fafbfc',
              }}>
                <Box sx={{ p: 1 }} />
                {employees.map((emp) => (
                  <Box key={emp.id} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 0.75, borderLeft: '1px solid #f3f4f6' }}>
                    <Avatar src={emp.profilePictureUrl || undefined} sx={{ width: 26, height: 26, fontSize: '0.7rem', bgcolor: '#1e3a5f' }}>
                      {initials(emp.firstName, emp.lastName)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e3a5f' }} noWrap>
                        {emp.firstName} {emp.lastName.charAt(0)}.
                      </Typography>
                      <Typography sx={{ fontSize: '0.62rem', color: '#9ca3af' }} noWrap>
                        {emp.designation || '—'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              {/* Day rows */}
              {days.map((day, dayIdx) => (
                <Box key={day.date}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `64px repeat(${employees.length}, minmax(120px, 1fr))`,
                    borderBottom: dayIdx < days.length - 1 ? '1px solid #f3f4f6' : 'none',
                  }}>
                  <Box sx={{
                    p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    bgcolor: '#fafbfc',
                  }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e3a5f' }}>
                      {day.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.62rem', color: '#9ca3af' }}>
                      {day.weekday}
                    </Typography>
                  </Box>
                  {employees.map((emp) => {
                    const cell = emp.cells[dayIdx];
                    return (
                      <Box key={emp.id}
                        onClick={() => navigate('/hrms/shifts')}
                        sx={{
                          p: 0.75, borderLeft: '1px solid #f3f4f6', minHeight: 60,
                          cursor: 'pointer', '&:hover': { bgcolor: '#f9fafb' },
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        {cell ? <ShiftCell cell={cell} /> : (
                          <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', fontStyle: 'italic' }}>
                            Day Off
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Staffing Coverage chart */}
        <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
          <Box sx={{ p: 1.5, borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>Staffing Coverage</Typography>
            <FilterPill label="ALF" />
          </Box>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <LegendDot color="#3b82f6" label="Required" />
              <LegendDot color="#10b981" label="Assigned" />
              <LegendDot color="#dc2626" label="Surplus" />
            </Box>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${data.staffingChart.length}, 1fr)`,
              gap: 0.5, alignItems: 'end', height: 180,
            }}>
              {data.staffingChart.map((day) => {
                const reqH = (day.required / maxStaffing) * 150;
                const assH = (day.assigned / maxStaffing) * 150;
                const surplus = Math.max(0, day.assigned - day.required);
                const surH = (surplus / maxStaffing) * 150;
                return (
                  <Box key={day.date} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'end', gap: 0.25, height: 150 }}>
                      <Box sx={{ width: 6, height: reqH, bgcolor: '#3b82f6', borderRadius: '2px 2px 0 0' }} />
                      <Box sx={{ width: 6, height: assH, bgcolor: '#10b981', borderRadius: '2px 2px 0 0' }} />
                      {surplus > 0 && (
                        <Box sx={{ width: 6, height: surH, bgcolor: '#dc2626', borderRadius: '2px 2px 0 0' }} />
                      )}
                    </Box>
                    <Typography sx={{ fontSize: '0.65rem', color: '#6b7280' }}>{day.label}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Approval Queue */}
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', overflow: 'hidden' }}>
        <Box sx={{ p: 1.5, borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>Approval Queue</Typography>
            {data.pendingLeaveQueue?.length > 0 && (
              <Chip label={String(data.pendingLeaveQueue.length).padStart(2, '0')} size="small"
                sx={{ bgcolor: '#eff4fb', color: '#1e3a5f', fontWeight: 600, height: 20, fontSize: '0.68rem' }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <FilterPill label="All" />
            <Button size="small" endIcon={<ArrowIcon sx={{ fontSize: 14 }} />}
              onClick={() => navigate('/hrms/leaves')}
              sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#1e3a5f', fontWeight: 600, p: 0.5 }}>
              View All
            </Button>
          </Box>
        </Box>
        <Box sx={{ p: 1.5 }}>
          {(!data.pendingLeaveQueue || data.pendingLeaveQueue.length === 0) ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af' }}>No pending approvals.</Typography>
            </Box>
          ) : (
            data.pendingLeaveQueue.slice(0, 5).map((lr, idx) => (
              <Box key={lr.id} onClick={() => navigate('/hrms/leaves')}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, px: 0.5,
                  cursor: 'pointer', '&:hover': { bgcolor: '#f9fafb' },
                  borderBottom: idx < Math.min(data.pendingLeaveQueue.length, 5) - 1 ? '1px solid #f3f4f6' : 'none',
                }}>
                <Avatar src={lr.employee.profilePictureUrl || undefined} sx={{ width: 36, height: 36, fontSize: '0.78rem', bgcolor: '#1e3a5f' }}>
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
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#6b7280' }} noWrap>
                    Leave Request • {lr.leaveType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Typography>
                  <Chip label="Pending" size="small"
                    sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, height: 20, fontSize: '0.68rem' }} />
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Paper>
    </Box>
  );
};

const ShiftCell: React.FC<{ cell: WeekShiftCell }> = ({ cell }) => (
  <Box sx={{
    bgcolor: SHIFT_BG[cell.shiftType],
    borderLeft: `3px solid ${SHIFT_BORDER[cell.shiftType]}`,
    color: SHIFT_FG[cell.shiftType],
    borderRadius: '4px',
    px: 0.75, py: 0.5,
    width: '100%',
    display: 'flex', flexDirection: 'column', gap: 0.25,
  }}>
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
      {SHIFT_LABEL[cell.shiftType]}
    </Typography>
    <Typography sx={{ fontSize: '0.62rem', color: '#374151', fontWeight: 500 }} noWrap>
      {cell.startTime}–{cell.endTime}
    </Typography>
  </Box>
);

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendColor?: string;
  onClick?: () => void;
}
const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, iconBg, iconColor, trend, trendColor, onClick }) => (
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
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
        <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e3a5f', lineHeight: 1.1 }}>
          {value}
        </Typography>
        {trend && (
          <Chip label={trend} size="small"
            sx={{
              bgcolor: '#d1fae5', color: trendColor || '#065f46',
              fontWeight: 600, height: 18, fontSize: '0.62rem',
            }} />
        )}
      </Box>
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

const QuickLinkChip: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <Button
    onClick={onClick}
    startIcon={icon}
    size="small"
    variant="outlined"
    sx={{
      textTransform: 'none', fontSize: '0.74rem', fontWeight: 500,
      color: '#1e3a5f', borderColor: '#e5e7eb', borderRadius: '6px', px: 1.25, py: 0.25,
      '&:hover': { bgcolor: '#eff4fb', borderColor: '#1e3a5f' },
    }}
  >
    {label}
  </Button>
);

const FilterPill: React.FC<{ label: string }> = ({ label }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 0.5,
    px: 1, py: 0.4, borderRadius: '6px', border: '1px solid #e5e7eb',
    cursor: 'pointer', bgcolor: '#fff',
    '&:hover': { bgcolor: '#f9fafb' },
  }}>
    <Typography sx={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>{label}</Typography>
    <ChevronDownIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
  </Box>
);

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
    <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: '2px' }} />
    <Typography sx={{ fontSize: '0.68rem', color: '#6b7280' }}>{label}</Typography>
  </Box>
);

export default SupervisorDashboardPage;
