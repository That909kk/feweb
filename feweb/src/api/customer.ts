import { api } from './client';
import type { ApiResponse, UpdateCustomerRequest, UpdateCustomerResponse, GetCustomerInfoResponse } from '../types';

/**
 * Customer API - Customer Profile Management
 * Base URL: /api/v1/customer
 * Requires: Authorization header with valid Bearer token
 */

// Get customer information
export const getCustomerInfoApi = async (customerId: string): Promise<GetCustomerInfoResponse> => {
  try {
    console.log(`[API] Getting customer info: ${customerId}`);
    
    const response = await api.get<GetCustomerInfoResponse>(`/customer/${customerId}`);

    console.log(`[API] Customer info retrieved successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API] Failed to get customer info ${customerId}:`, error);
    throw error;
  }
};

// Update customer profile
export const updateCustomerApi = async (
  customerId: string,
  data: UpdateCustomerRequest
): Promise<UpdateCustomerResponse> => {
  try {
    console.log(`[API] Updating customer profile: ${customerId}`, data);
    
    const response = await api.put<UpdateCustomerResponse>(
      `/customer/${customerId}`,
      data,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[API] Customer update successful:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API] Failed to update customer ${customerId}:`, error);
    throw error;
  }
};

// Get active customers (for admin/employee use)
export const getActiveCustomersApi = async (): Promise<ApiResponse<Array<{
  customerId: string;
  fullName: string;
  email: string;
}>>> => {
  try {
    console.log(`[API] Fetching active customers`);
    
    const response = await api.get<ApiResponse<Array<{
      customerId: string;
      fullName: string;
      email: string;
    }>>>('/customer/active');

    console.log(`[API] Active customers fetched successfully`);
    return response.data;
  } catch (error) {
    console.error(`[API] Failed to fetch active customers:`, error);
    throw error;
  }
};

// Upload customer avatar
export const uploadCustomerAvatarApi = async (
  customerId: string,
  file: File
): Promise<ApiResponse<{
  customer: {
    customerId: string;
    account: any;
    avatar: string;
    fullName: string;
    isMale: boolean;
    email: string;
    birthdate: string;
    rating: number | null;
    vipLevel: string | null;
    createdAt: string;
    updatedAt: string;
  };
  avatarPublicId: string;
}>> => {
  try {
    console.log(`[API] Uploading avatar for customer: ${customerId}`);
    
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post<ApiResponse<{
      customer: {
        customerId: string;
        account: any;
        avatar: string;
        fullName: string;
        isMale: boolean;
        email: string;
        birthdate: string;
        rating: number | null;
        vipLevel: string | null;
        createdAt: string;
        updatedAt: string;
      };
      avatarPublicId: string;
    }>>(
      `/customer/${customerId}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log(`[API] Avatar upload successful:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API] Failed to upload avatar for customer ${customerId}:`, error);
    throw error;
  }
};

// Deactivate customer (admin only)
export const deactivateCustomerApi = async (
  customerId: string
): Promise<ApiResponse<{
  customerId: string;
  status: string;
}>> => {
  try {
    console.log(`[API] Deactivating customer: ${customerId}`);
    
    const response = await api.put<ApiResponse<{
      customerId: string;
      status: string;
    }>>(`/customer/${customerId}/deactivate`);

    console.log(`[API] Customer deactivated successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[API] Failed to deactivate customer ${customerId}:`, error);
    throw error;
  }
};