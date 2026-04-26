import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, IconButton, Chip,
  CircularProgress, Snackbar, Alert, MenuItem, Select, FormControl, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon, ChevronLeft, ChevronRight, SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { meService } from '../../services/me.service';
import { CalendarPayload } from '../../services/shift.service';
import { shiftChangeService, ShiftChangeRequestItem, ShiftChangeStatus } from '../../services/phase5.service';
import { peerSwapService, PeerSwapPending } from '../../services/phase5c.service';

const SHIFT_BG: Record<string, string> = { FIRST: '#fff7ed', SECOND: '#d1fae5', THIRD: '#dbeafe' };
const SHIFT_BAR: Record<string, string> = { FIRST: '#f59e0b', SECOND: '#10b981', THIRD: '#3b82f6' };
const SHIFT_LABEL: Record<string, string> = { FIRST: '1st Shift', SECOND: '2nd Shift', THIRD: '3rd Shift' };

const STATUS_STYLES: Record<ShiftChangeStatus, { bg: string; color: string }> = {
  PENDING:  { bg: '#fef3c7', color: '#92400e' },
  APPROVED: { bg: '#d1fae5', color: '#065f46' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b' },
};

const ymd = (d: Date) => d.toISOString().split('T')[0];
const startOfWeek = (d: Date) => { const r = new Date(d); r.setDate(d.getDate() - d.getDay()); r.setHours(0,0,0,0); return r; };

const TABS: { label: string; status?: ShiftChangeStatus }[] = [
  { label: 'All' },
  { label: 'Pending', status: 'PENDING' },
  { label: 'Approved', status: 'APPROVED' },
  { label: 'Rejected', status: 'REJECTED' },
];

export const MeShiftsPage: React.FC = () => {
  const [calendar, setCalendar] = useState<CalendarPayload | null>(null);
  const [weekAnchor, setWeekAnchor] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [requests, setRequests] = useState<ShiftChangeRequestItem[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [submitOpen, setSubmitOpen] = useState(false);
  const [chosenShiftId, setChosenShiftId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [requestedDate, setRequestedDate] = useState<string>('');
  const [requestedShiftType, setRequestedShiftType] = useState<string>('');
  const [peerPending, setPeerPending] = useState<PeerSwapPending[]>([]);
  const [declineDialog, setDeclineDialog] = useState<{ open: boolean; id: number | null; reason: string }>({ open: false, id: null, reason: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await meService.getCalendar('WEEK', ymd(weekAnchor));
      if (res.success && res.data) setCalendar(res.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [weekAnchor]);

  const loadRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const res = await shiftChangeService.myList(TABS[activeTab].status);
      if (res.success && Array.isArray(res.data)) setRequests(res.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setReqLoading(false);
    }
  }, [activeTab]);

  const loadPeerPending = useCallback(async () => {
    try {
      const res = await peerSwapService.pendingForMe();
      if (res.success && Array.isArray(res.data)) setPeerPending(res.data);
    } catch (e: any) {
      console.error('Peer swap pending load failed', e);
    }
  }, []);

  const handlePeerAccept = async (id: number) => {
    try {
      const res = await peerSwapService.accept(id);
      if (!res.success) throw new Error(res.error || 'Accept failed');
      setSnackbar({ open: true, message: 'Swap accepted — your supervisor will review', severity: 'success' });
      loadPeerPending();
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Accept failed', severity: 'error' });
    }
  };

  const handlePeerDecline = async () => {
    if (!declineDialog.id) return;
    try {
      const res = await peerSwapService.decline(declineDialog.id, declineDialog.reason);
      if (!res.success) throw new Error(res.error || 'Decline failed');
      setSnackbar({ open: true, message: 'Swap declined', severity: 'success' });
      setDeclineDialog({ open: false, id: null, reason: '' });
      loadPeerPending();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Decline failed', severity: 'error' });
    }
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => { loadPeerPending(); }, [loadPeerPending]);

  const stepWeek = (d: number) => {
    const next = new Date(weekAnchor);
    next.setDate(weekAnchor.getDate() + d * 7);
    setWeekAnchor(next);
  };

  const weekStart = startOfWeek(weekAnchor);
  const weekDays: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const shiftMap = new Map<string, any>();
  (calendar?.shifts || []).forEach((s: any) => {
    shiftMap.set(s.shiftDate.split('T')[0], s);
  });

  const upcomingShifts = (calendar?.shifts || []).filter((s: any) =>
    new Date(s.shiftDate) >= startOfWeek(new Date()) && s.status === 'SCHEDULED'
  );

  const openSubmit = () => {
    setChosenShiftId('');
    setReason('');
    setRequestedDate('');
    setRequestedShiftType('');
    setSubmitOpen(true);
  };

  const handleSubmit = async () => {
    if (!chosenShiftId) {
      setSnackbar({ open: true, message: 'Pick a shift to change', severity: 'error' });
      return;
    }
    if (!reason.trim()) {
      setSnackbar({ open: true, message: 'Reason required', severity: 'error' });
      return;
    }
    try {
      const res = await shiftChangeService.submit({
        originalShiftId: Number(chosenShiftId),
        reason: reason.trim(),
        requestedDate: requestedDate || null,
        requestedShiftType: requestedShiftType || null,
      });
      if (!res.success) throw new Error(res.error || 'Submit failed');
      setSnackbar({ open: true, message: 'Shift change request submitted', severity: 'success' });
      setSubmitOpen(false);
      loadRequests();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Submit failed', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Peer swap pending banner */}
      {peerPending.length > 0 && (
        <Paper sx={{ mb: 2, p: 2, border: '2px solid #f59e0b', boxShadow: 'none', borderRadius: '8px', bgcolor: '#fff7ed' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <SwapIcon sx={{ color: '#92400e' }} />
            <Typography sx={{ fontWeight: 600, color: '#92400e' }}>
              Shift Swap Requests for You ({peerPending.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {peerPending.map((p) => (
              <Box key={p.id} sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 1, border: '1px solid #fed7aa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>
                      {p.employee.firstName} {p.employee.lastName}
                      {p.employee.designation && (
                        <Typography component="span" sx={{ fontSize: '0.75rem', color: '#6b7280', ml: 1 }}>
                          ({p.employee.designation})
                        </Typography>
                      )}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: '#374151', mt: 0.25 }}>
                      Wants you to cover their <strong>
                        {SHIFT_LABEL[p.originalShift.shiftType] || p.originalShift.shiftType}
                      </strong> on <strong>{new Date(p.originalShift.shiftDate).toLocaleDateString()}</strong>
                      {' '}({p.originalShift.startTime}–{p.originalShift.endTime})
                    </Typography>
                    {p.reason && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', mt: 0.25 }}>
                        Reason: {p.reason}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small" variant="contained"
                      onClick={() => handlePeerAccept(p.id)}
                      sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none' }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="small" variant="outlined" color="error"
                      onClick={() => setDeclineDialog({ open: true, id: p.id, reason: '' })}
                      sx={{ textTransform: 'none' }}
                    >
                      Decline
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>My Shifts</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<SwapIcon />}
            onClick={openSubmit}
            disabled={upcomingShifts.length === 0}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            Request Shift Change
          </Button>
        </Box>

        {/* Toolbar */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => stepWeek(-1)}><ChevronLeft fontSize="small" /></IconButton>
          <Typography sx={{ fontSize: '0.9rem', minWidth: 130 }}>
            Week {Math.ceil(weekStart.getDate() / 7)}-{weekStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Typography>
          <IconButton size="small" onClick={() => stepWeek(1)}><ChevronRight fontSize="small" /></IconButton>
          <FormControl size="small" sx={{ minWidth: 110, ml: 1 }}>
            <Select
              value={weekAnchor.getMonth()}
              onChange={(e) => {
                const next = new Date(weekAnchor);
                next.setMonth(Number(e.target.value));
                setWeekAnchor(next);
              }}
              sx={{ fontSize: '0.85rem' }}
            >
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                <MenuItem key={m} value={i}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Week grid */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : (
          <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {weekDays.map((d) => {
              const key = ymd(d);
              const shift = shiftMap.get(key);
              const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <Box key={key} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, mb: 1 }}>{dayLabel}</Typography>
                  {shift ? (
                    <Box sx={{
                      bgcolor: SHIFT_BG[shift.shiftType] || '#f3f4f6',
                      borderTop: `3px solid ${SHIFT_BAR[shift.shiftType] || '#9ca3af'}`,
                      borderRadius: 1, p: 1.5, minHeight: 76,
                    }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: SHIFT_BAR[shift.shiftType] }}>
                        {SHIFT_LABEL[shift.shiftType] || shift.shiftType}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', mt: 0.25 }}>
                        {shift.startTime}-{shift.endTime}
                      </Typography>
                      {shift.status === 'LEAVE_BLOCKED' && (
                        <Chip label="LEAVE" size="small" sx={{ height: 16, fontSize: '0.6rem', mt: 0.5, bgcolor: '#fee2e2', color: '#991b1b' }} />
                      )}
                    </Box>
                  ) : (
                    <Box sx={{
                      borderRadius: 1, p: 1.5, minHeight: 76, border: '1px dashed #e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 6px, #f3f4f6 6px, #f3f4f6 7px)',
                    }}>
                      <Typography sx={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>OFF</Typography>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Past Requests */}
      <Paper sx={{ mt: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>My Change Requests</Typography>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              minHeight: 30,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 28, padding: '4px 12px', fontSize: '0.78rem',
                textTransform: 'none', borderRadius: 999, color: '#6b7280', fontWeight: 500,
                '&.Mui-selected': { bgcolor: '#1e3a5f', color: '#fff', fontWeight: 600 },
              },
            }}
          >
            {TABS.map((t) => <Tab key={t.label} label={t.label} />)}
          </Tabs>
        </Box>

        {reqLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : requests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: '#9ca3af' }}>
            <Typography sx={{ fontSize: '0.85rem' }}>No change requests in this category.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Original Shift</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Requested</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((r) => {
                  const sStyle = STATUS_STYLES[r.status];
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {r.originalShift ? `${new Date(r.originalShift.shiftDate).toLocaleDateString()} ${SHIFT_LABEL[r.originalShift.shiftType] || r.originalShift.shiftType}` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {r.requestedDate ? new Date(r.requestedDate).toLocaleDateString() : '(no date change)'}
                        {r.requestedShiftType ? ` → ${SHIFT_LABEL[r.requestedShiftType] || r.requestedShiftType}` : ''}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.reason}
                      </TableCell>
                      <TableCell>
                        <Chip label={r.status} size="small" sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 20, fontSize: '0.7rem' }} />
                        {r.status === 'REJECTED' && r.rejectionReason && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#991b1b', mt: 0.5 }}>{r.rejectionReason}</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Submit dialog */}
      <Dialog open={submitOpen} onClose={() => setSubmitOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Shift Change</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>
            Pick the shift you want to change. Leave fields blank to request a swap-out (your supervisor will figure out coverage).
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={chosenShiftId}
              onChange={(e) => setChosenShiftId(Number(e.target.value))}
              displayEmpty
              sx={{ fontSize: '0.9rem' }}
            >
              <MenuItem value=""><em>Select a shift...</em></MenuItem>
              {upcomingShifts.map((s: any) => (
                <MenuItem key={s.id} value={s.id}>
                  {new Date(s.shiftDate).toLocaleDateString()} — {SHIFT_LABEL[s.shiftType] || s.shiftType} ({s.startTime}–{s.endTime})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField label="New date (optional)" type="date" InputLabelProps={{ shrink: true }} size="small"
              value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} />
            <FormControl size="small">
              <Select
                value={requestedShiftType}
                onChange={(e) => setRequestedShiftType(String(e.target.value))}
                displayEmpty
                sx={{ fontSize: '0.9rem' }}
              >
                <MenuItem value=""><em>Same shift type</em></MenuItem>
                <MenuItem value="FIRST">1st Shift</MenuItem>
                <MenuItem value="SECOND">2nd Shift</MenuItem>
                <MenuItem value="THIRD">3rd Shift</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField label="Reason" multiline minRows={3} fullWidth value={reason} onChange={(e) => setReason(e.target.value)} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Peer decline dialog */}
      <Dialog open={declineDialog.open} onClose={() => setDeclineDialog({ open: false, id: null, reason: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Decline Swap Request</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 2 }}>
            Optionally tell your colleague why you can't take this shift.
          </Typography>
          <TextField
            label="Reason (optional)" multiline minRows={2} fullWidth
            value={declineDialog.reason}
            onChange={(e) => setDeclineDialog({ ...declineDialog, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeclineDialog({ open: false, id: null, reason: '' })} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handlePeerDecline} sx={{ textTransform: 'none' }}>
            Decline
          </Button>
        </DialogActions>
      </Dialog>

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

export default MeShiftsPage;
