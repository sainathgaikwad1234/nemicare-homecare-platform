import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Paper, Avatar, Button, IconButton,
  Snackbar, Alert, CircularProgress, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon, Send as SendIcon, Add as AddIcon,
  AttachFile as AttachIcon, EmojiEmotions as EmojiIcon,
  Phone as PhoneIcon, Videocam as VideoIcon, MoreVert as MoreIcon,
  ChatBubbleOutline as EmptyChatIcon,
} from '@mui/icons-material';
import { messageService, MessageThread } from '../../services/phase5b.service';
import { employeeService, Employee } from '../../services/employee.service';
import { useAuth } from '../../contexts/AuthContext';

const initials = (firstName?: string, lastName?: string) =>
  `${(firstName || '?').charAt(0)}${(lastName || '?').charAt(0)}`.toUpperCase();

// Format timestamp for thread list (e.g., "3:30 PM", "Yesterday", "Wednesday")
const formatThreadTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString();
};

// Format timestamp for messages within a thread (e.g., "3:30 PM")
const formatMessageTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

// Format date separator for groups in thread (e.g., "Today", "Yesterday", "Aug 15")
const formatDateSeparator = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const myUserId = user?.id ? Number(user.id) : null;

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientId, setRecipientId] = useState<number | ''>('');
  const [composeBody, setComposeBody] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const r = await messageService.listThreads();
      if (r.success && Array.isArray(r.data)) {
        setThreads(r.data);
        if (r.data.length > 0 && !activeThread) {
          const first = await messageService.getThread(r.data[0].id);
          if (first.success && first.data) setActiveThread(first.data);
        }
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' });
    } finally { setLoading(false); }
  }, [activeThread]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  useEffect(() => {
    if (composeOpen && employees.length === 0) {
      employeeService.listEmployees({ pageSize: 100 }).then((r: any) => {
        if (r.success && Array.isArray(r.data)) setEmployees(r.data);
      }).catch(() => {});
    }
  }, [composeOpen, employees.length]);

  // Auto-scroll to latest message when thread changes or new message sent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread]);

  const openThread = async (id: number) => {
    try {
      const r = await messageService.getThread(id);
      if (r.success && r.data) setActiveThread(r.data);
    } catch (e: any) { setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' }); }
  };

  const handleSend = async () => {
    if (!activeThread || !body.trim()) return;
    try {
      await messageService.sendMessage(activeThread.id, body);
      setBody('');
      const r = await messageService.getThread(activeThread.id);
      if (r.success && r.data) setActiveThread(r.data);
    } catch (e: any) { setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' }); }
  };

  const handleCompose = async () => {
    if (!recipientId || !composeBody.trim()) return;
    try {
      const r = await messageService.createThread({ recipientUserIds: [Number(recipientId)], body: composeBody });
      if (!r.success) throw new Error(r.error || 'Failed');
      setSnackbar({ open: true, message: 'Message sent', severity: 'success' });
      setComposeOpen(false); setRecipientId(''); setComposeBody('');
      await loadThreads();
    } catch (e: any) { setSnackbar({ open: true, message: e.message || 'Failed', severity: 'error' }); }
  };

  // Get the display name for a thread (other participant's name)
  const getThreadParticipants = (t: MessageThread) => {
    const others = t.participants.filter((p: any) => p.userId !== myUserId).map((p: any) => p.user).filter(Boolean);
    return others;
  };

  // Filter threads by search
  const filteredThreads = threads.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const others = getThreadParticipants(t);
    return others.some((u: any) => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q));
  });

  // Group active thread messages by date
  const groupedMessages: Array<{ date: string; messages: any[] }> = [];
  if (activeThread) {
    const sorted = [...activeThread.messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    let lastDate = '';
    let group: { date: string; messages: any[] } | null = null;
    for (const m of sorted) {
      const dateKey = new Date(m.createdAt).toDateString();
      if (dateKey !== lastDate) {
        if (group) groupedMessages.push(group);
        group = { date: m.createdAt, messages: [m] };
        lastDate = dateKey;
      } else if (group) {
        group.messages.push(m);
      }
    }
    if (group) groupedMessages.push(group);
  }

  const otherParticipants = activeThread ? getThreadParticipants(activeThread) : [];
  const primaryOther = otherParticipants[0] as any;

  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 80px)' }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', height: '100%', display: 'flex', overflow: 'hidden' }}>
        {/* ========= LEFT PANE: Conversation list ========= */}
        <Box sx={{ width: 340, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', bgcolor: '#fafbfc' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontSize: '1.15rem', fontWeight: 600, color: '#1e3a5f' }}>Messages</Typography>
            <IconButton size="small" onClick={() => setComposeOpen(true)} sx={{ color: '#1e3a5f' }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Search */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid #f3f4f6' }}>
            <TextField
              size="small" fullWidth placeholder="Search Conversation"
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#9ca3af' }} />
                  </InputAdornment>
                ),
                sx: { fontSize: '0.85rem', bgcolor: '#fff' },
              }}
            />
          </Box>

          {/* Thread list */}
          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
          ) : filteredThreads.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#6b7280' }}>
              <Typography sx={{ fontSize: '0.85rem' }}>
                {search ? 'No matches.' : 'No conversations. Start one with the + button.'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowY: 'auto', flex: 1 }}>
              {filteredThreads.map((t) => {
                const others = getThreadParticipants(t);
                const otherName = others.length > 0
                  ? others.map((u: any) => `${u.firstName} ${u.lastName}`).join(', ')
                  : t.subject || 'Direct message';
                const otherUser = others[0] as any;
                const last = t.messages[0]; // most recent (backend orders desc)
                const active = activeThread?.id === t.id;
                const unread = t.unreadCount && t.unreadCount > 0;
                return (
                  <Box
                    key={t.id}
                    onClick={() => openThread(t.id)}
                    sx={{
                      p: 1.5, display: 'flex', gap: 1.25, cursor: 'pointer',
                      bgcolor: active ? '#eff4fb' : 'transparent',
                      borderLeft: active ? '3px solid #1e3a5f' : '3px solid transparent',
                      '&:hover': { bgcolor: active ? '#eff4fb' : '#f5f6fa' },
                    }}
                  >
                    <Avatar
                      src={otherUser?.avatar || undefined}
                      sx={{ width: 44, height: 44, bgcolor: '#1e3a5f', fontSize: '0.85rem' }}
                    >
                      {initials(otherUser?.firstName, otherUser?.lastName)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                        <Typography
                          sx={{
                            fontSize: '0.9rem',
                            fontWeight: unread ? 700 : 500,
                            color: '#1e3a5f',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            flex: 1, mr: 1,
                          }}
                        >
                          {otherName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: unread ? '#1e3a5f' : '#9ca3af', fontWeight: unread ? 600 : 400, flexShrink: 0 }}>
                          {last ? formatThreadTime(last.createdAt) : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          sx={{
                            fontSize: '0.78rem',
                            color: unread ? '#374151' : '#6b7280',
                            fontWeight: unread ? 500 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            flex: 1, mr: 1,
                          }}
                        >
                          {last?.body || 'No messages yet'}
                        </Typography>
                        {unread ? (
                          <Box sx={{
                            minWidth: 18, height: 18, borderRadius: '50%', bgcolor: '#1e3a5f',
                            color: '#fff', fontSize: '0.65rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            px: 0.5,
                          }}>
                            {t.unreadCount}
                          </Box>
                        ) : null}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* ========= RIGHT PANE: Active conversation ========= */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
          {!activeThread ? (
            // Empty state
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', px: 4, textAlign: 'center' }}>
              <EmptyChatIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a5f', mb: 0.5 }}>
                No Chat Selected
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', maxWidth: 320 }}>
                Select a conversation from the list to view details or start a new one.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Conversation header */}
              <Box sx={{ p: 1.5, borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    src={primaryOther?.avatar || undefined}
                    sx={{ width: 40, height: 40, bgcolor: '#1e3a5f' }}
                  >
                    {initials(primaryOther?.firstName, primaryOther?.lastName)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e3a5f' }}>
                      {primaryOther
                        ? `${primaryOther.firstName} ${primaryOther.lastName}`
                        : activeThread.subject || 'Direct message'}
                    </Typography>
                    {otherParticipants.length > 1 && (
                      <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>
                        +{otherParticipants.length - 1} more
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton size="small" sx={{ color: '#6b7280' }}><SearchIcon fontSize="small" /></IconButton>
                  <IconButton size="small" sx={{ color: '#6b7280' }}><PhoneIcon fontSize="small" /></IconButton>
                  <IconButton size="small" sx={{ color: '#6b7280' }}><VideoIcon fontSize="small" /></IconButton>
                  <IconButton size="small" sx={{ color: '#6b7280' }}><MoreIcon fontSize="small" /></IconButton>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#fafbfc' }}>
                {groupedMessages.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', py: 4 }}>
                    No messages yet — say hello!
                  </Typography>
                ) : (
                  groupedMessages.map((g, gi) => (
                    <React.Fragment key={gi}>
                      {/* Date separator */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
                        <Box sx={{ flex: 1, height: '1px', bgcolor: '#e5e7eb' }} />
                        <Typography sx={{ mx: 2, fontSize: '0.7rem', color: '#9ca3af', fontWeight: 500 }}>
                          {formatDateSeparator(g.date)}
                        </Typography>
                        <Box sx={{ flex: 1, height: '1px', bgcolor: '#e5e7eb' }} />
                      </Box>
                      {g.messages.map((m: any) => {
                        const isMine = m.senderId === myUserId;
                        return (
                          <Box
                            key={m.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-end',
                              gap: 1,
                              flexDirection: isMine ? 'row-reverse' : 'row',
                            }}
                          >
                            {!isMine && (
                              <Avatar
                                src={m.sender?.avatar || undefined}
                                sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: '#1e3a5f' }}
                              >
                                {initials(m.sender?.firstName, m.sender?.lastName)}
                              </Avatar>
                            )}
                            <Box
                              sx={{
                                maxWidth: '65%',
                                p: 1.25,
                                px: 1.75,
                                borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                bgcolor: isMine ? '#1e3a5f' : '#fff',
                                color: isMine ? '#fff' : '#1e3a5f',
                                border: isMine ? 'none' : '1px solid #e5e7eb',
                                boxShadow: isMine ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                              }}
                            >
                              <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {m.body}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.65rem',
                                  color: isMine ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                                  mt: 0.5,
                                  textAlign: isMine ? 'right' : 'left',
                                }}
                              >
                                {formatMessageTime(m.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Composer */}
              <Box sx={{ p: 1.5, borderTop: '1px solid #f3f4f6', bgcolor: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#f9fafb', borderRadius: '24px' }}>
                  <IconButton size="small" sx={{ color: '#6b7280' }}>
                    <AttachIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#6b7280' }}>
                    <EmojiIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder="Type Message..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: '0.875rem' },
                    }}
                  />
                  <IconButton
                    onClick={handleSend}
                    disabled={!body.trim()}
                    sx={{
                      bgcolor: body.trim() ? '#1e3a5f' : '#e5e7eb',
                      color: body.trim() ? '#fff' : '#9ca3af',
                      '&:hover': { bgcolor: body.trim() ? '#1a3354' : '#e5e7eb' },
                      width: 36, height: 36,
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Paper>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Message</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Recipient</InputLabel>
            <Select label="Recipient" value={recipientId} onChange={(e) => setRecipientId(Number(e.target.value))}>
              {employees.map((e: any) => (
                <MenuItem key={e.id} value={e.userId}>{e.firstName} {e.lastName} ({e.designation || 'Employee'})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Message" multiline minRows={4} fullWidth size="small" value={composeBody} onChange={(e) => setComposeBody(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCompose} disabled={!recipientId || !composeBody.trim()}
            sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
            Send
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default MessagesPage;
