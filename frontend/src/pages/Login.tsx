/**
 * Login Page - Matching Figma design with hero image and form layout
 */

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@demo.nemicare.local');
  const [password, setPassword] = useState('Admin@123456');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Redirect is handled by login function
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      {/* Left Side - Hero Image */}
      <Box
        sx={{
          flex: 1,
          backgroundImage: 'url(https://images.unsplash.com/photo-1576091160550-112173f31c77?w=800&h=1200&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: { xs: 'none', md: 'block' },
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
          },
        }}
      >
        {/* Optional: Overlay text at bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            color: '#fff',
            zIndex: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            A hassle-free portal for seamless care
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          padding: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '400px' }}>
          {/* Logo & Title */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: '#1e40af',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '20px',
                }}
              >
                ⚕️
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#000' }}>
                Nemi Care
              </Typography>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#000', mb: 1 }}>
              Sign in to your account
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              fullWidth
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f9fafb',
                },
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              fullWidth
              required
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f9fafb',
                },
              }}
            />

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: 'right' }}>
              <Link
                href="#"
                sx={{
                  fontSize: '0.875rem',
                  color: '#1e40af',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                backgroundColor: '#1e40af',
                py: 1.5,
                fontWeight: 600,
                textTransform: 'capitalize',
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: '#1e3a8a',
                },
              }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: '#fff' }} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
