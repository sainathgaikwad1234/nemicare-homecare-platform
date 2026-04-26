/**
 * Header Component - Dark blue top navigation bar matching Figma exactly
 * Selected tab uses outlined rectangle highlight, brand uses cursive Pacifico font.
 */

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Typography,
  Badge,
} from '@mui/material';
import {
  Home as HomeIcon,
  PersonSearch as LeadsIcon,
  PeopleAlt as ResidentsIcon,
  Schedule as ScheduleIcon,
  Description as DocumentsIcon,
  Badge as HRIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  HowToReg as AttendanceIcon,
  AttachMoney as LabelIcon,
  Settings as SettingsIcon,
  HelpOutline as HelpIcon,
  KeyboardArrowDown as ChevronDownIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navTabs = [
  { label: 'Home', path: '/dashboard', icon: <HomeIcon sx={{ fontSize: 17 }} /> },
  { label: 'Leads', path: '/leads', icon: <LeadsIcon sx={{ fontSize: 17 }} /> },
  { label: 'Residents', path: '/residents', icon: <ResidentsIcon sx={{ fontSize: 17 }} /> },
  { label: 'Schedule', path: '/scheduling', icon: <ScheduleIcon sx={{ fontSize: 17 }} /> },
  { label: 'HRMS', path: '/hrms', icon: <HRIcon sx={{ fontSize: 17 }} /> },
  { label: 'Documents', path: '/documents', icon: <DocumentsIcon sx={{ fontSize: 17 }} /> },
  { label: 'Attendance', path: '/attendance', icon: <AttendanceIcon sx={{ fontSize: 17 }} /> },
  { label: 'Label', path: '/billing', icon: <LabelIcon sx={{ fontSize: 17 }} /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon sx={{ fontSize: 17 }} /> },
];

// Brand mark — overlapping orange + blue petal shapes (matches Figma "Nemi Care" logo)
const NemiLogoMark: React.FC = () => (
  <Box sx={{ width: 40, height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg viewBox="0 0 40 40" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      {/* Large dark blue petal (top-left) */}
      <ellipse cx="14" cy="14" rx="11" ry="11" fill="#1e3a8a" />
      {/* Orange/gold accent petal (bottom-left, overlapping) */}
      <ellipse cx="11" cy="26" rx="7" ry="7" fill="#f97316" />
      {/* Yellow highlight bud (small) */}
      <ellipse cx="22" cy="22" rx="4" ry="4" fill="#fbbf24" />
      {/* Small dark blue dot (bottom-right) */}
      <ellipse cx="29" cy="30" rx="4" ry="4" fill="#1e40af" />
      {/* White cross/plus glint in the center to suggest "care" / medical */}
      <circle cx="18" cy="18" r="2" fill="#fff" opacity="0.9" />
    </svg>
  </Box>
);

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isActiveTab = (path: string) => location.pathname.startsWith(path);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: '#1e3a5f',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px !important',
          minHeight: '56px !important',
          gap: 0,
        }}
      >
        {/* Logo + brand */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mr: 2.5,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => navigate('/dashboard')}
        >
          <NemiLogoMark />
          <Typography
            sx={{
              fontFamily: '"Dancing Script", "Brush Script MT", cursive',
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: '26px',
              color: '#fff',
              whiteSpace: 'nowrap',
              letterSpacing: '0.5px',
              lineHeight: 1,
            }}
          >
            Nemi Care
          </Typography>
        </Box>

        {/* Navigation Tabs */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            overflow: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          {navTabs.map((tab) => {
            const active = isActiveTab(tab.path);
            return (
              <Box
                key={tab.path}
                onClick={() => navigate(tab.path)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  px: 1.4,
                  py: 0.75,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: active ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                  backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  transition: 'background-color 0.15s, border-color 0.15s',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <Box sx={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                  {tab.icon}
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Inter", "Roboto", sans-serif',
                    fontSize: '14px',
                    fontWeight: active ? 600 : 500,
                    color: '#fff',
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Right Side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 1.5 }}>
          <IconButton size="small" sx={{ color: '#fff', p: 0.6 }}>
            <SearchIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <IconButton size="small" sx={{ color: '#fff', p: 0.6 }}>
            <HelpIcon sx={{ fontSize: 20 }} />
          </IconButton>

          <IconButton size="small" sx={{ color: '#fff', p: 0.6 }}>
            <Badge
              variant="dot"
              color="error"
              sx={{ '& .MuiBadge-badge': { minWidth: 8, height: 8, top: 4, right: 4 } }}
            >
              <NotificationsIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>

          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              cursor: 'pointer',
              ml: 0.5,
              p: 0.25,
              borderRadius: '20px',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: '#f59e0b',
                fontSize: '12px',
                fontWeight: 600,
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              {getInitials(user?.firstName, user?.lastName)}
            </Avatar>
            <ChevronDownIcon sx={{ fontSize: 18, color: '#fff' }} />
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { mt: 0.5, minWidth: 200 } }}
          >
            <MenuItem disabled>
              <Typography sx={{ fontSize: '13px' }}>{user?.email}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="textSecondary">Role: {user?.role}</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1, fontSize: 16 }} />
              <Typography sx={{ fontSize: '13px' }}>Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
