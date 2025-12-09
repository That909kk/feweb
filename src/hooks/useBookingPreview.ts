import { useState, useCallback } from 'react';
import {
  getBookingPreviewApi,
  getMultipleBookingPreviewApi,
  getRecurringBookingPreviewApi
} from '../api/bookingPreview';
import type {
  BookingPreviewRequest,
  BookingPreviewResponse,
  MultipleBookingPreviewRequest,
  MultipleBookingPreviewResponse,
  RecurringBookingPreviewRequest,
  RecurringBookingPreviewResponse,
  BookingPreviewDetailRequest
} from '../types/bookingPreview';

interface UseBookingPreviewReturn {
  // State
  previewData: BookingPreviewResponse | null;
  multiplePreviewData: MultipleBookingPreviewResponse | null;
  recurringPreviewData: RecurringBookingPreviewResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getSinglePreview: (request: BookingPreviewRequest) => Promise<BookingPreviewResponse | null>;
  getMultiplePreview: (request: MultipleBookingPreviewRequest) => Promise<MultipleBookingPreviewResponse | null>;
  getRecurringPreview: (request: RecurringBookingPreviewRequest) => Promise<RecurringBookingPreviewResponse | null>;
  
  // Helpers
  buildPreviewRequest: (params: {
    addressId?: string;
    newAddress?: BookingPreviewRequest['newAddress'];
    bookingTime?: string;
    bookingTimes?: string[];
    services: Array<{
      serviceId: number;
      quantity?: number;
      selectedChoiceIds?: number[];
      expectedPrice?: number;
    }>;
    promoCode?: string;
    paymentMethodId?: number;
    additionalFeeIds?: string[];
    note?: string;
    title?: string;
  }) => BookingPreviewRequest | MultipleBookingPreviewRequest;
  
  // Clear state
  clearPreview: () => void;
}

/**
 * Hook để quản lý booking preview
 * Sử dụng để xem trước thông tin phí trước khi đặt lịch
 */
export const useBookingPreview = (): UseBookingPreviewReturn => {
  const [previewData, setPreviewData] = useState<BookingPreviewResponse | null>(null);
  const [multiplePreviewData, setMultiplePreviewData] = useState<MultipleBookingPreviewResponse | null>(null);
  const [recurringPreviewData, setRecurringPreviewData] = useState<RecurringBookingPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Lấy preview cho single booking
   */
  const getSinglePreview = useCallback(async (
    request: BookingPreviewRequest
  ): Promise<BookingPreviewResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getBookingPreviewApi(request);
      console.log('💰 [PREVIEW RESPONSE] Single booking:', response);
      console.log('💰 [PREVIEW RESPONSE] feeBreakdowns:', response.feeBreakdowns);
      setPreviewData(response);
      
      if (!response.valid && response.errors.length > 0) {
        setError(response.errors.join(', '));
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể lấy thông tin preview';
      setError(errorMessage);
      console.error('Get single preview error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Lấy preview cho multiple bookings
   */
  const getMultiplePreview = useCallback(async (
    request: MultipleBookingPreviewRequest
  ): Promise<MultipleBookingPreviewResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getMultipleBookingPreviewApi(request);
      console.log('💰 [PREVIEW RESPONSE] Multiple booking:', response);
      console.log('💰 [PREVIEW RESPONSE] feeBreakdowns:', response.feeBreakdowns);
      setMultiplePreviewData(response);
      
      if (!response.valid && response.errors.length > 0) {
        setError(response.errors.join(', '));
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể lấy thông tin preview';
      setError(errorMessage);
      console.error('Get multiple preview error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Lấy preview cho recurring booking
   */
  const getRecurringPreview = useCallback(async (
    request: RecurringBookingPreviewRequest
  ): Promise<RecurringBookingPreviewResponse | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getRecurringBookingPreviewApi(request);
      console.log('💰 [PREVIEW RESPONSE] Recurring booking:', response);
      console.log('💰 [PREVIEW RESPONSE] feeBreakdowns:', response.feeBreakdowns);
      setRecurringPreviewData(response);
      
      if (!response.valid && response.errors.length > 0) {
        setError(response.errors.join(', '));
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Không thể lấy thông tin preview';
      setError(errorMessage);
      console.error('Get recurring preview error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Helper function để build request từ booking data
   */
  const buildPreviewRequest = useCallback((params: {
    addressId?: string;
    newAddress?: BookingPreviewRequest['newAddress'];
    bookingTime?: string;
    bookingTimes?: string[];
    services: Array<{
      serviceId: number;
      quantity?: number;
      selectedChoiceIds?: number[];
      expectedPrice?: number;
    }>;
    promoCode?: string;
    paymentMethodId?: number;
    additionalFeeIds?: string[];
    note?: string;
    title?: string;
  }): BookingPreviewRequest | MultipleBookingPreviewRequest => {
    const bookingDetails: BookingPreviewDetailRequest[] = params.services.map(service => ({
      serviceId: service.serviceId,
      quantity: service.quantity || 1,
      selectedChoiceIds: service.selectedChoiceIds || [],
      expectedPrice: service.expectedPrice
    }));

    const baseRequest = {
      addressId: params.addressId,
      newAddress: params.newAddress,
      promoCode: params.promoCode,
      paymentMethodId: params.paymentMethodId,
      additionalFeeIds: params.additionalFeeIds || [],
      note: params.note,
      title: params.title,
      bookingDetails
    };

    // Nếu có nhiều booking times, trả về MultipleBookingPreviewRequest
    if (params.bookingTimes && params.bookingTimes.length > 0) {
      return {
        ...baseRequest,
        bookingTimes: params.bookingTimes
      } as MultipleBookingPreviewRequest;
    }

    // Trả về SingleBookingPreviewRequest
    return {
      ...baseRequest,
      bookingTime: params.bookingTime
    } as BookingPreviewRequest;
  }, []);

  /**
   * Clear tất cả preview data
   */
  const clearPreview = useCallback(() => {
    setPreviewData(null);
    setMultiplePreviewData(null);
    setRecurringPreviewData(null);
    setError(null);
  }, []);

  return {
    previewData,
    multiplePreviewData,
    recurringPreviewData,
    isLoading,
    error,
    getSinglePreview,
    getMultiplePreview,
    getRecurringPreview,
    buildPreviewRequest,
    clearPreview
  };
};

export default useBookingPreview;
