import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Tabs, Tab, Pagination,
  Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  Checklist as ChecklistIcon, Check as CheckIcon, Close as CloseIcon,
  Bolt as OtIcon,
} from '@mui/icons-material';
import { timecardService, Timecard, TimecardStatus } from '../../services/phase5.service';

const STATUS_STYLES: Record<TimecardStatus, { label: string; bg: string; color: string }> = {
  DRAFT:     { label: 'Draft',     bg: '#f3f4f6', color: '#6b7280' },
  SUBMITTED: { label: 'Submitted', bg: '#dbeafe', color: '#1e3a5f' },
  APPROVED:  { label: 'Approved',  bg: '#d1fae5', color: '#065f46' },
  REJECTED:  { label: 'Rejected',  bg: '#fee2e2', color: '#991b1b' },
  PAID:      { label: 'Paid',      bg: '#ede9fe', color: '#5b21b6' },
};

const TABS: { label: string; status?: TimecardStatus }[] = [
  { label: 'Pending', status: 'SUBMITTED' },
  { label: 'Approved', status: 'APPROVED' },
  { label: 'Rejected', status: 'REJECTED' },
  { label: 'All' },
];

const fmtDate = (s: string) => new Date(s).toLocaleDateString();
const fmtHours = (h: string | number) => Number(h).toFixed(2);

export const TimecardsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [rows, setRows] = useState<Timecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [rejectTarget, setRejectTarget] = useState<Timecard | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await timecardService.approvalQueue(TABS[activeTab].status, page, pageSize);
      if (res.success && Array.isArray(res.data)) setRows(res.data);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (t: Timecard) => {
    try {
      const res = await timecardService.approve(t.id);
      if (!res.success) throw new Error(res.error || 'Approve failed');
      setSnackbar({ open: true, message: 'Timecard approved', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Approve failed', severity: 'error' });
    }
  };

  const handleApproveOt = async (t: Timecard) => {
    try {
      const res = await timecardService.approveOvertime(t.id);
      if (!res.success) throw new Error(res.error || 'Approve OT failed');
      setSnackbar({ open: true, message: 'Overtime approved at 1.5x rate', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Approve OT failed', severity: 'error' });
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!reason.trim()) {
      setSnackbar({ open: true, message: 'Reason required', severity: 'error' });
      return;
    }
    try {
      const res = await timecardService.reject(rejectTarget.id, reason);
      if (!res.success) throw new Error(res.error || 'Reject failed');
      setSnackbar({ open: true, message: 'Timecard rejected and returned to employee', severity: 'success' });
      setRejectTarget(null);
      setReason('');
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Reject failed', severity: 'error' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChecklistIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Timecard Approvals</Typography>
          </Box>
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
            {TABS.map((t) => <Tab key={t.label} label={t.label} />)}
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography>No timecards in this category.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Regular</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Overtime</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Net Hrs</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Flags</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Task Details</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 200 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((t) => {
                  const sStyle = STATUS_STYLES[t.status];
                  const hasOt = Number(t.overtimeHours) > 0;
                  const otAllowed = t.employee?.overtimeAllowed;
                  const isPending = t.status === 'SUBMITTED';
                  return (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {t.employee ? `${t.employee.firstName} ${t.employee.lastName}` : '—'}
                        {t.employee?.designation && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{t.employee.designation}</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{fmtDate(t.periodStart)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{fmtHours(t.regularHours)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: hasOt ? '#92400e' : 'inherit', fontWeight: hasOt ? 600 : 400 }}>
                        {fmtHours(t.overtimeHours)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{fmtHours(t.netHours)}</TableCell>
                      <TableCell>
                        {(t.flags || []).map((f) => (
                          <Chip key={f} label={f} size="small" sx={{ height: 18, fontSize: '0.65rem', mr: 0.5, bgcolor: '#fff7ed', color: '#92400e' }} />
                        ))}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.taskDetails || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={sStyle.label} size="small" sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 20, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {hasOt && !otAllowed ? (
                              <Button size="small" startIcon={<OtIcon fontSize="small" />}
                                onClick={() => handleApproveOt(t)}
                                sx={{ textTransform: 'none', fontSize: '0.7rem', bgcolor: '#fef3c7', color: '#92400e', '&:hover': { bgcolor: '#fde68a' } }}>
                                Approve OT
                              </Button>
                            ) : (
                              <Button size="small" startIcon={<CheckIcon fontSize="small" />}
                                onClick={() => handleApprove(t)}
                                variant="contained"
                                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontSize: '0.7rem' }}>
                                Approve
                              </Button>
                            )}
                            <Button size="small" startIcon={<CloseIcon fontSize="small" />}
                              onClick={() => setRejectTarget(t)}
                              sx={{ textTransform: 'none', fontSize: '0.7rem', color: '#991b1b' }}>
                              Reject
                            </Button>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                            {t.status === 'REJECTED' && t.rejectionReason}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && rows.length > 0 && (
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

      <Dialog open={!!rejectTarget} onClose={() => { setRejectTarget(null); setReason(''); }} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Timecard</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>
            The timecard will return to {rejectTarget?.employee?.firstName} as DRAFT with this reason. They can edit and resubmit.
          </Typography>
          <TextField
            label="Reason"
            multiline
            minRows={3}
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRejectTarget(null); setReason(''); }} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleReject}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, textTransform: 'none' }}>
            Reject and return
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TimecardsPage;
