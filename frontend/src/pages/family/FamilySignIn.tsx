import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, IconButton, InputAdornment, Link, Checkbox, FormControlLabel,
  CircularProgress, Snackbar, Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const FamilySignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'success' | 'error' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setSnackbar({ open: true, message: 'Email and password are required', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/family/dashboard');
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Sign in failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', bgcolor: '#fff',
    }}>
      {/* Left — hero image with overlay */}
      <Box sx={{
        flex: 1, display: { xs: 'none', md: 'flex' },
        position: 'relative',
        backgroundImage: 'linear-gradient(180deg, rgba(30,58,95,0.05) 0%, rgba(30,58,95,0.5) 100%), url("https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&auto=format&fit=crop")',
        backgroundSize: 'cover', backgroundPosition: 'center',
        m: 2, borderRadius: '12px', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', bottom: 24, left: 24, color: '#fff',
          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.1 }}>
            A New Way Forward For Senior Care
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', mt: 0.5, opacity: 0.9 }}>
            Modern · Empathetic · Connected
          </Typography>
        </Box>
      </Box>

      {/* Right — form */}
      <Box sx={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', p: 4,
      }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Box component="img" src="/nemicare-logo.png" alt="Nemi Care"
            sx={{ width: 44, height: 44, objectFit: 'contain' }} />
          <Box>
            <Typography sx={{
              fontFamily: '"Dancing Script", cursive', fontWeight: 700, fontStyle: 'italic',
              fontSize: '24px', color: '#1e3a5f', lineHeight: 1,
            }}>
              Nemi Care
            </Typography>
            <Typography sx={{ fontSize: '0.62rem', color: '#9ca3af' }}>Bridging hearts. Empowering Communities.</Typography>
          </Box>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 360 }}>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e3a5f', mb: 0.5 }}>
            Sign In Your Account
          </Typography>
          <Typography sx={{ fontSize: '0.82rem', color: '#6b7280', mb: 3 }}>
            Enter the information to access your account
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#374151', mb: 0.75 }}>
              Email <span style={{ color: '#dc2626' }}>*</span>
            </Typography>
            <TextField
              fullWidth size="small" placeholder="Enter Email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#374151', mb: 0.75 }}>
              Password <span style={{ color: '#dc2626' }}>*</span>
            </Typography>
            <TextField
              fullWidth size="small" placeholder="Enter Password"
              type={showPw ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw((s) => !s)}>
                      {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <FormControlLabel
              control={<Checkbox size="small" checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
              label={<Typography sx={{ fontSize: '0.78rem', color: '#374151' }}>Remember me</Typography>}
            />
            <Link
              onClick={() => navigate('/family/forgot-password')}
              sx={{ fontSize: '0.78rem', color: '#1e3a5f', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}
            >
              Forgot Password?
            </Link>
          </Box>

          <Button
            fullWidth type="submit" variant="contained" disabled={loading}
            sx={{
              bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' },
              textTransform: 'none', borderRadius: '8px', py: 1, fontWeight: 600,
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Continue'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, mt: 4, opacity: 0.7 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.62rem', color: '#9ca3af' }}>Protected by</Typography>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>HIPAA</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.62rem', color: '#9ca3af' }}>Powered by</Typography>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151' }}>Nemi Care</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default FamilySignInPage;
