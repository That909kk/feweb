import { api } from './client';
import type { ApiResponse } from './client';
import type { 
  AdditionalFee, 
  CreateAdditionalFeeRequest, 
  UpdateAdditionalFeeRequest,
  AdditionalFeePaginatedResponse 
} from '../types/additionalFee';

/**
 * Admin Additional Fee API
 * Base URL: /api/v1/admin/additional-fees
 * Requires: Authorization header, ADMIN role
 * 
 * Dựa theo booking-fee-endpoints.md
 */

export interface AdditionalFeeListParams {
  page?: number;
  size?: number;
  sort?: string; // mặc định 'priority,asc'
}

/**
 * Get all additional fees with pagination
 * Endpoint: GET /api/v1/admin/additional-fees
 */
export const getAdditionalFeesApi = async (
  params?: AdditionalFeeListParams
): Promise<AdditionalFeePaginatedResponse> => {
  try {
    console.log('[API] Fetching additional fees with params:', params);
    const response = await api.get<AdditionalFeePaginatedResponse>(
      '/admin/additional-fees',
      { 
        params: {
          page: params?.page || 0,
          size: params?.size || 10,
          sort: params?.sort || 'priority,asc'
        }
      }
    );
    console.log('[API] Additional fees fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching additional fees:', error);
    throw error;
  }
};

/**
 * Create new additional fee
 * Endpoint: POST /api/v1/admin/additional-fees
 */
export const createAdditionalFeeApi = async (
  data: CreateAdditionalFeeRequest
): Promise<ApiResponse<AdditionalFee>> => {
  try {
    console.log('[API] Creating additional fee:', data);
    const response = await api.post<ApiResponse<AdditionalFee>>(
      '/admin/additional-fees',
      data
    );
    console.log('[API] Additional fee created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error creating additional fee:', error);
    throw error;
  }
};

/**
 * Update additional fee
 * Endpoint: PUT /api/v1/admin/additional-fees/{id}
 */
export const updateAdditionalFeeApi = async (
  id: string,
  data: UpdateAdditionalFeeRequest
): Promise<ApiResponse<AdditionalFee>> => {
  try {
    console.log(`[API] Updating additional fee ${id}:`, data);
    const response = await api.put<ApiResponse<AdditionalFee>>(
      `/admin/additional-fees/${id}`,
      data
    );
    console.log('[API] Additional fee updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error updating additional fee:', error);
    throw error;
  }
};

/**
 * Activate/Deactivate additional fee
 * Endpoint: POST /api/v1/admin/additional-fees/{id}/activate?active=true|false
 */
export const toggleAdditionalFeeActiveApi = async (
  id: string,
  active: boolean
): Promise<ApiResponse<AdditionalFee>> => {
  try {
    console.log(`[API] ${active ? 'Activating' : 'Deactivating'} additional fee ${id}`);
    const response = await api.post<ApiResponse<AdditionalFee>>(
      `/admin/additional-fees/${id}/activate`,
      null,
      { params: { active } }
    );
    console.log('[API] Additional fee activation toggled:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error toggling additional fee activation:', error);
    throw error;
  }
};

/**
 * Set as system surcharge (auto deactivates previous system surcharge)
 * Endpoint: POST /api/v1/admin/additional-fees/{id}/system-surcharge
 */
export const setSystemSurchargeApi = async (
  id: string
): Promise<ApiResponse<AdditionalFee>> => {
  try {
    console.log(`[API] Setting fee ${id} as system surcharge`);
    const response = await api.post<ApiResponse<AdditionalFee>>(
      `/admin/additional-fees/${id}/system-surcharge`
    );
    console.log('[API] System surcharge set:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error setting system surcharge:', error);
    throw error;
  }
};

/**
 * Get active additional fees (for customer booking page)
 * Endpoint: GET /api/v1/admin/additional-fees?active=true
 * Note: Có thể cần endpoint public riêng nếu backend cung cấp
 */
export const getActiveAdditionalFeesApi = async (): Promise<AdditionalFee[]> => {
  try {
    console.log('[API] Fetching active additional fees');
    const response = await api.get<AdditionalFeePaginatedResponse>(
      '/admin/additional-fees',
      { 
        params: {
          page: 0,
          size: 100,
          sort: 'priority,asc'
        }
      }
    );
    // Filter chỉ lấy các fee đang active
    const activeFees = response.data.content.filter(fee => fee.active);
    console.log('[API] Active additional fees:', activeFees);
    return activeFees;
  } catch (error: any) {
    console.error('[API] Error fetching active additional fees:', error);
    // Return empty array nếu không có quyền hoặc lỗi
    return [];
  }
};
