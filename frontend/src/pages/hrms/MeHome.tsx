import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, IconButton,
  CircularProgress, Snackbar, Alert, MenuItem, Select, FormControl,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon, EventBusy as LeaveIcon, AccessTime as ClockIcon,
  StarBorder as StarIcon, ChevronLeft, ChevronRight, ArrowForward as ArrowForwardIcon,
  Login as LoginIcon, FreeBreakfast as BreakIcon,
} from '@mui/icons-material';
import { meService, DashboardSummary } from '../../services/me.service';
import { CalendarPayload } from '../../services/shift.service';
import { evvAttendanceService, AttendanceState } from '../../services/phase5.service';

const SHIFT_BG: Record<string, string> = { FIRST: '#fff7ed', SECOND: '#d1fae5', THIRD: '#dbeafe' };
const SHIFT_BAR: Record<string, string> = { FIRST: '#f59e0b', SECOND: '#10b981', THIRD: '#3b82f6' };
const SHIFT_LABEL: Record<string, string> = { FIRST: '1st Shift', SECOND: '2nd Shift', THIRD: '3rd Shift' };

const ymd = (d: Date) => d.toISOString().split('T')[0];

const startOfWeek = (d: Date) => {
  const r = new Date(d); r.setDate(d.getDate() - d.getDay()); r.setHours(0,0,0,0); return r;
};

const formatTime = (raw: string) => raw;

export const MeHomePage: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [calendar, setCalendar] = useState<CalendarPayload | null>(null);
  const [weekAnchor, setWeekAnchor] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [attendance, setAttendance] = useState<AttendanceState | null>(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c, a] = await Promise.all([
        meService.getDashboard(),
        meService.getCalendar('WEEK', ymd(weekAnchor)),
        evvAttendanceService.state(),
      ]);
      if (d.success && d.data) setDashboard(d.data);
      if (c.success && c.data) setCalendar(c.data);
      if (a.success && a.data) setAttendance(a.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [weekAnchor]);

  useEffect(() => { load(); }, [load]);

  // Tick the elapsed-time display every second while CLOCKED_IN or ON_BREAK
  useEffect(() => {
    if (!attendance || attendance.state === 'OFF' || attendance.state === 'CLOCKED_OUT') return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [attendance]);

  // Compute elapsed time = first CLOCK_IN today to now (minus completed break durations)
  const elapsed = (() => {
    if (!attendance) return '00 : 00 : 00';
    const punches = attendance.punches;
    const firstIn = punches.find((p) => p.punchType === 'CLOCK_IN');
    if (!firstIn) return '00 : 00 : 00';
    const startMs = new Date(firstIn.timestamp).getTime();
    const lastPunch = punches[punches.length - 1];
    const endMs = lastPunch?.punchType === 'CLOCK_OUT' ? new Date(lastPunch.timestamp).getTime() : Date.now();
    let ms = Math.max(0, endMs - startMs);
    // subtract completed break pairs
    let pendingStart: number | null = null;
    for (const p of punches) {
      if (p.punchType === 'BREAK_START') pendingStart = new Date(p.timestamp).getTime();
      else if (p.punchType === 'BREAK_END' && pendingStart) {
        ms -= new Date(p.timestamp).getTime() - pendingStart;
        pendingStart = null;
      }
    }
    void tick;
    const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
    const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    return `${h} : ${m} : ${s}`;
  })();

  const punchState = attendance?.state ?? 'OFF';
  const clockedIn = punchState === 'CLOCKED_IN';
  const onBreak = punchState === 'ON_BREAK';
  const clockedOut = punchState === 'CLOCKED_OUT';

  const handleClockIn = async () => {
    try {
      const res = await evvAttendanceService.clockIn();
      if (!res.success) throw new Error(res.error || 'Clock-in failed');
      setSnackbar({ open: true, message: 'Clocked in', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Clock-in failed', severity: 'error' });
    }
  };

  const handleBreak = async () => {
    try {
      const res = onBreak ? await evvAttendanceService.endBreak() : await evvAttendanceService.startBreak();
      if (!res.success) throw new Error(res.error || 'Break action failed');
      setSnackbar({ open: true, message: onBreak ? 'Break ended' : 'Break started', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Break action failed', severity: 'error' });
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await evvAttendanceService.clockOut();
      if (!res.success) throw new Error(res.error || 'Clock-out failed');
      setSnackbar({ open: true, message: 'Clocked out — timecard ready in My Timecards', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Clock-out failed', severity: 'error' });
    }
  };

  const stepWeek = (d: number) => {
    const next = new Date(weekAnchor);
    next.setDate(weekAnchor.getDate() + d * 7);
    setWeekAnchor(next);
  };

  if (loading || !dashboard) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const upcoming = dashboard.upcomingShift;
  const upcomingLabel = upcoming ? upcomingTimeLabel(upcoming) : null;
  const lb = dashboard.leaveBalance;

  // Build week schedule from calendar
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

  return (
    <Box sx={{ p: 3 }}>
      {/* 4 stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 2 }}>
        <StatCard
          title="Upcoming Shift"
          mainText={upcoming ? formatRelativeShift(upcoming.shiftDate) : 'No shift scheduled'}
          subText={upcomingLabel || ''}
          icon={<CalendarIcon />}
          iconBg="#dbeafe"
          iconColor="#1e3a5f"
        />
        <StatCard
          title="Leave Balance"
          mainText={lb ? `${(lb as any).usedTotal ?? 0}/${Number(lb.annualBalance) + Number(lb.sickBalance) + Number(lb.personalBalance) + Number(lb.unpaidBalance)}` : '0/12'}
          subText={lb ? `Annual: ${Number(lb.annualBalance)} · Sick: ${Number(lb.sickBalance)}` : ''}
          icon={<LeaveIcon />}
          iconBg="#d1fae5"
          iconColor="#10b981"
        />
        <StatCard
          title="Pending Requests"
          mainText={String(dashboard.pendingLeavesCount)}
          subText="Awaiting supervisor"
          icon={<ClockIcon />}
          iconBg="#fef3c7"
          iconColor="#f59e0b"
        />
        <StatCard
          title="Performance"
          mainText={dashboard.performance.overall ? `${dashboard.performance.overall}/5` : 'Not reviewed'}
          subText={dashboard.performance.lastReviewedAt ? `Last review: ${new Date(dashboard.performance.lastReviewedAt).toLocaleDateString()}` : '—'}
          icon={<StarIcon />}
          iconBg="#dbeafe"
          iconColor="#1e3a5f"
        />
      </Box>

      {/* Weekly Schedule + Clock In/Out */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 2, mb: 2 }}>
        {/* Schedule */}
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>My Weekly Schedule</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small" onClick={() => stepWeek(-1)}><ChevronLeft fontSize="small" /></IconButton>
              <Typography sx={{ fontSize: '0.85rem', minWidth: 130, textAlign: 'center' }}>
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
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {weekDays.map((d) => {
              const key = ymd(d);
              const shift = shiftMap.get(key);
              const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <Box key={key} sx={{ textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#374151', fontWeight: 500, mb: 0.5 }}>{dayLabel}</Typography>
                  {shift ? (
                    <Box sx={{
                      bgcolor: SHIFT_BG[shift.shiftType] || '#f3f4f6',
                      borderTop: `3px solid ${SHIFT_BAR[shift.shiftType] || '#9ca3af'}`,
                      borderRadius: 1, p: 1.5, minHeight: 76,
                    }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {SHIFT_LABEL[shift.shiftType] || shift.shiftType}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', mt: 0.25 }}>
                        {formatTime(shift.startTime)}-{formatTime(shift.endTime)}
                      </Typography>
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
        </Paper>

        {/* Clock In/Out */}
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f', alignSelf: 'flex-start' }}>Clock In/Out</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {punchState === 'OFF' && 'Not Started'}
            {punchState === 'CLOCKED_IN' && 'Clocked In'}
            {punchState === 'ON_BREAK' && 'On Break'}
            {punchState === 'CLOCKED_OUT' && 'Clocked Out — Done for the day'}
          </Typography>
          <Typography sx={{ fontSize: '2rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: 1 }}>
            {elapsed}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
            <Button
              variant="outlined"
              startIcon={<BreakIcon />}
              disabled={!clockedIn && !onBreak}
              onClick={handleBreak}
              sx={{ textTransform: 'none', flex: 1, color: onBreak ? '#92400e' : '#6b7280', borderColor: '#e5e7eb' }}
            >
              {onBreak ? 'End Break' : 'Break'}
            </Button>
            {!clockedIn && !onBreak && !clockedOut && (
              <Button
                variant="contained"
                endIcon={<LoginIcon />}
                onClick={handleClockIn}
                sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', flex: 1 }}
              >
                Clock-In
              </Button>
            )}
            {(clockedIn || onBreak) && (
              <Button
                variant="contained"
                endIcon={<LoginIcon />}
                disabled={onBreak}
                onClick={handleClockOut}
                sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, textTransform: 'none', flex: 1 }}
              >
                Clock-Out
              </Button>
            )}
            {clockedOut && (
              <Button
                variant="outlined"
                disabled
                sx={{ textTransform: 'none', flex: 1 }}
              >
                Submit Timecard →
              </Button>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Tasks + Notice Board */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Today's Tasks</Typography>
              <Chip label="0" size="small" sx={{ bgcolor: '#f3f4f6', height: 20, fontSize: '0.7rem' }} />
            </Box>
            <Button size="small" endIcon={<ArrowForwardIcon />} sx={{ textTransform: 'none' }}>View All</Button>
          </Box>
          <Box sx={{ textAlign: 'center', py: 4, color: '#9ca3af' }}>
            <Typography sx={{ fontSize: '0.85rem' }}>No tasks assigned for today.</Typography>
          </Box>
        </Paper>

        <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Notice Board</Typography>
              <Chip label="0" size="small" sx={{ bgcolor: '#f3f4f6', height: 20, fontSize: '0.7rem' }} />
            </Box>
            <Button size="small" endIcon={<ArrowForwardIcon />} sx={{ textTransform: 'none' }}>View All</Button>
          </Box>
          <Box sx={{ textAlign: 'center', py: 4, color: '#9ca3af' }}>
            <Typography sx={{ fontSize: '0.85rem' }}>No notices.</Typography>
          </Box>
        </Paper>
      </Box>

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

const StatCard: React.FC<{
  title: string; mainText: string; subText: string; icon: React.ReactNode;
  iconBg: string; iconColor: string;
}> = ({ title, mainText, subText, icon, iconBg, iconColor }) => (
  <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', mb: 0.5 }}>{title}</Typography>
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e3a5f', mb: 0.25 }}>{mainText}</Typography>
      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{subText}</Typography>
    </Box>
    <Avatar sx={{ bgcolor: iconBg, color: iconColor, width: 40, height: 40 }}>{icon}</Avatar>
  </Paper>
);

const upcomingTimeLabel = (s: any) => {
  const part = (s.shiftType === 'FIRST' || s.shiftType === 'SECOND') ? 'Morning' :
                s.shiftType === 'SECOND' ? 'Afternoon' :
                s.shiftType === 'THIRD' ? 'Night' : 'Shift';
  return `${part} · ${s.startTime} - ${s.endTime}`;
};

const formatRelativeShift = (iso: string) => {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(d); target.setHours(0,0,0,0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return d.toLocaleDateString();
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default MeHomePage;
