import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, IconButton, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Pagination, Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
} from '@mui/material';
import {
  Checklist as TasksIcon, Check as CheckIcon, Warning as WarningIcon,
} from '@mui/icons-material';
import { taskService, Task, TaskStats } from '../../services/phase4.service';

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  HIGH: { bg: '#fee2e2', color: '#991b1b' },
  MEDIUM: { bg: '#fef3c7', color: '#92400e' },
  LOW: { bg: '#d1fae5', color: '#065f46' },
};
const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  COMPLETED: { label: 'Completed', bg: '#d1fae5', color: '#065f46' },
  PENDING: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  IN_PROGRESS: { label: 'In Progress', bg: '#dbeafe', color: '#1e3a5f' },
  DUE: { label: 'Due', bg: '#fee2e2', color: '#991b1b' },
};

const tabs: { label: string; status: string }[] = [
  { label: 'All', status: '' },
  { label: 'Completed', status: 'COMPLETED' },
  { label: 'Pending', status: 'PENDING' },
  { label: 'Due', status: 'DUE' },
];

export const MeTasksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0, pending: 0, due: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        taskService.myList(tabs[activeTab].status === 'DUE' ? undefined : tabs[activeTab].status, page, pageSize),
        taskService.myStats(),
      ]);
      let data = (t.success && Array.isArray(t.data)) ? t.data : [];
      // Client-side filter for "Due" tab
      if (tabs[activeTab].status === 'DUE') {
        data = data.filter((task) => task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < new Date());
      }
      setTasks(data);
      setTotal(t.pagination?.total || data.length);
      if (s.success && s.data) setStats(s.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (id: number) => {
    try {
      await taskService.markComplete(id);
      setSnackbar({ open: true, message: 'Task completed', severity: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const isDue = (t: Task) => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date();

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid #f3f4f6', gap: 1 }}>
          <TasksIcon sx={{ color: '#1e3a5f' }} />
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Tasks</Typography>
        </Box>

        {/* Stat cards */}
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          <StatCard label="Total Tasks" value={stats.total} />
          <StatCard label="Completed Tasks" value={stats.completed} />
          <StatCard label="Pending Tasks" value={stats.pending} />
          <StatCard label="Due Tasks" value={stats.due} />
        </Box>

        {/* Banner */}
        {stats.pending > 0 && (
          <Box sx={{ mx: 2, mb: 2, p: 1.5, bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <WarningIcon sx={{ fontSize: 18, color: '#f59e0b', mt: 0.25 }} />
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#92400e' }}>Pending Tasks</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#92400e' }}>
                You have {stats.pending} pending {stats.pending === 1 ? 'task' : 'tasks'} assigned for this week. Complete all tasks before submitting your timecard.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Tabs + Table */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6' }}>
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Tasks</Typography>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setPage(1); }}
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
            {tabs.map((t) => <Tab key={t.label} label={t.label} />)}
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : tasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography>No tasks in this category.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assigned By</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 60 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => {
                  const due = isDue(task);
                  const status = task.status === 'COMPLETED' ? 'COMPLETED' : due ? 'DUE' : task.status;
                  const sStyle = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
                  const pStyle = PRIORITY_STYLES[task.priority];
                  return (
                    <TableRow key={task.id} hover>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{task.title}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.description || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {task.createdBy ? `${task.createdBy.firstName || ''} ${task.createdBy.lastName || ''}`.trim() : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                          size="small"
                          sx={{ bgcolor: pStyle.bg, color: pStyle.color, fontWeight: 500, height: 20, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={sStyle.label} size="small" sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 20, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          disabled={task.status === 'COMPLETED'}
                          onClick={() => handleComplete(task.id)}
                          sx={{
                            border: '1px solid #e5e7eb',
                            bgcolor: task.status === 'COMPLETED' ? '#f3f4f6' : '#fff',
                            color: task.status === 'COMPLETED' ? '#9ca3af' : '#1e3a5f',
                            '&:hover': { bgcolor: '#eff4fb' },
                          }}
                        >
                          <CheckIcon fontSize="small" sx={{ fontSize: 14 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {!loading && tasks.length > 0 && (
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
      </Paper>

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

const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <Paper sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
    <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e3a5f' }}>{value}</Typography>
  </Paper>
);

export default MeTasksPage;
