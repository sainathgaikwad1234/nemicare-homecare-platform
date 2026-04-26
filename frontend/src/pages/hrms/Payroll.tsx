import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Pagination,
  Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  AttachMoney as PayrollIcon, PlayArrow as RunIcon,
  Send as SendIcon, Download as DownloadIcon,
} from '@mui/icons-material';
import { payrollService, PayrollBatch, PayrollBatchStatus } from '../../services/phase5.service';

const STATUS_STYLES: Record<PayrollBatchStatus, { label: string; bg: string; color: string }> = {
  COMPILING:    { label: 'Compiling',    bg: '#f3f4f6', color: '#6b7280' },
  VALIDATING:   { label: 'Validating',   bg: '#dbeafe', color: '#1e3a5f' },
  EXPORTED:     { label: 'Exported',     bg: '#fef3c7', color: '#92400e' },
  SENT_TO_ADP:  { label: 'Sent to ADP',  bg: '#e0e7ff', color: '#3730a3' },
  COMPLETE:     { label: 'Complete',     bg: '#d1fae5', color: '#065f46' },
  FAILED:       { label: 'Failed',       bg: '#fee2e2', color: '#991b1b' },
};

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (n: string | number) => Number(n).toFixed(2);

export const PayrollPage: React.FC = () => {
  const [batches, setBatches] = useState<PayrollBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [runOpen, setRunOpen] = useState(false);

  const today = new Date();
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const [start, setStart] = useState(ymd(lastWeek));
  const [end, setEnd] = useState(ymd(today));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await payrollService.listBatches(page, pageSize);
      if (res.success && Array.isArray(res.data)) setBatches(res.data);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleRun = async () => {
    try {
      const res = await payrollService.runBatch(start, end);
      if (!res.success) throw new Error(res.error || 'Run failed');
      const b = res.data!;
      if (b.status === 'FAILED') {
        setSnackbar({ open: true, message: `Batch validation failed: ${(b.errors || []).length} error(s)`, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: `Batch ${b.id} created — ${b.totalEmployees} employees, status ${b.status}`, severity: 'success' });
      }
      setRunOpen(false);
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Run failed', severity: 'error' });
    }
  };

  const handleSendAdp = async (b: PayrollBatch) => {
    try {
      const res = await payrollService.sendToAdp(b.id);
      if (!res.success) throw new Error(res.error || 'Send failed');
      setSnackbar({ open: true, message: 'Batch sent to ADP and marked COMPLETE', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Send failed', severity: 'error' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PayrollIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Payroll Batches</Typography>
          </Box>
          <Button variant="contained" startIcon={<RunIcon />} onClick={() => setRunOpen(true)}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Run Payroll
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : batches.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography>No payroll batches yet. Click "Run Payroll" to compile approved timecards.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Batch</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Pay Period</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Run Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Employees</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Regular</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Overtime</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 200 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.map((b) => {
                  const sStyle = STATUS_STYLES[b.status];
                  return (
                    <TableRow key={b.id} hover>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>#{b.id}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {new Date(b.payPeriodStart).toLocaleDateString()} – {new Date(b.payPeriodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{new Date(b.runDate).toLocaleString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{b.totalEmployees}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{fmt(b.totalRegularHours)}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{fmt(b.totalOvertimeHours)}</TableCell>
                      <TableCell>
                        <Chip label={sStyle.label} size="small" sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 20, fontSize: '0.7rem' }} />
                        {b.errors && b.errors.length > 0 && (
                          <Typography sx={{ fontSize: '0.65rem', color: '#991b1b', mt: 0.5 }}>{b.errors.length} validation error(s)</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {b.status === 'EXPORTED' && (
                          <Button size="small" startIcon={<SendIcon fontSize="small" />}
                            variant="contained"
                            onClick={() => handleSendAdp(b)}
                            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', fontSize: '0.7rem' }}>
                            Send to ADP
                          </Button>
                        )}
                        {b.adpExportPath && (
                          <Typography sx={{ fontSize: '0.65rem', color: '#6b7280', mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DownloadIcon sx={{ fontSize: 12 }} />
                            CSV exported
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

        {!loading && batches.length > 0 && (
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

      <Dialog open={runOpen} onClose={() => setRunOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Run Payroll Batch</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>
            Compile all APPROVED timecards in this pay period, validate, generate ADP CSV, and prepare for transfer.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Pay period start" type="date" value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="Pay period end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRunOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleRun}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Run
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

export default PayrollPage;
