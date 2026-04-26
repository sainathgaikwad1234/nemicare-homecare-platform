import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, IconButton, Menu, MenuItem,
  CircularProgress, Snackbar, Alert, Grid, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Button,
} from '@mui/material';
import {
  Person as PersonIcon, MoreVert as MoreIcon, Mail as MailIcon, Phone as PhoneIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { meService } from '../../services/me.service';
import { Employee } from '../../services/employee.service';

const calcAge = (dob?: string) => {
  if (!dob) return null;
  const b = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age;
};

export const MeProfilePage: React.FC = () => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await meService.getProfile();
      if (res.success && res.data) setEmployee(res.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

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
  const age = calcAge(employee.dob);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Profile</Typography>
          </Box>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ border: '1px solid #e5e7eb', borderRadius: 2 }}>
            <MoreIcon fontSize="small" />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={() => { setEditOpen(true); setMenuAnchor(null); }}>Edit Details</MenuItem>
          </Menu>
        </Box>

        {/* Your Account */}
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', mb: 2 }}>Your Account</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Avatar
            src={employee.profilePictureUrl}
            sx={{ width: 96, height: 96, bgcolor: '#3b82f6', fontSize: '2rem' }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '1.4rem', fontWeight: 600, mb: 0.5, color: '#1e3a5f' }}>{fullName}</Typography>
            <Box sx={{ display: 'flex', gap: 2, color: '#6b7280', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><MailIcon sx={{ fontSize: 14 }} />{employee.email}</Box>
              {employee.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PhoneIcon sx={{ fontSize: 14 }} />{employee.phone}</Box>}
            </Box>
            <Grid container spacing={2}>
              <FieldCell label="Designation" value={(employee as any).designation || '—'} />
              <FieldCell label="Department" value={employee.department || '—'} />
              <FieldCell label="Supervisor" value={(employee as any).reportingManager
                ? `${(employee as any).reportingManager.firstName || ''} ${(employee as any).reportingManager.lastName || ''}`.trim()
                : '—'} />
            </Grid>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <SectionTitle>Personal Details</SectionTitle>
        <Grid container spacing={2.5} sx={{ px: 1, mb: 2 }}>
          <FieldCell label="Date of Birth" value={employee.dob ? new Date(employee.dob).toLocaleDateString() : '—'} />
          <FieldCell label="Age" value={age?.toString() ?? '—'} />
          <FieldCell label="Gender" value={employee.gender || '—'} />
          <FieldCell label="Language Preference" value={(employee as any).language || '—'} />
        </Grid>

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

      <EditDetailsDialog
        open={editOpen}
        employee={employee}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); load(); setSnackbar({ open: true, message: 'Profile updated', severity: 'success' }); }}
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

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ bgcolor: '#f9fafb', px: 2, py: 1, mb: 2, borderRadius: 1 }}>
    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{children}</Typography>
  </Box>
);

const FieldCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Grid item xs={6} sm={4} md={3}>
    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.25 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, color: '#111827' }}>{value}</Typography>
  </Grid>
);

const EditDetailsDialog: React.FC<{
  open: boolean;
  employee: Employee;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, employee, onClose, onSuccess }) => {
  const [phone, setPhone] = useState(employee.phone || '');
  const [address, setAddress] = useState(employee.address || '');
  const [addressLine2, setAddressLine2] = useState((employee as any).addressLine2 || '');
  const [city, setCity] = useState(employee.city || '');
  const [state, setState] = useState(employee.state || '');
  const [zip, setZip] = useState(employee.zip || '');
  const [slackMemberId, setSlackMemberId] = useState((employee as any).slackMemberId || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPhone(employee.phone || '');
      setAddress(employee.address || '');
      setAddressLine2((employee as any).addressLine2 || '');
      setCity(employee.city || '');
      setState(employee.state || '');
      setZip(employee.zip || '');
      setSlackMemberId((employee as any).slackMemberId || '');
    }
  }, [open, employee]);

  const handleSave = async () => {
    setBusy(true);
    try {
      // PUT to /api/v1/employees/:id (require employees.update perm — for self-edit might fail)
      // Phase 4 limitation: backend doesn't expose self-edit yet. Use the existing PUT.
      const { employeeService } = await import('../../services/employee.service');
      await employeeService.updateEmployee(employee.id!, { phone, address, addressLine2, city, state, zip, slackMemberId });
      onSuccess();
    } catch (e: any) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>Edit Details</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Phone" fullWidth size="small" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Address Line 1" fullWidth size="small" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Address Line 2" fullWidth size="small" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="City" fullWidth size="small" value={city} onChange={(e) => setCity(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="State" fullWidth size="small" value={state} onChange={(e) => setState(e.target.value)} />
          </Grid>
          <Grid item xs={4}>
            <TextField label="Zip Code" fullWidth size="small" value={zip} onChange={(e) => setZip(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Slack Member ID" fullWidth size="small" value={slackMemberId} onChange={(e) => setSlackMemberId(e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={busy}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
        >
          {busy ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MeProfilePage;
