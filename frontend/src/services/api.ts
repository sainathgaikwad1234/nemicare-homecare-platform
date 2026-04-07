/**
 * API Client Service - Centralized HTTP client with authentication, interceptors, error handling
 * Pattern: Singleton service managing all API requests with middleware-style interceptors
 */

interface RequestConfig extends RequestInit {
  data?: any;
}

interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;
  message?: string;
  error?: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  success: boolean;
  status: number;
  data: T[];
  meta: PaginationMeta;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.loadTokens();
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokens(): void {
    this.token = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * Save tokens to localStorage
   */
  public setTokens(accessToken: string, refreshToken: string): void {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Clear tokens from memory and localStorage
   */
  public clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Register callback for unauthorized responses
   */
  public setOnUnauthorized(callback: () => void): void {
    this.onUnauthorized = callback;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.status === 401) {
        this.clearTokens();
        this.onUnauthorized?.();
        return false;
      }

      if (!response.ok) {
        return false;
      }

      const data: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();
      if (data.data) {
        this.setTokens(data.data.accessToken, data.data.refreshToken);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Build request headers with authorization
   */
  private getHeaders(config?: RequestConfig): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Generic request method with error handling and token refresh
   */
  private async request<T>(
    endpoint: string,
    method: string = 'GET',
    config?: RequestConfig,
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const body = config?.data ? JSON.stringify(config.data) : config?.body;

    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(config),
        body,
      });

      // Handle 401 - Try to refresh token
      if (response.status === 401 && retryCount === 0) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          return this.request<T>(endpoint, method, config, 1);
        }
        this.onUnauthorized?.();
      }

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        status: 0,
        error: message,
      };
    }
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET');
  }

  /**
   * GET request with pagination
   */
  public async getPaginated<T>(
    endpoint: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<T>> {
    const response = await this.request<T[] & { meta?: PaginationMeta }>(
      `${endpoint}?page=${page}&pageSize=${pageSize}`,
      'GET'
    );

    if (response.success && response.data) {
      return {
        success: true,
        status: response.status,
        data: Array.isArray(response.data) ? response.data : [response.data],
        meta: (response.data as any)?.meta || {
          page,
          pageSize,
          total: Array.isArray(response.data) ? response.data.length : 1,
          totalPages: 1,
        },
      };
    }

    return {
      success: false,
      status: response.status,
      data: [],
      meta: {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
      },
      ...response,
    };
  }

  /**
   * POST request
   */
  public async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', { data });
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', { data });
  }

  /**
   * DELETE request
   */
  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE');
  }
}

export const apiClient = new ApiClient();
export type { ApiResponse, PaginatedResponse, PaginationMeta, RequestConfig };
