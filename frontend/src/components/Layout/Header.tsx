/**
 * Header Component - Dark blue top navigation bar matching Figma exactly
 * Selected tab has pill/rounded-rect background highlight
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
  People as LeadsIcon,
  PersonOutline as ResidentsIcon,
  CalendarMonth as ScheduleIcon,
  Description as DocumentsIcon,
  Business as HRIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  CheckCircleOutline as AttendanceIcon,
  Label as LabelIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navTabs = [
  { label: 'Home', path: '/dashboard', icon: <HomeIcon sx={{ fontSize: 15 }} /> },
  { label: 'Co Leads', path: '/leads', icon: <LeadsIcon sx={{ fontSize: 15 }} /> },
  { label: 'Residents', path: '/residents', icon: <ResidentsIcon sx={{ fontSize: 15 }} /> },
  { label: 'Schedule', path: '/scheduling', icon: <ScheduleIcon sx={{ fontSize: 15 }} /> },
  { label: 'All HRMS', path: '/hr', icon: <HRIcon sx={{ fontSize: 15 }} /> },
  { label: 'Documents', path: '/documents', icon: <DocumentsIcon sx={{ fontSize: 15 }} /> },
  { label: 'Attendance', path: '/attendance', icon: <AttendanceIcon sx={{ fontSize: 15 }} /> },
  { label: 'Billing', path: '/billing', icon: <LabelIcon sx={{ fontSize: 15 }} /> },
  { label: 'Settings', path: '/settings', icon: <LabelIcon sx={{ fontSize: 15 }} /> },
];

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
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px !important',
          minHeight: '42px !important',
          gap: 0,
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            mr: 1.5,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => navigate('/dashboard')}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              backgroundColor: '#fff',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
            }}
          >
            🏥
          </Box>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '14px',
              color: '#fff',
              whiteSpace: 'nowrap',
              fontStyle: 'italic',
            }}
          >
            Nemi Care
          </Typography>
        </Box>

        {/* Navigation Tabs - Custom pills instead of MUI Tabs */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
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
                  gap: 0.4,
                  px: 1.2,
                  py: 0.5,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  backgroundColor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                <Box sx={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}>
                  {tab.icon}
                </Box>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  {tab.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Right Side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, ml: 1 }}>
          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.75)', p: 0.4 }}>
            <SearchIcon sx={{ fontSize: 18 }} />
          </IconButton>

          <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.75)', p: 0.4 }}>
            <Badge
              badgeContent={3}
              color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: '8px', minWidth: '14px', height: '14px', p: 0 } }}
            >
              <NotificationsIcon sx={{ fontSize: 18 }} />
            </Badge>
          </IconButton>

          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              cursor: 'pointer',
              ml: 0.25,
            }}
          >
            <Avatar
              sx={{
                width: 26,
                height: 26,
                backgroundColor: '#f59e0b',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {getInitials(user?.firstName, user?.lastName)}
            </Avatar>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { mt: 0.5, minWidth: 180 } }}
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
