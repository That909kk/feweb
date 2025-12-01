import { useState } from 'react';
import { updateCustomerApi, uploadCustomerAvatarApi, getActiveCustomersApi, deactivateCustomerApi, getCustomerInfoApi } from '../api';
import type { UpdateCustomerRequest, UpdateCustomerResponse, GetCustomerInfoResponse } from '../types';

interface UseCustomerReturn {
  isLoading: boolean;
  error: string | null;
  updateCustomer: (customerId: string, data: UpdateCustomerRequest) => Promise<UpdateCustomerResponse | null>;
  uploadAvatar: (customerId: string, file: File) => Promise<any | null>;
  getActiveCustomers: () => Promise<Array<{ customerId: string; fullName: string; email: string; }> | null>;
  deactivateCustomer: (customerId: string) => Promise<{ customerId: string; status: string; } | null>;
  getCustomerInfo: (customerId: string) => Promise<GetCustomerInfoResponse['data'] | null>;
  clearError: () => void;
}

export const useCustomer = (): UseCustomerReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const updateCustomer = async (
    customerId: string,
    data: UpdateCustomerRequest
  ): Promise<UpdateCustomerResponse | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      if (!data.fullName?.trim()) {
        throw new Error('Full name is required');
      }

      if (!data.email?.trim()) {
        throw new Error('Email is required');
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
      }

      if (!data.birthdate) {
        throw new Error('Birthdate is required');
      }

      const result = await updateCustomerApi(customerId, data);
      
      if (result.success) {
        console.log('[useCustomer] Customer updated successfully:', result.data);
        return result;
      } else {
        throw new Error(result.message || 'Failed to update customer');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update customer';
      console.error('[useCustomer] Update customer error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (customerId: string, file: File): Promise<any | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate file
      if (!file) {
        throw new Error('Avatar file is required');
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file format. Only image files (JPG, PNG, GIF) are allowed.');
      }

      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size exceeds maximum limit of 5MB.');
      }

      const result = await uploadCustomerAvatarApi(customerId, file);
      
      if (result.success) {
        console.log('[useCustomer] Avatar uploaded successfully:', result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to upload avatar');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload avatar';
      console.error('[useCustomer] Upload avatar error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveCustomers = async (): Promise<Array<{ customerId: string; fullName: string; email: string; }> | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await getActiveCustomersApi();
      
      if (result.success) {
        console.log('[useCustomer] Active customers fetched successfully:', result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch active customers');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch active customers';
      console.error('[useCustomer] Get active customers error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateCustomer = async (customerId: string): Promise<{ customerId: string; status: string; } | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!customerId?.trim()) {
        throw new Error('Customer ID is required');
      }

      const result = await deactivateCustomerApi(customerId);
      
      if (result.success) {
        console.log('[useCustomer] Customer deactivated successfully:', result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to deactivate customer');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to deactivate customer';
      console.error('[useCustomer] Deactivate customer error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerInfo = async (customerId: string): Promise<GetCustomerInfoResponse['data'] | null> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!customerId?.trim()) {
        throw new Error('Customer ID is required');
      }

      const result = await getCustomerInfoApi(customerId);
      
      if (result.success) {
        console.log('[useCustomer] Customer info fetched successfully:', result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch customer info');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch customer info';
      console.error('[useCustomer] Get customer info error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    updateCustomer,
    uploadAvatar,
    getActiveCustomers,
    deactivateCustomer,
    getCustomerInfo,
    clearError,
  };
};