import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Snackbar, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  BarChart as ReportsIcon, People as PeopleIcon, ExitToApp as ExitIcon,
  AccessTime as TimeIcon, EventBusy as LeaveIcon, GppGood as ComplianceIcon,
} from '@mui/icons-material';
import {
  reportsService, HeadcountReport, TurnoverReport, AttendanceReport, LeaveUtilizationReport, ComplianceReport,
} from '../../services/phase5b.service';

export const ReportsPage: React.FC = () => {
  const [hc, setHc] = useState<HeadcountReport | null>(null);
  const [tu, setTu] = useState<TurnoverReport | null>(null);
  const [at, setAt] = useState<AttendanceReport | null>(null);
  const [lv, setLv] = useState<LeaveUtilizationReport | null>(null);
  const [cp, setCp] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        reportsService.headcount(),
        reportsService.turnover(),
        reportsService.attendance(),
        reportsService.leaveUtilization(),
        reportsService.compliance(),
      ]);
      if (r1.success && r1.data) setHc(r1.data);
      if (r2.success && r2.data) setTu(r2.data);
      if (r3.success && r3.data) setAt(r3.data);
      if (r4.success && r4.data) setLv(r4.data);
      if (r5.success && r5.data) setCp(r5.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load reports', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ReportsIcon sx={{ color: '#1e3a5f' }} />
        <Typography sx={{ fontWeight: 600, color: '#1e3a5f', fontSize: '1.1rem' }}>HRMS Reports</Typography>
      </Box>

      {/* Top KPI cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, mb: 3 }}>
        <Kpi icon={<PeopleIcon />} label="Active Employees" value={hc?.active ?? 0} sub={`${hc?.total ?? 0} total`} color="#1e3a5f" />
        <Kpi icon={<ExitIcon />} label="Turnover (12mo)" value={`${tu?.turnoverRatePercent ?? 0}%`} sub={`${tu?.exitsInWindow ?? 0} exits`} color="#dc2626" />
        <Kpi icon={<TimeIcon />} label="Hours (30d)" value={at?.totalHours ?? 0} sub={`${at?.overtimeHours ?? 0} OT`} color="#10b981" />
        <Kpi icon={<LeaveIcon />} label="Leave Days Used" value={lv?.approvedDaysThisYear ?? 0} sub={`YTD; ${lv?.requestsThisYear ?? 0} requests`} color="#f59e0b" />
        <Kpi icon={<ComplianceIcon />} label="Compliance Risk" value={(cp?.documents.expired ?? 0) + (cp?.tests.expired ?? 0)} sub="expired items" color={(cp?.documents.expired || cp?.tests.expired) ? '#dc2626' : '#10b981'} />
      </Box>

      {/* Headcount detail */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1 }}>Headcount by Department</Typography>
          <TableContainer><Table size="small"><TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}><TableCell sx={{ fontWeight: 600 }}>Department</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Active</TableCell></TableRow>
          </TableHead><TableBody>
            {(hc?.byDepartment ?? []).map((r) => (
              <TableRow key={r.department}><TableCell>{r.department}</TableCell><TableCell align="right">{r.count}</TableCell></TableRow>
            ))}
          </TableBody></Table></TableContainer>
        </Paper>

        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1 }}>Headcount by Clinical Role</Typography>
          <TableContainer><Table size="small"><TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}><TableCell sx={{ fontWeight: 600 }}>Role</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Active</TableCell></TableRow>
          </TableHead><TableBody>
            {(hc?.byClinicalRole ?? []).map((r) => (
              <TableRow key={r.role}><TableCell>{r.role}</TableCell><TableCell align="right">{r.count}</TableCell></TableRow>
            ))}
          </TableBody></Table></TableContainer>
        </Paper>
      </Box>

      {/* Compliance + Leave detail */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1 }}>Compliance Status</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <Stat label="Documents Expired" value={cp?.documents.expired ?? 0} bad={!!cp?.documents.expired} />
            <Stat label="Documents Expiring 7d" value={cp?.documents.expiringIn7 ?? 0} warn={!!cp?.documents.expiringIn7} />
            <Stat label="Tests Expired" value={cp?.tests.expired ?? 0} bad={!!cp?.tests.expired} />
            <Stat label="Tests Expiring 7d" value={cp?.tests.expiringIn7 ?? 0} warn={!!cp?.tests.expiringIn7} />
            <Stat label="Onboarding In Progress" value={cp?.onboardingInProgress ?? 0} />
            <Stat label="Documents Expiring 30d" value={cp?.documents.expiringIn30 ?? 0} warn={!!cp?.documents.expiringIn30} />
          </Box>
        </Paper>

        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1 }}>Leave Utilization (Year-to-Date)</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <Stat label="Total Requests" value={lv?.requestsThisYear ?? 0} />
            <Stat label="Approved Days" value={lv?.approvedDaysThisYear ?? 0} />
            <Stat label="Pending Approval" value={lv?.byStatus.PENDING ?? 0} />
            <Stat label="Rejected" value={lv?.byStatus.REJECTED ?? 0} />
            <Stat label="Annual Balance Pool" value={lv?.remainingBalances.annual ?? 0} />
            <Stat label="Sick Balance Pool" value={lv?.remainingBalances.sick ?? 0} />
          </Box>
        </Paper>
      </Box>

      {/* Recent exits */}
      <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 1 }}>Recent Exits ({tu?.windowMonths ?? 12} months)</Typography>
        {(tu?.recentExits ?? []).length === 0 ? (
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', py: 1 }}>No exits in this window.</Typography>
        ) : (
          <TableContainer><Table size="small"><TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Completed</TableCell>
            </TableRow>
          </TableHead><TableBody>
            {(tu?.recentExits ?? []).map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.employeeName}</TableCell>
                <TableCell>{e.department || '—'}</TableCell>
                <TableCell>{e.exitType}</TableCell>
                <TableCell>{new Date(e.completedAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table></TableContainer>
        )}
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: any; sub?: string; color: string }> = ({ icon, label, value, sub, color }) => (
  <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color }}>{icon}<Typography sx={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>{label}</Typography></Box>
    <Typography sx={{ fontSize: '1.6rem', fontWeight: 600, color }}>{value}</Typography>
    {sub && <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{sub}</Typography>}
  </Paper>
);

const Stat: React.FC<{ label: string; value: any; bad?: boolean; warn?: boolean }> = ({ label, value, bad, warn }) => (
  <Box>
    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase' }}>{label}</Typography>
    <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: bad ? '#dc2626' : warn ? '#f59e0b' : '#1e3a5f' }}>{value}</Typography>
  </Box>
);

export default ReportsPage;
