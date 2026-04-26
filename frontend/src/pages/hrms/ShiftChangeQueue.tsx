import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Tabs, Tab, Pagination,
  Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  SwapHoriz as SwapIcon, Check as CheckIcon, Close as CloseIcon,
} from '@mui/icons-material';
import { shiftChangeService, ShiftChangeRequestItem, ShiftChangeStatus } from '../../services/phase5.service';

const STATUS_STYLES: Record<ShiftChangeStatus, { bg: string; color: string }> = {
  PENDING:  { bg: '#fef3c7', color: '#92400e' },
  APPROVED: { bg: '#d1fae5', color: '#065f46' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b' },
};

const SHIFT_LABEL: Record<string, string> = { FIRST: '1st Shift', SECOND: '2nd Shift', THIRD: '3rd Shift' };

const TABS: { label: string; status?: ShiftChangeStatus }[] = [
  { label: 'Pending', status: 'PENDING' },
  { label: 'Approved', status: 'APPROVED' },
  { label: 'Rejected', status: 'REJECTED' },
  { label: 'All' },
];

export const ShiftChangeQueuePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [rows, setRows] = useState<ShiftChangeRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [rejectTarget, setRejectTarget] = useState<ShiftChangeRequestItem | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shiftChangeService.approvalQueue(TABS[activeTab].status, page, pageSize);
      if (res.success && Array.isArray(res.data)) setRows(res.data);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (r: ShiftChangeRequestItem) => {
    try {
      const res = await shiftChangeService.approve(r.id);
      if (!res.success) throw new Error(res.error || 'Approve failed');
      setSnackbar({ open: true, message: 'Approved — roster updated and employee notified', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Approve failed', severity: 'error' });
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!reason.trim()) {
      setSnackbar({ open: true, message: 'Reason required', severity: 'error' });
      return;
    }
    try {
      const res = await shiftChangeService.reject(rejectTarget.id, reason);
      if (!res.success) throw new Error(res.error || 'Reject failed');
      setSnackbar({ open: true, message: 'Rejected and employee notified', severity: 'success' });
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
            <SwapIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Shift Change Requests</Typography>
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
            <Typography>No requests in this category.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Original</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Requested</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 200 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => {
                  const sStyle = STATUS_STYLES[r.status];
                  const isPending = r.status === 'PENDING';
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : '—'}
                        {r.employee?.designation && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{r.employee.designation}</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {r.originalShift ? `${new Date(r.originalShift.shiftDate).toLocaleDateString()} ${SHIFT_LABEL[r.originalShift.shiftType] || r.originalShift.shiftType}` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {r.requestedDate ? new Date(r.requestedDate).toLocaleDateString() : '(no date change)'}
                        {r.requestedShiftType ? ` → ${SHIFT_LABEL[r.requestedShiftType] || r.requestedShiftType}` : ''}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.reason}
                      </TableCell>
                      <TableCell>
                        <Chip label={r.status} size="small" sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 20, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Button size="small" startIcon={<CheckIcon fontSize="small" />}
                              variant="contained"
                              onClick={() => handleApprove(r)}
                              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontSize: '0.7rem' }}>
                              Approve
                            </Button>
                            <Button size="small" startIcon={<CloseIcon fontSize="small" />}
                              onClick={() => setRejectTarget(r)}
                              sx={{ textTransform: 'none', fontSize: '0.7rem', color: '#991b1b' }}>
                              Reject
                            </Button>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                            {r.status === 'REJECTED' && r.rejectionReason}
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
        <DialogTitle>Reject Shift Change Request</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>
            {rejectTarget?.employee?.firstName} will be notified with this reason.
          </Typography>
          <TextField label="Reason" multiline minRows={3} fullWidth value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRejectTarget(null); setReason(''); }} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleReject}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, textTransform: 'none' }}>
            Reject
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

export default ShiftChangeQueuePage;
