/**
 * Vitals Tab — Data table + Add Vitals modal
 * Figma: Resident (New)/Resident/Frame 1618877456-3.png (table)
 * Figma: Add Vitals.png, Add Vitals-1.png (add modal)
 * Figma: Converstion-1.png (form fields)
 */

import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Select, MenuItem, IconButton,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';

interface VitalRecord {
  id: number;
  date: string;
  time: string;
  temperature: string;
  bloodPressure: string;
  heartRate: string;
  respirationRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  bloodSugar: string;
  bmi: string;
  addedBy: string;
  notes: string;
}

// Sample data matching Figma table
const sampleVitals: VitalRecord[] = [
  { id: 1, date: '11/17/2026', time: '09:00 AM', temperature: '98.6', bloodPressure: '120/80', heartRate: '72', respirationRate: '16', oxygenSaturation: '98', weight: '160', height: '65', bloodSugar: '110', bmi: '26.6', addedBy: 'Albert Flores', notes: '' },
  { id: 2, date: '11/16/2026', time: '09:00 AM', temperature: '98.4', bloodPressure: '118/78', heartRate: '70', respirationRate: '15', oxygenSaturation: '99', weight: '160', height: '65', bloodSugar: '105', bmi: '26.6', addedBy: 'Albert Flores', notes: '' },
  { id: 3, date: '11/15/2026', time: '09:00 AM', temperature: '99.1', bloodPressure: '125/82', heartRate: '75', respirationRate: '17', oxygenSaturation: '97', weight: '161', height: '65', bloodSugar: '120', bmi: '26.8', addedBy: 'Albert Flores', notes: '' },
  { id: 4, date: '11/14/2026', time: '09:00 AM', temperature: '98.2', bloodPressure: '122/80', heartRate: '68', respirationRate: '16', oxygenSaturation: '98', weight: '160', height: '65', bloodSugar: '115', bmi: '26.6', addedBy: 'Albert Flores', notes: '' },
  { id: 5, date: '11/13/2026', time: '09:00 AM', temperature: '98.8', bloodPressure: '130/85', heartRate: '78', respirationRate: '18', oxygenSaturation: '96', weight: '162', height: '65', bloodSugar: '130', bmi: '27.0', addedBy: 'Albert Flores', notes: '' },
  { id: 6, date: '11/12/2026', time: '09:00 AM', temperature: '63.8', bloodPressure: '119/79', heartRate: '71', respirationRate: '16', oxygenSaturation: '98', weight: '160', height: '65', bloodSugar: '108', bmi: '26.6', addedBy: 'Albert Flores', notes: '' },
  { id: 7, date: '11/11/2026', time: '09:00 AM', temperature: '98.5', bloodPressure: '121/80', heartRate: '73', respirationRate: '16', oxygenSaturation: '98', weight: '160', height: '65', bloodSugar: '112', bmi: '26.6', addedBy: 'Albert Flores', notes: '' },
  { id: 8, date: '11/10/2026', time: '09:00 AM', temperature: '98.7', bloodPressure: '124/81', heartRate: '74', respirationRate: '17', oxygenSaturation: '97', weight: '161', height: '65', bloodSugar: '118', bmi: '26.8', addedBy: 'Albert Flores', notes: '' },
];

const emptyVital = {
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  nextDue: '',
  addedBy: 'Admin',
  temperature: '', bloodPressure: '', heartRate: '', respirationRate: '',
  oxygenSaturation: '', weight: '', height: '', bloodSugar: '', bmi: '',
  notes: '',
};

export const VitalsTab: React.FC<{ residentName?: string }> = ({ residentName }) => {
  const [vitals, setVitals] = useState<VitalRecord[]>(sampleVitals);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyVital);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const rowsPerPage = 10;

  const handleEdit = (r: VitalRecord) => {
    setEditingId(r.id);
    setForm({
      date: r.date, time: r.time, nextDue: '', addedBy: r.addedBy,
      temperature: r.temperature, bloodPressure: r.bloodPressure, heartRate: r.heartRate,
      respirationRate: r.respirationRate, oxygenSaturation: r.oxygenSaturation,
      weight: r.weight, height: r.height, bloodSugar: r.bloodSugar, bmi: r.bmi, notes: r.notes,
    });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setVitals(vitals.map(v => v.id === editingId ? {
        ...v, date: new Date(form.date).toLocaleDateString(), time: form.time,
        temperature: form.temperature || '—', bloodPressure: form.bloodPressure || '—',
        heartRate: form.heartRate || '—', respirationRate: form.respirationRate || '—',
        oxygenSaturation: form.oxygenSaturation || '—', weight: form.weight || '—',
        height: form.height || '—', bloodSugar: form.bloodSugar || '—', bmi: form.bmi || '—',
        addedBy: form.addedBy, notes: form.notes,
      } : v));
    } else {
      const newVital: VitalRecord = {
        id: vitals.length + 1,
        date: new Date(form.date).toLocaleDateString(),
        time: form.time,
        temperature: form.temperature || '—',
        bloodPressure: form.bloodPressure || '—',
        heartRate: form.heartRate || '—',
        respirationRate: form.respirationRate || '—',
        oxygenSaturation: form.oxygenSaturation || '—',
        weight: form.weight || '—',
        height: form.height || '—',
        bloodSugar: form.bloodSugar || '—',
        bmi: form.bmi || '—',
        addedBy: form.addedBy,
        notes: form.notes,
      };
      setVitals([newVital, ...vitals]);
    }
    setForm(emptyVital);
    setEditingId(null);
    setAddOpen(false);
  };

  const filtered = search ? vitals.filter(v => v.date.toLowerCase().includes(search.toLowerCase()) || v.addedBy.toLowerCase().includes(search.toLowerCase())) : vitals;
  const displayed = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <Box>
      {/* Header — Figma: table header with count + Add button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Vitals</Typography>
          <Chip label={vitals.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={() => { setEditingId(null); setForm(emptyVital); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>
            Add Vitals
          </Button>
        </Box>
      </Box>

      {/* Data Table — Figma: Frame 1618877456-3.png */}
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                {['Date', 'Time', 'Temp (°F)', 'BP (mmHg)', 'Heart Rate', 'Resp Rate', 'O₂ Sat (%)', 'Weight', 'Height', 'Blood Sugar', 'BMI', 'Added By', 'Action'].map((col) => (
                  <TableCell key={col} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayed.map((v) => (
                <TableRow key={v.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{v.date}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{v.time}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: parseFloat(v.temperature) > 100 ? '#ef4444' : '#334155', fontWeight: parseFloat(v.temperature) > 100 ? 600 : 400, py: 0.75 }}>{v.temperature}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{v.bloodPressure}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{v.heartRate}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{v.respirationRate}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{v.oxygenSaturation}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{v.weight}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{v.height}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{v.bloodSugar}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{v.bmi}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{v.addedBy}</TableCell>
                  <TableCell><IconButton size="small" onClick={() => handleEdit(v)}><EditIcon sx={{ fontSize: 14, color: '#6b7280' }} /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Rows per page: {rowsPerPage} | {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}</Typography>
          <Pagination count={Math.ceil(filtered.length / rowsPerPage)} page={page} onChange={(_, p) => setPage(p)} size="small" />
        </Box>
      </Paper>

      {/* Add Vitals Modal — Figma: Add Vitals.png + Add Vitals-1.png */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditingId(null); setForm(emptyVital); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          {editingId !== null ? 'Edit' : 'Add'} Vitals - {residentName || 'Resident'}
          <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyVital); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Row 1: Date + Time */}
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date</Typography>
              <TextField fullWidth size="small" type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Time</Typography>
              <TextField fullWidth size="small" type="time" value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
            </Grid>
          </Grid>
          {/* Row 2: Next Due + Added By */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Next Due</Typography>
              <TextField fullWidth size="small" type="date" value={form.nextDue}
                onChange={(e) => setForm({ ...form, nextDue: e.target.value })}
                sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
            </Grid>
            <Grid item xs={6}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Added By</Typography>
              <Select fullWidth size="small" value={form.addedBy} onChange={(e) => setForm({ ...form, addedBy: e.target.value })}
                sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Albert Flores">Albert Flores</MenuItem>
              </Select>
            </Grid>
          </Grid>

          <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 2 }}>
            {/* Vital fields — 2-column layout per Figma */}
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Temperature (°F)</Typography>
                  <Typography sx={{ fontSize: '10px', color: '#3b82f6', cursor: 'pointer' }}>Add Note</Typography>
                </Box>
                <TextField fullWidth size="small" placeholder="Enter Temperature (°F)" value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                  sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Oxygen Saturation (%)</Typography>
                <TextField fullWidth size="small" placeholder="Enter Oxygen Saturation (%)" value={form.oxygenSaturation}
                  onChange={(e) => setForm({ ...form, oxygenSaturation: e.target.value })}
                  sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
              </Grid>
            </Grid>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Blood Pressure (mmHg)</Typography>
                  <Typography sx={{ fontSize: '10px', color: '#3b82f6', cursor: 'pointer' }}>Add Note</Typography>
                </Box>
                <TextField fullWidth size="small" placeholder="Enter Blood Pressure (mmHg)" value={form.bloodPressure}
                  onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })}
                  sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Weight (kg)</Typography>
                <TextField fullWidth size="small" placeholder="Enter Weight (kg)" value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
              </Grid>
            </Grid>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Heart Rate (bpm)</Typography>
                  <Typography sx={{ fontSize: '10px', color: '#3b82f6', cursor: 'pointer' }}>Add Note</Typography>
                </Box>
                <TextField fullWidth size="small" placeholder="Enter Heart Rate (bpm)" value={form.heartRate}
                  onChange={(e) => setForm({ ...form, heartRate: e.target.value })}
                  sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Height (ft/in)</Typography>
                <TextField fullWidth size="small" placeholder="Enter Height (ft/in)" value={form.height}
                  onChange={(e) => setForm({ ...form, height: e.target.value })}
                  sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
              </Grid>
            </Grid>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Respiration Rate (bpm)</Typography>
                <TextField fullWidth size="small" placeholder="Enter Respiration Rate (bpm)" value={form.respirationRate}
                  onChange={(e) => setForm({ ...form, respirationRate: e.target.value })}
                  sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
              </Grid>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>BMI</Typography>
                <TextField fullWidth size="small" placeholder="Enter BMI" value={form.bmi}
                  onChange={(e) => setForm({ ...form, bmi: e.target.value })}
                  sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
              </Grid>
            </Grid>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={6}>
                <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Blood Sugar</Typography>
                <TextField fullWidth size="small" placeholder="Enter Blood Sugar" value={form.bloodSugar}
                  onChange={(e) => setForm({ ...form, bloodSugar: e.target.value })}
                  sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
              </Grid>
            </Grid>
            {/* Comments */}
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Comments</Typography>
            <TextField fullWidth size="small" multiline rows={3} placeholder="-" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              sx={{ '& textarea': { fontSize: '11px' } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyVital); }} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
