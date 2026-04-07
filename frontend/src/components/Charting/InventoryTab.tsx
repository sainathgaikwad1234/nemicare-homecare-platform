/**
 * Inventory Tab (ALF only) — Figma: Add Inventory Items.png
 * User stories: rows 262-265
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
  { id: 1, itemName: 'Wheelchair', category: 'Mobility', qty: 1, condition: 'Good', location: 'Room 201', status: 'Active', dateAdded: '10/01/2026' },
  { id: 2, itemName: 'Bedside Table', category: 'Furniture', qty: 1, condition: 'Good', location: 'Room 201', status: 'Active', dateAdded: '10/01/2026' },
  { id: 3, itemName: 'Personal TV', category: 'Electronics', qty: 1, condition: 'Fair', location: 'Room 201', status: 'Active', dateAdded: '10/05/2026' },
];

export const InventoryTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ itemName: '', category: '', qty: '1', condition: '', description: '', location: '', status: '', dateAdded: '' });
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const emptyForm = { itemName: '', category: '', qty: '1', condition: '', description: '', location: '', status: '', dateAdded: '' };

  const handleEdit = (r: typeof sampleData[0]) => {
    setEditingId(r.id);
    setForm({ itemName: r.itemName, category: r.category, qty: String(r.qty), condition: r.condition, description: '', location: r.location, status: r.status, dateAdded: r.dateAdded });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setData(data.map(d => d.id === editingId ? {
        ...d, itemName: form.itemName || d.itemName, category: form.category || d.category,
        qty: parseInt(form.qty) || d.qty, condition: form.condition || d.condition,
        location: form.location || d.location, status: form.status || d.status,
        dateAdded: form.dateAdded ? new Date(form.dateAdded).toLocaleDateString() : d.dateAdded,
      } : d));
    } else {
      setData([{ id: data.length + 1, itemName: form.itemName || 'New Item', category: form.category || '—', qty: parseInt(form.qty) || 1, condition: form.condition || '—', location: form.location || '—', status: form.status || 'Active', dateAdded: form.dateAdded ? new Date(form.dateAdded).toLocaleDateString() : new Date().toLocaleDateString() }, ...data]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setAddOpen(false);
  };

  const filtered = search ? data.filter(r => r.itemName.toLowerCase().includes(search.toLowerCase())) : data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Inventory</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => { setEditingId(null); setForm(emptyForm); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Inventory Item</Button>
        </Box>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer><Table size="small">
          <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
            {['Item Name', 'Category', 'Qty', 'Condition', 'Location', 'Status', 'Date Added', 'Action'].map(c => (
              <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
            ))}
          </TableRow></TableHead>
          <TableBody>{filtered.map(r => (
            <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
              <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75, fontWeight: 500 }}>{r.itemName}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.category}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.qty}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.condition}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.location}</TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: '#d1fae5', color: '#065f46' }} /></TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.dateAdded}</TableCell>
              <TableCell><IconButton size="small" onClick={() => handleEdit(r)}><EditIcon sx={{ fontSize: 14, color: '#6b7280' }} /></IconButton></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>1-{filtered.length} of {filtered.length}</Typography>
          <Pagination count={1} page={1} size="small" />
        </Box>
      </Paper>
      {/* Add Inventory Modal — Figma: Add Inventory Items.png */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          {editingId !== null ? 'Edit' : 'Add'} Inventory Items <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Item Name *</Typography>
          <TextField fullWidth size="small" placeholder="Enter Item Name" value={form.itemName} onChange={e => setForm({...form, itemName: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Category</Typography>
              <Select fullWidth size="small" value={form.category} onChange={e => setForm({...form, category: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select Category</em></MenuItem><MenuItem value="Mobility">Mobility</MenuItem><MenuItem value="Furniture">Furniture</MenuItem><MenuItem value="Electronics">Electronics</MenuItem><MenuItem value="Personal">Personal</MenuItem><MenuItem value="Medical">Medical</MenuItem>
              </Select></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Qty</Typography>
              <TextField fullWidth size="small" type="number" value={form.qty} onChange={e => setForm({...form, qty: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Condition</Typography>
              <Select fullWidth size="small" value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select Condition</em></MenuItem><MenuItem value="New">New</MenuItem><MenuItem value="Good">Good</MenuItem><MenuItem value="Fair">Fair</MenuItem><MenuItem value="Poor">Poor</MenuItem>
              </Select></Grid>
          </Grid>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Description</Typography>
          <TextField fullWidth size="small" multiline rows={3} placeholder="Type here" value={form.description} onChange={e => setForm({...form, description: e.target.value})} sx={{ '& textarea': { fontSize: '11px' }, mb: 1.5 }} />
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Location</Typography>
          <TextField fullWidth size="small" placeholder="Enter Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Current Status</Typography>
              <Select fullWidth size="small" value={form.status} onChange={e => setForm({...form, status: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select Status</em></MenuItem><MenuItem value="Active">Active</MenuItem><MenuItem value="In Storage">In Storage</MenuItem><MenuItem value="Damaged">Damaged</MenuItem>
              </Select></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date Added</Typography>
              <TextField fullWidth size="small" type="date" value={form.dateAdded} onChange={e => setForm({...form, dateAdded: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Related Images</Typography>
          <Box sx={{ border: '2px dashed #c7d2fe', borderRadius: '8px', py: 3, textAlign: 'center', cursor: 'pointer' }}>
            <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>📷 Drop your document here, or <span style={{ color: '#4f46e5', textDecoration: 'underline' }}>click to browse</span></Typography>
            <Typography sx={{ fontSize: '10px', color: '#94a3b8', mt: 0.5 }}>.png, .jpg, up to 5MB</Typography>
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
