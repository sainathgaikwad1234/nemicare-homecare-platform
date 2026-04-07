// Role-Based Access Control (RBAC) middleware

import { Response, NextFunction } from 'express';
import { CustomRequest } from './request';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { logger } from './logger';

/**
 * Verify user has specific permission
 */
export const requirePermission = (requiredPermissions: string | string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    if (!req.user) {
      return next(
        new AppError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.UNAUTHORIZED,
          'User not authenticated'
        )
      );
    }

    const hasPermission = permissions.some((perm) => req.user!.permissions.includes(perm));

    if (!hasPermission) {
      logger.warn('Permission denied', {
        requestId: req.requestId,
        userId: req.user.userId,
        required: permissions,
        available: req.user.permissions,
        path: req.path,
      });

      return next(
        new AppError(
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.FORBIDDEN,
          `You do not have permission to access this resource. Required: ${permissions.join(', ')}`
        )
      );
    }

    next();
  };
};

/**
 * Verify user belongs to the same company
 */
export const requireSameCompany = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(
      new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        'User not authenticated'
      )
    );
  }

  // Extract company ID from request (could be from param, body, or query)
  const requestedCompanyId =
    req.params.companyId ||
    req.body.companyId ||
    req.query.companyId;

  if (requestedCompanyId && parseInt(requestedCompanyId) !== req.user.companyId) {
    logger.warn('Cross-company access attempt', {
      requestId: req.requestId,
      userId: req.user.userId,
      userCompanyId: req.user.companyId,
      requestedCompanyId,
      path: req.path,
    });

    return next(
      new AppError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        'You cannot access resources from other companies'
      )
    );
  }

  next();
};

/**
 * Verify user belongs to the same facility (if applicable)
 */
export const requireSameFacility = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(
      new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        'User not authenticated'
      )
    );
  }

  // Extract facility ID from request
  const requestedFacilityId =
    req.params.facilityId ||
    req.body.facilityId ||
    req.query.facilityId;

  if (
    requestedFacilityId &&
    req.user.facilityId &&
    parseInt(requestedFacilityId) !== req.user.facilityId
  ) {
    logger.warn('Cross-facility access attempt', {
      requestId: req.requestId,
      userId: req.user.userId,
      userFacilityId: req.user.facilityId,
      requestedFacilityId,
      path: req.path,
    });

    return next(
      new AppError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        'You cannot access resources from other facilities'
      )
    );
  }

  next();
};

/**
 * Verify user has admin role (permission-based)
 */
export const requireAdmin = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(
      new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        'User not authenticated'
      )
    );
  }

  // Admin users have all permissions, so check for a common admin permission
  // In a real system, you'd check role.name === 'Admin' or similar
  const adminPermissions = ['users.create', 'users.delete', 'audit.read'];
  const isAdmin = adminPermissions.some((perm) => req.user!.permissions.includes(perm));

  if (!isAdmin) {
    logger.warn('Admin access denied', {
      requestId: req.requestId,
      userId: req.user.userId,
      path: req.path,
    });

    return next(
      new AppError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        'Admin access required'
      )
    );
  }

  next();
};
