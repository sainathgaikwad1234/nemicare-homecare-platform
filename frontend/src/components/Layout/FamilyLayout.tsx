import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Box, Typography, IconButton, Avatar, Badge, Menu, MenuItem, Chip } from '@mui/material';
import { familyService } from '../../services/family.service';
import {
  Dashboard as DashboardIcon,
  EventAvailable as AppointmentIcon,
  ChatBubbleOutline as ChatIcon,
  MedicalServices as MedicationIcon,
  MonitorHeart as VitalsIcon,
  Description as DocumentsIcon,
  Receipt as StatementIcon,
  Payments as PaymentIcon,
  History as HistoryIcon,
  WorkOutline as InventoryIcon,
  ConfirmationNumber as TicketsIcon,
  ReportProblem as IncidentIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  AutoAwesome as SparkleIcon,
  KeyboardArrowDown as ChevronDownIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_WIDTH = 192;

export interface FamilyResident {
  id: number;
  firstName: string;
  lastName: string;
  programType: 'ADH' | 'ALF';
  relation: string;
  facility: string;
  room: string;
  profilePictureUrl?: string | null;
  needsAttention?: boolean;
}

interface FamilyContextValue {
  residents: FamilyResident[];
  selectedResident: FamilyResident | null;
  setSelectedResidentId: (id: number) => void;
}

// Mock residents — replace with API call in Phase 2
const MOCK_RESIDENTS: FamilyResident[] = [
  { id: 1, firstName: 'Devon Michael', lastName: 'Lane', programType: 'ADH', relation: 'Brother', facility: 'CareBridge Home Health', room: '204B' },
  { id: 2, firstName: 'Linda Michael', lastName: 'Lane', programType: 'ALF', relation: 'Sister', facility: 'CareBridge Home Health', room: '204B', needsAttention: true },
];

const FamilyContext = createContext<FamilyContextValue | null>(null);

export const useFamily = () => {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyLayout');
  return ctx;
};

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  group: 'Home' | 'Schedule' | 'Communication' | 'Clinical' | 'Billing' | 'Other';
  badge?: number;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     path: '/family/dashboard',     icon: <DashboardIcon fontSize="small" />,    group: 'Home' },
  { label: 'Appointments',  path: '/family/appointments',  icon: <AppointmentIcon fontSize="small" />,  group: 'Schedule' },
  { label: 'Chat',          path: '/family/chat',          icon: <ChatIcon fontSize="small" />,         group: 'Communication', badge: 4 },
  { label: 'Medication',    path: '/family/medication',    icon: <MedicationIcon fontSize="small" />,   group: 'Clinical' },
  { label: 'Vitals & Allergies', path: '/family/vitals',   icon: <VitalsIcon fontSize="small" />,       group: 'Clinical' },
  { label: 'Documents',     path: '/family/documents',     icon: <DocumentsIcon fontSize="small" />,    group: 'Clinical' },
  { label: 'Statement',     path: '/family/statement',     icon: <StatementIcon fontSize="small" />,    group: 'Billing' },
  { label: 'Payment',       path: '/family/payment',       icon: <PaymentIcon fontSize="small" />,      group: 'Billing' },
  { label: 'History',       path: '/family/history',       icon: <HistoryIcon fontSize="small" />,      group: 'Billing' },
  { label: 'Inventory',     path: '/family/inventory',     icon: <InventoryIcon fontSize="small" />,    group: 'Other' },
  { label: 'Tickets',       path: '/family/tickets',       icon: <TicketsIcon fontSize="small" />,      group: 'Other' },
  { label: 'Incident',      path: '/family/incident',      icon: <IncidentIcon fontSize="small" />,     group: 'Other' },
  { label: 'Notifications', path: '/family/notifications', icon: <NotificationsIcon fontSize="small" />, group: 'Other' },
];

const GROUPS: Array<NavItem['group']> = ['Home', 'Schedule', 'Communication', 'Clinical', 'Billing', 'Other'];

const initials = (f?: string, l?: string) =>
  `${(f || '?').charAt(0)}${(l || '?').charAt(0)}`.toUpperCase();

export const FamilyLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [residents, setResidents] = useState<FamilyResident[]>(MOCK_RESIDENTS);
  const [selectedId, setSelectedId] = useState<number>(MOCK_RESIDENTS[0].id);
  const [residentMenuEl, setResidentMenuEl] = useState<null | HTMLElement>(null);
  const [profileMenuEl, setProfileMenuEl] = useState<null | HTMLElement>(null);

  // Fetch residents from API; fall back to mock data on error so UI is reviewable without seed data
  useEffect(() => {
    let cancelled = false;
    familyService.listResidents().then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: FamilyResident[] = res.data.map((r) => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          programType: r.programType,
          relation: r.relation,
          facility: r.facility,
          room: r.room,
        }));
        setResidents(mapped);
        setSelectedId(mapped[0].id);
      }
    }).catch(() => { /* keep mock */ });
    return () => { cancelled = true; };
  }, []);

  const selectedResident = useMemo(
    () => residents.find((r) => r.id === selectedId) || residents[0] || null,
    [residents, selectedId]
  );

  const ctxValue = useMemo<FamilyContextValue>(() => ({
    residents,
    selectedResident,
    setSelectedResidentId: setSelectedId,
  }), [residents, selectedResident]);

  const currentItem = NAV_ITEMS.find((it) => location.pathname.startsWith(it.path));
  const pageTitle = currentItem?.label || 'Family Portal';
  const showResidentDropdown = currentItem && currentItem.path !== '/family/dashboard';

  return (
    <FamilyContext.Provider value={ctxValue}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f6fa' }}>
        {/* Top header (full width) */}
        <Box sx={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 56,
          bgcolor: '#fff', borderBottom: '1px solid #e5e7eb', zIndex: 10,
          display: 'flex', alignItems: 'center', px: 2.5,
        }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: SIDEBAR_WIDTH - 16, flexShrink: 0, cursor: 'pointer' }}
            onClick={() => navigate('/family/dashboard')}>
            <Box component="img" src="/nemicare-logo.png" alt="Nemi Care"
              sx={{ width: 36, height: 36, objectFit: 'contain' }} />
            <Typography sx={{
              fontFamily: '"Dancing Script", cursive', fontWeight: 700, fontStyle: 'italic',
              fontSize: '22px', color: '#1e3a5f', letterSpacing: '0.5px',
            }}>
              Nemi Care
            </Typography>
          </Box>

          {/* Page title + resident dropdown */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, ml: 2 }}>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a5f' }}>
              {pageTitle}{showResidentDropdown && selectedResident ? ' - ' : ''}
            </Typography>
            {showResidentDropdown && selectedResident && (
              <Box
                onClick={(e) => setResidentMenuEl(e.currentTarget)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1.25, py: 0.5, borderRadius: '999px', border: '1px solid #e5e7eb',
                  cursor: 'pointer', bgcolor: '#fff',
                  '&:hover': { bgcolor: '#f9fafb' },
                }}
              >
                <Avatar src={selectedResident.profilePictureUrl || undefined}
                  sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: '#1e3a5f' }}>
                  {initials(selectedResident.firstName, selectedResident.lastName)}
                </Avatar>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                  {selectedResident.firstName.split(' ')[0]} {selectedResident.lastName}
                </Typography>
                <ChevronDownIcon sx={{ fontSize: 16, color: '#6b7280' }} />
              </Box>
            )}
            <Menu
              anchorEl={residentMenuEl}
              open={Boolean(residentMenuEl)}
              onClose={() => setResidentMenuEl(null)}
              PaperProps={{ sx: { mt: 0.5, minWidth: 220 } }}
            >
              {residents.map((r) => (
                <MenuItem key={r.id} selected={r.id === selectedId}
                  onClick={() => { setSelectedId(r.id); setResidentMenuEl(null); }}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', mr: 1, bgcolor: '#1e3a5f' }}>
                    {initials(r.firstName, r.lastName)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.firstName} {r.lastName}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{r.programType} · {r.room}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Right actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small"><SearchIcon fontSize="small" /></IconButton>
            <IconButton size="small"><SparkleIcon fontSize="small" sx={{ color: '#a78bfa' }} /></IconButton>
            <IconButton size="small">
              <Badge variant="dot" color="error">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
            <Avatar
              onClick={(e) => setProfileMenuEl(e.currentTarget)}
              src={(user as any)?.profilePictureUrl || undefined}
              sx={{ width: 32, height: 32, ml: 0.5, cursor: 'pointer', bgcolor: '#1e3a5f', fontSize: '0.78rem' }}
            >
              {initials(user?.firstName, user?.lastName)}
            </Avatar>
            <Menu
              anchorEl={profileMenuEl}
              open={Boolean(profileMenuEl)}
              onClose={() => setProfileMenuEl(null)}
              PaperProps={{ sx: { mt: 0.5, minWidth: 200 } }}
            >
              <MenuItem disabled>
                <Typography sx={{ fontSize: '0.78rem' }}>{user?.email}</Typography>
              </MenuItem>
              <MenuItem onClick={() => { setProfileMenuEl(null); navigate('/family/profile'); }}>
                Your Profile
              </MenuItem>
              <MenuItem onClick={async () => { setProfileMenuEl(null); await logout(); navigate('/family/login'); }}>
                <LogoutIcon sx={{ fontSize: 16, mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Sidebar */}
        <Box sx={{
          width: SIDEBAR_WIDTH, flexShrink: 0,
          position: 'fixed', top: 56, bottom: 0, left: 0,
          bgcolor: '#fff', borderRight: '1px solid #e5e7eb',
          overflowY: 'auto', py: 2, px: 1.5,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          <Box>
            {GROUPS.map((g) => {
              const items = NAV_ITEMS.filter((it) => it.group === g);
              if (items.length === 0) return null;
              return (
                <Box key={g} sx={{ mb: 1.5 }}>
                  <Typography sx={{
                    fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500,
                    px: 1, mb: 0.5, textTransform: 'none',
                  }}>
                    {g}
                  </Typography>
                  {items.map((it) => {
                    const active = location.pathname.startsWith(it.path);
                    return (
                      <Box key={it.path}
                        onClick={() => navigate(it.path)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.85,
                          borderRadius: '6px', cursor: 'pointer', mb: 0.25,
                          color: active ? '#1e3a5f' : '#6b7280',
                          bgcolor: active ? '#eff4fb' : 'transparent',
                          fontWeight: active ? 600 : 500,
                          '&:hover': { bgcolor: active ? '#eff4fb' : '#f5f6fa', color: '#1e3a5f' },
                        }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>{it.icon}</Box>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 'inherit', flex: 1 }}>
                          {it.label}
                        </Typography>
                        {it.badge && (
                          <Chip label={it.badge} size="small"
                            sx={{ bgcolor: '#dbeafe', color: '#1e3a5f', height: 18, minWidth: 22, fontSize: '0.65rem', fontWeight: 600 }} />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Box>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.75,
            borderTop: '1px solid #f3f4f6', mt: 1,
          }}>
            <Box component="img" src="/hipaa-badge.svg" alt=""
              sx={{ width: 18, height: 18, opacity: 0.6 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <Typography sx={{ fontSize: '0.65rem', color: '#9ca3af' }}>
              Protected by HIPAA Compliant
            </Typography>
          </Box>
        </Box>

        {/* Main */}
        <Box sx={{
          flex: 1, ml: `${SIDEBAR_WIDTH}px`, mt: '56px',
          minHeight: 'calc(100vh - 56px)', minWidth: 0,
        }}>
          {children}
        </Box>
      </Box>
    </FamilyContext.Provider>
  );
};

export default FamilyLayout;
