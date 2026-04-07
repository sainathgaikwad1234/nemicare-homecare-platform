/**
 * Activities Tab — Data table + Add Activities modal
 * Figma: Resident (New)/Resident/Frame 1618877456-2.png
 * Figma: Resident (New)/Converstion.png (Daily Participation form)
 */
import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, FormControlLabel, Radio, RadioGroup, IconButton,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

const sampleData = [
  { id: 1, date: '11/26/2026', processDate: '', description: '', dailyParticipation: '', addedBy: 'Albert Flores' },
  { id: 2, date: '11/25/2026', processDate: '', description: '', dailyParticipation: '', addedBy: 'Albert Fox' },
  { id: 3, date: '10/4/2026', processDate: '', description: '', dailyParticipation: '', addedBy: 'Darlene Robertson' },
  { id: 4, date: '10/2/2026', processDate: '', description: '', dailyParticipation: '', addedBy: 'Jacomo Bell' },
  { id: 5, date: '7/17/2026', processDate: '', description: '', dailyParticipation: '', addedBy: 'Jenny Wilson' },
  { id: 6, date: '6/5/2026', processDate: '', description: '', dailyParticipation: '', addedBy: 'Cameron Williamson' },
  { id: 7, date: '5/1/2026', processDate: '', description: '', dailyParticipation: '', addedBy: 'James Wilson' },
  { id: 8, date: '4/10/2026', processDate: '', description: '', dailyParticipation: '', addedBy: 'Guy Hawkins' },
  { id: 9, date: '1/19/2026', processDate: '', description: '', dailyParticipation: '', addedBy: 'Ronald Richards' },
];

export const ActivitiesTab: React.FC = () => {
  const [data] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Activities</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => setAddOpen(true)}
          sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>Add Activities</Button>
      </Box>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
              {['Date', 'Process Date', 'Description', 'Daily Participation', 'Added By'].map(c => (
                <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
              ))}
            </TableRow></TableHead>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
                  <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.date}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.processDate || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.description || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.dailyParticipation || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.addedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Rows per page: 50 | 1-{data.length} of {data.length}</Typography>
          <Pagination count={1} page={1} size="small" />
        </Box>
      </Paper>

      {/* Add Activities Modal — Figma: Converstion.png (Daily Participation) */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          Add Activity <IconButton size="small" onClick={() => setAddOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {/* Therapy */}
          <Box sx={{ bgcolor: '#f8f9fb', px: 2, py: 0.75, borderRadius: '4px', mb: 1 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Therapy</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, pl: 1 }}>
            {['Physical Therapy', 'Occupational Therapy', 'Speech Therapy'].map(t => (
              <FormControlLabel key={t} control={<Checkbox size="small" defaultChecked />} label={<Typography sx={{ fontSize: '11px' }}>{t}</Typography>} />
            ))}
          </Box>
          {/* Personal Care */}
          <Box sx={{ bgcolor: '#f8f9fb', px: 2, py: 0.75, borderRadius: '4px', mb: 1 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Personal Care</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, pl: 1 }}>
            {['Toileting', 'Eating', 'Dressing/Grooming'].map(t => (
              <FormControlLabel key={t} control={<Checkbox size="small" defaultChecked />} label={<Typography sx={{ fontSize: '11px' }}>{t}</Typography>} />
            ))}
          </Box>
          {/* Meals */}
          <Box sx={{ bgcolor: '#f8f9fb', px: 2, py: 0.75, borderRadius: '4px', mb: 1 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Meals</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, pl: 1 }}>
            {['Onsite', 'Snack', 'Take Home'].map(t => (
              <FormControlLabel key={t} control={<Checkbox size="small" defaultChecked />} label={<Typography sx={{ fontSize: '11px' }}>{t}</Typography>} />
            ))}
          </Box>
          {/* Daily Participation */}
          <Box sx={{ bgcolor: '#f8f9fb', px: 2, py: 0.75, borderRadius: '4px', mb: 1 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Daily Participation</Typography>
          </Box>
          {['Exercise/AM Discussion', 'Activity Group Games', 'Cognitive Group Games', 'Bingo'].map((item, i) => (
            <Box key={item} sx={{ mb: 1, pl: 1 }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 500, mb: 0.5 }}>{i + 1}. {item}</Typography>
              <RadioGroup row defaultValue={i === 0 ? 'Active' : i === 1 ? 'Passive' : 'Active'}>
                {['Active', 'Passive', 'Refused', 'Unable'].map(v => (
                  <FormControlLabel key={v} value={v} control={<Radio size="small" />} label={<Typography sx={{ fontSize: '10px' }}>{v}</Typography>} />
                ))}
              </RadioGroup>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={() => setAddOpen(false)} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
