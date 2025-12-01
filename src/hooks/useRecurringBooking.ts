import { useState } from 'react';
import { api } from '../api/client';

export interface RecurringBookingDetail {
  bookingDetailId: string;
  service: {
    serviceId: number;
    name: string;
    description: string;
    basePrice: number;
    unit: string;
    estimatedDurationHours: number;
    iconUrl: string;
    categoryName: string;
    isActive: boolean;
  };
  quantity: number;
  pricePerUnit: number;
  formattedPricePerUnit: string;
  subTotal: number;
  formattedSubTotal: string;
  selectedChoices: any[];
  assignments: any[];
  duration: string;
  formattedDuration: string;
}

export interface RecurringBooking {
  recurringBookingId: string;
  customerId: string;
  customerName: string;
  customer: {
    customerId: string;
    fullName: string;
    avatar: string;
    email: string;
    phoneNumber: string;
    isMale: boolean;
    birthdate: string;
    rating: number | null;
    vipLevel: string | null;
  };
  address: {
    addressId: string;
    fullAddress: string;
    ward: string;
    city: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  };
  recurrenceType: 'WEEKLY' | 'MONTHLY';
  recurrenceTypeDisplay: string;
  recurrenceDays: number[];
  recurrenceDaysDisplay: string;
  bookingTime: string;
  startDate: string;
  endDate: string;
  note: string;
  title: string;
  promotion: any | null;
  recurringBookingDetails: RecurringBookingDetail[];
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  statusDisplay: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  totalGeneratedBookings: number;
  upcomingBookings: number | null;
}

export interface CreateRecurringBookingRequest {
  addressId?: string;
  newAddress?: {
    customerId: string;
    fullAddress: string;
    ward: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  recurrenceType: 'WEEKLY' | 'MONTHLY';
  recurrenceDays: number[];
  bookingTime: string;
  startDate: string;
  endDate: string;
  note?: string;
  title: string;
  promoCode?: string | null;
  bookingDetails: Array<{
    serviceId: number;
    quantity: number;
    selectedChoices?: number[];
  }>;
}

export interface CreateRecurringBookingResponse {
  success: boolean;
  message: string;
  recurringBooking: RecurringBooking;
  generatedBookingIds: string[];
  totalBookingsToBeCreated: number;
}

export interface CancelRecurringBookingRequest {
  reason: string;
}

export interface RecurringBookingListResponse {
  currentPage: number;
  totalItems: number;
  totalPages: number;
  data: RecurringBooking[];
  success: boolean;
}

export const useRecurringBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a recurring booking
   */
  const createRecurringBooking = async (
    customerId: string,
    request: CreateRecurringBookingRequest
  ): Promise<CreateRecurringBookingResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<{ data: CreateRecurringBookingResponse }>(
        `/customer/recurring-bookings/${customerId}`,
        request,
        {
          timeout: 60000 // 60 seconds timeout for recurring booking creation
        }
      );
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Không thể tạo lịch định kỳ';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancel a recurring booking
   */
  const cancelRecurringBooking = async (
    customerId: string,
    recurringBookingId: string,
    request: CancelRecurringBookingRequest
  ): Promise<RecurringBooking> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.put<{ data: RecurringBooking }>(
        `/customer/recurring-bookings/${customerId}/${recurringBookingId}/cancel`,
        request
      );
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Không thể hủy lịch định kỳ';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get list of recurring bookings
   */
  const getRecurringBookings = async (
    customerId: string,
    page: number = 0,
    size: number = 10
  ): Promise<RecurringBookingListResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<RecurringBookingListResponse>(
        `/customer/recurring-bookings/${customerId}`,
        {
          params: { page, size }
        }
      );
      return response.data;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Không thể lấy danh sách lịch định kỳ';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get recurring booking details
   */
  const getRecurringBookingDetails = async (
    customerId: string,
    recurringBookingId: string
  ): Promise<RecurringBooking> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ data: RecurringBooking }>(
        `/customer/recurring-bookings/${customerId}/${recurringBookingId}`
      );
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Không thể lấy chi tiết lịch định kỳ';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createRecurringBooking,
    cancelRecurringBooking,
    getRecurringBookings,
    getRecurringBookingDetails
  };
};
