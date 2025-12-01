import { api } from './client';
import type { ApiResponse } from './client';
import type { 
  GetRoleRequest, 
  GetRoleResponse, 
  LoginRequest, 
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  ValidateTokenResponse,
  ActiveSessionsResponse,
  LogoutResponse,
  CustomerData,
  EmployeeData,
  AdminData,
  UserRole,
  DeviceType
} from '../types/api';

/**
 * Authentication API Service
 * Base URL: /api/v1/auth
 */

// Step 1: Get user roles
export const getRoleApi = async (data: GetRoleRequest): Promise<GetRoleResponse> => {
  const response = await api.post<GetRoleResponse>('/auth/get-role', data);
  return response.data;
};

// Step 2: Login with selected role
export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
};

// Register new account
export const registerApi = async (data: RegisterRequest): Promise<RegisterResponse> => {
  console.log('[registerApi] Calling POST /auth/register with data:', data);
  const response = await api.post<RegisterResponse>('/auth/register', data);
  console.log('[registerApi] Response received:', response.data);
  return response.data;
};

// Refresh access token
export const refreshTokenApi = async (refreshToken: string): Promise<RefreshTokenResponse> => {
  const response = await api.post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken });
  return response.data;
};

// Get active sessions
export const getActiveSessionsApi = async (): Promise<ActiveSessionsResponse> => {
  const response = await api.get<ActiveSessionsResponse>('/auth/sessions');
  return response.data;
};

// Validate token
export const validateTokenApi = async (): Promise<ValidateTokenResponse> => {
  const response = await api.get<ValidateTokenResponse>('/auth/validate-token');
  return response.data;
};

// Logout with optional deviceType (default is current device)
export const logoutApi = async (deviceType: DeviceType = 'WEB'): Promise<LogoutResponse> => {
  try {
    // The access token from localStorage will be automatically sent in the Authorization header
    // by the interceptor in client.ts
    
    // Send POST request to logout endpoint with access token in Authorization header
    const response = await api.post<LogoutResponse>('/auth/logout', null, {
      params: deviceType !== 'WEB' ? { deviceType } : undefined
    });
    
    // After successful response, clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedRole');
    localStorage.removeItem('expireIn');
    localStorage.removeItem('deviceType');
    
    // Clear role-specific IDs
    localStorage.removeItem('adminProfileId');
    localStorage.removeItem('customerId');
    localStorage.removeItem('employeeId');
    
    console.log('[API] Logout successful:', response.data);
    return response.data;
  } catch (error) {
    // Log error but still clear localStorage and consider the logout successful from the UI perspective
    console.warn('Logout API call failed:', error);
    
    // Clear all authentication data from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedRole');
    localStorage.removeItem('expireIn');
    localStorage.removeItem('deviceType');
    localStorage.removeItem('accountId');
    localStorage.removeItem('adminProfileId');
    localStorage.removeItem('customerId');
    localStorage.removeItem('employeeId');
    
    // Return mock response for UI that matches the expected format from server
    return {
      success: true,
      message: 'Đăng xuất thành công',
      deviceType: 'WEB',
      data: null
    };
  }
};

// Get admin profile by ID
export const getAdminProfile = async (adminId: string): Promise<ApiResponse<AdminData>> => {
  const response = await api.get<ApiResponse<AdminData>>(`/admin/${adminId}`);
  return response.data;
};

// Get customer profile by ID
export const getCustomerProfile = async (customerId: string): Promise<ApiResponse<CustomerData>> => {
  const response = await api.get<ApiResponse<CustomerData>>(`/customer/${customerId}`);
  return response.data;
};

// Get employee profile by ID
export const getEmployeeProfile = async (employeeId: string): Promise<ApiResponse<EmployeeData>> => {
  const response = await api.get<ApiResponse<EmployeeData>>(`/employee/${employeeId}`);
  return response.data;
};

// Update profile based on role
export const updateProfileApi = async (
  role: UserRole,
  id: string,
  data: Partial<CustomerData | EmployeeData | AdminData>
): Promise<ApiResponse<CustomerData | EmployeeData | AdminData>> => {
  const endpoint = role === 'ADMIN' ? `/admin/${id}` : 
                 role === 'CUSTOMER' ? `/customer/${id}` : 
                 `/employee/${id}`;
  
  const response = await api.put<ApiResponse<CustomerData | EmployeeData | AdminData>>(endpoint, data);
  return response.data;
};

// Utility function to get profile based on role
export const getUserProfile = async (
  role: UserRole, 
  userId: string
): Promise<CustomerData | EmployeeData | AdminData> => {
  switch (role) {
    case 'ADMIN':
      const adminResponse = await getAdminProfile(userId);
      return adminResponse.data;
    case 'CUSTOMER':
      const customerResponse = await getCustomerProfile(userId);
      return customerResponse.data;
    case 'EMPLOYEE':
      const employeeResponse = await getEmployeeProfile(userId);
      return employeeResponse.data;
    default:
      throw new Error(`Unsupported role: ${role}`);
  }
};

// Change password
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export const changePasswordApi = async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  const response = await api.post<ChangePasswordResponse>('/auth/change-password', data);
  return response.data;
};