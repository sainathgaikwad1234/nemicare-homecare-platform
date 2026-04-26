import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Avatar, Chip, Button, IconButton, TextField, InputAdornment, Switch } from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, FilterList as FilterIcon,
  Star as StarIcon,
  KeyboardArrowDown as ChevronDownIcon, MoreVert as MoreIcon,
  Folder as FolderIcon, InsertDriveFile as FileIcon,
  CalendarToday as CalendarIcon, AccessTime as ClockIcon, LocationOn as LocationIcon,
  ReportProblem as IncidentIcon, Lock as LockIcon, Description as DocumentIcon,
  ChatBubbleOutline as MessageIcon, ConfirmationNumber as TicketIcon,
  Receipt as InvoiceIcon, ErrorOutline as AlertIcon,
} from '@mui/icons-material';
import { PillTabs } from '../../components/PillTabs';
import { useFamily } from '../../components/Layout/FamilyLayout';
import { RequestMeetDialog, CreateTicketDialog, AddInventoryDialog, UploadDocumentDialog } from './FamilyDialogs';
import {
  familyService, FamilyTicketDto, FamilyInventoryDto, FamilyIncidentDto,
  FamilyAppointmentDto, FamilyNotificationDto, FamilyNotificationSettingsDto,
  FamilyBillingItemDto, FamilyStatementDto,
} from '../../services/family.service';

const PageShell: React.FC<{
  tabs?: { label: string; value: string; count?: number }[];
  activeTab?: string;
  onTabChange?: (v: string) => void;
  showSearch?: boolean;
  showFilter?: boolean;
  primaryAction?: { label: string; icon?: React.ReactNode; onClick?: () => void };
  children: React.ReactNode;
}> = ({ tabs, activeTab, onTabChange, showSearch, showFilter, primaryAction, children }) => (
  <Box sx={{ p: 2 }}>
    <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
      {(tabs || showSearch || primaryAction) && (
        <Box sx={{
          p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 1.5,
        }}>
          {tabs && activeTab && onTabChange ? (
            <PillTabs tabs={tabs} value={activeTab} onChange={onTabChange} />
          ) : <Box />}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showSearch && (
              <TextField size="small" placeholder="Search"
                InputProps={{
                  startAdornment: <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#9ca3af' }} />
                  </InputAdornment>,
                }}
                sx={{ minWidth: 240 }}
              />
            )}
            {showFilter && (
              <IconButton size="small" sx={{ border: '1px solid #e5e7eb', borderRadius: 1 }}>
                <FilterIcon fontSize="small" />
              </IconButton>
            )}
            {primaryAction && (
              <Button variant="contained"
                startIcon={primaryAction.icon || <AddIcon />}
                onClick={primaryAction.onClick}
                sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
                {primaryAction.label}
              </Button>
            )}
          </Box>
        </Box>
      )}
      <Box>{children}</Box>
    </Paper>
  </Box>
);

// (Kept ComingSoon helper inline below where still used; legacy export removed)

// ============ Appointments ============
export const FamilyAppointmentsPage: React.FC = () => {
  const [tab, setTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');
  const [meetOpen, setMeetOpen] = useState(false);
  const { residents, selectedResident } = useFamily();
  const [appts, setAppts] = useState<FamilyAppointmentDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    familyService.listAppointments(tab === 'UPCOMING' ? 'upcoming' : 'past').then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) setAppts(res.data);
    }).catch(() => setAppts([]));
    return () => { cancelled = true; };
  }, [tab, reloadKey]);

  const cancel = async (id: number) => {
    try {
      await familyService.cancelAppointment(id);
      setReloadKey((k) => k + 1);
    } catch (e) { /* swallow */ }
  };

  const upcomingCount = tab === 'UPCOMING' ? appts.length : 0;

  return (
    <PageShell
      tabs={[{ label: 'Upcoming', value: 'UPCOMING', count: upcomingCount }, { label: 'Past', value: 'PAST' }]}
      activeTab={tab} onTabChange={(v) => setTab(v as any)}
      showSearch showFilter
      primaryAction={{ label: 'Request Meet', onClick: () => setMeetOpen(true) }}
    >
      {appts.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>
            No {tab === 'UPCOMING' ? 'upcoming' : 'past'} appointments.
          </Typography>
          {tab === 'UPCOMING' && (
            <Typography sx={{ fontSize: '0.78rem', mt: 0.5 }}>
              Click "Request Meet" to schedule a visit.
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {appts.map((a) => <AppointmentCardLive key={a.id} appt={a} onCancel={() => cancel(a.id)} />)}
        </Box>
      )}
      <RequestMeetDialog
        open={meetOpen} onClose={() => setMeetOpen(false)}
        residents={residents}
        defaultResidentId={selectedResident?.id}
        onSubmit={async (data) => {
          try {
            await familyService.createAppointment({
              residentId: data.residentId,
              mode: data.mode,
              scheduledDate: data.date,
              scheduledTime: data.time,
              preferredProvider: data.provider || undefined,
              reason: data.message || undefined,
            });
            setReloadKey((k) => k + 1);
          } catch (e) { /* swallow */ }
        }}
      />
    </PageShell>
  );
};

const AppointmentCardLive: React.FC<{ appt: FamilyAppointmentDto; onCancel: () => void }> = ({ appt, onCancel }) => {
  const d = new Date(appt.scheduledDate);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const isRequested = appt.status === 'REQUESTED';
  const isCancelled = appt.status === 'CANCELLED';
  return (
    <Paper sx={{
      border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
      bgcolor: isRequested ? '#f0fdf4' : isCancelled ? '#fef2f2' : '#fff',
      overflow: 'hidden',
    }}>
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', gap: 1.5, flex: 1 }}>
          <Box sx={{ textAlign: 'center', minWidth: 40 }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a5f', lineHeight: 1 }}>{day}</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{month}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.5 }}>
              <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: '#1e3a5f' }}>
                {appt.residentName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </Avatar>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                {appt.residentName}
              </Typography>
              {appt.residentAge && <Chip label={`${appt.residentAge} Yrs`} size="small" sx={{ bgcolor: '#f3f4f6', height: 18, fontSize: '0.62rem' }} />}
              <Box sx={{ width: 4, height: 4, bgcolor: '#d1d5db', borderRadius: '50%' }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>{appt.programType}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, color: '#6b7280', fontSize: '0.78rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 14 }} /> {fmtDate(appt.scheduledDate)}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ClockIcon sx={{ fontSize: 14 }} /> {appt.scheduledTime}
              </Box>
            </Box>
          </Box>
        </Box>
        <Chip
          label={isRequested ? 'Request Sent' : isCancelled ? 'Cancelled' : 'Scheduled'}
          size="small"
          sx={{
            bgcolor: isRequested ? '#d1fae5' : isCancelled ? '#fee2e2' : '#dbeafe',
            color: isRequested ? '#065f46' : isCancelled ? '#991b1b' : '#1e40af',
            fontWeight: 600, height: 22, fontSize: '0.7rem',
          }} />
      </Box>
      {(appt.facilityName || appt.telehealthUrl || appt.preferredProvider) && (
        <Box sx={{ px: 1.5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
          {appt.telehealthUrl ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#1e40af', fontSize: '0.78rem' }}>
              🔗 <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 240 }}>{appt.telehealthUrl}</span>
            </Box>
          ) : appt.facilityName ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6b7280' }}>
              <LocationIcon sx={{ fontSize: 14 }} />
              <Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 500, color: '#374151' }}>{appt.facilityName}</Typography>
                {appt.facilityAddress && <Typography sx={{ fontSize: '0.7rem' }}>{appt.facilityAddress}</Typography>}
              </Box>
            </Box>
          ) : null}
          {appt.preferredProvider && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', bgcolor: '#ec4899' }}>
                {appt.preferredProvider.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </Avatar>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e3a5f' }}>{appt.preferredProvider}</Typography>
            </Box>
          )}
        </Box>
      )}
      {!isCancelled && appt.status !== 'COMPLETED' && (
        <Box sx={{ px: 1.5, py: 1, borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>
            {appt.reason ? `Reason: ${appt.reason.slice(0, 40)}` : 'Reason ⓘ'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Button size="small" variant="outlined" onClick={onCancel}
              sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#6b7280', borderColor: '#e5e7eb' }}>
              Cancel Meet
            </Button>
            {appt.status === 'SCHEDULED' && (
              <Button size="small" variant="outlined"
                sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#1e3a5f', borderColor: '#1e3a5f' }}>
                Reschedule
              </Button>
            )}
            {appt.telehealthUrl && appt.status === 'SCHEDULED' && (
              <Button size="small" variant="contained"
                onClick={() => window.open(appt.telehealthUrl!, '_blank')}
                sx={{ textTransform: 'none', fontSize: '0.72rem', bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' } }}>
                Join
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// ============ Chat — reuses HRMS Messages component (full 2-pane chat with backend) ============
import { MessagesPage as HrmsMessagesPage } from '../hrms/Messages';
export const FamilyChatPage: React.FC = () => <HrmsMessagesPage />;

// ============ Medication ============
export const FamilyMedicationPage: React.FC = () => {
  const [tab, setTab] = useState('ACTIVE');
  const { selectedResident } = useFamily();
  const [meds, setMeds] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    familyService.listMedications(selectedResident.id).then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) setMeds(res.data);
    }).catch(() => setMeds([]));
    return () => { cancelled = true; };
  }, [selectedResident?.id]);

  const filtered = meds.filter((m) => {
    const isActive = !m.endDate || new Date(m.endDate) >= new Date();
    return tab === 'ACTIVE' ? isActive : !isActive;
  });

  return (
    <PageShell
      tabs={[
        { label: 'Active', value: 'ACTIVE', count: meds.filter((m) => !m.endDate || new Date(m.endDate) >= new Date()).length },
        { label: 'Past', value: 'PAST' },
      ]}
      activeTab={tab} onTabChange={setTab}
      showSearch showFilter
    >
      {filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>No {tab.toLowerCase()} medications recorded.</Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { p: 1.25, textAlign: 'left', fontSize: '0.82rem', borderBottom: '1px solid #f3f4f6' } }}>
            <thead>
              <tr style={{ background: '#fafbfc' }}>
                <th style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>Medicines</th>
                <th style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>Sig</th>
                <th style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>Start Date</th>
                <th style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>End Date</th>
                <th style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>Diagnosis Code</th>
                <th style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>Provider</th>
                <th style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>Status</th>
                <th style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem', width: 50 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const isActive = !m.endDate || new Date(m.endDate) >= new Date();
                const status = isActive ? 'Ongoing' : 'Completed';
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, color: '#1e3a5f' }}>{m.name || m.medicationName}</td>
                    <td>{m.sig || m.dosage || '—'}</td>
                    <td>{m.startDate ? fmtDate(m.startDate) : '—'}</td>
                    <td>{m.endDate ? fmtDate(m.endDate) : '—'}</td>
                    <td>{m.diagnosisCode || '—'}</td>
                    <td>{m.prescribedBy || m.provider || '—'}</td>
                    <td>
                      <Chip label={status} size="small"
                        sx={{
                          bgcolor: status === 'Ongoing' ? '#dbeafe' : '#d1fae5',
                          color: status === 'Ongoing' ? '#1e40af' : '#065f46',
                          fontWeight: 500, height: 20, fontSize: '0.68rem',
                        }} />
                    </td>
                    <td><IconButton size="small"><MoreIcon fontSize="small" /></IconButton></td>
                  </tr>
                );
              })}
            </tbody>
          </Box>
        </Box>
      )}
    </PageShell>
  );
};

// ============ Vitals ============
export const FamilyVitalsPage: React.FC = () => {
  const [tab, setTab] = useState('VITALS');
  const { selectedResident } = useFamily();
  const [vitals, setVitals] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);

  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    if (tab === 'VITALS') {
      familyService.listVitals(selectedResident.id).then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) setVitals(res.data);
      }).catch(() => setVitals([]));
    } else {
      familyService.listAllergies(selectedResident.id).then((res) => {
        if (cancelled) return;
        if (res.success && Array.isArray(res.data)) setAllergies(res.data);
      }).catch(() => setAllergies([]));
    }
    return () => { cancelled = true; };
  }, [selectedResident?.id, tab]);

  return (
    <PageShell
      tabs={[{ label: 'Vitals', value: 'VITALS' }, { label: 'Allergies', value: 'ALLERGIES' }]}
      activeTab={tab} onTabChange={setTab}
      showSearch showFilter
    >
      {tab === 'VITALS' ? (
        vitals.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
            <Typography sx={{ fontSize: '0.9rem' }}>No vitals recorded yet.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { p: 1.25, textAlign: 'left', fontSize: '0.82rem', borderBottom: '1px solid #f3f4f6' } }}>
              <thead>
                <tr style={{ background: '#fafbfc' }}>
                  {['Date & Time', 'Blood Pressure (mmHg)', 'Pulse (bpm)', 'Temperature (°F)', 'Respiratory (bpm)', 'Blood Glucose (mg/dL)', 'Weight (lb)', 'Comments'].map((h) => (
                    <th key={h} style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.74rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vitals.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Box>{fmtDate(v.date)}<br />
                        <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{fmtTime(v.date)}</span>
                      </Box>
                    </td>
                    <td>{v.bloodPressureSystolic ?? '-'}/{v.bloodPressureDiastolic ?? '-'}</td>
                    <td>{v.pulse ?? '—'}</td>
                    <td>{v.temperature ?? '—'}</td>
                    <td>{v.respiratoryRate ?? '—'}</td>
                    <td>{v.bloodGlucose ?? '—'}</td>
                    <td>{v.weight ?? '—'}</td>
                    <td>{v.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )
      ) : (
        allergies.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
            <Typography sx={{ fontSize: '0.9rem' }}>No allergies recorded.</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { p: 1.25, textAlign: 'left', fontSize: '0.82rem', borderBottom: '1px solid #f3f4f6' } }}>
              <thead>
                <tr style={{ background: '#fafbfc' }}>
                  {['Allergen', 'Type', 'Reaction', 'Severity', 'Onset'].map((h) => (
                    <th key={h} style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allergies.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 500, color: '#1e3a5f' }}>{a.allergen || a.name || '—'}</td>
                    <td>{a.type || a.allergyType || '—'}</td>
                    <td>{a.reaction || '—'}</td>
                    <td>
                      <Chip label={a.severity || 'Mild'} size="small"
                        sx={{
                          bgcolor: a.severity === 'Severe' ? '#fee2e2' : a.severity === 'Moderate' ? '#fef3c7' : '#d1fae5',
                          color: a.severity === 'Severe' ? '#991b1b' : a.severity === 'Moderate' ? '#92400e' : '#065f46',
                          fontWeight: 500, height: 20, fontSize: '0.68rem',
                        }} />
                    </td>
                    <td>{a.onsetDate ? fmtDate(a.onsetDate) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )
      )}
    </PageShell>
  );
};

// ============ Documents ============
export const FamilyDocumentsPage: React.FC = () => {
  const [tab, setTab] = useState('MY_SPACE');
  const { selectedResident } = useFamily();
  const [docs, setDocs] = useState<any[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    familyService.listDocuments(selectedResident.id).then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) setDocs(res.data);
    }).catch(() => setDocs([]));
    return () => { cancelled = true; };
  }, [selectedResident?.id, reloadKey]);

  const filtered = docs.filter((d) => {
    if (tab === 'MANDATORY') return d.isMandatory === true || d.category === 'MANDATORY';
    if (tab === 'GROUP') return d.visibility === 'GROUP' || d.category === 'GROUP';
    return true; // MY_SPACE — show all family-visible docs
  });

  return (
    <PageShell
      tabs={[
        { label: 'Mandatory', value: 'MANDATORY' },
        { label: 'My Space', value: 'MY_SPACE' },
        { label: 'Group Space', value: 'GROUP' },
      ]}
      activeTab={tab} onTabChange={setTab}
      showSearch showFilter
      primaryAction={{ label: 'New', icon: <AddIcon />, onClick: () => setUploadOpen(true) }}
    >
      {filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>No documents in this space.</Typography>
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
          {filtered.map((d) => (
            <Paper key={d.id} sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
              {d.fileUrl
                ? <FileIcon sx={{ color: '#dc2626', fontSize: 28 }} />
                : <FolderIcon sx={{ color: '#f59e0b', fontSize: 28 }} />}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }} noWrap>
                  {d.name || d.title || 'Untitled'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', color: '#9ca3af', fontSize: '0.7rem' }}>
                  {d.fileSize && <span>{d.fileSize}</span>}
                  {d.fileSize && d.createdAt && '•'}
                  {d.createdAt && <span>{fmtDate(d.createdAt)}</span>}
                </Box>
              </Box>
              <IconButton size="small"><StarIcon fontSize="small" sx={{ color: '#d1d5db' }} /></IconButton>
              <IconButton size="small"><MoreIcon fontSize="small" /></IconButton>
            </Paper>
          ))}
        </Box>
      )}
      {selectedResident && (
        <UploadDocumentDialog
          open={uploadOpen} onClose={() => setUploadOpen(false)}
          onSubmit={async (data) => {
            try {
              await familyService.uploadDocument(selectedResident.id, data);
              setReloadKey((k) => k + 1);
            } catch (e) { /* swallow */ }
          }}
        />
      )}
    </PageShell>
  );
};

// ============ Tickets ============
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
};
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export const FamilyTicketsPage: React.FC = () => {
  const [tab, setTab] = useState('OPEN');
  const [ticketOpen, setTicketOpen] = useState(false);
  const { selectedResident } = useFamily();
  const [tickets, setTickets] = useState<FamilyTicketDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    const status = tab === 'OPEN' ? 'Open' : 'Closed';
    familyService.listTickets(selectedResident.id, status).then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) setTickets(res.data);
    }).catch(() => setTickets([]));
    return () => { cancelled = true; };
  }, [selectedResident?.id, tab, reloadKey]);

  return (
    <PageShell
      tabs={[{ label: 'Open', value: 'OPEN' }, { label: 'Closed', value: 'CLOSED' }]}
      activeTab={tab} onTabChange={setTab}
      showSearch showFilter
      primaryAction={{ label: 'Create Ticket', onClick: () => setTicketOpen(true) }}
    >
      {tickets.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>No {tab.toLowerCase()} tickets.</Typography>
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
          {tickets.map((t) => (
            <Paper key={t.id} sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                {t.title}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', mt: 0.25 }}>
                {t.category || 'General'} • Priority: {t.priority}
              </Typography>
              <Box sx={{ mt: 1.5, display: 'flex', gap: 1, color: '#9ca3af', fontSize: '0.75rem' }}>
                <span>#{String(t.id).padStart(6, '0')}</span>•
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}><CalendarIcon sx={{ fontSize: 12 }} /> {fmtDate(t.createdAt)}</Box>•
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}><ClockIcon sx={{ fontSize: 12 }} /> {fmtTime(t.createdAt)}</Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      {selectedResident && (
        <CreateTicketDialog
          open={ticketOpen} onClose={() => setTicketOpen(false)}
          residentId={selectedResident.id}
          onSubmit={async (data) => {
            try {
              await familyService.createTicket(data.residentId, {
                title: data.title, category: data.category,
                priority: data.priority, description: data.description,
              });
              setReloadKey((k) => k + 1);
            } catch (e) { /* surface in real impl */ }
          }}
        />
      )}
    </PageShell>
  );
};

// ============ Inventory ============
export const FamilyInventoryPage: React.FC = () => {
  const [tab, setTab] = useState('PERSONAL');
  const [addOpen, setAddOpen] = useState(false);
  const { selectedResident } = useFamily();
  const [items, setItems] = useState<FamilyInventoryDto[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    familyService.listInventory(selectedResident.id).then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) setItems(res.data);
    }).catch(() => setItems([]));
    return () => { cancelled = true; };
  }, [selectedResident?.id, reloadKey]);

  return (
    <PageShell
      tabs={[
        { label: 'Personal', value: 'PERSONAL', count: items.length },
        { label: 'Facility', value: 'FACILITY', count: 0 },
      ]}
      activeTab={tab} onTabChange={setTab}
      showSearch showFilter
      primaryAction={{ label: 'Add Inventory', onClick: () => setAddOpen(true) }}
    >
      {items.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>No inventory items yet.</Typography>
          <Typography sx={{ fontSize: '0.78rem', mt: 0.5 }}>Click "Add Inventory" to track your loved one's belongings.</Typography>
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
          {items.map((it) => (
            <Paper key={it.id} sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
              display: 'flex', gap: 1.5,
            }}>
              <Box sx={{ width: 64, height: 64, bgcolor: '#f3f4f6', borderRadius: 1, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                <FileIcon />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f', mb: 1 }}>
                  {it.itemName}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                  <Field label="Category" value={it.category || 'Other'} />
                  <Field label="Qty" value={String(it.quantity)} />
                  <Field label="Condition" value={it.condition || '—'} />
                  <Field label="Current Status" value={it.status} />
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', mt: 0.5 }}>
                  Date Added: {fmtDate(it.createdAt)}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
      {selectedResident && (
        <AddInventoryDialog
          open={addOpen} onClose={() => setAddOpen(false)}
          residentId={selectedResident.id}
          onSubmit={async (data) => {
            try {
              await familyService.addInventory(data.residentId, {
                itemName: data.itemName, category: data.category,
                quantity: data.quantity, condition: data.condition,
                currentStatus: data.currentStatus, notes: data.notes,
              });
              setReloadKey((k) => k + 1);
            } catch (e) { /* swallow */ }
          }}
        />
      )}
    </PageShell>
  );
};

// ============ Incident ============
export const FamilyIncidentPage: React.FC = () => {
  const [tab, setTab] = useState('ACTIVE');
  const { selectedResident } = useFamily();
  const [items, setItems] = useState<FamilyIncidentDto[]>([]);

  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    const status = tab === 'ACTIVE' ? undefined : 'Resolved';
    familyService.listIncidents(selectedResident.id, status).then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) {
        const filtered = tab === 'ACTIVE'
          ? res.data.filter((i) => i.status !== 'Resolved')
          : res.data;
        setItems(filtered);
      }
    }).catch(() => setItems([]));
    return () => { cancelled = true; };
  }, [selectedResident?.id, tab]);

  return (
    <PageShell
      tabs={[{ label: 'Active', value: 'ACTIVE' }, { label: 'Resolved', value: 'RESOLVED' }]}
      activeTab={tab} onTabChange={setTab}
      showSearch showFilter
    >
      {items.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>No {tab.toLowerCase()} incidents.</Typography>
        </Box>
      ) : (
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
          {items.map((i) => (
            <Paper key={i.id} sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e3a5f' }}>{i.type}</Typography>
                <Chip label={i.severity} size="small"
                  sx={{
                    bgcolor: i.severity === 'Major' ? '#fee2e2' : '#dbeafe',
                    color: i.severity === 'Major' ? '#991b1b' : '#1e40af',
                    fontWeight: 600, height: 18, fontSize: '0.62rem',
                  }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, color: '#6b7280', fontSize: '0.75rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}><CalendarIcon sx={{ fontSize: 12 }} /> {fmtDate(i.date)}</Box>•
                {i.time && <><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}><ClockIcon sx={{ fontSize: 12 }} /> {i.time}</Box>•</>}
                {i.location && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}><LocationIcon sx={{ fontSize: 12 }} /> {i.location}</Box>}
              </Box>
              {i.description && (
                <Typography sx={{ fontSize: '0.78rem', color: '#374151', mt: 1 }}>
                  {i.description.length > 120 ? `${i.description.slice(0, 120)}...` : i.description}
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </PageShell>
  );
};

// ============ Notifications ============
const NOTIF_META: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  PASSWORD:    { icon: <LockIcon sx={{ fontSize: 16 }} />, bg: '#d1fae5', color: '#065f46' },
  DOCUMENT:    { icon: <DocumentIcon sx={{ fontSize: 16 }} />, bg: '#dbeafe', color: '#1e40af' },
  ALERT:       { icon: <AlertIcon sx={{ fontSize: 16 }} />, bg: '#fee2e2', color: '#991b1b' },
  INCIDENT:    { icon: <IncidentIcon sx={{ fontSize: 16 }} />, bg: '#dbeafe', color: '#1e40af' },
  MESSAGE:     { icon: <MessageIcon sx={{ fontSize: 16 }} />, bg: '#d1fae5', color: '#065f46' },
  TICKET:      { icon: <TicketIcon sx={{ fontSize: 16 }} />, bg: '#dbeafe', color: '#1e40af' },
  INVOICE:     { icon: <InvoiceIcon sx={{ fontSize: 16 }} />, bg: '#d1fae5', color: '#065f46' },
  APPOINTMENT: { icon: <CalendarIcon sx={{ fontSize: 16 }} />, bg: '#fef3c7', color: '#92400e' },
};

const NOTIF_LABEL: Record<string, string> = {
  PASSWORD: 'Password', DOCUMENT: 'Document', ALERT: 'Alert', INCIDENT: 'Incident',
  MESSAGE: 'Message', TICKET: 'Ticket', INVOICE: 'Invoice', APPOINTMENT: 'Appointment',
};

const SETTING_KEYS = ['password', 'document', 'alert', 'incident', 'message', 'ticket', 'invoice', 'appointment'] as const;

export const FamilyNotificationsPage: React.FC = () => {
  const [items, setItems] = useState<FamilyNotificationDto[]>([]);
  const [settings, setSettings] = useState<FamilyNotificationSettingsDto | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      familyService.listNotifications(),
      familyService.getNotificationSettings(),
    ]).then(([nRes, sRes]) => {
      if (cancelled) return;
      if (nRes.success && nRes.data) setItems(nRes.data.items);
      if (sRes.success && sRes.data) setSettings(sRes.data);
    }).catch(() => { /* keep empty */ });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const markRead = async (id: number) => {
    try {
      await familyService.markNotificationRead(id);
      setReloadKey((k) => k + 1);
    } catch (e) { /* swallow */ }
  };

  const markAll = async () => {
    try {
      await familyService.markAllNotificationsRead();
      setReloadKey((k) => k + 1);
    } catch (e) { /* swallow */ }
  };

  const toggleSetting = async (key: keyof FamilyNotificationSettingsDto, val: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: val });
    try {
      await familyService.updateNotificationSettings({ [key]: val });
    } catch (e) {
      // revert on failure
      setSettings({ ...settings });
    }
  };

  const today = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const todayWeekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small"><ChevronDownIcon sx={{ transform: 'rotate(90deg)' }} fontSize="small" /></IconButton>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>{today}, {todayWeekday}</Typography>
            <Chip label="Today" size="small" sx={{ bgcolor: '#d1fae5', color: '#065f46', height: 20, fontSize: '0.68rem' }} />
            <IconButton size="small"><ChevronDownIcon sx={{ transform: 'rotate(-90deg)' }} fontSize="small" /></IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {unreadCount > 0 && (
              <Button size="small" onClick={markAll}
                sx={{ textTransform: 'none', fontSize: '0.72rem', color: '#1e3a5f', fontWeight: 600 }}>
                Mark all read
              </Button>
            )}
            <TextField size="small" placeholder="Search"
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ width: 160 }}
            />
          </Box>
        </Box>
        {items.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', color: '#9ca3af' }}>
            <Typography sx={{ fontSize: '0.9rem' }}>No notifications.</Typography>
          </Box>
        ) : (
          <Box>
            {items.map((n, i) => {
              const meta = NOTIF_META[n.type] || NOTIF_META.MESSAGE;
              const unread = !n.readAt;
              return (
                <Box key={n.id}
                  onClick={() => unread && markRead(n.id)}
                  sx={{
                    p: 1.5, display: 'flex', alignItems: 'center', gap: 1.25,
                    borderBottom: i < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                    bgcolor: unread ? '#f9fafb' : '#fff',
                    cursor: unread ? 'pointer' : 'default',
                    '&:hover': unread ? { bgcolor: '#f3f4f6' } : {},
                  }}>
                  {unread && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#dc2626' }} />}
                  <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {meta.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }} noWrap>{n.title}</Typography>
                    {n.description && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }} noWrap>{n.description}</Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', flexShrink: 0 }}>
                    {fmtTime(n.createdAt)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>Notifications Settings</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>Allow All</Typography>
            <Switch
              checked={settings?.allowAll ?? true}
              onChange={(e) => toggleSetting('allowAll', e.target.checked)}
              size="small" />
          </Box>
        </Box>
        <Box>
          {SETTING_KEYS.map((k, i) => (
            <Box key={k} sx={{
              p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: i < SETTING_KEYS.length - 1 ? '1px solid #f3f4f6' : 'none',
              opacity: settings?.allowAll === false ? 0.5 : 1,
            }}>
              <Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e3a5f' }}>
                  {NOTIF_LABEL[k.toUpperCase()]}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  Receive notifications for {NOTIF_LABEL[k.toUpperCase()].toLowerCase()} events.
                </Typography>
              </Box>
              <Switch
                checked={settings ? settings[k] : true}
                onChange={(e) => toggleSetting(k, e.target.checked)}
                disabled={settings?.allowAll === false}
                size="small" />
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

// ============ Profile ============
export const FamilyProfilePage: React.FC = () => {
  const { residents } = useFamily();
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 2 }}>
        <Paper sx={{ p: 2.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ width: 96, height: 96, bgcolor: '#1e3a5f', fontSize: '2rem', mb: 1 }}>RE</Avatar>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1e3a5f' }}>Ralph Edwards</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 1 }}>Basic Details</Typography>
          <Field label="Email" value="johndoe@example.com" />
          <Box sx={{ mb: 1 }} />
          <Field label="Phone Number" value="(704) 555-0127" />
          <Box sx={{ mb: 1 }} />
          <Field label="Gender" value="Male" />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mt: 2, mb: 1 }}>Address Info</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Field label="Address Line 1" value="742 Evergreen Terrace" />
            <Field label="Address Line 2" value="Apt 5B" />
            <Field label="City" value="Springfield" />
            <Field label="Zip" value="62704" />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button fullWidth size="small" variant="outlined" sx={{ textTransform: 'none' }}>Edit</Button>
            <Button fullWidth size="small" variant="outlined" sx={{ textTransform: 'none' }}>Change Password</Button>
          </Box>
        </Paper>
        <Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
            <Paper sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#374151' }}>Family Members</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f' }}>{residents.length}</Typography>
            </Paper>
            <Paper sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#374151' }}>Open Tickets</Typography>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f' }}>8</Typography>
            </Paper>
            <Paper sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Typography sx={{ fontSize: '0.82rem', color: '#374151' }}>Next Visit</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a5f' }}>03/12/2026</Typography>
            </Paper>
          </Box>
          {residents.map((r) => (
            <Paper key={r.id} sx={{ p: 2, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', mb: 1.5,
              display: 'flex', gap: 2, alignItems: 'center',
            }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: '#1e3a5f' }}>
                {r.firstName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e3a5f' }}>
                    {r.firstName} {r.lastName}
                  </Typography>
                  <Chip label={r.programType} size="small"
                    sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 600, height: 18, fontSize: '0.65rem' }} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 0.5 }}>
                  <Field label="Relation" value={r.relation} />
                  <Field label="Facility" value={r.facility} />
                  <Field label="Room" value={r.room} />
                </Box>
              </Box>
              <Box sx={{ minWidth: 130, textAlign: 'right' }}>
                <Chip label={r.needsAttention ? 'Needs Attention' : 'Improving'} size="small"
                  sx={{
                    bgcolor: r.needsAttention ? '#fee2e2' : '#d1fae5',
                    color: r.needsAttention ? '#991b1b' : '#065f46',
                    fontWeight: 600, height: 20, fontSize: '0.68rem', mb: 0.75,
                  }} />
                <Box sx={{ position: 'relative', height: 4, bgcolor: '#f3f4f6', borderRadius: 2, mb: 0.5 }}>
                  <Box sx={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '11%', bgcolor: '#1e3a5f', borderRadius: 2 }} />
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>10/90</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>80 Days Remaining</Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

// ============ Billing — Statement ============
const fmtMoney = (n: number | string) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS_BG: Record<string, { bg: string; color: string }> = {
  PAID:       { bg: '#d1fae5', color: '#065f46' },
  DRAFT:      { bg: '#f3f4f6', color: '#374151' },
  SUBMITTED:  { bg: '#fef3c7', color: '#92400e' },
  APPROVED:   { bg: '#dbeafe', color: '#1e40af' },
  SENT:       { bg: '#dbeafe', color: '#1e40af' },
  OVERDUE:    { bg: '#fee2e2', color: '#991b1b' },
};

export const FamilyStatementPage: React.FC = () => {
  const { selectedResident } = useFamily();
  const [data, setData] = useState<FamilyStatementDto | null>(null);

  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    familyService.getStatement(selectedResident.id).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setData(res.data);
    }).catch(() => setData(null));
    return () => { cancelled = true; };
  }, [selectedResident?.id]);

  if (!data) {
    return <PageShell><Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
      <Typography sx={{ fontSize: '0.9rem' }}>No billing statements yet.</Typography>
    </Box></PageShell>;
  }
  const cur = data.currentStatement;

  return (
    <Box sx={{ p: 2 }}>
      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2 }}>
        <KpiBox label="Outstanding Balance" value={fmtMoney(data.kpis.totalUnpaid)} color="#dc2626" />
        <KpiBox label="Unpaid Invoices" value={String(data.kpis.unpaidCount)} color="#f59e0b" />
        <KpiBox label="Total Paid YTD" value={fmtMoney(data.kpis.totalPaid)} color="#10b981" />
        <KpiBox label="Paid Invoices" value={String(data.kpis.paidCount)} color="#1e3a5f" />
      </Box>
      {cur ? (
        <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a5f' }}>
                Current Statement {cur.invoiceNumber ? `#${cur.invoiceNumber}` : ''}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#6b7280' }}>
                Period: {fmtDate(cur.billingPeriodStart)} – {fmtDate(cur.billingPeriodEnd)}
              </Typography>
            </Box>
            <Chip label={cur.status} size="small" sx={{
              bgcolor: STATUS_BG[cur.status]?.bg || '#f3f4f6',
              color: STATUS_BG[cur.status]?.color || '#374151',
              fontWeight: 600, height: 24, fontSize: '0.72rem',
            }} />
          </Box>
          <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <Field label="Total Visits" value={String(cur.totalVisits)} />
            <Field label="Billing Type" value={cur.billingType} />
            <Field label="Subtotal" value={fmtMoney(cur.subtotal)} />
            <Field label="Tax" value={fmtMoney(cur.tax)} />
            <Field label="Adjustments" value={fmtMoney(cur.adjustments)} />
            <Field label="Total Amount" value={fmtMoney(cur.totalAmount)} />
            <Field label="Amount Paid" value={fmtMoney(cur.amountPaid)} />
            <Field label="Balance Due" value={fmtMoney(Number(cur.totalAmount) - Number(cur.amountPaid))} />
            {cur.sentDate && <Field label="Sent" value={fmtDate(cur.sentDate)} />}
            {cur.paidDate && <Field label="Paid" value={fmtDate(cur.paidDate)} />}
          </Box>
        </Paper>
      ) : (
        <Box sx={{ py: 6, textAlign: 'center', color: '#9ca3af' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>No statement yet — billing is generated at the end of each period.</Typography>
        </Box>
      )}
    </Box>
  );
};

const KpiBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <Paper sx={{ p: 1.5, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px' }}>
    <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color }}>{value}</Typography>
  </Paper>
);

// ============ Billing — Payment (unpaid invoices) ============
export const FamilyPaymentPage: React.FC = () => {
  const { selectedResident } = useFamily();
  const [items, setItems] = useState<FamilyBillingItemDto[]>([]);

  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    familyService.listUnpaidBills(selectedResident.id).then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) setItems(res.data);
    }).catch(() => setItems([]));
    return () => { cancelled = true; };
  }, [selectedResident?.id]);

  return (
    <PageShell showSearch>
      {items.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>No unpaid invoices. You're all caught up!</Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { p: 1.25, textAlign: 'left', fontSize: '0.82rem', borderBottom: '1px solid #f3f4f6' } }}>
            <thead>
              <tr style={{ background: '#fafbfc' }}>
                {['Invoice #', 'Period', 'Visits', 'Total', 'Paid', 'Balance', 'Status', 'Sent', 'Action'].map((h) => (
                  <th key={h} style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((b) => {
                const balance = Number(b.totalAmount) - Number(b.amountPaid);
                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: '#1e3a5f' }}>#{b.invoiceNumber || b.id}</td>
                    <td>{fmtDate(b.billingPeriodStart)} – {fmtDate(b.billingPeriodEnd)}</td>
                    <td>{b.totalVisits}</td>
                    <td>{fmtMoney(b.totalAmount)}</td>
                    <td>{fmtMoney(b.amountPaid)}</td>
                    <td style={{ fontWeight: 600, color: balance > 0 ? '#dc2626' : '#065f46' }}>{fmtMoney(balance)}</td>
                    <td>
                      <Chip label={b.status} size="small" sx={{
                        bgcolor: STATUS_BG[b.status]?.bg || '#f3f4f6',
                        color: STATUS_BG[b.status]?.color || '#374151',
                        fontWeight: 500, height: 20, fontSize: '0.68rem',
                      }} />
                    </td>
                    <td>{b.sentDate ? fmtDate(b.sentDate) : '—'}</td>
                    <td>
                      <Button size="small" variant="contained"
                        sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none', fontSize: '0.72rem' }}>
                        Pay Now
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Box>
        </Box>
      )}
    </PageShell>
  );
};

// ============ Billing — History (paid invoices) ============
export const FamilyHistoryPage: React.FC = () => {
  const { selectedResident } = useFamily();
  const [items, setItems] = useState<FamilyBillingItemDto[]>([]);

  useEffect(() => {
    if (!selectedResident) return;
    let cancelled = false;
    familyService.listBillingHistory(selectedResident.id).then((res) => {
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) setItems(res.data);
    }).catch(() => setItems([]));
    return () => { cancelled = true; };
  }, [selectedResident?.id]);

  return (
    <PageShell showSearch>
      {items.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: '#9ca3af' }}>
          <Typography sx={{ fontSize: '0.9rem' }}>No payment history yet.</Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { p: 1.25, textAlign: 'left', fontSize: '0.82rem', borderBottom: '1px solid #f3f4f6' } }}>
            <thead>
              <tr style={{ background: '#fafbfc' }}>
                {['Invoice #', 'Period', 'Total', 'Paid On', 'Method', 'Status', 'Action'].map((h) => (
                  <th key={h} style={{ fontWeight: 500, color: '#9ca3af', fontSize: '0.78rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, color: '#1e3a5f' }}>#{b.invoiceNumber || b.id}</td>
                  <td>{fmtDate(b.billingPeriodStart)} – {fmtDate(b.billingPeriodEnd)}</td>
                  <td>{fmtMoney(b.totalAmount)}</td>
                  <td>{b.paidDate ? fmtDate(b.paidDate) : '—'}</td>
                  <td>{b.paymentMethod || '—'}</td>
                  <td>
                    <Chip label={b.status} size="small" sx={{
                      bgcolor: STATUS_BG[b.status]?.bg || '#f3f4f6',
                      color: STATUS_BG[b.status]?.color || '#374151',
                      fontWeight: 500, height: 20, fontSize: '0.68rem',
                    }} />
                  </td>
                  <td>
                    <Button size="small" variant="outlined"
                      sx={{ textTransform: 'none', fontSize: '0.72rem', borderColor: '#1e3a5f', color: '#1e3a5f' }}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      )}
    </PageShell>
  );
};

// ============ Auth stubs ============
export const FamilyForgotPasswordPage: React.FC = () => (
  <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
    <Paper sx={{ p: 4, maxWidth: 400, border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', textAlign: 'center' }}>
      <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e3a5f', mb: 1 }}>Forgot Password?</Typography>
      <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>
        OTP / reset flow lands in Phase 2 once the auth backend supports email-link reset.
      </Typography>
    </Paper>
  </Box>
);

const Field: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ mb: 0.5 }}>
    <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af' }}>{label}</Typography>
    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e3a5f' }}>{value}</Typography>
  </Box>
);
