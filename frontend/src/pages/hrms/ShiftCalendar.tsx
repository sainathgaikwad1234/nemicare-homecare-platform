import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Button, IconButton, MenuItem, Select, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Snackbar, Alert,
  CircularProgress, Tooltip,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon, FilterList as FilterIcon, Info as InfoIcon,
  ChevronLeft, ChevronRight, Add as AddIcon,
} from '@mui/icons-material';
import { shiftService, CalendarPayload, ShiftType } from '../../services/shift.service';
import { ShiftAssignmentDialog } from './ShiftAssignmentDialog';
import { BulkAssignDialog } from './BulkAssignDialog';

type ViewMode = 'DAY' | 'WEEK' | 'MONTH';

const SHIFT_BG: Record<string, string> = {
  FIRST: '#fff7ed',
  SECOND: '#d1fae5',
  THIRD: '#dbeafe',
  DAY_OFF: '#f3f4f6',
  LEAVE_APPLIED: '#fff7ed',
  LEAVE_APPROVED: '#d1fae5',
};
const SHIFT_BAR: Record<string, string> = {
  FIRST: '#f59e0b',
  SECOND: '#10b981',
  THIRD: '#3b82f6',
  DAY_OFF: '#9ca3af',
  LEAVE_APPLIED: '#f59e0b',
  LEAVE_APPROVED: '#10b981',
};
const SHIFT_LABEL: Record<string, string> = { FIRST: '1st', SECOND: '2nd', THIRD: '3rd' };
const SHIFT_TIME: Record<string, string> = {
  FIRST: '9:00 AM-8:00 PM',
  SECOND: '3:00 PM-12:00 AM',
  THIRD: '12:00 AM-9:00 AM',
};

export const ShiftCalendarPage: React.FC = () => {
  const [view, setView] = useState<ViewMode>('MONTH');
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [data, setData] = useState<CalendarPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [openAssign, setOpenAssign] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = anchor.toISOString().split('T')[0];
      const res = await shiftService.getCalendar(view, dateStr);
      if (res.success && res.data) setData(res.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [view, anchor]);

  useEffect(() => { load(); }, [load]);

  const stepDate = (delta: number) => {
    const next = new Date(anchor);
    if (view === 'DAY') next.setDate(anchor.getDate() + delta);
    else if (view === 'WEEK') next.setDate(anchor.getDate() + delta * 7);
    else next.setMonth(anchor.getMonth() + delta);
    setAnchor(next);
  };

  const formatHeader = () => {
    if (view === 'DAY') return anchor.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    if (view === 'WEEK') {
      const start = new Date(anchor);
      start.setDate(anchor.getDate() - anchor.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}`;
    }
    return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', p: 0 }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Shift Calendar</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenBulk(true)}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            Shift Assign
          </Button>
        </Box>

        {/* Toolbar */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => setAnchor(new Date())} sx={{ textTransform: 'none' }}>
              Today
            </Button>
            <IconButton size="small" onClick={() => stepDate(-1)}><ChevronLeft fontSize="small" /></IconButton>
            <Typography sx={{ fontWeight: 500, minWidth: 130, textAlign: 'center' }}>{formatHeader()}</Typography>
            <IconButton size="small" onClick={() => stepDate(1)}><ChevronRight fontSize="small" /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Color legend"><Button size="small" variant="outlined" startIcon={<InfoIcon />} sx={{ textTransform: 'none' }}>Legends</Button></Tooltip>
            <IconButton size="small"><FilterIcon fontSize="small" /></IconButton>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select value="ALF" onChange={() => {}} sx={{ fontSize: '0.85rem' }}>
                <MenuItem value="ALF">ALF</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select value={view} onChange={(e) => setView(e.target.value as ViewMode)} sx={{ fontSize: '0.85rem' }}>
                <MenuItem value="DAY">Day</MenuItem>
                <MenuItem value="WEEK">Week</MenuItem>
                <MenuItem value="MONTH">Month</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Calendar body */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : !data ? (
          <Box sx={{ p: 4, textAlign: 'center', color: '#6b7280' }}>Failed to load calendar.</Box>
        ) : view === 'DAY' ? (
          <DayView data={data} />
        ) : (
          <GridView data={data} view={view} />
        )}
      </Paper>

      <ShiftAssignmentDialog
        open={openAssign}
        onClose={() => setOpenAssign(false)}
        onCreated={() => { setOpenAssign(false); load(); }}
        employees={data?.employees || []}
      />
      <BulkAssignDialog
        open={openBulk}
        onClose={() => setOpenBulk(false)}
        onSuccess={() => { setOpenBulk(false); load(); setSnackbar({ open: true, message: 'Bulk assignment complete', severity: 'success' }); }}
        employees={data?.employees || []}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

// ============================================
// Day View — Kanban-style columns by shift type
// ============================================
const DayView: React.FC<{ data: CalendarPayload }> = ({ data }) => {
  // Group shifts by type
  const byType: Record<string, any[]> = { FIRST: [], SECOND: [], THIRD: [], DAY_OFF: [], LEAVE_APPLIED: [], LEAVE_APPROVED: [] };
  const employeesWithShift = new Set<number>();

  data.shifts.forEach((s) => {
    if (s.status === 'DAY_OFF') byType.DAY_OFF.push(s.employee);
    else if (s.shiftType === 'FIRST') byType.FIRST.push(s.employee);
    else if (s.shiftType === 'SECOND') byType.SECOND.push(s.employee);
    else if (s.shiftType === 'THIRD') byType.THIRD.push(s.employee);
    if (s.employee?.id) employeesWithShift.add(s.employee.id);
  });

  data.leaveRequests.forEach((lr: any) => {
    if (lr.status === 'APPROVED') byType.LEAVE_APPROVED.push(lr.employee);
    else byType.LEAVE_APPLIED.push(lr.employee);
    if (lr.employee?.id) employeesWithShift.add(lr.employee.id);
  });

  // Anyone without a shift today is implicitly Day Off
  data.employees.forEach((e) => {
    if (!employeesWithShift.has(e.id)) byType.DAY_OFF.push(e);
  });

  const columns: { key: string; label: string; time?: string }[] = [
    { key: 'FIRST', label: '1st', time: SHIFT_TIME.FIRST },
    { key: 'SECOND', label: '2nd', time: SHIFT_TIME.SECOND },
    { key: 'THIRD', label: '3rd', time: SHIFT_TIME.THIRD },
    { key: 'LEAVE_APPLIED', label: 'Leave', time: 'Applied' },
    { key: 'LEAVE_APPROVED', label: 'Leave', time: 'Approved' },
    { key: 'DAY_OFF', label: 'Day Off' },
  ];

  return (
    <Box sx={{ display: 'flex', overflowX: 'auto', minHeight: 400 }}>
      {columns.map((col) => (
        <Box key={col.key} sx={{ flex: '1 0 220px', minWidth: 220, borderRight: '1px solid #f3f4f6' }}>
          <Box sx={{ p: 1.5, bgcolor: SHIFT_BG[col.key], borderTop: `3px solid ${SHIFT_BAR[col.key]}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{col.label}</Typography>
            {col.time && <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{col.time}</Typography>}
          </Box>
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {byType[col.key].length === 0 && (
              <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>—</Typography>
            )}
            {byType[col.key].map((emp: any, idx: number) => emp && (
              <Box key={`${emp.id}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid #e5e7eb', borderRadius: 999, bgcolor: '#fff' }}>
                <Avatar src={emp.profilePictureUrl} sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </Avatar>
                <Typography sx={{ fontSize: '0.8rem' }}>{emp.firstName} {emp.lastName}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// ============================================
// Week / Month View — grid with employee columns + date rows
// ============================================
const GridView: React.FC<{ data: CalendarPayload; view: 'WEEK' | 'MONTH' }> = ({ data }) => {
  const from = new Date(data.range.from);
  const to = new Date(data.range.to);
  const days: Date[] = [];
  const cursor = new Date(from);
  while (cursor <= to) { days.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }

  // Limit columns to first 6 employees for visual fit (matches Figma which shows ~6)
  const employees = data.employees.slice(0, 6);

  // Index shifts by employeeId + dateString
  const shiftMap = new Map<string, any>();
  data.shifts.forEach((s) => {
    const key = `${s.employeeId}_${s.shiftDate.split('T')[0]}`;
    shiftMap.set(key, s);
  });
  data.leaveRequests.forEach((lr: any) => {
    const fromD = new Date(lr.fromDate);
    const toD = new Date(lr.toDate);
    for (let d = new Date(fromD); d <= toD; d.setDate(d.getDate() + 1)) {
      const key = `${lr.employeeId}_${d.toISOString().split('T')[0]}`;
      if (!shiftMap.has(key)) shiftMap.set(key, { ...lr, _isLeave: true });
    }
  });

  return (
    <TableContainer sx={{ maxHeight: '70vh' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 80, bgcolor: '#fff' }}>{/* Date column header */}</TableCell>
            {employees.map((emp) => (
              <TableCell key={emp.id} sx={{ bgcolor: '#fff', minWidth: 180 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={emp.profilePictureUrl} sx={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.1 }}>
                      {emp.firstName} {emp.lastName}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                      {emp.clinicalRole || emp.designation || ''}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {days.map((day) => {
            const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = day.getDate().toString().padStart(2, '0');
            const isSat = day.getDay() === 6;
            return (
              <TableRow key={day.toISOString()}>
                <TableCell sx={{ verticalAlign: 'middle', borderRight: '1px solid #f3f4f6' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e3a5f' }}>{dayNum}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: isSat ? '#ef4444' : '#6b7280' }}>{dayLabel}</Typography>
                  </Box>
                </TableCell>
                {employees.map((emp) => {
                  const key = `${emp.id}_${day.toISOString().split('T')[0]}`;
                  const cell = shiftMap.get(key);
                  return (
                    <TableCell key={emp.id} sx={{ p: 0.5, verticalAlign: 'top' }}>
                      <ShiftCell cell={cell} />
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const ShiftCell: React.FC<{ cell?: any }> = ({ cell }) => {
  if (!cell) {
    return (
      <Box sx={{ p: 1, bgcolor: SHIFT_BG.DAY_OFF, borderRadius: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>Day Off</Typography>
      </Box>
    );
  }
  if (cell._isLeave) {
    const approved = cell.status === 'APPROVED';
    return (
      <Box sx={{ p: 1, bgcolor: approved ? SHIFT_BG.LEAVE_APPROVED : SHIFT_BG.LEAVE_APPLIED, borderLeft: `3px solid ${approved ? SHIFT_BAR.LEAVE_APPROVED : SHIFT_BAR.LEAVE_APPLIED}`, borderRadius: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }}>Leave</Typography>
        <Typography sx={{ fontSize: '0.7rem', color: approved ? '#10b981' : '#f59e0b' }}>{approved ? 'Approved' : 'Applied'}</Typography>
      </Box>
    );
  }
  const t = cell.shiftType as ShiftType;
  if (cell.status === 'DAY_OFF') {
    return (
      <Box sx={{ p: 1, bgcolor: SHIFT_BG.DAY_OFF, borderRadius: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>Day Off</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ p: 1, bgcolor: SHIFT_BG[t], borderLeft: `3px solid ${SHIFT_BAR[t]}`, borderRadius: 1, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{SHIFT_LABEL[t] || t}</Typography>
      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{cell.startTime}-{cell.endTime}</Typography>
    </Box>
  );
};

export default ShiftCalendarPage;
