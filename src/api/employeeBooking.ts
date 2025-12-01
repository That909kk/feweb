import { api } from './client';
import type { ApiResponse } from './client';
import type { BookingDetail } from '../types/api';

/**
 * Employee Booking Details API
 * Base URL: /api/v1/employee/booking-details
 */

// Accept a booking detail
export const acceptBookingDetailApi = async (
  bookingDetailId: string,
  employeeId: string
): Promise<ApiResponse<BookingDetail>> => {
  console.log(`[API] Calling POST /employee/booking-details/${bookingDetailId}/accept with employeeId: ${employeeId}`);
  try {
    const response = await api.post<ApiResponse<BookingDetail>>(
      `/employee/booking-details/${bookingDetailId}/accept`, 
      null, 
      { params: { employeeId } }
    );
    console.log(`[API] Response from /employee/booking-details/${bookingDetailId}/accept:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error from /employee/booking-details/${bookingDetailId}/accept:`, error);
    // Handle the specific error when the booking detail already has enough employees
    if (error.response?.status === 400 && 
        error.response?.data?.message === "Chi tiết dịch vụ đã có đủ nhân viên") {
      throw new Error("Chi tiết dịch vụ đã có đủ nhân viên");
    }
    throw error;
  }
};

// Get booking details by employee ID
export const getEmployeeBookingDetailsApi = async (
  employeeId: string
): Promise<ApiResponse<BookingDetail[]>> => {
  console.log(`[API] Calling GET /employee/booking-details with employeeId: ${employeeId}`);
  try {
    const response = await api.get<ApiResponse<BookingDetail[]>>(
      `/employee/booking-details`, 
      { params: { employeeId } }
    );
    console.log(`[API] Response from /employee/booking-details:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error from /employee/booking-details:`, error);
    throw error;
  }
};

// Get available booking details for employees to accept
export const getAvailableBookingDetailsApi = async (): Promise<ApiResponse<BookingDetail[]>> => {
  console.log(`[API] Calling GET /employee/booking-details/available`);
  try {
    const response = await api.get<ApiResponse<BookingDetail[]>>(`/employee/booking-details/available`);
    console.log(`[API] Response from /employee/booking-details/available:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error from /employee/booking-details/available:`, error);
    throw error;
  }
};

// Start a booking detail (mark as in-progress)
export const startBookingDetailApi = async (
  bookingDetailId: string
): Promise<ApiResponse<BookingDetail>> => {
  const response = await api.post<ApiResponse<BookingDetail>>(
    `/employee/booking-details/${bookingDetailId}/start`
  );
  return response.data;
};

// Complete a booking detail
export const completeBookingDetailApi = async (
  bookingDetailId: string
): Promise<ApiResponse<BookingDetail>> => {
  const response = await api.post<ApiResponse<BookingDetail>>(
    `/employee/booking-details/${bookingDetailId}/complete`
  );
  return response.data;
};