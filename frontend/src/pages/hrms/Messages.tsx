import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Avatar, Button, IconButton,
  Snackbar, Alert, CircularProgress, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import { ChatBubbleOutline as ChatIcon, Send as SendIcon, Add as AddIcon } from '@mui/icons-material';
import { messageService, MessageThread } from '../../services/phase5b.service';
import { employeeService, Employee } from '../../services/employee.service';

export const MessagesPage: React.FC = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThread, setActiveThread] = useState<MessageThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientId, setRecipientId] = useState<number | ''>('');
  const [composeBody, setComposeBody] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const r = await messageService.listThreads();
      if (r.success && Array.isArray(r.data)) {
        setThreads(r.data);
        if (r.data.length > 0 && !activeThread) {
          // open the first
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

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 120px)' }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', height: '100%', display: 'flex' }}>
        {/* Threads sidebar */}
        <Box sx={{ width: 320, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChatIcon sx={{ color: '#1e3a5f' }} />
              <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>Messages</Typography>
            </Box>
            <IconButton size="small" onClick={() => setComposeOpen(true)} sx={{ color: '#1e3a5f' }}><AddIcon /></IconButton>
          </Box>
          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>
          ) : threads.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#6b7280' }}>
              <Typography sx={{ fontSize: '0.85rem' }}>No conversations. Start one with the + button.</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowY: 'auto', flex: 1 }}>
              {threads.map((t) => {
                const others = t.participants.filter((p: any) => p.user).map((p: any) => `${p.user.firstName} ${p.user.lastName}`).join(', ');
                const last = t.messages[0];
                const active = activeThread?.id === t.id;
                return (
                  <Box key={t.id} onClick={() => openThread(t.id)}
                    sx={{ p: 1.5, borderBottom: '1px solid #f3f4f6', cursor: 'pointer', bgcolor: active ? '#eff4fb' : 'transparent', '&:hover': { bgcolor: '#f5f6fa' } }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e3a5f' }}>{t.subject || others || 'Direct message'}</Typography>
                    {last && <Typography sx={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last.body}</Typography>}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Active thread */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!activeThread ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
              <Typography>Select a conversation</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6' }}>
                <Typography sx={{ fontWeight: 600, color: '#1e3a5f' }}>{activeThread.subject || 'Direct message'}</Typography>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {activeThread.messages.map((m: any) => (
                  <Box key={m.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                      {`${m.sender?.firstName?.[0] || ''}${m.sender?.lastName?.[0] || ''}`.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {m.sender ? `${m.sender.firstName} ${m.sender.lastName}` : 'Unknown'}
                        <Typography component="span" sx={{ ml: 1, fontSize: '0.7rem', color: '#6b7280', fontWeight: 400 }}>
                          {new Date(m.createdAt).toLocaleString()}
                        </Typography>
                      </Typography>
                      <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{m.body}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box sx={{ p: 2, borderTop: '1px solid #f3f4f6', display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" placeholder="Type a message..." value={body} onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <IconButton onClick={handleSend} disabled={!body.trim()} sx={{ color: '#1e3a5f' }}><SendIcon /></IconButton>
              </Box>
            </>
          )}
        </Box>
      </Paper>

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
