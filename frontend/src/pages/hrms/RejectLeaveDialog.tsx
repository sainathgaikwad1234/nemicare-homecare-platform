import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  IconButton, TextField, Button, Avatar, Chip, Snackbar, Alert,
} from '@mui/material';
import {
  Close as CloseIcon, Mail as MailIcon, Phone as PhoneIcon, Info as InfoIcon,
} from '@mui/icons-material';
import { leaveService, LeaveRequest } from '../../services/leave.service';

interface Props {
  open: boolean;
  leave?: LeaveRequest;
  level: 'supervisor' | 'hr';
  onClose: () => void;
  onSuccess: () => void;
}

export const RejectLeaveDialog: React.FC<Props> = ({ open, leave, level, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'error' | 'success' });

  useEffect(() => { if (open) setReason(''); }, [open]);

  if (!leave) return null;
  const emp = leave.employee;
  const initials = `${emp?.firstName?.[0] || ''}${emp?.lastName?.[0] || ''}`.toUpperCase();
  const fromDate = new Date(leave.fromDate).toLocaleDateString();
  const toDate = new Date(leave.toDate).toLocaleDateString();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setSnackbar({ open: true, message: 'Rejection reason is required', severity: 'error' });
      return;
    }
    setBusy(true);
    try {
      if (level === 'supervisor') {
        await leaveService.supervisorReject(leave.id, reason);
      } else {
        await leaveService.hrReject(leave.id, reason);
      }
      onSuccess();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Reject failed', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>Reject Leave Request</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Profile section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar src={emp?.profilePictureUrl} sx={{ width: 56, height: 56, fontSize: '1.1rem' }}>
            {initials}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 600 }}>{emp?.firstName} {emp?.lastName}</Typography>
              {(emp?.clinicalRole || emp?.designation) && (
                <Chip label={emp.clinicalRole || emp.designation} size="small" sx={{ bgcolor: '#dbeafe', color: '#1e3a5f', height: 20, fontSize: '0.7rem' }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280' }}>
              <MailIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: '0.8rem' }}>{emp?.email}</Typography>
            </Box>
            {emp?.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280' }}>
                <PhoneIcon sx={{ fontSize: 14 }} />
                <Typography sx={{ fontSize: '0.8rem' }}>{emp.phone}</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Leave info row */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>
              <strong>Leave Request -</strong> {new Date(leave.createdAt).toLocaleDateString()}
            </Typography>
            <Chip
              icon={<InfoIcon sx={{ fontSize: 14, color: '#6b7280 !important' }} />}
              label="Reason"
              size="small"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, border: '1px solid #e5e7eb', borderRadius: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>{Number(leave.totalDays)}</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>Days</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>From</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{fromDate}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>To</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{toDate}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>HR Approval</Typography>
              <Chip
                label={leave.hrApprovalStatus.charAt(0) + leave.hrApprovalStatus.slice(1).toLowerCase()}
                size="small"
                sx={{ bgcolor: '#dbeafe', color: '#1e3a5f', height: 20, fontSize: '0.7rem', mt: 0.25 }}
              />
            </Box>
          </Box>
        </Box>

        <TextField
          label="Rejection Reason"
          placeholder="Enter Rejection Reason"
          fullWidth
          multiline
          minRows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={busy || !reason.trim()}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
        >
          {busy ? 'Submitting...' : 'Submit'}
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

export default RejectLeaveDialog;
