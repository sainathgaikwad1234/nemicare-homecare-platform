/**
 * Lead Detail Page — Profile header + 5 tabbed sections
 * Tabs: Activity, Communication, Visits, Documentation, Rate & Pricing
 * Matches Figma Lead Detail design (Frame 1984077880)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Avatar, Chip, IconButton, Tabs, Tab, Paper,
  TextField, Button, Menu, MenuItem, Divider, CircularProgress,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Radio, RadioGroup,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Phone as PhoneIcon,
  Sms as SmsIcon,
  Event as VisitIcon,
  Description as DocIcon,
  AttachMoney as PriceIcon,
  Timeline as TimelineIconMui,
  Chat as ChatIcon,
  Edit as EditIcon,
  Lock as PrivateIcon,
  Public as PublicIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  CreditCard as RateCardIcon,
  PersonAdd as ConvertIcon,
  Block as RejectIcon,
  Mail as MailIcon,
  LocationOn as LocationIcon,
  NavigateNext as BreadcrumbIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { leadService, LeadActivity, LeadNote } from '../services/lead.service';
import { useAuth } from '../contexts/AuthContext';

const avatarColors = ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];

const statusDisplay: Record<string, { label: string; color: string }> = {
  PROSPECT: { label: 'New', color: '#3b82f6' },
  QUALIFIED: { label: 'Qualified', color: '#10b981' },
  DOCUMENTATION: { label: 'Documentation', color: '#8b5cf6' },
  VISIT_SCHEDULED: { label: 'Visit Scheduled', color: '#6366f1' },
  CONVERTING: { label: 'Converting', color: '#f59e0b' },
  CONVERTED: { label: 'Converted', color: '#10b981' },
  NURTURE: { label: 'Nurture', color: '#f59e0b' },
  NOT_QUALIFIED: { label: 'Rejected', color: '#ef4444' },
  CLOSED: { label: 'Closed', color: '#6b7280' },
};

const serviceTypeLabels: Record<string, string> = {
  ALF: 'ALF', ADH: 'ADH', HOME_CARE: 'Home Care', MC: 'MC', IL: 'IL',
};

const activityTypeIcons: Record<string, { icon: string; color: string }> = {
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

const rejectionReasons = [
  'Does not meet criteria',
  'No insurance coverage',
  'Lead not responsive',
  'Service area mismatch',
  'Family decision',
  'Other',
];

const formatDateTime = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
};

const calcAge = (dob?: string) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
};

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Activity state
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);

  // Notes state
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteIsPrivate, setNoteIsPrivate] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCustom, setRejectCustom] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const showSnack = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

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
    } catch {
      // silently fail
    } finally {
      setActivitiesLoading(false);
    }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    if (!id) return;
    try {
      setNotesLoading(true);
      const res = await leadService.getNotes(id);
      if (res.success) setNotes(res.data || []);
    } catch {
      // silently fail
    } finally {
      setNotesLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  useEffect(() => {
    if (activeTab === 0) fetchActivities();
    if (activeTab === 1) fetchNotes();
  }, [activeTab, fetchActivities, fetchNotes]);

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return;
    try {
      setNoteSaving(true);
      const res = await leadService.addNote(id, noteText.trim(), noteIsPrivate);
      if (res.success) {
        setNoteText('');
        showSnack(`${noteIsPrivate ? 'Private' : 'Public'} note added`);
        fetchNotes();
        fetchActivities();
      }
    } catch {
      showSnack('Failed to add note', 'error');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = rejectReason === 'Other' ? rejectCustom.trim() : rejectReason;
    if (!reason) { showSnack('Rejection reason is required', 'error'); return; }
    try {
      setRejecting(true);
      const res = await leadService.rejectLead(id, reason);
      if (res.success) {
        setLead(res.data);
        setRejectOpen(false);
        setRejectReason('');
        setRejectCustom('');
        showSnack('Lead rejected');
        fetchActivities();
      }
    } catch {
      showSnack('Failed to reject lead', 'error');
    } finally {
      setRejecting(false);
    }
  };

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
  const age = calcAge(lead.dob);
  const avatarColor = avatarColors[lead.id % avatarColors.length];
  const initials = `${lead.firstName?.charAt(0) || ''}${lead.lastName?.charAt(0) || ''}`.toUpperCase();
  const genderLabel = lead.gender === 'M' ? 'Male' : lead.gender === 'F' ? 'Female' : 'Other';

  const billingLabel = lead.billingType === 'MEDICAID' ? 'Medicaid' : lead.billingType === 'PRIVATE_PAY' ? 'Private Pay' : lead.billingType === 'INSURANCE' ? 'Insurance' : null;
  const address = [lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ');

  return (
    <Box sx={{ bgcolor: '#f5f6fa', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <Box sx={{ display: 'flex', alignItems: 'center', mx: 2, mt: 1, mb: 0.5 }}>
        <Typography
          onClick={() => navigate('/leads')}
          sx={{ fontSize: '13px', color: '#3b82f6', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
        >
          Co Leads
        </Typography>
        <BreadcrumbIcon sx={{ fontSize: 16, color: '#94a3b8', mx: 0.25 }} />
        <Typography sx={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
          {lead.firstName} {lead.lastName}
        </Typography>
      </Box>

      {/* Profile Header — Matches Figma Frame 1984077880 */}
      <Paper sx={{ mx: 2, p: 2.5, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Avatar / Photo */}
          <Avatar
            sx={{
              width: 72, height: 72, bgcolor: avatarColor, fontSize: '24px', fontWeight: 600,
              borderRadius: '8px',
            }}
            variant="rounded"
          >
            {initials}
          </Avatar>

          {/* Lead Info */}
          <Box sx={{ flex: 1 }}>
            {/* Row 1: Name + Status + Tags */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}>
                {lead.firstName} {lead.lastName}
              </Typography>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: status.color }}>
                {status.label}
              </Typography>
              {lead.interestedIn && (
                <Chip
                  label={serviceTypeLabels[lead.interestedIn] || lead.interestedIn}
                  size="small"
                  sx={{
                    fontSize: '11px', height: 22, fontWeight: 500,
                    bgcolor: '#e8edf3', color: '#1e3a5f', borderRadius: '4px',
                  }}
                />
              )}
              {billingLabel && (
                <Chip
                  label={billingLabel}
                  size="small"
                  sx={{
                    fontSize: '11px', height: 22, fontWeight: 500,
                    bgcolor: '#e8edf3', color: '#1e3a5f', borderRadius: '4px',
                  }}
                />
              )}
            </Box>

            {/* Row 2: Age + Email + Phone */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 0.5 }}>
              {age != null && (
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>Age</Typography>
                  <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#334155', lineHeight: 1 }}>{age}</Typography>
                </Box>
              )}
              {lead.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MailIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: '13px', color: '#475569' }}>{lead.email}</Typography>
                </Box>
              )}
              {lead.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: '13px', color: '#475569' }}>{lead.phone}</Typography>
                </Box>
              )}
            </Box>

            {/* Row 3: Gender + Address */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
                {lead.gender === 'M' ? '♂' : lead.gender === 'F' ? '♀' : '⚥'} {genderLabel}
              </Typography>
              {address && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>{address}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* 3-dot menu */}
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ border: '1px solid #e5e7eb', borderRadius: '6px', p: 0.5 }}>
            <MoreIcon sx={{ fontSize: 20, color: '#6b7280' }} />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} PaperProps={{ sx: { minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}>
            <MenuItem onClick={() => { setMenuAnchor(null); navigate(`/leads`); }}>
              <EditIcon sx={{ mr: 1, fontSize: 16, color: '#6b7280' }} />
              <Typography sx={{ fontSize: '13px' }}>Edit Lead</Typography>
            </MenuItem>
            <MenuItem
              onClick={() => { setMenuAnchor(null); setRejectOpen(true); }}
              disabled={lead.status === 'NOT_QUALIFIED' || lead.status === 'CONVERTED'}
            >
              <RejectIcon sx={{ mr: 1, fontSize: 16, color: '#ef4444' }} />
              <Typography sx={{ color: '#ef4444', fontSize: '13px' }}>Reject Lead</Typography>
            </MenuItem>
          </Menu>
        </Box>

        {/* Quick Action Buttons — below header info per MOM-9 */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: '1px solid #f3f4f6' }}>
          <Button
            size="small" variant="outlined" startIcon={<PhoneIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#e5e7eb', color: '#475569', borderRadius: '6px', px: 1.5 }}
          >
            Call
          </Button>
          <Button
            size="small" variant="outlined" startIcon={<SmsIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#e5e7eb', color: '#475569', borderRadius: '6px', px: 1.5 }}
          >
            SMS
          </Button>
          <Button
            size="small" variant="outlined" startIcon={<RateCardIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#e5e7eb', color: '#475569', borderRadius: '6px', px: 1.5 }}
          >
            Send Rate Card
          </Button>
          <Button
            size="small" variant="outlined" startIcon={<VisitIcon sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#e5e7eb', color: '#475569', borderRadius: '6px', px: 1.5 }}
          >
            Schedule Visit
          </Button>
          <Button
            size="small" variant="outlined" startIcon={<RejectIcon sx={{ fontSize: 14 }} />}
            onClick={() => setRejectOpen(true)}
            disabled={lead.status === 'NOT_QUALIFIED' || lead.status === 'CONVERTED'}
            sx={{ fontSize: '11px', textTransform: 'none', borderColor: '#fee2e2', color: '#ef4444', borderRadius: '6px', px: 1.5 }}
          >
            Reject Lead
          </Button>
          <Button
            size="small" variant="contained" startIcon={<ConvertIcon sx={{ fontSize: 14 }} />}
            disabled={lead.status === 'CONVERTED' || lead.status === 'NOT_QUALIFIED'}
            sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: '6px', px: 1.5, '&:hover': { bgcolor: '#162d4a' } }}
          >
            Move to Resident
          </Button>
        </Box>
      </Paper>

      {/* Tabs */}
      <Box sx={{ mx: 2, mt: 1.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontSize: '13px', fontWeight: 500, minHeight: 40 },
            '& .Mui-selected': { color: '#1e3a5f', fontWeight: 600 },
            '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' },
          }}
        >
          <Tab icon={<TimelineIconMui sx={{ fontSize: 16 }} />} iconPosition="start" label="Activity" />
          <Tab icon={<ChatIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Communication" />
          <Tab icon={<VisitIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Visits" />
          <Tab icon={<DocIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Documentation" />
          <Tab icon={<PriceIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Rate & Pricing" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mx: 2, mt: 1 }}>
        {activeTab === 0 && <ActivityTab activities={activities} loading={activitiesLoading} expanded={expandedActivity} onToggle={setExpandedActivity} />}
        {activeTab === 1 && (
          <CommunicationTab
            notes={notes}
            loading={notesLoading}
            noteText={noteText}
            noteIsPrivate={noteIsPrivate}
            noteSaving={noteSaving}
            userId={user?.id}
            onNoteTextChange={setNoteText}
            onNotePrivacyChange={setNoteIsPrivate}
            onAddNote={handleAddNote}
          />
        )}
        {activeTab === 2 && <VisitsTab />}
        {activeTab === 3 && <DocumentationTab />}
        {activeTab === 4 && <RatePricingTab />}
      </Box>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '16px', fontWeight: 600 }}>Reject Lead</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: '#64748b', mb: 2 }}>
            Select a reason for rejecting this lead. This action can be reversed later.
          </Typography>
          <RadioGroup value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
            {rejectionReasons.map((r) => (
              <FormControlLabel key={r} value={r} control={<Radio size="small" />} label={<Typography sx={{ fontSize: '13px' }}>{r}</Typography>} />
            ))}
          </RadioGroup>
          {rejectReason === 'Other' && (
            <TextField
              fullWidth
              size="small"
              placeholder="Enter reason..."
              value={rejectCustom}
              onChange={(e) => setRejectCustom(e.target.value)}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)} size="small">Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error" size="small" disabled={rejecting || (!rejectReason || (rejectReason === 'Other' && !rejectCustom.trim()))}>
            {rejecting ? 'Rejecting...' : 'Reject Lead'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ fontSize: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

/* ========================================
   ACTIVITY TAB — Timeline
   ======================================== */

const ActivityTab: React.FC<{
  activities: LeadActivity[];
  loading: boolean;
  expanded: number | null;
  onToggle: (id: number | null) => void;
}> = ({ activities, loading, expanded, onToggle }) => {
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>;
  }

  if (activities.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
        <Typography sx={{ color: '#94a3b8', fontSize: '13px' }}>No activities recorded for this lead.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 2, color: '#1a1a2e' }}>Activity Timeline</Typography>
      {activities.map((a, i) => {
        const info = activityTypeIcons[a.activityType] || { icon: '📌', color: '#6b7280' };
        const isExpanded = expanded === a.id;
        const isLast = i === activities.length - 1;

        return (
          <Box key={a.id} sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
            {/* Timeline line */}
            {!isLast && (
              <Box sx={{
                position: 'absolute', left: 15, top: 32, bottom: 0, width: 2,
                bgcolor: '#e5e7eb',
              }} />
            )}

            {/* Dot */}
            <Box sx={{
              width: 32, height: 32, borderRadius: '50%', bgcolor: `${info.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', flexShrink: 0, zIndex: 1,
            }}>
              {info.icon}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                  {a.title}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>
                  {formatDateTime(a.createdAt)}
                </Typography>
              </Box>

              {a.description && (
                <Box
                  onClick={() => onToggle(isExpanded ? null : a.id)}
                  sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                >
                  <Typography sx={{ fontSize: '12px', color: '#3b82f6', '&:hover': { textDecoration: 'underline' } }}>
                    View Summary
                  </Typography>
                  {isExpanded ? <CollapseIcon sx={{ fontSize: 14, color: '#3b82f6' }} /> : <ExpandIcon sx={{ fontSize: 14, color: '#3b82f6' }} />}
                </Box>
              )}

              {isExpanded && a.description && (
                <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <Typography sx={{ fontSize: '12px', color: '#475569', whiteSpace: 'pre-wrap' }}>
                    {a.description}
                  </Typography>
                  {a.metadata && Object.keys(a.metadata).length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {Object.entries(a.metadata).map(([k, v]) => (
                        <Typography key={k} sx={{ fontSize: '11px', color: '#94a3b8' }}>
                          {k}: {String(v)}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
};

/* ========================================
   COMMUNICATION TAB — Notes + Call/SMS stubs
   ======================================== */

const CommunicationTab: React.FC<{
  notes: LeadNote[];
  loading: boolean;
  noteText: string;
  noteIsPrivate: boolean;
  noteSaving: boolean;
  userId?: string | number;
  onNoteTextChange: (v: string) => void;
  onNotePrivacyChange: (v: boolean) => void;
  onAddNote: () => void;
}> = ({ notes, loading, noteText, noteIsPrivate, noteSaving, userId, onNoteTextChange, onNotePrivacyChange, onAddNote }) => {
  const [subTab, setSubTab] = useState(0); // 0=Notes, 1=Call, 2=SMS

  return (
    <Box>
      <Tabs
        value={subTab}
        onChange={(_, v) => setSubTab(v)}
        sx={{
          mb: 1.5,
          '& .MuiTab-root': { textTransform: 'none', fontSize: '12px', minHeight: 32, py: 0.5 },
          '& .MuiTabs-indicator': { backgroundColor: '#1e3a5f' },
        }}
      >
        <Tab label="Notes" />
        <Tab label="Call" />
        <Tab label="SMS" />
      </Tabs>

      {subTab === 0 && (
        <Paper sx={{ p: 2, borderRadius: '8px', border: '1px solid #e5e7eb' }} elevation={0}>
          {/* Add note */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Add a note..."
              value={noteText}
              onChange={(e) => onNoteTextChange(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant={noteIsPrivate ? 'outlined' : 'contained'}
                  onClick={() => onNotePrivacyChange(false)}
                  startIcon={<PublicIcon sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: '11px', textTransform: 'none', minWidth: 80 }}
                >
                  Public
                </Button>
                <Button
                  size="small"
                  variant={noteIsPrivate ? 'contained' : 'outlined'}
                  onClick={() => onNotePrivacyChange(true)}
                  startIcon={<PrivateIcon sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: '11px', textTransform: 'none', minWidth: 80 }}
                >
                  Private
                </Button>
              </Box>
              <Button
                size="small"
                variant="contained"
                onClick={onAddNote}
                disabled={!noteText.trim() || noteSaving}
                sx={{ fontSize: '11px', textTransform: 'none', bgcolor: '#1e3a5f' }}
              >
                {noteSaving ? 'Saving...' : 'Save Note'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Notes list */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
          ) : notes.length === 0 ? (
            <Typography sx={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', py: 2 }}>
              No notes yet. Add one above.
            </Typography>
          ) : (
            notes.map((note) => (
              <Box key={note.id} sx={{ mb: 1.5, p: 1.5, borderRadius: '6px', border: '1px solid #e5e7eb', bgcolor: note.isPrivate ? '#fefce8' : '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {note.isPrivate ? (
                      <PrivateIcon sx={{ fontSize: 12, color: '#f59e0b' }} />
                    ) : (
                      <PublicIcon sx={{ fontSize: 12, color: '#3b82f6' }} />
                    )}
                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: note.isPrivate ? '#92400e' : '#1e40af' }}>
                      {note.isPrivate ? 'Private' : 'Public'}
                    </Typography>
                    {note.editedAt && <Typography sx={{ fontSize: '10px', color: '#94a3b8' }}>(edited)</Typography>}
                  </Box>
                  <Typography sx={{ fontSize: '11px', color: '#94a3b8' }}>
                    {formatDateTime(note.createdAt)}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap' }}>
                  {note.content}
                </Typography>
              </Box>
            ))
          )}
        </Paper>
      )}

      {subTab === 1 && (
        <Paper sx={{ p: 3, borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }} elevation={0}>
          <PhoneIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#334155', mb: 0.5 }}>Call Feature</Typography>
          <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
            Call integration will be available once telephony provider is configured.
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#94a3b8', mt: 1 }}>
            Supports: Call type selection, pre-call notes, in-call notes, AI call summary
          </Typography>
        </Paper>
      )}

      {subTab === 2 && (
        <Paper sx={{ p: 3, borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }} elevation={0}>
          <SmsIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#334155', mb: 0.5 }}>SMS Feature</Typography>
          <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
            SMS integration will be available once SMS provider is configured.
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#94a3b8', mt: 1 }}>
            Supports: Send SMS, delivery status, AI SMS summary
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

/* ========================================
   VISITS TAB (stub)
   ======================================== */

const VisitsTab: React.FC = () => (
  <Paper sx={{ p: 3, borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }} elevation={0}>
    <VisitIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
    <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#334155', mb: 0.5 }}>Visits</Typography>
    <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
      Schedule and track facility tours, consultations, and follow-up visits.
    </Typography>
    <Typography sx={{ fontSize: '11px', color: '#94a3b8', mt: 1 }}>
      Will be built with the Scheduling/Calendar module.
    </Typography>
  </Paper>
);

/* ========================================
   DOCUMENTATION TAB (stub)
   ======================================== */

const DocumentationTab: React.FC = () => (
  <Paper sx={{ p: 3, borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }} elevation={0}>
    <DocIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
    <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#334155', mb: 0.5 }}>Documentation</Typography>
    <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
      Mandatory and optional document checklist for lead onboarding.
    </Typography>
    <Typography sx={{ fontSize: '11px', color: '#94a3b8', mt: 1 }}>
      Will be built with the Document Management module.
    </Typography>
  </Paper>
);

/* ========================================
   RATE & PRICING TAB (stub)
   ======================================== */

const RatePricingTab: React.FC = () => (
  <Paper sx={{ p: 3, borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }} elevation={0}>
    <PriceIcon sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
    <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#334155', mb: 0.5 }}>Rate & Pricing</Typography>
    <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
      View and send Private Pay and Medicaid rate cards to leads.
    </Typography>
    <Typography sx={{ fontSize: '11px', color: '#94a3b8', mt: 1 }}>
      Requires rate configuration in Settings.
    </Typography>
  </Paper>
);
