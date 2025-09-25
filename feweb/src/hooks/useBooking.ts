import { useState, useCallback } from 'react';
import { 
  createBookingApi, 
  getCustomerDefaultAddressApi,
  validateBookingApi
} from '../api/booking';
import { getPaymentMethodsApi } from '../api/payment';
import type { 
  CreateBookingRequest, 
  BookingResponse,
  PaymentMethod,
  BookingValidationRequest,
  BookingValidationResponse
} from '../types/api';

interface DefaultAddressResponse {
  addressId: string;
  customerId: string;
  fullAddress: string;
  ward: string;
  district: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export const useBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = async (request: CreateBookingRequest): Promise<BookingResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await createBookingApi(request);
      return response;
    } catch (err: any) {
      let errorMessage;
      
      if (err?.response?.data) {
        errorMessage = err.response.data.message || 'Failed to create booking';
      } else if (err?.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      console.error('Create booking error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultAddress = async (customerId: string): Promise<DefaultAddressResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCustomerDefaultAddressApi(customerId);
      return response;
    } catch (err: any) {
      let errorMessage;
      
      if (err?.response?.data) {
        errorMessage = err.response.data.message || 'Failed to get default address';
      } else if (err?.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      console.error('Get default address error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const validateBooking = async (request: BookingValidationRequest): Promise<BookingValidationResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await validateBookingApi(request);
      return response;
    } catch (err: any) {
      let errorMessage;
      
      console.error('🚨 [HOOK] Validate booking error details:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        responseData: err?.response?.data,
        message: err?.message
      });
      
      if (err?.response?.data) {
        errorMessage = err.response.data.message || 'Failed to validate booking';
      } else if (err?.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      console.error('Validate booking error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentMethods = useCallback(async (): Promise<PaymentMethod[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPaymentMethodsApi();
      // API returns array directly
      return response;
    } catch (err: any) {
      let errorMessage;
      
      if (err?.response?.data) {
        errorMessage = err.response.data.message || 'Failed to get payment methods';
      } else if (err?.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      console.error('Get payment methods error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mock function for customer bookings since API is not available yet
  const getCustomerBookings = useCallback(async (customerId: string): Promise<any[]> => {
    console.log(`[MOCK] Getting bookings for customer: ${customerId}`);
    
    // Return empty array since this API doesn't exist yet
    return [];
  }, []);

  return {
    createBooking,
    getDefaultAddress,
    validateBooking,
    getPaymentMethods,
    getCustomerBookings,
    isLoading,
    error
  };
};