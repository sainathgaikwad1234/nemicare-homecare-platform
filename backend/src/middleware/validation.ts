// Request validation middleware

import { Response, NextFunction } from 'express';
import Joi, { Schema } from 'joi';
import { CustomRequest } from './request';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';
import { logger } from './logger';

export interface ValidationSchemas {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}

/**
 * Validate request body, query, and params against Joi schemas
 * Can accept either schema key string or ValidationSchemas object
 */
export const validate = (
  schemaKeyOrObject: string | ValidationSchemas
) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      let schemasToUse: ValidationSchemas = {};

      // If string key provided, look up in predefined schemas
      if (typeof schemaKeyOrObject === 'string') {
        const schemaKey = schemaKeyOrObject as keyof typeof schemas;
        schemasToUse = { body: schemas[schemaKey] as Schema };
      } else {
        // Otherwise use provided schemas object
        schemasToUse = schemaKeyOrObject;
      }

      const validationErrors: Record<string, string> = {};

      // Validate body
      if (schemasToUse.body) {
        const { error, value } = schemasToUse.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (error) {
          error.details.forEach((detail) => {
            validationErrors[detail.path.join('.')] = detail.message;
          });
        } else {
          req.body = value;
        }
      }

      // Validate query
      if (schemasToUse.query) {
        const { error, value } = schemasToUse.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (error) {
          error.details.forEach((detail) => {
            validationErrors[`query.${detail.path.join('.')}`] = detail.message;
          });
        } else {
          req.query = value;
        }
      }

      // Validate params
      if (schemasToUse.params) {
        const { error, value } = schemasToUse.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true,
        });
        if (error) {
          error.details.forEach((detail) => {
            validationErrors[`params.${detail.path.join('.')}`] = detail.message;
          });
        } else {
          req.params = value;
        }
      }

      // If validation errors exist, throw AppError
      if (Object.keys(validationErrors).length > 0) {
        logger.warn('Validation error', {
          requestId: req.requestId,
          path: req.path,
          errors: validationErrors,
        });

        throw new AppError(
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
          'Request validation failed',
          validationErrors
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Common validation schemas
export const schemas = {
  // Auth schemas
  loginSchema: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required(),
    password: Joi.string().min(8).required(),
  }),

  refreshTokenSchema: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  // Pagination schemas
  paginationSchema: Joi.object({
    skip: Joi.number().integer().min(0).default(0),
    take: Joi.number().integer().min(1).max(100).default(20),
  }),

  // Lead schemas
  createLeadSchema: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY').required(),
    source: Joi.string()
      .valid('WEBSITE', 'PHONE', 'REFERRAL', 'MARKETING', 'FAMILY', 'OTHER')
      .required(),
    companyId: Joi.string().required(),
    facilityId: Joi.string().required(),
    notes: Joi.string().allow(null),
  }),

  updateLeadSchema: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email(),
    phone: Joi.string(),
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    dateOfBirth: Joi.date(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
    source: Joi.string().valid('WEBSITE', 'PHONE', 'REFERRAL', 'MARKETING', 'FAMILY', 'OTHER'),
    status: Joi.string().valid('PROSPECT', 'QUALIFIED', 'IN_PROCESS', 'CONVERTED', 'REJECTED'),
    notes: Joi.string().allow(null),
    followUpDate: Joi.date().allow(null),
  }).min(1), // At least one field must be updated

  // Resident schemas
  createResidentSchema: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    middleName: Joi.string().allow(null),
    email: Joi.string().email().allow(null),
    phone: Joi.string().allow(null),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY').required(),
    ssn: Joi.string().allow(null),
    medicareId: Joi.string().allow(null),
    medicaidId: Joi.string().allow(null),
    emergencyContactName: Joi.string().required(),
    emergencyContactPhone: Joi.string().required(),
    emergencyContactRelationship: Joi.string().required(),
    primaryPhysicianName: Joi.string().allow(null),
    primaryPhysicianPhone: Joi.string().allow(null),
    allergies: Joi.array().items(Joi.string()).allow(null),
    medicalConditions: Joi.array().items(Joi.string()).allow(null),
    currentMedications: Joi.array().items(Joi.string()).allow(null),
    companyId: Joi.string().required(),
    facilityId: Joi.string().required(),
    admissionDate: Joi.date().required(),
    admissionType: Joi.string().valid('NEW_ARRIVAL', 'TRANSFER', 'READMISSION').required(),
    roomId: Joi.string().allow(null),
  }),

  updateResidentSchema: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    middleName: Joi.string().allow(null),
    email: Joi.string().email().allow(null),
    phone: Joi.string().allow(null),
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
    dateOfBirth: Joi.date(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
    emergencyContactName: Joi.string(),
    emergencyContactPhone: Joi.string(),
    emergencyContactRelationship: Joi.string(),
    primaryPhysicianName: Joi.string().allow(null),
    primaryPhysicianPhone: Joi.string().allow(null),
    allergies: Joi.array().items(Joi.string()).allow(null),
    medicalConditions: Joi.array().items(Joi.string()).allow(null),
    currentMedications: Joi.array().items(Joi.string()).allow(null),
    roomId: Joi.string().allow(null),
    notes: Joi.string().allow(null),
  }).min(1), // At least one field must be updated

  // ID parameter schema
  idParamSchema: Joi.object({
    id: Joi.number().integer().required(),
  }),

  companyIdParamSchema: Joi.object({
    companyId: Joi.number().integer().required(),
  }),

  facilityIdParamSchema: Joi.object({
    facilityId: Joi.number().integer().required(),
  }),
};
