import React, { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  IconButton, FormControl, InputLabel, Select, MenuItem, Button,
  Checkbox, TextField, Avatar, Chip, Snackbar, Alert,
} from '@mui/material';
import { Close as CloseIcon, Search as SearchIcon, EventNote as ShiftTypeEmptyIcon } from '@mui/icons-material';
import { shiftService, ShiftType } from '../../services/shift.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: any[];
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const BulkAssignDialog: React.FC<Props> = ({ open, onClose, onSuccess, employees }) => {
  const [shiftType, setShiftType] = useState<ShiftType | ''>('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'success' });

  const filteredEmployees = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return employees.filter((e) => `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase().includes(t));
  }, [employees, searchTerm]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const toggleEmployee = (id: number) => {
    const next = new Set(selectedEmployees);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedEmployees(next);
  };

  const toggleDay = (d: number) => {
    const next = new Set(selectedDays);
    if (next.has(d)) next.delete(d); else next.add(d);
    setSelectedDays(next);
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) setSelectedEmployees(new Set());
    else setSelectedEmployees(new Set(filteredEmployees.map((e) => e.id)));
  };

  const handleAssign = async () => {
    if (!shiftType) return setSnackbar({ open: true, message: 'Pick a shift type', severity: 'error' });
    if (selectedEmployees.size === 0) return setSnackbar({ open: true, message: 'Pick at least one employee', severity: 'error' });
    if (selectedDays.size === 0) return setSnackbar({ open: true, message: 'Pick at least one day', severity: 'error' });

    setBusy(true);
    try {
      const dates = Array.from(selectedDays).map((d) => {
        const dd = String(d).padStart(2, '0');
        const mm = String(month + 1).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
      });
      const res = await shiftService.bulkAssign({
        employeeIds: Array.from(selectedEmployees),
        shiftType: shiftType as ShiftType,
        dates,
      });
      if (res.success) {
        onSuccess();
        setSelectedEmployees(new Set()); setSelectedDays(new Set()); setShiftType('');
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
        {/* Shift Type */}
        <FormControl size="small" sx={{ minWidth: 240, mb: 3 }}>
          <InputLabel>Shift Type</InputLabel>
          <Select label="Shift Type" value={shiftType} onChange={(e) => setShiftType(e.target.value as ShiftType)}>
            <MenuItem value="">Select Shift Type</MenuItem>
            <MenuItem value="FIRST">1st (9:00 AM-8:00 PM)</MenuItem>
            <MenuItem value="SECOND">2nd (3:00 PM-12:00 AM)</MenuItem>
            <MenuItem value="THIRD">3rd (12:00 AM-9:00 AM)</MenuItem>
          </Select>
        </FormControl>

        {!shiftType && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, color: '#6b7280' }}>
            <ShiftTypeEmptyIcon sx={{ fontSize: 96, color: '#cbd5e1', mb: 2 }} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a5f' }}>
              Select Shift Type First
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af', mt: 0.5 }}>
              Pick a shift type above to start assigning staff and dates.
            </Typography>
          </Box>
        )}

        {shiftType && <>
        {/* Staff selector */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Select Staff</Typography>
            <Button size="small" sx={{ textTransform: 'none' }} onClick={toggleSelectAll}>
              {selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>
          <TextField
            size="small" fullWidth placeholder="Search staff..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: '#9ca3af', mr: 1, fontSize: 18 }} /> }}
            sx={{ mb: 1 }}
          />
          <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 1, p: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0.5 }}>
            {filteredEmployees.map((e) => (
              <Box
                key={e.id}
                onClick={() => toggleEmployee(e.id)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5, borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: '#f9fafb' } }}
              >
                <Checkbox size="small" checked={selectedEmployees.has(e.id)} sx={{ p: 0.5 }} />
                <Avatar src={e.profilePictureUrl} sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                  {e.firstName?.[0]}{e.lastName?.[0]}
                </Avatar>
                <Typography sx={{ fontSize: '0.8rem' }}>{e.firstName} {e.lastName}</Typography>
              </Box>
            ))}
            {filteredEmployees.length === 0 && (
              <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', gridColumn: '1 / -1', p: 2 }}>No employees match.</Typography>
            )}
          </Box>
          {selectedEmployees.size > 0 && (
            <Chip label={`${selectedEmployees.size} selected`} size="small" sx={{ mt: 1, bgcolor: '#eff4fb', color: '#1e3a5f' }} />
          )}
        </Box>

        {/* Month + Day grid */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 1 }}>Select Month</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {monthNames.map((m, i) => <MenuItem key={m} value={i}>{m}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {[year - 1, year, year + 1, year + 2].map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75 }}>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <Box
                key={d}
                onClick={() => toggleDay(d)}
                sx={{
                  textAlign: 'center', py: 1, fontSize: '0.85rem', fontWeight: 500,
                  border: '1px solid #e5e7eb', borderRadius: 1, cursor: 'pointer',
                  bgcolor: selectedDays.has(d) ? '#1e3a5f' : '#fff',
                  color: selectedDays.has(d) ? '#fff' : '#374151',
                  '&:hover': { bgcolor: selectedDays.has(d) ? '#1a3354' : '#f9fafb' },
                }}
              >
                {String(d).padStart(2, '0')}
              </Box>
            ))}
          </Box>
        </Box>
        </>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={busy}
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

export default BulkAssignDialog;
