import { api } from './client';
import type { ApiResponse } from './client';

// Assignment interface dựa trên API response thực tế
interface Assignment {
  assignmentId: string;
  bookingCode: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;
  bookingTime: string;
  estimatedDurationHours: number;
  pricePerUnit: number;
  quantity: number;
  totalAmount: number;
  status: string;
  assignedAt: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  note: string | null;
}

// Available Booking interface
interface AvailableBooking {
  detailId: string;
  bookingCode: string;
  serviceName: string;
  address: string;
  bookingTime: string;
  estimatedDuration: number;
  quantity: number;
}

// Cancel Assignment Request interface
interface CancelAssignmentRequest {
  reason: string;
  employeeId: string;
}

/**
 * Employee API Service
 * Base URL: /api/v1/employee
 * Requires: Authorization header, EMPLOYEE/ADMIN role
 */

// Employee API functions - No mock data, only real API calls

// Response interface for assignments API
interface AssignmentsResponse {
  data: Assignment[];
  message: string;
  totalItems: number;
  success: boolean;
}

// Get employee assignments with pagination and filtering
export const getEmployeeAssignmentsApi = async (
  employeeId: string, 
  status?: string, 
  page: number = 0, 
  size: number = 10
): Promise<AssignmentsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    if (status && status.trim() !== '') {
      params.append('status', status);
      console.log(`[API] Fetching assignments with status filter: ${status}`);
    } else {
      console.log(`[API] Fetching all assignments (no status filter)`);
    }
    
    const url = `/employee/${employeeId}/assignments?${params.toString()}`;
    console.log(`[API] Request URL: ${url}`);
    
    const response = await api.get<AssignmentsResponse>(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching assignments for employee ${employeeId}:`, error);
    throw error;
  }
};

// Update assignment status
export const updateAssignmentStatusApi = async (
  assignmentId: string, 
  status: 'ACCEPTED' | 'STARTED' | 'COMPLETED' | 'REJECTED'
): Promise<ApiResponse<Assignment>> => {
  try {
    const response = await api.patch<ApiResponse<Assignment>>(`/employee/assignments/${assignmentId}/status`, {
      status
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating assignment ${assignmentId} status:`, error);
    throw error;
  }
};

// Get employee statistics
export const getEmployeeStatisticsApi = async (employeeId: string): Promise<ApiResponse<{
  completed: number;
  upcoming: number;
  totalEarnings: number;
}>> => {
  try {
    const response = await api.get<ApiResponse<{
      completed: number;
      upcoming: number;
      totalEarnings: number;
    }>>(`/employee/${employeeId}/statistics`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching statistics for employee ${employeeId}:`, error);
    throw error;
  }
};

// Cancel assignment
export const cancelAssignmentApi = async (
  assignmentId: string, 
  cancelRequest: CancelAssignmentRequest
): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(
      `/assignments/${assignmentId}/cancel`, 
      cancelRequest
    );
    return response.data;
  } catch (error) {
    console.error(`Error canceling assignment ${assignmentId}:`, error);
    throw error;
  }
};

// Get available bookings
export const getAvailableBookingsApi = async (
  employeeId: string,
  page: number = 0,
  size: number = 10
): Promise<ApiResponse<{
  data: AvailableBooking[];
  message: string;
  totalItems: number;
  success: boolean;
}>> => {
  try {
    const params = new URLSearchParams({
      employeeId: employeeId,
      page: page.toString(),
      size: size.toString()
    });
    
    const response = await api.get<ApiResponse<{
      data: AvailableBooking[];
      message: string;
      totalItems: number;
      success: boolean;
    }>>(`/available-bookings?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching available bookings for employee ${employeeId}:`, error);
    throw error;
  }
};

// Accept booking detail
export const acceptBookingDetailApi = async (
  detailId: string,
  employeeId: string
): Promise<ApiResponse<Assignment>> => {
  try {
    const response = await api.post<ApiResponse<Assignment>>(
      `/booking-details/${detailId}/accept?employeeId=${employeeId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error accepting booking detail ${detailId}:`, error);
    throw error;
  }
};

export default {
  getEmployeeAssignmentsApi,
  updateAssignmentStatusApi,
  getEmployeeStatisticsApi,
  cancelAssignmentApi,
  getAvailableBookingsApi,
  acceptBookingDetailApi
};