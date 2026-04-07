/**
 * Services Tab (ALF only) — Data table + Add Service modal
 * User stories: rows 254-257
 */
import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Select, MenuItem, IconButton,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';

const sampleData = [
  { id: 1, serviceName: 'Physical Therapy', type: 'Therapy', frequency: '3x/week', startDate: '10/01/2026', status: 'Active', provider: 'Dr. Smith' },
  { id: 2, serviceName: 'Occupational Therapy', type: 'Therapy', frequency: '2x/week', startDate: '10/01/2026', status: 'Active', provider: 'Dr. Lee' },
  { id: 3, serviceName: 'Meal Service', type: 'Daily Living', frequency: 'Daily', startDate: '10/01/2026', status: 'Active', provider: 'Kitchen Staff' },
];

export const ServicesTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ serviceName: '', type: '', frequency: '', startDate: '', provider: '', notes: '' });
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const emptyForm = { serviceName: '', type: '', frequency: '', startDate: '', provider: '', notes: '' };

  const handleEdit = (r: typeof sampleData[0]) => {
    setEditingId(r.id);
    setForm({ serviceName: r.serviceName, type: r.type, frequency: r.frequency, startDate: r.startDate, provider: r.provider, notes: '' });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setData(data.map(d => d.id === editingId ? {
        ...d, serviceName: form.serviceName || d.serviceName, type: form.type || d.type,
        frequency: form.frequency || d.frequency, provider: form.provider || d.provider,
        startDate: form.startDate ? new Date(form.startDate).toLocaleDateString() : d.startDate,
      } : d));
    } else {
      setData([{ id: data.length + 1, serviceName: form.serviceName || 'New Service', type: form.type || '—', frequency: form.frequency || '—', startDate: form.startDate ? new Date(form.startDate).toLocaleDateString() : new Date().toLocaleDateString(), status: 'Active', provider: form.provider || 'Admin' }, ...data]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setAddOpen(false);
  };

  const filtered = search ? data.filter(r => r.serviceName.toLowerCase().includes(search.toLowerCase())) : data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Services</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => { setEditingId(null); setForm(emptyForm); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Service</Button>
        </Box>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer><Table size="small">
          <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
            {['Service Name', 'Type', 'Frequency', 'Start Date', 'Status', 'Provider', 'Action'].map(c => (
              <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
            ))}
          </TableRow></TableHead>
          <TableBody>{filtered.map(r => (
            <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
              <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75, fontWeight: 500 }}>{r.serviceName}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.type}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.frequency}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.startDate}</TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: '#d1fae5', color: '#065f46' }} /></TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.provider}</TableCell>
              <TableCell><IconButton size="small" onClick={() => handleEdit(r)}><EditIcon sx={{ fontSize: 14, color: '#6b7280' }} /></IconButton></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>1-{filtered.length} of {filtered.length}</Typography>
          <Pagination count={1} page={1} size="small" />
        </Box>
      </Paper>
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          {editingId !== null ? 'Edit' : 'Add'} Service <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Service Name *</Typography>
          <TextField fullWidth size="small" placeholder="Enter service name" value={form.serviceName} onChange={e => setForm({...form, serviceName: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Type</Typography>
              <Select fullWidth size="small" value={form.type} onChange={e => setForm({...form, type: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Therapy">Therapy</MenuItem><MenuItem value="Daily Living">Daily Living</MenuItem><MenuItem value="Medical">Medical</MenuItem><MenuItem value="Other">Other</MenuItem>
              </Select></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Frequency</Typography>
              <Select fullWidth size="small" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Daily">Daily</MenuItem><MenuItem value="2x/week">2x/week</MenuItem><MenuItem value="3x/week">3x/week</MenuItem><MenuItem value="Weekly">Weekly</MenuItem><MenuItem value="Monthly">Monthly</MenuItem>
              </Select></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Start Date</Typography>
              <TextField fullWidth size="small" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Provider</Typography>
              <TextField fullWidth size="small" placeholder="Enter provider" value={form.provider} onChange={e => setForm({...form, provider: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Notes</Typography>
          <TextField fullWidth size="small" multiline rows={2} placeholder="Type here" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} sx={{ '& textarea': { fontSize: '11px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
