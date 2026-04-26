import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  IconButton, Button, Avatar, Chip, Divider,
} from '@mui/material';
import {
  Close as CloseIcon, Mail as MailIcon, Phone as PhoneIcon,
} from '@mui/icons-material';
import { LeaveRequest } from '../../services/leave.service';

interface Props {
  open: boolean;
  leave?: LeaveRequest | null;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  APPROVED: { label: 'Approved', bg: '#d1fae5', color: '#065f46' },
  PENDING: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  REJECTED: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b' },
  WAITING: { label: 'Waiting', bg: '#dbeafe', color: '#1e3a5f' },
};

export const LeaveDetailsDialog: React.FC<Props> = ({ open, leave, onClose }) => {
  if (!leave) return null;
  const emp = leave.employee;
  const initials = `${emp?.firstName?.[0] || ''}${emp?.lastName?.[0] || ''}`.toUpperCase();
  const status = leave.status;
  const banner = status === 'APPROVED'
    ? { bg: '#d1fae5', color: '#065f46', text: 'This leave request has been approved.' }
    : status === 'REJECTED'
    ? { bg: '#fee2e2', color: '#991b1b', text: 'This leave request was rejected.' }
    : { bg: '#fef3c7', color: '#92400e', text: 'This leave request is pending.' };
  const hrStatus = STATUS_LABELS[leave.hrApprovalStatus];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>Leave Request Details</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Status banner */}
        <Box sx={{ p: 1.5, bgcolor: banner.bg, color: banner.color, borderRadius: 1, mb: 2, textAlign: 'center', fontSize: '0.85rem', fontWeight: 500 }}>
          {banner.text}
        </Box>

        {/* Profile */}
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

        {/* Leave info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, border: '1px solid #e5e7eb', borderRadius: 1, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>{Number(leave.totalDays)}</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{Number(leave.totalDays) === 1 ? 'Day' : 'Days'}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>From</Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{new Date(leave.fromDate).toLocaleDateString()}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>To</Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{new Date(leave.toDate).toLocaleDateString()}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>HR Approval</Typography>
            <Chip label={hrStatus.label} size="small" sx={{ bgcolor: hrStatus.bg, color: hrStatus.color, height: 20, fontSize: '0.7rem', mt: 0.25 }} />
          </Box>
        </Box>

        {/* Reason */}
        {leave.reason && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', mb: 0.5 }}>Reason</Typography>
            <Typography sx={{ fontSize: '0.85rem' }}>{leave.reason}</Typography>
          </Box>
        )}

        {/* Rejection reason */}
        {leave.rejectionReason && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#991b1b', mb: 0.5 }}>Rejection Reason</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>{leave.rejectionReason}</Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveDetailsDialog;
