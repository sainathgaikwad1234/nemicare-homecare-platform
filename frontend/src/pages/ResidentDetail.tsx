/**
 * Resident Detail / Face Sheet Page — Matching Figma exactly
 * Layout: Sticky header (profile) + 11 tabs
 * Figma ref: Resident (New)/Face Sheet.png through Face Sheet-7.png
 */

import React, { useState, useEffect, useCallback } from 'react';
import { VitalsTab as VitalsTabComponent } from '../components/Charting/VitalsTab';
import { AllergiesTab as AllergiesTabComponent } from '../components/Charting/AllergiesTab';
import { MedicationTab as MedicationTabComponent } from '../components/Charting/MedicationTab';
import { CarePlansTab } from '../components/Charting/CarePlansTab';
// import { ActivitiesTab } from '../components/Charting/ActivitiesTab';
import { ServicesTab } from '../components/Charting/ServicesTab';
import { TicketsTab } from '../components/Charting/TicketsTab';
import { InventoryTab } from '../components/Charting/InventoryTab';
import { DocumentsTab } from '../components/Charting/DocumentsTab';
import { IncidentsTab } from '../components/Charting/IncidentsTab';
import { PainScaleTab } from '../components/Charting/PainScaleTab';
import { FaceToFaceNotesTab } from '../components/Charting/FaceToFaceNotesTab';
import { EventsTab } from '../components/Charting/EventsTab';
import { ProgressNotesTab } from '../components/Charting/ProgressNotesTab';
import {
  Box, Typography, Avatar, Chip, Tabs, Tab, Paper, Button, IconButton,
  CircularProgress, Grid, Snackbar, Alert, TextField, Select, MenuItem, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Mail as MailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  LocalHospital as VitalsIcon,
  MedicalServices as MedsIcon,
  Warning as AllergyIcon,
  EventNote as TicketsIcon,
  NoteAlt as NotesIcon,
  Folder as DocsIcon,
  ReportProblem as IncidentIcon,
  Event as EventsIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { residentService } from '../services/resident.service';
import { DischargeWizard } from '../components/Discharge/DischargeWizard';
import { ResidentProvider } from '../contexts/ResidentContext';

/* ========== Constants ========== */

const statusDisplay: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Active', color: '#065f46', bg: '#d1fae5' },
  ON_HOLD: { label: 'In-progress', color: '#92400e', bg: '#fef3c7' },
  DISCHARGED: { label: 'Discharged', color: '#374151', bg: '#f3f4f6' },
  DECEASED: { label: 'Deceased', color: '#374151', bg: '#f3f4f6' },
  NEW_ARRIVAL: { label: 'New Arrival', color: '#c2410c', bg: '#ffedd5' },
};

const serviceTypeLabels: Record<string, string> = {
  ALF: 'ALF', ADH: 'ADH', HOME_CARE: 'Home Care', MC: 'MC', IL: 'IL',
};

const billingLabels: Record<string, string> = {
  MEDICAID: 'Medicaid', PRIVATE_PAY: 'Private Pay', INSURANCE: 'Insurance', MIXED: 'Mixed',
};

const calcAge = (dob?: string) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
};

const genderLabel = (g?: string) => g === 'M' ? 'Male' : g === 'F' ? 'Female' : g === 'OTHER' ? 'Other' : '—';

/* ========== Tab definitions per service type ========== */

const getTabsForService = (isALF: boolean, isInProgress?: boolean, resident?: any, onTabNavigate?: (tabKey: string) => void, onEditProfile?: () => void): { key: string; label: string; content: React.ReactNode }[] => {
  // IN_PROGRESS residents (ON_HOLD status) — show Patient Setup wizard
  // Figma: ALF-Resident(In-progress)/Patient Setup/ — Patient Information | Patient Setup | Lead History
  if (isInProgress) {
    return [
      { key: 'patientinfo', label: 'Patient Information', content: <ResidentPatientInfoTab resident={resident} onEditProfile={onEditProfile} /> },
      { key: 'patientsetup', label: 'Patient Setup', content: <PatientSetupWizard isALF={isALF} /> },
      { key: 'leadhistory', label: 'Lead History', content: <EmptyTab title="Lead History" buttonLabel="View Full History" /> },
    ];
  }

  if (isALF) {
    // ALF Active/New Arrival tabs per user stories (rows 297-321)
    return [
      { key: 'facesheet', label: 'Face Sheet', content: <FaceSheetTab isALF={true} onNavigateToTab={onTabNavigate} /> },
      { key: 'services', label: 'Services', content: <ServicesTab /> },
      { key: 'tickets', label: 'Tickets', content: <TicketsTab /> },
      { key: 'clinical', label: 'Clinical Data', content: <ClinicalDataTab /> },
      { key: 'progress', label: 'Progress Notes', content: <ProgressNotesTab /> },
      { key: 'medication', label: 'Medication', content: <MedicationTabComponent /> },
      { key: 'documents', label: 'Documents', content: <DocumentsTab /> },
      { key: 'incidents', label: 'Incidents', content: <IncidentsTab /> },
      { key: 'inventory', label: 'Inventory', content: <InventoryTab /> },
      { key: 'f2f', label: 'Face-to-Face', content: <FaceToFaceNotesTab /> },
      { key: 'other', label: 'Other', content: <EmptyTab title="Other" buttonLabel="Add Item" /> },
    ];
  }
  // ADH Active/New Arrival tabs per user stories (rows 276-295)
  return [
    { key: 'facesheet', label: 'Face Sheet', content: <FaceSheetTab isALF={false} onNavigateToTab={onTabNavigate} /> },
    { key: 'careplan', label: 'Care Plan', content: <CarePlansTab /> },
    { key: 'events', label: 'Events', content: <EventsTab /> },
    { key: 'clinical', label: 'Clinical Data', content: <ClinicalDataTab /> },
    { key: 'progress', label: 'Progress Notes', content: <ProgressNotesTab /> },
    { key: 'medication', label: 'Medication', content: <MedicationTabComponent /> },
    { key: 'documents', label: 'Documents', content: <DocumentsTab /> },
    { key: 'incidents', label: 'Incidents', content: <IncidentsTab /> },
    { key: 'painscale', label: 'Pain Scale', content: <PainScaleTab /> },
    { key: 'other', label: 'Other', content: <EmptyTab title="Other" buttonLabel="Add Item" /> },
  ];
};

/* ========== Main Component ========== */

export const ResidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resident, setResident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'info' });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [dischargeOpen, setDischargeOpen] = useState(false);

  const fetchResident = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await residentService.getResidentById(Number(id));
      if (res.success) setResident(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load resident', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchResident(); }, [fetchResident]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!resident) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">Resident not found</Typography>
        <Button onClick={() => navigate('/residents')} sx={{ mt: 2 }}>Back to Residents</Button>
      </Box>
    );
  }

  const status = statusDisplay[resident.admissionType] || statusDisplay[resident.status] || { label: resident.status, color: '#6b7280', bg: '#f3f4f6' };
  const age = calcAge(resident.dob);
  const initials = `${resident.firstName?.charAt(0) || ''}${resident.lastName?.charAt(0) || ''}`.toUpperCase();
  const address = [resident.address, resident.city, resident.state, resident.zip].filter(Boolean).join(', ');
  const isALF = resident.primaryService === 'ALF' || resident.primaryService === 'MC';
  const isInProgress = resident.status === 'ON_HOLD';

  // Navigate to a tab by key — used by Face Sheet card buttons
  const handleTabNavigate = (tabKey: string) => {
    const tabs = getTabsForService(isALF, isInProgress, resident);
    const idx = tabs.findIndex(t => t.key === tabKey);
    if (idx >= 0) setActiveTab(idx);
  }; // ON_HOLD = In-progress in the system

  return (
    <Box sx={{ bgcolor: '#f5f6fa', minHeight: 'calc(100vh - 56px)' }}>

      {/* ====== STICKY HEADER — Figma: Face Sheet.png top section ====== */}
      <Box sx={{
        bgcolor: '#fff', px: 3, pt: 2, pb: 0, borderBottom: '1px solid #e5e7eb',
        position: 'sticky', top: 42, zIndex: 10,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, pb: 1.5 }}>
          {/* Photo */}
          <Avatar
            variant="rounded"
            sx={{ width: 72, height: 72, bgcolor: '#3b82f6', fontSize: '24px', fontWeight: 600, borderRadius: '10px' }}
          >
            {initials}
          </Avatar>

          {/* Info */}
          <Box sx={{ flex: 1 }}>
            {/* Row 1: Name + badges + edit */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}>
                {resident.firstName} {resident.lastName}
              </Typography>
              <Chip label={status.label} size="small"
                sx={{ fontSize: '10px', height: 20, fontWeight: 600, bgcolor: status.bg, color: status.color }} />
              {resident.primaryService && (
                <Chip label={serviceTypeLabels[resident.primaryService] || resident.primaryService} size="small"
                  sx={{ fontSize: '10px', height: 20, bgcolor: '#dbeafe', color: '#1e40af' }} />
              )}
              {resident.billingType && (
                <Chip label={billingLabels[resident.billingType] || resident.billingType} size="small"
                  sx={{ fontSize: '10px', height: 20, bgcolor: '#dbeafe', color: '#1e40af' }} />
              )}
              <IconButton size="small" sx={{ ml: 0.5 }}>
                <EditIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
              </IconButton>
            </Box>

            {/* Row 2: Email + Phone */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 0.5 }}>
              {resident.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MailIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: '12px', color: '#475569' }}>{resident.email}</Typography>
                </Box>
              )}
              {resident.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: '12px', color: '#475569' }}>{resident.phone}</Typography>
                </Box>
              )}
            </Box>

            {/* Row 3: Age + Gender + Address */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {age != null && (
                <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
                  <strong style={{ fontSize: '16px', color: '#334155' }}>{age}</strong>
                </Typography>
              )}
              <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
                ♂ {genderLabel(resident.gender)}
              </Typography>
              {address && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>{address}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* ADH-specific header cards — RIGHT SIDE — Figma: Resident/Frame 1618877456.png
              AC: Pain Scale, Frequency (weekly calendar), Transportation (VERIDA + progress), Attendance (month + progress) */}
          {!isALF && !isInProgress && (
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexShrink: 0 }}>
              {/* Pain Scale card */}
              <Paper sx={{ p: 1.25, borderRadius: '6px', border: '1px solid #e5e7eb', minWidth: 90, textAlign: 'center' }} elevation={0}>
                <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500, mb: 0.5 }}>Pain Scale</Typography>
                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#334155' }}>0</Typography>
                <Typography sx={{ fontSize: '9px', color: '#94a3b8' }}>No Pain</Typography>
              </Paper>

              {/* Frequency card — weekly schedule */}
              <Paper sx={{ p: 1.25, borderRadius: '6px', border: '1px solid #e5e7eb', minWidth: 130 }} elevation={0}>
                <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500, mb: 0.5 }}>Frequency</Typography>
                <Box sx={{ display: 'flex', gap: 0.3 }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <Box key={`${d}-${i}`} sx={{
                      width: 16, height: 16, borderRadius: '50%', fontSize: '8px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: i < 5 ? '#1e3a5f' : '#e5e7eb',
                      color: i < 5 ? '#fff' : '#94a3b8',
                    }}>{d}</Box>
                  ))}
                </Box>
                <Typography sx={{ fontSize: '9px', color: '#94a3b8', mt: 0.5 }}>5 days/week</Typography>
              </Paper>

              {/* Transportation card — VERIDA + progress bar */}
              <Paper sx={{ p: 1.25, borderRadius: '6px', border: '1px solid #e5e7eb', minWidth: 130 }} elevation={0}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500 }}>Transportation</Typography>
                </Box>
                <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#f97316', mb: 0.25 }}>VERIDA</Typography>
                <Typography sx={{ fontSize: '8px', color: '#94a3b8', mb: 0.5 }}>Expires: 06/30/2026</Typography>
                <Box sx={{ width: '100%', height: 4, bgcolor: '#e5e7eb', borderRadius: 2 }}>
                  <Box sx={{ width: '33%', height: 4, bgcolor: '#3b82f6', borderRadius: 2 }} />
                </Box>
                <Typography sx={{ fontSize: '8px', color: '#6b7280', mt: 0.25 }}>30/90 days</Typography>
              </Paper>

              {/* Attendance card — month + progress */}
              <Paper sx={{ p: 1.25, borderRadius: '6px', border: '1px solid #e5e7eb', minWidth: 110 }} elevation={0}>
                <Typography sx={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500, mb: 0.5 }}>Attendance</Typography>
                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#334155', mb: 0.25 }}>April</Typography>
                <Box sx={{ width: '100%', height: 4, bgcolor: '#e5e7eb', borderRadius: 2 }}>
                  <Box sx={{ width: '19%', height: 4, bgcolor: '#10b981', borderRadius: 2 }} />
                </Box>
                <Typography sx={{ fontSize: '8px', color: '#6b7280', mt: 0.25 }}>06/31 days</Typography>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Conversion buttons — per user stories 59-60 */}
        {isInProgress && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1, borderBottom: '1px solid #f3f4f6' }}>
            <Button size="small" variant="contained"
              sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#10b981', borderRadius: '6px', '&:hover': { bgcolor: '#059669' } }}>
              Convert to New Arrival →
            </Button>
          </Box>
        )}
        {!isInProgress && resident.admissionType === 'NEW_ARRIVAL' && resident.status !== 'ACTIVE' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1, borderBottom: '1px solid #f3f4f6' }}>
            <Button size="small" variant="contained"
              sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px' }}>
              Convert to Active →
            </Button>
          </Box>
        )}
        {resident.status === 'ACTIVE' && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 1, borderBottom: '1px solid #f3f4f6' }}>
            <Button size="small" variant="contained" onClick={() => setDischargeOpen(true)}
              sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#ef4444', borderRadius: '6px', '&:hover': { bgcolor: '#dc2626' } }}>
              Discharge Resident
            </Button>
          </Box>
        )}

        {/* Tab Bar — Different for ADH vs ALF per user stories */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 36,
            '& .MuiTab-root': { textTransform: 'none', fontSize: '12px', fontWeight: 500, minHeight: 36, py: 0.5 },
            '& .Mui-selected': { color: '#1e3a5f', fontWeight: 600 },
            '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' },
          }}
        >
          {getTabsForService(isALF, isInProgress, resident, handleTabNavigate, () => setEditProfileOpen(true)).map((tab) => (
            <Tab key={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* ====== TAB CONTENT ====== */}
      <ResidentProvider residentId={resident?.id}>
        <Box sx={{ p: 2.5 }}>
          {getTabsForService(isALF, isInProgress, resident, handleTabNavigate, () => setEditProfileOpen(true)).map((tab, idx) => (
            activeTab === idx ? <Box key={tab.key}>{tab.content}</Box> : null
          ))}
        </Box>
      </ResidentProvider>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ fontSize: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Edit Profile Dialog — user story row 99: Manage resident details */}
      <Dialog open={editProfileOpen} onClose={() => setEditProfileOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '8px', maxHeight: '90vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          Edit Resident Profile
          <IconButton size="small" onClick={() => setEditProfileOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Tabs value={0} sx={{ mb: 2, minHeight: 32, '& .MuiTab-root': { textTransform: 'none', fontSize: '12px', minHeight: 32 }, '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' } }}>
            <Tab label="Demographics" /><Tab label="Payers" /><Tab label="Contacts" /><Tab label="Preferences" />
          </Tabs>

          {/* Demographics tab */}
          <Grid container spacing={1.5}>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>First Name *</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.firstName} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Last Name *</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.lastName} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Date of Birth</Typography>
              <TextField fullWidth size="small" type="date" defaultValue={resident?.dob ? resident.dob.split('T')[0] : ''} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Gender</Typography>
              <Select fullWidth size="small" defaultValue={resident?.gender || ''} sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="M">Male</MenuItem><MenuItem value="F">Female</MenuItem><MenuItem value="OTHER">Other</MenuItem>
              </Select></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Email</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.email} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Phone</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.phone} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Address</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.address} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={2}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>City</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.city} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={2}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>State</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.state} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={2}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Zip</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.zip} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Emergency Contact Name</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.emergencyContactName} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Emergency Contact Phone</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.emergencyContactPhone} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Relationship</Typography>
              <TextField fullWidth size="small" defaultValue={resident?.emergencyContactRelationship} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
          </Grid>

          {/* Frequency Schedule — user story row 100 */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e5e7eb' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', mb: 1.5 }}>Service Days (Frequency Schedule)</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                <Box key={day} sx={{
                  flex: 1, textAlign: 'center', p: 1, borderRadius: '6px', cursor: 'pointer',
                  bgcolor: i < 5 ? '#1e3a5f' : '#f3f4f6',
                  color: i < 5 ? '#fff' : '#6b7280',
                  border: '1px solid', borderColor: i < 5 ? '#1e3a5f' : '#e5e7eb',
                }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 600 }}>{day.substring(0, 3)}</Typography>
                </Box>
              ))}
            </Box>
            <Typography sx={{ fontSize: '11px', color: '#94a3b8', mt: 1 }}>Click days to toggle. Currently: 5 days/week</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditProfileOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={() => { setEditProfileOpen(false); setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' }); }} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      <DischargeWizard
        resident={resident}
        open={dischargeOpen}
        onClose={() => setDischargeOpen(false)}
        onComplete={() => { setSnackbar({ open: true, message: 'Resident discharged successfully', severity: 'success' }); fetchResident(); }}
      />
    </Box>
  );
};

/* ========================================
   RESIDENT PATIENT INFO TAB — Shows real resident data
   Displayed on Patient Information tab for In-Progress residents
   and could be used as read-only view for active residents
   ======================================== */

const ResidentPatientInfoTab: React.FC<{ resident: any; onEditProfile?: () => void }> = ({ resident, onEditProfile }) => {
  const age = calcAge(resident?.dob);
  const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '11px', color: '#94a3b8', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: '13px', color: '#334155' }}>{value || '—'}</Typography>
    </Box>
  );

  return (
    <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>📋 Patient Information</Typography>
        <Button size="small" variant="outlined" onClick={() => onEditProfile?.()} sx={{ fontSize: '11px', textTransform: 'none' }}>✏ Edit Info</Button>
      </Box>

      {/* Personal Details */}
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e3a5f', mb: 1.5, pb: 0.5, borderBottom: '1px solid #e5e7eb' }}>
        Personal Details
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={4}><InfoRow label="Full Name" value={`${resident?.firstName || ''} ${resident?.lastName || ''}`} /></Grid>
        <Grid item xs={4}><InfoRow label="Date of Birth" value={resident?.dob ? new Date(resident.dob).toLocaleDateString() : undefined} /></Grid>
        <Grid item xs={2}><InfoRow label="Age" value={age?.toString()} /></Grid>
        <Grid item xs={2}><InfoRow label="Gender" value={genderLabel(resident?.gender)} /></Grid>
        <Grid item xs={4}><InfoRow label="Email" value={resident?.email} /></Grid>
        <Grid item xs={4}><InfoRow label="Phone" value={resident?.phone} /></Grid>
        <Grid item xs={4}><InfoRow label="Service Type" value={serviceTypeLabels[resident?.primaryService] || resident?.primaryService} /></Grid>
      </Grid>

      {/* Address Details */}
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e3a5f', mb: 1.5, pb: 0.5, borderBottom: '1px solid #e5e7eb' }}>
        Address Details
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6}><InfoRow label="Address" value={resident?.address} /></Grid>
        <Grid item xs={2}><InfoRow label="City" value={resident?.city} /></Grid>
        <Grid item xs={2}><InfoRow label="State" value={resident?.state} /></Grid>
        <Grid item xs={2}><InfoRow label="Zip" value={resident?.zip} /></Grid>
      </Grid>

      {/* Current Living Situation */}
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e3a5f', mb: 1.5, pb: 0.5, borderBottom: '1px solid #e5e7eb' }}>
        Current Living Situation
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={4}><InfoRow label="Billing Type" value={billingLabels[resident?.billingType] || resident?.billingType} /></Grid>
        <Grid item xs={4}><InfoRow label="Admission Date" value={resident?.admissionDate ? new Date(resident.admissionDate).toLocaleDateString() : undefined} /></Grid>
        <Grid item xs={4}><InfoRow label="Facility" value={resident?.facility?.name} /></Grid>
      </Grid>

      {/* Medical & Clinical Information */}
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e3a5f', mb: 1.5, pb: 0.5, borderBottom: '1px solid #e5e7eb' }}>
        Medical & Clinical Information
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}><InfoRow label="Emergency Contact" value={resident?.emergencyContactName} /></Grid>
        <Grid item xs={6}><InfoRow label="Emergency Phone" value={resident?.emergencyContactPhone} /></Grid>
        <Grid item xs={6}><InfoRow label="Primary Physician" value={resident?.primaryPhysicianName} /></Grid>
        <Grid item xs={6}><InfoRow label="Physician Phone" value={resident?.primaryPhysicianPhone} /></Grid>
        <Grid item xs={12}><InfoRow label="Notes" value={resident?.notes} /></Grid>
      </Grid>
    </Paper>
  );
};

/* ========================================
   FACE SHEET TAB — Figma: Face Sheet.png
   6-card grid: Tickets, Allergies, Medication, Vitals, Progress Notes, Activities, Incidents
   ======================================== */

const FaceSheetTab: React.FC<{ isALF: boolean; onNavigateToTab?: (tabKey: string) => void }> = ({ isALF, onNavigateToTab }) => {
  // Figma: Frame 1618877456.png — dashboard-style with recent records in each section
  const SectionCard: React.FC<{ title: string; tabKey: string; icon: React.ReactNode; items: { label: string; detail: string }[] }> = ({ title, tabKey, icon, items }) => (
    <Paper sx={{ p: 2, borderRadius: '8px', border: '1px solid #e5e7eb', minHeight: 160 }} elevation={0}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {icon}
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{title}</Typography>
        </Box>
        <Typography onClick={() => tabKey && onNavigateToTab?.(tabKey)}
          sx={{ fontSize: '10px', color: '#3b82f6', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          View All →
        </Typography>
      </Box>
      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography sx={{ fontSize: '11px', color: '#94a3b8', mb: 1 }}>No records yet</Typography>
          <Button size="small" variant="outlined" onClick={() => tabKey && onNavigateToTab?.(tabKey)}
            sx={{ fontSize: '10px', textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f' }}>
            + Add
          </Button>
        </Box>
      ) : (
        items.map((item, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: i < items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
            <Typography sx={{ fontSize: '11px', color: '#334155' }}>• {item.label}</Typography>
            <Typography sx={{ fontSize: '10px', color: '#94a3b8' }}>{item.detail}</Typography>
          </Box>
        ))
      )}
    </Paper>
  );

  return (
    <Grid container spacing={2}>
      {/* Row 1 */}
      <Grid item xs={4}>
        <SectionCard title={isALF ? 'Tickets' : 'Care Plans'} tabKey={isALF ? 'tickets' : 'careplan'}
          icon={isALF ? <TicketsIcon sx={{ fontSize: 16, color: '#3b82f6' }} /> : <DocsIcon sx={{ fontSize: 16, color: '#3b82f6' }} />}
          items={isALF ? [
            { label: 'Broken light fixture', detail: 'Open' },
            { label: 'AC not working', detail: 'In Progress' },
          ] : [
            { label: 'Deficient knowledge', detail: '10/25/2026' },
            { label: 'Medication adherence', detail: '1/25/2026' },
            { label: 'Fall prevention', detail: '10/25/2026' },
          ]} />
      </Grid>
      <Grid item xs={4}>
        <SectionCard title="Medication" tabKey="medication"
          icon={<MedsIcon sx={{ fontSize: 16, color: '#8b5cf6' }} />}
          items={[
            { label: 'Paracetol 1 tab/6hrs', detail: 'Ongoing' },
            { label: 'Lospresor 1 tab/12hrs', detail: 'Ongoing' },
            { label: 'Nefuron 1 tab/6hrs', detail: 'Ongoing' },
          ]} />
      </Grid>
      <Grid item xs={4}>
        <SectionCard title="Vitals" tabKey="clinical"
          icon={<VitalsIcon sx={{ fontSize: 16, color: '#10b981' }} />}
          items={[
            { label: 'Temp 98.6°F, BP 120/80', detail: '11/17' },
            { label: 'Temp 98.4°F, BP 118/78', detail: '11/16' },
            { label: 'Temp 99.1°F, BP 125/82', detail: '11/15' },
          ]} />
      </Grid>

      {/* Row 2 */}
      <Grid item xs={4}>
        <SectionCard title="Allergies" tabKey="clinical"
          icon={<AllergyIcon sx={{ fontSize: 16, color: '#ef4444' }} />}
          items={[
            { label: 'Cigarette smoke (Cough)', detail: 'Mild' },
            { label: 'Milk (Upset)', detail: 'Mild' },
            { label: 'Dust (Breathing)', detail: 'High' },
          ]} />
      </Grid>
      <Grid item xs={4}>
        <SectionCard title={isALF ? 'Activities' : 'Events'} tabKey={isALF ? '' : 'events'}
          icon={<EventsIcon sx={{ fontSize: 16, color: '#06b6d4' }} />}
          items={isALF ? [
            { label: 'Physical Therapy', detail: '11/26' },
            { label: 'Group Games', detail: '11/25' },
          ] : [
            { label: 'Add medication: Kerendia', detail: '11/17' },
            { label: 'Face-to-Face: Crestor', detail: '10/17' },
          ]} />
      </Grid>
      <Grid item xs={4}>
        <SectionCard title="Progress Notes" tabKey="progress"
          icon={<NotesIcon sx={{ fontSize: 16, color: '#f59e0b' }} />}
          items={[
            { label: 'No Changes — RI team pain', detail: '11/17' },
            { label: 'No Changes — RI team pain', detail: '11/16' },
            { label: 'No Changes — RI team pain', detail: '11/15' },
          ]} />
      </Grid>

      {/* Row 3 */}
      <Grid item xs={4}>
        <SectionCard title={isALF ? 'Incidents' : 'Activities'} tabKey={isALF ? 'incidents' : ''}
          icon={isALF ? <IncidentIcon sx={{ fontSize: 16, color: '#ef4444' }} /> : <EventsIcon sx={{ fontSize: 16, color: '#14b8a6' }} />}
          items={isALF ? [
            { label: 'Slip in hallway (Minor)', detail: '11/15' },
            { label: 'Verbal altercation (Minor)', detail: '11/10' },
          ] : [
            { label: 'Physical Therapy', detail: '11/26' },
            { label: 'Group Games', detail: '11/25' },
            { label: 'Cognitive Games', detail: '10/4' },
          ]} />
      </Grid>
    </Grid>
  );
};

/* ========================================
   CLINICAL DATA TAB — Figma: Face Sheet-3.png, Face Sheet-4.png
   Sub-tabs: Vitals | Allergies
   ======================================== */

const ClinicalDataTab: React.FC = () => {
  const [subTab, setSubTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{
          mb: 2, minHeight: 32,
          '& .MuiTab-root': { textTransform: 'none', fontSize: '12px', minHeight: 32, py: 0.5 },
          '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' },
        }}
      >
        <Tab label="Vitals" />
        <Tab label="Allergies" />
      </Tabs>

      {subTab === 0 && <VitalsTabComponent residentName={undefined} />}
      {subTab === 1 && (
        <AllergiesTabComponent />
      )}
    </Box>
  );
};

/* ========================================
   EMPTY TAB — Reusable empty state matching Figma
   Shows folder icon + "No [X] has been added yet" + Add button
   ======================================== */

const EmptyTab: React.FC<{
  title: string;
  icon?: React.ReactNode;
  buttonLabel: string;
}> = ({ title, buttonLabel }) => (
  <Paper sx={{ p: 4, borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }} elevation={0}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 3 }}>
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{title}</Typography>
      <Chip label="0" size="small" sx={{ fontSize: '10px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
    </Box>

    <Box sx={{ py: 4 }}>
      {/* Folder icon — matching Figma empty state */}
      <Box sx={{
        width: 56, height: 56, borderRadius: '12px', bgcolor: '#f0f4f8', mx: 'auto', mb: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <DocsIcon sx={{ fontSize: 28, color: '#94a3b8' }} />
      </Box>

      <Typography sx={{ fontSize: '13px', color: '#94a3b8', mb: 2.5 }}>
        No {title} has been added yet
      </Typography>

      <Button
        size="small" variant="contained" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
        sx={{
          fontSize: '12px', textTransform: 'none', bgcolor: '#1e3a5f',
          borderRadius: '20px', px: 2.5, py: 0.75,
          '&:hover': { bgcolor: '#162d4a' },
        }}
      >
        {buttonLabel}
      </Button>
    </Box>
  </Paper>
);

/* ========================================
   PATIENT SETUP WIZARD — Figma: Frame 1984078037.png (ADH), Frame 2147225811.png (ALF)
   ADH: Case Agency Selection → Patient Required Doc → Case Manager Setup → Transportation Request → Billing Setup & Clearance
   ALF: Case Agency Selection → Patient & CM Setup → Check Bed Availability → Billing Setup & Clearance → Assessment
   ======================================== */

const PatientSetupWizard: React.FC<{ isALF: boolean }> = ({ isALF }) => {
  const [activeStep, setActiveStep] = useState(0);

  // ADH: 4 steps per Figma Resident (New)/Frame 1618877456.png
  const adhSteps = [
    'Case Agency Selection',
    'Documents Setup',
    'Transportation Request',
    'Billing Setup & Clearance',
  ];

  // ALF: 6 steps per Figma ALF (lead to resident flow)/Send to Case Manager-4.png
  const alfSteps = [
    'Case Agency Selection',
    'Patient Required Doc',
    'Case Manager Setup',
    'Check Bed Availability',
    'Billing Setup & Clearance',
    'Assessment',
  ];

  const steps = isALF ? alfSteps : adhSteps;

  return (
    <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      {/* Stepper header — Figma: horizontal numbered steps */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, px: 1 }}>
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <Box
              onClick={() => setActiveStep(idx)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                opacity: idx <= activeStep ? 1 : 0.5,
              }}
            >
              <Box sx={{
                width: 24, height: 24, borderRadius: '50%',
                bgcolor: idx < activeStep ? '#10b981' : idx === activeStep ? '#1e3a5f' : '#e5e7eb',
                color: idx <= activeStep ? '#fff' : '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 600,
              }}>
                {idx < activeStep ? '✓' : idx + 1}
              </Box>
              <Box>
                <Typography sx={{ fontSize: '9px', color: '#94a3b8', lineHeight: 1 }}>STEP {idx + 1}</Typography>
                <Typography sx={{ fontSize: '11px', fontWeight: idx === activeStep ? 600 : 400, color: idx === activeStep ? '#1e3a5f' : '#6b7280' }}>
                  {step}
                </Typography>
              </Box>
            </Box>
            {idx < steps.length - 1 && (
              <Box sx={{ flex: 1, height: 1, bgcolor: '#e5e7eb', mx: 1 }} />
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* Step content — matching Figma for each step */}
      <Box sx={{ borderTop: '1px solid #e5e7eb', pt: 2.5 }}>
        {/* Step 1: Case Agency Selection (both ADH & ALF) */}
        {activeStep === 0 && <CaseAgencyStep />}

        {isALF ? (
          <>
            {/* ALF Step 2: Patient Required Doc — same as ADH per Figma Send to CM-4.png */}
            {activeStep === 1 && <PatientRequiredDocStep />}
            {/* ALF Step 3: Case Manager Setup — send doc packet to CM per Figma Send to CM-7.png */}
            {activeStep === 2 && <CaseManagerDocStep />}
            {/* ALF Step 4: Check Bed Availability */}
            {activeStep === 3 && <BedAvailabilityStep />}
            {/* ALF Step 5: Billing Setup & Clearance */}
            {activeStep === 4 && <BillingSetupStep />}
            {/* ALF Step 6: Assessment */}
            {activeStep === 5 && <AssessmentStep />}
          </>
        ) : (
          <>
            {/* ADH Step 2: Documents Setup — Figma: Frame 1618877456.png */}
            {activeStep === 1 && <PatientRequiredDocStep />}
            {/* ADH Step 3: Transportation Request */}
            {activeStep === 2 && <TransportationRequestStep />}
            {/* ADH Step 4: Billing Setup & Clearance */}
            {activeStep === 3 && <BillingSetupStep />}
          </>
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: '1px solid #f3f4f6' }}>
          <Button size="small" variant="outlined" disabled={activeStep === 0}
            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
            sx={{ textTransform: 'none', fontSize: '12px' }}>
            Previous
          </Button>
          <Button size="small" variant="contained"
            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
            disabled={activeStep === steps.length - 1}
            sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>
            Next
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

/* ========================================
   STEP 1: Case Agency Selection — Figma: Case Agency.png
   Cards showing agency name, status, email, phone, response days
   ======================================== */

const caseAgencies = [
  { name: 'Binford Ltd.', status: 'Active', email: 'devon.lane@example.com', phone: '(307) 555-0133', responseDays: 4, initials: 'BL', color: '#10b981' },
  { name: 'Binford Ltd.', status: 'Active', email: 'sarah.lane@example.com', phone: '(307) 555-0133', responseDays: 4, initials: 'BL', color: '#3b82f6' },
  { name: 'Binford Ltd.', status: 'Active', email: 'devon.care@example.com', phone: '(307) 555-0133', responseDays: 4, initials: 'BL', color: '#f59e0b' },
  { name: 'Binford Ltd.', status: 'Inactive', email: 'devon.lane@example.com', phone: '(307) 555-0133', responseDays: 4, initials: 'BL', color: '#6b7280' },
  { name: 'Binford Ltd.', status: 'Active', email: 'devon.lane@example.com', phone: '(307) 555-0133', responseDays: 4, initials: 'BL', color: '#ec4899' },
  { name: 'Binford Ltd.', status: 'Active', email: 'devon.lane@example.com', phone: '(307) 555-0133', responseDays: 4, initials: 'BL', color: '#8b5cf6' },
];

const CaseAgencyStep: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [requestState, setRequestState] = useState<'select' | 'sent' | 'approved'>('select');

  // State: "Request Sent" — Figma: Send to Case Manager-2.png
  if (requestState === 'sent') {
    const agency = selected !== null ? caseAgencies[selected] : caseAgencies[0];
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ color: '#3b82f6', fontSize: '18px' }}>●</Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Request Sent To Case Agency</Typography>
        </Box>
        <Typography sx={{ fontSize: '12px', color: '#94a3b8', mb: 2.5 }}>
          Request submitted on 04/15/2026 at 04:15 PM. A Case Manager will be assigned within {agency.responseDays} days. For any questions, please contact the case agency.
        </Typography>
        <Paper sx={{ p: 2, borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', gap: 2, alignItems: 'flex-start' }} elevation={0}>
          <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: agency.color, fontSize: '20px', borderRadius: '10px' }}>{agency.initials}</Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{agency.name}</Typography>
              <Chip label={agency.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: '#d1fae5', color: '#065f46' }} />
            </Box>
            <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>✉ {agency.email}</Typography>
            <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>☎ {agency.phone}</Typography>
          </Box>
        </Paper>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button size="small" variant="outlined" onClick={() => setRequestState('select')}
            sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#fecaca', color: '#ef4444' }}>
            Withdraw Request
          </Button>
          <Button size="small" variant="contained" onClick={() => setRequestState('approved')}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>
            Simulate Approval
          </Button>
        </Box>
      </Box>
    );
  }

  // State: "Request Approved" — Figma: Send to Case Manager-3.png
  if (requestState === 'approved') {
    const agency = selected !== null ? caseAgencies[selected] : caseAgencies[0];
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ color: '#10b981', fontSize: '18px' }}>✓</Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Request Approved with Case Agency</Typography>
        </Box>
        <Typography sx={{ fontSize: '12px', color: '#94a3b8', mb: 2.5 }}>
          Request approved on 04/15/2026 at 04:15 PM. A Case Manager has been assigned by the selected case agency. For any questions or clarifications, please contact the assigned Case Manager.
        </Typography>
        <Paper sx={{ p: 2, borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }} elevation={0}>
          <Avatar variant="rounded" sx={{ width: 64, height: 64, bgcolor: agency.color, fontSize: '20px', borderRadius: '10px' }}>{agency.initials}</Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{agency.name}</Typography>
              <Chip label={agency.status} size="small" sx={{ fontSize: '9px', height: 18, bgcolor: '#d1fae5', color: '#065f46' }} />
            </Box>
            <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>✉ {agency.email}</Typography>
            <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>☎ {agency.phone}</Typography>
          </Box>
        </Paper>
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Case Manager</Typography>
          <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Kristin Watson</Typography>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>✉ kristin.watson@example.com</Typography>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>☎ (307) 555-0133</Typography>
        </Box>
      </Box>
    );
  }

  // State: "Select" — Figma: Send to Case Manager.png (3x2 grid)
  return (
    <Box>
      <Grid container spacing={2}>
        {caseAgencies.map((agency, idx) => (
          <Grid item xs={4} key={`${agency.name}-${idx}`}>
            <Paper
              onClick={() => setSelected(idx)}
              sx={{
                p: 2, borderRadius: '8px', cursor: 'pointer',
                border: selected === idx ? `2px solid ${agency.color}` : '1px solid #e5e7eb',
                '&:hover': { borderColor: agency.color },
              }}
              elevation={0}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: agency.color, fontSize: '12px' }}>{agency.initials}</Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1a1a2e' }}>{agency.name}</Typography>
                    <Chip label={agency.status} size="small" sx={{ fontSize: '8px', height: 16, bgcolor: agency.status === 'Active' ? '#d1fae5' : '#f3f4f6', color: agency.status === 'Active' ? '#065f46' : '#6b7280' }} />
                  </Box>
                </Box>
              </Box>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.25 }}>✉ {agency.email}</Typography>
              <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 1 }}>☎ {agency.phone}</Typography>
              <Box sx={{ textAlign: 'center', pt: 1, borderTop: '1px solid #f3f4f6' }}>
                <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#334155' }}>{agency.responseDays}</Typography>
                <Typography sx={{ fontSize: '10px', color: '#94a3b8' }}>Days</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button size="small" variant="contained" disabled={selected === null}
          onClick={() => setRequestState('sent')}
          sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>
          Request For Case Manager →
        </Button>
      </Box>
    </Box>
  );
};

/* ========================================
   STEP 2 (ADH): Patient Required Doc — Figma: Frame 2147225787.png
   2-column: Mandatory Documents | Optional Documents
   ======================================== */

const mandatoryDocs = ['Intake Form', 'Contract Of Patient', 'State Specific Documents', 'TB Test', 'Adult Day Health Agreement'];
const optionalDocs = ['Insurance Details', 'Document 1', 'Document 2'];

const PatientRequiredDocStep: React.FC = () => {
  const [docState, setDocState] = useState<'select' | 'sent' | 'received'>('select');

  if (docState === 'sent') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ color: '#3b82f6', fontSize: '18px' }}>●</Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Documents Sent To Patient</Typography>
        </Box>
        <Typography sx={{ fontSize: '12px', color: '#94a3b8', mb: 2 }}>
          Submitted on 04/15/2026 at 04:15 PM. Patient has to send these documents in filled version. If you have any questions please contact the patient.
        </Typography>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', mb: 1 }}>Mandatory Documents:</Typography>
        {mandatoryDocs.map(d => <Typography key={d} sx={{ fontSize: '11px', color: '#334155', mb: 0.5 }}>• {d}</Typography>)}
        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', mt: 1.5, mb: 1 }}>Optional Documents:</Typography>
        {optionalDocs.map(d => <Typography key={d} sx={{ fontSize: '11px', color: '#334155', mb: 0.5 }}>• {d}</Typography>)}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button size="small" variant="contained" onClick={() => setDocState('received')}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>Simulate Documents Received</Button>
        </Box>
      </Box>
    );
  }

  if (docState === 'received') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ color: '#10b981', fontSize: '18px' }}>✓</Box>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Documents Received From Patient</Typography>
        </Box>
        <Typography sx={{ fontSize: '12px', color: '#94a3b8', mb: 2 }}>
          Received on 04/17/2026 at 04:15 PM. Patient has sent these documents in filled version. If you have any questions please contact the patient.
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', mb: 1 }}>Mandatory Documents</Typography>
            {mandatoryDocs.map(d => (
              <Box key={d} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, mb: 0.5, border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <DocsIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                  <Typography sx={{ fontSize: '11px', color: '#334155' }}>{d}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip label="Received" size="small" sx={{ fontSize: '8px', height: 16, bgcolor: '#d1fae5', color: '#065f46' }} />
                  <IconButton size="small"><VisibilityIcon sx={{ fontSize: 14, color: '#94a3b8' }} /></IconButton>
                </Box>
              </Box>
            ))}
          </Grid>
          <Grid item xs={6}>
            <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', mb: 1 }}>Optional Documents</Typography>
            {optionalDocs.map(d => (
              <Box key={d} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, mb: 0.5, border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <DocsIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                  <Typography sx={{ fontSize: '11px', color: '#334155' }}>{d}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Chip label="Received" size="small" sx={{ fontSize: '8px', height: 16, bgcolor: '#d1fae5', color: '#065f46' }} />
                  <IconButton size="small"><VisibilityIcon sx={{ fontSize: 14, color: '#94a3b8' }} /></IconButton>
                </Box>
              </Box>
            ))}
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Default: select state — Figma document selection
  return (
    <Box>
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155', mb: 0.5 }}>Select documents to share with patient</Typography>
      <Typography sx={{ fontSize: '11px', color: '#94a3b8', mb: 2 }}>You can select optional documents to include along with the mandatory documents.</Typography>
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', mb: 1 }}>Mandatory Documents</Typography>
          {mandatoryDocs.map((doc) => (
            <Paper key={doc} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, mb: 1, borderRadius: '6px', border: '1px solid #e5e7eb', borderLeft: '3px solid #f59e0b' }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DocsIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                <Typography sx={{ fontSize: '13px', color: '#334155' }}>{doc}</Typography>
              </Box>
              <IconButton size="small"><VisibilityIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></IconButton>
            </Paper>
          ))}
        </Grid>
        <Grid item xs={6}>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', mb: 1 }}>Optional Documents</Typography>
          {optionalDocs.map((doc) => (
            <Paper key={doc} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, mb: 1, borderRadius: '6px', border: '1px solid #e5e7eb' }} elevation={0}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 16, height: 16, border: '1px solid #d1d5db', borderRadius: '3px' }} />
                <DocsIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                <Typography sx={{ fontSize: '13px', color: '#334155' }}>{doc}</Typography>
              </Box>
              <IconButton size="small"><VisibilityIcon sx={{ fontSize: 16, color: '#94a3b8' }} /></IconButton>
            </Paper>
          ))}
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button size="small" variant="contained" onClick={() => setDocState('sent')}
          sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>Send To Patient →</Button>
      </Box>
    </Box>
  );
};

/* ========================================
   ALF STEP 3: Case Manager Setup — Figma: Send to Case Manager-7.png
   Shows Case Manager name, doc packet with checkboxes, "Send to Case Manager" checkbox
   ======================================== */

const CaseManagerDocStep: React.FC = () => (
  <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Case Manager:</Typography>
      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Marcia McKinney</Typography>
    </Box>
    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', mb: 1.5 }}>Packet of Documents</Typography>
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', mb: 1 }}>Mandatory Documents</Typography>
        {mandatoryDocs.map((doc) => (
          <Paper key={doc} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.25, mb: 0.75, borderRadius: '6px', border: '1px solid #e5e7eb', borderLeft: '3px solid #f59e0b' }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <DocsIcon sx={{ fontSize: 14, color: '#6b7280' }} />
              <Typography sx={{ fontSize: '11px', color: '#334155' }}>{doc}</Typography>
            </Box>
            <IconButton size="small"><VisibilityIcon sx={{ fontSize: 14, color: '#94a3b8' }} /></IconButton>
          </Paper>
        ))}
      </Grid>
      <Grid item xs={6}>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', mb: 1 }}>Optional Documents</Typography>
        {optionalDocs.map((doc) => (
          <Paper key={doc} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.25, mb: 0.75, borderRadius: '6px', border: '1px solid #e5e7eb' }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 16, height: 16, border: '1px solid #d1d5db', borderRadius: '3px' }} />
              <DocsIcon sx={{ fontSize: 14, color: '#6b7280' }} />
              <Typography sx={{ fontSize: '11px', color: '#334155' }}>{doc}</Typography>
            </Box>
            <IconButton size="small"><VisibilityIcon sx={{ fontSize: 14, color: '#94a3b8' }} /></IconButton>
          </Paper>
        ))}
      </Grid>
    </Grid>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
      <Box sx={{ width: 16, height: 16, border: '2px solid #1e3a5f', borderRadius: '3px', bgcolor: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: '10px', color: '#fff' }}>✓</Typography>
      </Box>
      <Typography sx={{ fontSize: '11px', color: '#334155' }}>Send to Case Manager</Typography>
    </Box>
  </Box>
);

/* ========================================
   Generic Step Placeholder — for steps 3-5
   ======================================== */

/* ========================================
   STEP 3 (ADH): Case Manager Setup
   AC: Select CM from agency, send documents, track status
   ======================================== */

/* CaseManagerSetupStep removed — ADH has 4 steps per Figma, CM selection is part of Case Agency flow */

/* ========================================
   STEP 4 (ADH): Transportation Request / Verida
   AC: Form with patient name, address, pickup, facility, dates, special needs
   ======================================== */

const TransportationRequestStep: React.FC = () => (
  <Box>
    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', mb: 2 }}>Transportation Request — Verida</Typography>
    <Grid container spacing={1.5}>
      <Grid item xs={6}>
        <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Patient Name</Typography>
        <TextField fullWidth size="small" placeholder="Auto-filled from record" disabled sx={{ '& input': { fontSize: '11px', py: 0.5 }, '& .Mui-disabled': { bgcolor: '#f9fafb' } }} />
      </Grid>
      <Grid item xs={6}>
        <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Patient Address</Typography>
        <TextField fullWidth size="small" placeholder="Enter address" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
      </Grid>
      <Grid item xs={6}>
        <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Pickup Location</Typography>
        <TextField fullWidth size="small" placeholder="Enter pickup location" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
      </Grid>
      <Grid item xs={6}>
        <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Facility Address</Typography>
        <TextField fullWidth size="small" placeholder="Auto-filled" disabled sx={{ '& input': { fontSize: '11px', py: 0.5 }, '& .Mui-disabled': { bgcolor: '#f9fafb' } }} />
      </Grid>
      <Grid item xs={6}>
        <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Scheduled Service Start Date</Typography>
        <TextField fullWidth size="small" type="date" InputLabelProps={{ shrink: true }} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
      </Grid>
      <Grid item xs={6}>
        <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Scheduled Service End Date</Typography>
        <TextField fullWidth size="small" type="date" InputLabelProps={{ shrink: true }} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
      </Grid>
      <Grid item xs={12}>
        <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Special Needs / Notes</Typography>
        <TextField fullWidth size="small" multiline rows={3} placeholder="Enter any special requirements (wheelchair, oxygen, etc.)" sx={{ '& textarea': { fontSize: '11px' } }} />
      </Grid>
    </Grid>
    <Button size="small" variant="contained" sx={{ mt: 2, fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>
      Send to Verida
    </Button>
  </Box>
);

/* ========================================
   STEP 5 (ADH) / STEP 4 (ALF): Billing Setup & Clearance
   AC: Insurance ID, billing codes, authorization number, clearance date, payment
   ======================================== */

const BillingSetupStep: React.FC = () => {
  const [paymentType, setPaymentType] = useState('Medicaid');

  return (
    <Box sx={{ display: 'flex', gap: 3 }}>
      {/* Left: form — Figma: Step 3 Billing Setup & Clearance.png */}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Payment Type</Typography>
          <Select fullWidth size="small" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}
            sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="Medicaid">Medicaid</MenuItem>
            <MenuItem value="Private Pay">Private Pay</MenuItem>
            <MenuItem value="Insurance">Insurance</MenuItem>
            <MenuItem value="Insurance + Medicaid">Insurance + Medicaid</MenuItem>
            <MenuItem value="Copay + Insurance">Copay + Insurance</MenuItem>
            <MenuItem value="Medicaid + Copay">Medicaid + Copay</MenuItem>
          </Select>
        </Box>

        {/* Medicaid form */}
        {paymentType === 'Medicaid' && (
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1.5 }}>Assign Case Manager</Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Agency</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem>
                  <MenuItem value="horizon">Horizon Case Management Services</MenuItem>
                </Select></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Case Manager</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem>
                  <MenuItem value="marcia">Marcia McKinney</MenuItem>
                </Select></Grid>
            </Grid>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1.5 }}>Billing Details</Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Case ID</Typography>
                <TextField fullWidth size="small" placeholder="CA-MED-1564124" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Number of Months</Typography>
                <TextField fullWidth size="small" placeholder="2" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Case Manager</Typography>
                <TextField fullWidth size="small" disabled value="Marcia McKinney" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Case Manager Email</Typography>
                <TextField fullWidth size="small" disabled value="marcia@example.com" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Case Manager Phone</Typography>
                <TextField fullWidth size="small" disabled value="(555) 789-1234" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1 }}>Prior Authorization Details</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>PA Number</Typography>
                <TextField fullWidth size="small" placeholder="PA-" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
          </Box>
        )}

        {/* Private Pay form */}
        {paymentType === 'Private Pay' && (
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1.5 }}>1. Payer Details</Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Payer Name *</Typography>
                <TextField fullWidth size="small" placeholder="John Doe" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Phone</Typography>
                <TextField fullWidth size="small" placeholder="+1 234 567 890" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Email</Typography>
                <TextField fullWidth size="small" placeholder="email@example.com" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Relationship to Patient</Typography>
                <TextField fullWidth size="small" placeholder="Brother" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1.5 }}>Payment Details</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {['Credit Card', 'Cash', 'Check', 'Money Order'].map((method, i) => (
                <Button key={method} size="small" variant={i === 0 ? 'contained' : 'outlined'}
                  sx={{ fontSize: '10px', textTransform: 'none', borderRadius: '6px', ...(i === 0 ? { bgcolor: '#1e3a5f' } : { borderColor: '#e5e7eb', color: '#475569' }) }}>
                  {method}
                </Button>
              ))}
            </Box>
            <Grid container spacing={1.5}>
              <Grid item xs={12}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Card Number</Typography>
                <TextField fullWidth size="small" placeholder="1234 1234 1234 1234" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Expiry Date</Typography>
                <TextField fullWidth size="small" placeholder="MM/YY" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Security Code</Typography>
                <TextField fullWidth size="small" placeholder="CVC Code" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={4}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Zip/Postal Code</Typography>
                <TextField fullWidth size="small" placeholder="12345" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
          </Box>
        )}

        {/* Insurance form */}
        {paymentType === 'Insurance' && (
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1.5 }}>Insurance Details</Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Insurance Carrier</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem>
                  <MenuItem value="bcbs">Blue Cross Blue Shield</MenuItem>
                  <MenuItem value="aetna">Aetna</MenuItem>
                  <MenuItem value="united">United Healthcare</MenuItem>
                </Select></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Plan Name</Typography>
                <TextField fullWidth size="small" placeholder="Enter plan name" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Policy Number</Typography>
                <TextField fullWidth size="small" placeholder="Enter policy number" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Group Number</Typography>
                <TextField fullWidth size="small" placeholder="Enter group number" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1.5 }}>Subscriber Details</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Subscriber Name</Typography>
                <TextField fullWidth size="small" placeholder="Enter name" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Subscriber Date of Birth</Typography>
                <TextField fullWidth size="small" type="date" InputLabelProps={{ shrink: true }} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Membership ID</Typography>
                <TextField fullWidth size="small" placeholder="Enter ID" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Coverage Type</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem>
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="family">Family</MenuItem>
                </Select></Grid>
            </Grid>
          </Box>
        )}

        {/* Insurance + Medicaid form — per user story row 168-171 */}
        {paymentType === 'Insurance + Medicaid' && (
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#6b7280', mb: 2 }}>Configure billing split for insurance and Medicaid portions</Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Insurance Carrier</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem>
                  <MenuItem value="bcbs">Blue Cross Blue Shield</MenuItem><MenuItem value="aetna">Aetna</MenuItem>
                </Select></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Policy Number</Typography>
                <TextField fullWidth size="small" placeholder="Enter policy number" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Medicaid Case ID</Typography>
                <TextField fullWidth size="small" placeholder="CA-MED-" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Split Type</Typography>
                <Select fullWidth size="small" defaultValue="primary" sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="primary">Insurance Primary, Medicaid Secondary</MenuItem>
                  <MenuItem value="equal">Equal Split</MenuItem>
                  <MenuItem value="custom">Custom Split</MenuItem>
                </Select></Grid>
            </Grid>
          </Box>
        )}

        {/* Copay + Insurance form — per user story row 173-174 */}
        {paymentType === 'Copay + Insurance' && (
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#6b7280', mb: 2 }}>Configure billing for Copay + Insurance</Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Insurance Carrier</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem>
                  <MenuItem value="bcbs">Blue Cross Blue Shield</MenuItem><MenuItem value="aetna">Aetna</MenuItem>
                </Select></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Copay Amount</Typography>
                <TextField fullWidth size="small" placeholder="$0.00" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Policy Number</Typography>
                <TextField fullWidth size="small" placeholder="Enter policy number" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Group Number</Typography>
                <TextField fullWidth size="small" placeholder="Enter group number" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
          </Box>
        )}

        {/* Medicaid + Copay form — per Figma: Payment Type _ Medicaid + Copay.png */}
        {paymentType === 'Medicaid + Copay' && (
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#6b7280', mb: 1 }}>Select between copay to fill the details</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
              {['Medicaid', 'Family', 'Copay', 'Verida'].map((tab, i) => (
                <Chip key={tab} label={tab} size="small" variant={i === 0 ? 'filled' : 'outlined'}
                  sx={{ fontSize: '10px', cursor: 'pointer', ...(i === 0 ? { bgcolor: '#1e3a5f', color: '#fff' } : {}) }} />
              ))}
            </Box>
            {/* Medicaid sub-form (default selected) */}
            <Grid container spacing={1.5}>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Agency</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem>
                  <MenuItem value="horizon">Horizon Case Management Services</MenuItem>
                </Select></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Case Manager</Typography>
                <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                  <MenuItem value="" disabled><em>Select</em></MenuItem>
                  <MenuItem value="marcia">Marcia McKinney</MenuItem>
                </Select></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Case ID</Typography>
                <TextField fullWidth size="small" placeholder="CA-MED-1564124" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
              <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>PA Number</Typography>
                <TextField fullWidth size="small" placeholder="PA-" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            </Grid>
            {/* Payer list — per Figma showing 1. Payer, 2. Payer with expand icons */}
            <Box sx={{ mt: 2 }}>
              {[1, 2].map((num) => (
                <Box key={num} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, mb: 0.5, border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{num}. Payer</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>Payment</Typography>
                  <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>$0</Typography>
                </Box>
              ))}
              <Button size="small" sx={{ mt: 1, fontSize: '10px', textTransform: 'none', color: '#3b82f6' }}>+ Add More Payer</Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Right sidebar: running total — Figma: right side panel with payer names */}
      <Paper sx={{ width: 220, p: 2, borderRadius: '8px', border: '1px solid #e5e7eb', alignSelf: 'flex-start' }} elevation={0}>
        <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#334155', mb: 1 }}>{paymentType}</Typography>
        {paymentType === 'Medicaid + Copay' && (
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '10px', color: '#6b7280' }}>Copay</Typography>
            <Typography sx={{ fontSize: '9px', color: '#94a3b8' }}>1. Payer - Kristin Watson</Typography>
            <Typography sx={{ fontSize: '9px', color: '#94a3b8' }}>2. Payer - Cameron Williamson</Typography>
          </Box>
        )}
        {paymentType === 'Private Pay' && (
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '9px', color: '#94a3b8' }}>1. Payer - Kristin Watson</Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Room</Typography>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>$80.00</Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Room Deposit</Typography>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>$80.00</Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f0fdf4', p: 1, borderRadius: '4px' }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#065f46' }}>Total</Typography>
          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#065f46' }}>$80.00</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

/* ========================================
   STEP 3 (ALF): Check Bed Availability
   AC: Real-time census, room type breakdown, color-coded, floor filter
   ======================================== */

const roomData = [
  { room: '201', type: 'Private', floor: 2, bed: 'Bed A', gender: 'Any', initials: 'DL' },
  { room: '201', type: 'Private', floor: 2, bed: 'Bed A', gender: 'Any', initials: 'EH' },
  { room: '201', type: 'Semi-Private', floor: 2, bed: 'Bed A', gender: 'Male', initials: 'AB' },
  { room: '201', type: 'Private', floor: 2, bed: 'Bed A', gender: 'Any', initials: 'KM' },
  { room: '201', type: 'Semi-Private', floor: 2, bed: 'Bed B', gender: 'Female', initials: 'MM' },
  { room: '201', type: 'Private', floor: 2, bed: 'Bed A', gender: 'Any', initials: 'SN' },
  { room: '201', type: 'Semi-Private', floor: 2, bed: 'Bed A', gender: 'Any', initials: 'RE' },
  { room: '201', type: 'Private', floor: 2, bed: 'Bed A', gender: 'Any', initials: 'CW' },
  { room: '201', type: 'Private', floor: 2, bed: 'Bed A', gender: 'Any', initials: 'JC' },
];

const BedAvailabilityStep: React.FC = () => {
  const [roomType, setRoomType] = useState<'Private' | 'Semi-Private'>('Private');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const selectedRoom = selectedIdx !== null ? roomData[selectedIdx] : null;

  return (
    <Box>
      {/* Private / Semi-Private tabs + All Floor filter — Figma: Send to Case Manager-8.png */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {(['Private', 'Semi-Private'] as const).map((type) => (
            <Button key={type} size="small" variant={roomType === type ? 'contained' : 'outlined'}
              onClick={() => setRoomType(type)}
              sx={{
                fontSize: '11px', textTransform: 'none', borderRadius: '16px', px: 2,
                ...(roomType === type
                  ? { bgcolor: '#1e3a5f', color: '#fff', '&:hover': { bgcolor: '#162d4a' } }
                  : { borderColor: '#e5e7eb', color: '#475569' }),
              }}>
              {type}
            </Button>
          ))}
        </Box>
        <Select size="small" defaultValue="all" sx={{ fontSize: '11px', minWidth: 100, '& .MuiSelect-select': { py: 0.5 } }}>
          <MenuItem value="all">All Floor</MenuItem>
          <MenuItem value="1">Floor 1</MenuItem><MenuItem value="2">Floor 2</MenuItem><MenuItem value="3">Floor 3</MenuItem>
        </Select>
      </Box>

      {/* Room cards grid (4 columns) — Figma: room cards with photo, "View Layout" */}
      <Grid container spacing={2}>
        {roomData.map((room, idx) => (
          <Grid item xs={3} key={`room-${idx}`}>
            <Paper
              onClick={() => setSelectedIdx(idx)}
              sx={{
                p: 2, borderRadius: '8px', cursor: 'pointer',
                border: selectedIdx === idx ? '2px solid #1e3a5f' : '1px solid #e5e7eb',
                '&:hover': { borderColor: '#1e3a5f' },
              }}
              elevation={0}
            >
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155', mb: 0.25 }}>Room {room.room}</Typography>
              <Typography sx={{ fontSize: '11px', color: '#94a3b8', mb: 1.5 }}>Floor {room.floor}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: '10px', bgcolor: '#3b82f6' }}>{room.initials}</Avatar>
              </Box>
              <Box
                onClick={(e) => { e.stopPropagation(); setSelectedIdx(idx); setLayoutOpen(true); }}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
              >
                <VisibilityIcon sx={{ fontSize: 13, color: '#3b82f6' }} />
                <Typography sx={{ fontSize: '11px', color: '#3b82f6' }}>View Layout</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* "Confirm & Collect Deposit" button — bottom right */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
        <Button size="small" variant="contained" disabled={selectedIdx === null}
          onClick={() => setConfirmOpen(true)}
          sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>
          Confirm & Collect Deposit →
        </Button>
      </Box>

      {/* Room Layout Modal — Figma: Room Layout (Private/Semi-Private).png */}
      <Dialog open={layoutOpen} onClose={() => setLayoutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600 }}>
          Room Layout ({selectedRoom?.type}) {selectedRoom?.gender !== 'Any' && <Chip label={selectedRoom?.gender} size="small" sx={{ fontSize: '10px', height: 18 }} />}
          <IconButton size="small" onClick={() => setLayoutOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ bgcolor: '#e5e7eb', borderRadius: '12px', p: 3, position: 'relative', minHeight: 280 }}>
            {/* Bed 1 */}
            <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 2, border: '1px solid #d1d5db', width: roomType === 'Semi-Private' ? '42%' : '38%', display: 'inline-block', mr: 2, verticalAlign: 'top' }}>
              <Box sx={{ width: '80%', height: 6, bgcolor: '#d1d5db', borderRadius: 1, mb: 1 }} />
              <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{roomType === 'Semi-Private' ? 'bed 1' : 'Bed'}</Typography>
              <Typography sx={{ fontSize: '10px', color: '#6b7280' }}>90 x 200 cm</Typography>
              <Typography sx={{ fontSize: '11px', color: '#10b981', fontWeight: 600, mt: 0.5 }}>Available</Typography>
              <Button size="small" variant="outlined" onClick={() => { setLayoutOpen(false); setConfirmOpen(true); }}
                sx={{ mt: 1, fontSize: '10px', textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f' }}>
                Select
              </Button>
            </Box>
            {/* Bed 2 for Semi-Private */}
            {roomType === 'Semi-Private' && (
              <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 2, border: '1px solid #d1d5db', width: '42%', display: 'inline-block', verticalAlign: 'top' }}>
                <Box sx={{ width: '80%', height: 6, bgcolor: '#d1d5db', borderRadius: 1, mb: 1 }} />
                <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>bed 2</Typography>
                <Typography sx={{ fontSize: '10px', color: '#6b7280' }}>90 x 200 cm</Typography>
                <Typography sx={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, mt: 0.5 }}>Occupied</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <Avatar sx={{ width: 20, height: 20, fontSize: '8px', bgcolor: '#6b7280' }}>FM</Avatar>
                  <Typography sx={{ fontSize: '10px', color: '#6b7280' }}>Floyd Miles</Typography>
                </Box>
              </Box>
            )}
            <Box sx={{ position: 'absolute', right: 24, top: '40%' }}>
              <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Room</Typography>
              <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>22 sq m</Typography>
            </Box>
            <Box sx={{ position: 'absolute', bottom: 12, left: '45%' }}>
              <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>Door</Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Confirm Bed Assignment — Figma: Modal-1.png */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '14px', fontWeight: 600 }}>
          <Box sx={{ color: '#10b981' }}>✓</Box> Confirm Bed Assignment -
          <Avatar sx={{ width: 22, height: 22, fontSize: '9px', bgcolor: '#3b82f6' }}>{selectedRoom?.initials}</Avatar>
          <IconButton size="small" onClick={() => setConfirmOpen(false)} sx={{ ml: 'auto' }}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ p: 2, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
            {[
              { label: 'Room Number:', value: `Room ${selectedRoom?.room || '303'}` },
              { label: 'Bed:', value: selectedRoom?.bed || 'Bed A' },
              { label: 'Room Type:', value: selectedRoom?.type?.toLowerCase() || 'semi-private' },
              { label: 'Floor:', value: `Floor ${selectedRoom?.floor || 3}` },
              { label: 'Gender Restriction:', value: selectedRoom?.gender || 'Any' },
            ].map((row) => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography sx={{ fontSize: '12px', color: '#6b7280' }}>{row.label}</Typography>
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>{row.value}</Typography>
              </Box>
            ))}
          </Paper>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none' }}>Close</Button>
          <Button onClick={() => { setConfirmOpen(false); setSuccessOpen(true); }} variant="contained" size="small" sx={{ textTransform: 'none', bgcolor: '#1e3a5f' }}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Deposit Payment Success — Figma: Modal-2.png */}
      <Dialog open={successOpen} onClose={() => setSuccessOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent sx={{ textAlign: 'center', pt: 3 }}>
          <Box sx={{ color: '#10b981', fontSize: '32px', mb: 1 }}>✓</Box>
          <Typography sx={{ fontSize: '16px', fontWeight: 600, mb: 0.5 }}>Deposit Payment Done Successfully!</Typography>
          <Typography sx={{ fontSize: '12px', color: '#6b7280', mb: 2 }}>You can proceed with the Billing Setup & Clearance</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, justifyContent: 'center' }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '11px', bgcolor: '#3b82f6' }}>{selectedRoom?.initials || 'DL'}</Avatar>
            <Box sx={{ textAlign: 'left' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Devon Michael Lane</Typography>
              <Typography sx={{ fontSize: '10px', color: '#6b7280' }}>♂ Male</Typography>
            </Box>
          </Box>
          <Paper sx={{ p: 2, borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'left' }} elevation={0}>
            {[
              { label: 'Room Number:', value: `Room ${selectedRoom?.room || '303'}` },
              { label: 'Bed:', value: selectedRoom?.bed || 'Bed A' },
              { label: 'Room Type:', value: selectedRoom?.type || 'Semi-private' },
              { label: 'Floor:', value: `Floor ${selectedRoom?.floor || 3}` },
              { label: 'Gender Restriction:', value: selectedRoom?.gender || 'Any' },
            ].map((row) => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography sx={{ fontSize: '11px', color: '#6b7280' }}>{row.label}</Typography>
                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>{row.value}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, mt: 0.5, bgcolor: '#ecfdf5', mx: -2, px: 2, borderRadius: '4px' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#065f46' }}>Deposit Amount:</Typography>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#065f46' }}>$00.00</Typography>
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setSuccessOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none' }}>Close</Button>
          <Button onClick={() => setSuccessOpen(false)} variant="contained" size="small" sx={{ textTransform: 'none', bgcolor: '#10b981' }}>Okay</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/* ========================================
   STEP 5 (ALF): Assessment / RN Assessment
   AC: Schedule RN, assessment form sections, send for signature
   ======================================== */

const AssessmentStep: React.FC = () => (
  <Box>
    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e', mb: 2 }}>Pre-Admission RN Assessment</Typography>

    {/* Schedule section */}
    <Paper sx={{ p: 2, mb: 2, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1.5 }}>Schedule Assessment</Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={4}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Assigned RN *</Typography>
          <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select RN</em></MenuItem>
            <MenuItem value="sarah">RN Sarah Lee</MenuItem>
            <MenuItem value="maria">RN Maria Garcia</MenuItem>
            <MenuItem value="james">RN James Wilson</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={4}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Assessment Date *</Typography>
          <TextField fullWidth size="small" type="date" InputLabelProps={{ shrink: true }} sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
        </Grid>
        <Grid item xs={4}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Time Slot *</Typography>
          <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select time</em></MenuItem>
            <MenuItem value="9am">9:00 AM</MenuItem>
            <MenuItem value="10am">10:00 AM</MenuItem>
            <MenuItem value="11am">11:00 AM</MenuItem>
            <MenuItem value="1pm">1:00 PM</MenuItem>
            <MenuItem value="2pm">2:00 PM</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={6}>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Location</Typography>
          <TextField fullWidth size="small" placeholder="Facility name or address" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} />
        </Grid>
      </Grid>
      <Button size="small" variant="contained" sx={{ mt: 1.5, fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>
        Schedule Assessment
      </Button>
    </Paper>

    {/* Assessment form sections */}
    <Paper sx={{ p: 2, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1.5 }}>Assessment Form</Typography>
      {[
        'Medical History',
        'Current Medications',
        'Mobility Status',
        'Cognitive Assessment',
        'Dietary Needs',
        'Care Requirements',
      ].map((section) => (
        <Box key={section} sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          p: 1.25, mb: 0.75, borderRadius: '6px', border: '1px solid #e5e7eb',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <DocsIcon sx={{ fontSize: 14, color: '#6b7280' }} />
            <Typography sx={{ fontSize: '12px', color: '#334155' }}>{section}</Typography>
          </Box>
          <Chip label="Not Started" size="small" sx={{ fontSize: '9px', height: 18, bgcolor: '#f3f4f6', color: '#6b7280' }} />
        </Box>
      ))}
      <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
        <Button size="small" variant="outlined" sx={{ fontSize: '11px', textTransform: 'none' }}>Save as Draft</Button>
        <Button size="small" variant="contained" sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>Submit for Approval</Button>
      </Box>
    </Paper>
  </Box>
);
