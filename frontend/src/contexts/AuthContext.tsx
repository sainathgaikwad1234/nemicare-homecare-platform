/**
 * Auth Context - Global authentication state management
 * Pattern: Context + Hook for managing user session, tokens, permissions
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginResponse } from '../services/auth.service';
import { apiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

/**
 * Backend `/auth/login` and `/auth/me` don't return a flat `permissions` array on the user object —
 * permissions live in the JWT (and nested in role.permissions on /me). Hydrate the user with both
 * sources so `hasPermission` works regardless of which endpoint produced it.
 */
function decodeJwtPermissions(token: string): string[] {
  try {
    const payloadB64 = token.split('.')[1];
    const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json);
    return Array.isArray(payload?.permissions) ? payload.permissions : [];
  } catch {
    return [];
  }
}

function hydrateUser(raw: any, token?: string | null): User {
  // Prefer flat user.permissions if backend ever populates it; otherwise pull from role.permissions or JWT
  const fromUser = Array.isArray(raw?.permissions) ? raw.permissions : null;
  const fromRole = Array.isArray(raw?.role?.permissions) ? raw.role.permissions : null;
  const fromToken = token ? decodeJwtPermissions(token) : null;
  const permissions: string[] = fromUser ?? fromRole ?? fromToken ?? [];
  const roleName = typeof raw?.role === 'string' ? raw.role : raw?.role?.name ?? '';
  return { ...raw, role: roleName, permissions };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage and verify token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token && refreshToken) {
        apiClient.setTokens(token, refreshToken);

        // Verify token by fetching current user
        const response = await authService.getProfile();
        if (response.success && response.data) {
          setUser(hydrateUser(response.data, token));
        } else {
          // Token is invalid, clear it
          apiClient.clearTokens();
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Set up unauthorized callback to handle 401 responses
  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    });
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      const { accessToken, refreshToken, user: userData } = response.data;

      // Save tokens and set API client
      apiClient.setTokens(accessToken, refreshToken);
      setUser(hydrateUser(userData, accessToken));

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors during logout
    } finally {
      apiClient.clearTokens();
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 * Throws error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
