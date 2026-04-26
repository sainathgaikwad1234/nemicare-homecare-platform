import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, IconButton, Pagination,
  Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  AccessTime as ClockIcon, Send as SendIcon, Visibility as ViewIcon,
} from '@mui/icons-material';
import { timecardService, Timecard, TimecardStatus } from '../../services/phase5.service';

const STATUS_STYLES: Record<TimecardStatus, { label: string; bg: string; color: string }> = {
  DRAFT:     { label: 'Draft',     bg: '#f3f4f6', color: '#6b7280' },
  SUBMITTED: { label: 'Submitted', bg: '#dbeafe', color: '#1e3a5f' },
  APPROVED:  { label: 'Approved',  bg: '#d1fae5', color: '#065f46' },
  REJECTED:  { label: 'Rejected',  bg: '#fee2e2', color: '#991b1b' },
  PAID:      { label: 'Paid',      bg: '#ede9fe', color: '#5b21b6' },
};

const fmtDate = (s: string) => new Date(s).toLocaleDateString();
const fmtHours = (h: string | number) => Number(h).toFixed(2);

export const MeTimecardsPage: React.FC = () => {
  const [rows, setRows] = useState<Timecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [submitTarget, setSubmitTarget] = useState<Timecard | null>(null);
  const [taskDetails, setTaskDetails] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await timecardService.myList(page, pageSize);
      if (res.success && Array.isArray(res.data)) setRows(res.data);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const openSubmit = (t: Timecard) => {
    setSubmitTarget(t);
    setTaskDetails(t.taskDetails || '');
  };

  const handleSubmit = async () => {
    if (!submitTarget) return;
    if (!taskDetails.trim()) {
      setSnackbar({ open: true, message: 'Task details required', severity: 'error' });
      return;
    }
    try {
      const res = await timecardService.submit(submitTarget.id, taskDetails);
      if (!res.success) throw new Error(res.error || 'Submit failed');
      setSnackbar({ open: true, message: 'Timecard submitted', severity: 'success' });
      setSubmitTarget(null);
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Submit failed', severity: 'error' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid #f3f4f6', gap: 1 }}>
          <ClockIcon sx={{ color: '#1e3a5f' }} />
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>My Timecards</Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography>No timecards yet. Clock in from My Home to start one.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Regular</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Overtime</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Break (min)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Net Hours</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Flags</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Task Details</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((t) => {
                  const sStyle = STATUS_STYLES[t.status];
                  const canSubmit = t.status === 'DRAFT' || t.status === 'REJECTED';
                  return (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{fmtDate(t.periodStart)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{fmtHours(t.regularHours)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{fmtHours(t.overtimeHours)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{t.breakMinutes}</TableCell>
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
                        {t.status === 'REJECTED' && t.rejectionReason && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#991b1b', mt: 0.5 }}>{t.rejectionReason}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {canSubmit ? (
                          <Button size="small" startIcon={<SendIcon fontSize="small" />} variant="contained" onClick={() => openSubmit(t)}
                            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', fontSize: '0.75rem' }}>
                            Submit
                          </Button>
                        ) : (
                          <IconButton size="small" disabled><ViewIcon fontSize="small" /></IconButton>
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

      <Dialog open={!!submitTarget} onClose={() => setSubmitTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Timecard</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>
            Add a brief description of what work you performed during this shift. Required by HR before approval.
          </Typography>
          <TextField
            label="Task details — what work performed"
            multiline
            minRows={4}
            fullWidth
            value={taskDetails}
            onChange={(e) => setTaskDetails(e.target.value)}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitTarget(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Submit for Approval
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

export default MeTimecardsPage;
