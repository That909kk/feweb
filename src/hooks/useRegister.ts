import { useState } from 'react';
import { registerApi } from '../api/auth';
import type { RegisterRequest, RegisterResponse } from '../types/api';

interface UseRegisterReturn {
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useRegister = (): UseRegisterReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await registerApi(data);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    register,
    loading,
    error,
    clearError
  };
};