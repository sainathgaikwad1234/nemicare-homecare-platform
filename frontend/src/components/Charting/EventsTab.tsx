/**
 * Events Tab (ADH only) — Data table + Add Events modal
 * Figma: Resident (New)/Resident/Frame 1618877456-6.png
 * Figma: Resident (New)/Frame 1984078382-1.png (add form - Note Type, Notes, etc.)
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
  { id: 1, date: '11/17/2026', noteType: 'Event', description: 'Add medication: Kerendia 10mg for proteinuria', addedBy: 'Admin' },
  { id: 2, date: '10/17/2026', noteType: 'Face-to-Face', description: 'Add medication: Crestor 30000 units for indigestion', addedBy: 'Admin' },
  { id: 3, date: '10/17/2026', noteType: 'Event', description: 'Add medication: Kerendia 10mg for proteinuria', addedBy: 'Admin' },
];

export const EventsTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ noteType: 'Event', notes: '', lastSupervisoryDate: '', supervisoryNotes: '', overallParticipation: '', rnInitial: '', rnDate: '' });
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const emptyForm = { noteType: 'Event', notes: '', lastSupervisoryDate: '', supervisoryNotes: '', overallParticipation: '', rnInitial: '', rnDate: '' };

  const handleEdit = (r: typeof sampleData[0]) => {
    setEditingId(r.id);
    setForm({ noteType: r.noteType, notes: r.description, lastSupervisoryDate: '', supervisoryNotes: '', overallParticipation: '', rnInitial: '', rnDate: '' });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setData(data.map(d => d.id === editingId ? { ...d, noteType: form.noteType, description: form.notes || d.description } : d));
    } else {
      setData([{ id: data.length + 1, date: new Date().toLocaleDateString(), noteType: form.noteType, description: form.notes || '—', addedBy: 'Admin' }, ...data]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setAddOpen(false);
  };

  const filtered = search ? data.filter(r => r.description.toLowerCase().includes(search.toLowerCase())) : data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Events</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => { setEditingId(null); setForm(emptyForm); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Events</Button>
        </Box>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
              {['Date', 'Note Type', 'Description', 'Added By', 'Action'].map(c => (
                <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
              ))}
            </TableRow></TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.date}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.noteType}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.description}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.addedBy}</TableCell>
                  <TableCell><IconButton size="small" onClick={() => handleEdit(r)}><EditIcon sx={{ fontSize: 14, color: '#6b7280' }} /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Rows per page: 50 | 1-{filtered.length} of {filtered.length}</Typography>
          <Pagination count={1} page={1} size="small" />
        </Box>
      </Paper>

      {/* Add Events Modal — Figma: Frame 1984078382-1.png */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          {editingId !== null ? 'Edit' : 'Add'} Event <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Note Type</Typography>
          <Select size="small" value={form.noteType} onChange={(e) => setForm({...form, noteType: e.target.value})} sx={{ fontSize: '11px', mb: 2, minWidth: 200, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="Event">Event</MenuItem><MenuItem value="Face-to-Face">Face-to-Face</MenuItem>
          </Select>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Notes</Typography>
          <TextField fullWidth size="small" multiline rows={3} placeholder="Add medication: Kerendia 10mg for proteinuria" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} sx={{ '& textarea': { fontSize: '11px' }, mb: 2 }} />
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Last Supervisory Visited Date</Typography>
          <TextField size="small" type="date" value={form.lastSupervisoryDate} onChange={(e) => setForm({...form, lastSupervisoryDate: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 2, minWidth: 200 }} />
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Supervisory Notes</Typography>
          <TextField fullWidth size="small" multiline rows={2} placeholder="Type here" value={form.supervisoryNotes} onChange={(e) => setForm({...form, supervisoryNotes: e.target.value})} sx={{ '& textarea': { fontSize: '11px' }, mb: 2 }} />
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Overall Participation</Typography>
          <Select size="small" value={form.overallParticipation} onChange={(e) => setForm({...form, overallParticipation: e.target.value})} displayEmpty sx={{ fontSize: '11px', mb: 2, minWidth: 200, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Active">Active</MenuItem><MenuItem value="Passive">Passive</MenuItem>
          </Select>
          <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 2 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, mb: 1 }}>CNA/LPN/RN Approval</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={8}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>RN Initial</Typography>
                <Select fullWidth size="small" value={form.rnInitial} onChange={(e) => setForm({...form, rnInitial: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Guy Hawkins">Guy Hawkins</MenuItem>
                </Select></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Initial Date/Time</Typography>
                <TextField fullWidth size="small" type="date" value={form.rnDate} onChange={(e) => setForm({...form, rnDate: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
