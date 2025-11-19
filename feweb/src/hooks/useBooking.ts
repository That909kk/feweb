import { useState, useCallback } from 'react';
import { 
  createBookingApi,
  getCustomerDefaultAddressApi,
  getCustomerBookingsApi,
  updateBookingApi,
  cancelBookingApi,
  convertBookingToPostApi
} from '../api/booking';
import { getUnverifiedBookingsApi, verifyBookingApi } from '../api/admin';
import { getPaymentMethodsApi } from '../api/payment';
import type { 
  CreateBookingRequest, 
  BookingResponse,
  PaymentMethod
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

  const createBooking = async (
    request: CreateBookingRequest | (Omit<CreateBookingRequest, 'bookingTime'> & { bookingTimes: string[] }), 
    images?: File[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await createBookingApi(request, images);
      // Return the data object, not the full response
      return response.data;
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

  const getPaymentMethods = useCallback(async (): Promise<PaymentMethod[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const methods = await getPaymentMethodsApi();
      // API trả về trực tiếp PaymentMethod[], không có wrapper
      return methods || [];
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

  const getCustomerBookings = useCallback(
    async (
      customerId: string,
      params?: {
        status?: string;
        fromDate?: string;
        toDate?: string;
        page?: number;
        size?: number;
        sort?: string;
        direction?: 'ASC' | 'DESC';
      }
    ): Promise<{
      content: any[];
      totalPages: number;
      totalElements: number;
      currentPage: number;
      pageSize: number;
      first: boolean;
      last: boolean;
    }> => {
      if (!customerId) {
        setError('Thiếu thông tin khách hàng');
        return {
          content: [],
          totalPages: 0,
          totalElements: 0,
          currentPage: 0,
          pageSize: 10,
          first: true,
          last: true
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await getCustomerBookingsApi(customerId, params);

        if (!response) {
          return {
            content: [],
            totalPages: 0,
            totalElements: 0,
            currentPage: 0,
            pageSize: 10,
            first: true,
            last: true
          };
        }

        const data = response.data as any;

        // If response has pagination structure with page object
        if (data?.content && Array.isArray(data.content) && data.page) {
          return {
            content: data.content,
            totalPages: data.page.totalPages || 0,
            totalElements: data.page.totalElements || 0,
            currentPage: data.page.number || 0,
            pageSize: data.page.size || 10,
            first: data.page.number === 0,
            last: data.page.number >= (data.page.totalPages - 1)
          };
        }

        // If response has pagination structure (old format)
        if (data?.content && Array.isArray(data.content)) {
          return {
            content: data.content,
            totalPages: data.totalPages || 0,
            totalElements: data.totalElements || 0,
            currentPage: data.number || 0,
            pageSize: data.size || 10,
            first: data.first !== undefined ? data.first : true,
            last: data.last !== undefined ? data.last : true
          };
        }

        // If response is just an array (fallback)
        if (Array.isArray(data)) {
          return {
            content: data,
            totalPages: 1,
            totalElements: data.length,
            currentPage: 0,
            pageSize: data.length,
            first: true,
            last: true
          };
        }

        return {
          content: [],
          totalPages: 0,
          totalElements: 0,
          currentPage: 0,
          pageSize: 10,
          first: true,
          last: true
        };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          'Không thể tải danh sách đơn dịch vụ';
        setError(errorMessage);
        console.error('Get customer bookings error:', err);
        return {
          content: [],
          totalPages: 0,
          totalElements: 0,
          currentPage: 0,
          pageSize: 10,
          first: true,
          last: true
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateBooking = async (
    bookingId: string,
    payload: Partial<CreateBookingRequest>
  ): Promise<BookingResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await updateBookingApi(bookingId, payload);
      return response;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Không thể cập nhật đơn dịch vụ';
      setError(errorMessage);
      console.error('Update booking error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBooking = async (
    bookingId: string,
    reason?: string
  ): Promise<BookingResponse['data'] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await cancelBookingApi(bookingId, reason);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Không thể hủy đơn dịch vụ';
      setError(errorMessage);
      console.error('Cancel booking error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const convertBookingToPost = async (
    bookingId: string,
    data: { title: string; imageUrl?: string }
  ): Promise<BookingResponse['data'] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await convertBookingToPostApi(bookingId, data);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Không thể chuyển đơn thành bài post';
      setError(errorMessage);
      console.error('Convert booking to post error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getUnverifiedBookings = async (
    params?: { page?: number; size?: number }
  ): Promise<any[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getUnverifiedBookingsApi(params);
      
      if (!response) {
        return [];
      }

      const data = response.data as any;

      if (Array.isArray(data)) {
        return data;
      }

      if (data?.content && Array.isArray(data.content)) {
        return data.content;
      }

      return [];
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Không thể tải danh sách booking chưa xác minh';
      setError(errorMessage);
      console.error('Get unverified bookings error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const verifyBooking = async (
    bookingId: string,
    data: { 
      approve: boolean; 
      adminComment?: string;
      rejectionReason?: string;
    }
  ): Promise<BookingResponse['data'] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await verifyBookingApi(bookingId, data);
      return response.data;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Không thể xác minh đơn dịch vụ';
      setError(errorMessage);
      console.error('Verify booking error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createBooking,
    getDefaultAddress,
    getPaymentMethods,
    getCustomerBookings,
    updateBooking,
    cancelBooking,
    convertBookingToPost,
    getUnverifiedBookings,
    verifyBooking,
    isLoading,
    error
  };
};
