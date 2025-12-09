import { api } from './client';
import type {
  BookingPreviewRequest,
  BookingPreviewResponse,
  MultipleBookingPreviewRequest,
  MultipleBookingPreviewResponse,
  RecurringBookingPreviewRequest,
  RecurringBookingPreviewResponse
} from '../types/bookingPreview';

/**
 * Booking Preview API
 * Các endpoint để xem trước thông tin phí trước khi đặt lịch
 * Base URL: /api/v1/customer/bookings/preview
 */

/**
 * Preview single booking
 * POST /api/v1/customer/bookings/preview
 * 
 * Trả về thông tin phí chi tiết cho một booking duy nhất
 * 
 * @param request - Thông tin booking cần preview
 * @returns BookingPreviewResponse
 */
export const getBookingPreviewApi = async (
  request: BookingPreviewRequest
): Promise<BookingPreviewResponse> => {
  try {
    console.log('[API] Getting booking preview:', request);
    
    const response = await api.post<BookingPreviewResponse>(
      '/customer/bookings/preview',
      request
    );
    
    console.log('[API] Booking preview response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error getting booking preview:', error);
    
    // Nếu có response từ server, trả về data (có thể chứa validation errors)
    if (error.response?.data) {
      return error.response.data as BookingPreviewResponse;
    }
    
    // Trả về response lỗi mặc định
    return {
      valid: false,
      errors: [error.message || 'Không thể lấy thông tin preview'],
      customerId: null,
      customerName: null,
      customerPhone: null,
      customerEmail: null,
      addressInfo: null,
      usingNewAddress: false,
      bookingTime: null,
      serviceItems: null,
      totalServices: 0,
      totalQuantity: 0,
      subtotal: null,
      formattedSubtotal: null,
      promotionInfo: null,
      discountAmount: null,
      formattedDiscountAmount: null,
      totalAfterDiscount: null,
      formattedTotalAfterDiscount: null,
      feeBreakdowns: null,
      totalFees: null,
      formattedTotalFees: null,
      grandTotal: null,
      formattedGrandTotal: null,
      estimatedDuration: null,
      recommendedStaff: 0,
      note: null,
      paymentMethodId: null,
      paymentMethodName: null
    };
  }
};

/**
 * Preview multiple bookings
 * POST /api/v1/customer/bookings/preview/multiple
 * 
 * Trả về thông tin phí chi tiết cho nhiều booking cùng lúc
 * Các booking chia sẻ cùng services, address, promo code nhưng khác thời gian
 * 
 * @param request - Thông tin các booking cần preview
 * @returns MultipleBookingPreviewResponse
 */
export const getMultipleBookingPreviewApi = async (
  request: MultipleBookingPreviewRequest
): Promise<MultipleBookingPreviewResponse> => {
  try {
    console.log('[API] Getting multiple booking preview:', request);
    
    const response = await api.post<MultipleBookingPreviewResponse>(
      '/customer/bookings/preview/multiple',
      request
    );
    
    console.log('[API] Multiple booking preview response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error getting multiple booking preview:', error);
    
    // Nếu có response từ server, trả về data
    if (error.response?.data) {
      return error.response.data as MultipleBookingPreviewResponse;
    }
    
    // Trả về response lỗi mặc định
    return {
      valid: false,
      errors: [error.message || 'Không thể lấy thông tin preview'],
      bookingCount: 0,
      serviceItems: [],
      totalServices: 0,
      totalQuantityPerBooking: 0,
      subtotalPerBooking: 0,
      formattedSubtotalPerBooking: '0 ₫',
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      addressInfo: {
        addressId: '',
        fullAddress: '',
        ward: '',
        city: ''
      },
      usingNewAddress: false,
      feeBreakdowns: [],
      totalFeesPerBooking: 0,
      formattedTotalFeesPerBooking: '0 ₫',
      promotionInfo: null,
      discountPerBooking: 0,
      formattedDiscountPerBooking: '0 ₫',
      pricePerBooking: 0,
      formattedPricePerBooking: '0 ₫',
      bookingPreviews: [],
      totalEstimatedPrice: 0,
      formattedTotalEstimatedPrice: '0 ₫',
      totalEstimatedDuration: '',
      validBookingsCount: 0,
      invalidBookingsCount: 0,
      invalidBookingTimes: [],
      paymentMethodId: null,
      paymentMethodName: null
    };
  }
};

/**
 * Preview recurring booking
 * POST /api/v1/customer/bookings/preview/recurring
 * 
 * Trả về thông tin phí chi tiết cho booking định kỳ (hàng tuần/hàng tháng)
 * 
 * @param request - Thông tin booking định kỳ cần preview
 * @returns RecurringBookingPreviewResponse
 */
export const getRecurringBookingPreviewApi = async (
  request: RecurringBookingPreviewRequest
): Promise<RecurringBookingPreviewResponse> => {
  try {
    console.log('[API] Getting recurring booking preview:', request);
    
    const response = await api.post<RecurringBookingPreviewResponse>(
      '/customer/bookings/preview/recurring',
      request
    );
    
    console.log('[API] Recurring booking preview response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error getting recurring booking preview:', error);
    
    // Nếu có response từ server, trả về data
    if (error.response?.data) {
      return error.response.data as RecurringBookingPreviewResponse;
    }
    
    // Trả về response lỗi mặc định
    return {
      valid: false,
      errors: [error.message || 'Không thể lấy thông tin preview'],
      serviceItems: [],
      totalServices: 0,
      totalQuantityPerOccurrence: 0,
      subtotalPerOccurrence: 0,
      formattedSubtotalPerOccurrence: '0 ₫',
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      addressInfo: {
        addressId: '',
        fullAddress: '',
        ward: '',
        city: ''
      },
      usingNewAddress: false,
      feeBreakdowns: [],
      totalFeesPerOccurrence: 0,
      formattedTotalFeesPerOccurrence: '0 ₫',
      promotionInfo: null,
      discountPerOccurrence: 0,
      formattedDiscountPerOccurrence: '0 ₫',
      recurrenceType: request.recurrenceType,
      recurrenceDays: request.recurrenceDays,
      recurrenceDescription: '',
      bookingTime: request.bookingTime,
      startDate: request.startDate,
      endDate: request.endDate || null,
      plannedBookingTimes: [],
      occurrenceCount: 0,
      maxPreviewOccurrences: request.maxPreviewOccurrences || 30,
      hasMoreOccurrences: false,
      pricePerOccurrence: 0,
      formattedPricePerOccurrence: '0 ₫',
      totalEstimatedPrice: 0,
      formattedTotalEstimatedPrice: '0 ₫',
      paymentMethodId: null,
      paymentMethodName: null
    };
  }
};
