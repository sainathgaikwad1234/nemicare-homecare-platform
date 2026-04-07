// Utility helper functions

import { v4 as uuidv4 } from 'uuid';

export const helpers = {
  /**
   * Generate unique request ID for tracking
   */
  generateRequestId(): string {
    return `req-${uuidv4()}`;
  },

  /**
   * Get current ISO timestamp
   */
  getCurrentTimestamp(): string {
    return new Date().toISOString();
  },

  /**
   * Sanitize user input (basic XSS prevention)
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .trim();
  },

  /**
   * Extract IP address from request
   */
  getClientIp(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );
  },

  /**
   * Get user agent from request
   */
  getUserAgent(req: any): string {
    return req.headers['user-agent'] || 'unknown';
  },

  /**
   * Paginate array
   */
  paginate<T>(items: T[], skip: number = 0, take: number = 20): { items: T[]; total: number } {
    return {
      items: items.slice(skip, skip + take),
      total: items.length,
    };
  },

  /**
   * Deep clone object
   */
  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  },
};
