/**
 * Resident Management Page - Full CRUD: List, Create, Edit, Delete, Discharge
 * Connected to real backend APIs
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Avatar, Checkbox, Chip, IconButton, Button, Select, MenuItem,
  Pagination, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Snackbar, Alert, Menu, CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon, MoreVert as MoreIcon, FilterList as FilterIcon,
  Add as AddIcon, Close as CloseIcon, Edit as EditIcon, Delete as DeleteIcon,
  ExitToApp as DischargeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { residentService } from '../services/resident.service';
import { useAuth } from '../contexts/AuthContext';

const statusStyles: Record<string, { bg: string; color: string }> = {
  Active: { bg: '#d1fae5', color: '#065f46' },
  'New Arrival': { bg: '#dbeafe', color: '#1e40af' },
  'In-progress': { bg: '#fef3c7', color: '#92400e' },
  'Discharge In-progress': { bg: '#fee2e2', color: '#991b1b' },
  Discharged: { bg: '#f3f4f6', color: '#374151' },
};

const avatarColors = ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'];
const filterTabs = ['All', 'Active', 'In-Progress', 'New Arrivals', 'Discharge In-progress', 'Discharged', 'Waitlist'];

const mapResidentStatus = (s: string) => {
  const map: Record<string, string> = { ACTIVE: 'Active', ON_HOLD: 'In-progress', DISCHARGED: 'Discharged', DECEASED: 'Discharged' };
  return map[s] || s;
};

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', dob: '', gender: 'OTHER', serviceType: 'ADH', billingType: 'PRIVATE_PAY', admissionDate: '' };

export const ResidentManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [searchText, setSearchText] = useState('');

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingResident, setEditingResident] = useState<any>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete/Discharge dialogs
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingResident, setDeletingResident] = useState<any>(null);
  const [dischargeDialog, setDischargeDialog] = useState(false);
  const [dischargingResident, setDischargingResident] = useState<any>(null);
  const [dischargeReason, setDischargeReason] = useState('');

  // Action menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuResident, setMenuResident] = useState<any>(null);

  // Map tab index to API status filter
  const getStatusFilter = () => {
    const map: Record<number, string> = { 1: 'ACTIVE', 2: 'ON_HOLD', 3: 'ACTIVE', 5: 'DISCHARGED' };
    return map[activeTab] || undefined;
  };

  const loadResidents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await residentService.getResidents({ page: currentPage, pageSize: rowsPerPage, status: getStatusFilter(), search: searchText || undefined });
      if (res.success && res.data) {
        const mapped = (Array.isArray(res.data) ? res.data : []).map((r: any) => ({
          id: r.id,
          name: `${r.firstName} ${r.lastName}`,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email || '—',
          phone: r.phone || '',
          serviceType: r.primaryService === 'ALF' ? 'ALF' : 'ADH',
          paymentType: r.billingType === 'MEDICAID' ? 'Medicaid' : r.billingType === 'PRIVATE_PAY' ? 'Private Pay' : r.billingType === 'INSURANCE' ? 'Insurance' : r.billingType || 'Private Pay',
          createdOn: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—',
          rawCreatedAt: r.createdAt,
          status: r.admissionType === 'NEW_ARRIVAL' && r.status === 'ACTIVE' ? 'New Arrival' : mapResidentStatus(r.status || 'ACTIVE'),
          avatar: `${(r.firstName || '')[0] || ''}${(r.lastName || '')[0] || ''}`,
          rawStatus: r.status,
          rawAdmissionType: r.admissionType,
          rawBillingType: r.billingType,
          rawService: r.primaryService,
        }));
        setResidents(mapped);
        const pagination = (res as any).pagination;
        if (pagination?.total) setTotalCount(pagination.total);
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to load residents', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, activeTab, searchText]);

  useEffect(() => { loadResidents(); }, [loadResidents]);

  // Residents are filtered via API based on activeTab
  const filteredResidents = residents.filter((r) => {
    if (activeTab === 0) return true; // All
    const tabLabel = filterTabs[activeTab];
    if (tabLabel === 'Active') return r.rawStatus === 'ACTIVE';
    if (tabLabel === 'In-Progress') return r.rawStatus === 'ON_HOLD';
    if (tabLabel === 'New Arrivals') return r.rawStatus === 'ACTIVE' && r.rawAdmissionType === 'NEW_ARRIVAL';
    if (tabLabel === 'Discharge In-progress') return false; // No status for this yet
    if (tabLabel === 'Discharged') return r.rawStatus === 'DISCHARGED';
    if (tabLabel === 'Waitlist') return false; // No waitlist status yet
    return true;
  });

  // --- CRUD Handlers ---

  const handleCreate = () => {
    setEditingResident(null);
    setFormData(emptyForm);
    setOpenDialog(true);
  };

  const handleEdit = (resident: any) => {
    setEditingResident(resident);
    setFormData({
      firstName: resident.firstName || '',
      lastName: resident.lastName || '',
      email: resident.email === '—' ? '' : resident.email || '',
      phone: resident.phone || '',
      dob: '',
      gender: 'OTHER',
      serviceType: resident.rawService || 'ADH',
      billingType: resident.rawBillingType || 'PRIVATE_PAY',
      admissionDate: '',
    });
    setOpenDialog(true);
    setMenuAnchor(null);
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName) {
      setSnackbar({ open: true, message: 'First and Last name are required', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      if (editingResident) {
        const res = await residentService.updateResident(editingResident.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
        });
        if (res.success) {
          setSnackbar({ open: true, message: 'Resident updated successfully', severity: 'success' });
          setOpenDialog(false);
          loadResidents();
        } else {
          setSnackbar({ open: true, message: res.error || 'Failed to update', severity: 'error' });
        }
      } else {
        const res = await residentService.createResident({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          primaryService: formData.serviceType as any,
          billingType: formData.billingType as any,
        });
        if (res.success) {
          setSnackbar({ open: true, message: 'Resident created successfully', severity: 'success' });
          setOpenDialog(false);
          setFormData(emptyForm);
          loadResidents();
        } else {
          setSnackbar({ open: true, message: res.error || 'Failed to create', severity: 'error' });
        }
      }
    } catch {
      setSnackbar({ open: true, message: 'Operation failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (resident: any) => {
    setDeletingResident(resident);
    setDeleteDialog(true);
    setMenuAnchor(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingResident) return;
    try {
      const res = await residentService.deleteResident(deletingResident.id);
      if (res.success) {
        setSnackbar({ open: true, message: 'Resident deleted successfully', severity: 'success' });
        loadResidents();
      } else {
        setSnackbar({ open: true, message: res.error || 'Failed to delete', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' });
    } finally {
      setDeleteDialog(false);
      setDeletingResident(null);
    }
  };

  const handleDischargeClick = (resident: any) => {
    setDischargingResident(resident);
    setDischargeReason('');
    setDischargeDialog(true);
    setMenuAnchor(null);
  };

  const handleDischargeConfirm = async () => {
    if (!dischargingResident || !dischargeReason) return;
    try {
      const res = await residentService.dischargeResident(dischargingResident.id, new Date().toISOString(), dischargeReason);
      if (res.success) {
        setSnackbar({ open: true, message: 'Resident discharged successfully', severity: 'success' });
        loadResidents();
      } else {
        setSnackbar({ open: true, message: res.error || 'Failed to discharge', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to discharge', severity: 'error' });
    } finally {
      setDischargeDialog(false);
      setDischargingResident(null);
    }
  };

  const columns = [
    { id: 'id', label: 'Resident ID' }, { id: 'name', label: 'Resident Name' },
    { id: 'email', label: 'Email' }, { id: 'serviceType', label: 'Service Type' },
    { id: 'paymentType', label: 'Payment Type' }, { id: 'createdOn', label: 'Lead Date' },
    { id: 'status', label: 'Status' }, { id: 'days', label: 'Days' },
    { id: 'action', label: 'Action' },
  ];

  return (
    <Box>
      {/* Title + Filter Tabs + Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Residents</Typography>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{ minHeight: '32px', '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f', height: '2px' },
            '& .MuiTab-root': { minHeight: '32px', fontSize: '11px', fontWeight: 500, textTransform: 'none', color: '#6b7280', py: 0.5, px: 1.5, minWidth: 'auto', '&.Mui-selected': { color: '#1e3a5f', fontWeight: 600 } } }}>
          {filterTabs.map((tab) => <Tab key={tab} label={tab} />)}
        </Tabs>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 16 }} />} onClick={handleCreate}
          sx={{ backgroundColor: '#1e3a5f', fontSize: '11px', fontWeight: 600, px: 1.5, py: 0.5, minHeight: '30px', borderRadius: '6px', boxShadow: 'none', '&:hover': { backgroundColor: '#1e2d4a', boxShadow: 'none' } }}>
          New Resident
        </Button>
        <Button size="small" variant="outlined" sx={{ fontSize: '10px', textTransform: 'none', borderColor: '#e5e7eb', color: '#475569', minHeight: '30px' }}>↑ Upload CSV</Button>
        <Button size="small" variant="outlined" sx={{ fontSize: '10px', textTransform: 'none', borderColor: '#e5e7eb', color: '#475569', minHeight: '30px' }}>↓ Download CSV</Button>
        <IconButton size="small" sx={{ border: '1px solid #e5e7eb', borderRadius: '6px', p: 0.5 }}><FilterIcon sx={{ fontSize: 16, color: '#6b7280' }} /></IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e5e7eb', borderRadius: '6px', px: 1, height: 30 }}>
          <SearchIcon sx={{ fontSize: 14, color: '#9ca3af', mr: 0.5 }} />
          <input placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '11px', width: 120, background: 'transparent' }} />
        </Box>
      </Box>

      {/* Data Table */}
      <Paper sx={{ borderRadius: '6px', boxShadow: 'none', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #e5e7eb', width: '3%' }}>
                    <Checkbox size="small" checked={selectAll} onChange={() => { setSelectAll(!selectAll); setSelectedRows(selectAll ? new Set() : new Set(filteredResidents.map((_, i) => i))); }} sx={{ p: 0.3, '& .MuiSvgIcon-root': { fontSize: 16 } }} />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.id} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1px solid #e5e7eb' }}>{col.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResidents.length === 0 ? (
                  <TableRow><TableCell colSpan={10} sx={{ textAlign: 'center', py: 4, color: '#9ca3af', fontSize: '13px' }}>No residents found. Click "+ New Resident" to add one.</TableCell></TableRow>
                ) : filteredResidents.map((r, idx) => (
                  <TableRow key={r.id || idx} onClick={() => navigate(`/residents/${r.id}`)} sx={{ '&:hover': { backgroundColor: '#f9fafb' }, cursor: 'pointer' }}>
                    <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Checkbox size="small" checked={selectedRows.has(idx)} onChange={() => { const s = new Set(selectedRows); s.has(idx) ? s.delete(idx) : s.add(idx); setSelectedRows(s); }} sx={{ p: 0.3, '& .MuiSvgIcon-root': { fontSize: 16 } }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#374151', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>{r.id}</TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '9px', fontWeight: 600, backgroundColor: avatarColors[idx % avatarColors.length] }}>{r.avatar}</Avatar>
                        <Typography onClick={() => navigate(`/residents/${r.id}`)} sx={{ fontSize: '11px', color: '#374151', fontWeight: 500, cursor: 'pointer', '&:hover': { color: '#1e3a5f', textDecoration: 'underline' } }}>{r.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>{r.email}</TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <Chip label={r.serviceType} size="small" variant="outlined"
                        sx={{ borderColor: r.serviceType === 'ADH' ? '#3b82f6' : '#ec4899', color: r.serviceType === 'ADH' ? '#1e40af' : '#9d174d', fontSize: '9px', fontWeight: 600, height: '20px', borderRadius: '4px', '& .MuiChip-label': { px: 0.75 } }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>{r.paymentType}</TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>{r.createdOn}</TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <Chip label={r.status} size="small"
                        sx={{ backgroundColor: (statusStyles[r.status] || statusStyles.Active).bg, color: (statusStyles[r.status] || statusStyles.Active).color, fontSize: '9px', fontWeight: 600, height: '20px', borderRadius: '4px', '& .MuiChip-label': { px: 0.75 } }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      {r.createdOn ? Math.max(1, Math.floor((Date.now() - new Date(r.rawCreatedAt || Date.now()).getTime()) / 86400000)) : '—'} Days
                    </TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <IconButton size="small" sx={{ p: 0.3 }} onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuResident(r); }}>
                        <MoreIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Rows per page: {rowsPerPage} | {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, totalCount || filteredResidents.length)} of {totalCount || filteredResidents.length}</Typography>
          <Pagination count={Math.max(1, Math.ceil((totalCount || filteredResidents.length) / rowsPerPage))} page={currentPage} onChange={(_, p) => setCurrentPage(p)} size="small"
            sx={{ '& .MuiPaginationItem-root': { fontSize: '11px', minWidth: '26px', height: '26px' }, '& .Mui-selected': { backgroundColor: '#1e3a5f !important', color: '#fff' } }} />
        </Box>
      </Paper>

      {/* Action Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} PaperProps={{ sx: { minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
        <MenuItem onClick={() => { if (menuResident) handleEdit(menuResident); }} sx={{ fontSize: '12px', gap: 1 }}><EditIcon sx={{ fontSize: 14 }} /> Edit</MenuItem>
        <MenuItem onClick={() => { if (menuResident) handleDischargeClick(menuResident); }} sx={{ fontSize: '12px', gap: 1, color: '#f59e0b' }}><DischargeIcon sx={{ fontSize: 14 }} /> Discharge</MenuItem>
        <MenuItem onClick={() => { if (menuResident) handleDeleteClick(menuResident); }} sx={{ fontSize: '12px', gap: 1, color: '#ef4444' }}><DeleteIcon sx={{ fontSize: 14 }} /> Delete</MenuItem>
      </Menu>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '14px', fontWeight: 600 }}>Delete Resident</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: '#374151' }}>
            Are you sure you want to delete <strong>{deletingResident?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteDialog(false)} sx={{ fontSize: '11px', borderColor: '#d1d5db', color: '#374151' }}>Cancel</Button>
          <Button variant="contained" onClick={handleDeleteConfirm} sx={{ fontSize: '11px', backgroundColor: '#ef4444', boxShadow: 'none', '&:hover': { backgroundColor: '#dc2626' } }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Discharge Confirmation */}
      <Dialog open={dischargeDialog} onClose={() => setDischargeDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '14px', fontWeight: 600 }}>Discharge Resident</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: '#374151', mb: 2 }}>
            Discharge <strong>{dischargingResident?.name}</strong> from the facility?
          </Typography>
          <TextField fullWidth size="small" label="Discharge Reason *" value={dischargeReason} onChange={(e) => setDischargeReason(e.target.value)}
            placeholder="e.g., Family request, Transferred to another facility" multiline rows={2} sx={{ '& .MuiInputBase-input': { fontSize: '12px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDischargeDialog(false)} sx={{ fontSize: '11px', borderColor: '#d1d5db', color: '#374151' }}>Cancel</Button>
          <Button variant="contained" onClick={handleDischargeConfirm} disabled={!dischargeReason}
            sx={{ fontSize: '11px', backgroundColor: '#f59e0b', boxShadow: 'none', '&:hover': { backgroundColor: '#d97706' } }}>Discharge</Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Resident Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2.5, borderBottom: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{editingResident ? 'Edit Resident' : 'Add New Resident'}</Typography>
          <IconButton size="small" onClick={() => setOpenDialog(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827', mb: 1, mt: 1 }}>Personal Information</Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>First Name *</Typography>
              <TextField fullWidth size="small" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="First Name" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Last Name *</Typography>
              <TextField fullWidth size="small" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Last Name" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Email</Typography>
              <TextField fullWidth size="small" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Phone</Typography>
              <TextField fullWidth size="small" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>

          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827', mb: 1, mt: 1 }}>Service Details</Typography>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Service Type</Typography>
              <Select fullWidth size="small" value={formData.serviceType} onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })} sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="ADH">ADH</MenuItem><MenuItem value="ALF">ALF</MenuItem>
                <MenuItem value="HOME_CARE">Home Care</MenuItem></Select></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Billing Type</Typography>
              <Select fullWidth size="small" value={formData.billingType} onChange={(e) => setFormData({ ...formData, billingType: e.target.value })} sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="PRIVATE_PAY">Private Pay</MenuItem><MenuItem value="MEDICAID">Medicaid</MenuItem>
                <MenuItem value="INSURANCE">Insurance</MenuItem><MenuItem value="MIXED">Mixed</MenuItem></Select></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #e5e7eb', gap: 1 }}>
          <Button variant="outlined" onClick={() => setOpenDialog(false)} sx={{ fontSize: '11px', borderColor: '#d1d5db', color: '#374151' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ fontSize: '11px', backgroundColor: '#1e3a5f', boxShadow: 'none', '&:hover': { backgroundColor: '#1e2d4a', boxShadow: 'none' } }}>
            {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : editingResident ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
