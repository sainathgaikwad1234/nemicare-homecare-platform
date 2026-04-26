import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, IconButton,
  Tabs, Tab, TextField, InputAdornment, Pagination,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Snackbar, Alert, FormControl, Select, MenuItem,
} from '@mui/material';
import {
  Description as DocIcon, Search as SearchIcon, FilterList as FilterIcon,
  Upload as UploadIcon, Visibility as ViewIcon, FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { documentsDashboardService, DocumentRow } from '../../services/phase5c.service';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Active: { bg: '#d1fae5', color: '#065f46' },
  Soon: { bg: '#fef3c7', color: '#92400e' },
  Expired: { bg: '#fee2e2', color: '#991b1b' },
};

const TABS: { label: string; value: 'ALL' | 'ACTIVE' | 'SOON' | 'EXPIRED' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Soon', value: 'SOON' },
  { label: 'Expired', value: 'EXPIRED' },
];

const initials = (firstName?: string, lastName?: string) =>
  `${(firstName || '?').charAt(0)}${(lastName || '?').charAt(0)}`.toUpperCase();

export const DocumentsDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentsDashboardService.list({
        status: TABS[activeTab].value,
        search: search.trim() || undefined,
        page,
        pageSize,
      });
      if (res.success && Array.isArray(res.data)) {
        setRows(res.data);
        setTotal(res.pagination?.total || 0);
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed to load', severity: 'error' });
    } finally { setLoading(false); }
  }, [activeTab, search, page, pageSize]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DocIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Documents</Typography>
            <Tabs
              value={activeTab}
              onChange={(_, v) => { setActiveTab(v); setPage(1); }}
              sx={{
                ml: 2, minHeight: 30,
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTab-root': {
                  minHeight: 28, padding: '4px 14px', fontSize: '0.78rem',
                  textTransform: 'none', borderRadius: 999, color: '#6b7280', fontWeight: 500,
                  '&.Mui-selected': { bgcolor: '#1e3a5f', color: '#fff', fontWeight: 600 },
                },
              }}
            >
              {TABS.map((t) => <Tab key={t.value} label={t.label} />)}
            </Tabs>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" sx={{ border: '1px solid #e5e7eb', borderRadius: 1 }}>
              <FilterIcon fontSize="small" />
            </IconButton>
            <TextField
              size="small" placeholder="Search..."
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
              variant="outlined" startIcon={<UploadIcon />}
              sx={{ textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f', '&:hover': { bgcolor: '#eff4fb', borderColor: '#1a3354' } }}
            >
              Upload Document
            </Button>
          </Box>
        </Box>

        {/* Body */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={32} /></Box>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography sx={{ fontSize: '0.9rem' }}>
              {search ? 'No documents match your search.' : 'No documents in this category.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Days Left</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Expiry Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 90 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((d) => {
                  const sStyle = STATUS_STYLES[d.computedStatus] || STATUS_STYLES.Active;
                  const daysLeftDisplay = d.daysLeft !== null
                    ? d.daysLeft < 0
                      ? '00'
                      : String(d.daysLeft).padStart(2, '0')
                    : '—';
                  return (
                    <TableRow key={d.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={d.employee.profilePictureUrl || undefined}
                            sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: '#1e3a5f' }}
                          >
                            {initials(d.employee.firstName, d.employee.lastName)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e3a5f' }}>
                              {d.employee.firstName} {d.employee.lastName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                              {d.employee.employeeIdNumber || `#${d.employee.id}`}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{d.documentName || d.documentType}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{daysLeftDisplay}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={d.computedStatus} size="small"
                          sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 22, fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" sx={{ color: '#6b7280' }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                          {d.fileUrl && (
                            <IconButton size="small" sx={{ color: '#6b7280' }}
                              onClick={() => window.open(d.fileUrl!, '_blank')}>
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          )}
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
                {`${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
              </Typography>
            </Box>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" shape="rounded" />
          </Box>
        )}
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentsDashboardPage;
