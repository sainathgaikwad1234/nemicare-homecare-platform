// Error handling middleware

import { Response, NextFunction } from 'express';
import { logger } from './logger';
import { AppError, ApiResponse } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { helpers } from '../utils/helpers';

export interface CustomRequest extends Express.Request {
  requestId: string;
}

/**
 * Global error handler middleware
 * Must be called last after all other middleware and routes
 */
export const errorHandler = (
  error: Error | AppError,
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.requestId || helpers.generateRequestId();
  const timestamp = helpers.getCurrentTimestamp();

  let statusCode = HTTP_STATUS.INTERNAL_ERROR;
  let code = ERROR_CODES.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof SyntaxError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    code = ERROR_CODES.INVALID_INPUT;
    message = 'Invalid JSON in request body';
  }

  // Log the error
  logger.error('Request failed', {
    requestId,
    statusCode,
    code,
    message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.userId,
  });

  // Build error response
  const errorResponse: ApiResponse = {
    success: false,
    status: statusCode,
    error: {
      code,
      message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    },
    meta: {
      timestamp,
      requestId,
    },
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler - must be called before error handler
 */
export const notFoundHandler = (req: CustomRequest, res: Response) => {
  const timestamp = helpers.getCurrentTimestamp();
  const requestId = req.requestId || helpers.generateRequestId();

  const response: ApiResponse = {
    success: false,
    status: HTTP_STATUS.NOT_FOUND,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      message: `Route ${req.path} not found`,
    },
    meta: {
      timestamp,
      requestId,
    },
  };

  res.status(HTTP_STATUS.NOT_FOUND).json(response);
};

/**
 * Wrap async route handlers to catch errors
 */
export const asyncHandler = (fn: Function) => (req: any, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
