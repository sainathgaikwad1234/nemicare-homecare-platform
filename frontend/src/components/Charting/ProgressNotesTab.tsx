/**
 * Progress Notes Tab — Data table + Add Progress Note modal
 * Figma: Resident (New)/Resident/Frame 1618877456-7.png
 * Figma: Resident (New)/Frame 1984078324.png (Monthly Progress Notes form)
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
  { id: 1, date: '11/17/2026', staffName: 'N/A', ordinaryFindings: 'No Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
  { id: 2, date: '11/16/2026', staffName: 'N/A', ordinaryFindings: 'No Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
  { id: 3, date: '11/15/2026', staffName: 'N/A', ordinaryFindings: 'No Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
  { id: 4, date: '11/14/2026', staffName: 'N/A', ordinaryFindings: 'No Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
  { id: 5, date: '11/13/2026', staffName: 'N/A', ordinaryFindings: 'No Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
  { id: 6, date: '10/8/2026', staffName: 'N/A', ordinaryFindings: 'No Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
  { id: 7, date: '9/3/2026', staffName: 'N/A', ordinaryFindings: 'No Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
  { id: 8, date: '8/3/2026', staffName: 'N/A', ordinaryFindings: 'No Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
  { id: 9, date: '7/5/2026', staffName: 'N/A', ordinaryFindings: 'No Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
  { id: 10, date: '6/12/2026', staffName: 'Initial', ordinaryFindings: 'RI Changes', interventions: 'RI team pain', level: 'HOH', status: 'Completed', addedBy: 'Admin' },
];

export const ProgressNotesTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    dateCreated: '', nextDueDate: '', memberName: '', dob: '',
    faceToFace: 'Initial', carePlanChange: 'No', medicationChange: '', hospitalization: '',
    appetite: 'Good', speech: 'Normal', judgement: 'Good', mood: 'Calm', gait: 'Normal', understanding: 'Good',
  });

  const emptyForm = {
    dateCreated: '', nextDueDate: '', memberName: '', dob: '',
    faceToFace: 'Initial', carePlanChange: 'No', medicationChange: '', hospitalization: '',
    appetite: 'Good', speech: 'Normal', judgement: 'Good', mood: 'Calm', gait: 'Normal', understanding: 'Good',
  };

  const handleEdit = (r: typeof sampleData[0]) => {
    setEditingId(r.id);
    setForm({ ...emptyForm, dateCreated: r.date, faceToFace: r.staffName, medicationChange: r.interventions, carePlanChange: r.ordinaryFindings === 'No Changes' ? 'No' : 'Yes' });
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setData(data.map(d => d.id === editingId ? {
        ...d, date: form.dateCreated || d.date, staffName: form.faceToFace,
        ordinaryFindings: form.carePlanChange === 'No' ? 'No Changes' : 'Changes',
        interventions: form.medicationChange || d.interventions,
      } : d));
    } else {
      setData([{ id: data.length + 1, date: form.dateCreated || new Date().toLocaleDateString(), staffName: form.faceToFace, ordinaryFindings: form.carePlanChange === 'No' ? 'No Changes' : 'Changes', interventions: form.medicationChange || '—', level: 'HOH', status: 'Completed', addedBy: 'Admin' }, ...data]);
    }
    setForm(emptyForm);
    setEditingId(null);
    setAddOpen(false);
  };

  const filtered = search ? data.filter(r => r.ordinaryFindings.toLowerCase().includes(search.toLowerCase()) || r.date.toLowerCase().includes(search.toLowerCase())) : data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Progress Notes</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => { setEditingId(null); setForm(emptyForm); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Progress Note</Button>
        </Box>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
              {['Date', 'Staff Name', 'Ordinary Findings', 'Interventions/Actions', 'Level', 'Status', 'Added By', 'Action'].map(c => (
                <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
              ))}
            </TableRow></TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.date}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.staffName}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.ordinaryFindings}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.interventions}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.level}</TableCell>
                  <TableCell sx={{ py: 0.75 }}><Chip label={r.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: '#d1fae5', color: '#065f46' }} /></TableCell>
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

      {/* Add Progress Note — Figma: Frame 1984078324.png (Monthly Progress Notes) */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '8px', maxHeight: '90vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          {editingId !== null ? 'Edit' : 'Add'} Monthly Progress Notes <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date Created</Typography>
              <TextField fullWidth size="small" type="date" value={form.dateCreated} onChange={(e) => setForm({...form, dateCreated: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Next Due Date</Typography>
              <TextField fullWidth size="small" type="date" value={form.nextDueDate} onChange={(e) => setForm({...form, nextDueDate: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={8}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Member Name</Typography>
              <TextField fullWidth size="small" placeholder="Devon Lane" value={form.memberName} onChange={(e) => setForm({...form, memberName: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>DOB</Typography>
              <TextField fullWidth size="small" type="date" value={form.dob} onChange={(e) => setForm({...form, dob: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Face To Face</Typography>
              <Select fullWidth size="small" value={form.faceToFace} onChange={(e) => setForm({...form, faceToFace: e.target.value})} sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="Initial">Initial</MenuItem><MenuItem value="Follow-up">Follow-up</MenuItem>
              </Select></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Care Plan Change</Typography>
              <Select fullWidth size="small" value={form.carePlanChange} onChange={(e) => setForm({...form, carePlanChange: e.target.value})} sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="No">No</MenuItem><MenuItem value="Yes">Yes</MenuItem>
              </Select></Grid>
          </Grid>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Medication Change</Typography>
          <TextField fullWidth size="small" placeholder="Enter Medication Change" value={form.medicationChange} onChange={(e) => setForm({...form, medicationChange: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Hospitalization/Fall</Typography>
          <TextField fullWidth size="small" placeholder="Enter Hospitalization/Fall" value={form.hospitalization} onChange={(e) => setForm({...form, hospitalization: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 2 }} />

          {/* Clinical Assessment Dropdowns — per Figma */}
          <Grid container spacing={1.5}>
            {[
              { label: 'Appetite', key: 'appetite', options: ['Good', 'Fair', 'Poor'] },
              { label: 'Speech', key: 'speech', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Judgement', key: 'judgement', options: ['Good', 'Fair', 'Poor'] },
              { label: 'Mood', key: 'mood', options: ['Calm', 'Anxious', 'Agitated', 'Depressed'] },
              { label: 'Gait', key: 'gait', options: ['Normal', 'Unsteady', 'Wheelchair', 'Bedbound'] },
              { label: 'Understanding', key: 'understanding', options: ['Good', 'Fair', 'Poor'] },
            ].map((field) => (
              <Grid item xs={4} key={field.label}>
                <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>{field.label}</Typography>
                <Select fullWidth size="small" value={(form as any)[field.key]} onChange={(e) => setForm({...form, [field.key]: e.target.value})}
                  sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  {field.options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </Select>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditingId(null); setForm(emptyForm); }} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
