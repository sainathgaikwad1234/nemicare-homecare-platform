import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, IconButton,
  Pagination, TextField, InputAdornment, Autocomplete,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Snackbar, Alert, FormControl, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  AssignmentTurnedIn as TaskIcon, Add as AddIcon, Close as CloseIcon,
  Search as SearchIcon, Visibility as ViewIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import { taskService, Task, TaskPriority } from '../../services/phase4.service';
import { employeeService, Employee } from '../../services/employee.service';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#fef3c7', color: '#92400e' },
  IN_PROGRESS: { bg: '#dbeafe', color: '#1e40af' },
  COMPLETED: { bg: '#d1fae5', color: '#065f46' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b' },
};

const PRIORITY_STYLES: Record<TaskPriority, { bg: string; color: string }> = {
  LOW: { bg: '#f3f4f6', color: '#6b7280' },
  MEDIUM: { bg: '#dbeafe', color: '#1e40af' },
  HIGH: { bg: '#fee2e2', color: '#991b1b' },
};

const initials = (firstName?: string, lastName?: string) =>
  `${(firstName || '?').charAt(0)}${(lastName || '?').charAt(0)}`.toUpperCase();

interface EmployeeProgress {
  employee: Employee;
  total: number;
  completed: number;
  pending: number;
  lastAssignedAt: string | null;
}

interface TaskDraft {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
}

const emptyDraft = (): TaskDraft => ({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });

export const TasksPage: React.FC = () => {
  const [progress, setProgress] = useState<EmployeeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [taskDrafts, setTaskDrafts] = useState<TaskDraft[]>([emptyDraft()]);
  const [busy, setBusy] = useState(false);

  // View tasks dialog
  const [viewEmp, setViewEmp] = useState<Employee | null>(null);
  const [viewTasks, setViewTasks] = useState<Task[]>([]);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    try {
      // Get all employees + their tasks aggregate
      const empRes = await employeeService.listEmployees({ status: 'ACTIVE', pageSize: 200 });
      if (!empRes.success || !Array.isArray(empRes.data)) return;
      setAllEmployees(empRes.data);

      // For each employee, count their tasks
      const aggregated: EmployeeProgress[] = await Promise.all(
        empRes.data.map(async (emp) => {
          try {
            const r = await taskService.list({ assignedToId: emp.id, pageSize: 100 });
            const tasks = (r.success && Array.isArray(r.data)) ? r.data : [];
            const completed = tasks.filter((t: Task) => t.status === 'COMPLETED').length;
            const pending = tasks.filter((t: Task) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
            const lastAssignedAt = tasks[0]?.createdAt || null;
            return { employee: emp, total: tasks.length, completed, pending, lastAssignedAt };
          } catch {
            return { employee: emp, total: 0, completed: 0, pending: 0, lastAssignedAt: null };
          }
        }),
      );
      // Only show employees with at least one task assigned (to mirror Figma)
      setProgress(aggregated.filter((a) => a.total > 0));
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const filtered = progress.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${p.employee.firstName} ${p.employee.lastName}`.toLowerCase().includes(q);
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ===== Assign dialog handlers =====
  const openAssign = () => {
    setSelectedEmployees([]);
    setTaskDrafts([emptyDraft()]);
    setAssignOpen(true);
  };

  const updateDraft = (idx: number, field: keyof TaskDraft, value: string) => {
    const next = [...taskDrafts];
    (next[idx] as any)[field] = value;
    setTaskDrafts(next);
  };

  const addDraftRow = () => setTaskDrafts([...taskDrafts, emptyDraft()]);
  const removeDraftRow = (idx: number) => {
    if (taskDrafts.length === 1) return;
    setTaskDrafts(taskDrafts.filter((_, i) => i !== idx));
  };

  const handleAssign = async () => {
    if (selectedEmployees.length === 0) {
      setSnackbar({ open: true, message: 'Pick at least one employee', severity: 'error' });
      return;
    }
    const validDrafts = taskDrafts.filter((d) => d.title.trim());
    if (validDrafts.length === 0) {
      setSnackbar({ open: true, message: 'At least one task with a title is required', severity: 'error' });
      return;
    }
    setBusy(true);
    try {
      const promises: Promise<any>[] = [];
      for (const emp of selectedEmployees) {
        for (const d of validDrafts) {
          promises.push(taskService.create({
            assignedToId: emp.id,
            title: d.title.trim(),
            description: d.description.trim() || undefined,
            priority: d.priority,
            dueDate: d.dueDate || undefined,
          }));
        }
      }
      await Promise.all(promises);
      setSnackbar({
        open: true,
        message: `Assigned ${validDrafts.length * selectedEmployees.length} tasks across ${selectedEmployees.length} employee(s)`,
        severity: 'success',
      });
      setAssignOpen(false);
      loadProgress();
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Assign failed', severity: 'error' });
    } finally {
      setBusy(false);
    }
  };

  // ===== View tasks =====
  const openViewTasks = async (emp: Employee) => {
    setViewEmp(emp);
    try {
      const r = await taskService.list({ assignedToId: emp.id, pageSize: 100 });
      if (r.success && Array.isArray(r.data)) setViewTasks(r.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TaskIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Tasks</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small" placeholder="Search by name..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 240 }}
            />
            <Button
              variant="contained" startIcon={<AddIcon />}
              onClick={openAssign}
              sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
            >
              Assign Tasks
            </Button>
          </Box>
        </Box>

        {/* Body */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={32} /></Box>
        ) : pageRows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography sx={{ fontSize: '0.9rem' }}>
              {search ? 'No employees match.' : 'No tasks assigned yet. Click "Assign Tasks" to start.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>No. of Tasks Completed</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assigned Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageRows.map((p) => {
                  const allDone = p.total > 0 && p.completed === p.total;
                  const status = allDone ? 'Completed' : 'Pending';
                  const sStyle = allDone ? STATUS_STYLES.COMPLETED : STATUS_STYLES.PENDING;
                  return (
                    <TableRow key={p.employee.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={p.employee.profilePictureUrl}
                            sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#1e3a5f' }}
                          >
                            {initials(p.employee.firstName, p.employee.lastName)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f' }}>
                              {p.employee.firstName} {p.employee.lastName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                              {p.employee.designation || 'Employee'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {p.completed}/{p.total}
                      </TableCell>
                      <TableCell>
                        <Chip label={status} size="small"
                          sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 22, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {p.lastAssignedAt ? new Date(p.lastAssignedAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            size="small" variant="outlined" startIcon={<ViewIcon fontSize="small" />}
                            onClick={() => openViewTasks(p.employee)}
                            sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0.25, borderColor: '#e5e7eb', color: '#1e3a5f' }}
                          >
                            View
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination */}
        {!loading && pageRows.length > 0 && (
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

      {/* ============== Assign Tasks Dialog ============== */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 600 }}>Assign Tasks</Typography>
          <IconButton onClick={() => setAssignOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Employee multi-select */}
          <Autocomplete
            multiple
            options={allEmployees}
            getOptionLabel={(o) => `${o.firstName || ''} ${o.lastName || ''}`.trim()}
            value={selectedEmployees}
            onChange={(_, val) => setSelectedEmployees(val)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={option.profilePictureUrl} sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                    {initials(option.firstName, option.lastName)}
                  </Avatar>
                  <Typography sx={{ fontSize: '0.85rem' }}>
                    {option.firstName} {option.lastName}
                    <Typography component="span" sx={{ fontSize: '0.7rem', color: '#6b7280', ml: 0.5 }}>
                      ({option.designation || 'Employee'})
                    </Typography>
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search employees..."
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <SearchIcon fontSize="small" sx={{ color: '#9ca3af', mr: 0.5 }} />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{ mb: 3 }}
          />

          {/* Task drafts */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {taskDrafts.map((d, idx) => (
              <Paper key={idx} sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 24, height: 24, borderRadius: '50%', bgcolor: '#1e3a5f', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 600,
                    }}>
                      {idx + 1}
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>Task</Typography>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select
                        value={d.priority}
                        onChange={(e) => updateDraft(idx, 'priority', e.target.value)}
                        sx={{ fontSize: '0.85rem' }}
                      >
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  {taskDrafts.length > 1 && (
                    <IconButton size="small" onClick={() => removeDraftRow(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <TextField
                  label="Task Title" fullWidth size="small"
                  value={d.title} onChange={(e) => updateDraft(idx, 'title', e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  label="Description" fullWidth size="small" multiline minRows={2}
                  placeholder="Enter Task Description"
                  value={d.description} onChange={(e) => updateDraft(idx, 'description', e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  label="Due Date (optional)" type="date" size="small"
                  InputLabelProps={{ shrink: true }}
                  value={d.dueDate} onChange={(e) => updateDraft(idx, 'dueDate', e.target.value)}
                />
              </Paper>
            ))}

            <Button
              variant="outlined" startIcon={<AddIcon />} onClick={addDraftRow}
              sx={{ textTransform: 'none', alignSelf: 'flex-start', borderColor: '#1e3a5f', color: '#1e3a5f' }}
            >
              Add More
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleAssign} disabled={busy}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            {busy ? 'Assigning...' : `Assign Tasks${selectedEmployees.length > 0 ? ` (${selectedEmployees.length} emp)` : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============== View tasks dialog ============== */}
      <Dialog open={!!viewEmp} onClose={() => setViewEmp(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar src={viewEmp?.profilePictureUrl} sx={{ width: 36, height: 36 }}>
              {initials(viewEmp?.firstName, viewEmp?.lastName)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {viewEmp?.firstName} {viewEmp?.lastName} — Tasks
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {viewTasks.filter((t) => t.status === 'COMPLETED').length} of {viewTasks.length} completed
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setViewEmp(null)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewTasks.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: '#9ca3af', py: 4 }}>
              No tasks assigned to this employee.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {viewTasks.map((t) => {
                const ss = STATUS_STYLES[t.status];
                const ps = PRIORITY_STYLES[t.priority];
                return (
                  <Paper key={t.id} sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>{t.title}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip label={t.priority} size="small" sx={{ bgcolor: ps.bg, color: ps.color, height: 20, fontSize: '0.65rem' }} />
                        <Chip label={t.status} size="small" sx={{ bgcolor: ss.bg, color: ss.color, height: 20, fontSize: '0.65rem' }} />
                      </Box>
                    </Box>
                    {t.description && (
                      <Typography sx={{ fontSize: '0.8rem', color: '#374151', mb: 0.5 }}>{t.description}</Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2, fontSize: '0.7rem', color: '#6b7280' }}>
                      <span>Assigned: {new Date(t.createdAt).toLocaleDateString()}</span>
                      {t.dueDate && <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                      {t.completedAt && <span style={{ color: '#065f46' }}>Completed: {new Date(t.completedAt).toLocaleDateString()}</span>}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewEmp(null)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TasksPage;
