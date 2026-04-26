import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, IconButton, Tabs, Tab,
  Grid, CircularProgress, Snackbar, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Mail as MailIcon, Phone as PhoneIcon,
  Edit as EditIcon, Add as AddIcon, MoreVert as MoreIcon,
  Draw as SignIcon, CheckCircle as SignedIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService, Employee } from '../../services/employee.service';
import { EmployeeTestsPanel } from './EmployeeTestsPanel';

const calcAge = (dob?: string) => {
  if (!dob) return null;
  const b = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age;
};

const maskSsn = (ssn?: string) => (ssn ? `***-**-${ssn.slice(-4)}` : '—');

export const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showSsn, setShowSsn] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await employeeService.getEmployeeById(Number(id));
      if (res.success && res.data) setEmployee(res.data);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to load', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading || !employee) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();
  const fullName = `${employee.firstName || ''} ${employee.middleName || ''} ${employee.lastName || ''}`.replace(/\s+/g, ' ').trim();

  const tabs = [
    { label: 'Personal Details' },
    { label: 'Documents' },
    { label: 'Tests' },
    { label: 'Shifts' },
    { label: 'Leave History' },
    { label: 'Timecards' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/hrms/employees')}
          sx={{ textTransform: 'none', color: '#6b7280' }}
        >
          Back to Employees
        </Button>
      </Box>

      {/* Profile header */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a5f' }}>{fullName}</Typography>
                <Chip
                  label={`ID : ${employee.employeeIdNumber || employee.id}`}
                  size="small"
                  sx={{ bgcolor: '#dbeafe', color: '#1e3a5f', fontWeight: 500, height: 22, fontSize: '0.7rem' }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#6b7280', mb: 0.5 }}>
                {(employee as any).designation || (employee as any).clinicalRole || 'Employee'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, fontSize: '0.8rem', color: '#6b7280' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><MailIcon sx={{ fontSize: 14 }} />{employee.email}</Box>
                {employee.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PhoneIcon sx={{ fontSize: 14 }} />{employee.phone}</Box>}
              </Box>
            </Box>
          </Box>

          {/* Social icons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <SocialIcon bg="#0a66c2" letter="in" />
            <SocialIcon bg="#4a154b" letter="#" />
            <SocialIcon bg="#25d366" letter="W" />
            <SocialIcon bg="#000" letter="X" />
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            minHeight: 32,
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              minHeight: 30, padding: '4px 14px', fontSize: '0.85rem',
              textTransform: 'none', borderRadius: 999, color: '#6b7280', fontWeight: 500,
              '&.Mui-selected': { bgcolor: '#eff4fb', color: '#1e3a5f', fontWeight: 600 },
            },
          }}
        >
          {tabs.map((t) => <Tab key={t.label} label={t.label} />)}
        </Tabs>
        {activeTab === 0 && (
          <Button startIcon={<EditIcon />} variant="outlined" size="small" sx={{ textTransform: 'none' }}>
            Edit Info
          </Button>
        )}
      </Box>

      {activeTab === 0 && <PersonalDetailsTab employee={employee} showSsn={showSsn} onToggleSsn={() => setShowSsn((s) => !s)} />}
      {activeTab === 1 && <DocumentsTab employee={employee} onReload={load} onSnackbar={setSnackbar} />}
      {activeTab === 2 && employee.id && <EmployeeTestsPanel employeeId={employee.id} />}
      {activeTab === 3 && <ShiftsTab />}
      {activeTab === 4 && <LeaveHistoryTab />}
      {activeTab === 5 && <TimecardsTab />}

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

const SocialIcon: React.FC<{ bg: string; letter: string }> = ({ bg, letter }) => (
  <Box sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
    <Typography sx={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>{letter}</Typography>
  </Box>
);

// ============================================
// Personal Details tab
// ============================================
const PersonalDetailsTab: React.FC<{ employee: Employee; showSsn: boolean; onToggleSsn: () => void }> = ({ employee, showSsn, onToggleSsn }) => {
  const age = calcAge(employee.dob);
  return (
    <Paper sx={{ p: 3, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
      <SectionTitle>Personal Details</SectionTitle>
      <Grid container spacing={2.5} sx={{ px: 1 }}>
        <FieldCell label="Date of Birth" value={employee.dob ? new Date(employee.dob).toLocaleDateString() : '—'} />
        <FieldCell label="Age" value={age?.toString() ?? '—'} />
        <FieldCell label="Gender" value={employee.gender || '—'} />
        <FieldCell label="Language Preference" value={(employee as any).language || '—'} />
        <Grid item xs={6} sm={4} md={3}>
          <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.25 }}>SSN</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {(employee as any).ssn ? (showSsn ? (employee as any).ssn : maskSsn((employee as any).ssn)) : '—'}
            </Typography>
            {(employee as any).ssn && (
              <Button size="small" sx={{ textTransform: 'none', minWidth: 0, p: 0, fontSize: '0.7rem' }} onClick={onToggleSsn}>
                {showSsn ? 'Hide' : 'Show'}
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <SectionTitle>Other Details</SectionTitle>
      <Grid container spacing={2.5} sx={{ px: 1 }}>
        <FieldCell label="Address Line 1" value={employee.address || '—'} />
        <FieldCell label="Address Line 2" value={(employee as any).addressLine2 || '—'} />
        <FieldCell label="City" value={employee.city || '—'} />
        <FieldCell label="State" value={employee.state || '—'} />
        <FieldCell label="Zip Code" value={employee.zip || '—'} />
        <FieldCell label="Probation End Date" value={(employee as any).probationEndDate ? new Date((employee as any).probationEndDate).toLocaleDateString() : '—'} />
        <FieldCell label="Notice End Date" value={(employee as any).noticeEndDate ? new Date((employee as any).noticeEndDate).toLocaleDateString() : '—'} />
        <FieldCell label="Slack Member ID" value={(employee as any).slackMemberId || '—'} />
        <FieldCell label="Marital Status" value={(employee as any).maritalStatus || '—'} />
        <FieldCell label="Business Address" value={(employee as any).businessAddress || '—'} />
      </Grid>
    </Paper>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ bgcolor: '#f3f4f6', px: 2, py: 1, mb: 2, borderRadius: 1 }}>
    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{children}</Typography>
  </Box>
);

const FieldCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Grid item xs={6} sm={4} md={3}>
    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.25 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>{value}</Typography>
  </Grid>
);

// ============================================
// Documents tab
// ============================================
const DocumentsTab: React.FC<{
  employee: Employee;
  onReload: () => void;
  onSnackbar: (s: { open: boolean; message: string; severity: 'success' | 'error' }) => void;
}> = ({ employee, onReload, onSnackbar }) => {
  const [subTab, setSubTab] = useState<'Mandatory' | 'Other'>('Mandatory');
  const [signDialog, setSignDialog] = useState<{ open: boolean; doc: any | null; signature: string }>({ open: false, doc: null, signature: '' });
  const [signing, setSigning] = useState(false);
  const docs = (employee as any).documents || [];
  const filtered = docs.filter((d: any) => (subTab === 'Mandatory' ? (d.category || 'Mandatory') === 'Mandatory' : d.category === 'Other'));

  const statusBadge = (doc: any) => {
    if (!doc.expiryDate) return { label: 'Active', bg: '#d1fae5', color: '#065f46' };
    const exp = new Date(doc.expiryDate).getTime();
    const now = Date.now();
    if (exp < now) return { label: 'Expired', bg: '#fee2e2', color: '#991b1b' };
    if (exp - now < 30 * 24 * 60 * 60 * 1000) return { label: 'Expiring Soon', bg: '#fef3c7', color: '#92400e' };
    return { label: 'Active', bg: '#d1fae5', color: '#065f46' };
  };

  const handleSign = async () => {
    if (!signDialog.doc || !signDialog.signature.trim()) {
      onSnackbar({ open: true, message: 'Type your full name to sign', severity: 'error' });
      return;
    }
    setSigning(true);
    try {
      const res = await employeeService.signDocument(employee.id!, signDialog.doc.id, signDialog.signature.trim());
      if (!res.success) throw new Error(res.error || 'Sign failed');
      onSnackbar({ open: true, message: 'Document signed', severity: 'success' });
      setSignDialog({ open: false, doc: null, signature: '' });
      onReload();
    } catch (e: any) {
      onSnackbar({ open: true, message: e.message || 'Sign failed', severity: 'error' });
    } finally {
      setSigning(false);
    }
  };

  return (
    <Paper sx={{ p: 3, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Documents</Typography>
          <Tabs
            value={subTab}
            onChange={(_, v) => setSubTab(v)}
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
            <Tab label="Mandatory" value="Mandatory" />
            <Tab label="Other" value="Other" />
          </Tabs>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          Add Document
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: '#6b7280' }}>
          <Typography variant="body2">No documents in this category yet.</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Uploaded Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Expiry Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Signature</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((doc: any) => {
                const badge = statusBadge(doc);
                return (
                  <TableRow key={doc.id} hover>
                    <TableCell sx={{ color: '#1e3a5f', fontWeight: 500, fontSize: '0.875rem' }}>{doc.documentName || doc.documentType}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.875rem' }}>{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={badge.label}
                        size="small"
                        sx={{ bgcolor: badge.bg, color: badge.color, fontWeight: 500, height: 20, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8rem' }}>
                      {doc.requiresSignature ? (
                        doc.signedAt ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <SignedIcon sx={{ fontSize: 16, color: '#10b981' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#065f46' }}>
                              Signed {new Date(doc.signedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<SignIcon sx={{ fontSize: 14 }} />}
                            onClick={() => setSignDialog({ open: true, doc, signature: '' })}
                            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', fontSize: '0.7rem', py: 0.25 }}
                          >
                            Sign
                          </Button>
                        )
                      ) : (
                        <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>—</Typography>
                      )}
                    </TableCell>
                    <TableCell><IconButton size="small"><MoreIcon fontSize="small" sx={{ fontSize: 16 }} /></IconButton></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Sign dialog */}
      <Dialog open={signDialog.open} onClose={() => setSignDialog({ open: false, doc: null, signature: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Sign Document</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 1 }}>
            Document: <strong>{signDialog.doc?.documentName || signDialog.doc?.documentType}</strong>
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#92400e', mb: 2 }}>
            Type your full legal name as your electronic signature. This is legally binding.
          </Typography>
          <TextField
            label="Full Legal Name" fullWidth size="small" autoFocus
            value={signDialog.signature}
            onChange={(e) => setSignDialog({ ...signDialog, signature: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignDialog({ open: false, doc: null, signature: '' })} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained" onClick={handleSign} disabled={signing}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            {signing ? 'Signing...' : 'Sign Document'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

const PlaceholderTab: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
    <Typography variant="h6" sx={{ color: '#374151', mb: 1 }}>{title}</Typography>
    <Typography variant="body2" color="text.secondary">{message}</Typography>
  </Paper>
);

const ShiftsTab: React.FC = () => <PlaceholderTab title="Recent Shifts" message="Shift schedule will appear here once Phase 2 (Shift Calendar) is built." />;
const LeaveHistoryTab: React.FC = () => <PlaceholderTab title="Leave History" message="Leave requests will appear here once Phase 2 (Leave Management) is built." />;
const TimecardsTab: React.FC = () => <PlaceholderTab title="Timecards" message="Timecards will appear here once Phase 3 (Timecard Auto-gen + EVV) is built." />;

export default EmployeeProfilePage;
