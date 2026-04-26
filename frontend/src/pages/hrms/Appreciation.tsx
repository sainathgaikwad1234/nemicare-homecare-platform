import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, InputAdornment, Pagination, FormControl, MenuItem, Select,
  CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon, Search as SearchIcon, StarBorder as StarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { recognitionService, Recognition } from '../../services/phase5c.service';
import { employeeService, Employee } from '../../services/employee.service';
import { PillTabs } from '../../components/PillTabs';

type TabValue = 'NOMINEES' | 'CURRENT' | 'PAST';

const TABS = [
  { label: 'Nominees', value: 'NOMINEES' as TabValue },
  { label: 'Current Recognition', value: 'CURRENT' as TabValue },
  { label: 'Past Awards', value: 'PAST' as TabValue },
];

const TAG_PRESETS = [
  'Perfect Attendance', 'Extra Shift', 'Zero Complaints',
  'Team Leader', 'Residents Favorite', 'Excellence',
];
const TAG_BG = '#f5f6fa';
const TAG_FG = '#374151';

const initials = (f?: string, l?: string) =>
  `${(f || '?').charAt(0)}${(l || '?').charAt(0)}`.toUpperCase();

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
};

export const AppreciationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('NOMINEES');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState({ category: 'Excellence', title: '', description: '', tags: [] as string[] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, recRes] = await Promise.all([
        employeeService.listEmployees({ pageSize: 200, status: 'ACTIVE' as any }),
        recognitionService.list({ pageSize: 200 }),
      ]);
      if (empRes.success) setEmployees(empRes.data || []);
      if (recRes.success) setRecognitions(recRes.data || []);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Map employee -> latest recognition date + categories used as tags
  const empMeta = useMemo(() => {
    const map = new Map<number, { lastDate: string | null; tags: string[] }>();
    for (const e of employees) {
      if (e.id !== undefined) map.set(e.id, { lastDate: null, tags: [] });
    }
    for (const r of recognitions) {
      const m = map.get(r.employeeId);
      if (!m) continue;
      if (!m.lastDate || r.createdAt > m.lastDate) m.lastDate = r.createdAt;
      if (r.category && !m.tags.includes(r.category)) m.tags.push(r.category);
    }
    return map;
  }, [employees, recognitions]);

  // Filter rows per tab
  const rows = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 86400000;
    let list: Array<{
      key: string; emp: Employee; lastDate: string | null; tags: string[]; recognitionId?: number; title?: string;
    }> = [];

    if (activeTab === 'NOMINEES') {
      // employees never recognized OR not recognized in 30+ days
      for (const e of employees) {
        if (e.id === undefined) continue;
        const meta = empMeta.get(e.id);
        const lastMs = meta?.lastDate ? new Date(meta.lastDate).getTime() : 0;
        if (!lastMs || lastMs < thirtyDaysAgo) {
          list.push({
            key: `n-${e.id}`,
            emp: e,
            lastDate: meta?.lastDate || null,
            tags: meta?.tags?.length ? meta.tags : TAG_PRESETS.slice(0, 3),
          });
        }
      }
    } else if (activeTab === 'CURRENT') {
      // recognitions in last 30 days, one row per recognition
      for (const r of recognitions) {
        if (new Date(r.createdAt).getTime() < thirtyDaysAgo) continue;
        const emp = employees.find((e) => e.id === r.employeeId);
        if (!emp) continue;
        list.push({
          key: `c-${r.id}`,
          emp, lastDate: r.createdAt, tags: [r.category, ...empMeta.get(r.employeeId)?.tags?.filter((t) => t !== r.category) || []].slice(0, 3),
          recognitionId: r.id, title: r.title,
        });
      }
    } else {
      // past awards (older than 30 days)
      for (const r of recognitions) {
        if (new Date(r.createdAt).getTime() >= thirtyDaysAgo) continue;
        const emp = employees.find((e) => e.id === r.employeeId);
        if (!emp) continue;
        list.push({
          key: `p-${r.id}`,
          emp, lastDate: r.createdAt, tags: [r.category],
          recognitionId: r.id, title: r.title,
        });
      }
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((it) =>
        `${it.emp.firstName} ${it.emp.lastName}`.toLowerCase().includes(s) ||
        (it.emp.designation || '').toLowerCase().includes(s) ||
        (it.emp.department || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [activeTab, employees, recognitions, empMeta, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const openAppreciate = (emp: Employee) => {
    setTarget(emp);
    setForm({ category: 'Excellence', title: '', description: '', tags: [TAG_PRESETS[0]] });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!target || !target.id || !form.title.trim()) {
      setSnackbar({ open: true, message: 'Title is required', severity: 'error' });
      return;
    }
    try {
      await recognitionService.create({
        employeeId: target.id,
        category: form.category,
        title: form.title,
        description: form.description || undefined,
        visibility: 'PUBLIC',
      });
      setSnackbar({ open: true, message: `Recognition posted for ${target.firstName}`, severity: 'success' });
      setDialogOpen(false);
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        {/* Header */}
        <Box sx={{
          p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 1.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TrophyIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Appreciation</Typography>
            <PillTabs
              tabs={TABS}
              value={activeTab}
              onChange={(v) => { setActiveTab(v as TabValue); setPage(1); }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Search Employee"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#9ca3af' }} /></InputAdornment>,
              }}
              sx={{ minWidth: 240 }}
            />
            <Button
              variant="contained" startIcon={<TrophyIcon />}
              onClick={() => {
                if (employees.length > 0) openAppreciate(employees[0]);
              }}
              sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
            >
              Give Appreciation
            </Button>
          </Box>
        </Box>

        {/* Body */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : pageRows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography>{
              activeTab === 'NOMINEES' ? 'No nominees — all employees have recent recognition.' :
              activeTab === 'CURRENT' ? 'No recognitions in the last 30 days.' :
              'No past awards to display.'
            }</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{activeTab === 'NOMINEES' ? 'Last Recognized Date' : 'Recognized Date'}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tags</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.key} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={(row.emp as any).profilePictureUrl}
                          sx={{ width: 36, height: 36, fontSize: '0.78rem', bgcolor: '#1e3a5f' }}>
                          {initials(row.emp.firstName, row.emp.lastName)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f' }}>
                            {row.emp.firstName} {row.emp.lastName}
                          </Typography>
                          <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                            {(row.emp as any).employeeIdNumber || row.emp.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{row.emp.designation || '—'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{(row.emp as any).department || row.emp.facility?.name || 'ALF'}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{fmtDate(row.lastDate)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {row.tags.slice(0, 3).map((t) => (
                          <Chip key={t} label={t} size="small"
                            sx={{ bgcolor: TAG_BG, color: TAG_FG, fontWeight: 500, height: 20, fontSize: '0.68rem' }} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {activeTab === 'NOMINEES' ? (
                        <Button size="small" variant="outlined" startIcon={<StarIcon fontSize="small" />}
                          onClick={() => openAppreciate(row.emp as Employee & { id: number })}
                          sx={{
                            textTransform: 'none', fontSize: '0.75rem',
                            borderColor: '#1e3a5f', color: '#1e3a5f',
                            '&:hover': { bgcolor: '#eff4fb', borderColor: '#1e3a5f' },
                          }}>
                          Appreciate
                        </Button>
                      ) : (
                        <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {row.title || '—'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {!loading && rows.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #f3f4f6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>Rows per page:</Typography>
              <FormControl size="small" variant="standard" sx={{ minWidth: 50 }}>
                <Select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} sx={{ fontSize: '0.85rem' }}>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                {`${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, rows.length)} of ${rows.length}`}
              </Typography>
            </Box>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" shape="rounded" />
          </Box>
        )}
      </Paper>

      {/* Give Appreciation dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TrophyIcon sx={{ color: '#1e3a5f' }} />
            Give Appreciation
          </Box>
          <IconButton size="small" onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Autocomplete
            value={target}
            options={employees}
            getOptionLabel={(o) => `${o.firstName} ${o.lastName}${o.designation ? ` — ${o.designation}` : ''}`}
            onChange={(_, v) => setTarget(v)}
            renderInput={(params) => <TextField {...params} label="Recipient" size="small" />}
          />
          <FormControl size="small" fullWidth>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} displayEmpty>
              {['Excellence', 'Team Leader', 'Perfect Attendance', 'Extra Shift', 'Zero Complaints', 'Residents Favorite'].map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Title" size="small" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
          <TextField label="Description (optional)" size="small" multiline rows={3}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={submit}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Post Appreciation
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AppreciationPage;
