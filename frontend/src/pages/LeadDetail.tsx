/**
 * Lead Detail Page — 3-panel layout matching Figma exactly
 * Layout: Left Sidebar (profile + activity overview) | Right Content (action bar + tabs)
 * Tabs: Patient Information | Schedule | Call Summary | SMS Summary | Notes | All Activities
 * Figma ref: Lead Management/Activity.png, Patient Information.png, notes-*.png
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Avatar, Chip, IconButton, Tabs, Tab, Paper,
  TextField, Button, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Select, MenuItem,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Sms as SmsIcon,
  Event as VisitIcon,
  NoteAlt as NotesIcon,
  Mail as MailIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  CreditCard as RateCardIcon,
  PersonAdd as ConvertIcon,
  Block as RejectIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { leadService, LeadActivity, LeadNote } from '../services/lead.service';
import { useAuth } from '../contexts/AuthContext';

/* ========== Constants ========== */

const statusDisplay: Record<string, { label: string; color: string }> = {
  PROSPECT: { label: 'New', color: '#3b82f6' },
  QUALIFIED: { label: 'Qualified', color: '#10b981' },
  DOCUMENTATION: { label: 'Documentation', color: '#8b5cf6' },
  VISIT_SCHEDULED: { label: 'Visit Scheduled', color: '#6366f1' },
  CONVERTING: { label: 'In-progress', color: '#f59e0b' },
  CONVERTED: { label: 'Converted', color: '#10b981' },
  NURTURE: { label: 'Nurture', color: '#f59e0b' },
  NOT_QUALIFIED: { label: 'Rejected', color: '#ef4444' },
  CLOSED: { label: 'Closed', color: '#6b7280' },
};

const serviceTypeLabels: Record<string, string> = {
  ALF: 'ALF', ADH: 'ADH', HOME_CARE: 'Home Care', MC: 'MC', IL: 'IL',
};

const activityIcons: Record<string, { icon: string; color: string }> = {
  LEAD_CREATED: { icon: '🆕', color: '#3b82f6' },
  STATUS_CHANGED: { icon: '🔄', color: '#f59e0b' },
  NOTE_ADDED: { icon: '📝', color: '#8b5cf6' },
  CALL_MADE: { icon: '📞', color: '#10b981' },
  SMS_SENT: { icon: '💬', color: '#06b6d4' },
  VISIT_SCHEDULED: { icon: '📅', color: '#6366f1' },
  VISIT_COMPLETED: { icon: '✅', color: '#10b981' },
  DOCUMENT_SENT: { icon: '📄', color: '#f97316' },
  RATE_CARD_SENT: { icon: '💰', color: '#f59e0b' },
  LEAD_REJECTED: { icon: '❌', color: '#ef4444' },
  LEAD_CONVERTED: { icon: '🎉', color: '#10b981' },
};

const sidebarActivityIcons: Record<string, { icon: React.ReactNode; label: string }> = {
  CALL_MADE: { icon: <PhoneIcon sx={{ fontSize: 14 }} />, label: 'Phone Call' },
  SMS_SENT: { icon: <SmsIcon sx={{ fontSize: 14 }} />, label: 'SMS' },
  VISIT_SCHEDULED: { icon: <VisitIcon sx={{ fontSize: 14 }} />, label: 'Visit Scheduled' },
  VISIT_COMPLETED: { icon: <VisitIcon sx={{ fontSize: 14 }} />, label: 'Visit Done' },
  LEAD_CREATED: { icon: <NotesIcon sx={{ fontSize: 14 }} />, label: 'Lead Created' },
  NOTE_ADDED: { icon: <NotesIcon sx={{ fontSize: 14 }} />, label: 'Note Added' },
  LEAD_REJECTED: { icon: <RejectIcon sx={{ fontSize: 14 }} />, label: 'Lead Rejected' },
  STATUS_CHANGED: { icon: <NotesIcon sx={{ fontSize: 14 }} />, label: 'Status Changed' },
};

const formatDateTime = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

const formatShortDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const calcAge = (dob?: string) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
};

const genderLabel = (g?: string) => g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other';

/* ========== Main Component ========== */

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [notification, setNotification] = useState<string | null>(null);

  // Activity state
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);

  // Modal states
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [visitOpen, setVisitOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [moveType, setMoveType] = useState<'new' | 'transfer'>('new');

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  /* ---- Data fetching ---- */

  const fetchLead = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await leadService.getLeadById(id);
      if (res.success) setLead(res.data);
    } catch {
      showSnack('Failed to load lead', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchActivities = useCallback(async () => {
    if (!id) return;
    try {
      setActivitiesLoading(true);
      const res = await leadService.getActivities(id);
      if (res.success) setActivities(res.data || []);
    } catch { /* silent */ } finally {
      setActivitiesLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLead(); }, [fetchLead]);
  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  /* ---- Actions ---- */

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) return;
    try {
      setRejecting(true);
      const res = await leadService.rejectLead(id, rejectReason.trim());
      if (res.success) {
        setLead(res.data);
        setRejectOpen(false);
        setRejectReason('');
        setNotification(null);
        showSnack('Lead rejected');
        fetchActivities();
      }
    } catch {
      showSnack('Failed to reject lead', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return;
    try {
      setNoteSaving(true);
      const res = await leadService.addNote(id, noteText.trim(), false);
      if (res.success) {
        setNoteText('');
        setNotesOpen(false);
        showSnack('Note added');
        fetchActivities();
      }
    } catch {
      showSnack('Failed to add note', 'error');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleMoveToResident = async () => {
    if (!id || !lead) return;
    try {
      setMoving(true);
      const res = await leadService.convertLeadToResident(id, lead.facilityId?.toString() || '1');
      if (res.success) {
        setMoveOpen(false);
        showSnack('Lead moved to Residents');
        fetchLead();
        fetchActivities();
      }
    } catch {
      showSnack('Failed to move lead', 'error');
    } finally {
      setMoving(false);
    }
  };

  /* ---- Loading / Error ---- */

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">Lead not found</Typography>
        <Button onClick={() => navigate('/leads')} sx={{ mt: 2 }}>Back to Leads</Button>
      </Box>
    );
  }

  const status = statusDisplay[lead.status] || { label: lead.status, color: '#6b7280' };
  const leadIdFormatted = `#LY${String(lead.id).padStart(3, '0')}`;
  const address = [lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ');

  /* ========== RENDER ========== */

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 56px)', bgcolor: '#f5f6fa' }}>

      {/* ====== LEFT SIDEBAR ====== */}
      <Box
        sx={{
          width: 250, minWidth: 250, bgcolor: '#fff', borderRight: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', overflow: 'auto',
        }}
      >
        {/* Profile section */}
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 80, height: 80, mx: 'auto', mb: 1,
              bgcolor: '#3b82f6', fontSize: '28px', fontWeight: 600, borderRadius: '10px',
            }}
          >
            {`${lead.firstName?.charAt(0) || ''}${lead.lastName?.charAt(0) || ''}`.toUpperCase()}
          </Avatar>
          <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1a1a2e' }}>
            {lead.firstName} {lead.lastName}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: status.color, fontWeight: 600 }}>
            {status.label}
          </Typography>

          {/* Tags */}
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 1, flexWrap: 'wrap' }}>
            <Chip label={leadIdFormatted} size="small" sx={{ fontSize: '10px', height: 20, bgcolor: '#f3f4f6', color: '#6b7280' }} />
            {lead.interestedIn && (
              <Chip label={serviceTypeLabels[lead.interestedIn] || lead.interestedIn} size="small"
                sx={{ fontSize: '10px', height: 20, bgcolor: '#dbeafe', color: '#1e40af' }} />
            )}
            {lead.billingType && (
              <Chip label={lead.billingType === 'MEDICAID' ? 'Medicaid' : lead.billingType === 'PRIVATE_PAY' ? 'Private Pay' : lead.billingType}
                size="small" sx={{ fontSize: '10px', height: 20, bgcolor: '#dbeafe', color: '#1e40af' }} />
            )}
          </Box>
        </Box>

        {/* Contact info */}
        <Box sx={{ px: 2, pb: 1.5 }}>
          {lead.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
              <MailIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
              <Typography sx={{ fontSize: '11px', color: '#475569', wordBreak: 'break-all' }}>{lead.email}</Typography>
            </Box>
          )}
          {lead.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
              <PhoneIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
              <Typography sx={{ fontSize: '11px', color: '#475569' }}>{lead.phone}</Typography>
            </Box>
          )}
          {address && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
              <LocationIcon sx={{ fontSize: 13, color: '#94a3b8', mt: 0.2 }} />
              <Typography sx={{ fontSize: '11px', color: '#475569' }}>{address}</Typography>
            </Box>
          )}
        </Box>

        {/* Quick action circle buttons — Figma: Call, SMS, Visit, Notes */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, py: 1.5, borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
          {[
            { icon: <PhoneIcon sx={{ fontSize: 16 }} />, label: 'Call', color: '#3b82f6', onClick: () => setCallOpen(true) },
            { icon: <SmsIcon sx={{ fontSize: 16 }} />, label: 'SMS', color: '#10b981', onClick: () => setActiveTab(3) },
            { icon: <VisitIcon sx={{ fontSize: 16 }} />, label: 'Visit', color: '#f59e0b', onClick: () => setVisitOpen(true) },
            { icon: <NotesIcon sx={{ fontSize: 16 }} />, label: 'Notes', color: '#8b5cf6', onClick: () => setNotesOpen(true) },
          ].map((btn) => (
            <Box key={btn.label} sx={{ textAlign: 'center' }}>
              <IconButton
                onClick={btn.onClick}
                sx={{
                  width: 36, height: 36, bgcolor: `${btn.color}10`, color: btn.color,
                  border: `1px solid ${btn.color}30`, '&:hover': { bgcolor: `${btn.color}20` },
                }}
              >
                {btn.icon}
              </IconButton>
              <Typography sx={{ fontSize: '9px', color: '#6b7280', mt: 0.25 }}>{btn.label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Activity Overview — always visible in sidebar */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1.5 }}>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1a1a2e', mb: 1 }}>Activity Overview</Typography>
          {activitiesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={18} /></Box>
          ) : activities.length === 0 ? (
            <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>No activities yet</Typography>
          ) : (
            activities.slice(0, 10).map((a) => {
              const info = sidebarActivityIcons[a.activityType] || { icon: <NotesIcon sx={{ fontSize: 14 }} />, label: a.activityType };
              return (
                <Box key={a.id} onClick={() => setActiveTab(5)} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.25, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' }, borderRadius: '4px', p: 0.5, mx: -0.5 }}>
                  <Box sx={{ color: '#6b7280', mt: 0.2 }}>{info.icon}</Box>
                  <Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#334155' }}>
                      {info.label} <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>{formatShortDate(a.createdAt)}</span>
                    </Typography>
                    {a.description && (
                      <Typography sx={{ fontSize: '10px', color: '#94a3b8' }}>
                        {a.description.substring(0, 35)}{a.description.length > 35 ? '...' : ''}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* ====== RIGHT CONTENT AREA ====== */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

        {/* Top Action Bar — Figma: notification + buttons */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1, bgcolor: '#fff', borderBottom: '1px solid #e5e7eb',
        }}>
          {/* Left: notification — Figma: green bubble + Guardians info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#d1fae5', px: 1.5, py: 0.5, borderRadius: '16px' }}>
              <Typography sx={{ fontSize: '11px', color: '#065f46' }}>
                {notification || '● A new lead was added'}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
              Guardians: <strong style={{ color: '#334155' }}>{lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'System'}</strong>
            </Typography>
          </Box>

          {/* Right: action buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small" variant="outlined" startIcon={<RateCardIcon sx={{ fontSize: 14 }} />}
              onClick={() => showSnack('Rate Card feature coming soon')}
              sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#e5e7eb', color: '#475569', borderRadius: '6px' }}
            >
              Send Rate Card
            </Button>
            <Button
              size="small" variant="outlined" startIcon={<ConvertIcon sx={{ fontSize: 14 }} />}
              onClick={() => setMoveOpen(true)}
              disabled={lead.status === 'CONVERTED' || lead.status === 'NOT_QUALIFIED'}
              sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#10b981', color: '#10b981', borderRadius: '6px', '&:hover': { bgcolor: '#ecfdf5' } }}
            >
              Move to Residents
            </Button>
            <Button
              size="small" variant="outlined" startIcon={<RejectIcon sx={{ fontSize: 14 }} />}
              onClick={() => setRejectOpen(true)}
              disabled={lead.status === 'NOT_QUALIFIED' || lead.status === 'CONVERTED'}
              sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#fecaca', color: '#ef4444', borderRadius: '6px' }}
            >
              Reject Lead
            </Button>
          </Box>
        </Box>

        {/* Tab Bar — Figma: Patient Information | Schedule | Call Summary | SMS Summary | Notes | All Activities */}
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              px: 2, minHeight: 36,
              '& .MuiTab-root': { textTransform: 'none', fontSize: '12px', fontWeight: 500, minHeight: 36, py: 0.5 },
              '& .Mui-selected': { color: '#1e3a5f', fontWeight: 600 },
              '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' },
            }}
          >
            <Tab label="Patient Information" />
            <Tab label="Schedule" />
            <Tab label="Call Summary" />
            <Tab label="SMS Summary" />
            <Tab label="Notes" />
            <Tab label="All Activities" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
          {activeTab === 0 && <PatientInformationTab lead={lead} />}
          {activeTab === 1 && <ScheduleTab />}
          {activeTab === 2 && <CallSummaryTab activities={activities} />}
          {activeTab === 3 && <SmsSummaryTab activities={activities} />}
          {activeTab === 4 && <NotesTabContent leadId={id!} />}
          {activeTab === 5 && (
            <AllActivitiesTab activities={activities} loading={activitiesLoading} expanded={expandedActivity} onToggle={setExpandedActivity} />
          )}
        </Box>
      </Box>

      {/* ====== MODALS ====== */}

      {/* Reject Lead — Figma: Modal.png (free-text reason) */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '15px', fontWeight: 600 }}>
          <WarningIcon sx={{ color: '#ef4444', fontSize: 20 }} />
          Lead Rejection -
          <Avatar sx={{ width: 24, height: 24, fontSize: '10px', bgcolor: '#3b82f6' }}>
            {`${lead.firstName?.charAt(0) || ''}${lead.lastName?.charAt(0) || ''}`.toUpperCase()}
          </Avatar>
          {lead.firstName} {lead.lastName}
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={() => setRejectOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 0.5 }}>Reject this Lead?</Typography>
          <Typography sx={{ fontSize: '12px', color: '#6b7280', mb: 2 }}>
            Are you sure you want to reject this lead? The action is irreversible.
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#334155', mb: 0.5 }}>Reason Description</Typography>
          <TextField
            fullWidth multiline rows={4} size="small"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectOpen(false)} variant="outlined" size="small"
            sx={{ textTransform: 'none', borderColor: '#e5e7eb', color: '#475569' }}>
            Close
          </Button>
          <Button onClick={handleReject} variant="contained" size="small" disabled={rejecting || !rejectReason.trim()}
            sx={{ textTransform: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
            {rejecting ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Modal — Figma: Notes.png (simple textarea) */}
      <Dialog open={notesOpen} onClose={() => setNotesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', fontWeight: 600 }}>
          Notes
          <IconButton size="small" onClick={() => setNotesOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '12px', color: '#334155', mb: 0.5, fontWeight: 500 }}>Add Notes</Typography>
          <TextField
            fullWidth multiline rows={5} size="small" placeholder="Type here"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setNotesOpen(false); setNoteText(''); }} variant="outlined" size="small"
            sx={{ textTransform: 'none', borderColor: '#e5e7eb', color: '#475569' }}>
            Cancel
          </Button>
          <Button onClick={handleAddNote} variant="contained" size="small" disabled={noteSaving || !noteText.trim()}
            sx={{ textTransform: 'none', bgcolor: '#1e3a5f' }}>
            {noteSaving ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move to Residents — Figma: ALF (lead to resident flow)/Move to Residents.png */}
      <Dialog open={moveOpen} onClose={() => setMoveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '14px', fontWeight: 600 }}>
          <ConvertIcon sx={{ fontSize: 18, color: '#1e3a5f' }} />
          Move to Residents -
          <Avatar sx={{ width: 24, height: 24, fontSize: '10px', bgcolor: '#3b82f6' }}>
            {`${lead.firstName?.charAt(0) || ''}${lead.lastName?.charAt(0) || ''}`.toUpperCase()}
          </Avatar>
          {lead.firstName} {lead.lastName}
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={() => setMoveOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 0.5 }}>Move to Residents?</Typography>
          <Typography sx={{ fontSize: '12px', color: '#6b7280', mb: 2 }}>
            Are you sure you want to move this lead to Residents?
          </Typography>

          {/* New Resident / Transfer options — matching Figma exactly */}
          <Box
            onClick={() => setMoveType('new')}
            sx={{
              p: 2, mb: 1.5, borderRadius: '8px', cursor: 'pointer',
              border: moveType === 'new' ? '2px solid #1e3a5f' : '1px solid #e5e7eb',
              bgcolor: moveType === 'new' ? '#f0f4ff' : '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{
                width: 18, height: 18, borderRadius: '50%',
                border: moveType === 'new' ? '5px solid #1e3a5f' : '2px solid #d1d5db',
              }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>New Resident</Typography>
            </Box>
            <Typography sx={{ fontSize: '11px', color: '#6b7280', ml: 3.5 }}>
              Create a new resident profile for an individual being admitted to this facility for the first time.
            </Typography>
          </Box>

          <Box
            onClick={() => setMoveType('transfer')}
            sx={{
              p: 2, borderRadius: '8px', cursor: 'pointer',
              border: moveType === 'transfer' ? '2px solid #1e3a5f' : '1px solid #e5e7eb',
              bgcolor: moveType === 'transfer' ? '#f0f4ff' : '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{
                width: 18, height: 18, borderRadius: '50%',
                border: moveType === 'transfer' ? '5px solid #1e3a5f' : '2px solid #d1d5db',
              }} />
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Transfer</Typography>
            </Box>
            <Typography sx={{ fontSize: '11px', color: '#6b7280', ml: 3.5 }}>
              Register a resident transferring from another facility by importing available records to maintain accurate history and uninterrupted care.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMoveOpen(false)} variant="outlined" size="small"
            sx={{ textTransform: 'none', borderColor: '#e5e7eb', color: '#475569' }}>
            Close
          </Button>
          <Button onClick={handleMoveToResident} variant="contained" size="small" disabled={moving}
            sx={{ textTransform: 'none', bgcolor: '#1e3a5f' }}>
            {moving ? 'Moving...' : 'Done'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ fontSize: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Start Call Modal — Figma: Start Call.png */}
      <Dialog open={callOpen} onClose={() => setCallOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          Start Call <IconButton size="small" onClick={() => setCallOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Paper sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, mb: 2, bgcolor: '#f8fafc', borderRadius: '8px' }} elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon sx={{ fontSize: 16, color: '#6b7280' }} />
              <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{lead?.phone || '(307) 555-0133'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '9px', bgcolor: '#3b82f6' }}>
                {`${lead?.firstName?.charAt(0) || ''}${lead?.lastName?.charAt(0) || ''}`.toUpperCase()}
              </Avatar>
              <Typography sx={{ fontSize: '12px', color: '#334155' }}>{lead?.firstName} {lead?.lastName}</Typography>
            </Box>
          </Paper>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1 }}>Call Type</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
            {['Inquiry', 'Follow up', 'Visit Confirmation', 'Payment Discussion'].map((t, i) => (
              <Button key={t} size="small" variant={i === 0 ? 'contained' : 'outlined'}
                sx={{ fontSize: '10px', textTransform: 'none', borderRadius: '16px', px: 1.5, ...(i === 0 ? { bgcolor: '#1e3a5f' } : { borderColor: '#e5e7eb', color: '#475569' }) }}>
                {t}
              </Button>
            ))}
          </Box>
          <Typography sx={{ fontSize: '12px', color: '#334155', mb: 0.5 }}>Pre-call Notes (Optional)</Typography>
          <TextField fullWidth size="small" multiline rows={4} placeholder="Your message..." sx={{ '& textarea': { fontSize: '11px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCallOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={() => { setCallOpen(false); showSnack('Call initiated'); }} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Start Call</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Visit Modal — Figma: Schedule Visit.png */}
      <Dialog open={visitOpen} onClose={() => setVisitOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, fontSize: '15px', fontWeight: 600 }}>
          Schedule Visit <IconButton size="small" onClick={() => setVisitOpen(false)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#334155', mb: 1 }}>Visit Type</Typography>
          <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
            {['Facility Tour', 'Consultation'].map((t, i) => (
              <Button key={t} size="small" variant={i === 0 ? 'contained' : 'outlined'}
                sx={{ fontSize: '10px', textTransform: 'none', borderRadius: '16px', px: 1.5, ...(i === 0 ? { bgcolor: '#1e3a5f' } : { borderColor: '#e5e7eb', color: '#475569' }) }}>
                {t}
              </Button>
            ))}
          </Box>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Visit Date</Typography>
              <TextField fullWidth size="small" type="date" sx={{ '& input': { fontSize: '11px', py: 0.5 } }} /></Grid>
            <Grid item xs={6}><Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Time Slot</Typography>
              <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', '& .MuiSelect-select': { py: 0.5 } }}>
                <MenuItem value="" disabled><em>Select Time Slot</em></MenuItem>
                <MenuItem value="9am">9:00 AM</MenuItem><MenuItem value="10am">10:00 AM</MenuItem><MenuItem value="11am">11:00 AM</MenuItem>
                <MenuItem value="1pm">1:00 PM</MenuItem><MenuItem value="2pm">2:00 PM</MenuItem><MenuItem value="3pm">3:00 PM</MenuItem>
              </Select></Grid>
          </Grid>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Preferred Location</Typography>
          <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', mb: 1.5, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Select</em></MenuItem><MenuItem value="facility">Facility</MenuItem><MenuItem value="home">Home Visit</MenuItem>
          </Select>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Assigned Staff Member</Typography>
          <Select fullWidth size="small" defaultValue="" displayEmpty sx={{ fontSize: '11px', mb: 1.5, '& .MuiSelect-select': { py: 0.5 } }}>
            <MenuItem value="" disabled><em>Assign staff Member</em></MenuItem><MenuItem value="admin">Admin</MenuItem><MenuItem value="manager">Manager</MenuItem>
          </Select>
          <Typography sx={{ fontSize: '10px', color: '#6b7280', mb: 0.3 }}>Enter Additional Notes (Optional)</Typography>
          <TextField fullWidth size="small" multiline rows={4} placeholder="Your message..." sx={{ '& textarea': { fontSize: '11px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVisitOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', fontSize: '12px' }}>Cancel</Button>
          <Button onClick={() => { setVisitOpen(false); showSnack('Visit scheduled'); }} variant="contained" size="small" sx={{ textTransform: 'none', fontSize: '12px', bgcolor: '#1e3a5f' }}>Schedule Visit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/* ========================================
   PATIENT INFORMATION TAB — Figma: Patient Information.png
   Read-only display of lead data in sections
   ======================================== */

const PatientInformationTab: React.FC<{ lead: any }> = ({ lead }) => {
  const age = calcAge(lead.dob);

  const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontSize: '11px', color: '#94a3b8', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: '13px', color: '#334155' }}>{value || '—'}</Typography>
    </Box>
  );

  return (
    <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', mb: 0.5 }}>
        📋 Patient Information
      </Typography>

      {/* Personal Details */}
      <Box sx={{ mt: 2, mb: 2.5 }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e3a5f', mb: 1.5, pb: 0.5, borderBottom: '1px solid #e5e7eb' }}>
          Personal Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}><InfoRow label="Full Name" value={`${lead.firstName || ''} ${lead.lastName || ''}`} /></Grid>
          <Grid item xs={4}><InfoRow label="Date of Birth" value={lead.dob ? new Date(lead.dob).toLocaleDateString() : undefined} /></Grid>
          <Grid item xs={2}><InfoRow label="Age" value={age?.toString()} /></Grid>
          <Grid item xs={2}><InfoRow label="Gender" value={genderLabel(lead.gender)} /></Grid>
          <Grid item xs={4}><InfoRow label="Email" value={lead.email} /></Grid>
          <Grid item xs={4}><InfoRow label="Phone" value={lead.phone} /></Grid>
          <Grid item xs={4}><InfoRow label="Source" value={lead.source} /></Grid>
        </Grid>
      </Box>

      {/* Address Details */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e3a5f', mb: 1.5, pb: 0.5, borderBottom: '1px solid #e5e7eb' }}>
          Address Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}><InfoRow label="Address" value={lead.address} /></Grid>
          <Grid item xs={2}><InfoRow label="City" value={lead.city} /></Grid>
          <Grid item xs={2}><InfoRow label="State" value={lead.state} /></Grid>
          <Grid item xs={2}><InfoRow label="Zip" value={lead.zip} /></Grid>
        </Grid>
      </Box>

      {/* Current Living Situation */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e3a5f', mb: 1.5, pb: 0.5, borderBottom: '1px solid #e5e7eb' }}>
          Current Living Situation
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}><InfoRow label="Service Type" value={lead.interestedIn ? (serviceTypeLabels[lead.interestedIn] || lead.interestedIn) : undefined} /></Grid>
          <Grid item xs={4}><InfoRow label="Billing Type" value={lead.billingType} /></Grid>
          <Grid item xs={4}><InfoRow label="Facility" value={lead.facility?.name} /></Grid>
        </Grid>
      </Box>

      {/* Medical & Clinical Information */}
      <Box>
        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1e3a5f', mb: 1.5, pb: 0.5, borderBottom: '1px solid #e5e7eb' }}>
          Medical & Clinical Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}><InfoRow label="Notes" value={lead.notes} /></Grid>
          <Grid item xs={6}><InfoRow label="Assigned To" value={lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : undefined} /></Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

/* ========================================
   SCHEDULE TAB — Figma: notes-2.png, notes-3.png (calendar view)
   Stub with correct layout
   ======================================== */

const ScheduleTab: React.FC = () => (
  <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e' }}>📅 Schedule</Typography>
      <Button size="small" variant="contained" sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}>
        + Schedule New
      </Button>
    </Box>
    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
      <Button size="small" variant="outlined" sx={{ fontSize: '11px', textTransform: 'none' }}>Today</Button>
      <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>← 1 September 2026 →</Typography>
      <Box sx={{ flex: 1 }} />
      <Chip label="Upcoming" size="small" sx={{ fontSize: '10px' }} />
      <Chip label="Past" size="small" variant="outlined" sx={{ fontSize: '10px' }} />
      <Chip label="Week" size="small" variant="outlined" sx={{ fontSize: '10px' }} />
    </Box>
    <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
      <VisitIcon sx={{ fontSize: 48, mb: 1, color: '#d1d5db' }} />
      <Typography sx={{ fontSize: '13px' }}>Schedule calendar will be built with the Scheduling module.</Typography>
    </Box>
  </Paper>
);

/* ========================================
   CALL SUMMARY TAB — Figma: Call Summary in Activity.png
   ======================================== */

const CallSummaryTab: React.FC<{ activities: LeadActivity[] }> = ({ activities }) => {
  const calls = activities.filter(a => a.activityType === 'CALL_MADE');

  return (
    <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', mb: 2 }}>📞 Call Summary</Typography>
      {calls.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
          <PhoneIcon sx={{ fontSize: 40, mb: 1, color: '#d1d5db' }} />
          <Typography sx={{ fontSize: '13px' }}>No calls recorded yet.</Typography>
        </Box>
      ) : (
        calls.map((c) => (
          <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, p: 1.5, borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <PhoneIcon sx={{ fontSize: 16, color: '#10b981' }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{c.title}</Typography>
              <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>{formatDateTime(c.createdAt)}</Typography>
            </Box>
            <Typography sx={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }}>View Summary</Typography>
          </Box>
        ))
      )}
    </Paper>
  );
};

/* ========================================
   SMS SUMMARY TAB — Figma: ChatSummary.png
   ======================================== */

const SmsSummaryTab: React.FC<{ activities: LeadActivity[] }> = ({ activities }) => {
  const sms = activities.filter(a => a.activityType === 'SMS_SENT');

  return (
    <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', mb: 2 }}>💬 SMS Summary</Typography>
      {sms.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
          <SmsIcon sx={{ fontSize: 40, mb: 1, color: '#d1d5db' }} />
          <Typography sx={{ fontSize: '13px' }}>No SMS messages recorded yet.</Typography>
        </Box>
      ) : (
        sms.map((s) => (
          <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, p: 1.5, borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <SmsIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{s.title}</Typography>
              <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>{formatDateTime(s.createdAt)}</Typography>
            </Box>
            <Typography sx={{ fontSize: '12px', color: '#3b82f6', cursor: 'pointer' }}>View Summary</Typography>
          </Box>
        ))
      )}
    </Paper>
  );
};

/* ========================================
   NOTES TAB CONTENT — Figma: notes-1.png (schedule list view in sidebar)
   Shows all notes with timestamps
   ======================================== */

const NotesTabContent: React.FC<{ leadId: string }> = ({ leadId }) => {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await leadService.getNotes(leadId);
        if (res.success) setNotes(res.data || []);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, [leadId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>;

  return (
    <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', mb: 2 }}>📝 Notes</Typography>
      {notes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
          <NotesIcon sx={{ fontSize: 40, mb: 1, color: '#d1d5db' }} />
          <Typography sx={{ fontSize: '13px' }}>No notes yet. Click the Notes icon in the sidebar to add one.</Typography>
        </Box>
      ) : (
        notes.map((note) => (
          <Box key={note.id} sx={{
            mb: 1.5, p: 1.5, borderRadius: '6px', border: '1px solid #e5e7eb',
            bgcolor: note.isPrivate ? '#fefce8' : '#fff',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: note.isPrivate ? '#92400e' : '#1e40af' }}>
                {note.isPrivate ? '🔒 Private' : '🌐 Public'}
                {note.editedAt && <span style={{ color: '#94a3b8', fontWeight: 400 }}> (edited)</span>}
              </Typography>
              <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>{formatDateTime(note.createdAt)}</Typography>
            </Box>
            <Typography sx={{ fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap' }}>{note.content}</Typography>
          </Box>
        ))
      )}
    </Paper>
  );
};

/* ========================================
   ALL ACTIVITIES TAB — Figma: Activity.png (timeline)
   ======================================== */

const AllActivitiesTab: React.FC<{
  activities: LeadActivity[];
  loading: boolean;
  expanded: number | null;
  onToggle: (id: number | null) => void;
}> = ({ activities, loading, expanded, onToggle }) => {
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>;

  if (activities.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
        <Typography sx={{ color: '#94a3b8', fontSize: '13px' }}>No activities recorded for this lead.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 2, color: '#1a1a2e' }}>Activity Timeline</Typography>
      {activities.map((a, i) => {
        const info = activityIcons[a.activityType] || { icon: '📌', color: '#6b7280' };
        const isExpanded = expanded === a.id;
        const isLast = i === activities.length - 1;

        return (
          <Box key={a.id} sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
            {!isLast && (
              <Box sx={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, bgcolor: '#e5e7eb' }} />
            )}
            <Box sx={{
              width: 32, height: 32, borderRadius: '50%', bgcolor: `${info.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0, zIndex: 1,
            }}>
              {info.icon}
            </Box>
            <Box sx={{ flex: 1, pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>{a.title}</Typography>
                <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>{formatDateTime(a.createdAt)}</Typography>
              </Box>
              {a.description && (
                <Box onClick={() => onToggle(isExpanded ? null : a.id)} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <Typography sx={{ fontSize: '12px', color: '#3b82f6', '&:hover': { textDecoration: 'underline' } }}>
                    View Summary
                  </Typography>
                  {isExpanded ? <CollapseIcon sx={{ fontSize: 14, color: '#3b82f6' }} /> : <ExpandIcon sx={{ fontSize: 14, color: '#3b82f6' }} />}
                </Box>
              )}
              {isExpanded && a.description && (
                <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#475569', whiteSpace: 'pre-wrap' }}>{a.description}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
};
