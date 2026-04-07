/**
 * Tickets Tab (ALF only) — Support/Maintenance tickets
 * User stories: rows 258-261
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
  { id: 'TK-001', title: 'Broken light fixture in room', category: 'Maintenance', priority: 'Medium', status: 'Open', date: '11/15/2026', assignedTo: 'Maintenance Team' },
  { id: 'TK-002', title: 'AC not working properly', category: 'HVAC', priority: 'High', status: 'In Progress', date: '11/14/2026', assignedTo: 'Facility Manager' },
  { id: 'TK-003', title: 'Request extra pillows', category: 'Comfort', priority: 'Low', status: 'Resolved', date: '11/10/2026', assignedTo: 'Nursing Staff' },
];

const priorityColors: Record<string, { bg: string; color: string }> = {
  Low: { bg: '#d1fae5', color: '#065f46' },
  Medium: { bg: '#fef3c7', color: '#92400e' },
  High: { bg: '#fee2e2', color: '#991b1b' },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  Open: { bg: '#dbeafe', color: '#1e40af' },
  'In Progress': { bg: '#fef3c7', color: '#92400e' },
  Resolved: { bg: '#d1fae5', color: '#065f46' },
  Closed: { bg: '#f3f4f6', color: '#6b7280' },
};

export const TicketsTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', priority: '', description: '', assignedTo: '' });
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = { title: '', category: '', priority: '', description: '', assignedTo: '' };

  const handleEdit = (r: typeof sampleData[0]) => {
    setEditingId(r.id);
    setForm({ title: r.title, category: r.category, priority: r.priority, description: '', assignedTo: r.assignedTo });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setData(data.map(d => d.id === editingId ? {
        ...d, title: form.title || d.title, category: form.category || d.category,
        priority: form.priority || d.priority, assignedTo: form.assignedTo || d.assignedTo,
      } : d));
    } else {
      setData([{ id: `TK-${String(data.length + 1).padStart(3, '0')}`, title: form.title || 'New Ticket', category: form.category || '—', priority: form.priority || 'Medium', status: 'Open', date: new Date().toLocaleDateString(), assignedTo: form.assignedTo || 'Unassigned' }, ...data]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setAddOpen(false);
  };

  const filtered = search ? data.filter(r => r.title.toLowerCase().includes(search.toLowerCase())) : data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Tickets</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => { setEditingId(null); setForm(emptyForm); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Ticket</Button>
        </Box>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer><Table size="small">
          <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
            {['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'Date', 'Assigned To', 'Action'].map(c => (
              <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
            ))}
          </TableRow></TableHead>
          <TableBody>{filtered.map(r => (
            <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
              <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.id}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75, fontWeight: 500 }}>{r.title}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.category}</TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.priority} size="small" sx={{ fontSize: '9px', height: 18, ...(priorityColors[r.priority] || priorityColors.Medium) }} /></TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.status} size="small" sx={{ fontSize: '9px', height: 18, ...(statusColors[r.status] || statusColors.Open) }} /></TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.date}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.assignedTo}</TableCell>
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
          {editingId !== null ? 'Edit' : 'Add'} Ticket <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Title *</Typography>
          <TextField fullWidth size="small" placeholder="Enter ticket title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Category</Typography>
              <Select fullWidth size="small" value={form.category} onChange={e => setForm({...form, category: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Maintenance">Maintenance</MenuItem><MenuItem value="HVAC">HVAC</MenuItem><MenuItem value="Plumbing">Plumbing</MenuItem><MenuItem value="Comfort">Comfort</MenuItem><MenuItem value="Safety">Safety</MenuItem>
              </Select></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Priority</Typography>
              <Select fullWidth size="small" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Low">Low</MenuItem><MenuItem value="Medium">Medium</MenuItem><MenuItem value="High">High</MenuItem>
              </Select></Grid>
          </Grid>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Description</Typography>
          <TextField fullWidth size="small" multiline rows={3} placeholder="Describe the issue" value={form.description} onChange={e => setForm({...form, description: e.target.value})} sx={{ '& textarea': { fontSize: '11px' }, mb: 1.5 }} />
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Assigned To</Typography>
          <TextField fullWidth size="small" placeholder="Enter assignee" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
