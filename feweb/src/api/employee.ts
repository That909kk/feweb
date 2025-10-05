import { api } from './client';
import type { ApiResponse } from './client';

// Employee Profile interface based on API response
interface EmployeeAccount {
  accountId: string;
  username: string;
  password: string;
  phoneNumber: string;
  status: string;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  roles: Array<{
    roleId: number;
    roleName: string;
  }>;
}

interface EmployeeProfile {
  employeeId: string;
  account: EmployeeAccount;
  avatar: string;
  fullName: string;
  isMale: boolean;
  email: string;
  birthdate: string;
  hiredDate: string;
  skills: string[];
  bio: string;
  rating: string | null;
  employeeStatus: string;
  createdAt: string;
  updatedAt: string;
}

// Update Employee Profile Request interface
interface UpdateEmployeeProfileRequest {
  avatar: string;
  fullName: string;
  isMale: boolean;
  email: string;
  birthdate: string;
  hiredDate: string;
  skills: string[];
  bio: string;
  rating: string | null;
  employeeStatus: string;
}

// Update Employee Profile Response interface
interface UpdateEmployeeProfileResponse {
  employeeId: string;
  avatar: string;
  fullName: string;
  isMale: boolean;
  email: string;
  birthdate: string;
  hiredDate: string;
  skills: string[];
  bio: string;
  rating: string;
  employeeStatus: string;
}

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

// Available Booking interface - matches real API response
interface AvailableBooking {
  bookingDetailId: string;  // Changed from detailId
  bookingCode: string;
  serviceName: string;
  serviceAddress: string;   // Changed from address
  bookingTime: string;      // Format: "2024-09-26 09:30:00"
  estimatedDurationHours: number;  // Changed from estimatedDuration
  requiredEmployees: number;       // Changed from quantity
}

// Cancel Assignment Request interface
interface CancelAssignmentRequest {
  reason: string;
  employeeId: string;
}

// Accept Booking Detail Response interface
interface AcceptBookingResponse {
  assignmentId: string;
  bookingCode: string;
  serviceName: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: number;
  price: number;
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
    // Validate input
    if (!assignmentId || !assignmentId.trim()) {
      throw new Error('Assignment ID không hợp lệ');
    }
    
    if (!cancelRequest.reason || !cancelRequest.reason.trim()) {
      throw new Error('Lý do hủy không được để trống');
    }
    
    if (!cancelRequest.employeeId || !cancelRequest.employeeId.trim()) {
      throw new Error('Employee ID không hợp lệ');
    }
    
    console.log('[API] Cancel Assignment Request:', {
      assignmentId: assignmentId.trim(),
      cancelRequest: {
        ...cancelRequest,
        reason: cancelRequest.reason.trim()
      },
      url: `/employee/assignments/${assignmentId.trim()}/cancel`
    });
    
    const response = await api.post<ApiResponse<void>>(
      `/employee/assignments/${assignmentId.trim()}/cancel`, 
      {
        ...cancelRequest,
        reason: cancelRequest.reason.trim()
      }
    );
    
    console.log('[API] Cancel Assignment Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error canceling assignment ${assignmentId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    // Throw error with more details
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 500) {
      throw new Error('Lỗi server khi hủy công việc. Vui lòng kiểm tra console để xem chi tiết.');
    } else if (error.response?.status === 404) {
      throw new Error('Không tìm thấy assignment này');
    } else if (error.response?.status === 403) {
      throw new Error('Bạn không có quyền hủy assignment này');
    } else {
      throw new Error(error.message || 'Có lỗi xảy ra khi hủy công việc');
    }
  }
};

// Get available bookings
let apiCallCount = 0; // Debug counter

export const getAvailableBookingsApi = async (
  employeeId: string,
  page: number = 0,
  size: number = 10
): Promise<{
  data: AvailableBooking[];
  message: string;
  totalItems: number;
  success: boolean;
}> => {
  try {
    apiCallCount++;
    console.log(`[API] Get Available Bookings Request #${apiCallCount}:`, {
      employeeId,
      page,
      size,
      url: `/employee/available-bookings?employeeId=${employeeId}&page=${page}&size=${size}`,
      timestamp: new Date().toLocaleTimeString()
    });

    const params = new URLSearchParams({
      employeeId: employeeId,
      page: page.toString(),
      size: size.toString()
    });
    
    const response = await api.get<{
      data: AvailableBooking[];
      message: string;
      totalItems: number;
      success: boolean;
    }>(`/employee/available-bookings?${params.toString()}`);
    
    console.log('[API] Get Available Bookings Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error fetching available bookings for employee ${employeeId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      config: {
        url: error.config?.url,
        method: error.config?.method
      }
    });
    throw error;
  }
};

// Accept booking detail
export const acceptBookingDetailApi = async (
  detailId: string,
  employeeId: string
): Promise<ApiResponse<AcceptBookingResponse>> => {
  try {
    console.log('[API] Accept Booking Detail Request:', {
      detailId,
      employeeId,
      url: `/employee/booking-details/${detailId}/accept?employeeId=${employeeId}`
    });
    
    const response = await api.post<ApiResponse<AcceptBookingResponse>>(
      `/employee/booking-details/${detailId}/accept?employeeId=${employeeId}`
    );
    
    console.log('[API] Accept Booking Detail Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error accepting booking detail ${detailId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Throw error with better message
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 400) {
      throw new Error('Không thể nhận công việc này - có thể đã có người nhận hoặc có xung đột lịch');
    } else if (error.response?.status === 404) {
      throw new Error('Không tìm thấy công việc này');
    } else {
      throw new Error(error.message || 'Có lỗi xảy ra khi nhận công việc');
    }
  }
};

// Get employee profile by ID
export const getEmployeeProfileApi = async (employeeId: string): Promise<ApiResponse<EmployeeProfile>> => {
  try {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(`[API] Get Employee Profile Request:`, {
        employeeId,
        url: `/employee/${employeeId}`
      });
    }
    
    const response = await api.get<ApiResponse<EmployeeProfile>>(`/employee/${employeeId}`);
    
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('[API] Get Employee Profile Response:', response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error fetching employee profile ${employeeId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Throw error with better message
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 404) {
      throw new Error('Không tìm thấy thông tin nhân viên');
    } else if (error.response?.status === 403) {
      throw new Error('Bạn không có quyền xem thông tin nhân viên này');
    } else {
      throw new Error(error.message || 'Có lỗi xảy ra khi tải thông tin nhân viên');
    }
  }
};

// Update employee profile
export const updateEmployeeProfileApi = async (
  employeeId: string, 
  profileData: UpdateEmployeeProfileRequest
): Promise<UpdateEmployeeProfileResponse> => {
  try {
    // Only log in development
    if (import.meta.env.DEV) {
      console.log(`[API] Update Employee Profile Request:`, {
        employeeId,
        profileData,
        url: `/employee/${employeeId}`
      });
    }
    
    const response = await api.put<UpdateEmployeeProfileResponse>(`/employee/${employeeId}`, profileData);
    
    // Only log in development
    if (import.meta.env.DEV) {
      console.log('[API] Update Employee Profile Response:', response.data);
    }
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error updating employee profile ${employeeId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Throw error with better message
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 400) {
      throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.');
    } else if (error.response?.status === 403) {
      throw new Error('Bạn không có quyền cập nhật thông tin nhân viên này');
    } else if (error.response?.status === 404) {
      throw new Error('Không tìm thấy thông tin nhân viên');
    } else {
      throw new Error(error.message || 'Có lỗi xảy ra khi cập nhật thông tin nhân viên');
    }
  }
};

export default {
  getEmployeeAssignmentsApi,
  updateAssignmentStatusApi,
  getEmployeeStatisticsApi,
  cancelAssignmentApi,
  getAvailableBookingsApi,
  acceptBookingDetailApi,
  getEmployeeProfileApi,
  updateEmployeeProfileApi
};