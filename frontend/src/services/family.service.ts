import { apiClient, ApiResponse } from './api';

export interface FamilyResidentDto {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  programType: 'ADH' | 'ALF';
  relation: string;
  isPrimary: boolean;
  facility: string;
  room: string;
  admissionDate: string;
  expectedDischarge: string | null;
}

export interface FamilyDashboardDto {
  resident: {
    id: number;
    firstName: string;
    lastName: string;
    programType: 'ADH' | 'ALF';
    facility: string | null;
    relation: string;
    admissionDate: string;
    expectedDischarge: string | null;
    billingType: string;
    caseManager: string | null;
    caseManagerPhone: string | null;
  };
  kpis: { alerts: number; openTickets: number; daysRemaining: number | null };
  painScale: { level: number; label: string } | null;
  recentIncidents: Array<{
    id: number; title: string; severity: string; date: string; time: string | null; location: string | null;
  }>;
  recentVitals: Array<{
    id: number; date: string; bloodPressure: string;
    pulse: number | null; temperature: number | null; weight: number | null;
  }>;
}

export interface FamilyTicketDto {
  id: number; residentId: number;
  title: string; category: string | null; priority: string;
  status: string; description: string | null;
  createdAt: string;
}

export interface FamilyInventoryDto {
  id: number; residentId: number;
  itemName: string; category: string | null; quantity: number;
  condition: string | null; status: string;
  notes: string | null; createdAt: string;
}

export interface FamilyIncidentDto {
  id: number; residentId: number;
  type: string; severity: string; status: string;
  date: string; time: string | null; location: string | null;
  description: string | null;
}

export interface FamilyAppointmentDto {
  id: number;
  residentId: number;
  residentName: string;
  residentAge: number | null;
  programType: 'ADH' | 'ALF';
  mode: 'IN_PERSON' | 'VIRTUAL';
  status: 'REQUESTED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  preferredProvider: string | null;
  reason: string | null;
  notes: string | null;
  facilityName: string | null;
  facilityAddress: string | null;
  telehealthUrl: string | null;
}

export type FamilyNotificationType =
  'PASSWORD' | 'DOCUMENT' | 'ALERT' | 'INCIDENT' | 'MESSAGE' | 'TICKET' | 'INVOICE' | 'APPOINTMENT';

export interface FamilyNotificationDto {
  id: number;
  type: FamilyNotificationType;
  title: string;
  description: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  residentId: number | null;
}

export interface FamilyNotificationSettingsDto {
  password: boolean; document: boolean; alert: boolean; incident: boolean;
  message: boolean; ticket: boolean; invoice: boolean; appointment: boolean;
  allowAll: boolean;
}

export interface FamilyBillingItemDto {
  id: number; residentId: number; invoiceNumber: string | null;
  billingPeriodStart: string; billingPeriodEnd: string;
  totalVisits: number; subtotal: string | number; totalAmount: string | number;
  amountPaid: string | number; tax: string | number; adjustments: string | number;
  status: string; sentDate: string | null; paidDate: string | null;
  paymentMethod: string | null; billingType: string;
}
export interface FamilyStatementDto {
  currentStatement: FamilyBillingItemDto | null;
  kpis: { totalUnpaid: number; unpaidCount: number; totalPaid: number; paidCount: number };
}

class FamilyService {
  // Residents linked to current user
  listResidents(): Promise<ApiResponse<FamilyResidentDto[]>> {
    return apiClient.get('/api/v1/family/residents');
  }

  // Dashboard
  getDashboard(residentId: number): Promise<ApiResponse<FamilyDashboardDto>> {
    return apiClient.get(`/api/v1/family/residents/${residentId}/dashboard`);
  }

  // Tickets
  listTickets(residentId: number, status?: string): Promise<ApiResponse<FamilyTicketDto[]>> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient.get(`/api/v1/family/residents/${residentId}/tickets${q}`);
  }
  createTicket(residentId: number, body: { title: string; category?: string; priority?: string; description?: string }): Promise<ApiResponse<FamilyTicketDto>> {
    return apiClient.post(`/api/v1/family/residents/${residentId}/tickets`, body);
  }

  // Inventory
  listInventory(residentId: number): Promise<ApiResponse<FamilyInventoryDto[]>> {
    return apiClient.get(`/api/v1/family/residents/${residentId}/inventory`);
  }
  addInventory(residentId: number, body: { itemName: string; category?: string; quantity?: number; condition?: string; currentStatus?: string; notes?: string }): Promise<ApiResponse<FamilyInventoryDto>> {
    return apiClient.post(`/api/v1/family/residents/${residentId}/inventory`, body);
  }

  // Incidents
  listIncidents(residentId: number, status?: string): Promise<ApiResponse<FamilyIncidentDto[]>> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient.get(`/api/v1/family/residents/${residentId}/incidents${q}`);
  }

  // Medications
  listMedications(residentId: number): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/api/v1/family/residents/${residentId}/medications`);
  }

  // Vitals
  listVitals(residentId: number): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/api/v1/family/residents/${residentId}/vitals`);
  }

  // Allergies
  listAllergies(residentId: number): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/api/v1/family/residents/${residentId}/allergies`);
  }

  // Documents
  listDocuments(residentId: number): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/api/v1/family/residents/${residentId}/documents`);
  }

  // Appointments
  listAppointments(scope: 'upcoming' | 'past' = 'upcoming'): Promise<ApiResponse<FamilyAppointmentDto[]>> {
    return apiClient.get(`/api/v1/family/appointments?scope=${scope}`);
  }
  createAppointment(body: {
    residentId: number; mode: 'IN_PERSON' | 'VIRTUAL';
    scheduledDate: string; scheduledTime: string;
    preferredProvider?: string; reason?: string; notes?: string;
  }): Promise<ApiResponse<FamilyAppointmentDto>> {
    return apiClient.post('/api/v1/family/appointments', body);
  }
  cancelAppointment(id: number, reason?: string): Promise<ApiResponse<FamilyAppointmentDto>> {
    return apiClient.patch(`/api/v1/family/appointments/${id}/cancel`, { reason });
  }

  // Notifications
  listNotifications(): Promise<ApiResponse<{ items: FamilyNotificationDto[]; unreadCount: number }>> {
    return apiClient.get('/api/v1/family/notifications');
  }
  markNotificationRead(id: number): Promise<ApiResponse<FamilyNotificationDto>> {
    return apiClient.patch(`/api/v1/family/notifications/${id}/read`, {});
  }
  markAllNotificationsRead(): Promise<ApiResponse<{ updated: number }>> {
    return apiClient.post('/api/v1/family/notifications/mark-all-read', {});
  }
  getNotificationSettings(): Promise<ApiResponse<FamilyNotificationSettingsDto>> {
    return apiClient.get('/api/v1/family/notifications/settings');
  }
  updateNotificationSettings(body: Partial<FamilyNotificationSettingsDto>): Promise<ApiResponse<FamilyNotificationSettingsDto>> {
    return apiClient.patch('/api/v1/family/notifications/settings', body);
  }

  // Billing
  getStatement(residentId: number): Promise<ApiResponse<FamilyStatementDto>> {
    return apiClient.get(`/api/v1/family/residents/${residentId}/billing/statement`);
  }
  listUnpaidBills(residentId: number): Promise<ApiResponse<FamilyBillingItemDto[]>> {
    return apiClient.get(`/api/v1/family/residents/${residentId}/billing/unpaid`);
  }
  listBillingHistory(residentId: number): Promise<ApiResponse<FamilyBillingItemDto[]>> {
    return apiClient.get(`/api/v1/family/residents/${residentId}/billing/history`);
  }

  // Documents — metadata-only upload (file URL placeholder until S3 is wired)
  uploadDocument(residentId: number, body: { title: string; documentType?: string; fileSize?: number; mimeType?: string }): Promise<ApiResponse<any>> {
    return apiClient.post(`/api/v1/family/residents/${residentId}/documents`, body);
  }
}

export const familyService = new FamilyService();
