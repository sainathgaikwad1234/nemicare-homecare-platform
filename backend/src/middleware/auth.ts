// JWT authentication middleware

import { Response, NextFunction } from 'express';
import { jwtUtils } from '../utils/jwt';
import { AppError, JWTPayload } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { CustomRequest } from './request';
import { logger } from './logger';

/**
 * Verify JWT token from Authorization header
 * Expected format: Bearer <token>
 */
export const authenticate = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        'Missing or invalid authorization header'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const payload = jwtUtils.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch (error) {
      if ((error as any).name === 'TokenExpiredError') {
        throw new AppError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.TOKEN_EXPIRED,
          'Access token has expired. Please refresh your token.'
        );
      }
      throw new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.TOKEN_INVALID,
        'Invalid access token'
      );
    }
  } catch (error) {
    if (error instanceof AppError) {
      logger.warn('Authentication failed', {
        requestId: req.requestId,
        code: error.code,
        path: req.path,
      });
      return next(error);
    }
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if token is missing but verifies if present
 */
export const authenticateOptional = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = jwtUtils.verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Token is invalid but we don't fail, just continue without user context
        logger.debug('Invalid optional token', { requestId: req.requestId });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
