import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Pagination,
  Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab,
} from '@mui/material';
import {
  Schedule as ScheduleIcon, PlayArrow as RunIcon, Refresh as RefreshIcon,
} from '@mui/icons-material';
import { jobsService, JobDefinition, JobRunLog, JobRunStatus } from '../../services/phase5.service';

const STATUS_STYLES: Record<JobRunStatus, { bg: string; color: string }> = {
  RUNNING: { bg: '#e0e7ff', color: '#3730a3' },
  SUCCESS: { bg: '#d1fae5', color: '#065f46' },
  PARTIAL: { bg: '#fef3c7', color: '#92400e' },
  FAILED:  { bg: '#fee2e2', color: '#991b1b' },
};

const fmtDateTime = (s: string | null) => (s ? new Date(s).toLocaleString() : '—');

export const SystemJobsPage: React.FC = () => {
  const [tab, setTab] = useState<'definitions' | 'history'>('definitions');
  const [jobs, setJobs] = useState<JobDefinition[]>([]);
  const [runs, setRuns] = useState<JobRunLog[]>([]);
  const [filterJob, setFilterJob] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadJobs = useCallback(async () => {
    try {
      const res = await jobsService.list();
      if (res.success && Array.isArray(res.data)) setJobs(res.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load jobs', severity: 'error' });
    }
  }, []);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await jobsService.runs(filterJob || undefined, page, pageSize);
      if (res.success && Array.isArray(res.data)) setRuns(res.data);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load runs', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterJob, page, pageSize]);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { loadRuns(); }, [loadRuns]);

  const handleTrigger = async (name: string) => {
    try {
      const res = await jobsService.trigger(name);
      if (!res.success || !res.data) throw new Error(res.error || 'Trigger failed');
      const r = res.data;
      const summary = r.result?.summary || `Status: ${r.status}`;
      setSnackbar({
        open: true,
        message: `${name}: ${r.status} — ${summary}`,
        severity: r.status === 'SUCCESS' ? 'success' : 'error',
      });
      // Refresh history
      setTab('history');
      setFilterJob(name);
      loadRuns();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Trigger failed', severity: 'error' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>System Jobs</Typography>
          </Box>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
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
            <Tab value="definitions" label="Jobs" />
            <Tab value="history" label="Run History" />
          </Tabs>
        </Box>

        {tab === 'definitions' && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Job</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Schedule (cron)</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 140 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.name} hover>
                    <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{j.name}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem' }}>{j.description}</TableCell>
                    <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#6b7280' }}>{j.schedule}</TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<RunIcon fontSize="small" />} variant="contained"
                        onClick={() => handleTrigger(j.name)}
                        sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', fontSize: '0.75rem' }}>
                        Run now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                  <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: '#6b7280' }}>No jobs registered.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tab === 'history' && (
          <>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #f3f4f6' }}>
              <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Filter:</Typography>
              <FormControl size="small" sx={{ minWidth: 240 }}>
                <Select value={filterJob} onChange={(e) => { setFilterJob(e.target.value); setPage(1); }} displayEmpty sx={{ fontSize: '0.85rem' }}>
                  <MenuItem value="">All jobs</MenuItem>
                  {jobs.map((j) => <MenuItem key={j.name} value={j.name}>{j.name}</MenuItem>)}
                </Select>
              </FormControl>
              <Button size="small" startIcon={<RefreshIcon fontSize="small" />} onClick={loadRuns}
                sx={{ textTransform: 'none', color: '#1e3a5f' }}>Refresh</Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
            ) : runs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
                <Typography>No runs recorded yet.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f9fafb' }}>
                      <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Job</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Started</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Alerts</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Trigger</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Summary</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {runs.map((r) => {
                      const sStyle = STATUS_STYLES[r.status];
                      return (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ fontSize: '0.8rem' }}>#{r.id}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{r.jobName}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{fmtDateTime(r.startedAt)}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{r.durationMs ? `${r.durationMs}ms` : '—'}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{r.itemsProcessed}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem' }}>{r.alertsSent}</TableCell>
                          <TableCell>
                            <Chip label={r.status} size="small" sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 20, fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', color: '#6b7280' }}>{r.triggeredBy || '—'}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.summary || (r.errors ? 'see errors' : '—')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {!loading && runs.length > 0 && (
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
                    {`${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
                  </Typography>
                </Box>
                <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" shape="rounded" />
              </Box>
            )}
          </>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemJobsPage;
