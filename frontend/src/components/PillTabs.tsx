import React from 'react';
import { Box } from '@mui/material';

export interface PillTabItem {
  label: string;
  value: string;
}

interface PillTabsProps {
  tabs: PillTabItem[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
}

/**
 * Figma segmented pill tabs:
 * - rounded outer container with light grey border
 * - selected tab: solid #1e3a5f bg + white text (or "ghost" white bg with dark text per Figma)
 * - unselected: transparent bg, grey text
 *
 * Used everywhere instead of MUI <Tabs/Tab> (which renders an underlined / Material-style row).
 */
export const PillTabs: React.FC<PillTabsProps> = ({ tabs, value, onChange, size = 'md' }) => {
  const padY = size === 'sm' ? 0.5 : 0.75;
  const padX = size === 'sm' ? 1.5 : 2;
  const fontSize = size === 'sm' ? '0.75rem' : '0.8rem';

  return (
    <Box sx={{
      display: 'inline-flex',
      bgcolor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '999px',
      p: 0.4,
      gap: 0.25,
    }}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <Box
            key={t.value}
            onClick={() => onChange(t.value)}
            sx={{
              px: padX, py: padY, borderRadius: '999px', cursor: 'pointer',
              fontSize, fontWeight: active ? 600 : 500,
              color: active ? '#fff' : '#6b7280',
              bgcolor: active ? '#1e3a5f' : 'transparent',
              transition: 'all 120ms ease',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              '&:hover': active ? {} : { bgcolor: '#f5f6fa', color: '#1e3a5f' },
            }}
          >
            {t.label}
          </Box>
        );
      })}
    </Box>
  );
};

export default PillTabs;
