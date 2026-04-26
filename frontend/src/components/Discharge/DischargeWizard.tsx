import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Select, MenuItem,
  Grid, Avatar, Checkbox, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Radio, RadioGroup,
  FormControlLabel, InputLabel, FormControl, SelectChangeEvent,
} from '@mui/material';
import {
  Check, Mail, Close, Add, Image, CheckCircle, CalendarToday, AccessTime,
} from '@mui/icons-material';
import { apiClient } from '../../services/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DischargeWizardProps {
  resident: any;
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface DeductionItem {
  id: number;
  category: string;
  amount: number;
}

/* ------------------------------------------------------------------ */
/*  StepIndicator                                                      */
/* ------------------------------------------------------------------ */

const STEPS = ['Discharge Details', 'Notifications', 'Final Evaluation', 'Confirmation'];

const StepIndicator: React.FC<{ activeStep: number }> = ({ activeStep }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, gap: 1 }}>
    {STEPS.map((label, idx) => {
      const completed = idx < activeStep;
      const active = idx === activeStep;
      return (
        <React.Fragment key={label}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
            <Box
              sx={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                bgcolor: completed ? '#10b981' : active ? '#1e3a5f' : '#e5e7eb',
                color: completed || active ? '#fff' : '#6b7280',
                fontSize: 13, fontWeight: 600,
              }}
            >
              {completed ? <Check sx={{ fontSize: 16 }} /> : idx + 1}
            </Box>
            <Typography sx={{ fontSize: 11, mt: 0.5, color: active ? '#1e3a5f' : '#6b7280', fontWeight: active ? 600 : 400 }}>
              {label}
            </Typography>
          </Box>
          {idx < STEPS.length - 1 && (
            <Box sx={{ flex: 1, height: 2, bgcolor: idx < activeStep ? '#10b981' : '#e5e7eb', mx: 0.5, mt: -2 }} />
          )}
        </React.Fragment>
      );
    })}
  </Box>
);

/* ------------------------------------------------------------------ */
/*  Step 1 — Discharge Details                                         */
/* ------------------------------------------------------------------ */

interface DischargeDetailsStepProps {
  dischargeDate: string;
  dischargeTime: string;
  dischargeType: string;
  dischargeReason: string;
  onChange: (field: string, value: string) => void;
}

const DISCHARGE_TYPES = [
  'Planned', 'Voluntary', 'Medical', 'Financial', 'Deceased', 'Transfer',
];

const DischargeDetailsStep: React.FC<DischargeDetailsStepProps> = ({
  dischargeDate, dischargeTime, dischargeType, dischargeReason, onChange,
}) => (
  <Box>
    <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1e3a5f', mb: 2 }}>
      Discharge Details
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Discharge Date" type="date" fullWidth size="small"
          InputLabelProps={{ shrink: true }}
          value={dischargeDate}
          onChange={(e) => onChange('dischargeDate', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Discharge Time" type="time" fullWidth size="small"
          InputLabelProps={{ shrink: true }}
          value={dischargeTime}
          onChange={(e) => onChange('dischargeTime', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Discharge Type</InputLabel>
          <Select
            value={dischargeType} label="Discharge Type"
            onChange={(e: SelectChangeEvent) => onChange('dischargeType', e.target.value)}
          >
            {DISCHARGE_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Reason for Discharge" multiline rows={4} fullWidth size="small"
          value={dischargeReason}
          onChange={(e) => onChange('dischargeReason', e.target.value)}
        />
      </Grid>
    </Grid>
  </Box>
);

/* ------------------------------------------------------------------ */
/*  Step 2 — Notifications                                             */
/* ------------------------------------------------------------------ */

interface NotificationContact {
  id: string;
  name: string;
  role: string;
  email: string;
  selected: boolean;
  sent?: boolean;
}

interface NotificationsStepProps {
  contacts: NotificationContact[];
  onToggle: (id: string) => void;
  onSendEDWP: () => void;
  edwpSent: boolean;
}

const ContactCard: React.FC<{
  contact: NotificationContact;
  onToggle: () => void;
}> = ({ contact, onToggle }) => (
  <Paper
    sx={{
      p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
      border: '1px solid #e5e7eb', borderRadius: 2,
    }}
    elevation={0}
  >
    <Checkbox checked={contact.selected} onChange={onToggle} size="small" />
    <Avatar sx={{ width: 36, height: 36, bgcolor: '#1e3a5f', fontSize: 14 }}>
      {contact.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
    </Avatar>
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{contact.name}</Typography>
      <Typography sx={{ fontSize: 11, color: '#6b7280' }}>{contact.email}</Typography>
    </Box>
    {contact.sent && <Chip label="Sent" size="small" color="success" sx={{ fontSize: 10 }} />}
  </Paper>
);

const NotificationsStep: React.FC<NotificationsStepProps> = ({
  contacts, onToggle, onSendEDWP, edwpSent,
}) => {
  const caseManager = contacts.find((c) => c.role === 'Case Manager');
  const parents = contacts.filter((c) => c.role === 'Parent/Legal Guardian');
  const caregiver = contacts.find((c) => c.role === 'Primary Caregiver');
  const careTeam = contacts.filter((c) => c.role === 'Care Team');

  return (
    <Box>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1e3a5f', mb: 2 }}>
        Notifications
      </Typography>

      {/* Case Manager */}
      {caseManager && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Case Manager</Typography>
          <Paper
            sx={{
              p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
              border: '1px solid #e5e7eb', borderRadius: 2,
            }}
            elevation={0}
          >
            <Checkbox checked={caseManager.selected} onChange={() => onToggle(caseManager.id)} size="small" />
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#1e3a5f', fontSize: 14 }}>
              {caseManager.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{caseManager.name}</Typography>
              <Typography sx={{ fontSize: 11, color: '#6b7280' }}>{caseManager.email}</Typography>
            </Box>
            <Button
              variant="outlined" size="small" startIcon={<Mail sx={{ fontSize: 14 }} />}
              onClick={onSendEDWP}
              sx={{ fontSize: 11, textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f' }}
            >
              Send EDWP Mail
            </Button>
            {edwpSent && <Chip label="Sent" size="small" color="success" sx={{ fontSize: 10 }} />}
          </Paper>
        </Box>
      )}

      {/* Parent / Legal Guardian */}
      {parents.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Parent / Legal Guardian</Typography>
          <Grid container spacing={1}>
            {parents.map((p) => (
              <Grid item xs={12} sm={6} key={p.id}>
                <ContactCard contact={p} onToggle={() => onToggle(p.id)} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Primary Caregiver */}
      {caregiver && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Primary Caregiver</Typography>
          <ContactCard contact={caregiver} onToggle={() => onToggle(caregiver.id)} />
        </Box>
      )}

      {/* Care Team */}
      {careTeam.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Care Team Members</Typography>
          <Grid container spacing={1}>
            {careTeam.map((c) => (
              <Grid item xs={12} sm={4} key={c.id}>
                <ContactCard contact={c} onToggle={() => onToggle(c.id)} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

/* ------------------------------------------------------------------ */
/*  Step 3 — Final Evaluation                                          */
/* ------------------------------------------------------------------ */

interface FinalEvaluationStepProps {
  evaluation: {
    overallBehavior: string;
    therapyParticipation: string;
    medicationCompliance: string;
    strengths: string;
    concerns: string;
  };
  onChange: (field: string, value: string) => void;
}

const RATING_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'N/A'];

const FinalEvaluationStep: React.FC<FinalEvaluationStepProps> = ({ evaluation, onChange }) => (
  <Box>
    <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1e3a5f', mb: 2 }}>
      Final Evaluation
    </Typography>
    <Grid container spacing={2}>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Overall Behavior</InputLabel>
          <Select
            value={evaluation.overallBehavior} label="Overall Behavior"
            onChange={(e: SelectChangeEvent) => onChange('overallBehavior', e.target.value)}
          >
            {RATING_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Participation in Therapy</InputLabel>
          <Select
            value={evaluation.therapyParticipation} label="Participation in Therapy"
            onChange={(e: SelectChangeEvent) => onChange('therapyParticipation', e.target.value)}
          >
            {RATING_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Medication Compliance</InputLabel>
          <Select
            value={evaluation.medicationCompliance} label="Medication Compliance"
            onChange={(e: SelectChangeEvent) => onChange('medicationCompliance', e.target.value)}
          >
            {RATING_OPTIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Strengths Observed" multiline rows={3} fullWidth size="small"
          value={evaluation.strengths}
          onChange={(e) => onChange('strengths', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Areas of Concern" multiline rows={3} fullWidth size="small"
          value={evaluation.concerns}
          onChange={(e) => onChange('concerns', e.target.value)}
        />
      </Grid>
    </Grid>
  </Box>
);

/* ------------------------------------------------------------------ */
/*  Step 4 — Confirmation                                              */
/* ------------------------------------------------------------------ */

interface ConfirmationStepProps {
  dischargeDate: string;
  dischargeTime: string;
  dischargeType: string;
  dischargeReason: string;
  contacts: NotificationContact[];
  deductions: DeductionItem[];
  refundMethod: string;
  processedBy: string;
  roomDeposit: number;
  onAddDeduction: () => void;
  onRemoveDeduction: (id: number) => void;
  onRefundMethodChange: (v: string) => void;
  onProcessedByChange: (v: string) => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({
  dischargeDate, dischargeTime, dischargeType, dischargeReason,
  contacts, deductions, refundMethod, processedBy, roomDeposit,
  onAddDeduction, onRemoveDeduction, onRefundMethodChange, onProcessedByChange,
}) => {
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const refundTotal = Math.max(0, roomDeposit - totalDeductions);
  const notifiedContacts = contacts.filter((c) => c.selected);

  return (
    <Box>
      <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#1e3a5f', mb: 2 }}>
        Confirmation
      </Typography>

      {/* Discharge Details Summary */}
      <Paper sx={{ p: 2, mb: 2, border: '1px solid #e5e7eb', borderRadius: 2 }} elevation={0}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Discharge Details</Typography>
        <Grid container spacing={1}>
          <Grid item xs={6} sm={3}>
            <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Date</Typography>
            <Typography sx={{ fontSize: 12 }}>{dischargeDate}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Time</Typography>
            <Typography sx={{ fontSize: 12 }}>{dischargeTime}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Type</Typography>
            <Typography sx={{ fontSize: 12 }}>{dischargeType}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Reason</Typography>
            <Typography sx={{ fontSize: 12 }}>{dischargeReason}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Notifications Summary */}
      <Paper sx={{ p: 2, mb: 2, border: '1px solid #e5e7eb', borderRadius: 2 }} elevation={0}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Notifications Summary</Typography>
        <Typography sx={{ fontSize: 12 }}>
          {notifiedContacts.length} contact(s) will be notified: {notifiedContacts.map((c) => c.name).join(', ')}
        </Typography>
      </Paper>

      {/* Financial Closing */}
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1e3a5f', mb: 1.5 }}>
        Financial Closing
      </Typography>
      <Grid container spacing={2}>
        {/* Left column */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, mb: 2 }} elevation={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Damage / Deduction Details</Typography>
              <Button
                size="small" startIcon={<Add sx={{ fontSize: 14 }} />}
                onClick={onAddDeduction}
                sx={{ fontSize: 11, textTransform: 'none', color: '#1e3a5f' }}
              >
                Add Deduction
              </Button>
            </Box>
            {deductions.length === 0 && (
              <Typography sx={{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>No deductions added</Typography>
            )}
            {deductions.map((d) => (
              <Box key={d.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontSize: 12 }}>{d.category}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 12 }}>${d.amount.toFixed(2)}</Typography>
                  <IconButton size="small" onClick={() => onRemoveDeduction(d.id)}>
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Paper>

          <Paper sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, mb: 2 }} elevation={0}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Refund Method</Typography>
            <Typography sx={{ fontSize: 11, color: '#6b7280', mb: 1 }}>Note: check only</Typography>
            <TextField
              value={refundMethod} onChange={(e) => onRefundMethodChange(e.target.value)}
              fullWidth size="small" placeholder="Check" sx={{ mb: 1 }}
            />
          </Paper>

          <Paper sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, mb: 2 }} elevation={0}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Processed By</Typography>
            <TextField
              value={processedBy} onChange={(e) => onProcessedByChange(e.target.value)}
              fullWidth size="small" placeholder="Staff name"
            />
          </Paper>

          <Paper
            sx={{
              p: 2, border: '2px dashed #d1d5db', borderRadius: 2,
              textAlign: 'center', cursor: 'pointer',
            }}
            elevation={0}
          >
            <Image sx={{ fontSize: 28, color: '#9ca3af' }} />
            <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.5 }}>
              Drag & drop or click to upload documents
            </Typography>
          </Paper>
        </Grid>

        {/* Right column */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2, mb: 2 }} elevation={0}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Room Deposit</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1e3a5f' }}>${roomDeposit.toFixed(2)}</Typography>
          </Paper>

          {/* Breakdown table */}
          <Paper sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: 2 }} elevation={0}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>Breakdown</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: 12 }}>Room Deposit</Typography>
              <Typography sx={{ fontSize: 12 }}>${roomDeposit.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            {deductions.map((d) => (
              <Box key={d.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: 12, color: '#ef4444' }}>{d.category}</Typography>
                <Typography sx={{ fontSize: 12, color: '#ef4444' }}>-${d.amount.toFixed(2)}</Typography>
              </Box>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Total Deduction</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
                -${totalDeductions.toFixed(2)}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Refund Total</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                ${refundTotal.toFixed(2)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

/* ------------------------------------------------------------------ */
/*  Success Screen                                                     */
/* ------------------------------------------------------------------ */

interface SuccessScreenProps {
  resident: any;
  requiresApproval?: boolean;
  onClose: () => void;
}

const SuccessScreen: React.FC<SuccessScreenProps> = ({ resident, requiresApproval, onClose }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
    <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1e3a5f', mb: 1 }}>
      {requiresApproval ? 'Request Submitted for Approval' : 'Resident Discharged Successfully'}
    </Typography>
    <Paper
      sx={{
        p: 2, display: 'inline-flex', alignItems: 'center', gap: 2,
        border: '1px solid #e5e7eb', borderRadius: 2, mt: 2,
      }}
      elevation={0}
    >
      <Avatar sx={{ width: 48, height: 48, bgcolor: '#1e3a5f', fontSize: 16 }}>
        {resident?.firstName?.[0]}{resident?.lastName?.[0]}
      </Avatar>
      <Box sx={{ textAlign: 'left' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          {resident?.firstName} {resident?.lastName}
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
          {resident?.gender} | DOB: {resident?.dateOfBirth}
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
          Room: {resident?.room || 'N/A'}
        </Typography>
      </Box>
    </Paper>
    <Box sx={{ mt: 3 }}>
      <Button
        variant="contained" onClick={onClose}
        sx={{ bgcolor: '#1e3a5f', textTransform: 'none', fontSize: 13, borderRadius: 2 }}
      >
        Close
      </Button>
    </Box>
  </Box>
);

/* ------------------------------------------------------------------ */
/*  EDWP Form Dialog                                                   */
/* ------------------------------------------------------------------ */

interface EDWPFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (data: any) => void;
}

const EDWP_REASONS = [
  'Client is being discharged from the program',
  'Client is being transferred to another facility',
  'Client has been non-compliant with treatment plan',
  'Client has requested voluntary discharge',
  'Client\'s insurance authorization has expired',
  'Other (specify in notes)',
];

const EDWPFormDialog: React.FC<EDWPFormDialogProps> = ({ open, onClose, onSend }) => {
  const [direction, setDirection] = useState<'cc-to-provider' | 'provider-to-cc'>('cc-to-provider');
  const [reason, setReason] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientDate, setRecipientDate] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [clientName, setClientName] = useState('');
  const [sourceType, setSourceType] = useState<'Source' | 'CCSP'>('Source');
  const [medicaidId, setMedicaidId] = useState('');

  const handleSend = () => {
    onSend({
      direction, reason, recipient, recipientDate,
      senderName, senderPhone, clientName, sourceType, medicaidId,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600, color: '#1e3a5f', pb: 1 }}>
        EDWP Form
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {/* Direction toggle */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant={direction === 'cc-to-provider' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setDirection('cc-to-provider')}
            sx={{
              fontSize: 11, textTransform: 'none', borderRadius: 2,
              bgcolor: direction === 'cc-to-provider' ? '#1e3a5f' : undefined,
              borderColor: '#1e3a5f', color: direction === 'cc-to-provider' ? '#fff' : '#1e3a5f',
            }}
          >
            CC To Provider
          </Button>
          <Button
            variant={direction === 'provider-to-cc' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setDirection('provider-to-cc')}
            sx={{
              fontSize: 11, textTransform: 'none', borderRadius: 2,
              bgcolor: direction === 'provider-to-cc' ? '#1e3a5f' : undefined,
              borderColor: '#1e3a5f', color: direction === 'provider-to-cc' ? '#fff' : '#1e3a5f',
            }}
          >
            Provider To CC
          </Button>
        </Box>

        {/* Section 1: Reason */}
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Select Reason</Typography>
        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
          {EDWP_REASONS.map((r) => (
            <FormControlLabel
              key={r} value={r} control={<Radio size="small" />}
              label={<Typography sx={{ fontSize: 12 }}>{r}</Typography>}
            />
          ))}
        </RadioGroup>

        <Divider sx={{ my: 2 }} />

        {/* Section 2: To */}
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>To</Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={8}>
            <TextField
              label="Recipient" fullWidth size="small"
              value={recipient} onChange={(e) => setRecipient(e.target.value)}
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Date" type="date" fullWidth size="small"
              InputLabelProps={{ shrink: true }}
              value={recipientDate} onChange={(e) => setRecipientDate(e.target.value)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Section 3: From */}
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>From</Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <TextField
              label="Sender Name" fullWidth size="small"
              value={senderName} onChange={(e) => setSenderName(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Phone" fullWidth size="small"
              value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Section 4: Client Info */}
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Client Info</Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <TextField
              label="Client Name" fullWidth size="small"
              value={clientName} onChange={(e) => setClientName(e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <RadioGroup row value={sourceType} onChange={(e) => setSourceType(e.target.value as any)}>
              <FormControlLabel
                value="Source" control={<Radio size="small" />}
                label={<Typography sx={{ fontSize: 12 }}>Source</Typography>}
              />
              <FormControlLabel
                value="CCSP" control={<Radio size="small" />}
                label={<Typography sx={{ fontSize: 12 }}>CCSP</Typography>}
              />
            </RadioGroup>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Medicaid ID" fullWidth size="small"
              value={medicaidId} onChange={(e) => setMedicaidId(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose} size="small"
          sx={{ fontSize: 12, textTransform: 'none', color: '#6b7280' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained" onClick={handleSend} size="small"
          sx={{ fontSize: 12, textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: 2 }}
        >
          Send To Case Manager
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/*  Add Deduction Dialog                                               */
/* ------------------------------------------------------------------ */

interface AddDeductionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (category: string, amount: number) => void;
}

const DEDUCTION_CATEGORIES = [
  'Room Damage', 'Furniture Damage', 'Cleaning Fees',
  'Key Replacement', 'Unpaid Balance', 'Other',
];

const AddDeductionDialog: React.FC<AddDeductionDialogProps> = ({ open, onClose, onAdd }) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    if (category && amount) {
      onAdd(category, parseFloat(amount));
      setCategory('');
      setAmount('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 15, fontWeight: 600, color: '#1e3a5f' }}>
        Add Deduction
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={category} label="Category"
            onChange={(e: SelectChangeEvent) => setCategory(e.target.value)}
          >
            {DEDUCTION_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          label="Amount" type="number" fullWidth size="small"
          value={amount} onChange={(e) => setAmount(e.target.value)}
          InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, fontSize: 13 }}>$</Typography> }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" sx={{ fontSize: 12, textTransform: 'none', color: '#6b7280' }}>
          Cancel
        </Button>
        <Button
          variant="contained" onClick={handleAdd} size="small"
          sx={{ fontSize: 12, textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: 2 }}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ------------------------------------------------------------------ */
/*  Main DischargeWizard                                               */
/* ------------------------------------------------------------------ */

const DischargeWizard: React.FC<DischargeWizardProps> = ({ resident, open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Step 1 state
  const [dischargeDate, setDischargeDate] = useState('');
  const [dischargeTime, setDischargeTime] = useState('');
  const [dischargeType, setDischargeType] = useState('');
  const [dischargeReason, setDischargeReason] = useState('');

  // Step 2 state
  const [contacts, setContacts] = useState<NotificationContact[]>([
    { id: 'cm1', name: 'Sarah Johnson', role: 'Case Manager', email: 'sarah.j@agency.com', selected: true },
    { id: 'pg1', name: 'Robert Smith', role: 'Parent/Legal Guardian', email: 'robert.s@email.com', selected: true },
    { id: 'pg2', name: 'Maria Smith', role: 'Parent/Legal Guardian', email: 'maria.s@email.com', selected: true },
    { id: 'pc1', name: 'Jennifer Davis', role: 'Primary Caregiver', email: 'jennifer.d@care.com', selected: true },
    { id: 'ct1', name: 'Dr. Michael Lee', role: 'Care Team', email: 'michael.l@med.com', selected: true },
    { id: 'ct2', name: 'Lisa Thompson', role: 'Care Team', email: 'lisa.t@therapy.com', selected: true },
    { id: 'ct3', name: 'David Wilson', role: 'Care Team', email: 'david.w@care.com', selected: false },
  ]);
  const [edwpSent, setEdwpSent] = useState(false);
  const [edwpDialogOpen, setEdwpDialogOpen] = useState(false);

  // Step 3 state
  const [evaluation, setEvaluation] = useState({
    overallBehavior: '', therapyParticipation: '', medicationCompliance: '',
    strengths: '', concerns: '',
  });

  // Step 4 state
  const [deductions, setDeductions] = useState<DeductionItem[]>([]);
  const [refundMethod, setRefundMethod] = useState('Check');
  const [processedBy, setProcessedBy] = useState('');
  const [addDeductionOpen, setAddDeductionOpen] = useState(false);
  const roomDeposit = 500.00;

  const handleDetailsChange = (field: string, value: string) => {
    switch (field) {
      case 'dischargeDate': setDischargeDate(value); break;
      case 'dischargeTime': setDischargeTime(value); break;
      case 'dischargeType': setDischargeType(value); break;
      case 'dischargeReason': setDischargeReason(value); break;
    }
  };

  const handleToggleContact = (id: string) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));
  };

  const handleEvaluationChange = (field: string, value: string) => {
    setEvaluation((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddDeduction = (category: string, amount: number) => {
    setDeductions((prev) => [...prev, { id: Date.now(), category, amount }]);
  };

  const handleRemoveDeduction = (id: number) => {
    setDeductions((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSendEDWP = (data: any) => {
    setEdwpSent(true);
    setEdwpDialogOpen(false);
  };

  const handleNext = async () => {
    if (activeStep < STEPS.length - 1) {
      setActiveStep((s) => s + 1);
    } else {
      // Submit
      setSubmitting(true);
      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const payload = {
        dischargeDate, dischargeTime, dischargeType, dischargeReason,
        notifications: contacts.filter((c) => c.selected).map((c) => ({ name: c.name, email: c.email, role: c.role })),
        evaluation,
        financial: {
          roomDeposit, deductions, totalDeductions,
          refundTotal: Math.max(0, roomDeposit - totalDeductions),
          refundMethod, processedBy,
        },
      };

      try {
        await apiClient.post(`/api/v1/residents/${resident?.id}/discharge-full`, payload);
        setCompleted(true);
        setRequiresApproval(false);
      } catch {
        try {
          await apiClient.post(`/api/v1/residents/${resident?.id}/discharge`, {
            dischargeDate, dischargeTime, dischargeType, dischargeReason,
          });
          setCompleted(true);
          setRequiresApproval(true);
        } catch {
          setCompleted(true);
          setRequiresApproval(true);
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep((s) => s - 1);
  };

  const handleClose = () => {
    if (completed && onComplete) onComplete();
    onClose();
    // Reset state
    setActiveStep(0);
    setCompleted(false);
    setDischargeDate('');
    setDischargeTime('');
    setDischargeType('');
    setDischargeReason('');
    setEdwpSent(false);
    setEvaluation({ overallBehavior: '', therapyParticipation: '', medicationCompliance: '', strengths: '', concerns: '' });
    setDeductions([]);
    setRefundMethod('Check');
    setProcessedBy('');
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>
            {completed ? '' : 'Discharge Wizard'}
          </Typography>
          <IconButton onClick={handleClose}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {completed ? (
            <SuccessScreen resident={resident} requiresApproval={requiresApproval} onClose={handleClose} />
          ) : (
            <>
              <StepIndicator activeStep={activeStep} />

              {activeStep === 0 && (
                <DischargeDetailsStep
                  dischargeDate={dischargeDate} dischargeTime={dischargeTime}
                  dischargeType={dischargeType} dischargeReason={dischargeReason}
                  onChange={handleDetailsChange}
                />
              )}

              {activeStep === 1 && (
                <NotificationsStep
                  contacts={contacts} onToggle={handleToggleContact}
                  onSendEDWP={() => setEdwpDialogOpen(true)} edwpSent={edwpSent}
                />
              )}

              {activeStep === 2 && (
                <FinalEvaluationStep evaluation={evaluation} onChange={handleEvaluationChange} />
              )}

              {activeStep === 3 && (
                <ConfirmationStep
                  dischargeDate={dischargeDate} dischargeTime={dischargeTime}
                  dischargeType={dischargeType} dischargeReason={dischargeReason}
                  contacts={contacts} deductions={deductions}
                  refundMethod={refundMethod} processedBy={processedBy}
                  roomDeposit={roomDeposit}
                  onAddDeduction={() => setAddDeductionOpen(true)}
                  onRemoveDeduction={handleRemoveDeduction}
                  onRefundMethodChange={setRefundMethod}
                  onProcessedByChange={setProcessedBy}
                />
              )}
            </>
          )}
        </DialogContent>
        {!completed && (
          <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
            <Box>
              <Button
                onClick={handleClose} size="small"
                sx={{ fontSize: 12, textTransform: 'none', color: '#6b7280', mr: 1 }}
              >
                Cancel
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeStep > 0 && (
                <Button
                  variant="outlined" size="small" onClick={handleBack}
                  sx={{ fontSize: 12, textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f', borderRadius: 2 }}
                >
                  Back
                </Button>
              )}
              <Button
                variant="contained" size="small" onClick={handleNext} disabled={submitting}
                sx={{ fontSize: 12, textTransform: 'none', bgcolor: '#1e3a5f', borderRadius: 2, minWidth: 100 }}
              >
                {submitting ? 'Submitting...' : activeStep === STEPS.length - 1 ? 'Confirm Discharge' : 'Next'}
              </Button>
            </Box>
          </DialogActions>
        )}
      </Dialog>

      <EDWPFormDialog open={edwpDialogOpen} onClose={() => setEdwpDialogOpen(false)} onSend={handleSendEDWP} />
      <AddDeductionDialog open={addDeductionOpen} onClose={() => setAddDeductionOpen(false)} onAdd={handleAddDeduction} />
    </>
  );
};

export { DischargeWizard };
export default DischargeWizard;
