/**
 * Data Table Component - Reusable table with sorting, pagination, search
 * Pattern: Generic table component accepting columns and data
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

export interface Column<T> {
  id: keyof T;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string | React.ReactNode;
  width?: string;
}

interface DataTableProps<T extends { id?: string | number }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (search: string) => void;
  dense?: boolean;
}

export const DataTable = React.forwardRef<HTMLDivElement, DataTableProps<any>>(
  (
    {
      columns,
      data,
      isLoading = false,
      onRowClick,
      searchPlaceholder = 'Search...',
      totalCount = 0,
      page = 0,
      pageSize = 10,
      onPageChange,
      onPageSizeChange,
      onSearch,
      dense = false,
    },
    ref
  ) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);
      onSearch?.(value);
    };

    const handlePageChange = (event: unknown, newPage: number) => {
      onPageChange?.(newPage);
    };

    const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onPageSizeChange?.(parseInt(event.target.value, 10));
    };

    return (
      <Box ref={ref} sx={{ width: '100%' }}>
        {/* Search Bar */}
        {onSearch && (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#999' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                backgroundColor: '#fff',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                },
              }}
            />
          </Box>
        )}

        {/* Table */}
        <TableContainer component={Paper} sx={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Table size={dense ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                {columns.map((column) => (
                  <TableCell
                    key={String(column.id)}
                    align={column.align || 'left'}
                    sx={{
                      fontWeight: 600,
                      color: '#333',
                      width: column.width,
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: '#999' }}>
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIndex) => (
                  <TableRow
                    key={row.id || rowIndex}
                    onClick={() => onRowClick?.(row)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:hover': onRowClick ? { backgroundColor: '#f9f9f9' } : {},
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    {columns.map((column) => {
                      const value = row[column.id];
                      const formatted = column.format ? column.format(value) : value;

                      return (
                        <TableCell
                          key={`${rowIndex}-${String(column.id)}`}
                          align={column.align || 'left'}
                        >
                          {formatted}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {onPageChange || onPageSizeChange ? (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={pageSize}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handlePageSizeChange}
            sx={{ backgroundColor: '#fff', borderTop: '1px solid #e0e0e0' }}
          />
        ) : null}
      </Box>
    );
  }
);

DataTable.displayName = 'DataTable';
