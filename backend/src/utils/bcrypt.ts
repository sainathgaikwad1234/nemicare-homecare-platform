// Password hashing utilities

import bcrypt from 'bcrypt';
import { PASSWORD_CONFIG } from '../config/constants';

export const passwordUtils = {
  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_CONFIG.HASH_ROUNDS);
  },

  /**
   * Compare plain password with hashed password
   */
  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Validate password strength
   * Returns: { valid: boolean; errors: string[] }
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
      errors.push(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
