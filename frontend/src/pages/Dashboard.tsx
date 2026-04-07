/**
 * Dashboard Page - Pixel-perfect Figma match
 * Layout: Quick links -> Stats bar -> [Members Table | Attendance Chart] -> [PA Auth | Vitals Due]
 */

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Drawer,
} from '@mui/material';
import {
  Info as InfoIcon,
  ArrowForward as ArrowIcon,
  TrendingUp as UpIcon,
  TrendingDown as DownIcon,
  People as PeopleIcon,
  Leaderboard as LeadsIcon,
  EventAvailable as AttendIcon,
  HomeWork as VisitsIcon,
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';

interface CalendarCell {
  date: number;
  entries: { name: string; color: string }[];
  dotColor?: string;
}

export const DashboardPage: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [showActivities, setShowActivities] = useState(false);

  const quickLinks = [
    { label: 'Quick Links', type: 'text' },
    { label: 'New ADH Member', type: 'filled' },
    { label: 'New ALF Member', type: 'filled' },
    { label: 'Add Activities', type: 'filled' },
    { label: 'Add Vitals', type: 'outlined' },
    { label: 'Add Progress Notes', type: 'outlined' },
    { label: 'Add Care Plan', type: 'outlined' },
    { label: 'Templates', type: 'outlined' },
  ];

  const metricCards = [
    { title: 'Active Members', value: '456', up: 17, down: 6, icon: <PeopleIcon sx={{ fontSize: 14, color: '#9ca3af' }} /> },
    { title: 'New Leads', value: '456', up: 17, down: 6, icon: <LeadsIcon sx={{ fontSize: 14, color: '#9ca3af' }} /> },
    { title: 'Attendance (MTD)', value: '456', up: 17, down: 6, icon: <AttendIcon sx={{ fontSize: 14, color: '#9ca3af' }} /> },
    { title: 'Visits Today', value: '08', up: 0, down: 0, icon: <VisitsIcon sx={{ fontSize: 14, color: '#9ca3af' }} /> },
  ];

  const todaysMembers = [
    { id: 1, name: 'Devon Lane', avatar: 'DL', time: '00:00 AM', serviceType: 'ADH', transport: '🚗', status: 'New Arrival' as const },
    { id: 2, name: 'Esther Howard', avatar: 'EH', time: '00:00 AM', serviceType: 'Vitals', transport: 'Home Care', status: 'Active' as const },
    { id: 3, name: 'Annette Black', avatar: 'AB', time: '00:00 AM', serviceType: 'Vitals, Pro...', transport: 'ADH', status: 'Active' as const },
    { id: 4, name: 'Kathryn Murphy', avatar: 'KM', time: '00:00 AM', serviceType: 'Progress...', transport: 'Home Care', status: 'Active' as const },
  ];

  const attendanceData = [
    { day: 'Mon', s: [70, 18, 7] },
    { day: 'Tue', s: [75, 20, 8] },
    { day: 'Wed', s: [65, 16, 10] },
    { day: 'Thu', s: [80, 14, 5] },
    { day: 'Fri', s: [60, 22, 9] },
    { day: 'Sat', s: [35, 12, 4] },
    { day: 'Sun', s: [25, 10, 4] },
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const paRows: CalendarCell[][] = [
    [
      { date: 1, dotColor: '#3b82f6', entries: [{ name: 'Robert...', color: '#ef4444' }, { name: 'Robert...', color: '#ef4444' }] },
      { date: 2, entries: [] },
      { date: 3, entries: [{ name: 'Robert...', color: '#f59e0b' }] },
      { date: 4, entries: [] },
      { date: 5, entries: [{ name: 'Floyd...', color: '#ef4444' }, { name: 'Floyd...', color: '#ef4444' }] },
      { date: 6, entries: [{ name: 'Naph...', color: '#8b5cf6' }] },
      { date: 7, entries: [] },
    ],
    [
      { date: 8, entries: [{ name: 'Robert...', color: '#f59e0b' }] },
      { date: 9, entries: [] },
      { date: 10, entries: [] },
      { date: 11, entries: [{ name: 'Robert...', color: '#10b981' }] },
      { date: 12, entries: [{ name: 'Floyd...', color: '#ef4444' }] },
      { date: 13, entries: [{ name: 'Robert...', color: '#f59e0b' }] },
      { date: 14, entries: [] },
    ],
    [
      { date: 15, entries: [] },
      { date: 16, entries: [] },
      { date: 17, entries: [] },
      { date: 18, entries: [] },
      { date: 19, entries: [] },
      { date: 20, entries: [] },
      { date: 21, entries: [] },
    ],
    [
      { date: 22, dotColor: '#3b82f6', entries: [{ name: 'Floyd...', color: '#ef4444' }] },
      { date: 23, entries: [{ name: 'Robert...', color: '#10b981' }] },
      { date: 24, entries: [{ name: 'Floyd...', color: '#ef4444' }] },
      { date: 25, entries: [{ name: 'Robert...', color: '#f59e0b' }] },
      { date: 26, entries: [{ name: 'Floyd...', color: '#8b5cf6' }] },
      { date: 27, entries: [{ name: 'Robert...', color: '#10b981' }] },
      { date: 28, entries: [] },
    ],
  ];

  const vitalsRows: CalendarCell[][] = [
    [
      { date: 1, dotColor: '#ef4444', entries: [{ name: 'Robert...', color: '#ef4444' }] },
      { date: 2, entries: [] },
      { date: 3, entries: [{ name: 'Robert...', color: '#f59e0b' }] },
      { date: 4, entries: [{ name: 'Floyd...', color: '#ef4444' }] },
      { date: 5, entries: [] },
      { date: 6, entries: [{ name: 'Robert...', color: '#8b5cf6' }] },
      { date: 7, entries: [] },
    ],
    [
      { date: 8, entries: [{ name: 'Floyd...', color: '#ef4444' }] },
      { date: 9, entries: [] },
      { date: 10, entries: [{ name: 'Robert...', color: '#10b981' }] },
      { date: 11, entries: [] },
      { date: 12, entries: [{ name: 'Robert...', color: '#f59e0b' }] },
      { date: 13, entries: [{ name: 'Floyd...', color: '#ef4444' }] },
      { date: 14, entries: [] },
    ],
    [
      { date: 15, entries: [{ name: 'Floyd...', color: '#ef4444' }] },
      { date: 16, entries: [] },
      { date: 17, entries: [{ name: 'Robert...', color: '#10b981' }] },
      { date: 18, entries: [] },
      { date: 19, entries: [{ name: 'Floyd...', color: '#f59e0b' }] },
      { date: 20, entries: [{ name: 'Robert...', color: '#8b5cf6' }] },
      { date: 21, entries: [] },
    ],
  ];

  const getStatusColor = (s: string) => s === 'New Arrival' ? '#f59e0b' : '#10b981';
  const avatarColors = ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'];

  const renderCalendarRow = (cells: CalendarCell[]) => (
    <Box sx={{ display: 'flex' }}>
      {cells.map((cell) => (
        <Box key={cell.date} sx={{ flex: 1, minHeight: '48px', borderRight: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', p: '4px 5px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, mb: 0.3 }}>
            {cell.dotColor && <Box sx={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: cell.dotColor, flexShrink: 0 }} />}
            <Typography sx={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500 }}>{String(cell.date).padStart(2, '0')}</Typography>
          </Box>
          {cell.entries.map((entry, idx) => (
            <Chip key={idx} label={entry.name} size="small" sx={{ backgroundColor: entry.color, color: '#fff', fontSize: '8px', height: '15px', mb: 0.3, width: '100%', borderRadius: '3px', '& .MuiChip-label': { px: 0.3 } }} />
          ))}
        </Box>
      ))}
    </Box>
  );

  const renderCalendarSection = (title: string, rows: CalendarCell[][]) => (
    <Paper sx={{ borderRadius: '6px', boxShadow: 'none', border: '1px solid #e5e7eb' }}>
      <Box sx={{ p: '8px 10px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#111827' }}>{title}</Typography>
          <Tooltip title={title}><InfoIcon sx={{ fontSize: 12, color: '#9ca3af' }} /></Tooltip>
          <IconButton size="small" sx={{ p: 0.2, ml: 0.3 }}><PrevIcon sx={{ fontSize: 14, color: '#9ca3af' }} /></IconButton>
          <IconButton size="small" sx={{ p: 0.2 }}><NextIcon sx={{ fontSize: 14, color: '#9ca3af' }} /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Select size="small" defaultValue="month" sx={{ fontSize: '9px', height: '20px', minWidth: 50, '& .MuiSelect-select': { py: 0.1, px: 0.5 } }}>
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="week">Week</MenuItem>
          </Select>
          <Typography sx={{ fontSize: '9px', color: '#3b82f6', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.2 }}>
            View All <OpenIcon sx={{ fontSize: 10 }} />
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 0.5 }}>
        <Box sx={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
          {daysOfWeek.map((day) => (
            <Box key={day} sx={{ flex: 1, textAlign: 'center', py: 0.4 }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#374151' }}>{day}</Typography>
            </Box>
          ))}
        </Box>
        {rows.map((row, idx) => <React.Fragment key={idx}>{renderCalendarRow(row)}</React.Fragment>)}
        <Typography sx={{ fontSize: '9px', color: '#3b82f6', cursor: 'pointer', mt: 0.5, ml: 0.5, fontWeight: 500 }}>+ 4 More</Typography>
      </Box>
    </Paper>
  );

  return (
    <Box>
      {/* Quick Links Row */}
      <Box sx={{ display: 'flex', gap: 0.6, mb: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        {quickLinks.map((link) => {
          if (link.type === 'text') {
            return (
              <Typography key={link.label} sx={{ fontSize: '11px', fontWeight: 500, color: '#374151', textDecoration: 'underline', cursor: 'pointer', mr: 0.3 }}>
                {link.label}
              </Typography>
            );
          }
          const isFilled = link.type === 'filled';
          return (
            <Button
              key={link.label}
              variant={isFilled ? 'contained' : 'outlined'}
              size="small"
              onClick={link.label === 'Add Activities' ? () => setShowActivities(true) : undefined}
              sx={{
                fontSize: '10px', fontWeight: 500, borderRadius: '4px', px: 1.2, py: 0.2, minHeight: '24px', lineHeight: 1.2,
                ...(isFilled
                  ? { backgroundColor: '#1e3a5f', color: '#fff', boxShadow: 'none', '&:hover': { backgroundColor: '#1e2d4a', boxShadow: 'none' } }
                  : { borderColor: '#d1d5db', color: '#374151', backgroundColor: '#fff', '&:hover': { backgroundColor: '#f9fafb' } }),
              }}
            >
              {link.label}
            </Button>
          );
        })}
      </Box>

      {/* Stats Row - Single continuous bar with dividers */}
      <Paper sx={{ display: 'flex', borderRadius: '6px', boxShadow: 'none', border: '1px solid #e5e7eb', mb: 1, overflow: 'hidden' }}>
        {metricCards.map((card, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              p: '8px 14px',
              borderRight: index < metricCards.length - 1 ? '1px solid #e5e7eb' : 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.3 }}>
              {card.icon}
              <Typography sx={{ fontSize: '10px', color: '#6b7280', fontWeight: 500 }}>{card.title}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{card.value}</Typography>
              {card.up > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                  <UpIcon sx={{ fontSize: 11, color: '#10b981' }} />
                  <Typography sx={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>{card.up}</Typography>
                  <DownIcon sx={{ fontSize: 11, color: '#ef4444', ml: 0.3 }} />
                  <Typography sx={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>{card.down}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Paper>

      {/* Row 2: Today's Members + Attendance side by side */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ borderRadius: '6px', boxShadow: 'none', border: '1px solid #e5e7eb', height: '100%' }}>
            <Box sx={{ p: '8px 10px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>Today's Members</Typography>
                <Tooltip title="Members scheduled today"><InfoIcon sx={{ fontSize: 12, color: '#9ca3af' }} /></Tooltip>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Select size="small" defaultValue="all" sx={{ fontSize: '10px', height: '22px', minWidth: 45, '& .MuiSelect-select': { py: 0.2, px: 0.75 } }}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="adh">ADH</MenuItem>
                  <MenuItem value="alf">ALF</MenuItem>
                </Select>
                <Typography sx={{ fontSize: '10px', color: '#3b82f6', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.2 }}>
                  View All <OpenIcon sx={{ fontSize: 10 }} />
                </Typography>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                    {['Time', 'Member Name', 'Due', 'Service Type', 'Transport', 'Status', 'Action'].map((h) => (
                      <TableCell key={h} sx={{ fontSize: '9px', fontWeight: 600, color: '#6b7280', py: 0.6, px: 0.75, textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: '1px solid #e5e7eb' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todaysMembers.map((m, idx) => (
                    <TableRow key={m.id} sx={{ '&:hover': { backgroundColor: '#f9fafb' } }}>
                      <TableCell sx={{ fontSize: '11px', color: '#374151', py: 0.75, px: 0.75 }}>{m.time}</TableCell>
                      <TableCell sx={{ py: 0.75, px: 0.75 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '9px', fontWeight: 600, backgroundColor: avatarColors[idx] }}>{m.avatar}</Avatar>
                          <Typography sx={{ fontSize: '11px', color: '#374151', fontWeight: 500 }}>{m.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, px: 0.75 }}></TableCell>
                      <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, px: 0.75 }}>{m.serviceType}</TableCell>
                      <TableCell sx={{ fontSize: '11px', color: '#6b7280', py: 0.75, px: 0.75 }}>{m.transport}</TableCell>
                      <TableCell sx={{ py: 0.75, px: 0.75 }}>
                        <Chip label={m.status} size="small" sx={{ backgroundColor: getStatusColor(m.status), color: '#fff', fontSize: '9px', fontWeight: 600, height: '18px', '& .MuiChip-label': { px: 0.6 } }} />
                      </TableCell>
                      <TableCell sx={{ py: 0.75, px: 0.75 }}>
                        <Button variant="contained" size="small" endIcon={<ArrowIcon sx={{ fontSize: '9px !important' }} />}
                          sx={{ backgroundColor: '#1e3a5f', fontSize: '9px', padding: '3px 8px', minHeight: '22px', '&:hover': { backgroundColor: '#1e2d4a' }, boxShadow: 'none', '& .MuiButton-endIcon': { ml: 0.3 } }}>
                          Check-in
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Attendance Chart */}
        <Grid item xs={12} lg={5}>
          <Paper sx={{ borderRadius: '6px', boxShadow: 'none', border: '1px solid #e5e7eb', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: '8px 10px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>Attendance</Typography>
              <Box sx={{ display: 'flex', gap: 0.4 }}>
                {[{ v: 'week', l: 'Week' }, { v: 'jan', l: 'Jan' }, { v: '1st', l: '1st Week' }].map((f) => (
                  <Select key={f.v} size="small" defaultValue={f.v} sx={{ fontSize: '9px', height: '20px', minWidth: f.v === '1st' ? 58 : 42, '& .MuiSelect-select': { py: 0.1, px: 0.5 } }}>
                    <MenuItem value={f.v}>{f.l}</MenuItem>
                  </Select>
                ))}
              </Box>
            </Box>
            <Box sx={{ p: '8px 10px', flex: 1, display: 'flex', minHeight: '220px' }}>
              {/* Y-axis */}
              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pr: 0.5, pb: '20px' }}>
                {[100, 80, 60, 40, 20, 0].map((v) => (
                  <Typography key={v} sx={{ fontSize: '9px', color: '#9ca3af', lineHeight: 1, minWidth: '18px', textAlign: 'right' }}>{v}</Typography>
                ))}
              </Box>
              {/* Bars */}
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 1, borderLeft: '1px solid #e5e7eb', pl: 0.5 }}>
                {attendanceData.map((d) => (
                  <Box key={d.day} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ width: '55%', display: 'flex', flexDirection: 'column-reverse' }}>
                      <Box sx={{ height: `${(d.s[0] / 100) * 170}px`, backgroundColor: '#1e3a5f' }} />
                      <Box sx={{ height: `${(d.s[1] / 100) * 170}px`, backgroundColor: '#3b82f6' }} />
                      <Box sx={{ height: `${(d.s[2] / 100) * 170}px`, backgroundColor: '#93c5fd', borderRadius: '2px 2px 0 0' }} />
                    </Box>
                    <Typography sx={{ fontSize: '9px', color: '#6b7280', fontWeight: 500, mt: 0.5 }}>{d.day}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Row 3: PA Authorization + Vitals side by side */}
      <Grid container spacing={1}>
        <Grid item xs={12} lg={6}>
          {renderCalendarSection('PA Authorization & Standing Order Expiration', paRows)}
        </Grid>
        <Grid item xs={12} lg={6}>
          {renderCalendarSection('Vitals & Progress Notes Due', vitalsRows)}
        </Grid>
      </Grid>

      {/* Add Activities Drawer */}
      <Drawer anchor="right" open={showActivities} onClose={() => setShowActivities(false)}
        PaperProps={{ sx: { width: 280, mt: '42px', p: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>Add Activities</Typography>
          <IconButton size="small" onClick={() => setShowActivities(false)}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
        </Box>
        <Typography sx={{ fontSize: '12px', color: '#6b7280', mb: 1.5 }}>Please select a patient before adding activities.</Typography>
        <Select fullWidth size="small" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} displayEmpty sx={{ mb: 1.5, fontSize: '12px' }}>
          <MenuItem value="" disabled>Select Patient</MenuItem>
          <MenuItem value="devon">Devon Lane</MenuItem>
          <MenuItem value="esther">Esther Howard</MenuItem>
          <MenuItem value="annette">Annette Black</MenuItem>
          <MenuItem value="kathryn">Kathryn Murphy</MenuItem>
        </Select>
        <Button variant="contained" fullWidth disabled={!selectedPatient}
          sx={{ backgroundColor: '#1e3a5f', '&:hover': { backgroundColor: '#1e2d4a' } }}>Proceed</Button>
      </Drawer>
    </Box>
  );
};
