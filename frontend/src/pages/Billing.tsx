import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { AttachMoney as BillingIcon } from '@mui/icons-material';

export const BillingPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ border: '1px solid #e5e7eb', boxShadow: 'none', borderRadius: '8px', p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <BillingIcon sx={{ color: '#1e3a5f', fontSize: 28 }} />
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e3a5f' }}>
            Billing &amp; Payments
          </Typography>
          <Chip
            label="Coming Soon"
            size="small"
            sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 500, height: 22, fontSize: '0.7rem' }}
          />
        </Box>
        <Typography sx={{ color: '#6b7280', mb: 2 }}>
          The Billing module is being built. It will include:
        </Typography>
        <Box component="ul" sx={{ color: '#374151', pl: 3, '& li': { mb: 0.75, fontSize: '0.9rem' } }}>
          <li>Patient invoice generation and payment tracking</li>
          <li>Insurance claim submission and reconciliation</li>
          <li>Service line items by visit / shift / care plan</li>
          <li>Payment history and aging reports</li>
          <li>Export to QuickBooks / accounting systems</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default BillingPage;
