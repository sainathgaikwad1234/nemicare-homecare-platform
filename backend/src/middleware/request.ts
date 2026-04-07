// Request ID and metadata middleware

import { Request, Response, NextFunction } from 'express';
import { helpers } from '../utils/helpers';

export interface CustomRequest extends Request {
  requestId: string;
  startTime: number;
  user?: {
    userId: number;
    email: string;
    companyId: number;
    facilityId?: number;
    roleId: number;
    permissions: string[];
  };
}

/**
 * Attach request ID and metadata to every request
 */
export const requestMetadata = (req: CustomRequest, res: Response, next: NextFunction) => {
  req.requestId = helpers.generateRequestId();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  next();
};
