/**
 * Attendance Page — ADH Daily Operations
 * Figma: Attendance.png (daily check-in/check-out roster)
 * Figma: Absence.png (mark absent, EDWP form)
 * User stories: rows 118-137
 */

import React, { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip, Button,
  IconButton, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, Grid,
  FormControlLabel, Checkbox, Radio, RadioGroup,
} from '@mui/material';
import {
  CheckCircle as CheckInIcon,
  Cancel as AbsentIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const avatarColors = ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];

const residents = [
  { id: 1, name: 'Devon Lane', initials: 'DL', checkIn: '08:30 AM', checkOut: '03:45 PM', status: 'Present', type: 'Full Day' },
  { id: 2, name: 'Esther Howard', initials: 'EH', checkIn: '09:00 AM', checkOut: '02:00 PM', status: 'Present', type: 'Half Day' },
  { id: 3, name: 'Annette Black', initials: 'AB', checkIn: '08:45 AM', checkOut: '', status: 'Checked In', type: 'Full Day' },
  { id: 4, name: 'Kathryn Murphy', initials: 'KM', checkIn: '', checkOut: '', status: 'Absent', type: 'Illness' },
  { id: 5, name: 'Marvin McKinney', initials: 'MM', checkIn: '09:15 AM', checkOut: '04:00 PM', status: 'Present', type: 'Full Day' },
  { id: 6, name: 'Savannah Nguyen', initials: 'SN', checkIn: '08:30 AM', checkOut: '03:30 PM', status: 'Present', type: 'Full Day' },
  { id: 7, name: 'Ralph Edwards', initials: 'RE', checkIn: '', checkOut: '', status: 'Absent', type: 'Vacation' },
  { id: 8, name: 'Cameron Williamson', initials: 'CW', checkIn: '08:00 AM', checkOut: '04:30 PM', status: 'Present', type: 'Full Day' },
  { id: 9, name: 'Jane Cooper', initials: 'JC', checkIn: '09:30 AM', checkOut: '', status: 'Checked In', type: 'Partial' },
  { id: 10, name: 'Wade Warren', initials: 'WW', checkIn: '08:15 AM', checkOut: '03:00 PM', status: 'Present', type: 'Full Day' },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const today = new Date();
const currentDay = today.getDay(); // 0=Sun, 1=Mon...

const statusColors: Record<string, { bg: string; color: string }> = {
  Present: { bg: '#d1fae5', color: '#065f46' },
  'Checked In': { bg: '#dbeafe', color: '#1e40af' },
  Absent: { bg: '#fee2e2', color: '#991b1b' },
  'Half Day': { bg: '#fef3c7', color: '#92400e' },
};

export const AttendancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [markAbsentOpen, setMarkAbsentOpen] = useState(false);
  const [edwpOpen, setEdwpOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<string>('');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}>Attendance</Typography>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
            sx={{ minHeight: 32, '& .MuiTab-root': { textTransform: 'none', fontSize: '12px', minHeight: 32, py: 0.5 }, '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' } }}>
            <Tab label="Daily" /><Tab label="Weekly" /><Tab label="Monthly" />
          </Tabs>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#e5e7eb', color: '#475569' }}>Download CSV</Button>
          <Button size="small" variant="contained"
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>Mark Attendance</Button>
        </Box>
      </Box>

      {/* Attendance Table — Figma: Attendance.png */}
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase', minWidth: 180 }}>Resident</TableCell>
                {days.map((day, i) => (
                  <TableCell key={day} sx={{ fontSize: '10px', fontWeight: 600, color: i + 1 === currentDay ? '#1e3a5f' : '#6b7280', py: 0.75, textTransform: 'uppercase', textAlign: 'center', bgcolor: i + 1 === currentDay ? '#eff6ff' : undefined }}>
                    {day}
                  </TableCell>
                ))}
                <TableCell sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase', textAlign: 'center' }}>Check-In</TableCell>
                <TableCell sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase', textAlign: 'center' }}>Check-Out</TableCell>
                <TableCell sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase', textAlign: 'center' }}>Status</TableCell>
                <TableCell sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase', textAlign: 'center' }}>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {residents.map((r, idx) => (
                <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                  <TableCell sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '10px', bgcolor: avatarColors[idx % avatarColors.length] }}>{r.initials}</Avatar>
                      <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#334155' }}>{r.name}</Typography>
                    </Box>
                  </TableCell>
                  {days.map((_, i) => (
                    <TableCell key={i} sx={{ py: 0.75, textAlign: 'center' }}>
                      {r.status === 'Absent' ? (
                        <AbsentIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                      ) : (
                        <CheckInIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      )}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75, textAlign: 'center' }}>{r.checkIn || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75, textAlign: 'center' }}>{r.checkOut || '—'}</TableCell>
                  <TableCell sx={{ py: 0.75, textAlign: 'center' }}>
                    <Chip label={r.status} size="small" sx={{ fontSize: '9px', height: 18, ...(statusColors[r.status] || statusColors.Present) }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, textAlign: 'center' }}>{r.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>
            Present: {residents.filter(r => r.status === 'Present' || r.status === 'Checked In').length} |
            Absent: {residents.filter(r => r.status === 'Absent').length} |
            Total: {residents.length}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => setMarkAbsentOpen(true)}
              sx={{ fontSize: '10px', textTransform: 'none', borderColor: '#fecaca', color: '#ef4444' }}>Mark Absent</Button>
            <Button size="small" variant="outlined" onClick={() => setEdwpOpen(true)}
              sx={{ fontSize: '10px', textTransform: 'none', borderColor: '#e5e7eb', color: '#475569' }}>EDWP Form</Button>
          </Box>
        </Box>
      </Paper>

      {/* Mark Absent Dialog — Figma: Absence.png right modal */}
      <Dialog open={markAbsentOpen} onClose={() => setMarkAbsentOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          Mark As Absent
          <IconButton size="small" onClick={() => setMarkAbsentOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '11px', color: '#6b7280', mb: 1.5 }}>Select a resident and provide an absence reason.</Typography>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Resident</Typography>
          <Select fullWidth size="small" value={selectedResident} onChange={(e) => setSelectedResident(e.target.value)}
            displayEmpty sx={{ fontSize: '11px', mb: 1.5, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select Resident</em></MenuItem>
            {residents.map(r => <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>)}
          </Select>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Absence Reason *</Typography>
          <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', mb: 1.5, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select reason</em></MenuItem>
            <MenuItem value="Illness">Illness</MenuItem>
            <MenuItem value="Hospitalization">Hospitalization</MenuItem>
            <MenuItem value="Vacation">Scheduled Vacation</MenuItem>
            <MenuItem value="No-show">No-show</MenuItem>
            <MenuItem value="Family Emergency">Family Emergency</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Notes (Optional)</Typography>
          <TextField fullWidth size="small" multiline rows={2} placeholder="Additional details..." sx={{ '& textarea': { fontSize: '11px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMarkAbsentOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={() => { setMarkAbsentOpen(false); }} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#ef4444' }}>Mark As Absent</Button>
        </DialogActions>
      </Dialog>

      {/* EDWP Form Dialog — Figma: Absence.png left screen */}
      <Dialog open={edwpOpen} onClose={() => setEdwpOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          Absence Form (EDWP)
          <IconButton size="small" onClick={() => setEdwpOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, mb: 1.5 }}>EDWP Notification Form</Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>PA Frequency</Typography>
              <TextField fullWidth size="small" placeholder="5" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Provider T/S</Typography>
              <TextField fullWidth size="small" placeholder="—" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, mb: 1 }}>1. Select reason for sending</Typography>
          <Box sx={{ pl: 1, mb: 2 }}>
            {['Illness', 'Vacation', 'Hospital', 'Personal', 'Emergency', 'Other'].map(reason => (
              <FormControlLabel key={reason} control={<Checkbox size="small" />}
                label={<Typography sx={{ fontSize: '11px' }}>{reason}</Typography>} sx={{ display: 'block', mb: 0.25 }} />
            ))}
          </Box>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, mb: 1 }}>2. Fill</Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>From Date</Typography>
              <TextField fullWidth size="small" type="date" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>To Date</Typography>
              <TextField fullWidth size="small" type="date" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEdwpOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={() => setEdwpOpen(false)} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Send To Case Manager</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
