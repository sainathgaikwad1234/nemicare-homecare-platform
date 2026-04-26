import React, { useState, useEffect } from 'react';
import {
  Box, Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField,
  Select, MenuItem, FormControl, InputLabel, Button, IconButton, Typography,
  Snackbar, Alert,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { employeeService, Employee } from '../../services/employee.service';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (employee: any) => void;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Box sx={{ bgcolor: '#f3f4f6', px: 2, py: 1.25, mb: 2, borderRadius: 1 }}>
    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>{title}</Typography>
  </Box>
);

const emptyForm = {
  // Account Details
  employeeIdNumber: '',
  firstName: '',
  lastName: '',
  salutation: '',
  email: '',
  userRole: 'EMPLOYEE',
  designation: '',
  department: '',
  phone: '',
  country: 'United States',
  gender: '',
  hireDate: new Date().toISOString().split('T')[0],
  reportingManagerId: '' as string | number,
  language: 'English',
  about: '',
  profilePictureUrl: '',
  // Other Details
  address: '',
  addressLine2: '',
  city: '',
  state: '',
  zip: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
};

export const AddEmployeeDialog: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const { user } = useAuth();
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'success' });

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    // Load potential reporting managers (Active employees)
    employeeService.listEmployees({ status: 'ACTIVE', pageSize: 200 }).then((res) => {
      if (res.success && Array.isArray(res.data)) setManagers(res.data);
    });
  }, [open]);

  const handleChange = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  const validate = (): string | null => {
    if (!form.firstName.trim()) return 'Employee Name is required';
    if (!form.email.trim()) return 'Employee Email is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Email format is invalid';
    if (!form.employeeIdNumber.trim()) return 'Employee ID is required';
    if (!form.userRole) return 'User Role is required';
    if (!form.designation.trim()) return 'Designation is required';
    if (!form.department.trim()) return 'Department is required';
    if (!form.phone.trim()) return 'Phone Number is required';
    if (!form.country) return 'Country is required';
    if (!form.gender) return 'Gender is required';
    if (!form.hireDate) return 'Joining Date is required';
    if (!form.reportingManagerId) return 'Reporting To is required';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setSnackbar({ open: true, message: err, severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        companyId: user?.companyId,
        facilityId: user?.facilityId,
        reportingManagerId: form.reportingManagerId ? Number(form.reportingManagerId) : undefined,
        joiningDate: form.hireDate,
      };
      const res = await employeeService.createEmployee(payload);
      if (res.success) {
        onCreated(res.data);
      } else {
        setSnackbar({ open: true, message: 'Failed to create employee', severity: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Save failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleNameChange = (full: string) => {
    // Split single name field into first/last (everything after first space → last)
    const trimmed = full.trim();
    const parts = trimmed.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    setForm((f: any) => ({ ...f, firstName, lastName, _displayName: full }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', pb: 1.5 }}>
        <Typography sx={{ fontWeight: 600, color: '#111827' }}>Add Employee</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <SectionHeader title="Account Details" />

        {/* Profile Picture */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>Profile Picture</Typography>
          <Box
            sx={{
              border: '1px dashed #1e3a5f', borderRadius: 1, p: 2, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 1, color: '#1e3a5f', cursor: 'pointer',
              minHeight: 50,
            }}
          >
            <UploadIcon fontSize="small" />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>Upload Profile Picture</Typography>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <TextField
              label="Employee ID" placeholder="eg.996" fullWidth size="small" required
              value={form.employeeIdNumber} onChange={(e) => handleChange('employeeIdNumber', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Employee Name" placeholder="Add Employee Name" fullWidth size="small" required
              value={form._displayName ?? `${form.firstName}${form.lastName ? ' ' + form.lastName : ''}`}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Salutation</InputLabel>
              <Select label="Salutation" value={form.salutation} onChange={(e) => handleChange('salutation', e.target.value)}>
                <MenuItem value="">—</MenuItem>
                <MenuItem value="Mr.">Mr.</MenuItem>
                <MenuItem value="Mrs.">Mrs.</MenuItem>
                <MenuItem value="Ms.">Ms.</MenuItem>
                <MenuItem value="Dr.">Dr.</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Employee Email" placeholder="sample@example.com" type="email" fullWidth size="small" required
              value={form.email} onChange={(e) => handleChange('email', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>User Role</InputLabel>
              <Select label="User Role" value={form.userRole} onChange={(e) => handleChange('userRole', e.target.value)}>
                <MenuItem value="EMPLOYEE">Employee</MenuItem>
                <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                <MenuItem value="HR_ADMIN">HR Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Designation" placeholder="e.g., Registered Nurse" fullWidth size="small" required
              value={form.designation} onChange={(e) => handleChange('designation', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Department" placeholder="e.g., Clinical" fullWidth size="small" required
              value={form.department} onChange={(e) => handleChange('department', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Phone Number" placeholder="(406) 555-0120" fullWidth size="small" required
              value={form.phone} onChange={(e) => handleChange('phone', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Country</InputLabel>
              <Select label="Country" value={form.country} onChange={(e) => handleChange('country', e.target.value)}>
                <MenuItem value="United States">🇺🇸 United States</MenuItem>
                <MenuItem value="India">🇮🇳 India</MenuItem>
                <MenuItem value="Canada">🇨🇦 Canada</MenuItem>
                <MenuItem value="United Kingdom">🇬🇧 United Kingdom</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Gender</InputLabel>
              <Select label="Gender" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Joining Date" type="date" fullWidth size="small" required
              InputLabelProps={{ shrink: true }}
              value={form.hireDate} onChange={(e) => handleChange('hireDate', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small" required>
              <InputLabel>Reporting To</InputLabel>
              <Select
                label="Reporting To"
                value={form.reportingManagerId}
                onChange={(e) => handleChange('reportingManagerId', e.target.value)}
              >
                <MenuItem value="">—</MenuItem>
                {managers.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} {m.designation ? `(${m.designation})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select label="Language" value={form.language} onChange={(e) => handleChange('language', e.target.value)}>
                <MenuItem value="English">🇺🇸 English</MenuItem>
                <MenuItem value="Spanish">🇪🇸 Spanish</MenuItem>
                <MenuItem value="Hindi">🇮🇳 Hindi</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="About" placeholder="Enter" fullWidth size="small" multiline minRows={2}
              value={form.about} onChange={(e) => handleChange('about', e.target.value)}
            />
          </Grid>
        </Grid>

        <SectionHeader title="Other Details" />

        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid item xs={6}>
            <TextField label="Address Line 1" fullWidth size="small"
              value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Address Line 2" fullWidth size="small"
              value={form.addressLine2} onChange={(e) => handleChange('addressLine2', e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="City" fullWidth size="small"
              value={form.city} onChange={(e) => handleChange('city', e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="State" fullWidth size="small"
              value={form.state} onChange={(e) => handleChange('state', e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Zip Code" fullWidth size="small"
              value={form.zip} onChange={(e) => handleChange('zip', e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" sx={{ color: '#6b7280', mt: 1, display: 'block', fontWeight: 500 }}>
              Emergency Contact
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <TextField label="Name" fullWidth size="small"
              value={form.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Phone" fullWidth size="small"
              value={form.emergencyContactPhone} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Relation" fullWidth size="small"
              value={form.emergencyContactRelation} onChange={(e) => handleChange('emergencyContactRelation', e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e5e7eb' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#374151' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', minWidth: 100 }}
        >
          {saving ? 'Saving...' : 'Save'}
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
