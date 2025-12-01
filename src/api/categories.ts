import { api } from './client';
import type { ApiResponse } from './client';
import type { Category, CategoryWithServices } from '../types/api';

/**
 * Category API - Customer Categories
 * Base URL: /api/v1/customer/categories
 * Requires: Authorization header, CUSTOMER/EMPLOYEE/ADMIN role, service.view permission
 */

// Get all active categories
export const getCategoriesApi = async (): Promise<ApiResponse<Category[]>> => {
  const response = await api.get<ApiResponse<Category[]>>('/customer/categories');
  return response.data;
};

// Get category with services by ID
export const getCategoryServicesApi = async (categoryId: number): Promise<ApiResponse<CategoryWithServices>> => {
  const response = await api.get<ApiResponse<CategoryWithServices>>(`/customer/categories/${categoryId}/services`);
  return response.data;
};

// Get service count for a category
export const getCategoryServiceCountApi = async (categoryId: number): Promise<ApiResponse<{categoryId: number, serviceCount: number}>> => {
  const response = await api.get<ApiResponse<{categoryId: number, serviceCount: number}>>(`/customer/categories/${categoryId}/count`);
  return response.data;
};