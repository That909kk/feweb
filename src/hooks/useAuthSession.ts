import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getActiveSessionsApi, 
  validateTokenApi, 
  logoutApi 
} from '../api/auth';
import type { 
  ActiveSessionsResponse,
  DeviceType
} from '../types/api';

/**
 * Hook to manage authentication session operations
 * - Get active sessions
 * - Validate token
 * - Logout from specific device or all devices
 */
export const useAuthSession = () => {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ActiveSessionsResponse['data'] | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get active sessions
  const getActiveSessions = useCallback(async () => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getActiveSessionsApi();
      if (response.success) {
        setActiveSessions(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get active sessions');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to get active sessions';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Validate current token
  const validateToken = useCallback(async () => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await validateTokenApi();
      setIsTokenValid(response.valid);
      return response.valid;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to validate token';
      setError(errorMessage);
      setIsTokenValid(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Logout from current device or all devices
  const logout = useCallback(async (deviceType: DeviceType = 'WEB') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await logoutApi(deviceType);
      return response.success;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to logout';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout from all devices
  const logoutAllDevices = useCallback(async () => {
    return logout('ALL');
  }, [logout]);

  return {
    activeSessions,
    isTokenValid,
    isLoading,
    error,
    getActiveSessions,
    validateToken,
    logout,
    logoutAllDevices
  };
};