/**
 * Dialog Component - Modal dialog for forms
 * Pattern: Wrapper around Material-UI Dialog with custom styling
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface FormDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  title,
  onClose,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  children,
  maxWidth = 'sm',
}) => {
  const handleSubmit = async () => {
    try {
      await onSubmit();
      onClose();
    } catch (error) {
      // Error is handled by the caller
      console.error('Submit error:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        {title}
        <IconButton
          onClick={onClose}
          sx={{ color: '#666' }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {children}
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
