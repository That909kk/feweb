import { api } from './client';
import type { 
  CreateBookingRequest, 
  BookingResponse,
  PaginationParams,
  ApiResponse
} from '../types/api';
import type {
  BookingMediaListResponse
} from '../types/bookingMedia';

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
// Có thể tạo với hoặc không có employee (booking post)
// Theo API-TestCases-Booking-CreateWithMultipleImages.md và API-Booking-Post-Feature.md
// Hỗ trợ nhiều ảnh (0-10 ảnh)
export const createBookingApi = async (
  data: CreateBookingRequest,
  images?: File[]
): Promise<BookingResponse> => {
  try {
    console.log('Creating booking with data:', JSON.stringify(data, null, 2));
    console.log('Number of images:', images?.length || 0);
    
    // Backend LUÔN yêu cầu multipart/form-data cho tất cả booking
    // (Theo API-TestCases-Booking-CreateWithMultipleImages.md)
    const formData = new FormData();
    
    // Gửi booking data dưới dạng JSON string trong field "booking"
    formData.append('booking', JSON.stringify(data));
    
    // Nếu có images, thêm vào formData (tối đa 10 ảnh)
    if (images && images.length > 0) {
      // Validate số lượng ảnh
      if (images.length > 10) {
        throw new Error('Số lượng ảnh không được vượt quá 10');
      }
      
      // Thêm từng ảnh vào formData với key "images"
      images.forEach((image) => {
        // Validate file type
        if (!image.type.startsWith('image/')) {
          throw new Error('Tất cả file phải là định dạng ảnh');
        }
        
        // Validate file size (max 10MB)
        if (image.size > 10 * 1024 * 1024) {
          throw new Error('Kích thước mỗi file không được vượt quá 10MB');
        }
        
        // Skip empty files
        if (image.size > 0) {
          formData.append('images', image);
        }
      });
    }
    
    const response = await api.post<BookingResponse>('/customer/bookings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
// Response: Pagination object trực tiếp (KHÔNG có ApiResponse wrapper)
export const getCustomerBookingsApi = async (
  customerId: string,
  params?: PaginationParams & {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<any> => {
  console.log(`[API] Fetching bookings for customer ${customerId}`);
  
  // Validate customerId format
  if (!customerId) {
    throw new Error('CustomerId is required');
  }
  
  try {
    // Endpoint theo tài liệu: GET /api/v1/customer/bookings/customer/{customerId}
    // API trả về trực tiếp pagination object { content: [], pageable: {}, ... }
    const response = await api.get<{
      content: any[];
      pageable: any;
      totalElements: number;
      totalPages: number;
      last: boolean;
      first: boolean;
      numberOfElements: number;
      size: number;
      number: number;
      empty: boolean;
    }>(
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
    console.log(`[API] Got pagination response for customer bookings:`, response.data);
    // Wrap trong ApiResponse để tương thích với code hiện tại
    return {
      success: true,
      message: 'Lấy danh sách booking thành công',
      data: response.data // Toàn bộ pagination object
    };
  } catch (error: any) {
    console.error(`[API] Error fetching customer bookings:`, error);
    
    // Return empty result instead of throwing error to prevent UI crashes
    if (error?.response?.status === 500) {
      console.warn(`[API] Server error (500) - returning empty bookings list`);
      return {
        success: false,
        message: 'Không thể tải dữ liệu booking lúc này',
        data: { content: [], totalElements: 0, totalPages: 0 }
      };
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
// Endpoint: PUT /api/v1/customer/bookings/{bookingId}/cancel
// Theo API-TestCases-CancelBooking.md
export const cancelBookingApi = async (bookingId: string, reason?: string): Promise<ApiResponse<BookingResponse['data']>> => {
  try {
    console.log(`[API] Cancelling booking ${bookingId} with reason:`, reason);
    const response = await api.put<ApiResponse<BookingResponse['data']>>(
      `/customer/bookings/${bookingId}/cancel`, 
      { reason }
    );
    console.log(`[API] Booking cancelled successfully:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error cancelling booking:`, error);
    throw error;
  }
};

// Convert booking to post
// Endpoint: PUT /api/v1/customer/bookings/{bookingId}/convert-to-post
// Theo API-Booking-Post-Feature.md - Section 2
export const convertBookingToPostApi = async (
  bookingId: string, 
  data: { title: string; imageUrl?: string }
): Promise<ApiResponse<BookingResponse['data']>> => {
  try {
    console.log(`[API] Converting booking ${bookingId} to post:`, data);
    const response = await api.put<ApiResponse<BookingResponse['data']>>(
      `/customer/bookings/${bookingId}/convert-to-post`, 
      data
    );
    console.log(`[API] Booking converted to post successfully:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error converting booking to post:`, error);
    throw error;
  }
};

// Upload booking image
// Endpoint: POST /api/v1/customer/bookings/{bookingId}/upload-image
// Theo API-TestCases-Booking-Image-Upload.md
// Quyền: ROLE_CUSTOMER hoặc ROLE_ADMIN
export const uploadBookingImageApi = async (
  bookingId: string,
  file: File
): Promise<ApiResponse<{
  bookingId: string;
  imageUrl: string;
  publicId: string;
}>> => {
  try {
    console.log(`[API] Uploading image for booking ${bookingId}`);
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<ApiResponse<{
      bookingId: string;
      imageUrl: string;
      publicId: string;
    }>>(
      `/customer/bookings/${bookingId}/upload-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log(`[API] Image uploaded successfully:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error uploading booking image:`, error);
    throw error;
  }
};

// ============ BOOKING MEDIA API ============
// Dựa theo API-TestCases-BookingMedia.md
// Các API này được sử dụng bởi Employee để check-in/check-out

/**
 * Get all media for assignment
 * GET /api/v1/booking-media/assignment/{assignmentId}
 */
export const getMediaByAssignmentApi = async (
  assignmentId: string
): Promise<BookingMediaListResponse> => {
  try {
    console.log(`[API] Fetching media for assignment ${assignmentId}`);
    const response = await api.get<BookingMediaListResponse>(
      `/booking-media/assignment/${assignmentId}`
    );
    console.log(`[API] Media fetched:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error fetching assignment media:`, error);
    throw error;
  }
};

/**
 * Get all media for booking
 * GET /api/v1/booking-media/booking/{bookingId}
 */
export const getMediaByBookingApi = async (
  bookingId: string
): Promise<BookingMediaListResponse> => {
  try {
    console.log(`[API] Fetching media for booking ${bookingId}`);
    const response = await api.get<BookingMediaListResponse>(
      `/booking-media/booking/${bookingId}`
    );
    console.log(`[API] Media fetched:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error fetching booking media:`, error);
    throw error;
  }
};