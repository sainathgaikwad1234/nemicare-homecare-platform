/**
 * Incidents Tab (common ADH & ALF) — Figma: Report New Incident -.png
 * User stories: rows 232-237 (Minor + Major incidents)
 */
import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Select, MenuItem, IconButton, Radio, RadioGroup, FormControlLabel, Switch,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

const sampleData = [
  { id: 1, date: '11/15/2026', time: '02:30 PM', type: 'Minor', category: 'Slip', location: 'Hallway', description: 'Resident slipped on wet floor, no injury', severity: 'Minor', status: 'Documented', reportedBy: 'Nurse Johnson' },
  { id: 2, date: '11/10/2026', time: '09:15 AM', type: 'Minor', category: 'Verbal', location: 'Dining Room', description: 'Verbal altercation between residents', severity: 'Minor', status: 'Resolved', reportedBy: 'Staff Wilson' },
  { id: 3, date: '10/28/2026', time: '11:00 PM', type: 'Major', category: 'Fall', location: 'Room 201', description: 'Resident fell from bed, bruise on arm', severity: 'Major', status: 'Under Review', reportedBy: 'Nurse Garcia' },
];

export const IncidentsTab: React.FC = () => {
  const [data, setData] = useState(sampleData);
  const [addOpen, setAddOpen] = useState(false);
  const [filterTab, setFilterTab] = useState(0);
  const [incidentType, setIncidentType] = useState('Minor');
  const [form, setForm] = useState({ date: '', time: '', category: '', location: '', description: '', witnesses: '', actions: '', familyNotified: '' });

  const handleSave = () => {
    setData([{ id: data.length + 1, date: form.date ? new Date(form.date).toLocaleDateString() : new Date().toLocaleDateString(), time: form.time || '—', type: incidentType, category: form.category || '—', location: form.location || '—', description: form.description || '—', severity: incidentType, status: 'Documented', reportedBy: 'Admin' }, ...data]);
    setForm({ date: '', time: '', category: '', location: '', description: '', witnesses: '', actions: '', familyNotified: '' });
    setAddOpen(false);
  };

  const filtered = filterTab === 0 ? data : filterTab === 1 ? data.filter(d => d.type === 'Minor') : data.filter(d => d.type === 'Major');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>Incidents</Typography>
          <Chip label={data.length} size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
        <Button size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={() => setAddOpen(true)}
          sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#ef4444', borderRadius: '6px', '&:hover': { bgcolor: '#dc2626' } }}>Report New Incident</Button>
      </Box>
      <Tabs value={filterTab} onChange={(_, v) => setFilterTab(v)} sx={{ mb: 2, minHeight: 28, '& .MuiTab-root': { textTransform: 'none', fontSize: '11px', minHeight: 28, py: 0 }, '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' } }}>
        <Tab label="All" /><Tab label="Minor" /><Tab label="Major" />
      </Tabs>
      <Paper sx={{ borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }} elevation={0}>
        <TableContainer><Table size="small">
          <TableHead><TableRow sx={{ bgcolor: '#f9fafb' }}>
            {['Date', 'Time', 'Type', 'Category', 'Location', 'Description', 'Severity', 'Status', 'Reported By'].map(c => (
              <TableCell key={c} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase' }}>{c}</TableCell>
            ))}
          </TableRow></TableHead>
          <TableBody>{filtered.map(r => (
            <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f9fafb' } }}>
              <TableCell sx={{ fontSize: '11px', color: '#334155', py: 0.75 }}>{r.date}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.time}</TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.type} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: r.type === 'Minor' ? '#fef3c7' : '#fee2e2', color: r.type === 'Minor' ? '#92400e' : '#991b1b' }} /></TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.category}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.location}</TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.severity} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: r.severity === 'Minor' ? '#fef3c7' : '#fee2e2', color: r.severity === 'Minor' ? '#92400e' : '#991b1b' }} /></TableCell>
              <TableCell sx={{ py: 0.75 }}><Chip label={r.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: r.status === 'Resolved' ? '#d1fae5' : r.status === 'Under Review' ? '#fef3c7' : '#dbeafe', color: r.status === 'Resolved' ? '#065f46' : r.status === 'Under Review' ? '#92400e' : '#1e40af' }} /></TableCell>
              <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75 }}>{r.reportedBy}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>1-{filtered.length} of {filtered.length}</Typography>
          <Pagination count={1} page={1} size="small" />
        </Box>
      </Paper>

      {/* Report Incident Modal — 4-step wizard per Figma */}
      <IncidentWizard open={addOpen} onClose={() => setAddOpen(false)} incidentType={incidentType} setIncidentType={setIncidentType} onSave={handleSave} />
    </Box>
  );
};

/* ========================================
   Incident Report Wizard — 4 steps per Figma
   Step 0: Select Severity (Minor/Major)
   Step 1: Incident Details (Date, Time, Location, Type, Description, Upload)
   Step 2: Witness Info (Name, Statement)
   Step 3: Interventions (Actions, Family, Physician)
   Step 4: Outcomes (Risk Level, Root Cause, Corrective Action)
   ======================================== */

const IncidentWizard: React.FC<{
  open: boolean; onClose: () => void; incidentType: string;
  setIncidentType: (v: string) => void; onSave: () => void;
}> = ({ open, onClose, incidentType, setIncidentType, onSave }) => {
  const [step, setStep] = useState(0);
  const stepLabels = ['Severity', 'Incident Details', 'Witness Info', 'Interventions', 'Outcomes'];

  const handleSubmit = () => { onSave(); setStep(0); onClose(); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '8px', maxHeight: '90vh' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {step > 0 && <Typography onClick={() => setStep(step - 1)} sx={{ cursor: 'pointer', fontSize: '16px' }}>←</Typography>}
          Report {incidentType} Incident
        </Box>
        <IconButton size="small" onClick={() => { setStep(0); onClose(); }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>

      {/* Step indicator */}
      {step > 0 && (
        <Box sx={{ display: 'flex', gap: 2, px: 3, pb: 1 }}>
          {stepLabels.slice(1).map((label, i) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%', fontSize: '10px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: i + 1 <= step ? '#1e3a5f' : '#e5e7eb', color: i + 1 <= step ? '#fff' : '#6b7280',
              }}>{i + 1}</Box>
              <Typography sx={{ fontSize: '10px', color: i + 1 === step ? '#1e3a5f' : '#94a3b8', fontWeight: i + 1 === step ? 600 : 400 }}>{label}</Typography>
              {i < 3 && <Box sx={{ width: 20, height: 1, bgcolor: '#e5e7eb' }} />}
            </Box>
          ))}
        </Box>
      )}

      <DialogContent sx={{ pt: 2 }}>
        {/* Step 0: Select Severity */}
        {step === 0 && (
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1 }}>Select Incident Severity</Typography>
            <Typography sx={{ fontSize: '11px', color: '#6b7280', mb: 1.5 }}>Choose the severity level to proceed with the appropriate reporting form.</Typography>
            <RadioGroup value={incidentType} onChange={(e) => setIncidentType(e.target.value)}>
              {[
                { value: 'Minor', label: 'Minor Incident', desc: 'No serious injury. Managed within the facility. No hospitalization required.', tags: ['Slip / fall', 'Scratch', 'Medication delay', 'Behavioral episode'] },
                { value: 'Major', label: 'Major Incident', desc: 'Serious injury, hospitalization, emergency transfer, or regulatory concern.', tags: ['Fall with injury', 'Death / horror', 'EMS transfer', 'Allegation of abuse'] },
              ].map(opt => (
                <Paper key={opt.value} sx={{ p: 1.5, mb: 1, border: incidentType === opt.value ? '2px solid #1e3a5f' : '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }} elevation={0} onClick={() => setIncidentType(opt.value)}>
                  <FormControlLabel value={opt.value} control={<Radio size="small" />} label={<Box>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{opt.label}</Typography>
                    <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>{opt.desc}</Typography>
                  </Box>} />
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 4, mt: 0.5 }}>
                    {opt.tags.map(t => <Chip key={t} label={t} size="small" sx={{ fontSize: '9px', height: 18 }} />)}
                  </Box>
                </Paper>
              ))}
            </RadioGroup>
          </Box>
        )}

        {/* Step 1: Incident Details — Figma: Report New Incident --2.png / Leads.png */}
        {step === 1 && (
          <Box>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Incident Date *</Typography>
                <TextField fullWidth size="small" type="date" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Incident Time *</Typography>
                <TextField fullWidth size="small" type="time" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Incident Location *</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select Location</em></MenuItem>
                  <MenuItem value="Room">Room</MenuItem><MenuItem value="Hallway">Hallway</MenuItem><MenuItem value="Dining Room">Dining Room</MenuItem><MenuItem value="Bathroom">Bathroom</MenuItem><MenuItem value="Common Area">Common Area</MenuItem><MenuItem value="Outside">Outside</MenuItem>
                </Select></Grid>
            </Grid>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Incident Type *</Typography>
            <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', mb: 1.5, '& .MuiSelect-select': { py: 0.5 } }}>
              <MenuItem value="" disabled><em>Select Incident Type</em></MenuItem>
              <MenuItem value="Fall">Fall</MenuItem><MenuItem value="Medication Error">Medication Error</MenuItem><MenuItem value="Behavioral">Behavioral</MenuItem><MenuItem value="Injury">Injury</MenuItem><MenuItem value="Elopement">Elopement</MenuItem><MenuItem value="Other">Other</MenuItem>
            </Select>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Description *</Typography>
            <TextField fullWidth size="small" multiline rows={4} placeholder="Describe what happened, including any relevant details..." sx={{ '& textarea': { fontSize: '11px' }, mb: 1.5 }} />
            <Typography sx={{ fontSize: '10px', color: '#94a3b8', mb: 1.5 }}>Include what happened, when, where, and any immediate observations</Typography>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Staff Involved</Typography>
            <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', mb: 2, '& .MuiSelect-select': { py: 0.5 } }}>
              <MenuItem value="" disabled><em>Select Staff</em></MenuItem>
              <MenuItem value="Nurse Johnson">Nurse Johnson</MenuItem><MenuItem value="Staff Wilson">Staff Wilson</MenuItem><MenuItem value="CNA Garcia">CNA Garcia</MenuItem>
            </Select>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box><Typography sx={{ fontSize: '11px', fontWeight: 500 }}>Case Manager Notify</Typography>
                <Typography sx={{ fontSize: '10px', color: '#94a3b8' }}>Select if the Case Manager needs to be informed.</Typography></Box>
              <Switch size="small" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 500 }}>State Notify</Typography>
              <Switch size="small" />
            </Box>
          </Box>
        )}

        {/* Step 2: Witness Info — Figma: Leads-1.png */}
        {step === 2 && (
          <Box>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Witness Name</Typography>
            <TextField fullWidth size="small" placeholder="Enter witness name" sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Witness Statement</Typography>
            <TextField fullWidth size="small" multiline rows={5} placeholder="Provide a witness account of incident..." sx={{ '& textarea': { fontSize: '11px' } }} />
          </Box>
        )}

        {/* Step 3: Interventions — Figma: Leads-2.png */}
        {step === 3 && (
          <Box>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Intervention/Action</Typography>
            <TextField fullWidth size="small" multiline rows={2} placeholder="Describe all interventions and outcomes taken" sx={{ '& textarea': { fontSize: '11px' }, mb: 1.5 }} />
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Family Member Name</Typography>
                <TextField fullWidth size="small" placeholder="Enter name" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={3}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Relation</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Spouse">Spouse</MenuItem><MenuItem value="Child">Child</MenuItem><MenuItem value="Sibling">Sibling</MenuItem>
                </Select></Grid>
              <Grid item xs={3}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Aware of Incident</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="Yes">Yes</MenuItem><MenuItem value="No">No</MenuItem>
                </Select></Grid>
            </Grid>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Physician Name</Typography>
            <TextField fullWidth size="small" placeholder="Enter physician name" sx={{ '& input': { fontSize: '11px', py: 0.5 }, mb: 1.5 }} />
            <Grid container spacing={1.5}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Physician Notified Date</Typography>
                <TextField fullWidth size="small" type="date" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Physician Notified Time</Typography>
                <TextField fullWidth size="small" type="time" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
          </Box>
        )}

        {/* Step 4: Outcomes — Figma: Leads-3.png */}
        {step === 4 && (
          <Box>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.5 }}>Risk Level</Typography>
            <RadioGroup row defaultValue="Low" sx={{ mb: 2 }}>
              {['Low', 'Moderate', 'High'].map(v => (
                <FormControlLabel key={v} value={v} control={<Radio size="small" />} label={<Typography sx={{ fontSize: '12px' }}>{v}</Typography>} />
              ))}
            </RadioGroup>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Root Cause/Reason</Typography>
            <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', mb: 1.5, '& .MuiSelect-select': { py: 0.5 } }}>
              <MenuItem value="" disabled><em>Select Root Cause</em></MenuItem>
              <MenuItem value="Environmental">Environmental Hazard</MenuItem><MenuItem value="Human Error">Human Error</MenuItem><MenuItem value="Equipment">Equipment Failure</MenuItem><MenuItem value="Patient Condition">Patient Condition</MenuItem>
            </Select>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Corrective Action Plan</Typography>
            <TextField fullWidth size="small" multiline rows={3} placeholder="Provide a detailed account of incident..." sx={{ '& textarea': { fontSize: '11px' } }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        {step > 0 && <Typography onClick={() => setStep(0)} sx={{ fontSize: '11px', color: '#3b82f6', cursor: 'pointer' }}>Save as Draft</Typography>}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button onClick={() => { if (step === 0) { setStep(0); onClose(); } else setStep(step - 1); }} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>
            {step === 0 ? 'Cancel' : '← Previous'}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>
              {step === 0 ? 'Proceed →' : 'Next →'}
            </Button>
          ) : (
            <Button onClick={handleSubmit} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#ef4444' }}>
              Submit Incident Report
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};
