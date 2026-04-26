import React, { useState } from 'react';
import {
  Box, Typography, Paper, Avatar, Chip, Button, IconButton,
} from '@mui/material';
import {
  Groups as MembersIcon,
  ErrorOutline as AlertIcon,
  ConfirmationNumber as TicketsIcon,
  EventAvailable as VisitIcon,
  Add as AddIcon,
  ChatBubbleOutline as ChatIcon,
  ChevronLeft, ChevronRight,
  ReportProblem as IncidentIcon,
} from '@mui/icons-material';
import { useFamily } from '../../components/Layout/FamilyLayout';
import { useNavigate } from 'react-router-dom';
import { RequestMeetDialog, CreateTicketDialog } from './FamilyDialogs';
import { familyService, FamilyDashboardDto } from '../../services/family.service';
import { useEffect } from 'react';

const initials = (f?: string, l?: string) =>
  `${(f || '?').charAt(0)}${(l || '?').charAt(0)}`.toUpperCase();

const FREQUENCY_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ACTIVE_FREQ = [false, false, true, true, true, false, true]; // example: T,W,T,S

// Mock attendance data — keyed by day of month
const ATTENDANCE: Record<number, 'P' | 'A' | null> = {
  1: 'P', 2: 'P', 3: 'P', 4: 'P', 5: 'A', 6: 'P', 7: 'P', 8: 'A',
};

// Mock incident
const MOCK_INCIDENTS = [
  { id: 1, title: 'Medication Delay', severity: 'Major', date: '28 Mar 2026', time: '02:45 PM', location: 'Dining Hall' },
];

const fmtIncDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const FamilyDashboardPage: React.FC = () => {
  const { residents, selectedResident, setSelectedResidentId } = useFamily();
  const navigate = useNavigate();
  const [calMonth] = useState('Mar 2026');
  const [meetOpen, setMeetOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [apiData, setApiData] = useState<FamilyDashboardDto | null>(null);

  // Fetch real dashboard data when selectedResident changes
  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    familyService.getDashboard(selectedResident.id).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setApiData(res.data);
    }).catch(() => { /* keep mock */ });
    return () => { cancelled = true; };
  }, [selectedResident?.id]);

  if (!selectedResident) return null;

  // Use API data when available, fall back to display defaults
  const incidents = apiData?.recentIncidents.length
    ? apiData.recentIncidents.map((i) => ({
        id: i.id, title: i.title, severity: i.severity,
        date: fmtIncDate(i.date), time: i.time || '—', location: i.location || '—',
      }))
    : MOCK_INCIDENTS;
  const openTickets = apiData?.kpis.openTickets ?? 2;
  const alerts = apiData?.kpis.alerts ?? 1;
  const painLabel = apiData?.painScale?.label || 'Comfortable';
  const painValue = apiData?.painScale ? `${apiData.painScale.level}/10` : '2/10';
  const caseManager = apiData?.resident.caseManager || 'Robert Fox';
  const caseManagerPhone = apiData?.resident.caseManagerPhone || '(270) 555-0117';
  const billingType = apiData?.resident.billingType || 'Medicaid';

  return (
    <Box sx={{ p: 3 }}>
      {/* KPI Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
        <KpiCard icon={<MembersIcon sx={{ fontSize: 18 }} />} label="Members" value={residents.length} />
        <KpiCard icon={<AlertIcon sx={{ fontSize: 18, color: '#f59e0b' }} />} label="Active Alerts" value={alerts} />
        <KpiCard icon={<TicketsIcon sx={{ fontSize: 18 }} />} label="Open Tickets" value={openTickets} />
        <KpiCard icon={<VisitIcon sx={{ fontSize: 18 }} />} label="Next Visit" value="03/28/2026" valueIsText />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 2 }}>
        {/* Left column */}
        <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          {/* Member toggle */}
          <Box sx={{
            p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #f3f4f6',
          }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Selected Member:</Typography>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {residents.map((r) => {
                const active = r.id === selectedResident.id;
                return (
                  <Box key={r.id}
                    onClick={() => setSelectedResidentId(r.id)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.75,
                      px: 1.25, py: 0.4, borderRadius: '999px',
                      border: active ? '1px solid #1e3a5f' : '1px solid #e5e7eb',
                      bgcolor: '#fff', cursor: 'pointer',
                      '&:hover': { bgcolor: '#f9fafb' },
                    }}>
                    <Avatar src={r.profilePictureUrl || undefined}
                      sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: '#1e3a5f' }}>
                      {initials(r.firstName, r.lastName)}
                    </Avatar>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: active ? '#1e3a5f' : '#374151' }}>
                      {r.firstName.split(' ')[0]} {r.lastName}
                    </Typography>
                    {r.needsAttention && (
                      <AlertIcon sx={{ fontSize: 14, color: '#dc2626' }} />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Resident hero */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 64, height: 64, fontSize: '1.4rem', bgcolor: '#1e3a5f' }}>
                {initials(selectedResident.firstName, selectedResident.lastName)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a5f' }}>
                    {selectedResident.firstName} {selectedResident.lastName}
                  </Typography>
                  <Chip label={selectedResident.programType} size="small"
                    sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600, height: 20, fontSize: '0.68rem' }} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                  <Field label="Relation" value={selectedResident.relation} />
                  <Field label="Facility" value={selectedResident.facility} />
                  <Field label="Room" value={selectedResident.room} />
                  <Field label="Transportation" value="Verida" />
                </Box>
              </Box>
            </Box>

            {/* Progress bar */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>Overall Progress:</Typography>
                <Chip label="Improving" size="small"
                  sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 600, height: 18, fontSize: '0.65rem' }} />
              </Box>
              <Box sx={{ position: 'relative', height: 6, bgcolor: '#f3f4f6', borderRadius: 3, mb: 0.5 }}>
                <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '11%', bgcolor: '#1e3a5f', borderRadius: 3 }} />
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', textAlign: 'right' }}>10/90</Typography>
            </Box>

            {/* Enrollment row */}
            <Box sx={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2,
              p: 1.5, border: '1px solid #f3f4f6', borderRadius: 1, mb: 1.5, bgcolor: '#fafbfc',
            }}>
              <Field label="Days Remaining" value={apiData?.kpis.daysRemaining != null ? `${apiData.kpis.daysRemaining} days` : '80 days'} />
              <Field label="Admission Date" value={apiData?.resident.admissionDate ? new Date(apiData.resident.admissionDate).toLocaleDateString() : '02/12/2026'} />
              <Field label="Expected Discharge" value={apiData?.resident.expectedDischarge ? new Date(apiData.resident.expectedDischarge).toLocaleDateString() : '06/12/2026'} />
              <Field label="Payment" value={billingType} />
            </Box>

            {/* Verida row */}
            <Box sx={{
              display: 'grid', gridTemplateColumns: 'auto repeat(3, 1fr)', gap: 2,
              p: 1.5, border: '1px solid #fed7aa', borderRadius: 1, mb: 1.5, bgcolor: '#fff7ed',
              alignItems: 'center',
            }}>
              <Chip label="VERIDA" size="small"
                sx={{ bgcolor: '#fed7aa', color: '#9a3412', fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
              <Field label="Admission Date" value="02/12/2026" />
              <Field label="Expiry Date" value="06/12/2026" />
              <Field label="Standing Order" value="Active" valueColor="#065f46" />
            </Box>

            {/* Case manager row */}
            <Box sx={{
              p: 1.5, border: '1px solid #f3f4f6', borderRadius: 1, mb: 2, bgcolor: '#fafbfc',
              display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap',
            }}>
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>Case Manager:</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e3a5f' }}>{caseManager}</Typography>
              </Box>
              <Box sx={{ width: 4, height: 4, bgcolor: '#d1d5db', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>Case Manager Contact:</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e3a5f' }}>{caseManagerPhone}</Typography>
              </Box>
              <Box sx={{ width: 4, height: 4, bgcolor: '#d1d5db', borderRadius: '50%' }} />
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>Case Agency:</Typography>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e3a5f' }}>Binford Ltd.</Typography>
              </Box>
            </Box>

            {/* Attendance Calendar */}
            <Paper sx={{ p: 1.5, border: '1px solid #f3f4f6', boxShadow: 'none', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>Attendance</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <IconButton size="small"><ChevronLeft fontSize="small" /></IconButton>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, minWidth: 70, textAlign: 'center' }}>{calMonth}</Typography>
                  <IconButton size="small"><ChevronRight fontSize="small" /></IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                  <Typography key={d} sx={{ fontSize: '0.7rem', fontWeight: 500, color: '#6b7280', textAlign: 'center', py: 0.5 }}>
                    {d}
                  </Typography>
                ))}
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
                  const att = ATTENDANCE[day] || null;
                  return (
                    <Box key={day} sx={{
                      aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 1, position: 'relative',
                      bgcolor: day === 9 ? '#f3f4f6' : 'transparent',
                    }}>
                      {att && (
                        <Box sx={{
                          position: 'absolute', top: 4,
                          width: 16, height: 16, borderRadius: '50%',
                          bgcolor: att === 'P' ? '#d1fae5' : '#fee2e2',
                          color: att === 'P' ? '#065f46' : '#991b1b',
                          fontSize: '0.6rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {att}
                        </Box>
                      )}
                      <Typography sx={{ fontSize: '0.78rem', color: '#374151', mt: att ? 1.5 : 0 }}>{day}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>
        </Paper>

        {/* Right column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Pain Scale */}
          <Paper sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Pain Scale</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>{painLabel}</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>{painValue}</Typography>
              <Typography sx={{ fontSize: '1.1rem' }}>{painLabel === 'Comfortable' ? '😊' : painLabel === 'Mild' ? '🙂' : painLabel === 'Moderate' ? '😐' : painLabel === 'Severe' ? '😣' : '😖'}</Typography>
            </Box>
          </Paper>

          {/* Frequency */}
          <Paper sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>Frequency</Typography>
            <Box sx={{ display: 'flex', gap: 0.4 }}>
              {FREQUENCY_DAYS.map((d, i) => (
                <Box key={i} sx={{
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: ACTIVE_FREQ[i] ? '#dbeafe' : 'transparent',
                  border: ACTIVE_FREQ[i] ? '1px solid #1e3a5f' : '1px solid #e5e7eb',
                  color: ACTIVE_FREQ[i] ? '#1e3a5f' : '#9ca3af',
                  fontSize: '0.65rem', fontWeight: 600,
                }}>{d}</Box>
              ))}
            </Box>
          </Paper>

          {/* Alerts */}
          <SectionPaper title="Alerts">
            <Box sx={{ py: 4, textAlign: 'center', color: '#9ca3af' }}>
              <Typography sx={{ fontSize: '0.85rem' }}>No Alerts</Typography>
            </Box>
          </SectionPaper>

          {/* Incidents */}
          <SectionPaper title="Incidents" count={incidents.length} onViewAll={() => navigate('/family/incident')}>
            {incidents.map((i) => (
              <Box key={i.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.75 }}>
                <IncidentIcon sx={{ fontSize: 16, color: '#dc2626', mt: 0.25 }} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>{i.title}</Typography>
                    <Chip label={i.severity} size="small"
                      sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 600, height: 18, fontSize: '0.62rem' }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                    📅 {i.date} · 🕐 {i.time} · 📍 {i.location}
                  </Typography>
                </Box>
              </Box>
            ))}
          </SectionPaper>

          {/* Tickets */}
          <SectionPaper title="Tickets">
            <Box sx={{ py: 4, textAlign: 'center', color: '#9ca3af' }}>
              <Typography sx={{ fontSize: '0.85rem' }}>No Tickets</Typography>
            </Box>
          </SectionPaper>

          {/* Quick Actions */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Button startIcon={<AddIcon />} variant="outlined"
              onClick={() => setMeetOpen(true)}
              sx={{
                textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f',
                '&:hover': { bgcolor: '#eff4fb', borderColor: '#1e3a5f' },
              }}>
              Request Meet
            </Button>
            <Button startIcon={<ChatIcon />} variant="outlined"
              onClick={() => setTicketOpen(true)}
              sx={{
                textTransform: 'none', borderColor: '#1e3a5f', color: '#1e3a5f',
                '&:hover': { bgcolor: '#eff4fb', borderColor: '#1e3a5f' },
              }}>
              Create Ticket
            </Button>
          </Box>
        </Box>
      </Box>

      <RequestMeetDialog
        open={meetOpen} onClose={() => setMeetOpen(false)}
        residents={residents}
        defaultResidentId={selectedResident.id}
        onSubmit={(data) => {
          console.log('Request Meet:', data);
          // Phase 2: POST /api/v1/family/appointment-requests
        }}
      />
      <CreateTicketDialog
        open={ticketOpen} onClose={() => setTicketOpen(false)}
        residentId={selectedResident.id}
        onSubmit={async (data) => {
          try {
            await familyService.createTicket(data.residentId, {
              title: data.title, category: data.category,
              priority: data.priority, description: data.description,
            });
          } catch (e) { /* swallow — page will retry on next load */ }
          navigate('/family/tickets');
        }}
      />
    </Box>
  );
};

const KpiCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; valueIsText?: boolean }> = ({ icon, label, value, valueIsText }) => (
  <Paper sx={{
    p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#1e3a5f' }}>
      {icon}
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 500, color: '#374151' }}>{label}</Typography>
    </Box>
    <Typography sx={{ fontSize: valueIsText ? '0.85rem' : '1rem', fontWeight: 700, color: '#1e3a5f' }}>
      {value}
    </Typography>
  </Paper>
);

const Field: React.FC<{ label: string; value: string; valueColor?: string }> = ({ label, value, valueColor = '#1e3a5f' }) => (
  <Box>
    <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', mb: 0.25 }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: valueColor }}>{value}</Typography>
  </Box>
);

const SectionPaper: React.FC<{ title: string; count?: number; onViewAll?: () => void; children: React.ReactNode }> = ({ title, count, onViewAll, children }) => (
  <Paper sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>{title}</Typography>
        {count !== undefined && count > 0 && (
          <Chip label={count} size="small"
            sx={{ bgcolor: '#eff4fb', color: '#1e3a5f', fontWeight: 600, height: 18, fontSize: '0.65rem' }} />
        )}
      </Box>
      {onViewAll && (
        <Typography onClick={onViewAll}
          sx={{ fontSize: '0.72rem', color: '#1e3a5f', fontWeight: 600, cursor: 'pointer' }}>
          View All
        </Typography>
      )}
    </Box>
    {children}
  </Paper>
);

export default FamilyDashboardPage;
