import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Pagination, Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputLabel,
} from '@mui/material';
import { PeopleAlt as PeopleIcon, Warning as WarningIcon, HelpOutline as InfoIcon } from '@mui/icons-material';
import { leaveService, LeaveRequest, CoveragePreview } from '../../services/leave.service';
import { RejectLeaveDialog } from './RejectLeaveDialog';
import { LeaveDetailsDialog } from './LeaveDetailsDialog';

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  APPROVED: { label: 'Approved', bg: '#d1fae5', color: '#065f46' },
  REJECTED: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b' },
};
const HR_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  WAITING: { label: 'Waiting', bg: '#dbeafe', color: '#1e3a5f' },
  PENDING: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  APPROVED: { label: 'Approved', bg: '#d1fae5', color: '#065f46' },
  REJECTED: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b' },
};

const tabs: { label: string; status: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' }[] = [
  { label: 'All', status: 'ALL' },
  { label: 'Approved', status: 'APPROVED' },
  { label: 'Pending', status: 'PENDING' },
  { label: 'Rejected', status: 'REJECTED' },
];

export const LeavesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [rejectTarget, setRejectTarget] = useState<{ leave: LeaveRequest; level: 'supervisor' | 'hr' } | null>(null);
  const [detailTarget, setDetailTarget] = useState<LeaveRequest | null>(null);
  // Sprint 5.4 — coverage modal + Need Info dialog state
  const [coverageTarget, setCoverageTarget] = useState<LeaveRequest | null>(null);
  const [coverage, setCoverage] = useState<CoveragePreview | null>(null);
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [replacementId, setReplacementId] = useState<number | ''>('');
  const [infoTarget, setInfoTarget] = useState<LeaveRequest | null>(null);
  const [infoMessage, setInfoMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveService.list(tabs[activeTab].status, page, pageSize);
      if (res.success && Array.isArray(res.data)) {
        setLeaves(res.data);
        setTotal(res.pagination?.total || res.data.length);
      } else {
        setLeaves([]); setTotal(0);
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (leave: LeaveRequest) => {
    // Sprint 5.4 — supervisor approval routes through coverage modal first
    if (leave.supervisorApprovalStatus === 'PENDING') {
      setCoverageTarget(leave);
      setReplacementId('');
      setCoverageLoading(true);
      try {
        const r = await leaveService.coveragePreview(leave.id);
        if (r.success && r.data) setCoverage(r.data);
      } catch (e: any) {
        setSnackbar({ open: true, message: e.message || 'Coverage check failed', severity: 'error' });
      } finally {
        setCoverageLoading(false);
      }
      return;
    }
    // HR-tier approval: just call hrApprove
    try {
      await leaveService.hrApprove(leave.id);
      setSnackbar({ open: true, message: 'HR approved — leave granted', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Approve failed', severity: 'error' });
    }
  };

  const handleConfirmSupervisorApprove = async () => {
    if (!coverageTarget) return;
    try {
      await leaveService.supervisorApprove(coverageTarget.id, replacementId ? Number(replacementId) : null);
      setSnackbar({ open: true, message: 'Supervisor approval recorded — awaiting HR', severity: 'success' });
      setCoverageTarget(null); setCoverage(null); setReplacementId('');
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Approve failed', severity: 'error' });
    }
  };

  const handleSendInfoRequest = async () => {
    if (!infoTarget || !infoMessage.trim()) return;
    try {
      await leaveService.requestInfo(infoTarget.id, infoMessage);
      setSnackbar({ open: true, message: 'Info request sent to employee', severity: 'success' });
      setInfoTarget(null); setInfoMessage('');
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    }
  };

  const handleReject = (leave: LeaveRequest) => {
    const level = leave.supervisorApprovalStatus === 'PENDING' ? 'supervisor' : 'hr';
    setRejectTarget({ leave, level });
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Leave Requests</Typography>
          </Box>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setPage(1); }}
            sx={{
              minHeight: 32,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 30, padding: '4px 14px', fontSize: '0.8rem',
                textTransform: 'none', borderRadius: 999, color: '#6b7280', fontWeight: 500,
                '&.Mui-selected': { bgcolor: '#1e3a5f', color: '#fff', fontWeight: 600 },
              },
            }}
          >
            {tabs.map((t) => <Tab key={t.label} label={t.label} />)}
          </Tabs>
        </Box>

        {/* Body */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : leaves.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography>No leave requests in this category.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Leave Left</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>HR</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 200 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((leave) => {
                  const emp = leave.employee;
                  const initials = `${emp?.firstName?.[0] || ''}${emp?.lastName?.[0] || ''}`.toUpperCase();
                  const status = leave.status || 'PENDING';
                  const sStyle = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
                  const hrStatus = leave.hrApprovalStatus || 'WAITING';
                  const hrStyle = HR_STYLES[hrStatus];
                  const isPending = status === 'PENDING';
                  const dateRange = leave.fromDate === leave.toDate
                    ? new Date(leave.fromDate).toLocaleDateString()
                    : `${new Date(leave.fromDate).toLocaleDateString()} - ${new Date(leave.toDate).toLocaleDateString()}`;
                  const annual = emp?.leaveBalance?.annualBalance || 12;

                  return (
                    <TableRow key={leave.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={emp?.profilePictureUrl} sx={{ width: 36, height: 36, fontSize: '0.75rem' }}>
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#1e3a5f' }}>
                              {emp?.firstName} {emp?.lastName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{emp?.employeeIdNumber || emp?.id}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{dateRange}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{Number(leave.totalDays)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{Number(leave.totalDays)}/{annual}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{leaveTypeLabel(leave.leaveType)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {leave.reason || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={sStyle.label} size="small" sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 22, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={hrStyle.label} size="small" sx={{ bgcolor: hrStyle.bg, color: hrStyle.color, fontWeight: 500, height: 22, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Button size="small" variant="contained" onClick={() => handleApprove(leave)} sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', fontSize: '0.75rem' }}>
                              Approve
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => handleReject(leave)} sx={{ textTransform: 'none', fontSize: '0.75rem', borderColor: '#d1d5db', color: '#374151' }}>
                              Reject
                            </Button>
                            {leave.supervisorApprovalStatus === 'PENDING' && (
                              <Button size="small" variant="text" startIcon={<InfoIcon fontSize="small" />}
                                onClick={() => { setInfoTarget(leave); setInfoMessage(''); }}
                                sx={{ textTransform: 'none', fontSize: '0.7rem', color: '#92400e' }}>
                                Need Info
                              </Button>
                            )}
                            {leave.infoRequestMessage && !leave.infoResponseMessage && (
                              <Chip label="Info Requested" size="small"
                                sx={{ bgcolor: '#fff7ed', color: '#92400e', fontSize: '0.65rem', height: 18, mt: 0.5 }} />
                            )}
                            {leave.infoResponseMessage && (
                              <Chip label="Info Received" size="small"
                                sx={{ bgcolor: '#d1fae5', color: '#065f46', fontSize: '0.65rem', height: 18, mt: 0.5 }} />
                            )}
                          </Box>
                        ) : (
                          <Button size="small" variant="outlined" onClick={() => setDetailTarget(leave)} sx={{ textTransform: 'none', fontSize: '0.75rem', borderColor: '#d1d5db', color: '#374151' }}>
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {!loading && leaves.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #f3f4f6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>Rows per page:</Typography>
              <FormControl size="small" variant="standard" sx={{ minWidth: 50 }}>
                <Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} sx={{ fontSize: '0.85rem' }}>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                {`${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
              </Typography>
            </Box>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" shape="rounded" />
          </Box>
        )}
      </Paper>

      <RejectLeaveDialog
        open={!!rejectTarget}
        leave={rejectTarget?.leave}
        level={rejectTarget?.level || 'supervisor'}
        onClose={() => setRejectTarget(null)}
        onSuccess={() => { setRejectTarget(null); load(); setSnackbar({ open: true, message: 'Leave request rejected', severity: 'success' }); }}
      />

      <LeaveDetailsDialog
        open={!!detailTarget}
        leave={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      {/* Sprint 5.4 — Coverage Preview modal (shown before supervisor approve) */}
      <Dialog open={!!coverageTarget} onClose={() => { setCoverageTarget(null); setCoverage(null); }} maxWidth="md" fullWidth>
        <DialogTitle>Approve Leave Request — Coverage Check</DialogTitle>
        <DialogContent>
          {coverageTarget && (
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>
              <b>{coverageTarget.employee?.firstName} {coverageTarget.employee?.lastName}</b> is requesting{' '}
              {coverageTarget.fromDate?.slice(0, 10)} → {coverageTarget.toDate?.slice(0, 10)} ({Number(coverageTarget.totalDays)} days).
            </Typography>
          )}
          {coverageTarget?.infoResponseMessage && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#d1fae5', borderRadius: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>Employee response to your info request:</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#065f46' }}>{coverageTarget.infoResponseMessage}</Typography>
            </Box>
          )}
          {coverageLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
          ) : coverage ? (
            <>
              {coverage.undercoverage && (
                <Box sx={{ p: 1.5, bgcolor: '#fee2e2', border: '1px solid #fecaca', borderRadius: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon sx={{ fontSize: 18, color: '#991b1b' }} />
                  <Typography sx={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 500 }}>
                    Approving this leave will leave one or more shifts under-covered. Consider assigning a replacement.
                  </Typography>
                </Box>
              )}
              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>Affected shifts</Typography>
              {coverage.affectedDays.length === 0 ? (
                <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>No shifts assigned during these dates — no coverage impact.</Typography>
              ) : (
                <Table size="small" sx={{ mb: 2 }}>
                  <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Shift</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Currently Scheduled</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>After Leave</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Min Required</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Coverage</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {coverage.affectedDays.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{new Date(d.date).toLocaleDateString()}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{d.shiftType}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{d.currentCount}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{d.remainingIfApproved}</TableCell>
                        <TableCell sx={{ fontSize: '0.85rem' }}>{d.minimum}</TableCell>
                        <TableCell>
                          <Chip label={d.adequate ? 'OK' : 'Short'} size="small"
                            sx={{ bgcolor: d.adequate ? '#d1fae5' : '#fee2e2', color: d.adequate ? '#065f46' : '#991b1b', height: 20, fontSize: '0.7rem' }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <FormControl fullWidth size="small">
                <InputLabel>Optional replacement</InputLabel>
                <Select label="Optional replacement" value={replacementId}
                  onChange={(e) => setReplacementId(e.target.value === '' ? '' : Number(e.target.value))}>
                  <MenuItem value="">No replacement (leave roster as-is)</MenuItem>
                  {coverage.replacementCandidates.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} {c.designation ? `(${c.designation})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCoverageTarget(null); setCoverage(null); }} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmSupervisorApprove}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Approve {replacementId ? '+ Assign Replacement' : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sprint 5.4 — Need Info dialog */}
      <Dialog open={!!infoTarget} onClose={() => setInfoTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Request More Info</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>
            What clarification do you need from {infoTarget?.employee?.firstName}? They'll see this in their portal.
          </Typography>
          <TextField label="Message" multiline minRows={3} fullWidth autoFocus
            value={infoMessage} onChange={(e) => setInfoMessage(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoTarget(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSendInfoRequest}
            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none' }}>
            Send Info Request
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

const leaveTypeLabel = (t: string) => {
  const map: Record<string, string> = {
    ANNUAL: 'Annual Leave', SICK: 'Sick Leave', PERSONAL: 'Personal Leave',
    UNPAID: 'Unpaid Leave', MATERNITY: 'Maternity Leave', BEREAVEMENT: 'Bereavement Leave',
    OTHER: 'Other',
  };
  return map[t] || t;
};

export default LeavesPage;
