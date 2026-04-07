// Authentication service

import { PrismaClient } from '@prisma/client';
import { passwordUtils } from '../utils/bcrypt';
import { jwtUtils } from '../utils/jwt';
import { AppError } from '../types';
import { HTTP_STATUS, ERROR_CODES, MAX_LOGIN_ATTEMPTS, LOCK_TIME_MINUTES } from '../config/constants';
import { logger } from '../middleware/logger';

const prisma = new PrismaClient();

export const authService = {
  /**
   * Authenticate user with email and password
   * Returns user data and tokens
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        facility: true,
        role: true,
      },
    });

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      throw new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    // Check if account is locked
    if (user.accountLocked) {
      const lockExpiry = user.accountLockedUntil;
      if (lockExpiry && lockExpiry > new Date()) {
        const minutesRemaining = Math.ceil(
          (lockExpiry.getTime() - Date.now()) / (1000 * 60)
        );
        logger.warn('Login attempt on locked account', { userId: user.id, minutesRemaining });
        throw new AppError(
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.ACCOUNT_LOCKED,
          `Account is locked. Try again in ${minutesRemaining} minutes.`
        );
      } else {
        // Lock period expired, unlock the account
        await prisma.user.update({
          where: { id: user.id },
          data: {
            accountLocked: false,
            loginAttempts: 0,
          },
        });
      }
    }

    // Verify password
    const isPasswordValid = await passwordUtils.comparePasswords(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment login attempts
      const newAttempts = user.loginAttempts + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

      const updateData: any = { loginAttempts: newAttempts };
      if (shouldLock) {
        updateData.accountLocked = true;
        updateData.accountLockedUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      logger.warn('Failed login attempt', {
        userId: user.id,
        attempts: newAttempts,
        locked: shouldLock,
      });

      if (shouldLock) {
        throw new AppError(
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.ACCOUNT_LOCKED,
          `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts. Try again in ${LOCK_TIME_MINUTES} minutes.`
        );
      }

      throw new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.INVALID_CREDENTIALS,
        'Invalid email or password'
      );
    }

    // Reset login attempts on successful login
    const permissions = Array.isArray(user.role.permissions)
      ? user.role.permissions
      : Object.values(user.role.permissions || {});

    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lastLogin: new Date(),
      },
    });

    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      facilityId: user.facilityId || undefined,
      roleId: user.roleId,
      permissions: permissions as string[],
    });

    const refreshToken = jwtUtils.generateRefreshToken(user.id, user.email);

    logger.info('User login successful', {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        facilityId: user.facilityId,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = jwtUtils.verifyRefreshToken(refreshToken);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { role: true },
      });

      if (!user || !user.active) {
        throw new AppError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.TOKEN_INVALID,
          'User not found or inactive'
        );
      }

      const permissions = Array.isArray(user.role.permissions)
        ? user.role.permissions
        : Object.values(user.role.permissions || {});

      const newAccessToken = jwtUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        companyId: user.companyId,
        facilityId: user.facilityId || undefined,
        roleId: user.roleId,
        permissions: permissions as string[],
      });

      logger.debug('Token refreshed', { userId: user.id });

      return {
        accessToken: newAccessToken,
        refreshToken, // Return same refresh token (could rotate if needed)
      };
    } catch (error) {
      if ((error as any).name === 'TokenExpiredError') {
        throw new AppError(
          HTTP_STATUS.UNAUTHORIZED,
          ERROR_CODES.TOKEN_EXPIRED,
          'Refresh token has expired. Please login again.'
        );
      }

      logger.warn('Refresh token validation failed', {
        error: (error as any).message,
      });

      throw new AppError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.TOKEN_INVALID,
        'Invalid refresh token'
      );
    }
  },

  /**
   * Get authenticated user's full profile
   */
  async getUserProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            timezone: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODES.NOT_FOUND,
        'User not found'
      );
    }

    return user;
  },

  /**
   * Validate user's permissions for a resource
   */
  async validatePermission(userId: number, requiredPermission: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.active) {
      return false;
    }

    const permissions = Array.isArray(user.role.permissions)
      ? user.role.permissions
      : Object.values(user.role.permissions || {});

    return (permissions as string[]).includes(requiredPermission);
  },
};
