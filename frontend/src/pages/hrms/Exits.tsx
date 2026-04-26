import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, Tabs, Tab, IconButton,
  Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem, TextField,
  Autocomplete, Switch, FormControlLabel,
} from '@mui/material';
import {
  ExitToApp as ExitIcon, Add as AddIcon, Close as CloseIcon,
  Check as CheckIcon, ChevronRight,
} from '@mui/icons-material';
import { exitService, ExitRecord, AssetReturnItem } from '../../services/phase4.service';
import { employeeService, Employee } from '../../services/employee.service';

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  INITIATED: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  IN_PROGRESS: { label: 'In Progress', bg: '#fef3c7', color: '#92400e' },
  COMPLETED: { label: 'Completed', bg: '#d1fae5', color: '#065f46' },
};

const tabs: { label: string; status: string }[] = [
  { label: 'All', status: '' },
  { label: 'Approved', status: 'COMPLETED' },
  { label: 'Pending', status: 'PENDING' },
  { label: 'Rejected', status: 'REJECTED' },
];

export const ExitsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [exits, setExits] = useState<ExitRecord[]>([]);
  const [selected, setSelected] = useState<ExitRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [openInitiate, setOpenInitiate] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await exitService.list(tabs[activeTab].status);
      if (res.success && Array.isArray(res.data)) {
        setExits(res.data);
        if (res.data.length > 0 && !selected) setSelected(res.data[0]);
      } else { setExits([]); }
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, selected]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExitIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Exit Management</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => { setActiveTab(v); setSelected(null); }}
              sx={{
                minHeight: 30,
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTab-root': {
                  minHeight: 28, padding: '4px 12px', fontSize: '0.78rem',
                  textTransform: 'none', borderRadius: 999, color: '#6b7280', fontWeight: 500,
                  '&.Mui-selected': { bgcolor: '#1e3a5f', color: '#fff', fontWeight: 600 },
                },
              }}
            >
              {tabs.map((t) => <Tab key={t.label} label={t.label} />)}
            </Tabs>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => setOpenInitiate(true)}
              sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', ml: 1 }}
            >
              Initiate Exit
            </Button>
          </Box>
        </Box>

        {/* Two-pane layout */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 480 }}>
            {/* Left: list */}
            <Box sx={{ p: 2, borderRight: '1px solid #f3f4f6', overflowY: 'auto', maxHeight: '70vh' }}>
              {exits.length === 0 ? (
                <Typography sx={{ textAlign: 'center', py: 6, color: '#6b7280' }}>No exit records.</Typography>
              ) : exits.map((exit) => {
                const emp = exit.employee;
                const initials = `${emp?.firstName?.[0] || ''}${emp?.lastName?.[0] || ''}`.toUpperCase();
                const sStyle = STATUS_STYLES[exit.status] || STATUS_STYLES.INITIATED;
                const isSelected = selected?.id === exit.id;
                return (
                  <Box
                    key={exit.id}
                    onClick={() => setSelected(exit)}
                    sx={{
                      p: 2, mb: 1.5, border: `2px solid ${isSelected ? '#1e3a5f' : '#e5e7eb'}`,
                      borderRadius: 1, cursor: 'pointer',
                      bgcolor: isSelected ? '#eff4fb' : '#fff',
                      '&:hover': { bgcolor: '#f9fafb' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={emp?.profilePictureUrl} sx={{ width: 40, height: 40 }}>{initials}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{emp?.firstName} {emp?.lastName}</Typography>
                          <Chip label={sStyle.label} size="small" sx={{ bgcolor: sStyle.bg, color: sStyle.color, height: 20, fontSize: '0.7rem' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{emp?.employeeIdNumber || emp?.id}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>Role</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{emp?.clinicalRole || emp?.designation || '—'}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>Last Day</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{new Date(exit.lastWorkingDay).toLocaleDateString()}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>Reason</Typography>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{exit.exitType}</Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* Right: stepper */}
            <Box sx={{ p: 2 }}>
              {selected ? (
                <ExitStepper exit={selected} onChange={() => load()} onSnackbar={setSnackbar} />
              ) : (
                <Box sx={{ textAlign: 'center', py: 6, color: '#9ca3af' }}>
                  <Typography>Select an exit record to view details.</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      <InitiateExitDialog
        open={openInitiate}
        onClose={() => setOpenInitiate(false)}
        onSuccess={() => { setOpenInitiate(false); load(); setSnackbar({ open: true, message: 'Exit initiated', severity: 'success' }); }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

// ===== Exit Stepper =====
const ExitStepper: React.FC<{
  exit: ExitRecord;
  onChange: () => void;
  onSnackbar: (s: any) => void;
}> = ({ exit, onChange, onSnackbar }) => {
  const DEFAULT_ASSETS: AssetReturnItem[] = [
    { name: 'Laptop', returned: false },
    { name: 'ID Badge', returned: false },
    { name: 'Office Keys', returned: false },
    { name: 'Mobile Phone', returned: false },
    { name: 'Uniform / PPE', returned: false },
    { name: 'Access Cards', returned: false },
  ];

  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState(exit.exitInterviewNotes || '');
  const [interviewDate, setInterviewDate] = useState(exit.exitInterviewDate ? exit.exitInterviewDate.split('T')[0] : '');
  const [finalPay, setFinalPay] = useState(exit.finalPayAmount ? Number(exit.finalPayAmount) : 0);
  const [benefitsTerminated, setBenefitsTerminated] = useState(exit.benefitsTerminated);
  const [portalRevoked, setPortalRevoked] = useState(exit.portalAccessRevoked);
  const [assetReturns, setAssetReturns] = useState<AssetReturnItem[]>(
    Array.isArray(exit.assetReturns) && exit.assetReturns.length > 0 ? exit.assetReturns : DEFAULT_ASSETS,
  );
  const [newAssetName, setNewAssetName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotes(exit.exitInterviewNotes || '');
    setInterviewDate(exit.exitInterviewDate ? exit.exitInterviewDate.split('T')[0] : '');
    setFinalPay(exit.finalPayAmount ? Number(exit.finalPayAmount) : 0);
    setBenefitsTerminated(exit.benefitsTerminated);
    setPortalRevoked(exit.portalAccessRevoked);
    setAssetReturns(Array.isArray(exit.assetReturns) && exit.assetReturns.length > 0 ? exit.assetReturns : DEFAULT_ASSETS);
    setStep(0);
  }, [exit.id]);

  const isCompleted = exit.status === 'COMPLETED';

  const saveStep = async (data: any) => {
    setBusy(true);
    try {
      await exitService.update(exit.id, data);
      onSnackbar({ open: true, message: 'Saved', severity: 'success' });
      onChange();
    } catch (e: any) {
      onSnackbar({ open: true, message: e.message || 'Save failed', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleFinalize = async () => {
    setBusy(true);
    try {
      await exitService.finalize(exit.id);
      onSnackbar({ open: true, message: 'Exit finalized — employee terminated', severity: 'success' });
      onChange();
    } catch (e: any) {
      onSnackbar({ open: true, message: e.message || 'Finalize failed', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const steps = ['Exit Interview', 'Final Pay', 'Asset Returns', 'Benefits', 'Portal Access', 'Finalize'];

  return (
    <Box>
      {/* Stepper bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {steps.map((label, i) => (
          <React.Fragment key={label}>
            <Box
              onClick={() => setStep(i)}
              sx={{
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5,
                color: step === i ? '#1e3a5f' : '#6b7280',
              }}
            >
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%',
                bgcolor: step === i ? '#1e3a5f' : '#e5e7eb',
                color: step === i ? '#fff' : '#374151',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 600,
              }}>{i + 1}</Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: step === i ? 600 : 500 }}>{label}</Typography>
            </Box>
            {i < steps.length - 1 && <ChevronRight sx={{ color: '#9ca3af', fontSize: 16 }} />}
          </React.Fragment>
        ))}
      </Box>

      {/* Step content */}
      {step === 0 && (
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Exit Interview</Typography>
          <TextField
            label="Interview Date" type="date" fullWidth size="small"
            InputLabelProps={{ shrink: true }} sx={{ mb: 2 }}
            value={interviewDate} disabled={isCompleted}
            onChange={(e) => setInterviewDate(e.target.value)}
          />
          <TextField
            label="Interview Notes" fullWidth multiline minRows={5}
            placeholder="Feedback, reasons for leaving, suggestions, overall experience..."
            value={notes} disabled={isCompleted}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained" disabled={busy || isCompleted}
            onClick={() => saveStep({ exitInterviewNotes: notes, exitInterviewDate: interviewDate || null })}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            Save Interview
          </Button>
        </Box>
      )}

      {step === 1 && (
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Final Pay Calculation</Typography>
          <TextField
            label="Final Pay Amount ($)" type="number" fullWidth size="small"
            value={finalPay} disabled={isCompleted}
            onChange={(e) => setFinalPay(Number(e.target.value))}
            sx={{ mb: 2 }}
          />
          <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mb: 2 }}>
            Includes: remaining salary, unused PTO payout, deductions. Calculate manually for now (Phase 4 supports manual entry; auto-calc planned for Phase 5).
          </Typography>
          <Button
            variant="contained" disabled={busy || isCompleted}
            onClick={() => saveStep({ finalPayAmount: finalPay })}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            Save Pay Amount
          </Button>
        </Box>
      )}

      {step === 2 && (
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Asset Returns Checklist</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mb: 2 }}>
            Tick off each item as the employee returns it. Add custom items as needed.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            {assetReturns.map((a, idx) => (
              <Box key={idx} sx={{
                display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid #e5e7eb', borderRadius: 1,
                bgcolor: a.returned ? '#d1fae5' : '#fff',
              }}>
                <Switch
                  checked={a.returned} disabled={isCompleted}
                  onChange={(e) => {
                    const next = [...assetReturns];
                    next[idx] = {
                      ...next[idx],
                      returned: e.target.checked,
                      returnedAt: e.target.checked ? new Date().toISOString() : undefined,
                    };
                    setAssetReturns(next);
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, textDecoration: a.returned ? 'line-through' : 'none' }}>
                    {a.name}
                  </Typography>
                  {a.returnedAt && (
                    <Typography sx={{ fontSize: '0.7rem', color: '#065f46' }}>
                      Returned {new Date(a.returnedAt).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
                <TextField
                  size="small" placeholder="Notes" disabled={isCompleted}
                  value={a.notes || ''}
                  onChange={(e) => {
                    const next = [...assetReturns];
                    next[idx] = { ...next[idx], notes: e.target.value };
                    setAssetReturns(next);
                  }}
                  sx={{ width: 180 }}
                />
                {!isCompleted && (
                  <IconButton size="small" onClick={() => setAssetReturns(assetReturns.filter((_, i) => i !== idx))}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
          {!isCompleted && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small" placeholder="Add custom item (e.g., Company Card)"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined" startIcon={<AddIcon />}
                onClick={() => {
                  if (newAssetName.trim()) {
                    setAssetReturns([...assetReturns, { name: newAssetName.trim(), returned: false }]);
                    setNewAssetName('');
                  }
                }}
                sx={{ textTransform: 'none' }}
              >
                Add
              </Button>
            </Box>
          )}
          <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, mb: 2 }}>
            <Typography sx={{ fontSize: '0.8rem' }}>
              {assetReturns.filter((a) => a.returned).length} of {assetReturns.length} items returned
            </Typography>
          </Box>
          <Button
            variant="contained" disabled={busy || isCompleted}
            onClick={() => saveStep({ assetReturns })}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            Save Asset Returns
          </Button>
        </Box>
      )}

      {step === 3 && (
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Benefits Termination</Typography>
          <FormControlLabel
            control={<Switch checked={benefitsTerminated} disabled={isCompleted} onChange={(e) => setBenefitsTerminated(e.target.checked)} />}
            label="Terminate all benefits (health, dental, vision, retirement)"
          />
          <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mt: 1, mb: 2 }}>
            Will terminate effective on the last working day ({new Date(exit.lastWorkingDay).toLocaleDateString()}).
          </Typography>
          <Button
            variant="contained" disabled={busy || isCompleted}
            onClick={() => saveStep({ benefitsTerminated })}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            Save Benefits Status
          </Button>
        </Box>
      )}

      {step === 4 && (
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Portal Access Revocation</Typography>
          <FormControlLabel
            control={<Switch checked={portalRevoked} disabled={isCompleted} onChange={(e) => setPortalRevoked(e.target.checked)} />}
            label="Revoke portal access"
          />
          <Box sx={{ p: 1.5, bgcolor: '#fff7ed', borderRadius: 1, mt: 1.5, mb: 2 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#92400e' }}>
              ⚠ Portal access will be terminated when you click "Finalize" in the next step. The employee's user account will be deactivated.
            </Typography>
          </Box>
          <Button
            variant="contained" disabled={busy || isCompleted}
            onClick={() => saveStep({ portalAccessRevoked: portalRevoked })}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            Save Access Status
          </Button>
        </Box>
      )}

      {step === 5 && (
        <Box>
          <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Finalize Exit</Typography>
          <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 1, mb: 2 }}>
            <Typography sx={{ fontSize: '0.85rem', mb: 1 }}><strong>Summary:</strong></Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>• Last Working Day: {new Date(exit.lastWorkingDay).toLocaleDateString()}</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>• Exit Reason: {exit.exitReason}</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>• Final Pay: ${finalPay}</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>
              • Asset Returns: {assetReturns.filter((a) => a.returned).length} of {assetReturns.length} returned
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>• Benefits Terminated: {benefitsTerminated ? 'Yes' : 'No'}</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#374151' }}>• Portal Access Revoked: {portalRevoked ? 'Yes' : 'No'}</Typography>
          </Box>
          {isCompleted ? (
            <Box sx={{ p: 2, bgcolor: '#d1fae5', borderRadius: 1, color: '#065f46', display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon /> Exit completed on {exit.completedAt ? new Date(exit.completedAt).toLocaleDateString() : '—'}
            </Box>
          ) : (
            <Button
              variant="contained" color="error" disabled={busy}
              onClick={handleFinalize}
              sx={{ textTransform: 'none' }}
            >
              {busy ? 'Finalizing...' : 'Finalize Exit'}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

// ===== Initiate Exit Dialog =====
const InitiateExitDialog: React.FC<{ open: boolean; onClose: () => void; onSuccess: () => void }> = ({ open, onClose, onSuccess }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [exitType, setExitType] = useState('Voluntary');
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [exitReason, setExitReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'success' });

  useEffect(() => {
    if (open) {
      employeeService.listEmployees({ status: 'ACTIVE', pageSize: 200 }).then((r) => {
        if (r.success && Array.isArray(r.data)) setEmployees(r.data);
      });
      // Default last working day = 2 weeks out
      const d = new Date(); d.setDate(d.getDate() + 14);
      setLastWorkingDay(d.toISOString().split('T')[0]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!employeeId || !exitReason) {
      setSnackbar({ open: true, message: 'Employee and Exit Reason are required', severity: 'error' });
      return;
    }
    setBusy(true);
    try {
      await exitService.initiate({ employeeId, exitType, noticeDate, lastWorkingDay, exitReason });
      onSuccess();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Initiate failed', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>Initiate Exit</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Autocomplete
            options={employees}
            getOptionLabel={(o) => `${o.firstName || ''} ${o.lastName || ''}`.trim()}
            onChange={(_, val) => setEmployeeId(val?.id ?? null)}
            renderInput={(params) => <TextField {...params} label="Employee" size="small" required />}
          />
          <FormControl size="small">
            <InputLabel>Exit Type</InputLabel>
            <Select label="Exit Type" value={exitType} onChange={(e) => setExitType(e.target.value)}>
              <MenuItem value="Voluntary">Voluntary</MenuItem>
              <MenuItem value="Involuntary">Involuntary</MenuItem>
              <MenuItem value="Retirement">Retirement</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Notice Date" type="date" size="small" required
            InputLabelProps={{ shrink: true }}
            value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)}
          />
          <TextField
            label="Last Working Day" type="date" size="small" required
            InputLabelProps={{ shrink: true }}
            value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)}
          />
          <TextField
            label="Exit Reason" required size="small" fullWidth multiline minRows={3}
            value={exitReason} onChange={(e) => setExitReason(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={busy}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
        >
          {busy ? 'Initiating...' : 'Initiate'}
        </Button>
      </DialogActions>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ExitsPage;
