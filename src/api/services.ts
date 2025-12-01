import { api } from './client';
import type { ApiResponse } from './client';
import type { 
  Service, 
  CalculatePriceRequest, 
  CalculatePriceResponse,
  PaginationParams,
  PaginatedResponse,
  ServiceWithOptions,
  SuitableEmployeesResponse
} from '../types/api';

/**
 * Service API - Customer Services
 * Base URL: /api/v1/customer/services
 * Requires: Authorization header, CUSTOMER/EMPLOYEE/ADMIN role
 */

// Get all active services
export const getServicesApi = async (params?: PaginationParams): Promise<ApiResponse<Service[]>> => {
  const response = await api.get<ApiResponse<Service[]>>('/customer/services', {
    params: {
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || 'serviceName',
      direction: params?.direction || 'ASC'
    }
  });
  return response.data;
};

// Get service by ID
export const getServiceByIdApi = async (serviceId: number): Promise<ApiResponse<Service>> => {
  const response = await api.get<ApiResponse<Service>>(`/customer/services/${serviceId}`);
  return response.data;
};

// Calculate service price
export const calculatePriceApi = async (data: CalculatePriceRequest): Promise<CalculatePriceResponse> => {
  const response = await api.post<CalculatePriceResponse>('/customer/services/calculate-price', data);
  return response.data;
};

// Search services by name or category
export const searchServicesApi = async (
  query: string, 
  params?: PaginationParams
): Promise<PaginatedResponse<Service>> => {
  const response = await api.get<PaginatedResponse<Service>>('/customer/services/search', {
    params: {
      q: query,
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || 'serviceName',
      direction: params?.direction || 'ASC'
    }
  });
  return response.data;
};

// Get services by category
export const getServicesByCategoryApi = async (
  categoryId: number,
  params?: PaginationParams
): Promise<PaginatedResponse<Service>> => {
  const response = await api.get<PaginatedResponse<Service>>(`/customer/services/category/${categoryId}`, {
    params: {
      page: params?.page || 0,
      size: params?.size || 20,
      sort: params?.sort || 'serviceName',
      direction: params?.direction || 'ASC'
    }
  });
  return response.data;
};

// Get service options
export const getServiceOptionsApi = async (serviceId: number): Promise<ApiResponse<ServiceWithOptions>> => {
  const response = await api.get<ApiResponse<ServiceWithOptions>>(`/customer/services/${serviceId}/options`);
  return response.data;
};

// Calculate service price with options
// Note: API uses the simple format with selectedChoiceIds array, not the new selections format
export const calculateServicePriceApi = async (data: CalculatePriceRequest): Promise<CalculatePriceResponse> => {
  const response = await api.post<CalculatePriceResponse>('/customer/services/calculate-price', data);
  return response.data;
};

// Get suitable employees for service
// Dựa theo API-TestCases-Service-Suitable.md
// Endpoint: GET /api/v1/customer/services/employee/suitable
export const getSuitableEmployeesApi = async (params: {
  serviceId: number;
  bookingTime: string;
  ward?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}): Promise<SuitableEmployeesResponse> => {
  const response = await api.get<SuitableEmployeesResponse>('/customer/services/employee/suitable', {
    params: {
      serviceId: params.serviceId,
      bookingTime: params.bookingTime,
      ward: params.ward,
      city: params.city,
      latitude: params.latitude,
      longitude: params.longitude
    }
  });
  return response.data;
};

// Get total count of active services
export const getServicesCountApi = async (): Promise<ApiResponse<{ totalServices: number }>> => {
  const response = await api.get<ApiResponse<{ totalServices: number }>>('/customer/services/count');
  return response.data;
};
