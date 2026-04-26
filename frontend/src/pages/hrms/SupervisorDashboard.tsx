import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, CircularProgress, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Dashboard as DashboardIcon, AssignmentLate as PendingIcon,
  StarBorder as ReviewIcon, Groups as TeamIcon,
  ArrowForward as ArrowIcon, Warning as WarningIcon,
  TrendingUp as CoverageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardService, SupervisorDashboard } from '../../services/dashboard.service';

const SHIFT_LABEL: Record<string, string> = { FIRST: '1st Shift', SECOND: '2nd Shift', THIRD: '3rd Shift' };
const SHIFT_BG: Record<string, string> = { FIRST: '#fff7ed', SECOND: '#d1fae5', THIRD: '#dbeafe' };
const SHIFT_BAR: Record<string, string> = { FIRST: '#f59e0b', SECOND: '#10b981', THIRD: '#3b82f6' };

const initials = (firstName?: string, lastName?: string) =>
  `${(firstName || '?').charAt(0)}${(lastName || '?').charAt(0)}`.toUpperCase();

export const SupervisorDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SupervisorDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await dashboardService.supervisor();
      if (r.success && r.data) setData(r.data);
    } catch (e: any) {
      console.error('Dashboard load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  const maxStaffing = Math.max(
    1,
    ...data.staffingChart.map((d) => Math.max(d.assigned, d.required)),
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <DashboardIcon sx={{ color: '#1e3a5f' }} />
        <Typography sx={{ fontWeight: 600, color: '#1e3a5f', fontSize: '1.1rem' }}>
          Supervisor Dashboard{data.supervisor ? ` — ${data.supervisor.name}` : ''}
        </Typography>
      </Box>

      {/* Quick Links action bar */}
      <Paper sx={{ p: 1.5, mb: 2.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/leaves')} sx={{ textTransform: 'none' }}>
          Approve Leaves
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/timecards')} sx={{ textTransform: 'none' }}>
          Approve Timecards
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/shift-changes')} sx={{ textTransform: 'none' }}>
          Shift Changes
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/shifts')} sx={{ textTransform: 'none' }}>
          Shift Calendar
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/reviews')} sx={{ textTransform: 'none' }}>
          My Reviews
        </Button>
        <Button size="small" variant="outlined" onClick={() => navigate('/hrms/notices')} sx={{ textTransform: 'none' }}>
          Notice Board
        </Button>
      </Paper>

      {/* 4-KPI bar including Today's Coverage % */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        <Kpi icon={<PendingIcon />} label="Pending Approvals" value={data.kpis.pendingApprovals}
          sub="Leaves + Timecards + Shift Changes" color={data.kpis.pendingApprovals > 0 ? '#f59e0b' : '#10b981'} />
        <Kpi icon={<ReviewIcon />} label="Reviews to Complete" value={data.kpis.myReviewsToComplete}
          sub="Drafts assigned to me" color={data.kpis.myReviewsToComplete > 0 ? '#1e3a5f' : '#10b981'} />
        <Kpi icon={<TeamIcon />} label="Direct Reports" value={data.kpis.directReports}
          sub="Active employees on my team" color="#1e3a5f" />
        <Kpi icon={<CoverageIcon />} label="Today's Coverage" value={`${data.coveragePercent}%`}
          sub={`OT this week: ${data.overtimeAlertsThisWeek}`} color={data.coveragePercent >= 100 ? '#10b981' : data.coveragePercent >= 80 ? '#f59e0b' : '#dc2626'} />
      </Box>

      {/* 7-day Staffing Coverage chart */}
      <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Staffing Coverage — Next 7 Days</Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, bgcolor: '#10b981', borderRadius: 0.5 }} />
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>Assigned</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, bgcolor: '#cbd5e1', borderRadius: 0.5 }} />
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>Required</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${data.staffingChart.length}, 1fr)`, gap: 1, alignItems: 'end', height: 160 }}>
          {data.staffingChart.map((day) => {
            const assignedHeight = (day.assigned / maxStaffing) * 120;
            const requiredHeight = (day.required / maxStaffing) * 120;
            const meetsRequired = day.assigned >= day.required;
            return (
              <Box key={day.date} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'end', gap: 0.5, height: 120 }}>
                  <Box sx={{
                    width: 14,
                    height: assignedHeight,
                    bgcolor: meetsRequired ? '#10b981' : '#dc2626',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.3s',
                  }} title={`Assigned: ${day.assigned}`} />
                  <Box sx={{
                    width: 14,
                    height: requiredHeight,
                    bgcolor: '#cbd5e1',
                    borderRadius: '2px 2px 0 0',
                  }} title={`Required: ${day.required}`} />
                </Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#1e3a5f' }}>{day.label}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: '#6b7280' }}>{day.assigned}/{day.required}</Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Pending breakdown + Today's coverage */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>Pending Approvals</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
            <PendingTile label="Leaves (Level 1)" count={data.pendingBreakdown.leaves} onClick={() => navigate('/hrms/leaves')} />
            <PendingTile label="Timecards" count={data.pendingBreakdown.timecards} onClick={() => navigate('/hrms/timecards')} />
            <PendingTile label="Shift Changes" count={data.pendingBreakdown.shiftChanges} onClick={() => navigate('/hrms/shift-changes')} />
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

      {/* Named-employee Leave Approval Queue */}
      <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Leave Approval Queue (Level 1)</Typography>
          <Button size="small" endIcon={<ArrowIcon fontSize="small" />} onClick={() => navigate('/hrms/leaves')}
            sx={{ textTransform: 'none', fontSize: '0.75rem' }}>View all</Button>
        </Box>
        {(!data.pendingLeaveQueue || data.pendingLeaveQueue.length === 0) ? (
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>No pending leaves at supervisor level.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {data.pendingLeaveQueue.map((lr) => (
              <Box key={lr.id} onClick={() => navigate('/hrms/leaves')}
                sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f5f6fa' } }}>
                <Avatar src={lr.employee.profilePictureUrl || undefined} sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#1e3a5f' }}>
                  {initials(lr.employee.firstName, lr.employee.lastName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e3a5f' }} noWrap>
                    {lr.employee.firstName} {lr.employee.lastName}
                    {lr.employee.designation && (
                      <Typography component="span" sx={{ fontSize: '0.7rem', color: '#6b7280', ml: 1 }}>
                        ({lr.employee.designation})
                      </Typography>
                    )}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }} noWrap>
                    {lr.leaveType} • {lr.numberOfDays}d • {new Date(lr.fromDate).toLocaleDateString()} → {new Date(lr.toDate).toLocaleDateString()}
                    {lr.reason && ` — ${lr.reason}`}
                  </Typography>
                </Box>
                <Chip label="L1 PENDING" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#fef3c7', color: '#92400e' }} />
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Today's roster */}
      <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Today's Roster</Typography>
          <Button size="small" endIcon={<ArrowIcon fontSize="small" />} onClick={() => navigate('/hrms/shifts')}
            sx={{ textTransform: 'none', fontSize: '0.75rem' }}>Full calendar</Button>
        </Box>
        {data.todayRoster.length === 0 ? (
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', py: 2, textAlign: 'center' }}>No shifts scheduled today.</Typography>
        ) : (
          <TableContainer><Table size="small"><TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
            </TableRow>
          </TableHead><TableBody>
            {data.todayRoster.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell>
                  <Chip label={SHIFT_LABEL[r.shiftType] || r.shiftType} size="small"
                    sx={{ bgcolor: SHIFT_BG[r.shiftType], color: SHIFT_BAR[r.shiftType], height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>{r.startTime} – {r.endTime}</TableCell>
                <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{r.employee}</TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>{r.designation || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table></TableContainer>
        )}
      </Paper>

      {/* Tomorrow coverage + Recent notices */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
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

export default SupervisorDashboardPage;
