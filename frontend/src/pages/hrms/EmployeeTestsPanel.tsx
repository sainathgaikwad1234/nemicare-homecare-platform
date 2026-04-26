import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  Snackbar, Alert, CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  employeeTestService, EmployeeTest, EmployeeTestType, EmployeeTestStatus, TEST_TYPE_LABELS,
} from '../../services/employeeTest.service';

const STATUS_STYLES: Record<EmployeeTestStatus, { bg: string; color: string }> = {
  PENDING: { bg: '#fef3c7', color: '#92400e' },
  PASSED:  { bg: '#d1fae5', color: '#065f46' },
  FAILED:  { bg: '#fee2e2', color: '#991b1b' },
  EXPIRED: { bg: '#fee2e2', color: '#991b1b' },
  WAIVED:  { bg: '#f3f4f6', color: '#6b7280' },
};

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString() : '—';

const daysUntilExpiry = (s: string | null): number | null => {
  if (!s) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(s); exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - today.getTime()) / 86400000);
};

interface Props { employeeId: number; }

export const EmployeeTestsPanel: React.FC<Props> = ({ employeeId }) => {
  const [tests, setTests] = useState<EmployeeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeTest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await employeeTestService.list(employeeId);
      if (r.success && Array.isArray(r.data)) setTests(r.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally { setLoading(false); }
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this test record?')) return;
    try {
      await employeeTestService.remove(employeeId, id);
      setSnackbar({ open: true, message: 'Test deleted', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Delete failed', severity: 'error' });
    }
  };

  return (
    <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
        <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Tests & Health Compliance</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setOpen(true); }}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          Add Test
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
      ) : tests.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', color: '#6b7280' }}>
          <Typography>No tests recorded yet. Click "Add Test" to record one.</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600 }}>Test</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Passed Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Expiry Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Days Until Expiry</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tests.map((t) => {
                const days = daysUntilExpiry(t.expiryDate);
                const expSoon = days !== null && days <= 30 && days >= 0;
                const expired = days !== null && days < 0;
                const sStyle = STATUS_STYLES[t.status];
                return (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {t.testName || TEST_TYPE_LABELS[t.testType] || t.testType}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{fmtDate(t.passedDate)}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{fmtDate(t.expiryDate)}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', color: expired ? '#991b1b' : expSoon ? '#92400e' : '#374151' }}>
                      {days === null ? '—' : expired ? `Expired ${Math.abs(days)}d ago` : `${days}d`}
                    </TableCell>
                    <TableCell>
                      <Chip label={t.status} size="small" sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 20, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.notes || '—'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDelete(t.id)}><DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AddTestDialog
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSave={async (input) => {
          try {
            if (editing) await employeeTestService.update(employeeId, editing.id, input);
            else await employeeTestService.create(employeeId, input);
            setSnackbar({ open: true, message: editing ? 'Test updated' : 'Test added', severity: 'success' });
            setOpen(false);
            load();
          } catch (e: any) {
            setSnackbar({ open: true, message: e.message || 'Save failed', severity: 'error' });
          }
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Paper>
  );
};

const AddTestDialog: React.FC<{
  open: boolean;
  editing: EmployeeTest | null;
  onClose: () => void;
  onSave: (input: Partial<EmployeeTest>) => void;
}> = ({ open, editing, onClose, onSave }) => {
  const [testType, setTestType] = useState<EmployeeTestType>('TB_TEST');
  const [passedDate, setPassedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState<EmployeeTestStatus>('PASSED');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (editing) {
        setTestType(editing.testType);
        setPassedDate(editing.passedDate?.slice(0, 10) || '');
        setExpiryDate(editing.expiryDate?.slice(0, 10) || '');
        setStatus(editing.status);
        setNotes(editing.notes || '');
      } else {
        setTestType('TB_TEST'); setPassedDate(''); setExpiryDate(''); setStatus('PASSED'); setNotes('');
      }
    }
  }, [open, editing]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edit Test' : 'Add Test'}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
          <InputLabel>Test Type</InputLabel>
          <Select label="Test Type" value={testType} onChange={(e) => setTestType(e.target.value as EmployeeTestType)}>
            {Object.entries(TEST_TYPE_LABELS).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <TextField label="Passed Date" type="date" size="small" InputLabelProps={{ shrink: true }}
            value={passedDate} onChange={(e) => setPassedDate(e.target.value)} />
          <TextField label="Expiry Date" type="date" size="small" InputLabelProps={{ shrink: true }}
            value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </Box>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as EmployeeTestStatus)}>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="PASSED">Passed</MenuItem>
            <MenuItem value="FAILED">Failed</MenuItem>
            <MenuItem value="EXPIRED">Expired</MenuItem>
            <MenuItem value="WAIVED">Waived</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Notes" multiline minRows={2} fullWidth size="small"
          value={notes} onChange={(e) => setNotes(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained"
          onClick={() => onSave({ testType, passedDate: passedDate || null, expiryDate: expiryDate || null, status, notes })}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          {editing ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeTestsPanel;
