import { api } from './client';
import type { 
  CreateBookingRequest, 
  BookingResponse,
  PaginationParams,
  PaginatedResponse,
  ApiResponse
} from '../types/api';

// Interface for default address response
interface DefaultAddressResponse {
  addressId: string;
  customerId: string;
  fullAddress: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

/**
 * Booking API - Customer Bookings
 * Base URL: /api/v1/customer/bookings
 * Requires: Authorization header, CUSTOMER/ADMIN role
 */

// Get customer default address
export const getCustomerDefaultAddressApi = async (customerId: string): Promise<DefaultAddressResponse> => {
  try {
    console.log(`[API] Getting default address for customer: ${customerId}`);
    const response = await api.get<ApiResponse<DefaultAddressResponse>>(`/customer/bookings/${customerId}/default-address`);
    
    if (response.data.success && response.data.data) {
      console.log(`[API] Default address found:`, response.data.data);
      return response.data.data;
    } else {
      throw new Error('No default address found');
    }
  } catch (error: any) {
    console.error('Error getting default address:', error);
    
    if (error.response?.status === 404) {
      throw new Error('Customer has no default address');
    } else if (error.response?.status === 500) {
      console.error('🚨 [API ERROR] Server error when getting default address:', error.response?.data);
      throw new Error('Server error when getting default address - will try fallback');
    }
    
    throw error;
  }
};

// Create new booking
export const createBookingApi = async (data: CreateBookingRequest): Promise<BookingResponse> => {
  try {
    console.log('Creating booking with data:', JSON.stringify(data, null, 2));
    const response = await api.post<BookingResponse>('/customer/bookings', data);
    console.log('Booking API response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error creating booking:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('API Request Error:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
    
    throw error;
  }
};

// Get customer bookings
// Dựa theo API-TestCases-Customer-Bookings.md
// Endpoint: GET /api/v1/customer/bookings/customer/{customerId}
export const getCustomerBookingsApi = async (
  customerId: string,
  params?: PaginationParams & {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<ApiResponse<BookingResponse['data'][] | PaginatedResponse<BookingResponse['data']>['data']>> => {
  console.log(`[API] Fetching bookings for customer ${customerId}`);
  
  // Validate customerId format
  if (!customerId) {
    throw new Error('CustomerId is required');
  }
  
  try {
    // Endpoint theo tài liệu: GET /api/v1/customer/bookings/customer/{customerId}
    const response = await api.get<ApiResponse<PaginatedResponse<BookingResponse['data']>['data']>>(
      `/customer/bookings/customer/${customerId}`,
      {
        params: {
          page: params?.page || 0,
          size: params?.size || 10,
          sort: params?.sort || 'createdAt,desc',
          status: params?.status,
          fromDate: params?.fromDate,
          toDate: params?.toDate
        }
      }
    );
    console.log(`[API] Got response for customer bookings:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error fetching customer bookings:`, error);
    
    // Return empty result instead of throwing error to prevent UI crashes
    if (error?.response?.status === 500) {
      console.warn(`[API] Server error (500) - returning empty bookings list`);
      return {
        success: false,
        message: 'Không thể tải dữ liệu booking lúc này',
        data: []
      } as ApiResponse<BookingResponse['data'][]>;
    }
    
    throw error;
  }
};

// Get booking by ID
export const getBookingByIdApi = async (bookingId: string): Promise<BookingResponse> => {
  const response = await api.get<BookingResponse>(`/customer/bookings/${bookingId}`);
  return response.data;
};

// Update booking
export const updateBookingApi = async (
  bookingId: string, 
  data: Partial<CreateBookingRequest>
): Promise<BookingResponse> => {
  const response = await api.put<BookingResponse>(`/customer/bookings/${bookingId}`, data);
  return response.data;
};

// Cancel booking
export const cancelBookingApi = async (bookingId: string, reason?: string): Promise<BookingResponse> => {
  const response = await api.patch<BookingResponse>(`/customer/bookings/${bookingId}/cancel`, {
    reason
  });
  return response.data;
};