/**
 * Lead Form Component - Form for creating/editing leads
 * Pattern: Controlled form with validation
 */

import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import { Lead, LeadCreateInput, LeadUpdateInput } from '../services/lead.service';

interface LeadFormProps {
  lead?: Lead;
  isLoading?: boolean;
  error?: string;
  onChange: (data: LeadCreateInput | LeadUpdateInput) => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  lead,
  isLoading = false,
  error,
  onChange,
}) => {
  const [formData, setFormData] = useState<LeadCreateInput | LeadUpdateInput>({
    firstName: lead?.firstName || '',
    lastName: lead?.lastName || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    address: lead?.address || '',
    city: lead?.city || '',
    state: lead?.state || '',
    zipCode: lead?.zipCode || '',
    dateOfBirth: lead?.dateOfBirth || '',
    gender: lead?.gender || 'MALE',
    source: lead?.source || '',
    ...(lead && {
      status: lead.status,
      followUpDate: lead.followUpDate,
      notes: lead.notes,
    }),
    companyId: lead?.companyId || '',
    facilityId: lead?.facilityId || '',
  });

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'PA', 'NY', 'TX', 'FL'];
  const sources = ['Referral', 'Website', 'Phone', 'Direct', 'Family'];
  const genders = ['MALE', 'FEMALE', 'OTHER'];

  return (
    <>
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {/* First Row: Name */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            disabled={isLoading}
            required
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            disabled={isLoading}
            required
            size="small"
          />
        </Grid>

        {/* Second Row: Contact */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={isLoading}
            required
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={isLoading}
            required
            size="small"
          />
        </Grid>

        {/* Third Row: Address */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            disabled={isLoading}
            required
            size="small"
          />
        </Grid>

        {/* Fourth Row: City, State, Zip */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            disabled={isLoading}
            required
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small" disabled={isLoading}>
            <InputLabel>State</InputLabel>
            <Select
              value={formData.state}
              label="State"
              onChange={(e) => handleChange('state', e.target.value)}
            >
              {states.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Zip Code"
            value={formData.zipCode}
            onChange={(e) => handleChange('zipCode', e.target.value)}
            disabled={isLoading}
            required
            size="small"
          />
        </Grid>

        {/* Fifth Row: DOB and Gender */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            disabled={isLoading}
            required
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" disabled={isLoading}>
            <InputLabel>Gender</InputLabel>
            <Select
              value={formData.gender}
              label="Gender"
              onChange={(e) => handleChange('gender', e.target.value)}
            >
              {genders.map((gender) => (
                <MenuItem key={gender} value={gender}>
                  {gender}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sixth Row: Source */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" disabled={isLoading}>
            <InputLabel>Source</InputLabel>
            <Select
              value={formData.source}
              label="Source"
              onChange={(e) => handleChange('source', e.target.value)}
            >
              {sources.map((source) => (
                <MenuItem key={source} value={source}>
                  {source}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Edit-only fields */}
        {lead && (
          <>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" disabled={isLoading}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={(formData as any).status || 'PROSPECT'}
                  label="Status"
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <MenuItem value="PROSPECT">Prospect</MenuItem>
                  <MenuItem value="QUALIFIED">Qualified</MenuItem>
                  <MenuItem value="IN_PROCESS">In Process</MenuItem>
                  <MenuItem value="CONVERTED">Converted</MenuItem>
                  <MenuItem value="REJECTED">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Follow-up Date"
                type="date"
                value={(formData as any).followUpDate || ''}
                onChange={(e) => handleChange('followUpDate', e.target.value)}
                disabled={isLoading}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={(formData as any).notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={isLoading}
                size="small"
              />
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
};
