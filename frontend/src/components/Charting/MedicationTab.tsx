/**
 * Medication Tab — Data table + Add Medication modal
 * Figma: Resident (New)/Resident/Frame 1618877456-5.png (table)
 * Figma: Resident (New)/Frame 1984078383.png (add form)
 */

import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Select, MenuItem, IconButton, Radio, RadioGroup, FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Search as SearchIcon, Edit as EditIcon } from '@mui/icons-material';

interface MedicationRecord {
  id: number;
  name: string;
  sig: string;
  quantity: number;
  startDate: string;
  endDate: string;
  refillDate: string;
  status: string;
  addedBy: string;
}

const sampleMeds: MedicationRecord[] = [
  { id: 1, name: 'Paracetol', sig: '1 tablet every 6 hours', quantity: 30, startDate: '10/17/2026', endDate: '—', refillDate: 'Ext F40.218', status: 'Ongoing', addedBy: 'Cameron Williamson' },
  { id: 2, name: 'Lospresor', sig: '1 tablet every 12 hours', quantity: 60, startDate: '10/17/2026', endDate: '10/17/2026', refillDate: 'Ext F40.214', status: 'Ongoing', addedBy: 'Cameron Williamson' },
  { id: 3, name: 'Nefuron', sig: '1 tablet every 6 hours', quantity: 30, startDate: '10/17/2026', endDate: '10/17/2026', refillDate: 'Ext F40.980', status: 'Ongoing', addedBy: 'Cameron Williamson' },
];

export const MedicationTab: React.FC = () => {
  const [meds, setMeds] = useState<MedicationRecord[]>(sampleMeds);
  const [addOpen, setAddOpen] = useState(false);
  const [filterTab, setFilterTab] = useState(0); // 0=Active, 1=Pending, 2=Past, 3=All, 4=Other
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Add form state
  const [medName, setMedName] = useState('');
  const [sig, setSig] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [refill, setRefill] = useState('0');
  const [medType, setMedType] = useState('Permanent');
  const [duration, setDuration] = useState('0');
  const [durationUnit, setDurationUnit] = useState('Days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [icdCode, setIcdCode] = useState('');
  const [notes, setNotes] = useState('');

  const handleEdit = (r: MedicationRecord) => {
    setEditingId(r.id);
    setMedName(r.name); setSig(r.sig); setQuantity(String(r.quantity)); setRefill('0');
    setStartDate(r.startDate); setEndDate(r.endDate === '—' ? '' : r.endDate);
    setIcdCode(r.refillDate === '—' ? '' : r.refillDate); setNotes('');
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setMeds(meds.map(m => m.id === editingId ? {
        ...m, name: medName || m.name, sig: sig || '—', quantity: parseInt(quantity) || 0,
        startDate: startDate ? new Date(startDate).toLocaleDateString() : m.startDate,
        endDate: endDate ? new Date(endDate).toLocaleDateString() : '—',
        refillDate: icdCode || '—',
      } : m));
    } else {
      const newMed: MedicationRecord = {
        id: meds.length + 1,
        name: medName || 'New Medication',
        sig: sig || '—',
        quantity: parseInt(quantity) || 0,
        startDate: startDate ? new Date(startDate).toLocaleDateString() : new Date().toLocaleDateString(),
        endDate: endDate ? new Date(endDate).toLocaleDateString() : '—',
        refillDate: icdCode || '—',
        status: 'Ongoing',
        addedBy: 'Admin',
      };
      setMeds([newMed, ...meds]);
    }
    setMedName(''); setSig(''); setQuantity('0'); setRefill('0'); setStartDate(''); setEndDate(''); setIcdCode(''); setNotes('');
    setEditingId(null);
    setAddOpen(false);
  };

  const filtered = search ? meds.filter(m => m.name.toLowerCase().includes(search.toLowerCase())) : meds;

  return (
    <Box>
      {/* Header — Figma: Active/Pending/Past/All tabs + search + buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Tabs value={filterTab} onChange={(_, v) => setFilterTab(v)}
          sx={{ minHeight: 28, '& .MuiTab-root': { textTransform: 'none', fontSize: '11px', minHeight: 28, py: 0 }, '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' } }}>
          {['Active', 'Pending', 'Past', 'All', 'Other'].map((l) => <Tab key={l} label={l} />)}
        </Tabs>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Rx..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 80, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="outlined" sx={{ fontSize: '10px', textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f', minHeight: 28 }}>
            +Prescribe
          </Button>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 12 }} />}
            onClick={() => { setEditingId(null); setMedName(''); setSig(''); setQuantity('0'); setRefill('0'); setStartDate(''); setEndDate(''); setIcdCode(''); setNotes(''); setAddOpen(true); }}
            sx={{ fontSize: '10px', textTransform: 'none', bgcolor: '#1e3a5f', minHeight: 28 }}>
            Add Medication
          </Button>
        </Box>
      </Box>

      {/* Data Table */}
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                {['Name', 'Sig', 'Qty', 'Start Date', 'End Date', 'Refill/Code', 'Status', 'Added By', 'Action'].map((col) => (
                  <TableCell key={col} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75, fontWeight: 500 }}>{m.name}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{m.sig}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{m.quantity}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{m.startDate}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{m.endDate}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{m.refillDate}</TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Chip label={m.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: '#dbeafe', color: '#1e40af' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{m.addedBy}</TableCell>
                  <TableCell><IconButton size="small" onClick={() => handleEdit(m)}><EditIcon sx={{ fontSize: 14, color: '#6b7280' }} /></IconButton></TableCell>
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

      {/* Add Medication Modal — Figma: Frame 1984078383.png */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditingId(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          {editingId !== null ? 'Edit' : 'Add'} Medication
          <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Medicine Name</Typography>
          <Select fullWidth size="small" value={medName} onChange={(e) => setMedName(e.target.value)}
            displayEmpty sx={{ fontSize: '11px', mb: 2, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select Medicine</em></MenuItem>
            <MenuItem value="Paracetol">Paracetol</MenuItem>
            <MenuItem value="Lospresor">Lospresor</MenuItem>
            <MenuItem value="Nefuron">Nefuron</MenuItem>
            <MenuItem value="Kerendia">Kerendia</MenuItem>
            <MenuItem value="Metformin">Metformin</MenuItem>
            <MenuItem value="Lisinopril">Lisinopril</MenuItem>
          </Select>

          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Sig</Typography>
          <TextField fullWidth size="small" placeholder="Enter Sig Details" value={sig}
            onChange={(e) => setSig(e.target.value)} sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 2 }} />

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Quantity</Typography>
              <TextField size="small" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
            </Grid>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Refill</Typography>
              <TextField size="small" type="number" value={refill} onChange={(e) => setRefill(e.target.value)}
                sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
            </Grid>
          </Grid>

          <RadioGroup row value={medType} onChange={(e) => setMedType(e.target.value)} sx={{ mb: 2 }}>
            <FormControlLabel value="Permanent" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '12px' }}>Permanent</Typography>} />
            <FormControlLabel value="Temporary" control={<Radio size="small" />} label={<Typography sx={{ fontSize: '12px' }}>Temporary</Typography>} />
          </RadioGroup>

          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Duration</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <TextField size="small" type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                  sx={{ width: 60, '& input': { fontSize: '11px', py: 0.5 } }} />
                <Select size="small" value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)}
                  sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="Days">Days</MenuItem>
                  <MenuItem value="Weeks">Weeks</MenuItem>
                  <MenuItem value="Months">Months</MenuItem>
                </Select>
              </Box>
            </Grid>
            <Grid item xs={4.5}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Start Date</Typography>
              <TextField fullWidth size="small" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
            </Grid>
            <Grid item xs={4.5}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>End Date</Typography>
              <TextField fullWidth size="small" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
            </Grid>
          </Grid>

          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Diagnosis Code</Typography>
          <Select fullWidth size="small" value={icdCode} onChange={(e) => setIcdCode(e.target.value)}
            displayEmpty sx={{ fontSize: '11px', mb: 2, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select ICD Code</em></MenuItem>
            <MenuItem value="E11.9">E11.9 - Type 2 Diabetes</MenuItem>
            <MenuItem value="I10">I10 - Hypertension</MenuItem>
            <MenuItem value="J44.1">J44.1 - COPD</MenuItem>
            <MenuItem value="F40.218">F40.218 - Anxiety</MenuItem>
          </Select>

          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Notes</Typography>
          <TextField fullWidth size="small" multiline rows={3} placeholder="Type here" value={notes}
            onChange={(e) => setNotes(e.target.value)} sx={{ '& textarea': { fontSize: '11px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditingId(null); }} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
