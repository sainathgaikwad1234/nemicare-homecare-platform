import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, IconButton, Tabs, Tab,
  Grid, CircularProgress, Snackbar, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon, MailOutline as MailIcon, Phone as PhoneIcon,
  Place as PlaceIcon, Wc as GenderIcon, ChevronRight as ChevronRightIcon,
  CheckCircle as CheckIcon, Delete as DeleteIcon, Visibility as ViewIcon,
  Edit as EditIcon, Send as SendIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { onboardingService, OnboardingState } from '../../services/onboarding.service';
import { employeeService, Employee } from '../../services/employee.service';

const STEP1_DOC_LABELS: Record<string, string> = {
  BACKGROUND_CHECK_REPORT: 'Background Check Report',
  DRUG_SCREEN_REPORT: 'Drug Screen Report',
  DMV_BACKGROUND_CHECK: 'DMV/Background Checks',
};
const STEP1_DOC_TYPES = ['BACKGROUND_CHECK_REPORT', 'DRUG_SCREEN_REPORT', 'DMV_BACKGROUND_CHECK'];

const STEP2_SLOTS: { slot: string; label: string }[] = [
  { slot: 'LICENSES', label: 'Licenses' },
  { slot: 'CPR_CERTIFICATES', label: 'CPR certificates' },
  { slot: 'TB_TESTS', label: 'TB tests' },
  { slot: 'I9_W4_FORMS', label: 'I9 (W4) forms' },
  { slot: 'VISA_DETAILS', label: 'Visa Details' },
];

export const OnboardingProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0=Employee Info, 1=Documentation
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [activateOpen, setActivateOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [empRes, stateRes] = await Promise.all([
        employeeService.getEmployeeById(Number(id)),
        onboardingService.getState(Number(id)),
      ]);
      if (empRes.success && empRes.data) setEmployee(empRes.data);
      if (stateRes.success && stateRes.data) setState(stateRes.data);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to load', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSendWelcome = async () => {
    if (!id) return;
    try {
      await onboardingService.sendWelcomeEmail(Number(id));
      setSnackbar({ open: true, message: 'Welcome email sent', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    }
  };

  if (loading || !employee || !state) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();
  const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
  const fullAddress = [employee.address, employee.city, employee.state, employee.zip].filter(Boolean).join(', ');
  const welcomeAlreadySent = state.welcomeEmailHistory.length > 0;
  const currentStep = state.onboardingStep || 1;

  return (
    <Box sx={{ p: 3 }}>
      {/* Back link */}
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/hrms/onboarding')}
          sx={{ textTransform: 'none', color: '#6b7280' }}
        >
          Back to Employees
        </Button>
      </Box>

      {/* Header card */}
      <Paper sx={{ p: 2.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={employee.profilePictureUrl}
              sx={{ width: 64, height: 64, bgcolor: '#3b82f6', fontSize: '1.4rem' }}
            >
              {initials}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a5f' }}>{fullName}</Typography>
                <Chip
                  label="In-progress"
                  size="small"
                  sx={{ bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 500, height: 22, fontSize: '0.7rem' }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5, color: '#6b7280', fontSize: '0.8rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><MailIcon sx={{ fontSize: 14 }} />{employee.email}</Box>
                {employee.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PhoneIcon sx={{ fontSize: 14 }} />{employee.phone}</Box>}
                {employee.gender && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><GenderIcon sx={{ fontSize: 14 }} />{employee.gender}</Box>}
                {fullAddress && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PlaceIcon sx={{ fontSize: 14 }} />{fullAddress}</Box>}
              </Box>
            </Box>
          </Box>

          {/* Send Welcome Email card */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, bgcolor: '#f8fafc', borderRadius: 1, minWidth: 380 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MailIcon sx={{ fontSize: 18, color: '#1e3a5f' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e3a5f' }}>Send Welcome Email</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', lineHeight: 1.3 }}>
                Includes login credentials, first-day instructions, and company handbook.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={handleSendWelcome}
              sx={{ borderColor: '#1e3a5f', color: '#1e3a5f', textTransform: 'none' }}
            >
              {welcomeAlreadySent ? 'Resend' : 'Send'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          minHeight: 32, mb: 2,
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root': {
            minHeight: 30, padding: '4px 14px', fontSize: '0.85rem',
            textTransform: 'none', borderRadius: 999, color: '#6b7280', fontWeight: 500,
            '&.Mui-selected': { bgcolor: '#eff4fb', color: '#1e3a5f', fontWeight: 600 },
          },
        }}
      >
        <Tab label="Employee Information" />
        <Tab label="Documentation" />
      </Tabs>

      {activeTab === 0 && <EmployeeInformationTab employee={employee} />}
      {activeTab === 1 && (
        <DocumentationTab
          employee={employee}
          state={state}
          currentStep={currentStep}
          onChange={load}
          onActivate={() => setActivateOpen(true)}
        />
      )}

      {/* Activate confirmation modal (Step 3 final action) */}
      <Dialog open={activateOpen} onClose={() => setActivateOpen(false)} maxWidth="xs" fullWidth>
        <ActivateDialog
          employee={employee}
          state={state}
          onCancel={() => setActivateOpen(false)}
          onSuccess={() => {
            setActivateOpen(false);
            setSnackbar({ open: true, message: 'Employee activated', severity: 'success' });
            navigate('/hrms/employees');
          }}
        />
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

// ============================================
// Employee Information Tab
// ============================================
const EmployeeInformationTab: React.FC<{ employee: Employee }> = ({ employee }) => {
  const calcAge = (dob?: string) => {
    if (!dob) return null;
    const b = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
    return age;
  };
  return (
    <Paper sx={{ p: 3, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e3a5f' }}>Employee Information</Typography>
        <Button startIcon={<EditIcon />} variant="outlined" size="small" sx={{ textTransform: 'none' }}>
          Edit Info
        </Button>
      </Box>

      <Section title="Account Details">
        <Field label="Full Name" value={`${employee.firstName || ''} ${employee.middleName || ''} ${employee.lastName || ''}`.trim() || '—'} />
        <Field label="Date of Birth" value={employee.dob ? new Date(employee.dob).toLocaleDateString() : '—'} />
        <Field label="Age" value={calcAge(employee.dob)?.toString() ?? '—'} />
        <Field label="Gender" value={employee.gender || '—'} />
        <Field label="Language Preference" value={(employee as any).language || '—'} />
        <Field label="Job" value={employee.employeeIdNumber || '—'} />
      </Section>

      <Divider sx={{ my: 3 }} />

      <Section title="Other Details">
        <Field label="Address Line 1" value={employee.address || '—'} />
        <Field label="Address Line 2" value={(employee as any).addressLine2 || '—'} />
        <Field label="City" value={employee.city || '—'} />
        <Field label="State" value={employee.state || '—'} />
        <Field label="Zip Code" value={employee.zip || '—'} />
        <Field label="Probation End Date" value={(employee as any).probationEndDate ? new Date((employee as any).probationEndDate).toLocaleDateString() : '—'} />
        <Field label="Notice End Date" value={(employee as any).noticeEndDate ? new Date((employee as any).noticeEndDate).toLocaleDateString() : '—'} />
        <Field label="Slack Member ID" value={(employee as any).slackMemberId || '—'} />
        <Field label="Marital Status" value={(employee as any).maritalStatus || '—'} />
        <Field label="Business Address" value={(employee as any).businessAddress || '—'} />
      </Section>
    </Paper>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box>
    <Box sx={{ bgcolor: '#f3f4f6', px: 2, py: 1, mb: 2, borderRadius: 1 }}>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{title}</Typography>
    </Box>
    <Grid container spacing={2.5} sx={{ px: 1 }}>{children}</Grid>
  </Box>
);

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Grid item xs={6} sm={4} md={3}>
    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.25 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>{value}</Typography>
  </Grid>
);

// ============================================
// Documentation Tab — 3-step stepper
// ============================================
const DocumentationTab: React.FC<{
  employee: Employee;
  state: OnboardingState;
  currentStep: number;
  onChange: () => void;
  onActivate: () => void;
}> = ({ employee, state, currentStep, onChange, onActivate }) => {
  const steps = [
    { num: 1, label: 'Pre-Employment Screening' },
    { num: 2, label: 'Mandatory Document Collection' },
    { num: 3, label: 'Employment Activation' },
  ];

  return (
    <Paper sx={{ p: 3, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
      {/* Stepper */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 2, borderBottom: '1px solid #e5e7eb', mb: 3 }}>
        {steps.map((s, idx) => {
          const isPast = currentStep > s.num;
          const isActive = currentStep === s.num;
          return (
            <React.Fragment key={s.num}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: isActive ? '3px solid #1e3a5f' : 'none',
                    bgcolor: isPast ? '#10b981' : isActive ? '#fff' : '#e5e7eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isPast && <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 500 }}>STEP {s.num}</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: isActive || isPast ? 600 : 400, color: isActive ? '#1e3a5f' : '#374151' }}>
                    {s.label}
                  </Typography>
                </Box>
              </Box>
              {idx < steps.length - 1 && <ChevronRightIcon sx={{ color: '#9ca3af' }} />}
            </React.Fragment>
          );
        })}
      </Box>

      {currentStep === 1 && <Step1Panel employeeId={employee.id!} state={state} onChange={onChange} />}
      {currentStep === 2 && <Step2Panel employeeId={employee.id!} state={state} onChange={onChange} />}
      {currentStep === 3 && <Step3Panel employeeId={employee.id!} state={state} onActivate={onActivate} onChange={onChange} />}
    </Paper>
  );
};

// === Step 1 — Pre-Employment Screening ===
const Step1Panel: React.FC<{ employeeId: number; state: OnboardingState; onChange: () => void }> = ({ employeeId, state, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const docsByType = (type: string) => state.step1.documents.find((d) => d.documentType === type);

  const ensureDoc = async (type: string): Promise<number | null> => {
    const existing = docsByType(type);
    if (existing) return existing.id;
    const res = await onboardingService.addStep1Doc(employeeId, type);
    if (res.success && res.data) return res.data.id;
    return null;
  };

  const handleSend = async (type: string) => {
    setBusy(true);
    try {
      const docId = await ensureDoc(type);
      if (!docId) throw new Error('Could not create document');
      await onboardingService.sendStep1Doc(employeeId, docId);
      setSnackbar({ open: true, message: 'Document sent', severity: 'success' });
      onChange();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // For demo: a "mark complete" simulating what would happen when the employee uploads a signed doc
  const handleMarkComplete = async (docId: number) => {
    setBusy(true);
    try {
      await onboardingService.completeStep1Doc(employeeId, docId, 'placeholder://uploaded');
      setSnackbar({ open: true, message: 'Marked complete', severity: 'success' });
      onChange();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (docId: number) => {
    setBusy(true);
    try {
      await onboardingService.deleteStep1Doc(employeeId, docId);
      onChange();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleSatisfactory = async () => {
    setBusy(true);
    try {
      await onboardingService.markSatisfactory(employeeId);
      setSnackbar({ open: true, message: 'Marked satisfactory — proceed to Step 2', severity: 'success' });
      onChange();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const allComplete = state.step1.allComplete;

  return (
    <Box>
      {/* Document Share & Sign */}
      <Box sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 1, mb: 2 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 1.5 }}>Document Share & Sign</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {STEP1_DOC_TYPES.map((type) => {
            const doc = docsByType(type);
            return (
              <Box key={type} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px solid #e5e7eb', borderRadius: 1, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 24, height: 24, bgcolor: '#f3f4f6', borderRadius: 0.5 }} />
                  <Typography sx={{ fontSize: '0.875rem' }}>{STEP1_DOC_LABELS[type]}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {doc?.status === 'COMPLETE' ? (
                    <>
                      <Chip
                        icon={<CheckIcon sx={{ fontSize: 14, color: '#065f46 !important' }} />}
                        label="Complete"
                        size="small"
                        sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 500, height: 22, fontSize: '0.7rem' }}
                      />
                      <Button size="small" startIcon={<ViewIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none' }}>View</Button>
                      <IconButton size="small" disabled={busy} onClick={() => handleDelete(doc.id)} sx={{ color: '#ef4444' }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </>
                  ) : doc?.status === 'SENT' ? (
                    <>
                      <Button size="small" disabled={busy} variant="outlined" onClick={() => handleMarkComplete(doc.id)} sx={{ textTransform: 'none' }}>
                        Mark Complete
                      </Button>
                      <IconButton size="small" disabled={busy} onClick={() => handleDelete(doc.id)} sx={{ color: '#ef4444' }}>
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <Button
                        size="small"
                        endIcon={<SendIcon sx={{ fontSize: 14 }} />}
                        disabled={busy}
                        onClick={() => handleSend(type)}
                        sx={{ textTransform: 'none', color: '#1e3a5f' }}
                      >
                        Send
                      </Button>
                      {doc && (
                        <IconButton size="small" disabled={busy} onClick={() => handleDelete(doc.id)} sx={{ color: '#ef4444' }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Background Agency Routing */}
      <Box sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 1, mb: 3 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 1.5 }}>Background Agency Routing</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Location</InputLabel>
              <Select label="Location" defaultValue="">
                <MenuItem value="">Select location</MenuItem>
                <MenuItem value="Washington">Washington</MenuItem>
                <MenuItem value="Georgia">Georgia</MenuItem>
                <MenuItem value="Texas">Texas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Agency Name</InputLabel>
              <Select label="Agency Name" defaultValue="">
                <MenuItem value="">Select agency</MenuItem>
                <MenuItem value="ABC Background Services">ABC Background Services</MenuItem>
                <MenuItem value="StateCheck Inc.">StateCheck Inc.</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1, borderTop: '1px solid #e5e7eb', mt: 2 }}>
        <Button
          variant={allComplete ? 'contained' : 'outlined'}
          disabled={!allComplete || busy}
          onClick={handleSatisfactory}
          endIcon={<ChevronRightIcon />}
          sx={{
            textTransform: 'none',
            ...(allComplete ? { bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' } } : { borderColor: '#1e3a5f', color: '#1e3a5f' }),
          }}
        >
          {allComplete ? 'Mark as Satisfactory' : 'Next'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

// === Step 2 — Mandatory Document Collection ===
const Step2Panel: React.FC<{ employeeId: number; state: OnboardingState; onChange: () => void }> = ({ employeeId, state, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const docBySlot = (slot: string) => state.step2.mandatoryDocs.find((d) => d.slot === slot);

  const handleUpload = async (slot: string) => {
    setBusy(true);
    try {
      // Phase 1: stub upload (real file upload is Phase 1.5)
      await onboardingService.uploadMandatoryDoc(employeeId, slot, `placeholder://${slot.toLowerCase()}.pdf`);
      setSnackbar({ open: true, message: 'Uploaded', severity: 'success' });
      onChange();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleNext = async () => {
    setBusy(true);
    try {
      await onboardingService.advanceToStep3(employeeId);
      onChange();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message, severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Box sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 1, mb: 3 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 1.5 }}>Documents Upload</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {STEP2_SLOTS.map(({ slot, label }) => {
            const doc = docBySlot(slot);
            return (
              <Box key={slot} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, border: '1px solid #e5e7eb', borderRadius: 1, bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 24, height: 24, bgcolor: '#f3f4f6', borderRadius: 0.5 }} />
                  <Typography sx={{ fontSize: '0.875rem' }}>{label}</Typography>
                </Box>
                {doc ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Uploaded" size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 500, height: 22, fontSize: '0.7rem' }} />
                    <Button size="small" sx={{ textTransform: 'none' }} onClick={() => handleUpload(slot)}>Replace</Button>
                  </Box>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busy}
                    onClick={() => handleUpload(slot)}
                    sx={{ textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f' }}
                  >
                    Upload
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1, borderTop: '1px solid #e5e7eb', mt: 2, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          sx={{ textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f' }}
          disabled
        >
          Previous
        </Button>
        <Button
          variant="contained"
          endIcon={<ChevronRightIcon />}
          disabled={busy || state.step2.slotsCompleted.length === 0}
          onClick={handleNext}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
        >
          Next
        </Button>
      </Box>

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

// === Step 3 — Employment Activation ===
const Step3Panel: React.FC<{ employeeId: number; state: OnboardingState; onActivate: () => void; onChange: () => void }> = ({ state, onActivate }) => {
  const summary = state.step3.summary;
  return (
    <Box>
      <Box sx={{ bgcolor: '#f9fafb', p: 2, borderRadius: 1, mb: 3 }}>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 1.5 }}>Employee Summary</Typography>
        <Grid container spacing={2.5}>
          <Field label="Name" value={summary.name || '—'} />
          <Field label="Department" value={summary.department || '—'} />
          <Field label="Job Title" value={summary.jobTitle || '—'} />
          <Field label="Supervisor" value={summary.supervisor || '—'} />
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1, borderTop: '1px solid #e5e7eb', mt: 2, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          sx={{ textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f' }}
          disabled
        >
          Previous
        </Button>
        <Button
          variant="contained"
          onClick={onActivate}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
        >
          Convert to Active
        </Button>
      </Box>
    </Box>
  );
};

// === Activate confirmation modal ===
const ActivateDialog: React.FC<{ employee: Employee; state: OnboardingState; onCancel: () => void; onSuccess: () => void }> = ({ employee, state, onCancel, onSuccess }) => {
  const [officialStartDate, setOfficialStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [busy, setBusy] = useState(false);

  const handleDone = async () => {
    if (!officialStartDate) return;
    setBusy(true);
    try {
      await onboardingService.activate(employee.id!, officialStartDate);
      onSuccess();
    } catch (e: any) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const summary = state.step3.summary;

  return (
    <>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckIcon sx={{ fontSize: 16, color: '#1e3a5f' }} />
        </Box>
        <Typography sx={{ fontWeight: 600 }}>Convert to Active —</Typography>
        <Avatar
          src={employee.profilePictureUrl}
          sx={{ width: 24, height: 24, fontSize: '0.7rem', ml: 0.5 }}
        >
          {employee.firstName?.[0]}
        </Avatar>
        <Typography sx={{ fontWeight: 600 }}>{employee.firstName} {employee.lastName}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Convert to Active?</Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>
          Are you sure you want to convert this employee to active?
        </Typography>
        <Box sx={{ bgcolor: '#f9fafb', borderRadius: 1, p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>Department</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{summary.department || '—'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>Supervisor</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{summary.supervisor || '—'}</Typography>
            </Grid>
          </Grid>
        </Box>
        <TextField
          label="Official Start Date"
          type="date"
          fullWidth size="small"
          required
          InputLabelProps={{ shrink: true }}
          value={officialStartDate}
          onChange={(e) => setOfficialStartDate(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} sx={{ textTransform: 'none' }}>Close</Button>
        <Button
          variant="contained"
          onClick={handleDone}
          disabled={busy}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
        >
          {busy ? 'Activating...' : 'Done'}
        </Button>
      </DialogActions>
    </>
  );
};

export default OnboardingProfilePage;
