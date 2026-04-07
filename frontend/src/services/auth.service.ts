/**
 * Auth Service - Service methods for Authentication API
 * Pattern: Wraps apiClient with type-safe authentication methods
 */

import { apiClient, ApiResponse } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  permissions: string[];
  companyId: string;
  facilityId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/api/v1/auth/login', {
      email,
      password,
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    return apiClient.post<RefreshTokenResponse>('/api/v1/auth/refresh', {
      refreshToken,
    });
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/api/v1/auth/me');
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/api/v1/auth/logout', {});
  }
}

export const authService = new AuthService();
