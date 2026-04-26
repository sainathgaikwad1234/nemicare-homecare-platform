import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Chip, Button, IconButton,
  Snackbar, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import { Campaign as NoticeIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { noticeBoardService, Notice } from '../../services/phase5b.service';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  announcement: { bg: '#dbeafe', color: '#1e3a5f' },
  'doc-expiry': { bg: '#fef3c7', color: '#92400e' },
  'test-expiry': { bg: '#fef3c7', color: '#92400e' },
  coverage: { bg: '#fee2e2', color: '#991b1b' },
  'leave-info-request': { bg: '#fff7ed', color: '#92400e' },
  'review-due': { bg: '#ede9fe', color: '#5b21b6' },
  'review-ready': { bg: '#d1fae5', color: '#065f46' },
  'shift-change': { bg: '#dbeafe', color: '#1e3a5f' },
  'shift-change-decision': { bg: '#d1fae5', color: '#065f46' },
};

export const NoticeBoardPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canPost = hasPermission('employees.create') || hasPermission('shifts.create'); // HR or Supervisor
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('announcement');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await noticeBoardService.list({ pageSize: 50 });
      if (r.success && Array.isArray(r.data)) setNotices(r.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) return;
    try {
      const r = await noticeBoardService.create({ title, body, category });
      if (!r.success) throw new Error(r.error || 'Create failed');
      setSnackbar({ open: true, message: 'Notice posted', severity: 'success' });
      setOpen(false); setTitle(''); setBody(''); setCategory('announcement');
      load();
    } catch (e: any) { setSnackbar({ open: true, message: e.message || 'Create failed', severity: 'error' }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this notice?')) return;
    try {
      await noticeBoardService.remove(id);
      setSnackbar({ open: true, message: 'Deleted', severity: 'success' });
      load();
    } catch (e: any) { setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' }); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NoticeIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Notice Board</Typography>
          </Box>
          {canPost && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
              sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
              Post Notice
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
        ) : notices.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center', color: '#6b7280' }}><Typography>No notices.</Typography></Box>
        ) : (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {notices.map((n) => {
              const cStyle = CATEGORY_STYLES[n.category || 'announcement'] || { bg: '#f3f4f6', color: '#6b7280' };
              return (
                <Paper key={n.id} sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>{n.title}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{new Date(n.createdAt).toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {n.category && <Chip label={n.category} size="small" sx={{ bgcolor: cStyle.bg, color: cStyle.color, height: 22, fontSize: '0.7rem' }} />}
                      {canPost && (
                        <IconButton size="small" onClick={() => handleDelete(n.id)}><DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} /></IconButton>
                      )}
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: '0.9rem', color: '#374151', whiteSpace: 'pre-wrap' }}>{n.body}</Typography>
                </Paper>
              );
            })}
          </Box>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Post Notice</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth size="small" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2, mt: 1 }} />
          <TextField label="Body" multiline minRows={4} fullWidth size="small" value={body} onChange={(e) => setBody(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Category" fullWidth size="small" value={category} onChange={(e) => setCategory(e.target.value)} helperText="e.g. announcement, policy, alert" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!title.trim() || !body.trim()}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Post
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

export default NoticeBoardPage;
