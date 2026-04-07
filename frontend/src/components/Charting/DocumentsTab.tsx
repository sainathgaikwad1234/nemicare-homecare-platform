/**
 * Documents Tab (common ADH & ALF) — Figma: Document Management.png
 * User stories: rows 228-231
 */
import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, IconButton,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Description as DocIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';

const sampleData = [
  { id: 1, title: 'Intake Form', type: 'Admission', uploadDate: '10/01/2026', fileSize: '245 KB', status: 'Signed', addedBy: 'Admin' },
  { id: 2, title: 'Contract of Patient', type: 'Contract', uploadDate: '10/01/2026', fileSize: '180 KB', status: 'Signed', addedBy: 'Admin' },
  { id: 3, title: 'HIPAA Authorization', type: 'Consent', uploadDate: '10/02/2026', fileSize: '95 KB', status: 'Pending', addedBy: 'Admin' },
  { id: 4, title: 'Insurance Card Copy', type: 'Insurance', uploadDate: '10/03/2026', fileSize: '320 KB', status: 'Uploaded', addedBy: 'Admin' },
];

export const DocumentsTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: '', notes: '' });
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const emptyForm = { title: '', type: '', notes: '' };

  const handleEdit = (r: typeof sampleData[0]) => {
    setEditingId(r.id);
    setForm({ title: r.title, type: r.type, notes: '' });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setData(data.map(d => d.id === editingId ? {
        ...d, title: form.title || d.title, type: form.type || d.type,
      } : d));
    } else {
      setData([{ id: data.length + 1, title: form.title || 'New Document', type: form.type || '—', uploadDate: new Date().toLocaleDateString(), fileSize: '—', status: 'Uploaded', addedBy: 'Admin' }, ...data]);
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
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Documents</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => { setEditingId(null); setForm(emptyForm); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Document</Button>
        </Box>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer><Table size="small">
          <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
            {['', 'Title', 'Type', 'Upload Date', 'File Size', 'Status', 'Added By', 'Action'].map(c => (
              <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
            ))}
          </TableRow></TableHead>
          <TableBody>{filtered.map(r => (
            <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
              <TableCell sx={{ py: 0.75, width: 30 }}><DocIcon sx={{ fontSize: 16, color: '#6b7280' }} /></TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75, fontWeight: 500 }}>{r.title}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.type}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.uploadDate}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.fileSize}</TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: r.status === 'Signed' ? '#d1fae5' : r.status === 'Pending' ? '#fef3c7' : '#dbeafe', color: r.status === 'Signed' ? '#065f46' : r.status === 'Pending' ? '#92400e' : '#1e40af' }} /></TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.addedBy}</TableCell>
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
          {editingId !== null ? 'Edit' : 'Add'} Document <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Document Title *</Typography>
          <TextField fullWidth size="small" placeholder="Enter title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Document Type</Typography>
          <Select fullWidth size="small" value={form.type} onChange={e => setForm({...form, type: e.target.value})} displayEmpty sx={{ fontSize: '11px', mb: 1.5, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Admission">Admission</MenuItem><MenuItem value="Contract">Contract</MenuItem><MenuItem value="Consent">Consent</MenuItem><MenuItem value="Insurance">Insurance</MenuItem><MenuItem value="Clinical">Clinical</MenuItem><MenuItem value="Other">Other</MenuItem>
          </Select>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Upload File</Typography>
          <Box sx={{ border: '2px dashed #c7d2fe', borderRadius: '8px', py: 3, textAlign: 'center', cursor: 'pointer', mb: 1.5 }}>
            <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>📄 Drop file here, or <span style={{ color: '#4f46e5', textDecoration: 'underline' }}>click to browse</span></Typography>
            <Typography sx={{ fontSize: '10px', color: '#94a3b8', mt: 0.5 }}>PDF, DOCX, JPG, PNG — up to 10MB</Typography>
          </Box>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Notes</Typography>
          <TextField fullWidth size="small" multiline rows={2} placeholder="Optional notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} sx={{ '& textarea': { fontSize: '11px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
