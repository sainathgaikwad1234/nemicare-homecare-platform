// Application constants

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const ERROR_CODES = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  CONFLICT: 'CONFLICT',
  
  // Business logic errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_STATE: 'INVALID_STATE',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

export const ACTION_TYPES = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
};

export const RBAC_PERMISSIONS = {
  // Lead permissions
  VIEW_LEADS: 'leads.read',
  CREATE_LEADS: 'leads.create',
  EDIT_LEADS: 'leads.update',
  DELETE_LEADS: 'leads.delete',
  CONVERT_LEADS: 'leads.convert',
  
  // Legacy/alternative names for compatibility
  LEADS_READ: 'leads.read',
  LEADS_CREATE: 'leads.create',
  LEADS_UPDATE: 'leads.update',
  LEADS_DELETE: 'leads.delete',
  
  // Resident permissions
  VIEW_RESIDENTS: 'residents.read',
  CREATE_RESIDENTS: 'residents.create',
  EDIT_RESIDENTS: 'residents.update',
  DELETE_RESIDENTS: 'residents.delete',
  DISCHARGE_RESIDENTS: 'residents.discharge',
  
  // Legacy/alternative names for compatibility
  RESIDENTS_READ: 'residents.read',
  RESIDENTS_CREATE: 'residents.create',
  RESIDENTS_UPDATE: 'residents.update',
  RESIDENTS_DELETE: 'residents.delete',
  
  // Billing permissions
  BILLING_READ: 'billing.read',
  BILLING_CREATE: 'billing.create',
  BILLING_UPDATE: 'billing.update',
  BILLING_DELETE: 'billing.delete',
  
  // Charting permissions
  CHARTING_READ: 'charting.read',
  CHARTING_CREATE: 'charting.create',
  CHARTING_SIGN: 'charting.sign',
  
  // Admin permissions
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  AUDIT_READ: 'audit.read',
};

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ALGORITHM: 'HS256',
};

export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  HASH_ROUNDS: 10,
};

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // per window
};

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_TIME_MINUTES = 15;

export const PAGINATION_DEFAULTS = {
  SKIP: 0,
  TAKE: 20,
  MAX_TAKE: 100,
};

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};
