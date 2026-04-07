// JWT token generation and verification

import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';
import { JWT_CONFIG } from '../config/constants';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-change-in-production';

export const jwtUtils = {
  /**
   * Generate access token (short-lived, 15 minutes)
   */
  generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
      algorithm: JWT_CONFIG.ALGORITHM as any,
    });
  },

  /**
   * Generate refresh token (long-lived, 7 days)
   */
  generateRefreshToken(userId: number, email: string): string {
    return jwt.sign(
      { userId, email },
      REFRESH_SECRET,
      {
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
        algorithm: JWT_CONFIG.ALGORITHM as any,
      }
    );
  },

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_CONFIG.ALGORITHM as any],
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  },

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): { userId: number; email: string } {
    try {
      return jwt.verify(token, REFRESH_SECRET, {
        algorithms: [JWT_CONFIG.ALGORITHM as any],
      }) as { userId: number; email: string };
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  },

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    return jwt.decode(token);
  },
};
