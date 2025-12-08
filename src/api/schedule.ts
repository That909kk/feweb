import { api } from './client';
import type { ApiResponse } from './client';
import type { 
  EmployeeScheduleParams, 
  EmployeeSchedule,
  PaginationParams,
  PaginatedResponse,
  WorkingHours,
  SetWorkingHoursRequest,
  SetWeeklyWorkingHoursRequest,
  DailyAvailableSlots,
  AvailableSlotsParams,
  AvailableSlotsRangeParams,
  CheckSlotParams
} from '../types/api';

/**
 * Employee Schedule API
 * Base URL: /api/v1/employee-schedule
 * Requires: Authorization header, role-based access (ADMIN/CUSTOMER/EMPLOYEE)
 */

// Get available employees by filters
export const getAvailableEmployeesApi = async (
  params: EmployeeScheduleParams & PaginationParams
): Promise<PaginatedResponse<EmployeeSchedule>> => {
  const response = await api.get<PaginatedResponse<EmployeeSchedule>>('/employee-schedule', {
    params: {
      status: params.status,
      district: params.district,
      city: params.city,
      from: params.from,
      to: params.to,
      page: params.page || 0,
      size: params.size || 20,
      sort: params.sort || 'rating',
      direction: params.direction || 'DESC'
    }
  });
  return response.data;
};

// Get employee schedule by ID
export const getEmployeeScheduleApi = async (
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<EmployeeSchedule>> => {
  const response = await api.get<ApiResponse<EmployeeSchedule>>(`/employee-schedule/${employeeId}`, {
    params: {
      startDate,
      endDate
    }
  });
  return response.data;
};

// Check employee availability for specific time slot
export const checkEmployeeAvailabilityApi = async (
  employeeId: string,
  date: string,
  timeSlot: string
): Promise<ApiResponse<{ available: boolean; reason?: string }>> => {
  const response = await api.get<ApiResponse<{ available: boolean; reason?: string }>>(
    `/employee-schedule/${employeeId}/availability`,
    {
      params: { date, timeSlot }
    }
  );
  return response.data;
};

// ============================================
// Employee Working Hours API
// Base URL: /api/v1/employee-working-hours
// ============================================

/**
 * Lấy khung giờ làm việc của nhân viên
 */
export const getWorkingHoursApi = async (
  employeeId: string
): Promise<ApiResponse<WorkingHours[]>> => {
  const response = await api.get<ApiResponse<WorkingHours[]>>(
    `/employee-working-hours/${employeeId}`
  );
  return response.data;
};

/**
 * Cài đặt khung giờ làm việc cho một ngày
 */
export const setWorkingHoursApi = async (
  request: SetWorkingHoursRequest
): Promise<ApiResponse<WorkingHours>> => {
  const response = await api.post<ApiResponse<WorkingHours>>(
    '/employee-working-hours',
    request
  );
  return response.data;
};

/**
 * Cài đặt khung giờ làm việc cho cả tuần
 */
export const setWeeklyWorkingHoursApi = async (
  request: SetWeeklyWorkingHoursRequest
): Promise<ApiResponse<WorkingHours[]>> => {
  const response = await api.post<ApiResponse<WorkingHours[]>>(
    '/employee-working-hours/weekly',
    request
  );
  return response.data;
};

/**
 * Khởi tạo khung giờ làm việc mặc định
 */
export const initializeWorkingHoursApi = async (
  employeeId: string
): Promise<ApiResponse<WorkingHours[]>> => {
  const response = await api.post<ApiResponse<WorkingHours[]>>(
    `/employee-working-hours/${employeeId}/initialize`
  );
  return response.data;
};

/**
 * Sao chép khung giờ làm việc từ ngày này sang ngày khác
 */
export const copyWorkingHoursApi = async (
  employeeId: string,
  sourceDay: string,
  targetDay: string
): Promise<ApiResponse<WorkingHours>> => {
  const response = await api.post<ApiResponse<WorkingHours>>(
    `/employee-working-hours/${employeeId}/copy`,
    null,
    { params: { sourceDay, targetDay } }
  );
  return response.data;
};

// ============================================
// Available Slots API
// Base URL: /api/v1/available-slots
// ============================================

/**
 * Lấy danh sách slot khả dụng theo ngày
 */
export const getAvailableSlotsApi = async (
  params: AvailableSlotsParams
): Promise<ApiResponse<DailyAvailableSlots>> => {
  const response = await api.get<ApiResponse<DailyAvailableSlots>>(
    '/available-slots',
    { params }
  );
  return response.data;
};

/**
 * Lấy slot khả dụng cho khoảng thời gian (nhiều ngày)
 */
export const getAvailableSlotsRangeApi = async (
  params: AvailableSlotsRangeParams
): Promise<ApiResponse<DailyAvailableSlots[]>> => {
  const response = await api.get<ApiResponse<DailyAvailableSlots[]>>(
    '/available-slots/range',
    { params }
  );
  return response.data;
};

/**
 * Kiểm tra một slot cụ thể có khả dụng không
 */
export const checkSlotAvailabilityApi = async (
  params: CheckSlotParams
): Promise<ApiResponse<boolean>> => {
  const response = await api.get<ApiResponse<boolean>>(
    '/available-slots/check',
    { params }
  );
  return response.data;
};