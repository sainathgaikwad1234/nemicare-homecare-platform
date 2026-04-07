import { apiClient, ApiResponse } from './api';

export type ChartingType =
  | 'vitals' | 'allergies' | 'medications' | 'care-plans'
  | 'events' | 'progress-notes' | 'services' | 'tickets'
  | 'inventory' | 'incidents' | 'pain-scale' | 'face-to-face';

class ChartingService {
  private basePath(residentId: number, type: ChartingType) {
    return `/api/v1/residents/${residentId}/charting/${type}`;
  }
  async list(residentId: number, type: ChartingType, page = 1, pageSize = 50): Promise<ApiResponse<any[]>> {
    return apiClient.get<any[]>(`${this.basePath(residentId, type)}?page=${page}&pageSize=${pageSize}`);
  }
  async create(residentId: number, type: ChartingType, data: any): Promise<ApiResponse<any>> {
    return apiClient.post<any>(this.basePath(residentId, type), data);
  }
  async update(residentId: number, type: ChartingType, recordId: number, data: any): Promise<ApiResponse<any>> {
    return apiClient.put<any>(`${this.basePath(residentId, type)}/${recordId}`, data);
  }
  async remove(residentId: number, type: ChartingType, recordId: number): Promise<ApiResponse<any>> {
    return apiClient.delete(`${this.basePath(residentId, type)}/${recordId}`);
  }
}

export const chartingService = new ChartingService();
