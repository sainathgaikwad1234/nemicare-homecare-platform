/**
 * Main Layout Component - Header with horizontal nav + full-width content
 * No sidebar - navigation is via horizontal tabs in the header (matching Figma)
 */

import React from 'react';
import { Box } from '@mui/material';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
      <Header />
      <Box
        component="main"
        sx={{
          flex: 1,
          mt: '42px',
          p: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
