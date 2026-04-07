// HIPAA-compliant audit logging middleware

import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { CustomRequest } from './request';
import { helpers } from '../utils/helpers';
import { ACTION_TYPES } from '../config/constants';
import { logger } from './logger';

export interface AuditLogData {
  userId?: number;
  companyId?: number;
  actionType: keyof typeof ACTION_TYPES;
  entityType: string;
  entityId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

/**
 * Audit logging middleware
 * Logs all requests for HIPAA compliance
 * Must be called after authentication
 */
export const auditLogger = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  // Capture original send function
  const originalSend = res.send;

  // Override send to capture response
  res.send = function (data) {
    // Mark response as being logged
    (res as any).auditLogged = true;

    // Log the request
    logAuditEntry({
      userId: req.user?.userId,
      companyId: req.user?.companyId,
      actionType: 'READ', // Default action
      entityType: 'API_REQUEST',
      ipAddress: helpers.getClientIp(req),
      userAgent: helpers.getUserAgent(req),
    }).catch((error) => {
      logger.error('Failed to log audit entry', {
        requestId: req.requestId,
        error: error.message,
      });
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Log a custom audit entry
 * Use this in business logic for important actions
 */
export const logAuditEntry = async (data: AuditLogData): Promise<void> => {
  try {
    if (!data.companyId) {
      logger.warn('Audit log missing companyId', { data });
      return;
    }

    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        companyId: data.companyId,
        actionType: data.actionType,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timestamp: new Date(),
      },
    });

    logger.debug('Audit log created', {
      userId: data.userId,
      companyId: data.companyId,
      actionType: data.actionType,
      entityType: data.entityType,
    });
  } catch (error) {
    logger.error('Error creating audit log', {
      error: (error as any).message,
      data,
    });
  }
};

/**
 * Middleware to intercept and log CRUD operations
 */
export const logCrudAction = (
  entityType: string,
  actionType: keyof typeof ACTION_TYPES
) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    // Store action info on request for later logging
    (req as any)._auditAction = {
      entityType,
      actionType,
      entityId: req.params.id ? parseInt(req.params.id) : undefined,
    };

    const originalSend = res.send;

    res.send = function (data) {
      // Only log on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user && req.user.companyId) {
        logAuditEntry({
          userId: req.user.userId,
          companyId: req.user.companyId,
          actionType,
          entityType,
          entityId: (req as any)._auditAction?.entityId,
          ipAddress: helpers.getClientIp(req),
          userAgent: helpers.getUserAgent(req),
        }).catch((error) => {
          logger.error('Failed to log audit entry', { error: (error as any).message });
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};
