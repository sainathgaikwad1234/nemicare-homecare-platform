/**
 * Lead Management Page - Full CRUD: List, Create, Edit, Delete
 * Connected to real backend APIs
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Snackbar, Alert, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Avatar, Checkbox, IconButton,
  Button, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Pagination, InputAdornment, Menu, CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon,
  Close as CloseIcon, Upload as UploadIcon, MoreVert as MoreIcon,
  Edit as EditIcon, Visibility as ViewIcon, KeyboardArrowDown as ChevronIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { leadService } from '../services/lead.service';
import { useAuth } from '../contexts/AuthContext';

const statusStyles: Record<string, { bg: string; color: string }> = {
  New: { bg: '#dbeafe', color: '#1e40af' },
  Qualified: { bg: '#d1fae5', color: '#065f46' },
  Contacted: { bg: '#ede9fe', color: '#5b21b6' },
  'Visit Done': { bg: '#e0e7ff', color: '#3730a3' },
  Converting: { bg: '#fef3c7', color: '#92400e' },
  Converted: { bg: '#d1fae5', color: '#065f46' },
  Potential: { bg: '#fef3c7', color: '#92400e' },
  Rejected: { bg: '#fee2e2', color: '#991b1b' },
};

const avatarColors = ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'];

const mapStatus = (status: string) => {
  const map: Record<string, string> = { PROSPECT: 'New', QUALIFIED: 'Qualified', DOCUMENTATION: 'Contacted', VISIT_SCHEDULED: 'Visit Done', CONVERTING: 'Converting', CONVERTED: 'Converted', NURTURE: 'Potential', NOT_QUALIFIED: 'Rejected', CLOSED: 'Rejected' };
  return map[status] || status;
};

const mapSource = (source: string) => {
  const map: Record<string, string> = { WEBSITE: 'CRM', REFERRAL: 'Referral', CALL: 'Walk-in', FAMILY: 'Referral', OTHER: 'Caring.com' };
  return map[source] || source;
};

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '', source: '',
  leadOwner: '', customerType: '', leadStatus: 'New', holdEndDate: '',
  // Referral Source Details
  referralDate: '', referralBy: '', referralSourceType: '', sourceId: '',
  referringContactName: '', referringContactEmail: '', referringContactPhone: '',
  // Lead Information
  dob: '', gender: '', serviceType: 'ADH',
};

export const LeadManagementPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null); // null = create, object = edit
  const [formData, setFormData] = useState(emptyForm);
  const [leadSource, setLeadSource] = useState('caringcom');
  const [saving, setSaving] = useState(false);
  const [newLeadServiceType, setNewLeadServiceType] = useState('ADH');
  const [newLeadMenuAnchor, setNewLeadMenuAnchor] = useState<null | HTMLElement>(null);

  // Delete confirm dialog
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deletingLead, setDeletingLead] = useState<any>(null);

  // Action menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuLead, setMenuLead] = useState<any>(null);

  // Fetch leads
  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await leadService.getLeads({ page: currentPage, pageSize: 10, search: search || undefined });
      if (response.success && response.data) {
        const mapped = (Array.isArray(response.data) ? response.data : []).map((l: any) => ({
          id: l.id,
          name: `${l.firstName} ${l.lastName}`,
          firstName: l.firstName,
          lastName: l.lastName,
          email: l.email || '—',
          phone: l.phone || '',
          leadOwner: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : 'Unassigned',
          addedBy: 'System',
          serviceType: l.interestedIn === 'ALF' ? 'ALF' : 'ADH',
          source: mapSource(l.source || ''),
          createdOn: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—',
          status: mapStatus(l.status || 'PROSPECT'),
          avatar: `${(l.firstName || '')[0] || ''}${(l.lastName || '')[0] || ''}`,
          ownerAvatar: l.assignedTo ? `${l.assignedTo.firstName[0]}${l.assignedTo.lastName[0]}` : 'NA',
          addedAvatar: 'SY',
          rawStatus: l.status,
          rawSource: l.source,
        }));
        setLeads(mapped);
        // Use pagination from API if available
        const pagination = (response as any).pagination;
        setTotalCount(pagination?.total || mapped.length);
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to load leads', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { setCurrentPage(1); loadLeads(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // --- CRUD Handlers ---

  const handleCreateWithType = (serviceType: string) => {
    setNewLeadMenuAnchor(null);
    setNewLeadServiceType(serviceType);
    setEditingLead(null);
    setFormData({ ...emptyForm, serviceType });
    setLeadSource('caringcom');
    setOpenDialog(true);
  };

  const handleEdit = (lead: any) => {
    setEditingLead(lead);
    setFormData({
      firstName: lead.firstName || lead.name?.split(' ')[0] || '',
      lastName: lead.lastName || lead.name?.split(' ').slice(1).join(' ') || '',
      email: lead.email === '—' ? '' : lead.email || '',
      phone: lead.phone || '',
      source: lead.rawSource || '',
      leadOwner: lead.leadOwner || '',
      customerType: '',
      leadStatus: lead.rawStatus || 'PROSPECT',
      holdEndDate: '',
      referralDate: '', referralBy: '', referralSourceType: '', sourceId: '',
      referringContactName: '', referringContactEmail: '', referringContactPhone: '',
      dob: '', gender: '', serviceType: lead.serviceType || 'ADH',
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
      const sourceMap: Record<string, string> = { caringcom: 'WEBSITE', aplaceformom: 'OTHER', referral: 'REFERRAL', walkin: 'CALL' };
      if (editingLead) {
        // UPDATE
        const res = await leadService.updateLead(String(editingLead.id), {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          status: formData.leadStatus as any,
        });
        if (res.success) {
          setSnackbar({ open: true, message: 'Lead updated successfully', severity: 'success' });
          setOpenDialog(false);
          loadLeads();
        } else {
          setSnackbar({ open: true, message: res.error || 'Failed to update', severity: 'error' });
        }
      } else {
        // CREATE
        const res = await leadService.createLead({
          firstName: formData.firstName, lastName: formData.lastName,
          email: formData.email || '', phone: formData.phone || '',
          source: sourceMap[leadSource] || 'OTHER',
          address: '', city: '', state: '', zipCode: '',
          dateOfBirth: formData.dob || '',
          gender: (formData.gender || 'OTHER') as any,
          companyId: String(user?.companyId || 1), facilityId: String(user?.facilityId || 1),
          notes: formData.customerType ? `CustomerType: ${formData.customerType}` : undefined,
          interestedIn: formData.serviceType || newLeadServiceType || 'ADH',
        } as any);
        if (res.success) {
          setSnackbar({ open: true, message: 'Lead created successfully', severity: 'success' });
          setOpenDialog(false);
          setFormData(emptyForm);
          loadLeads();
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

  const handleDeleteClick = (lead: any) => {
    setDeletingLead(lead);
    setDeleteDialog(true);
    setMenuAnchor(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLead) return;
    try {
      const res = await leadService.deleteLead(String(deletingLead.id));
      if (res.success) {
        setSnackbar({ open: true, message: 'Lead deleted successfully', severity: 'success' });
        loadLeads();
      } else {
        setSnackbar({ open: true, message: res.error || 'Failed to delete', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete lead', severity: 'error' });
    } finally {
      setDeleteDialog(false);
      setDeletingLead(null);
    }
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setSelectedRows(selectAll ? new Set() : new Set(leads.map((_, i) => i)));
  };

  const columns = [
    { id: 'leadId', label: 'Lead ID' }, { id: 'name', label: 'Lead Name' }, { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'leadOwner', label: 'Lead Owner' }, { id: 'addedBy', label: 'Added By' },
    { id: 'serviceType', label: 'Service Type' }, { id: 'source', label: 'Source' },
    { id: 'leadDate', label: 'Lead Date' }, { id: 'status', label: 'Status' },
    { id: 'action', label: 'Action' },
  ];

  const displayLeads = leads;

  return (
    <Box>
      {/* Title + Toolbar — Figma: "Leads" title top-left */}
      <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e', mb: 1 }}>Leads</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mb: 1.5 }}>
        <IconButton size="small" onClick={() => setSnackbar({ open: true, message: 'Import feature coming soon', severity: 'info' as any })} sx={{ border: '1px solid #e5e7eb', borderRadius: '6px', p: 0.5 }} title="Import Leads">
          <UploadIcon sx={{ fontSize: 16, color: '#6b7280' }} />
        </IconButton>
        <IconButton size="small" sx={{ border: '1px solid #e5e7eb', borderRadius: '6px', p: 0.5 }} title="Filter">
          <FilterIcon sx={{ fontSize: 16, color: '#6b7280' }} />
        </IconButton>
        <TextField size="small" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: '#9ca3af' }} /></InputAdornment> }}
          sx={{ width: 200, '& .MuiOutlinedInput-root': { fontSize: '11px', height: '32px', backgroundColor: '#fff', borderRadius: '6px' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e5e7eb' } }}
        />
        {/* New Lead button with dropdown — Figma: ADH/ALF selector */}
        <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: 16 }} />} endIcon={<ChevronIcon sx={{ fontSize: 16 }} />}
          onClick={(e) => setNewLeadMenuAnchor(e.currentTarget)}
          sx={{ backgroundColor: '#1e3a5f', fontSize: '11px', fontWeight: 600, px: 1.5, py: 0.5, minHeight: '32px', borderRadius: '6px', boxShadow: 'none', textTransform: 'none', '&:hover': { backgroundColor: '#1e2d4a', boxShadow: 'none' } }}>
          New Lead
        </Button>
        <Menu anchorEl={newLeadMenuAnchor} open={Boolean(newLeadMenuAnchor)} onClose={() => setNewLeadMenuAnchor(null)}
          PaperProps={{ sx: { mt: 0.5, minWidth: 220, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
          <MenuItem onClick={() => handleCreateWithType('ADH')} sx={{ fontSize: '13px', py: 1 }}>ADH (Adult Day Health)</MenuItem>
          <MenuItem onClick={() => handleCreateWithType('ALF')} sx={{ fontSize: '13px', py: 1 }}>ALF (Assisted Living Facility)</MenuItem>
        </Menu>
      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: '6px', boxShadow: 'none', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                  <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #e5e7eb', width: '3%' }}>
                    <Checkbox size="small" checked={selectAll} onChange={handleSelectAll} sx={{ p: 0.3, '& .MuiSvgIcon-root': { fontSize: 16 } }} />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.id} sx={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', py: 0.75, textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1px solid #e5e7eb' }}>{col.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayLeads.length === 0 ? (
                  <TableRow><TableCell colSpan={12} sx={{ textAlign: 'center', py: 4, color: '#9ca3af', fontSize: '13px' }}>No leads found. Click "+ New Lead" to add one.</TableCell></TableRow>
                ) : displayLeads.map((lead, idx) => (
                  <TableRow key={lead.id || idx} onClick={() => navigate(`/leads/${lead.id}`)} sx={{ '&:hover': { backgroundColor: '#f9fafb' }, cursor: 'pointer' }}>
                    <TableCell padding="checkbox" sx={{ borderBottom: '1px solid #f3f4f6' }}>
                      <Checkbox size="small" checked={selectedRows.has(idx)} onChange={() => { const s = new Set(selectedRows); s.has(idx) ? s.delete(idx) : s.add(idx); setSelectedRows(s); }} sx={{ p: 0.3, '& .MuiSvgIcon-root': { fontSize: 16 } }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>{String(lead.id).padStart(6, '0')}</TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '10px', fontWeight: 600, backgroundColor: avatarColors[idx % avatarColors.length] }}>{lead.avatar}</Avatar>
                        <Typography onClick={() => navigate(`/leads/${lead.id}`)} sx={{ fontSize: '11px', color: '#374151', fontWeight: 500, cursor: 'pointer', '&:hover': { color: '#1e3a5f', textDecoration: 'underline' } }}>{lead.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>{lead.email}</TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>{lead.phone || '—'}</TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '8px', fontWeight: 600, backgroundColor: avatarColors[(idx + 3) % avatarColors.length] }}>{lead.ownerAvatar}</Avatar>
                        <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>{lead.leadOwner}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '8px', fontWeight: 600, backgroundColor: avatarColors[(idx + 5) % avatarColors.length] }}>{lead.addedAvatar}</Avatar>
                        <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>{lead.addedBy}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <Chip label={lead.serviceType} size="small" variant="outlined"
                        sx={{ fontSize: '9px', fontWeight: 600, height: '20px', borderRadius: '4px', borderColor: lead.serviceType === 'ADH' ? '#3b82f6' : '#ec4899', color: lead.serviceType === 'ADH' ? '#1e40af' : '#9d174d', '& .MuiChip-label': { px: 0.75 } }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>{lead.source}</TableCell>
                    <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, borderBottom: '1px solid #f3f4f6' }}>{lead.createdOn}</TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <Chip label={lead.status} size="small"
                        sx={{ backgroundColor: (statusStyles[lead.status] || statusStyles['New Arrival']).bg, color: (statusStyles[lead.status] || statusStyles['New Arrival']).color, fontSize: '9px', fontWeight: 600, height: '20px', borderRadius: '4px', '& .MuiChip-label': { px: 0.75 } }} />
                    </TableCell>
                    <TableCell sx={{ py: 0.75, borderBottom: '1px solid #f3f4f6' }}>
                      <Box sx={{ display: 'flex', gap: 0.3 }}>
                        <IconButton size="small" sx={{ p: 0.3 }} onClick={() => handleEdit(lead)}><EditIcon sx={{ fontSize: 14, color: '#9ca3af' }} /></IconButton>
                        <IconButton size="small" sx={{ p: 0.3 }} onClick={() => navigate(`/leads/${lead.id}`)}><ViewIcon sx={{ fontSize: 14, color: '#9ca3af' }} /></IconButton>
                        <IconButton size="small" sx={{ p: 0.3 }} onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuLead(lead); }}>
                          <MoreIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderTop: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Rows per page: 10 | 1-{displayLeads.length} of {totalCount || displayLeads.length}</Typography>
          <Pagination count={Math.max(1, Math.ceil((totalCount || displayLeads.length) / 10))} page={currentPage} onChange={(_, p) => setCurrentPage(p)} size="small"
            sx={{ '& .MuiPaginationItem-root': { fontSize: '11px', minWidth: '26px', height: '26px' }, '& .Mui-selected': { backgroundColor: '#1e3a5f !important', color: '#fff' } }} />
        </Box>
      </Paper>

      {/* Action Menu (three dots) */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} PaperProps={{ sx: { minWidth: 140, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
        <MenuItem onClick={() => { if (menuLead) handleEdit(menuLead); }} sx={{ fontSize: '12px', gap: 1 }}><EditIcon sx={{ fontSize: 14 }} /> Edit Lead</MenuItem>
        <MenuItem onClick={() => { if (menuLead) handleDeleteClick(menuLead); }} sx={{ fontSize: '12px', gap: 1, color: '#ef4444' }}><DeleteIcon sx={{ fontSize: 14 }} /> Delete Lead</MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '14px', fontWeight: 600 }}>Delete Lead</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: '#374151' }}>
            Are you sure you want to delete <strong>{deletingLead?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteDialog(false)} sx={{ fontSize: '11px', borderColor: '#d1d5db', color: '#374151' }}>Cancel</Button>
          <Button variant="contained" onClick={handleDeleteConfirm} sx={{ fontSize: '11px', backgroundColor: '#ef4444', boxShadow: 'none', '&:hover': { backgroundColor: '#dc2626', boxShadow: 'none' } }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Lead Dialog */}
      {/* Add/Edit Lead Dialog — Figma: Add New Lead.png (3 sections) */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px', maxHeight: '90vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2.5, borderBottom: '1px solid #e5e7eb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{editingLead ? 'Edit Lead' : 'Add New Lead'}</Typography>
            <Chip label={editingLead ? (editingLead.serviceType || 'ADH') : newLeadServiceType} size="small" sx={{ fontSize: '10px', height: '20px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 600 }} />
          </Box>
          <IconButton size="small" onClick={() => setOpenDialog(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>

          {/* Section 1: Lead Details & Status */}
          <Box sx={{ bgcolor: '#f8f9fb', borderRadius: '6px', px: 2, py: 0.75, mb: 1.5, mt: 1 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>Lead Details & Status</Typography>
          </Box>
          {!editingLead && (
            <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
              {[{ key: 'caringcom', label: 'Caring.com' }, { key: 'aplaceformom', label: 'A place for mom' }, { key: 'referral', label: 'Referral' }, { key: 'walkin', label: 'Walk-in' }].map((src) => (
                <Button key={src.key} size="small" variant={leadSource === src.key ? 'contained' : 'outlined'}
                  onClick={() => setLeadSource(src.key)}
                  sx={{ fontSize: '10px', borderRadius: '16px', px: 1.5, py: 0.3, minHeight: '24px',
                    ...(leadSource === src.key ? { backgroundColor: '#1e3a5f', color: '#fff', borderColor: '#1e3a5f', boxShadow: 'none', '&:hover': { backgroundColor: '#1e2d4a', boxShadow: 'none' } }
                      : { borderColor: '#d1d5db', color: '#374151', '&:hover': { backgroundColor: '#f9fafb' } }) }}
                >{src.label}</Button>
              ))}
            </Box>
          )}
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Lead ID</Typography>
              <TextField fullWidth size="small" value={editingLead ? `LD-${editingLead.id}` : 'Auto-generated'} disabled
                sx={{ '& input': { fontSize: '11px', py: 0.5 }, '& .Mui-disabled': { bgcolor: '#f9fafb' } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Lead Owner</Typography>
              <Select fullWidth size="small" value={formData.leadOwner} onChange={(e) => setFormData({ ...formData, leadOwner: e.target.value })}
                displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select</em></MenuItem>
                <MenuItem value="Admin">Admin</MenuItem><MenuItem value="Manager">Manager</MenuItem>
              </Select></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Customer/Lead Type</Typography>
              <Select fullWidth size="small" value={formData.customerType} onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select</em></MenuItem>
                <MenuItem value="Private Pay">Private Pay</MenuItem><MenuItem value="Medicaid">Medicaid</MenuItem>
                <MenuItem value="Insurance">Insurance</MenuItem>
              </Select></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Lead Status</Typography>
              <Select fullWidth size="small" value={formData.leadStatus} onChange={(e) => setFormData({ ...formData, leadStatus: e.target.value })}
                displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="New">New</MenuItem><MenuItem value="PROSPECT">Prospect</MenuItem>
                <MenuItem value="QUALIFIED">Qualified</MenuItem><MenuItem value="CONVERTING">In-progress</MenuItem>
                <MenuItem value="NOT_QUALIFIED">Rejected</MenuItem>
              </Select></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Hold End Date</Typography>
              <TextField fullWidth size="small" type="date" value={formData.holdEndDate}
                onChange={(e) => setFormData({ ...formData, holdEndDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>

          {/* Section 2: Referral Source Details */}
          <Box sx={{ bgcolor: '#f8f9fb', borderRadius: '6px', px: 2, py: 0.75, mb: 1.5 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>Referral Source Details</Typography>
          </Box>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Referral Date</Typography>
              <TextField fullWidth size="small" type="date" value={formData.referralDate}
                onChange={(e) => setFormData({ ...formData, referralDate: e.target.value })}
                InputLabelProps={{ shrink: true }} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Referral By</Typography>
              <Select fullWidth size="small" value={formData.referralBy} onChange={(e) => setFormData({ ...formData, referralBy: e.target.value })}
                displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Enter</em></MenuItem>
                <MenuItem value="Doctor">Doctor</MenuItem><MenuItem value="Family">Family</MenuItem>
                <MenuItem value="Hospital">Hospital</MenuItem><MenuItem value="Other">Other</MenuItem>
              </Select></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Referral Source Type</Typography>
              <Select fullWidth size="small" value={formData.referralSourceType} onChange={(e) => setFormData({ ...formData, referralSourceType: e.target.value })}
                displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select</em></MenuItem>
                <MenuItem value="Hospital">Hospital</MenuItem><MenuItem value="Physician">Physician</MenuItem>
                <MenuItem value="Agency">Agency</MenuItem><MenuItem value="Self">Self</MenuItem>
              </Select></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Source ID</Typography>
              <TextField fullWidth size="small" value={formData.sourceId} onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                placeholder="Enter" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Referring Contact Name</Typography>
              <TextField fullWidth size="small" value={formData.referringContactName} onChange={(e) => setFormData({ ...formData, referringContactName: e.target.value })}
                placeholder="Enter" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Referring Contact Email</Typography>
              <TextField fullWidth size="small" value={formData.referringContactEmail} onChange={(e) => setFormData({ ...formData, referringContactEmail: e.target.value })}
                placeholder="Enter" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Referring Contact Phone</Typography>
              <TextField fullWidth size="small" value={formData.referringContactPhone} onChange={(e) => setFormData({ ...formData, referringContactPhone: e.target.value })}
                placeholder="Enter" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Upload Referral Document</Typography>
              <Box sx={{ border: '2px dashed #c7d2fe', borderRadius: '6px', py: 1.5, textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#f5f7ff' } }}>
                <Typography sx={{ fontSize: '11px', color: '#4f46e5' }}>📤 Upload Document</Typography>
              </Box></Grid>
          </Grid>

          {/* Section 3: Lead Information */}
          <Box sx={{ bgcolor: '#f8f9fb', borderRadius: '6px', px: 2, py: 0.75, mb: 1.5 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>Lead Information</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Profile Picture</Typography>
            <Box sx={{ border: '2px dashed #c7d2fe', borderRadius: '6px', py: 1.5, width: '48%', textAlign: 'center', cursor: 'pointer', '&:hover': { bgcolor: '#f5f7ff' } }}>
              <Typography sx={{ fontSize: '11px', color: '#4f46e5' }}>📤 Upload Profile Picture</Typography>
            </Box>
          </Box>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>First Name *</Typography>
              <TextField fullWidth size="small" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="First Name" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Last Name *</Typography>
              <TextField fullWidth size="small" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last Name" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Email</Typography>
              <TextField fullWidth size="small" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Phone</Typography>
              <TextField fullWidth size="small" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date of Birth</Typography>
              <TextField fullWidth size="small" type="date" value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                InputLabelProps={{ shrink: true }} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Gender</Typography>
              <Select fullWidth size="small" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select</em></MenuItem>
                <MenuItem value="M">Male</MenuItem><MenuItem value="F">Female</MenuItem><MenuItem value="OTHER">Other</MenuItem>
              </Select></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Service Type</Typography>
              <Select fullWidth size="small" value={formData.serviceType} onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="ADH">ADH</MenuItem><MenuItem value="ALF">ALF</MenuItem>
                <MenuItem value="HOME_CARE">Home Care</MenuItem><MenuItem value="MC">Memory Care</MenuItem>
              </Select></Grid>
          </Grid>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Preferred Name</Typography>
              <TextField fullWidth size="small" placeholder="Enter" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Language</Typography>
              <Select fullWidth size="small" defaultValue="English" sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="English">English</MenuItem><MenuItem value="Spanish">Spanish</MenuItem><MenuItem value="Other">Other</MenuItem>
              </Select></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Marital Status</Typography>
              <Select fullWidth size="small" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select</em></MenuItem>
                <MenuItem value="Single">Single</MenuItem><MenuItem value="Married">Married</MenuItem>
                <MenuItem value="Widowed">Widowed</MenuItem><MenuItem value="Divorced">Divorced</MenuItem>
              </Select></Grid>
          </Grid>

        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #e5e7eb', gap: 1 }}>
          <Button variant="outlined" onClick={() => setOpenDialog(false)} sx={{ fontSize: '11px', borderColor: '#d1d5db', color: '#374151', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ fontSize: '11px', backgroundColor: '#1e3a5f', boxShadow: 'none', textTransform: 'none', '&:hover': { backgroundColor: '#1e2d4a', boxShadow: 'none' } }}>
            {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : editingLead ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
