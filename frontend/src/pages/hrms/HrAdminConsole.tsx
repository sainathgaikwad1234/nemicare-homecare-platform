import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { Add as AddIcon, Star as StarIcon, ReportProblem as IncidentIcon, Settings as SettingsIcon } from '@mui/icons-material';
import {
  incidentService, Incident, IncidentSeverity, IncidentStatus,
  recognitionService, Recognition,
  payrollSettingsService, PayrollSettings,
} from '../../services/phase5c.service';
import { employeeService, Employee } from '../../services/employee.service';

const SEVERITY_STYLES: Record<IncidentSeverity, { bg: string; color: string }> = {
  LOW: { bg: '#dbeafe', color: '#1e3a5f' },
  MEDIUM: { bg: '#fef3c7', color: '#92400e' },
  HIGH: { bg: '#fed7aa', color: '#9a3412' },
  CRITICAL: { bg: '#fee2e2', color: '#991b1b' },
};
const STATUS_STYLES: Record<IncidentStatus, { bg: string; color: string }> = {
  OPEN: { bg: '#fef3c7', color: '#92400e' },
  UNDER_REVIEW: { bg: '#dbeafe', color: '#1e3a5f' },
  RESOLVED: { bg: '#d1fae5', color: '#065f46' },
  CLOSED: { bg: '#f3f4f6', color: '#6b7280' },
};

export const HrAdminConsolePage: React.FC = () => {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{ '& .MuiTab-root': { textTransform: 'none', fontSize: '0.85rem', fontWeight: 500 } }}>
            <Tab label="Incidents & Disciplinary" icon={<IncidentIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Recognition" icon={<StarIcon fontSize="small" />} iconPosition="start" />
            <Tab label="Payroll Settings" icon={<SettingsIcon fontSize="small" />} iconPosition="start" />
          </Tabs>
        </Box>
        {tab === 0 && <IncidentsPanel />}
        {tab === 1 && <RecognitionsPanel />}
        {tab === 2 && <PayrollSettingsPanel />}
      </Paper>
    </Box>
  );
};

// =============== Incidents Panel ===============
const IncidentsPanel: React.FC = () => {
  const [items, setItems] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    incidentDate: new Date().toISOString().slice(0, 10),
    category: 'ATTENDANCE',
    severity: 'LOW' as IncidentSeverity,
    involvedEmployeeId: '' as number | '',
    title: '', description: '', actionTaken: '',
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await incidentService.list({ pageSize: 50 });
      if (r.success && Array.isArray(r.data)) setItems(r.data);
    } catch (e: any) { setSnackbar({ open: true, message: e.message, severity: 'error' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (open && employees.length === 0) {
      employeeService.listEmployees({ pageSize: 100 }).then((r: any) => {
        if (r.success) setEmployees(r.data || []);
      });
    }
  }, [open, employees.length]);

  const handleCreate = async () => {
    try {
      await incidentService.create({
        ...form,
        category: form.category as any,
        involvedEmployeeId: form.involvedEmployeeId ? Number(form.involvedEmployeeId) : null,
      } as any);
      setSnackbar({ open: true, message: 'Incident logged', severity: 'success' });
      setOpen(false); load();
    } catch (e: any) { setSnackbar({ open: true, message: e.message, severity: 'error' }); }
  };

  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Incident & Disciplinary Reports</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          Report Incident
        </Button>
      </Box>
      {loading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
      : items.length === 0 ? <Box sx={{ p: 6, textAlign: 'center', color: '#6b7280' }}><Typography>No incidents logged.</Typography></Box>
      : (
        <TableContainer><Table size="small"><TableHead>
          <TableRow sx={{ bgcolor: '#f9fafb' }}>
            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Action Taken</TableCell>
          </TableRow>
        </TableHead><TableBody>
          {items.map((i) => {
            const sev = SEVERITY_STYLES[i.severity];
            const st = STATUS_STYLES[i.status];
            return (
              <TableRow key={i.id} hover>
                <TableCell sx={{ fontSize: '0.85rem' }}>{new Date(i.incidentDate).toLocaleDateString()}</TableCell>
                <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{i.title}</TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>{i.category}</TableCell>
                <TableCell><Chip label={i.severity} size="small" sx={{ bgcolor: sev.bg, color: sev.color, height: 20, fontSize: '0.7rem' }} /></TableCell>
                <TableCell><Chip label={i.status} size="small" sx={{ bgcolor: st.bg, color: st.color, height: 20, fontSize: '0.7rem' }} /></TableCell>
                <TableCell sx={{ fontSize: '0.8rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.actionTaken || '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody></Table></TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report Incident</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2, mt: 1 }}>
            <TextField label="Incident Date" type="date" size="small" InputLabelProps={{ shrink: true }}
              value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} />
            <FormControl size="small">
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['ATTENDANCE','PERFORMANCE','CONDUCT','SAFETY','POLICY_VIOLATION','COMPLAINT','OTHER'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <FormControl size="small">
              <InputLabel>Severity</InputLabel>
              <Select label="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentSeverity })}>
                <MenuItem value="LOW">Low</MenuItem><MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem><MenuItem value="CRITICAL">Critical</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Involved Employee</InputLabel>
              <Select label="Involved Employee" value={form.involvedEmployeeId} onChange={(e) => setForm({ ...form, involvedEmployeeId: Number(e.target.value) })}>
                <MenuItem value="">N/A</MenuItem>
                {employees.map((e: any) => <MenuItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField label="Title" fullWidth size="small" sx={{ mb: 2 }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Description" multiline minRows={3} fullWidth size="small" sx={{ mb: 2 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField label="Action Taken" multiline minRows={2} fullWidth size="small" value={form.actionTaken} onChange={(e) => setForm({ ...form, actionTaken: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.title || !form.description}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

// =============== Recognitions Panel ===============
const RecognitionsPanel: React.FC = () => {
  const [items, setItems] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ employeeId: '' as number | '', category: 'Excellence', title: '', description: '', visibility: 'PUBLIC' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await recognitionService.list({ pageSize: 50 });
      if (r.success && Array.isArray(r.data)) setItems(r.data);
    } catch (e: any) { setSnackbar({ open: true, message: e.message, severity: 'error' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (open && employees.length === 0) {
      employeeService.listEmployees({ pageSize: 100 }).then((r: any) => { if (r.success) setEmployees(r.data || []); });
    }
  }, [open, employees.length]);

  const handleCreate = async () => {
    if (!form.employeeId || !form.title) return;
    try {
      await recognitionService.create({ ...form, employeeId: Number(form.employeeId) });
      setSnackbar({ open: true, message: 'Recognition posted', severity: 'success' });
      setOpen(false); setForm({ employeeId: '', category: 'Excellence', title: '', description: '', visibility: 'PUBLIC' });
      load();
    } catch (e: any) { setSnackbar({ open: true, message: e.message, severity: 'error' }); }
  };

  return (
    <Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Employee Recognition</Typography>
        <Button variant="contained" startIcon={<StarIcon />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none' }}>
          Recognize Staff
        </Button>
      </Box>
      {loading ? <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>
      : items.length === 0 ? <Box sx={{ p: 6, textAlign: 'center', color: '#6b7280' }}><Typography>No recognitions yet.</Typography></Box>
      : (
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 2 }}>
          {items.map((r) => (
            <Paper key={r.id} sx={{ p: 2, border: '1px solid #fed7aa', boxShadow: 'none', borderRadius: 1, bgcolor: '#fff7ed' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StarIcon sx={{ color: '#f59e0b' }} />
                <Chip label={r.category} size="small" sx={{ bgcolor: '#fed7aa', color: '#9a3412', height: 18, fontSize: '0.7rem' }} />
              </Box>
              <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>{r.title}</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#374151', mb: 1 }}>{r.description || ''}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                For <b>{r.employee?.firstName} {r.employee?.lastName}</b>{r.employee?.designation ? ` (${r.employee.designation})` : ''}
                {' '}— recognized by {r.recognizedBy?.firstName} {r.recognizedBy?.lastName}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', mt: 0.5 }}>{new Date(r.createdAt).toLocaleDateString()}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Recognize Staff</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Employee</InputLabel>
            <Select label="Employee" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: Number(e.target.value) })}>
              {employees.map((e: any) => <MenuItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <FormControl size="small">
              <InputLabel>Category</InputLabel>
              <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['Excellence','Teamwork','Innovation','Leadership','Compassion','Above & Beyond'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Visibility</InputLabel>
              <Select label="Visibility" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
                <MenuItem value="PUBLIC">Public</MenuItem><MenuItem value="TEAM">Team only</MenuItem><MenuItem value="PRIVATE">Private</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField label="Title" fullWidth size="small" sx={{ mb: 2 }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Description" multiline minRows={3} fullWidth size="small" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.employeeId || !form.title}
            sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, textTransform: 'none' }}>Post</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

// =============== Payroll Settings Panel ===============
const PayrollSettingsPanel: React.FC = () => {
  const [s, setS] = useState<PayrollSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await payrollSettingsService.get();
      if (r.success && r.data) setS(r.data);
    } catch (e: any) { setSnackbar({ open: true, message: e.message, severity: 'error' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!s) return;
    try {
      await payrollSettingsService.update(s);
      setSnackbar({ open: true, message: 'Payroll settings saved', severity: 'success' });
    } catch (e: any) { setSnackbar({ open: true, message: e.message, severity: 'error' }); }
  };

  if (loading || !s) return <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography sx={{ fontWeight: 600, color: '#1e3a5f', mb: 2 }}>Payroll Settings</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        <FormControl size="small">
          <InputLabel>Pay Period</InputLabel>
          <Select label="Pay Period" value={s.payPeriodType} onChange={(e) => setS({ ...s, payPeriodType: e.target.value })}>
            <MenuItem value="WEEKLY">Weekly</MenuItem>
            <MenuItem value="BIWEEKLY">Bi-weekly</MenuItem>
            <MenuItem value="SEMIMONTHLY">Semi-monthly</MenuItem>
            <MenuItem value="MONTHLY">Monthly</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Workweek Start</InputLabel>
          <Select label="Workweek Start" value={s.workweekStartDay} onChange={(e) => setS({ ...s, workweekStartDay: Number(e.target.value) })}>
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => <MenuItem key={d} value={i}>{d}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>
      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 1, mt: 2 }}>Overtime Thresholds</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
        <TextField label="Daily OT (hrs)" type="number" size="small" value={s.dailyOtThresholdHours}
          onChange={(e) => setS({ ...s, dailyOtThresholdHours: Number(e.target.value) })} />
        <TextField label="Weekly OT (hrs)" type="number" size="small" value={s.weeklyOtThresholdHours}
          onChange={(e) => setS({ ...s, weeklyOtThresholdHours: Number(e.target.value) })} />
        <TextField label="Doubletime (hrs)" type="number" size="small" value={s.doubletimeThresholdHours}
          onChange={(e) => setS({ ...s, doubletimeThresholdHours: Number(e.target.value) })} />
      </Box>
      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', mb: 1, mt: 2 }}>Pay Differentials</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
        <TextField label="Night shift +%" type="number" size="small" value={s.nightShiftDifferentialPercent}
          onChange={(e) => setS({ ...s, nightShiftDifferentialPercent: Number(e.target.value) })} />
        <TextField label="Weekend +%" type="number" size="small" value={s.weekendDifferentialPercent}
          onChange={(e) => setS({ ...s, weekendDifferentialPercent: Number(e.target.value) })} />
        <TextField label="Holiday multiplier" type="number" size="small" value={s.holidayMultiplier}
          onChange={(e) => setS({ ...s, holidayMultiplier: Number(e.target.value) })} />
      </Box>
      <FormControl size="small" sx={{ mb: 2, minWidth: 240 }}>
        <InputLabel>Payroll Provider</InputLabel>
        <Select label="Payroll Provider" value={s.payrollProvider} onChange={(e) => setS({ ...s, payrollProvider: e.target.value })}>
          <MenuItem value="ADP">ADP</MenuItem>
          <MenuItem value="GUSTO">Gusto</MenuItem>
          <MenuItem value="PAYCHEX">Paychex</MenuItem>
          <MenuItem value="QUICKBOOKS">QuickBooks Payroll</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={save}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>Save Settings</Button>
      </Box>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default HrAdminConsolePage;
