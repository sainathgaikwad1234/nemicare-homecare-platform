import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Dialog, DialogContent, IconButton, Avatar, Chip,
  Button, CircularProgress, TextField, InputAdornment, Divider,
} from '@mui/material';
import {
  Close as CloseIcon, Mail as MailIcon, Phone as PhoneIcon,
  Search as SearchIcon, Info as InfoIcon, ArrowForward as ArrowIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  shiftChangeService, ShiftAvailability, AvailableEmployee, ExistingSwapRequest,
} from '../../services/phase5.service';

const SHIFT_LABEL: Record<string, string> = { FIRST: '1st Shift', SECOND: '2nd Shift', THIRD: '3rd Shift' };

const initials = (firstName?: string, lastName?: string) =>
  `${(firstName || '?').charAt(0)}${(lastName || '?').charAt(0)}`.toUpperCase();

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  APPROVED: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
};

interface Props {
  open: boolean;
  requestId: number | null;
  onClose: () => void;
  onApprove: (replacementEmployeeId: number | null) => Promise<void>;
  onReject: () => void;
}

export const CheckAvailabilityDialog: React.FC<Props> = ({ open, requestId, onClose, onApprove, onReject }) => {
  const [data, setData] = useState<ShiftAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setSelectedReplacement(null);
    setSearch('');
    try {
      const res = await shiftChangeService.availability(requestId);
      if (res.success && res.data) setData(res.data);
    } catch (e: any) {
      console.error('Availability load failed', e);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleApprove = async (withReplacement: boolean) => {
    setBusy(true);
    try {
      await onApprove(withReplacement ? selectedReplacement : null);
    } finally {
      setBusy(false);
    }
  };

  const filterEmps = (list: AvailableEmployee[] | undefined) => {
    if (!list) return [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      (e.employeeIdNumber || '').toLowerCase().includes(q),
    );
  };

  const otherShiftTypes = data ? Object.keys(data.employeesByShift || {}) : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a5f' }}>
              Check Availability For Shift —
            </Typography>
            {data?.request.status && (
              <Chip
                label={STATUS_STYLES[data.request.status]?.label || data.request.status}
                size="small"
                sx={{
                  height: 22, fontSize: '0.7rem',
                  bgcolor: STATUS_STYLES[data.request.status]?.bg || '#f3f4f6',
                  color: STATUS_STYLES[data.request.status]?.color || '#374151',
                }}
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>

        {loading || !data ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Top section: requester + shift request */}
            <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderBottom: '1px solid #e5e7eb' }}>
              {/* Requester card */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar
                  src={data.requester.profilePictureUrl || undefined}
                  sx={{ width: 64, height: 64, bgcolor: '#1e3a5f' }}
                >
                  {initials(data.requester.firstName, data.requester.lastName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a5f' }}>
                      {data.requester.firstName} {data.requester.lastName}
                    </Typography>
                    {data.requester.designation && (
                      <Chip label={data.requester.designation} size="small"
                        sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#dbeafe', color: '#1e40af' }} />
                    )}
                  </Box>
                  {data.requester.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280', mb: 0.25 }}>
                      <MailIcon sx={{ fontSize: 14 }} />
                      <Typography sx={{ fontSize: '0.8rem' }}>{data.requester.email}</Typography>
                    </Box>
                  )}
                  {data.requester.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280' }}>
                      <PhoneIcon sx={{ fontSize: 14 }} />
                      <Typography sx={{ fontSize: '0.8rem' }}>{data.requester.phone}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Shift Request box */}
              <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, border: '1px solid #e5e7eb' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                    Shift Request
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280' }} title={data.request.reason}>
                    <Typography sx={{ fontSize: '0.7rem' }}>Reason</Typography>
                    <InfoIcon sx={{ fontSize: 14 }} />
                  </Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 1.5, alignItems: 'center' }}>
                  <Box sx={{ p: 1.25, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e5e7eb' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>From</Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>
                      {SHIFT_LABEL[data.originalShift.shiftType] || data.originalShift.shiftType}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {new Date(data.originalShift.shiftDate).toLocaleDateString()}
                      {' '}({data.originalShift.startTime}–{data.originalShift.endTime})
                    </Typography>
                  </Box>
                  <ArrowIcon sx={{ color: '#6b7280' }} />
                  <Box sx={{ p: 1.25, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e5e7eb' }}>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>To</Typography>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>
                      {data.request.requestedShiftType
                        ? SHIFT_LABEL[data.request.requestedShiftType] || data.request.requestedShiftType
                        : '(any)'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {data.request.requestedDate
                        ? new Date(data.request.requestedDate).toLocaleDateString()
                        : '(no date change)'}
                    </Typography>
                  </Box>
                </Box>
                {data.request.reason && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#374151', mt: 1, fontStyle: 'italic' }}>
                    "{data.request.reason}"
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Search */}
            <Box sx={{ px: 2.5, pt: 2 }}>
              <TextField
                placeholder="Search employees by name or ID"
                size="small" fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* 3 columns: Existing Swap Requests + each other shift type */}
            <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: `repeat(${1 + otherShiftTypes.length}, 1fr)`, gap: 2, maxHeight: '50vh', overflow: 'auto' }}>
              {/* Existing Swap Requests */}
              <Box>
                <Box sx={{ p: 1, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                    Existing Swap Requests
                    {data.requester.designation && (
                      <Chip label={data.requester.designation} size="small"
                        sx={{ ml: 0.5, height: 18, fontSize: '0.65rem', bgcolor: '#dbeafe', color: '#1e40af' }} />
                    )}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    Other employees with pending swap requests
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {filterExisting(data.existingSwapRequests, search).length === 0 ? (
                    <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', py: 2 }}>
                      No other pending requests.
                    </Typography>
                  ) : (
                    filterExisting(data.existingSwapRequests, search).map((r) => (
                      <ExistingRequestCard key={r.id} request={r} />
                    ))
                  )}
                </Box>
              </Box>

              {/* Per-shift columns */}
              {otherShiftTypes.map((stype) => {
                const emps = filterEmps(data.employeesByShift[stype]);
                return (
                  <Box key={stype}>
                    <Box sx={{ p: 1, bgcolor: '#f9fafb', borderRadius: 1, mb: 1 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                        {SHIFT_LABEL[stype] || stype} Employees
                        {data.requester.designation && (
                          <Chip label={data.requester.designation} size="small"
                            sx={{ ml: 0.5, height: 18, fontSize: '0.65rem', bgcolor: '#dbeafe', color: '#1e40af' }} />
                        )}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        {emps.length} available
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      {emps.length === 0 ? (
                        <Typography sx={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', py: 2 }}>
                          No available employees.
                        </Typography>
                      ) : (
                        emps.map((emp) => {
                          const selected = selectedReplacement === emp.id;
                          return (
                            <Box
                              key={emp.id}
                              onClick={() => setSelectedReplacement(selected ? null : emp.id)}
                              sx={{
                                p: 1, display: 'flex', alignItems: 'center', gap: 1,
                                border: `2px solid ${selected ? '#10b981' : '#e5e7eb'}`,
                                bgcolor: selected ? '#d1fae5' : '#fff',
                                borderRadius: 1, cursor: 'pointer',
                                '&:hover': { bgcolor: selected ? '#a7f3d0' : '#f9fafb' },
                              }}
                            >
                              <Avatar
                                src={emp.profilePictureUrl || undefined}
                                sx={{ width: 36, height: 36, bgcolor: '#1e3a5f', fontSize: '0.75rem' }}
                              >
                                {initials(emp.firstName, emp.lastName)}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e3a5f' }} noWrap>
                                  {emp.firstName} {emp.lastName}
                                </Typography>
                                {emp.phone && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: '#6b7280' }}>
                                    <PhoneIcon sx={{ fontSize: 11 }} />
                                    <Typography sx={{ fontSize: '0.7rem' }} noWrap>{emp.phone}</Typography>
                                  </Box>
                                )}
                              </Box>
                              {selected && <CheckCircleIcon sx={{ fontSize: 20, color: '#10b981' }} />}
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Divider />

            {/* Footer actions */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button
                variant="outlined" color="error" disabled={busy}
                onClick={onReject}
                sx={{ textTransform: 'none', borderRadius: 999 }}
              >
                Reject Request
              </Button>
              <Button
                variant="outlined" color="success" disabled={busy}
                onClick={() => handleApprove(false)}
                sx={{ textTransform: 'none', borderRadius: 999 }}
              >
                Approve Request
              </Button>
              <Button
                variant="contained" disabled={busy || !selectedReplacement}
                onClick={() => handleApprove(true)}
                sx={{
                  bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' },
                  textTransform: 'none', borderRadius: 999,
                }}
              >
                Assign &amp; Approve
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const filterExisting = (list: ExistingSwapRequest[] | undefined, q: string): ExistingSwapRequest[] => {
  if (!list) return [];
  if (!q.trim()) return list;
  const ql = q.toLowerCase();
  return list.filter((r) => `${r.firstName} ${r.lastName}`.toLowerCase().includes(ql));
};

const ExistingRequestCard: React.FC<{ request: ExistingSwapRequest }> = ({ request }) => (
  <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #e5e7eb', borderRadius: 1, bgcolor: '#fff' }}>
    <Avatar
      src={request.profilePictureUrl || undefined}
      sx={{ width: 36, height: 36, bgcolor: '#1e3a5f', fontSize: '0.75rem' }}
    >
      {initials(request.firstName, request.lastName)}
    </Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#1e3a5f' }} noWrap>
        {request.firstName} {request.lastName}
      </Typography>
      {request.phone && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: '#6b7280' }}>
          <PhoneIcon sx={{ fontSize: 11 }} />
          <Typography sx={{ fontSize: '0.7rem' }} noWrap>{request.phone}</Typography>
        </Box>
      )}
      {request.originalShift && (
        <Typography sx={{ fontSize: '0.65rem', color: '#92400e', mt: 0.25 }}>
          {SHIFT_LABEL[request.originalShift.shiftType] || request.originalShift.shiftType} •{' '}
          {new Date(request.originalShift.shiftDate).toLocaleDateString()}
        </Typography>
      )}
    </Box>
    <Chip label="PENDING" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#fef3c7', color: '#92400e' }} />
  </Box>
);

export default CheckAvailabilityDialog;
