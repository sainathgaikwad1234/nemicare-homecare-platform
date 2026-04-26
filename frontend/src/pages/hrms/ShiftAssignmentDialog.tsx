import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  IconButton, FormControl, InputLabel, Select, MenuItem, Button, TextField,
  Autocomplete, Snackbar, Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { shiftService, ShiftType } from '../../services/shift.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  employees: any[];
}

export const ShiftAssignmentDialog: React.FC<Props> = ({ open, onClose, onCreated, employees }) => {
  const [shiftType, setShiftType] = useState<ShiftType | ''>('');
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'success' });

  const handleAssign = async () => {
    if (!shiftType || !employeeId || !shiftDate) {
      setSnackbar({ open: true, message: 'All fields are required', severity: 'error' });
      return;
    }
    setBusy(true);
    try {
      const res = await shiftService.create({ employeeId, shiftDate, shiftType });
      if (res.success) {
        onCreated();
        setShiftType(''); setEmployeeId(null);
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>Shift Assignment</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <FormControl size="small" sx={{ minWidth: 240, mb: 3 }}>
          <InputLabel>Shift Type</InputLabel>
          <Select label="Shift Type" value={shiftType} onChange={(e) => setShiftType(e.target.value as ShiftType)}>
            <MenuItem value="">Select Shift Type</MenuItem>
            <MenuItem value="FIRST">1st (9:00 AM-8:00 PM)</MenuItem>
            <MenuItem value="SECOND">2nd (3:00 PM-12:00 AM)</MenuItem>
            <MenuItem value="THIRD">3rd (12:00 AM-9:00 AM)</MenuItem>
          </Select>
        </FormControl>

        {shiftType ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              options={employees}
              getOptionLabel={(o) => `${o.firstName || ''} ${o.lastName || ''} ${o.clinicalRole ? `(${o.clinicalRole})` : ''}`.trim()}
              onChange={(_, val) => setEmployeeId(val?.id ?? null)}
              renderInput={(params) => <TextField {...params} label="Employee" size="small" required />}
            />
            <TextField
              label="Date"
              type="date"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
            />
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6, color: '#9ca3af' }}>
            <Typography sx={{ fontSize: '0.95rem' }}>Select Shift Type First</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={busy || !shiftType || !employeeId}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
        >
          {busy ? 'Assigning...' : 'Assign'}
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

export default ShiftAssignmentDialog;
