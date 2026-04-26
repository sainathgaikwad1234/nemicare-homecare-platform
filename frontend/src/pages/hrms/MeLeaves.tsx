import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, IconButton, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Pagination, Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, InputLabel,
} from '@mui/material';
import {
  FlightTakeoff as FlightIcon, Visibility as ViewIcon, Cancel as CancelIcon,
  Close as CloseIcon, Warning as WarningIcon,
} from '@mui/icons-material';
import { meService } from '../../services/me.service';
import { LeaveRequest, LeaveType, leaveService } from '../../services/leave.service';

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  WAITING: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  APPROVED: { label: 'Approved', bg: '#d1fae5', color: '#065f46' },
  REJECTED: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b' },
};

const tabs: { label: string; status: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' }[] = [
  { label: 'All', status: 'ALL' },
  { label: 'Approved', status: 'APPROVED' },
  { label: 'Pending', status: 'PENDING' },
  { label: 'Rejected', status: 'REJECTED' },
];

export const MeLeavesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [openRequest, setOpenRequest] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  // Sprint 5.4 — info-request response dialog
  const [respondTo, setRespondTo] = useState<LeaveRequest | null>(null);
  const [responseText, setResponseText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, b] = await Promise.all([
        meService.getLeaves(tabs[activeTab].status, page, pageSize),
        meService.getLeaveBalance(),
      ]);
      if (l.success && Array.isArray(l.data)) {
        setLeaves(l.data);
        setTotal(l.pagination?.total || l.data.length);
      } else { setLeaves([]); setTotal(0); }
      if (b.success && b.data) setBalance(b.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlightIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Leaves</Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setOpenRequest(true)}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            Request Leave
          </Button>
        </Box>

        {/* Balance cards */}
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          <BalanceCard label="Annual" value={balance ? Number(balance.annualBalance) : 0} />
          <BalanceCard label="Sick" value={balance ? Number(balance.sickBalance) : 0} />
          <BalanceCard label="Personal" value={balance ? Number(balance.personalBalance) : 0} />
          <BalanceCard label="Unpaid" value={balance ? Number(balance.unpaidBalance) : 0} />
        </Box>

        {/* Sprint 5.4: Pending info-request banner(s) */}
        {leaves.filter(l => l.infoRequestMessage && !l.infoResponseMessage).map((l) => (
          <Box key={`info-${l.id}`} sx={{ mx: 2, mb: 2, p: 1.5, bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 1, display: 'flex', alignItems: 'flex-start', gap: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <WarningIcon sx={{ fontSize: 18, color: '#f59e0b', mt: 0.25 }} />
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#92400e' }}>
                  Supervisor needs more info on your {leaveTypeLabel(l.leaveType)} request ({new Date(l.fromDate).toLocaleDateString()})
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#92400e' }}>{l.infoRequestMessage}</Typography>
              </Box>
            </Box>
            <Button size="small" variant="contained" onClick={() => { setRespondTo(l); setResponseText(''); }}
              sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none' }}>
              Respond
            </Button>
          </Box>
        ))}

        {/* Past Requests */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Past Requests</Typography>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setPage(1); }}
            sx={{
              minHeight: 30,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 28, padding: '4px 12px', fontSize: '0.78rem',
                textTransform: 'none', borderRadius: 999, color: '#6b7280', fontWeight: 500,
                '&.Mui-selected': { bgcolor: '#1e3a5f', color: '#fff', fontWeight: 600 },
              },
            }}
          >
            {tabs.map((t) => <Tab key={t.label} label={t.label} />)}
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : leaves.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography>No leave requests yet.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Request Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Supervisor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>HR</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 80 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((leave) => {
                  const sup = STATUS_STYLES[leave.supervisorApprovalStatus] || STATUS_STYLES.PENDING;
                  const hr = STATUS_STYLES[leave.hrApprovalStatus] || STATUS_STYLES.WAITING;
                  const cancellable = leave.supervisorApprovalStatus === 'PENDING';
                  return (
                    <TableRow key={leave.id} hover>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{leaveTypeLabel(leave.leaveType)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{new Date(leave.fromDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{new Date(leave.toDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {leave.reason || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={sup.label} size="small" sx={{ bgcolor: sup.bg, color: sup.color, fontWeight: 500, height: 22, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={hr.label} size="small" sx={{ bgcolor: hr.bg, color: hr.color, fontWeight: 500, height: 22, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small"><ViewIcon fontSize="small" sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" disabled={!cancellable} sx={{ color: cancellable ? '#ef4444' : '#d1d5db' }}>
                          <CancelIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
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

      <RequestLeaveDialog
        open={openRequest}
        balance={balance}
        onClose={() => setOpenRequest(false)}
        onSuccess={() => {
          setOpenRequest(false);
          setSnackbar({ open: true, message: 'Leave request submitted', severity: 'success' });
          load();
        }}
      />

      {/* Sprint 5.4 — Respond to supervisor's info request */}
      <Dialog open={!!respondTo} onClose={() => setRespondTo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Respond to Supervisor</DialogTitle>
        <DialogContent>
          {respondTo && (
            <>
              <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 1 }}>Question from supervisor:</Typography>
              <Box sx={{ p: 1.5, bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 1, mb: 2 }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#92400e' }}>{respondTo.infoRequestMessage}</Typography>
              </Box>
            </>
          )}
          <TextField
            label="Your response" multiline minRows={3} fullWidth autoFocus
            value={responseText} onChange={(e) => setResponseText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRespondTo(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained"
            onClick={async () => {
              if (!respondTo || !responseText.trim()) return;
              try {
                const res = await leaveService.respondToInfoRequest(respondTo.id, responseText);
                if (!res.success) throw new Error(res.error || 'Failed');
                setSnackbar({ open: true, message: 'Response sent to supervisor', severity: 'success' });
                setRespondTo(null);
                load();
              } catch (e: any) {
                setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
              }
            }}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Send Response
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

const BalanceCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
    <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: '1.6rem', fontWeight: 600, color: '#1e3a5f' }}>{value}</Typography>
  </Paper>
);

const RequestLeaveDialog: React.FC<{
  open: boolean;
  balance?: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, balance, onClose, onSuccess }) => {
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'success' });
  // Sprint 5.4 — live quota check
  const [quota, setQuota] = useState<{ remaining: number; sufficient: boolean } | null>(null);

  useEffect(() => {
    if (!open) {
      setLeaveType(''); setFromDate(''); setToDate(''); setReason(''); setQuota(null);
    }
  }, [open]);

  // Compute days from date range
  const days = (fromDate && toDate && new Date(toDate) >= new Date(fromDate))
    ? Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1
    : 0;

  // Sprint 5.4 — live quota query whenever leaveType + dates change
  useEffect(() => {
    if (!leaveType || days <= 0) { setQuota(null); return; }
    const id = setTimeout(async () => {
      try {
        const r = await leaveService.quota(leaveType, days);
        if (r.success && r.data) setQuota({ remaining: r.data.remaining, sufficient: r.data.sufficient });
      } catch { setQuota(null); }
    }, 300);
    return () => clearTimeout(id);
  }, [leaveType, days]);

  const balanceForType = (type: string): { used: number; total: number; exhausted: boolean } => {
    if (!balance) return { used: 0, total: 0, exhausted: true };
    const totals: Record<string, number> = {
      ANNUAL: Number(balance.annualBalance),
      SICK: Number(balance.sickBalance),
      PERSONAL: Number(balance.personalBalance),
      UNPAID: Number(balance.unpaidBalance),
    };
    const total = totals[type] ?? 0;
    return { used: 0, total, exhausted: total <= 0 };
  };

  const bal = leaveType ? balanceForType(leaveType) : null;

  const handleSubmit = async () => {
    if (!leaveType || !fromDate || !toDate) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setSnackbar({ open: true, message: 'End Date must be on or after Start Date', severity: 'error' });
      return;
    }
    setBusy(true);
    try {
      await meService.submitLeave({ leaveType, fromDate, toDate, reason });
      onSuccess();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Submit failed', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 600 }}>Leave Request</Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Leave Balance + live quota check */}
        {bal && (
          <Paper sx={{ p: 2, mb: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', mb: 0.5 }}>Leave Balance</Typography>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 600 }}>{bal.total}{days > 0 ? ` (requesting ${days} day${days > 1 ? 's' : ''})` : ''}</Typography>
            {/* Sprint 5.4 — live quota gate */}
            {quota && !quota.sufficient && (
              <Box sx={{ mt: 1, p: 1, bgcolor: '#fee2e2', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ fontSize: 16, color: '#991b1b' }} />
                <Typography sx={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 500 }}>
                  Insufficient balance: only {quota.remaining} day{quota.remaining === 1 ? '' : 's'} remaining for this leave type.
                </Typography>
              </Box>
            )}
            {quota && quota.sufficient && days > 0 && (
              <Box sx={{ mt: 1, p: 1, bgcolor: '#d1fae5', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#065f46' }}>
                  ✓ Sufficient balance: {quota.remaining} day{quota.remaining === 1 ? '' : 's'} available.
                </Typography>
              </Box>
            )}
            {bal.exhausted && (
              <Box sx={{ mt: 1, p: 1, bgcolor: '#fff7ed', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                <Typography sx={{ fontSize: '0.8rem', color: '#92400e' }}>
                  Leave balance exhausted. You may proceed with unpaid leave.
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        <FormControl fullWidth size="small" sx={{ mb: 2 }} required>
          <InputLabel>Leave Type</InputLabel>
          <Select label="Leave Type" value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)}>
            <MenuItem value="">Select Leave Type</MenuItem>
            <MenuItem value="ANNUAL">Annual Leave</MenuItem>
            <MenuItem value="SICK">Sick Leave</MenuItem>
            <MenuItem value="PERSONAL">Personal Leave</MenuItem>
            <MenuItem value="UNPAID">Unpaid Leave</MenuItem>
            <MenuItem value="MATERNITY">Maternity Leave</MenuItem>
            <MenuItem value="BEREAVEMENT">Bereavement Leave</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <TextField
            label="Start Date" type="date" size="small" required
            InputLabelProps={{ shrink: true }}
            value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          />
          <TextField
            label="End Date" type="date" size="small" required
            InputLabelProps={{ shrink: true }}
            value={toDate} onChange={(e) => setToDate(e.target.value)}
          />
        </Box>

        <TextField
          label="Reason"
          placeholder="Write your reason here..."
          fullWidth multiline minRows={4}
          value={reason} onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={busy || !leaveType || !fromDate || !toDate || (quota !== null && !quota.sufficient && leaveType !== 'UNPAID')}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
        >
          {busy ? 'Submitting...' : 'Send Request'}
        </Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Dialog>
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

export default MeLeavesPage;
