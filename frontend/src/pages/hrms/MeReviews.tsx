import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button,
  Snackbar, Alert, CircularProgress, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import {
  StarBorder as StarOutlineIcon, Star as StarIcon,
  Close as CloseIcon, Download as DownloadIcon, Lock as LockIcon,
} from '@mui/icons-material';
import { performanceService, PerformanceReview } from '../../services/phase4.service';

export const MeReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [view, setView] = useState<PerformanceReview | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await performanceService.myList();
      if (r.success && Array.isArray(r.data)) setReviews(r.data);
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon sx={{ color: '#1e3a5f' }} />
          <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>My Performance Reviews</Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={32} /></Box>
        ) : reviews.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#6b7280' }}>
            <Typography>No finalized performance reviews yet.</Typography>
            <Typography sx={{ fontSize: '0.85rem', mt: 1 }}>Reviews appear here once your supervisor has submitted and HR has finalized them.</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 2 }}>
            {reviews.map((r) => {
              const rating = Number(r.overallRating || 0);
              return (
                <Paper key={r.id} sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>
                      {new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280' }}>
                      <LockIcon sx={{ fontSize: 14 }} />
                      <Typography sx={{ fontSize: '0.75rem' }}>Finalized</Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: '0.85rem', color: '#6b7280', mb: 1 }}>
                    Reviewed by {r.reviewer?.firstName} {r.reviewer?.lastName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.25, mb: 2 }}>
                    {[1, 2, 3, 4, 5].map((i) => i <= rating
                      ? <StarIcon key={i} sx={{ color: '#f59e0b', fontSize: 22 }} />
                      : <StarOutlineIcon key={i} sx={{ color: '#d1d5db', fontSize: 22 }} />)}
                    <Typography sx={{ ml: 1, fontWeight: 500, alignSelf: 'center' }}>{rating}/5</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => setView(r)}
                      sx={{ textTransform: 'none', fontSize: '0.8rem' }}>
                      View
                    </Button>
                    <Button size="small" variant="contained" startIcon={<DownloadIcon />}
                      href={performanceService.pdfUrl(r.id, 'me')} target="_blank" rel="noopener noreferrer"
                      sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', fontSize: '0.8rem' }}>
                      Download PDF
                    </Button>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}
      </Paper>

      <Dialog open={!!view} onClose={() => setView(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 600 }}>Performance Review</Typography>
          <IconButton onClick={() => setView(null)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        {view && (
          <DialogContent dividers>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography variant="caption" sx={{ color: '#6b7280' }}>Period</Typography><Typography>{new Date(view.periodStart).toLocaleDateString()} – {new Date(view.periodEnd).toLocaleDateString()}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" sx={{ color: '#6b7280' }}>Reviewed by</Typography><Typography>{view.reviewer?.firstName} {view.reviewer?.lastName}</Typography></Grid>
            </Grid>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>Overall Rating</Typography>
              <Box sx={{ display: 'flex' }}>
                {[1, 2, 3, 4, 5].map((i) => i <= Number(view.overallRating || 0)
                  ? <StarIcon key={i} sx={{ color: '#f59e0b' }} />
                  : <StarOutlineIcon key={i} sx={{ color: '#d1d5db' }} />)}
              </Box>
            </Box>
            {[
              { label: 'Strengths', val: view.strengths },
              { label: 'Areas for Improvement', val: view.areasForImprovement },
              { label: 'Goals', val: view.goals },
              { label: 'Comments', val: view.comments },
              { label: 'HR Compensation Notes', val: view.compensationNotes },
              { label: 'Training Needs', val: view.trainingNeeds },
            ].map((s) => s.val ? (
              <Box key={s.label} sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>{s.label}</Typography>
                <Typography sx={{ whiteSpace: 'pre-wrap' }}>{s.val}</Typography>
              </Box>
            ) : null)}
          </DialogContent>
        )}
        <DialogActions>
          {view?.lockedAt && (
            <Button startIcon={<DownloadIcon />} href={performanceService.pdfUrl(view.id, 'me')} target="_blank" rel="noopener noreferrer"
              sx={{ textTransform: 'none' }}>
              Download PDF
            </Button>
          )}
          <Button variant="contained" onClick={() => setView(null)}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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

export default MeReviewsPage;
