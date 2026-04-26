import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Home as HomeIcon,
  PeopleAlt as EmployeesIcon,
  PersonAdd as OnboardingIcon,
  CalendarMonth as ShiftsIcon,
  EventBusy as LeavesIcon,
  Payments as PayrollIcon,
  ChatBubbleOutline as ChatIcon,
  StarBorder as ReviewsIcon,
  DescriptionOutlined as DocumentsIcon,
  ExitToApp as ExitsIcon,
  BarChart as ReportsIcon,
  Settings as SettingsIcon,
  AccessTime as TimecardIcon,
  Checklist as TasksIcon,
  Person as ProfileIcon,
  TrendingUp as ProgressIcon,
  Schedule as JobsIcon,
  SwapHoriz as ShiftChangeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_WIDTH = 76;

type NavItem = { label: string; path: string; icon: JSX.Element };

const HR_ADMIN_ITEMS: NavItem[] = [
  { label: 'Home', path: '/hrms/dashboard', icon: <HomeIcon fontSize="small" /> },
  { label: 'Employees', path: '/hrms/employees', icon: <EmployeesIcon fontSize="small" /> },
  { label: 'Onboarding', path: '/hrms/onboarding', icon: <OnboardingIcon fontSize="small" /> },
  { label: 'Shifts', path: '/hrms/shifts', icon: <ShiftsIcon fontSize="small" /> },
  { label: 'Shift Changes', path: '/hrms/shift-changes', icon: <ShiftChangeIcon fontSize="small" /> },
  { label: 'Leaves', path: '/hrms/leaves', icon: <LeavesIcon fontSize="small" /> },
  { label: 'Timecards', path: '/hrms/timecards', icon: <TimecardIcon fontSize="small" /> },
  { label: 'Payroll', path: '/hrms/payroll', icon: <PayrollIcon fontSize="small" /> },
  { label: 'Messages', path: '/hrms/messages', icon: <ChatIcon fontSize="small" /> },
  { label: 'Reviews', path: '/hrms/reviews', icon: <ReviewsIcon fontSize="small" /> },
  { label: 'Documents', path: '/hrms/documents', icon: <DocumentsIcon fontSize="small" /> },
  { label: 'Exits', path: '/hrms/exits', icon: <ExitsIcon fontSize="small" /> },
  { label: 'Reports', path: '/hrms/reports', icon: <ReportsIcon fontSize="small" /> },
  { label: 'System Jobs', path: '/hrms/system-jobs', icon: <JobsIcon fontSize="small" /> },
  { label: 'Console', path: '/hrms/console', icon: <SettingsIcon fontSize="small" /> },
];

const EMPLOYEE_ITEMS: NavItem[] = [
  { label: 'Home', path: '/hrms/me/home', icon: <HomeIcon fontSize="small" /> },
  { label: 'My Shifts', path: '/hrms/me/shifts', icon: <ShiftsIcon fontSize="small" /> },
  { label: 'Leaves', path: '/hrms/me/leaves', icon: <LeavesIcon fontSize="small" /> },
  { label: 'Tasks', path: '/hrms/me/tasks', icon: <TasksIcon fontSize="small" /> },
  { label: 'Timecards', path: '/hrms/me/timecards', icon: <TimecardIcon fontSize="small" /> },
  { label: 'My Reviews', path: '/hrms/me/reviews', icon: <ReviewsIcon fontSize="small" /> },
  { label: 'Messages', path: '/hrms/me/messages', icon: <ChatIcon fontSize="small" /> },
  { label: 'Notices', path: '/hrms/me/notices', icon: <ReportsIcon fontSize="small" /> },
  { label: 'Documents', path: '/hrms/me/documents', icon: <DocumentsIcon fontSize="small" /> },
  { label: 'Profile', path: '/hrms/me/profile', icon: <ProfileIcon fontSize="small" /> },
];

// Supervisors approve timecards & manage shifts but don't run payroll or onboard
const SUPERVISOR_ITEMS: NavItem[] = [
  { label: 'Home', path: '/hrms/supervisor-dashboard', icon: <HomeIcon fontSize="small" /> },
  { label: 'Employees', path: '/hrms/employees', icon: <EmployeesIcon fontSize="small" /> },
  { label: 'Shifts', path: '/hrms/shifts', icon: <ShiftsIcon fontSize="small" /> },
  { label: 'Shift Changes', path: '/hrms/shift-changes', icon: <ShiftChangeIcon fontSize="small" /> },
  { label: 'Leaves', path: '/hrms/leaves', icon: <LeavesIcon fontSize="small" /> },
  { label: 'Timecards', path: '/hrms/timecards', icon: <TimecardIcon fontSize="small" /> },
  { label: 'Reviews', path: '/hrms/reviews', icon: <ReviewsIcon fontSize="small" /> },
  { label: 'Messages', path: '/hrms/messages', icon: <ChatIcon fontSize="small" /> },
];

const settingsItem: NavItem = { label: 'Settings', path: '/hrms/settings', icon: <SettingsIcon fontSize="small" /> };

const getItemsForRole = (userRole?: string): NavItem[] => {
  if (userRole === 'EMPLOYEE') return EMPLOYEE_ITEMS;
  if (userRole === 'SUPERVISOR') return SUPERVISOR_ITEMS;
  return HR_ADMIN_ITEMS;
};

export const HrmsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  // Determine role from permissions: HR Admins have employees.create; Employees don't.
  const inferredRole: 'HR_ADMIN' | 'SUPERVISOR' | 'EMPLOYEE' =
    hasPermission('employees.create') ? 'HR_ADMIN'
    : hasPermission('shifts.create') ? 'SUPERVISOR'
    : 'EMPLOYEE';
  const userRole = (user as any)?.userRole || (user as any)?.hrmsRole || inferredRole;
  const items = getItemsForRole(userRole);

  const isActive = (path: string) => {
    // For routes that have child paths (e.g. /hrms/employees/:id), match prefix
    if (['/hrms/employees', '/hrms/onboarding', '/hrms/me/shifts', '/hrms/me/leaves', '/hrms/me/profile'].includes(path)) {
      return location.pathname.startsWith(path);
    }
    return location.pathname === path;
  };

  const SidebarItem: React.FC<{ item: typeof settingsItem }> = ({ item }) => {
    const active = isActive(item.path);
    return (
      <Tooltip title={item.label} placement="right" arrow>
        <Box
          onClick={() => navigate(item.path)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.5,
            py: 1.25,
            cursor: 'pointer',
            color: active ? '#1e3a5f' : '#6b7280',
            bgcolor: active ? '#eff4fb' : 'transparent',
            borderLeft: active ? '3px solid #1e3a5f' : '3px solid transparent',
            transition: 'all 120ms ease',
            '&:hover': { bgcolor: active ? '#eff4fb' : '#f5f6fa', color: '#1e3a5f' },
          }}
        >
          <IconButton size="small" sx={{ color: 'inherit', p: 0.5 }} disableRipple>
            {item.icon}
          </IconButton>
          <Box sx={{ fontSize: '0.65rem', fontWeight: active ? 600 : 500, lineHeight: 1.1 }}>
            {item.label}
          </Box>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 56px)', bgcolor: '#fff' }}>
      {/* Icon-only sidebar */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          borderRight: '1px solid #e5e7eb',
          bgcolor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          py: 1,
          position: 'sticky',
          top: 56,
          alignSelf: 'flex-start',
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
        }}
      >
        <Box>
          {items.map((it) => <SidebarItem key={it.path} item={it} />)}
        </Box>
        <Box>
          <SidebarItem item={settingsItem} />
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, minWidth: 0, bgcolor: '#f5f6fa' }}>
        {children}
      </Box>
    </Box>
  );
};

export default HrmsLayout;
