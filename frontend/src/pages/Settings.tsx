import React from 'react';
import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import {
  Settings as SettingsIcon,
  Business as CompanyIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Group as TeamIcon,
  Payments as PayrollIcon,
  Description as TemplatesIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SettingsCard {
  title: string;
  description: string;
  icon: JSX.Element;
  path: string;
  permission?: string;
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const cards: SettingsCard[] = [
    {
      title: 'HR Admin Console',
      description: 'Manage roles, permissions, leave types, and policies',
      icon: <TeamIcon />,
      path: '/hrms/console',
      permission: 'employees.create',
    },
    {
      title: 'Payroll Settings',
      description: 'OT thresholds, differentials, pay periods, providers',
      icon: <PayrollIcon />,
      path: '/hrms/console',
      permission: 'employees.create',
    },
    {
      title: 'System Jobs',
      description: 'Cron schedules, manual triggers, job history',
      icon: <SettingsIcon />,
      path: '/hrms/system-jobs',
      permission: 'employees.create',
    },
    {
      title: 'My Profile',
      description: 'Personal info, contact details, password',
      icon: <CompanyIcon />,
      path: '/hrms/me/profile',
    },
    {
      title: 'Notifications',
      description: 'Email and in-app notification preferences',
      icon: <NotificationsIcon />,
      path: '/hrms/me/profile',
    },
    {
      title: 'Document Templates',
      description: 'Onboarding and discharge document templates',
      icon: <TemplatesIcon />,
      path: '/hrms/documents',
    },
    {
      title: 'Security',
      description: 'Password policy, 2FA, session timeouts',
      icon: <SecurityIcon />,
      path: '/hrms/me/profile',
    },
  ];

  const visibleCards = cards.filter((c) => !c.permission || hasPermission(c.permission));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SettingsIcon sx={{ color: '#1e3a5f' }} />
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e3a5f' }}>Settings</Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {visibleCards.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card.title}>
                <Paper
                  onClick={() => navigate(card.path)}
                  sx={{
                    p: 2.5,
                    border: '1px solid #e5e7eb',
                    boxShadow: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    '&:hover': { borderColor: '#1e3a5f', bgcolor: '#f9fafb' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '8px', bgcolor: '#eff4fb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f',
                    }}>
                      {card.icon}
                    </Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e3a5f' }}>
                      {card.title}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {card.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          {visibleCards.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, color: '#6b7280' }}>
              <Typography sx={{ fontSize: '0.9rem', mb: 2 }}>No settings available for your role.</Typography>
              <Button variant="outlined" onClick={() => navigate('/hrms/me/profile')}
                sx={{ textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f' }}>
                Go to My Profile
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
