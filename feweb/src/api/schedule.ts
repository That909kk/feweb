import { api } from './client';
import type { ApiResponse } from './client';
import type { 
  EmployeeScheduleParams, 
  EmployeeSchedule,
  PaginationParams,
  PaginatedResponse 
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
export const getEmployeeScheduleApi = async (employeeId: string): Promise<ApiResponse<EmployeeSchedule>> => {
  const response = await api.get<ApiResponse<EmployeeSchedule>>(`/employee-schedule/${employeeId}`);
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