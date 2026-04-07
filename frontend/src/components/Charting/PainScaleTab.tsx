/**
 * Pain Scale Tab (ADH only) — Data table + Add Pain Scale modal
 * User stories: rows 292-295
 */
import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Select, MenuItem, IconButton,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';

interface PainRecord {
  id: number;
  date: string;
  time: string;
  painLevel: number;
  location: string;
  description: string;
  intervention: string;
  postScore: number;
  addedBy: string;
}

const painColors = (level: number) => {
  if (level <= 2) return { bg: '#d1fae5', color: '#065f46', label: 'Mild' };
  if (level <= 5) return { bg: '#fef3c7', color: '#92400e', label: 'Moderate' };
  if (level <= 7) return { bg: '#fee2e2', color: '#991b1b', label: 'Severe' };
  return { bg: '#7f1d1d', color: '#fff', label: 'Very Severe' };
};

const sampleData: PainRecord[] = [
  { id: 1, date: '11/17/2026', time: '09:00 AM', painLevel: 3, location: 'Lower Back', description: 'Dull ache when sitting', intervention: 'Repositioned, ice pack', postScore: 1, addedBy: 'Albert Flores' },
  { id: 2, date: '11/16/2026', time: '02:00 PM', painLevel: 5, location: 'Right Knee', description: 'Sharp pain during physical therapy', intervention: 'Rest, elevation, medication', postScore: 2, addedBy: 'Albert Flores' },
  { id: 3, date: '11/15/2026', time: '08:00 AM', painLevel: 0, location: 'N/A', description: 'No pain reported', intervention: 'None needed', postScore: 0, addedBy: 'Robert Fox' },
  { id: 4, date: '11/14/2026', time: '10:30 AM', painLevel: 2, location: 'Head', description: 'Mild headache', intervention: 'Acetaminophen administered', postScore: 0, addedBy: 'Albert Flores' },
];

export const PainScaleTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ date: '', time: '', painLevel: '0', location: '', description: '', intervention: '', postScore: '0' });

  const handleSave = () => {
    if (editingId) {
      setData(data.map(d => d.id === editingId ? { ...d, date: form.date ? new Date(form.date).toLocaleDateString() : d.date, painLevel: parseInt(form.painLevel), location: form.location || d.location, description: form.description || d.description, intervention: form.intervention || d.intervention, postScore: parseInt(form.postScore) } : d));
    } else {
      setData([{ id: data.length + 1, date: form.date ? new Date(form.date).toLocaleDateString() : new Date().toLocaleDateString(), time: form.time || '09:00 AM', painLevel: parseInt(form.painLevel) || 0, location: form.location || '—', description: form.description || '—', intervention: form.intervention || '—', postScore: parseInt(form.postScore) || 0, addedBy: 'Admin' }, ...data]);
    }
    setForm({ date: '', time: '', painLevel: '0', location: '', description: '', intervention: '', postScore: '0' });
    setEditingId(null);
    setAddOpen(false);
  };

  const handleEdit = (r: PainRecord) => {
    setEditingId(r.id);
    setForm({ date: '', time: r.time, painLevel: String(r.painLevel), location: r.location, description: r.description, intervention: r.intervention, postScore: String(r.postScore) });
    setAddOpen(true);
  };

  const filtered = search ? data.filter(d => d.location.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase())) : data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Pain Scale</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={() => { setEditingId(null); setForm({ date: '', time: '', painLevel: '0', location: '', description: '', intervention: '', postScore: '0' }); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Pain Scale</Button>
        </Box>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer><Table size="small">
          <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
            {['Date', 'Time', 'Pain Level', 'Location', 'Description', 'Intervention', 'Post Score', 'Added By', 'Action'].map(c => (
              <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
            ))}
          </TableRow></TableHead>
          <TableBody>{filtered.map(r => {
            const pc = painColors(r.painLevel);
            return (
              <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.date}</TableCell>
                <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.time}</TableCell>
                <TableCell sx={{ py: 0.75 }}>
                  <Chip label={`${r.painLevel}/10 - ${pc.label}`} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: pc.bg, color: pc.color }} />
                </TableCell>
                <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.location}</TableCell>
                <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</TableCell>
                <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.intervention}</TableCell>
                <TableCell sx={{ py: 0.75 }}><Chip label={`${r.postScore}/10`} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: painColors(r.postScore).bg, color: painColors(r.postScore).color }} /></TableCell>
                <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.addedBy}</TableCell>
                <TableCell sx={{ py: 0.75 }}><IconButton size="small" onClick={() => handleEdit(r)}><EditIcon sx={{ fontSize: 14, color: '#6b7280' }} /></IconButton></TableCell>
              </TableRow>
            );
          })}</TableBody>
        </Table></TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>1-{filtered.length} of {filtered.length}</Typography>
          <Pagination count={1} page={1} size="small" />
        </Box>
      </Paper>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          {editingId ? 'Edit' : 'Add'} Pain Scale <IconButton size="small" onClick={() => setAddOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date</Typography>
              <TextField fullWidth size="small" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Time</Typography>
              <TextField fullWidth size="small" type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Pain Level (0-10) *</Typography>
              <Select fullWidth size="small" value={form.painLevel} onChange={e => setForm({...form, painLevel: e.target.value})} sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => <MenuItem key={n} value={String(n)}>{n} - {painColors(n).label}</MenuItem>)}
              </Select></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Location *</Typography>
              <TextField fullWidth size="small" placeholder="e.g., Lower Back" value={form.location} onChange={e => setForm({...form, location: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Description</Typography>
          <TextField fullWidth size="small" multiline rows={2} placeholder="Describe the pain" value={form.description} onChange={e => setForm({...form, description: e.target.value})} sx={{ '& textarea': { fontSize: '11px' }, mb: 1.5 }} />
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Intervention / Action Taken</Typography>
          <TextField fullWidth size="small" multiline rows={2} placeholder="What was done to address the pain" value={form.intervention} onChange={e => setForm({...form, intervention: e.target.value})} sx={{ '& textarea': { fontSize: '11px' }, mb: 1.5 }} />
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Post-Intervention Score (0-10)</Typography>
          <Select size="small" value={form.postScore} onChange={e => setForm({...form, postScore: e.target.value})} sx={{ fontSize: '11px', minWidth: 150, '& .MuiSelect-select': { py: 0.5 } }}>
            {[0,1,2,3,4,5,6,7,8,9,10].map(n => <MenuItem key={n} value={String(n)}>{n}</MenuItem>)}
          </Select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
