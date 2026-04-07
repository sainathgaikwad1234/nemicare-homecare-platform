/**
 * Sidebar Component - Navigation menu with links to main features
 * Pattern: Responsive sidebar that collapses on mobile
 */

import React from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  Home as HomeIcon,
  People as PeopleIcon,
  Person as ResidentIcon,
  Event as ScheduleIcon,
  Business as HRMSIcon,
  Description as DocumentsIcon,
  CheckCircle as AttendanceIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiredPermission?: string;
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ open = true, onClose, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Home',
      path: '/dashboard',
      icon: <HomeIcon />,
    },
    {
      label: 'Leads',
      path: '/leads',
      icon: <PeopleIcon />,
      requiredPermission: 'VIEW_LEADS',
    },
    {
      label: 'Residents',
      path: '/residents',
      icon: <ResidentIcon />,
      requiredPermission: 'VIEW_RESIDENTS',
    },
    {
      label: 'Schedule',
      path: '/schedule',
      icon: <ScheduleIcon />,
    },
    {
      label: 'HRMS',
      path: '/hrms',
      icon: <HRMSIcon />,
    },
    {
      label: 'Documents',
      path: '/documents',
      icon: <DocumentsIcon />,
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: <AttendanceIcon />,
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.requiredPermission || hasPermission(item.requiredPermission)
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 2 }}>
      {/* Navigation Items */}
      <List sx={{ flex: 1 }}>
        {filteredNavItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => {
                navigate(item.path);
                if (isMobile && onClose) {
                  onClose();
                }
              }}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#e3f2fd',
                  borderLeft: '4px solid #1976d2',
                  color: '#1976d2',
                  fontWeight: 600,
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Settings Section */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              navigate('/settings');
              if (isMobile && onClose) {
                onClose();
              }
            }}
            selected={location.pathname === '/settings'}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={open}
      onClose={onClose}
      sx={{
        width: 250,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 250,
          boxSizing: 'border-box',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e0e0e0',
          mt: 8,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};
