// Authentication routes

import { Router, Response } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { requestMetadata, CustomRequest } from '../middleware/request';
import { asyncHandler } from '../middleware/errors';
import { helpers } from '../utils/helpers';
import { HTTP_STATUS } from '../config/constants';
import { ApiResponse } from '../types';

const router = Router();

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post(
  '/login',
  validate({ body: schemas.loginSchema }),
  asyncHandler(async (req: CustomRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    const response: ApiResponse = {
      success: true,
      status: HTTP_STATUS.OK,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      meta: {
        timestamp: helpers.getCurrentTimestamp(),
        requestId: req.requestId,
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  })
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  validate({ body: schemas.refreshTokenSchema }),
  asyncHandler(async (req: CustomRequest, res: Response) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    const response: ApiResponse = {
      success: true,
      status: HTTP_STATUS.OK,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      meta: {
        timestamp: helpers.getCurrentTimestamp(),
        requestId: req.requestId,
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  })
);

/**
 * GET /api/v1/auth/me
 * Get authenticated user's profile
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: CustomRequest, res: Response) => {
    const user = await authService.getUserProfile(req.user!.userId);

    const response: ApiResponse = {
      success: true,
      status: HTTP_STATUS.OK,
      data: user,
      meta: {
        timestamp: helpers.getCurrentTimestamp(),
        requestId: req.requestId,
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  })
);

/**
 * POST /api/v1/auth/logout
 * Logout (client-side primarily, server just acknowledges)
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: CustomRequest, res: Response) => {
    const response: ApiResponse = {
      success: true,
      status: HTTP_STATUS.OK,
      data: { message: 'Logged out successfully' },
      meta: {
        timestamp: helpers.getCurrentTimestamp(),
        requestId: req.requestId,
      },
    };

    res.status(HTTP_STATUS.OK).json(response);
  })
);

export default router;
