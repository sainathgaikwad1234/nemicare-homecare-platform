import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Avatar, Chip, IconButton, Pagination, Snackbar, Alert,
  CircularProgress, MenuItem, Select, FormControl,
} from '@mui/material';
import {
  Edit as EditIcon, Visibility as ViewIcon, MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { onboardingService } from '../../services/onboarding.service';
import { Employee } from '../../services/employee.service';

const avatarColors = ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'];

export const OnboardingListPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await onboardingService.listEmployees({ page: currentPage, pageSize: rowsPerPage });
      if (res.success && Array.isArray(res.data)) {
        setEmployees(res.data);
        setTotalCount(res.pagination?.total || res.data.length);
      } else {
        setEmployees([]);
        setTotalCount(0);
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: `Failed: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a5f' }}>Onboarding</Typography>
      </Box>

      <Paper sx={{ border: '1px solid #e5e7eb', borderRadius: '6px', boxShadow: 'none' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : employees.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">No employees in onboarding right now.</Typography>
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
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151', width: 120 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp, idx) => {
                  const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();
                  const color = avatarColors[(emp.id || idx) % avatarColors.length];
                  const rmName = (emp as any).reportingManager
                    ? `${(emp as any).reportingManager.firstName || ''} ${(emp as any).reportingManager.lastName || ''}`.trim()
                    : '--';
                  return (
                    <TableRow
                      key={emp.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => emp.id && navigate(`/hrms/onboarding/${emp.id}`)}
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
                      <TableCell>
                        <Chip
                          label="In Progress"
                          size="small"
                          sx={{
                            bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 500, height: 20,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small"><EditIcon fontSize="small" sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton
                          size="small"
                          onClick={() => emp.id && navigate(`/hrms/onboarding/${emp.id}`)}
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

        {!loading && employees.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderTop: '1px solid #f3f4f6' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>Rows per page:</Typography>
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
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
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

export default OnboardingListPage;
