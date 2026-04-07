/**
 * Allergies Tab — Data table + Add Allergy modal
 * Figma: Resident (New)/Resident/Frame 1618877456-4.png (table)
 * Figma: Resident (New)/Frame 1984078324-1.png (add form)
 */

import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Select, MenuItem, IconButton, Radio, RadioGroup, FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';

interface AllergyRecord {
  id: number;
  type: string;
  allergen: string;
  reaction: string;
  severity: string;
  status: string;
  date: string;
  addedBy: string;
}

const severityColors: Record<string, { bg: string; color: string }> = {
  Mild: { bg: '#d1fae5', color: '#065f46' },
  Moderate: { bg: '#fef3c7', color: '#92400e' },
  Severe: { bg: '#fee2e2', color: '#991b1b' },
  High: { bg: '#fee2e2', color: '#991b1b' },
};

const sampleAllergies: AllergyRecord[] = [
  { id: 1, type: 'Environment', allergen: 'Cigarette smoke', reaction: 'Cough', severity: 'Mild', status: 'Active', date: '11/17/2026', addedBy: 'Albert Flores' },
  { id: 2, type: 'Food', allergen: 'Milk', reaction: 'Upset', severity: 'Mild', status: 'Active', date: '11/17/2026', addedBy: 'Robert Fox' },
  { id: 3, type: 'Environment', allergen: 'Dust', reaction: 'Tightness in Breathing', severity: 'High', status: 'Active', date: '11/17/2026', addedBy: 'Darlene Robertson' },
];

export const AllergiesTab: React.FC = () => {
  const [allergies, setAllergies] = useState<AllergyRecord[]>(sampleAllergies);
  const [addOpen, setAddOpen] = useState(false);
  const [filterTab, setFilterTab] = useState(0); // 0=Active, 1=Inactive, 2=Reaction, 3=Food
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Add form state
  const [allergyType, setAllergyType] = useState('Drug');
  const [allergyName, setAllergyName] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState('');
  const [onsetDate, setOnsetDate] = useState('');
  const [comment, setComment] = useState('');

  const handleEdit = (r: AllergyRecord) => {
    setEditingId(r.id);
    setAllergyType(r.type); setAllergyName(r.allergen); setReaction(r.reaction); setSeverity(r.severity); setOnsetDate(r.date); setComment('');
    setAddOpen(true);
  };

  const handleSave = () => {
    if (editingId !== null) {
      setAllergies(allergies.map(a => a.id === editingId ? {
        ...a, type: allergyType, allergen: allergyName || 'Unknown', reaction: reaction || '—',
        severity: severity || 'Mild', date: onsetDate ? new Date(onsetDate).toLocaleDateString() : a.date,
      } : a));
    } else {
      const newAllergy: AllergyRecord = {
        id: allergies.length + 1,
        type: allergyType,
        allergen: allergyName || 'Unknown',
        reaction: reaction || '—',
        severity: severity || 'Mild',
        status: 'Active',
        date: onsetDate ? new Date(onsetDate).toLocaleDateString() : new Date().toLocaleDateString(),
        addedBy: 'Admin',
      };
      setAllergies([newAllergy, ...allergies]);
    }
    setAllergyType('Drug'); setAllergyName(''); setReaction(''); setSeverity(''); setOnsetDate(''); setComment('');
    setEditingId(null);
    setAddOpen(false);
  };

  const filterLabels = ['Active', 'Inactive', 'Reaction', 'Food'];
  const tabFiltered = filterTab === 0 ? allergies.filter(a => a.status === 'Active')
    : filterTab === 1 ? allergies.filter(a => a.status === 'Inactive')
    : filterTab === 3 ? allergies.filter(a => a.type === 'Food')
    : allergies;
  const filtered = search ? tabFiltered.filter(a => a.allergen.toLowerCase().includes(search.toLowerCase())) : tabFiltered;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Allergies</Typography>
          <Chip label={allergies.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 28 }}>
            <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '11px', width: 100, background: 'transparent' }} />
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            onClick={() => { setEditingId(null); setAllergyType('Drug'); setAllergyName(''); setReaction(''); setSeverity(''); setOnsetDate(''); setComment(''); setAddOpen(true); }}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#ef4444', borderRadius: '6px', '&:hover': { bgcolor: '#dc2626' } }}>
            Add Allergy
          </Button>
        </Box>
      </Box>

      {/* Filter sub-tabs — Figma: Active / Inactive / Reaction / Food */}
      <Tabs value={filterTab} onChange={(_, v) => setFilterTab(v)}
        sx={{ mb: 2, minHeight: 28, '& .MuiTab-root': { textTransform: 'none', fontSize: '11px', minHeight: 28, py: 0 }, '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' } }}>
        {filterLabels.map((label) => <Tab key={label} label={label} />)}
      </Tabs>

      {/* Data Table */}
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                {['Type', 'Allergen', 'Reaction', 'Severity', 'Status', 'Date', 'Added By', 'Action'].map((col) => (
                  <TableCell key={col} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#94a3b8', fontSize: '13px' }}>No allergies found</TableCell></TableRow>
              ) : filtered.map((a) => (
                <TableRow key={a.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{a.type}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{a.allergen}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{a.reaction}</TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Chip label={a.severity} size="small"
                      sx={{ fontSize: '9px', height: 18, bgcolor: (severityColors[a.severity] || severityColors.Mild).bg, color: (severityColors[a.severity] || severityColors.Mild).color }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{a.status}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{a.date}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{a.addedBy}</TableCell>
                  <TableCell><IconButton size="small" onClick={() => handleEdit(a)}><EditIcon sx={{ fontSize: 14, color: '#6b7280' }} /></IconButton></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Rows per page: 50 | 1-{filtered.length} of {filtered.length}</Typography>
          <Pagination count={1} page={page} onChange={(_, p) => setPage(p)} size="small" />
        </Box>
      </Paper>

      {/* Add Allergy Modal — Figma: Frame 1984078324-1.png */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setEditingId(null); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          {editingId !== null ? 'Edit' : 'Add'} Allergy
          <IconButton size="small" onClick={() => { setAddOpen(false); setEditingId(null); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Allergy Type — radio buttons */}
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1 }}>Select Allergy Type</Typography>
          <RadioGroup row value={allergyType} onChange={(e) => setAllergyType(e.target.value)} sx={{ mb: 2 }}>
            {['Drug', 'Food', 'Environment'].map((type) => (
              <FormControlLabel key={type} value={type} control={<Radio size="small" />}
                label={<Typography sx={{ fontSize: '12px' }}>{type}</Typography>} />
            ))}
          </RadioGroup>

          {/* Allergy Name */}
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Allergy Name</Typography>
          <Select fullWidth size="small" value={allergyName} onChange={(e) => setAllergyName(e.target.value)}
            displayEmpty sx={{ fontSize: '11px', mb: 2, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select or Search Allergy</em></MenuItem>
            <MenuItem value="Penicillin">Penicillin</MenuItem>
            <MenuItem value="Aspirin">Aspirin</MenuItem>
            <MenuItem value="Ibuprofen">Ibuprofen</MenuItem>
            <MenuItem value="Peanuts">Peanuts</MenuItem>
            <MenuItem value="Milk">Milk</MenuItem>
            <MenuItem value="Eggs">Eggs</MenuItem>
            <MenuItem value="Dust">Dust</MenuItem>
            <MenuItem value="Pollen">Pollen</MenuItem>
            <MenuItem value="Cigarette smoke">Cigarette smoke</MenuItem>
          </Select>

          {/* Reaction, Severity, Onset Date */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Reaction</Typography>
              <Select fullWidth size="small" value={reaction} onChange={(e) => setReaction(e.target.value)}
                displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select Reaction</em></MenuItem>
                <MenuItem value="Rash">Rash</MenuItem>
                <MenuItem value="Anaphylaxis">Anaphylaxis</MenuItem>
                <MenuItem value="Nausea">Nausea</MenuItem>
                <MenuItem value="Swelling">Swelling</MenuItem>
                <MenuItem value="Cough">Cough</MenuItem>
                <MenuItem value="Upset">Upset</MenuItem>
                <MenuItem value="Tightness in Breathing">Tightness in Breathing</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Severity</Typography>
              <Select fullWidth size="small" value={severity} onChange={(e) => setSeverity(e.target.value)}
                displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select Severity</em></MenuItem>
                <MenuItem value="Mild">Mild</MenuItem>
                <MenuItem value="Moderate">Moderate</MenuItem>
                <MenuItem value="Severe">Severe</MenuItem>
                <MenuItem value="High">High (Life-Threatening)</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Onset Date</Typography>
              <TextField fullWidth size="small" type="date" value={onsetDate}
                onChange={(e) => setOnsetDate(e.target.value)}
                sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
            </Grid>
          </Grid>

          {/* Comment */}
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Comment</Typography>
          <TextField fullWidth size="small" multiline rows={3} value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ '& textarea': { fontSize: '11px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddOpen(false); setEditingId(null); }} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
