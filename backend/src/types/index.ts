// Type definitions for Nemicare API

export interface JWTPayload {
  userId: number;
  email: string;
  companyId: number;
  facilityId?: number;
  roleId: number;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  status: number;
  data: {
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      companyId: number;
      facilityId?: number;
    };
    accessToken: string;
    refreshToken: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  status: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export interface AuditLogEntry {
  userId: number;
  companyId: number;
  actionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';
  entityType: string;
  entityId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface PaginationOptions {
  skip: number;
  take: number;
}

export interface ListResponse<T = any> {
  success: boolean;
  status: number;
  data: T[];
  pagination: {
    skip: number;
    take: number;
    total: number;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
