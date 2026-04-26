import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, IconButton,
  FormControl, Select, MenuItem, RadioGroup, Radio, FormControlLabel,
  Avatar,
} from '@mui/material';
import { Close as CloseIcon, EventAvailable as MeetIcon, Add as AddIcon, Upload as UploadIcon } from '@mui/icons-material';
import { FamilyResident } from '../../components/Layout/FamilyLayout';

const initials = (f?: string, l?: string) =>
  `${(f || '?').charAt(0)}${(l || '?').charAt(0)}`.toUpperCase();

// ============ Request Meet ============
interface RequestMeetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  residents: FamilyResident[];
  defaultResidentId?: number;
}
export const RequestMeetDialog: React.FC<RequestMeetProps> = ({ open, onClose, onSubmit, residents, defaultResidentId }) => {
  const [mode, setMode] = useState<'IN_PERSON' | 'VIRTUAL'>('IN_PERSON');
  const [residentId, setResidentId] = useState<number | ''>(defaultResidentId || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [provider, setProvider] = useState('');
  const [message, setMessage] = useState('');

  const submit = () => {
    if (!residentId || !date || !time) return;
    onSubmit({ mode, residentId, date, time, provider, message });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MeetIcon sx={{ color: '#1e3a5f' }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a5f' }}>Request Meet</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          Appointment Mode
        </Typography>
        <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as any)}>
          <FormControlLabel value="IN_PERSON" control={<Radio size="small" />} label="In-Person" />
          <FormControlLabel value="VIRTUAL" control={<Radio size="small" />} label="Virtual" />
        </RadioGroup>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
              Date <span style={{ color: '#dc2626' }}>*</span>
            </Typography>
            <TextField type="date" size="small" fullWidth
              value={date} onChange={(e) => setDate(e.target.value)} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
              Time Window <span style={{ color: '#dc2626' }}>*</span>
            </Typography>
            <TextField type="time" size="small" fullWidth
              value={time} onChange={(e) => setTime(e.target.value)} />
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mt: 1.5, mb: 0.5 }}>
          Family Member <span style={{ color: '#dc2626' }}>*</span>
        </Typography>
        <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
          <Select value={residentId} onChange={(e) => setResidentId(Number(e.target.value))} displayEmpty>
            <MenuItem value="" disabled><em>Select resident</em></MenuItem>
            {residents.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                <Avatar sx={{ width: 22, height: 22, fontSize: '0.6rem', mr: 1, bgcolor: '#1e3a5f' }}>
                  {initials(r.firstName, r.lastName)}
                </Avatar>
                {r.firstName} {r.lastName} · {r.programType}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          Preferred Provider
        </Typography>
        <TextField size="small" fullWidth value={provider} onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g. Dianne Russell, MD" sx={{ mb: 1.5 }} />

        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          Reason / Notes
        </Typography>
        <TextField multiline rows={3} fullWidth size="small"
          value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe what you'd like to discuss..." />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={submit}
          disabled={!residentId || !date || !time}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          Send Request
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============ Create Ticket ============
interface CreateTicketProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  residentId: number;
}
export const CreateTicketDialog: React.FC<CreateTicketProps> = ({ open, onClose, onSubmit, residentId }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({ residentId, title, category, priority, description });
    setTitle(''); setCategory('General'); setPriority('Medium'); setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a5f' }}>Create New Ticket</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          Title <span style={{ color: '#dc2626' }}>*</span>
        </Typography>
        <TextField size="small" fullWidth value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Question about evening dosage" sx={{ mb: 1.5 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Category</Typography>
            <FormControl size="small" fullWidth>
              <Select value={category} onChange={(e) => setCategory(e.target.value as string)}>
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Medication">Medication</MenuItem>
                <MenuItem value="Billing">Billing</MenuItem>
                <MenuItem value="Care Plan">Care Plan</MenuItem>
                <MenuItem value="Visitor / Access">Visitor / Access</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Priority</Typography>
            <FormControl size="small" fullWidth>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as string)}>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          Description
        </Typography>
        <TextField multiline rows={4} fullWidth size="small"
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide as much detail as you can..." />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!title.trim()}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          Submit Ticket
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============ Upload Document ============
interface UploadDocProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; documentType: string; fileSize?: number; mimeType?: string }) => void;
}
export const UploadDocumentDialog: React.FC<UploadDocProps> = ({ open, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('OTHER');
  const [file, setFile] = useState<File | null>(null);

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      documentType,
      fileSize: file?.size,
      mimeType: file?.type,
    });
    setTitle(''); setDocumentType('OTHER'); setFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon sx={{ color: '#1e3a5f' }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a5f' }}>Upload Document</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          Title <span style={{ color: '#dc2626' }}>*</span>
        </Typography>
        <TextField size="small" fullWidth value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Hospital Discharge Summary" sx={{ mb: 1.5 }} />

        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          Document Type
        </Typography>
        <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
          <Select value={documentType} onChange={(e) => setDocumentType(e.target.value as string)}>
            <MenuItem value="MEDICAL_RECORD">Medical Record</MenuItem>
            <MenuItem value="INSURANCE">Insurance</MenuItem>
            <MenuItem value="LEGAL">Legal / Power of Attorney</MenuItem>
            <MenuItem value="CARE_PLAN">Care Plan</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>

        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          File
        </Typography>
        <Box sx={{
          border: '1px dashed #d1d5db', borderRadius: '8px', p: 2, textAlign: 'center',
          bgcolor: '#fafbfc', cursor: 'pointer',
          '&:hover': { bgcolor: '#f3f4f6' },
        }}
          onClick={() => document.getElementById('family-doc-file-input')?.click()}>
          <input
            id="family-doc-file-input"
            type="file" hidden
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <UploadIcon sx={{ fontSize: 28, color: '#9ca3af', mb: 0.5 }} />
          <Typography sx={{ fontSize: '0.85rem', color: '#374151' }}>
            {file ? file.name : 'Click to select a file'}
          </Typography>
          {file && (
            <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', mt: 0.5 }}>
              {(file.size / 1024).toFixed(1)} KB · {file.type || 'unknown'}
            </Typography>
          )}
        </Box>
        <Typography sx={{ fontSize: '0.7rem', color: '#9ca3af', mt: 1 }}>
          Note: file content will be stored once cloud storage (S3) is configured. For now, only metadata is recorded.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!title.trim()}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============ Add Inventory ============
interface AddInventoryProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  residentId: number;
}
export const AddInventoryDialog: React.FC<AddInventoryProps> = ({ open, onClose, onSubmit, residentId }) => {
  const [form, setForm] = useState({
    itemName: '', category: 'Other', quantity: 1,
    condition: 'New', currentStatus: 'Present', notes: '',
  });
  const set = (k: keyof typeof form, v: any) => setForm({ ...form, [k]: v });

  const submit = () => {
    if (!form.itemName.trim()) return;
    onSubmit({ residentId, ...form });
    setForm({ itemName: '', category: 'Other', quantity: 1, condition: 'New', currentStatus: 'Present', notes: '' });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon sx={{ color: '#1e3a5f' }} />
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e3a5f' }}>Add Inventory Item</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          Item Name <span style={{ color: '#dc2626' }}>*</span>
        </Typography>
        <TextField size="small" fullWidth value={form.itemName}
          onChange={(e) => set('itemName', e.target.value)}
          placeholder="e.g. Sony WH-1000XM5 Headphones" sx={{ mb: 1.5 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
          <Box>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Category</Typography>
            <FormControl size="small" fullWidth>
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                <MenuItem value="Other">Other</MenuItem>
                <MenuItem value="Electronics">Electronics</MenuItem>
                <MenuItem value="Clothing">Clothing</MenuItem>
                <MenuItem value="Toiletries">Toiletries</MenuItem>
                <MenuItem value="Books / Hobby">Books / Hobby</MenuItem>
                <MenuItem value="Mobility Aid">Mobility Aid</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Quantity</Typography>
            <TextField type="number" size="small" fullWidth
              value={form.quantity} onChange={(e) => set('quantity', Math.max(1, Number(e.target.value)))}
              inputProps={{ min: 1 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Condition</Typography>
            <FormControl size="small" fullWidth>
              <Select value={form.condition} onChange={(e) => set('condition', e.target.value)}>
                <MenuItem value="New">New</MenuItem>
                <MenuItem value="Like New">Like New</MenuItem>
                <MenuItem value="Good">Good</MenuItem>
                <MenuItem value="Fair">Fair</MenuItem>
                <MenuItem value="Damaged">Damaged</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>Current Status</Typography>
            <FormControl size="small" fullWidth>
              <Select value={form.currentStatus} onChange={(e) => set('currentStatus', e.target.value)}>
                <MenuItem value="Present">Present</MenuItem>
                <MenuItem value="In Use">In Use</MenuItem>
                <MenuItem value="Misplaced">Misplaced</MenuItem>
                <MenuItem value="Returned to Family">Returned to Family</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
          Notes / Description
        </Typography>
        <TextField multiline rows={3} fullWidth size="small"
          value={form.notes} onChange={(e) => set('notes', e.target.value)}
          placeholder="Any details to help staff identify the item..." />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!form.itemName.trim()}
          sx={{ bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#1a3354' }, textTransform: 'none' }}>
          Add Item
        </Button>
      </DialogActions>
    </Dialog>
  );
};
