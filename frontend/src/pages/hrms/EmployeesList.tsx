import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Avatar, Chip, IconButton, Button, Pagination, Tabs, Tab,
  Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
} from '@mui/material';
import {
  Edit as EditIcon, Visibility as ViewIcon, MoreVert as MoreIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { employeeService, Employee } from '../../services/employee.service';
import { useAuth } from '../../contexts/AuthContext';
import { AddEmployeeDialog } from './AddEmployeeDialog';

const statusStyles: Record<string, { label: string; bg: string; color: string }> = {
  ACTIVE: { label: 'Active', bg: '#d1fae5', color: '#065f46' },
  TERMINATED: { label: 'Terminated', bg: '#f3f4f6', color: '#6b7280' },
};

const avatarColors = ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'];

const tabs = [
  { label: 'All', filter: undefined },
  { label: 'Active', filter: 'ACTIVE' },
  { label: 'Terminated', filter: 'TERMINATED' },
];

const isHrAdmin = (user: any) =>
  user?.permissions?.includes('employees.create') === true;

export const EmployeesListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [openAdd, setOpenAdd] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeService.listEmployees({
        page: currentPage,
        pageSize: rowsPerPage,
        status: tabs[activeTab].filter as any,
      });
      if (res.success && Array.isArray(res.data)) {
        setEmployees(res.data);
        setTotalCount(res.pagination?.total || res.data.length);
      } else {
        setEmployees([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: `Failed to load: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, rowsPerPage]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const canAdd = isHrAdmin(user);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a5f' }}>Employees</Typography>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setCurrentPage(1); }}
            sx={{
              minHeight: 32,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 30, padding: '4px 14px', fontSize: '0.8rem',
                textTransform: 'none', borderRadius: 999, color: '#6b7280', fontWeight: 500,
                '&.Mui-selected': { bgcolor: '#eff4fb', color: '#1e3a5f', fontWeight: 600 },
              },
            }}
          >
            {tabs.map((t) => <Tab key={t.label} label={t.label} />)}
          </Tabs>
        </Box>
        {canAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAdd(true)}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}
          >
            Add Employee
          </Button>
        )}
      </Box>

      <Paper sx={{ border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: 'none' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : employees.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">No employees found.</Typography>
            {canAdd && (
              <Button onClick={() => setOpenAdd(true)} sx={{ mt: 2, textTransform: 'none' }}>
                Add Employee
              </Button>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Employee ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Reporting To</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151', width: 120 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp, idx) => {
                  const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();
                  const color = avatarColors[(emp.id || idx) % avatarColors.length];
                  const status = emp.status || 'ACTIVE';
                  const sStyle = statusStyles[status] || statusStyles.ACTIVE;
                  const rmName = (emp as any).reportingManager
                    ? `${(emp as any).reportingManager.firstName || ''} ${(emp as any).reportingManager.lastName || ''}`.trim()
                    : '--';
                  return (
                    <TableRow
                      key={emp.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => emp.id && navigate(`/hrms/employees/${emp.id}`)}
                    >
                      <TableCell sx={{ fontSize: '0.875rem', color: '#374151' }}>
                        {emp.employeeIdNumber || emp.id}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={emp.profilePictureUrl}
                            sx={{ bgcolor: color, width: 30, height: 30, fontSize: '0.75rem' }}
                          >
                            {initials}
                          </Avatar>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e3a5f' }}>
                            {emp.firstName} {emp.lastName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: '#6b7280' }}>{emp.email}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', color: '#6b7280' }}>{rmName}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {(emp as any).clinicalRole || emp.designation || '--'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sStyle.label}
                          size="small"
                          sx={{
                            bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 20,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small"><EditIcon fontSize="small" sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton
                          size="small"
                          onClick={() => emp.id && navigate(`/hrms/employees/${emp.id}`)}
                        >
                          <ViewIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small"><MoreIcon fontSize="small" sx={{ fontSize: 16 }} /></IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination footer */}
        {!loading && employees.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #f3f4f6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem', color: '#6b7280' }}>
              <Typography variant="caption">Rows per page:</Typography>
              <FormControl size="small" variant="standard" sx={{ minWidth: 50 }}>
                <Select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  sx={{ fontSize: '0.85rem' }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption">
                {`${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, totalCount)} of ${totalCount}`}
              </Typography>
            </Box>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, p) => setCurrentPage(p)}
              size="small"
              shape="rounded"
            />
          </Box>
        )}
      </Paper>

      <AddEmployeeDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onCreated={(emp) => {
          setOpenAdd(false);
          setSnackbar({ open: true, message: 'Employee added — proceeding to onboarding', severity: 'success' });
          if (emp?.id) navigate(`/hrms/onboarding/${emp.id}`);
        }}
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

export default EmployeesListPage;
