import { api } from './client';
import type { ApiResponse } from './client';

// Employee Profile interface based on API response
export interface EmployeeAccount {
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

export interface WorkingZone {
  ward: string;
  city: string;
}

export interface EmployeeProfile {
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
  workingZones: WorkingZone[];
  createdAt: string;
  updatedAt: string;
}

// Update Employee Profile Request interface
export interface UpdateEmployeeProfileRequest {
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

// Assignment interface dựa trên API response THỰC TẾ từ backend (07/11/2025)
// Response from GET /employee/{employeeId}/assignments
// NOTE: Backend trả về serviceAddress, estimatedDurationHours, totalAmount
interface Assignment {
  assignmentId: string;
  bookingCode: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;           // Backend uses "serviceAddress" not "address"
  bookingTime: string;              // Format: "2025-11-15 09:00:00" (space separator)
  estimatedDurationHours: number;   // Backend uses "estimatedDurationHours" with suffix
  pricePerUnit: number;             // Giá mỗi đơn vị
  quantity: number;                 // Số lượng
  totalAmount: number;              // Backend uses "totalAmount" not "subTotal"
  status: string;                   // PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
  assignedAt: string | null;        // Deprecated
  checkInTime: string | null;
  checkOutTime: string | null;
  note: string | null;
  customerEmail?: string;
  customerAvatar?: string;
}

// Employee Bookings API Response Interfaces
interface EmployeeBookingCustomer {
  customerId: string;
  fullName: string;
  avatar: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  birthdate: string;
  rating: number | null;
  vipLevel: string | null;
}

interface EmployeeBookingAddress {
  addressId: string;
  fullAddress: string;
  ward: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

interface EmployeeBookingPromotion {
  promotionId: number;
  promoCode: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number;
}

interface EmployeeBookingService {
  serviceId: number;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  estimatedDurationHours: number;
  iconUrl: string;
  categoryName: string;
  isActive: boolean;
}

interface EmployeeBookingEmployee {
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  rating: number | null;
  employeeStatus: string;
  skills: string[];
  bio: string;
}

interface EmployeeBookingAssignment {
  assignmentId: string;
  employee: EmployeeBookingEmployee;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface EmployeeBookingDetail {
  bookingDetailId: string;
  service: EmployeeBookingService;
  quantity: number;
  pricePerUnit: number;
  formattedPricePerUnit: string;
  subTotal: number;
  formattedSubTotal: string;
  selectedChoices: any[];
  assignments: EmployeeBookingAssignment[];
  duration: string;
  formattedDuration: string;
}

interface EmployeeBookingPayment {
  paymentId: string;
  amount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  transactionCode: string | null;
  createdAt: string;
  paidAt: string | null;
}

interface EmployeeBookingData {
  bookingId: string;
  bookingCode: string;
  customerId: string;
  customerName: string;
  customer: EmployeeBookingCustomer;
  address: EmployeeBookingAddress;
  bookingTime: string;
  note: string;
  totalAmount: number;
  formattedTotalAmount: string;
  status: string;
  title: string | null;
  imageUrls: string[];
  isPost: boolean;
  isVerified: boolean;
  adminComment: string | null;
  promotion: EmployeeBookingPromotion | null;
  bookingDetails: EmployeeBookingDetail[];
  payment: EmployeeBookingPayment | null;
  createdAt: string;
}

interface EmployeeBookingWrapper {
  success: boolean;
  message: string;
  data: EmployeeBookingData;
}

interface EmployeeBookingsResponse {
  totalPages: number;
  data: EmployeeBookingWrapper[];
  success: boolean;
  currentPage: number;
  totalItems: number;
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

// Response interface for all employees
interface AllEmployeesResponse {
  employeeId: string;
  fullName: string;
  email: string;
  skills: string[];
  avatar?: string;
  rating?: string;
  employeeStatus?: string;
}

// Get all employees
// Endpoint: GET /api/v1/employee/
export const getAllEmployeesApi = async (): Promise<AllEmployeesResponse[]> => {
  try {
    console.log('[API] Get All Employees Request');
    const response = await api.get<AllEmployeesResponse[]>('/employee/');
    console.log('[API] Get All Employees Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching all employees:', error);
    throw error;
  }
};

// Response interface for assignments API
interface AssignmentsResponse {
  data: Assignment[];
  message: string;
  totalItems: number;
  success: boolean;
}

// Get employee bookings - NEW API (wraps full booking data)
// Endpoint: GET /api/v1/employee/bookings/{employeeId}
export const getEmployeeBookingsApi = async (
  employeeId: string,
  fromDate?: string,
  page: number = 0,
  size: number = 10
): Promise<EmployeeBookingsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });

    if (fromDate && fromDate.trim() !== '') {
      params.append('fromDate', fromDate);
      console.log(`[API] Fetching employee bookings from date: ${fromDate}`);
    }

    const url = `/employee/bookings/${employeeId}?${params.toString()}`;
    console.log(`[API] Request URL: ${url}`);

    const response = await api.get<EmployeeBookingsResponse>(url);
    console.log('[API] Employee Bookings Response:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching employee bookings:', error);
    throw error;
  }
};

// Get employee assignments with pagination and filtering (LEGACY)
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
    console.log('[API] Assignments Response:', response.data);
    console.log('[API] Assignments Data:', response.data?.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching assignments for employee ${employeeId}:`, error);
    throw error;
  }
};

// Accept Assignment - NEW API (07/11/2025)
// Endpoint: POST /api/v1/employee/assignments/{assignmentId}/accept
export const acceptAssignmentApi = async (
  assignmentId: string,
  employeeId: string
): Promise<ApiResponse<Assignment>> => {
  try {
    console.log(`[API] Accepting assignment ${assignmentId} for employee ${employeeId}`);
    
    const url = `/employee/assignments/${assignmentId}/accept?employeeId=${employeeId}`;
    const response = await api.post<ApiResponse<Assignment>>(url);
    
    console.log('[API] Accept assignment response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error accepting assignment ${assignmentId}:`, error);
    throw error;
  }
};

// Get employee statistics
// NOTE: This endpoint doesn't exist in API documentation - commented out
// export const getEmployeeStatisticsApi = async (employeeId: string): Promise<ApiResponse<{
//   completed: number;
//   upcoming: number;
//   totalEarnings: number;
// }>> => {
//   try {
//     const response = await api.get<ApiResponse<{
//       completed: number;
//       upcoming: number;
//       totalEarnings: number;
//     }>>(`/employee/${employeeId}/statistics`);
//     return response.data;
//   } catch (error) {
//     console.error(`Error fetching statistics for employee ${employeeId}:`, error);
//     throw error;
//   }
// };

// Assignment Statistics Response Interface (API 2025_11_19)
export interface AssignmentStatisticsResponse {
  timeUnit: string;
  startDate: string;
  endDate: string;
  totalAssignments: number;
  countByStatus: {
    PENDING: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
    NO_SHOW: number;
  };
}

// Get employee assignment statistics by status
// API: GET /api/v1/employee/{employeeId}/assignments/statistics
export const getEmployeeAssignmentStatisticsApi = async (
  employeeId: string,
  timeUnit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' = 'MONTH',
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<AssignmentStatisticsResponse>> => {
  try {
    const params: Record<string, string> = { timeUnit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get<ApiResponse<AssignmentStatisticsResponse>>(
      `/employee/${employeeId}/assignments/statistics`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching assignment statistics for employee ${employeeId}:`, error);
    throw error;
  }
};

// Legacy statistics API - now uses assignment statistics
export const getEmployeeStatisticsApi = async (employeeId: string): Promise<ApiResponse<{
  completed: number;
  upcoming: number;
  totalEarnings: number;
}>> => {
  try {
    // Use the new assignment statistics API
    const response = await getEmployeeAssignmentStatisticsApi(employeeId, 'MONTH');
    if (response.success && response.data) {
      const { countByStatus, totalAssignments } = response.data;
      return {
        success: true,
        message: 'Statistics loaded successfully',
        data: {
          completed: countByStatus.COMPLETED || 0,
          upcoming: (countByStatus.PENDING || 0) + (countByStatus.ASSIGNED || 0),
          totalEarnings: 0 // API không cung cấp thông tin thu nhập
        }
      };
    }
    throw new Error('Failed to load statistics');
  } catch (error) {
    console.error(`Error fetching statistics for employee ${employeeId}:`, error);
    // Return default values on error
    return {
      success: true,
      message: 'Statistics not available',
      data: {
        completed: 0,
        upcoming: 0,
        totalEarnings: 0
      }
    };
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

// Check-in assignment
// Endpoint: POST /api/v1/employee/assignments/{assignmentId}/check-in
export const checkInAssignmentApi = async (
  assignmentId: string,
  employeeId: string,
  imageDescription?: string,
  images?: File[]
): Promise<ApiResponse<Assignment>> => {
  try {
    console.log('[API] Check-in Assignment Request:', {
      assignmentId,
      employeeId,
      imageDescription,
      imageCount: images?.length || 0,
      url: `/employee/assignments/${assignmentId}/check-in`
    });
    
    // Tạo FormData để gửi ảnh
    const formData = new FormData();
    
    // Thêm request body dưới dạng JSON string
    const requestBody = {
      employeeId,
      imageDescription: imageDescription || ''
    };
    formData.append('request', new Blob([JSON.stringify(requestBody)], { type: 'application/json' }));
    
    // Thêm các file ảnh
    if (images && images.length > 0) {
      images.forEach(image => {
        formData.append('images', image);
      });
    }
    
    const response = await api.post<ApiResponse<Assignment>>(
      `/employee/assignments/${assignmentId}/check-in`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('[API] Check-in Assignment Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error checking in assignment ${assignmentId}:`, error);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 400) {
      throw new Error('Không thể check-in công việc này - kiểm tra trạng thái và thời gian');
    } else if (error.response?.status === 404) {
      throw new Error('Không tìm thấy công việc này');
    } else {
      throw new Error(error.message || 'Có lỗi xảy ra khi check-in');
    }
  }
};

// Check-out assignment
// Endpoint: POST /api/v1/employee/assignments/{assignmentId}/check-out
export const checkOutAssignmentApi = async (
  assignmentId: string,
  employeeId: string,
  imageDescription?: string,
  images?: File[]
): Promise<ApiResponse<Assignment>> => {
  try {
    console.log('[API] Check-out Assignment Request:', {
      assignmentId,
      employeeId,
      imageDescription,
      imageCount: images?.length || 0,
      url: `/employee/assignments/${assignmentId}/check-out`
    });
    
    // Tạo FormData để gửi ảnh
    const formData = new FormData();
    
    // Thêm request body dưới dạng JSON string
    const requestBody = {
      employeeId,
      imageDescription: imageDescription || ''
    };
    formData.append('request', new Blob([JSON.stringify(requestBody)], { type: 'application/json' }));
    
    // Thêm các file ảnh
    if (images && images.length > 0) {
      images.forEach(image => {
        formData.append('images', image);
      });
    }
    
    const response = await api.post<ApiResponse<Assignment>>(
      `/employee/assignments/${assignmentId}/check-out`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('[API] Check-out Assignment Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error(`[API] Error checking out assignment ${assignmentId}:`, error);
    
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 400) {
      throw new Error('Không thể check-out công việc này - chưa check-in hoặc đã check-out');
    } else if (error.response?.status === 404) {
      throw new Error('Không tìm thấy công việc này');
    } else {
      throw new Error(error.message || 'Có lỗi xảy ra khi check-out');
    }
  }
};

// Get verified bookings awaiting employee
// Endpoint: GET /api/v1/employee/bookings/verified-awaiting-employee
// Theo API-Booking-Verified-Awaiting-Employee.md
export const getVerifiedAwaitingEmployeeBookingsApi = async (
  page: number = 0,
  size: number = 10,
  matchEmployeeZones: boolean = true
): Promise<{
  data: any[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}> => {
  try {
    console.log('[API] Fetching verified awaiting employee bookings:', { page, size, matchEmployeeZones });
    const response = await api.get<{
      data: any[];
      currentPage: number;
      totalItems: number;
      totalPages: number;
    }>('/employee/bookings/verified-awaiting-employee', {
      params: { page, size, matchEmployeeZones }
    });
    console.log('[API] Verified awaiting employee bookings fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching verified awaiting employee bookings:', error);
    throw error;
  }
};

export default {
  getAllEmployeesApi,
  getEmployeeBookingsApi,
  getEmployeeAssignmentsApi,
  acceptAssignmentApi,
  getEmployeeStatisticsApi,
  getEmployeeAssignmentStatisticsApi,
  cancelAssignmentApi,
  getAvailableBookingsApi,
  acceptBookingDetailApi,
  getEmployeeProfileApi,
  updateEmployeeProfileApi,
  checkInAssignmentApi,
  checkOutAssignmentApi,
  getVerifiedAwaitingEmployeeBookingsApi
};