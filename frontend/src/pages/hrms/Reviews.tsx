import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Pagination, Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid, TextField,
} from '@mui/material';
import {
  ManageAccounts as ReviewsIcon, Star as StarIcon, StarBorder as StarBorderIcon,
  Close as CloseIcon, Check as CheckIcon, Edit as EditIcon, Lock as LockIcon, Download as DownloadIcon,
} from '@mui/icons-material';
import { performanceService, PerformanceReview } from '../../services/phase4.service';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Draft', bg: '#f3f4f6', color: '#6b7280' },
  SUBMITTED: { label: 'Pending HR', bg: '#fef3c7', color: '#92400e' },
  APPROVED: { label: 'Finalized', bg: '#d1fae5', color: '#065f46' },
  REJECTED: { label: 'Rejected', bg: '#fee2e2', color: '#991b1b' },
};

const tabs: { label: string; status: string }[] = [
  { label: 'All', status: '' },
  { label: 'Drafts', status: 'DRAFT' },
  { label: 'Pending HR', status: 'SUBMITTED' },
  { label: 'Finalized', status: 'APPROVED' },
];

export const ReviewsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const isHR = hasPermission('reviews.approve');
  const isSupervisor = hasPermission('reviews.update') || hasPermission('reviews.create');

  const [activeTab, setActiveTab] = useState(0);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [editTarget, setEditTarget] = useState<PerformanceReview | null>(null);
  const [finalizeTarget, setFinalizeTarget] = useState<PerformanceReview | null>(null);
  const [viewTarget, setViewTarget] = useState<PerformanceReview | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await performanceService.list(tabs[activeTab].status, page, pageSize);
      if (res.success && Array.isArray(res.data)) {
        setReviews(res.data);
        setTotal(res.pagination?.total || res.data.length);
      } else { setReviews([]); setTotal(0); }
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReviewsIcon sx={{ color: '#1e3a5f' }} />
            <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Performance Reviews</Typography>
          </Box>
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
        ) : reviews.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography>No performance reviews in this category.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f9fafb' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Joined Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Days Left</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 230 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.map((review) => {
                  const emp = review.employee;
                  const initials = `${emp?.firstName?.[0] || ''}${emp?.lastName?.[0] || ''}`.toUpperCase();
                  const sStyle = STATUS_STYLES[review.status] || STATUS_STYLES.SUBMITTED;
                  const overdue = (review.daysLeft ?? 0) < 0;
                  const daysLabel = overdue
                    ? `+${Math.abs(review.daysLeft || 0).toString().padStart(2, '0')}`
                    : (review.daysLeft || 0).toString().padStart(2, '0');
                  return (
                    <TableRow key={review.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={emp?.profilePictureUrl} sx={{ width: 36, height: 36, fontSize: '0.75rem' }}>{initials}</Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.85rem', color: '#1e3a5f' }}>{emp?.firstName} {emp?.lastName}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{emp?.employeeIdNumber || emp?.id}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{emp?.clinicalRole || emp?.designation || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>{emp?.department || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {emp?.hireDate ? new Date(emp.hireDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: overdue ? '#ef4444' : '#374151' }}>{daysLabel}</TableCell>
                      <TableCell>
                        <Chip label={sStyle.label} size="small"
                          sx={{ bgcolor: sStyle.bg, color: sStyle.color, fontWeight: 500, height: 22, fontSize: '0.7rem' }} />
                        {review.lockedAt && <LockIcon sx={{ fontSize: 14, ml: 0.5, color: '#6b7280', verticalAlign: 'middle' }} />}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {review.status === 'DRAFT' && isSupervisor && (
                            <Button size="small" variant="contained" startIcon={<EditIcon fontSize="small" />}
                              onClick={() => setEditTarget(review)}
                              sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', fontSize: '0.75rem' }}>
                              Complete Review
                            </Button>
                          )}
                          {review.status === 'SUBMITTED' && isHR && (
                            <Button size="small" variant="contained" startIcon={<CheckIcon fontSize="small" />}
                              onClick={() => setFinalizeTarget(review)}
                              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none', fontSize: '0.75rem' }}>
                              Finalize
                            </Button>
                          )}
                          <Button size="small" variant="outlined" onClick={() => setViewTarget(review)}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                            View
                          </Button>
                          {review.lockedAt && (
                            <Button size="small" variant="text" startIcon={<DownloadIcon fontSize="small" />}
                              href={performanceService.pdfUrl(review.id)} target="_blank" rel="noopener noreferrer"
                              sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
                              PDF
                            </Button>
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

        {!loading && reviews.length > 0 && (
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

      {/* Sprint 5.5 — Supervisor Review Form (DRAFT) */}
      <SupervisorReviewForm
        review={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmitted={() => { setEditTarget(null); load(); setSnackbar({ open: true, message: 'Review submitted to HR', severity: 'success' }); }}
        onSaved={() => { setSnackbar({ open: true, message: 'Draft saved', severity: 'success' }); load(); }}
        onError={(m) => setSnackbar({ open: true, message: m, severity: 'error' })}
      />

      {/* Sprint 5.5 — HR Finalize dialog (SUBMITTED) */}
      <HrFinalizeDialog
        review={finalizeTarget}
        onClose={() => setFinalizeTarget(null)}
        onFinalized={() => { setFinalizeTarget(null); load(); setSnackbar({ open: true, message: 'Review finalized — employee notified', severity: 'success' }); }}
        onError={(m) => setSnackbar({ open: true, message: m, severity: 'error' })}
      />

      {/* Read-only view (any status) */}
      <ReadOnlyReviewModal review={viewTarget} onClose={() => setViewTarget(null)} />

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

// ============================================
// Supervisor Review Form (DRAFT → edit + submit with signature)
// ============================================
const SupervisorReviewForm: React.FC<{
  review: PerformanceReview | null;
  onClose: () => void;
  onSubmitted: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}> = ({ review, onClose, onSubmitted, onSaved, onError }) => {
  const [rating, setRating] = useState<number>(0);
  const [strengths, setStrengths] = useState('');
  const [areas, setAreas] = useState('');
  const [goals, setGoals] = useState('');
  const [comments, setComments] = useState('');
  const [signature, setSignature] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (review) {
      setRating(Number(review.overallRating || 0));
      setStrengths(review.strengths || '');
      setAreas(review.areasForImprovement || '');
      setGoals(review.goals || '');
      setComments(review.comments || '');
      setSignature('');
    }
  }, [review]);

  if (!review) return null;
  const emp = review.employee;
  const initials = `${emp?.firstName?.[0] || ''}${emp?.lastName?.[0] || ''}`.toUpperCase();

  const handleSaveDraft = async () => {
    setBusy(true);
    try {
      const r = await performanceService.update(review.id, {
        overallRating: rating, strengths, areasForImprovement: areas, goals, comments,
      });
      if (!r.success) throw new Error(r.error || 'Save failed');
      onSaved();
    } catch (e: any) { onError(e.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const handleSubmit = async () => {
    if (!signature.trim()) { onError('Electronic signature required'); return; }
    if (rating < 1) { onError('Overall rating required'); return; }
    setBusy(true);
    try {
      // First save draft
      await performanceService.update(review.id, {
        overallRating: rating, strengths, areasForImprovement: areas, goals, comments,
      });
      // Then submit
      const r = await performanceService.submit(review.id, signature.trim());
      if (!r.success) throw new Error(r.error || 'Submit failed');
      onSubmitted();
    } catch (e: any) { onError(e.message || 'Submit failed'); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={!!review} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Typography sx={{ fontWeight: 600 }}>Complete Performance Review</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
            {emp?.firstName} {emp?.lastName} • {new Date(review.periodStart).toLocaleDateString()} – {new Date(review.periodEnd).toLocaleDateString()}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={emp?.profilePictureUrl} sx={{ width: 56, height: 56 }}>{initials}</Avatar>
          <Box>
            <Typography sx={{ fontWeight: 500 }}>{emp?.firstName} {emp?.lastName}</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
              {emp?.designation || emp?.clinicalRole} • {emp?.department}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>Overall Rating *</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <IconButton key={i} size="small" onClick={() => setRating(i)} sx={{ p: 0.5 }}>
                {i <= rating ? <StarIcon sx={{ color: '#f59e0b' }} /> : <StarBorderIcon sx={{ color: '#d1d5db' }} />}
              </IconButton>
            ))}
            <Typography sx={{ ml: 1, fontWeight: 500, alignSelf: 'center' }}>{rating}/5</Typography>
          </Box>
        </Box>

        <TextField label="Strengths" multiline minRows={2} fullWidth value={strengths} onChange={(e) => setStrengths(e.target.value)} sx={{ mb: 2 }} />
        <TextField label="Areas for Improvement" multiline minRows={2} fullWidth value={areas} onChange={(e) => setAreas(e.target.value)} sx={{ mb: 2 }} />
        <TextField label="Goals for Next Period" multiline minRows={2} fullWidth value={goals} onChange={(e) => setGoals(e.target.value)} sx={{ mb: 2 }} />
        <TextField label="Additional Comments" multiline minRows={2} fullWidth value={comments} onChange={(e) => setComments(e.target.value)} sx={{ mb: 3 }} />

        <Paper sx={{ p: 2, bgcolor: '#fff7ed', border: '1px solid #fed7aa', boxShadow: 'none' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#92400e', mb: 1 }}>Electronic Signature</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#92400e', mb: 1 }}>
            Type your full name to confirm and submit this review to HR.
          </Typography>
          <TextField label="Your full name" fullWidth size="small" value={signature} onChange={(e) => setSignature(e.target.value)} />
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleSaveDraft} disabled={busy} sx={{ textTransform: 'none' }}>Save Draft</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={busy || !signature.trim() || rating < 1}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          Submit to HR
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================
// HR Finalize Dialog (SUBMITTED → add comp/training notes + lock)
// ============================================
const HrFinalizeDialog: React.FC<{
  review: PerformanceReview | null;
  onClose: () => void;
  onFinalized: () => void;
  onError: (m: string) => void;
}> = ({ review, onClose, onFinalized, onError }) => {
  const [compensation, setCompensation] = useState('');
  const [training, setTraining] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (review) {
      setCompensation(review.compensationNotes || '');
      setTraining(review.trainingNeeds || '');
    }
  }, [review]);

  if (!review) return null;
  const emp = review.employee;
  const rating = Number(review.overallRating || 0);

  const handleFinalize = async () => {
    setBusy(true);
    try {
      const r = await performanceService.finalize(review.id, { compensationNotes: compensation, trainingNeeds: training });
      if (!r.success) throw new Error(r.error || 'Finalize failed');
      onFinalized();
    } catch (e: any) { onError(e.message || 'Finalize failed'); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={!!review} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 600 }}>Finalize Performance Review</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Reviewed by</Typography>
          <Typography sx={{ fontWeight: 500 }}>{review.reviewer?.firstName} {review.reviewer?.lastName}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Signed: {review.supervisorSignature || '—'} • {review.supervisorSignedAt ? new Date(review.supervisorSignedAt).toLocaleString() : '—'}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Employee</Typography>
            <Typography sx={{ fontWeight: 500 }}>{emp?.firstName} {emp?.lastName}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Overall Rating</Typography>
            <Box sx={{ display: 'flex' }}>
              {[1, 2, 3, 4, 5].map((i) =>
                i <= rating ? <StarIcon key={i} sx={{ color: '#f59e0b', fontSize: 18 }} /> : <StarBorderIcon key={i} sx={{ color: '#d1d5db', fontSize: 18 }} />
              )}
            </Box>
          </Box>
        </Box>

        {[
          { label: 'Strengths', val: review.strengths },
          { label: 'Areas for Improvement', val: review.areasForImprovement },
          { label: 'Goals', val: review.goals },
          { label: 'Comments', val: review.comments },
        ].map((s) => (
          <Box key={s.label} sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.label}</Typography>
            <Typography sx={{ fontSize: '0.85rem' }}>{s.val || '—'}</Typography>
          </Box>
        ))}

        <Paper sx={{ p: 2, bgcolor: '#eff4fb', border: '1px solid #c7d2fe', boxShadow: 'none', mt: 2 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e3a5f', mb: 1 }}>HR-only fields</Typography>
          <TextField label="Compensation Notes" multiline minRows={2} fullWidth size="small"
            value={compensation} onChange={(e) => setCompensation(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Training Needs" multiline minRows={2} fullWidth size="small"
            value={training} onChange={(e) => setTraining(e.target.value)} />
        </Paper>

        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fff7ed', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon sx={{ fontSize: 18, color: '#92400e' }} />
          <Typography sx={{ fontSize: '0.85rem', color: '#92400e' }}>
            Finalizing locks the review and notifies the employee. They can view it (read-only) and download a PDF.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={handleFinalize} disabled={busy} startIcon={<LockIcon />}
          sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none' }}>
          Finalize & Notify Employee
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================
// Read-only modal (any status, no edits)
// ============================================
const ReadOnlyReviewModal: React.FC<{ review: PerformanceReview | null; onClose: () => void }> = ({ review, onClose }) => {
  if (!review) return null;
  const emp = review.employee;
  const initials = `${emp?.firstName?.[0] || ''}${emp?.lastName?.[0] || ''}`.toUpperCase();
  const rating = Number(review.overallRating || 0);

  return (
    <Dialog open={!!review} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 600 }}>Performance Review</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={emp?.profilePictureUrl} sx={{ width: 80, height: 80, fontSize: '1.6rem' }}>{initials}</Avatar>
          <Grid container spacing={2}>
            <Grid item xs={4}><Typography variant="caption" sx={{ color: '#6b7280' }}>Employee Name</Typography><Typography sx={{ fontWeight: 500 }}>{emp?.firstName} {emp?.lastName}</Typography></Grid>
            <Grid item xs={4}><Typography variant="caption" sx={{ color: '#6b7280' }}>Role</Typography><Typography sx={{ fontWeight: 500 }}>{emp?.clinicalRole || emp?.designation || '—'}</Typography></Grid>
            <Grid item xs={4}><Typography variant="caption" sx={{ color: '#6b7280' }}>Department</Typography><Typography sx={{ fontWeight: 500 }}>{emp?.department || '—'}</Typography></Grid>
            <Grid item xs={4}><Typography variant="caption" sx={{ color: '#6b7280' }}>Reviewed by</Typography><Typography sx={{ fontWeight: 500 }}>{review.reviewer?.firstName} {review.reviewer?.lastName}</Typography></Grid>
            <Grid item xs={4}><Typography variant="caption" sx={{ color: '#6b7280' }}>Period</Typography><Typography sx={{ fontWeight: 500 }}>{new Date(review.periodStart).toLocaleDateString()} – {new Date(review.periodEnd).toLocaleDateString()}</Typography></Grid>
            <Grid item xs={4}><Typography variant="caption" sx={{ color: '#6b7280' }}>Status</Typography><Typography sx={{ fontWeight: 500 }}>{review.status}{review.lockedAt ? ' 🔒' : ''}</Typography></Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>Overall Rating</Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[1, 2, 3, 4, 5].map((i) => i <= rating
              ? <StarIcon key={i} sx={{ color: '#f59e0b' }} />
              : <StarBorderIcon key={i} sx={{ color: '#d1d5db' }} />)}
          </Box>
        </Box>

        <Section label="Strengths" value={review.strengths} />
        <Section label="Areas for Improvement" value={review.areasForImprovement} />
        <Section label="Goals" value={review.goals} />
        <Section label="Comments" value={review.comments} />
        {review.compensationNotes && <Section label="HR Compensation Notes" value={review.compensationNotes} />}
        {review.trainingNeeds && <Section label="Training Needs" value={review.trainingNeeds} />}
        {review.supervisorSignature && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f6fa', borderRadius: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>Supervisor Signature</Typography>
            <Typography sx={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
              {review.supervisorSignature} on {review.supervisorSignedAt ? new Date(review.supervisorSignedAt).toLocaleString() : '—'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {review.lockedAt && (
          <Button startIcon={<DownloadIcon />} href={performanceService.pdfUrl(review.id)} target="_blank" rel="noopener noreferrer"
            sx={{ textTransform: 'none' }}>
            Download PDF
          </Button>
        )}
        <Button variant="contained" onClick={onClose}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Section: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.9rem', color: '#374151', whiteSpace: 'pre-wrap' }}>{value || '—'}</Typography>
  </Box>
);

export default ReviewsPage;
