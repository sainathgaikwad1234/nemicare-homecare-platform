/**
 * Face-to-Face Notes Tab (ALF only) — with CNA + RN approval workflow
 * User stories: rows 317-321
 * Figma: Frame 1984078324.png (Monthly Progress Notes form)
 */
import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Select, MenuItem, IconButton,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Edit as EditIcon } from '@mui/icons-material';

const sampleData = [
  { id: 1, date: '11/17/2026', type: 'Initial', memberName: 'Devon Lane', cnaSignature: 'Signed', rnApproval: 'Approved', status: 'Complete', addedBy: 'CNA Johnson' },
  { id: 2, date: '11/10/2026', type: 'Follow-up', memberName: 'Devon Lane', cnaSignature: 'Signed', rnApproval: 'Pending', status: 'Pending RN', addedBy: 'CNA Johnson' },
  { id: 3, date: '10/15/2026', type: 'Initial', memberName: 'Devon Lane', cnaSignature: 'Pending', rnApproval: 'N/A', status: 'Draft', addedBy: 'CNA Williams' },
];

export const FaceToFaceNotesTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    date: '', type: 'Initial', memberName: '', dob: '',
    carePlanChange: 'No', medicationChange: '', hospitalization: '',
    appetite: 'Good', speech: 'Normal', judgement: 'Good',
    mood: 'Calm', gait: 'Normal', understanding: 'Good',
    cnaInitial: '', cnaDate: '', rnInitial: '', rnDate: '',
    notes: '',
  });

  const handleSave = () => {
    setData([{
      id: data.length + 1,
      date: form.date ? new Date(form.date).toLocaleDateString() : new Date().toLocaleDateString(),
      type: form.type,
      memberName: form.memberName || 'Resident',
      cnaSignature: 'Pending',
      rnApproval: 'N/A',
      status: 'Draft',
      addedBy: 'Admin',
    }, ...data]);
    setAddOpen(false);
  };

  const filtered = search ? data.filter(d => d.memberName.toLowerCase().includes(search.toLowerCase())) : data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Face-to-Face Notes</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => setAddOpen(true)}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Face-to-Face Note</Button>
        </Box>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer><Table size="small">
          <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
            {['Date', 'Type', 'Member', 'CNA Signature', 'RN Approval', 'Status', 'Added By', 'Action'].map(c => (
              <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
            ))}
          </TableRow></TableHead>
          <TableBody>{filtered.map(r => (
            <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
              <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.date}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.type}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.memberName}</TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.cnaSignature} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: r.cnaSignature === 'Signed' ? '#d1fae5' : '#fef3c7', color: r.cnaSignature === 'Signed' ? '#065f46' : '#92400e' }} /></TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.rnApproval} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: r.rnApproval === 'Approved' ? '#d1fae5' : r.rnApproval === 'Pending' ? '#fef3c7' : '#f3f4f6', color: r.rnApproval === 'Approved' ? '#065f46' : r.rnApproval === 'Pending' ? '#92400e' : '#6b7280' }} /></TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: r.status === 'Complete' ? '#d1fae5' : r.status === 'Pending RN' ? '#dbeafe' : '#f3f4f6', color: r.status === 'Complete' ? '#065f46' : r.status === 'Pending RN' ? '#1e40af' : '#6b7280' }} /></TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.addedBy}</TableCell>
              <TableCell sx={{ py: 0.75 }}><IconButton size="small"><EditIcon sx={{ fontSize: 14, color: '#6b7280' }} /></IconButton></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>1-{filtered.length} of {filtered.length}</Typography>
          <Pagination count={1} page={1} size="small" />
        </Box>
      </Paper>

      {/* Add Face-to-Face Note Modal */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '8px', maxHeight: '90vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          Add Face-to-Face Note <IconButton size="small" onClick={() => setAddOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date</Typography>
              <TextField fullWidth size="small" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Face To Face Type</Typography>
              <Select fullWidth size="small" value={form.type} onChange={e => setForm({...form, type: e.target.value})} sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="Initial">Initial</MenuItem><MenuItem value="Follow-up">Follow-up</MenuItem>
              </Select></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Member Name</Typography>
              <TextField fullWidth size="small" placeholder="Devon Lane" value={form.memberName} onChange={e => setForm({...form, memberName: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Care Plan Change</Typography>
              <Select fullWidth size="small" value={form.carePlanChange} onChange={e => setForm({...form, carePlanChange: e.target.value})} sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="No">No</MenuItem><MenuItem value="Yes">Yes</MenuItem>
              </Select></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Medication Change</Typography>
              <TextField fullWidth size="small" placeholder="Enter changes" value={form.medicationChange} onChange={e => setForm({...form, medicationChange: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Hospitalization/Fall</Typography>
              <TextField fullWidth size="small" placeholder="Enter details" value={form.hospitalization} onChange={e => setForm({...form, hospitalization: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>

          {/* Clinical Assessment Dropdowns */}
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1 }}>Clinical Assessment</Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
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
                <Select fullWidth size="small" value={(form as any)[field.key]} onChange={e => setForm({...form, [field.key]: e.target.value})}
                  sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  {field.options.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </Select>
              </Grid>
            ))}
          </Grid>

          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Notes</Typography>
          <TextField fullWidth size="small" multiline rows={3} placeholder="Type here" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} sx={{ '& textarea': { fontSize: '11px' }, mb: 2 }} />

          {/* CNA/RN Approval Section */}
          <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 2 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, mb: 1.5 }}>CNA/LPN/RN Approval</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>CNA Initial</Typography>
                <Select fullWidth size="small" value={form.cnaInitial} onChange={e => setForm({...form, cnaInitial: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select CNA</em></MenuItem><MenuItem value="CNA Johnson">CNA Johnson</MenuItem><MenuItem value="CNA Williams">CNA Williams</MenuItem>
                </Select></Grid>
              <Grid item xs={2}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date</Typography>
                <TextField fullWidth size="small" type="date" value={form.cnaDate} onChange={e => setForm({...form, cnaDate: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>RN Initial</Typography>
                <Select fullWidth size="small" value={form.rnInitial} onChange={e => setForm({...form, rnInitial: e.target.value})} displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select RN</em></MenuItem><MenuItem value="RN Garcia">RN Garcia</MenuItem><MenuItem value="RN Lee">RN Lee</MenuItem>
                </Select></Grid>
              <Grid item xs={2}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date</Typography>
                <TextField fullWidth size="small" type="date" value={form.rnDate} onChange={e => setForm({...form, rnDate: e.target.value})} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Save as Draft</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Submit for Approval</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
