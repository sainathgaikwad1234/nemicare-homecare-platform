import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, IconButton, InputAdornment,
  Avatar, Snackbar, Alert, CircularProgress, MenuItem, Select, FormControl,
} from '@mui/material';
import {
  Visibility, VisibilityOff, ArrowBack as BackIcon,
  CheckCircle as CheckIcon, ChevronRight as ArrowRightIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AuthFrame: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; onBack?: () => void }> = ({
  title, subtitle, children, onBack,
}) => (
  <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#fff' }}>
    {/* Left hero */}
    <Box sx={{
      flex: 1, display: { xs: 'none', md: 'flex' },
      position: 'relative',
      backgroundImage: 'linear-gradient(180deg, rgba(30,58,95,0.05) 0%, rgba(30,58,95,0.5) 100%), url("https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&auto=format&fit=crop")',
      backgroundSize: 'cover', backgroundPosition: 'center',
      m: 2, borderRadius: '12px', overflow: 'hidden',
    }}>
      <Box sx={{ position: 'absolute', bottom: 24, left: 24, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
        <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.1 }}>
          A New Way Forward For Senior Care
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', mt: 0.5, opacity: 0.9 }}>
          Modern · Empathetic · Connected
        </Typography>
      </Box>
    </Box>

    {/* Right form */}
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Box component="img" src="/nemicare-logo.png" alt="Nemi Care"
          sx={{ width: 44, height: 44, objectFit: 'contain' }} />
        <Box>
          <Typography sx={{
            fontFamily: '"Dancing Script", cursive', fontWeight: 700, fontStyle: 'italic',
            fontSize: '24px', color: '#1e3a5f', lineHeight: 1,
          }}>Nemi Care</Typography>
          <Typography sx={{ fontSize: '0.62rem', color: '#9ca3af' }}>
            Bridging hearts. Empowering Communities.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {onBack && (
          <Button startIcon={<BackIcon />} onClick={onBack}
            sx={{ textTransform: 'none', color: '#6b7280', mb: 1, p: 0 }}>
            Back
          </Button>
        )}
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e3a5f', mb: 0.5 }}>{title}</Typography>
        {subtitle && (
          <Typography sx={{ fontSize: '0.82rem', color: '#6b7280', mb: 3 }}>{subtitle}</Typography>
        )}
        {children}
      </Box>
    </Box>
  </Box>
);

// ============== OTP ==============
export const FamilyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendIn, setResendIn] = useState(30);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const update = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits]; next[i] = v; setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const code = digits.join('');
  const verify = () => {
    if (code.length < 6) {
      setSnackbar({ open: true, message: 'Enter the full 6-digit code', severity: 'error' });
      return;
    }
    // In Phase 2: call backend to verify OTP
    navigate('/family/set-password');
  };

  return (
    <AuthFrame
      title="Enter OTP"
      subtitle="We sent a 6-digit code to your registered email"
      onBack={() => navigate('/family/login')}
    >
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mb: 2 }}>
        {digits.map((d, i) => (
          <TextField
            key={i}
            inputRef={(el) => { refs.current[i] = el; }}
            value={d}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus();
            }}
            inputProps={{
              maxLength: 1,
              style: { textAlign: 'center', fontSize: '1.4rem', fontWeight: 600, color: '#1e3a5f' },
            }}
            sx={{ width: 52, '& .MuiOutlinedInput-root': { borderRadius: '8px', height: 56 } }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>
          Didn't receive code?
        </Typography>
        <Button
          disabled={resendIn > 0}
          onClick={() => { setResendIn(30); setSnackbar({ open: true, message: 'OTP resent', severity: 'success' }); }}
          sx={{ textTransform: 'none', fontSize: '0.78rem', color: '#1e3a5f', fontWeight: 600 }}>
          {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
        </Button>
      </Box>
      <Button fullWidth variant="contained" onClick={verify}
        sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', borderRadius: '8px', py: 1, fontWeight: 600 }}>
        Verify
      </Button>
      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </AuthFrame>
  );
};

// ============== Set Password ==============
export const FamilySetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const rules = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /\d/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
  const allOk = Object.values(rules).every(Boolean) && pw === confirm && confirm.length > 0;

  const submit = () => {
    if (!allOk) {
      setSnackbar({ open: true, message: 'Please meet all password rules and match confirmation', severity: 'error' });
      return;
    }
    navigate('/family/complete-profile');
  };

  return (
    <AuthFrame title="Set Your Password" subtitle="Create a strong password to secure your account">
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#374151', mb: 0.75 }}>
        Password <span style={{ color: '#dc2626' }}>*</span>
      </Typography>
      <TextField
        fullWidth size="small" placeholder="Enter password"
        type={showPw ? 'text' : 'password'}
        value={pw} onChange={(e) => setPw(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShowPw((s) => !s)}>
                {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
      />
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#374151', mb: 0.75 }}>
        Confirm Password <span style={{ color: '#dc2626' }}>*</span>
      </Typography>
      <TextField
        fullWidth size="small" placeholder="Re-enter password"
        type={showConfirm ? 'text' : 'password'}
        value={confirm} onChange={(e) => setConfirm(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShowConfirm((s) => !s)}>
                {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
      />

      {/* Rules */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {[
          { ok: rules.length,  label: 'At least 8 characters' },
          { ok: rules.upper,   label: 'Contains an uppercase letter' },
          { ok: rules.number,  label: 'Contains a number' },
          { ok: rules.special, label: 'Contains a special character' },
        ].map((r) => (
          <Box key={r.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CheckIcon sx={{ fontSize: 14, color: r.ok ? '#10b981' : '#d1d5db' }} />
            <Typography sx={{ fontSize: '0.74rem', color: r.ok ? '#065f46' : '#9ca3af' }}>{r.label}</Typography>
          </Box>
        ))}
      </Box>

      <Button fullWidth variant="contained" onClick={submit} disabled={!allOk}
        sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', borderRadius: '8px', py: 1, fontWeight: 600 }}>
        Continue
      </Button>
      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </AuthFrame>
  );
};

// ============== Complete Profile ==============
export const FamilyCompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', gender: 'Male',
    address1: '', address2: '', city: '', zip: '',
  });

  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  return (
    <AuthFrame title="Complete Your Profile" subtitle="Tell us a bit about yourself to get started"
      onBack={() => navigate('/family/set-password')}>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f', mb: 1 }}>Personal Info</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
        <TextField label="First Name" size="small" fullWidth value={form.firstName}
          onChange={(e) => set('firstName', e.target.value)} />
        <TextField label="Last Name" size="small" fullWidth value={form.lastName}
          onChange={(e) => set('lastName', e.target.value)} />
        <TextField label="Phone Number" size="small" fullWidth value={form.phone}
          onChange={(e) => set('phone', e.target.value)} />
        <FormControl size="small" fullWidth>
          <Select value={form.gender} onChange={(e) => set('gender', e.target.value as string)}>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
            <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f', mb: 1 }}>Address Info</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 3 }}>
        <TextField label="Address Line 1" size="small" fullWidth value={form.address1}
          onChange={(e) => set('address1', e.target.value)} />
        <TextField label="Address Line 2" size="small" fullWidth value={form.address2}
          onChange={(e) => set('address2', e.target.value)} />
        <TextField label="City" size="small" fullWidth value={form.city}
          onChange={(e) => set('city', e.target.value)} />
        <TextField label="Zip" size="small" fullWidth value={form.zip}
          onChange={(e) => set('zip', e.target.value)} />
      </Box>
      <Button fullWidth variant="contained"
        onClick={() => navigate('/family/select-resident')}
        sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', borderRadius: '8px', py: 1, fontWeight: 600 }}>
        Continue
      </Button>
    </AuthFrame>
  );
};

// ============== Select Resident ==============
const initials = (f?: string, l?: string) =>
  `${(f || '?').charAt(0)}${(l || '?').charAt(0)}`.toUpperCase();

export const FamilySelectResidentPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Mock — Phase 2 will fetch via /api/v1/family/residents
  const residents = [
    { id: 1, firstName: 'Devon Michael', lastName: 'Lane', programType: 'ADH' as const, room: '204B' },
    { id: 2, firstName: 'Linda Michael', lastName: 'Lane', programType: 'ALF' as const, room: '305A' },
  ];

  const select = (residentId: number) => {
    setLoading(true);
    void residentId;
    setTimeout(() => navigate('/family/dashboard'), 200);
  };

  return (
    <AuthFrame title="Select a Resident" subtitle="Choose which family member you'd like to view first">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
        {residents.map((r) => (
          <Box key={r.id} sx={{
            p: 1.5, border: '1px solid #e5e7eb', borderRadius: '8px',
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: '#1e3a5f', fontSize: '0.85rem' }}>
              {initials(r.firstName, r.lastName)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>
                {r.firstName} {r.lastName}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                Room: {r.room} · {r.programType}
              </Typography>
            </Box>
            <Button size="small" variant="outlined" endIcon={<ArrowRightIcon />}
              disabled={loading}
              onClick={() => select(r.id)}
              sx={{ textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f', borderRadius: '999px' }}>
              View
            </Button>
          </Box>
        ))}
      </Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={20} />
        </Box>
      )}
    </AuthFrame>
  );
};
