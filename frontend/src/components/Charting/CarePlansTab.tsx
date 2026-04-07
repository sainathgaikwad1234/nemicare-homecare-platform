/**
 * Care Plans Tab (ADH only) — Data table + Add Care Plan modal
 * Figma: Resident (New)/Resident/Frame 1618877456-1.png
 * Figma: Resident (New)/Frame 1984078382.png (add form)
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
  { id: 'TC1434', effectiveDate: '10/25/2026', addedBy: 'Dellwood N...', account: 'Provider medi...', problem: 'Member ver...', startDate: 'Shipping', discharge: 'Loving Hand...', status: 'Active', provider: 'Albert Flores' },
  { id: 'TC1434', effectiveDate: '1/25/2026', addedBy: '1/23/2026', account: 'Provide medi...', problem: 'Member ver...', startDate: 'Shipping', discharge: 'Loving Hand...', status: 'Active', provider: 'Robert Fox' },
  { id: 'TC1434', effectiveDate: '10/25/2026', addedBy: '1/23/2026', account: 'Provide medi...', problem: 'Member has...', startDate: 'Shipping', discharge: 'Loving Hand...', status: 'Active', provider: 'Darlene Robertson' },
];

export const CarePlansTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ effectiveDateFrom: '', effectiveDateTo: '', addedBy: '', problem: '', approach: '', goal: '', targetDate: '', agency: '', agencyDate: '', dischargePlans: '' });
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const emptyForm = { effectiveDateFrom: '', effectiveDateTo: '', addedBy: '', problem: '', approach: '', goal: '', targetDate: '', agency: '', agencyDate: '', dischargePlans: '' };

  const handleEdit = (r: typeof sampleData[0], idx: number) => {
    setEditingId(idx);
    setForm({ effectiveDateFrom: r.effectiveDate, effectiveDateTo: '', addedBy: r.provider, problem: r.problem, approach: r.account, goal: '', targetDate: '', agency: '', agencyDate: '', dischargePlans: r.discharge });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setData(data.map((d, i) => i === editingId ? {
        ...d, effectiveDate: form.effectiveDateFrom || d.effectiveDate, problem: form.problem || d.problem,
        account: form.approach || d.account, provider: form.addedBy || d.provider,
        discharge: form.dischargePlans?.substring(0, 15) || d.discharge,
      } : d));
    } else {
      setData([{ id: `TC${1000 + data.length}`, effectiveDate: form.effectiveDateFrom || '—', addedBy: form.addedBy || 'Admin', account: form.approach || '—', problem: form.problem || '—', startDate: '—', discharge: form.dischargePlans?.substring(0, 15) || '—', status: 'Active', provider: form.addedBy || 'Admin' }, ...data]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setAddOpen(false);
  };

  const filtered = search ? data.filter(r => r.problem.toLowerCase().includes(search.toLowerCase())) : data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Care Plans</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => { setEditingId(null); setForm(emptyForm); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Care Plan</Button>
        </Box>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
              {['ID', 'Effective Date', 'Office Date', 'Account', 'Problem', 'Start', 'Discharge', 'Status', 'Added By', 'Action'].map(c => (
                <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
              ))}
            </TableRow></TableHead>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow key={i} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.id}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.effectiveDate}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.addedBy}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.account}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.problem}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.startDate}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.discharge}</TableCell>
                  <TableCell sx={{ py: 0.75 }}><Chip label={r.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: '#d1fae5', color: '#065f46' }} /></TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.provider}</TableCell>
                  <TableCell><IconButton size="small" onClick={() => handleEdit(r, data.indexOf(r))}><EditIcon sx={{ fontSize: 14, color: '#6b7280' }} /></IconButton></TableCell>
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

      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          {editingId !== null ? 'Edit' : 'Add'} Care Plan <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Effective Date From</Typography>
              <TextField fullWidth size="small" type="date" value={form.effectiveDateFrom} onChange={(e) => setForm({...form, effectiveDateFrom: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Effective Date To</Typography>
              <TextField fullWidth size="small" type="date" value={form.effectiveDateTo} onChange={(e) => setForm({...form, effectiveDateTo: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Added By</Typography>
          <Select fullWidth size="small" value={form.addedBy} onChange={(e) => setForm({...form, addedBy: e.target.value})} displayEmpty sx={{ fontSize: '11px', mb: 2, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Albert Flores">Albert Flores</MenuItem><MenuItem value="Robert Fox">Robert Fox</MenuItem>
          </Select>
          <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 2 }}>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Problem</Typography>
            <TextField fullWidth size="small" placeholder="Deficient knowledge" value={form.problem} onChange={(e) => setForm({...form, problem: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Approach</Typography>
            <TextField fullWidth size="small" placeholder="Provide medication teaching as needed" value={form.approach} onChange={(e) => setForm({...form, approach: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={8}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Goal</Typography>
                <TextField fullWidth size="small" placeholder="Member verbalize understands..." value={form.goal} onChange={(e) => setForm({...form, goal: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Target Date</Typography>
                <TextField fullWidth size="small" type="date" value={form.targetDate} onChange={(e) => setForm({...form, targetDate: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={8}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Agency Providing Service</Typography>
                <Select fullWidth size="small" value={form.agency} onChange={(e) => setForm({...form, agency: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Loving Hands, ADH">Loving Hands, ADH</MenuItem>
                </Select></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date</Typography>
                <TextField fullWidth size="small" type="date" value={form.agencyDate} onChange={(e) => setForm({...form, agencyDate: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Discharge Plans</Typography>
            <TextField fullWidth size="small" multiline rows={3} placeholder="Discharge client when..." value={form.dischargePlans} onChange={(e) => setForm({...form, dischargePlans: e.target.value})} sx={{ '& textarea': { fontSize: '11px' } }} />
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
