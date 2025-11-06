import { api } from './client';
import type { ApiResponse } from './client';

/**
 * Admin API
 * Base URL: /api/v1/admin
 * Requires: Authorization header, ADMIN role
 */

export interface AdminProfile {
  adminId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  serviceId: number;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  estimatedDurationHours: number;
  recommendedStaff: number;
  iconUrl: string;
  isActive: boolean;
  categoryId: number;
  categoryName: string;
  optionsCount: number;
  pricingRulesCount: number;
}

export interface ServiceOption {
  optionId: number;
  serviceId: number;
  serviceName: string;
  label: string;
  optionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'NUMERIC_INPUT' | 'TEXT_INPUT' | 'SINGLE_CHOICE_RADIO';
  displayOrder: number;
  isRequired: boolean;
  isActive: boolean;
  parentOptionId: number | null;
  parentChoiceId: number | null;
  validationRules: any;
  choices?: ServiceOptionChoice[];
}

export interface ServiceOptionChoice {
  choiceId: number;
  optionId: number;
  label: string;
  isDefault: boolean;
  isActive: boolean;
  displayOrder: number | null;
}

export interface PricingRule {
  ruleId: number;
  serviceId: number;
  serviceName: string;
  ruleName: string;
  conditionLogic: 'AND' | 'OR' | 'ALL';
  priority: number;
  isActive: boolean;
  priceAdjustment: number;
  staffAdjustment: number;
  durationAdjustmentHours: number;
}

export interface ServiceListParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

/**
 * Get admin profile
 * Endpoint: GET /api/v1/admin/{adminId}
 */
export const getAdminProfileApi = async (adminId: string): Promise<ApiResponse<AdminProfile>> => {
  try {
    console.log(`[API] Fetching admin profile for ${adminId}`);
    const response = await api.get<ApiResponse<AdminProfile>>(`/admin/${adminId}`);
    console.log('[API] Admin profile fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching admin profile:', error);
    throw error;
  }
};

/**
 * =========================================
 * SERVICE MANAGEMENT
 * =========================================
 */

/**
 * Get all services with pagination
 * Endpoint: GET /api/v1/admin/services
 */
export const getAdminServicesApi = async (params?: ServiceListParams): Promise<ApiResponse<Service[]>> => {
  try {
    console.log('[API] Fetching admin services with params:', params);
    const response = await api.get<ApiResponse<Service[]>>('/admin/services', { params });
    console.log('[API] Admin services fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching admin services:', error);
    throw error;
  }
};

/**
 * Get service by ID
 * Endpoint: GET /api/v1/admin/services/{serviceId}
 */
export const getAdminServiceByIdApi = async (serviceId: number): Promise<ApiResponse<Service>> => {
  try {
    console.log(`[API] Fetching admin service ${serviceId}`);
    const response = await api.get<ApiResponse<Service>>(`/admin/services/${serviceId}`);
    console.log('[API] Admin service fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching admin service:', error);
    throw error;
  }
};

/**
 * Create new service
 * Endpoint: POST /api/v1/admin/services
 * Content-Type: multipart/form-data
 */
export const createServiceApi = async (data: Partial<Service> & { icon?: File }): Promise<ApiResponse<Service>> => {
  try {
    console.log('[API] Creating service:', data);
    
    const formData = new FormData();
    
    // Add all service fields to FormData
    if (data.name) formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.basePrice !== undefined) formData.append('basePrice', data.basePrice.toString());
    if (data.unit) formData.append('unit', data.unit);
    if (data.estimatedDurationHours !== undefined) formData.append('estimatedDurationHours', data.estimatedDurationHours.toString());
    if (data.recommendedStaff !== undefined) formData.append('recommendedStaff', data.recommendedStaff.toString());
    if (data.categoryId !== undefined) formData.append('categoryId', data.categoryId.toString());
    if (data.iconUrl) formData.append('iconUrl', data.iconUrl);
    if (data.icon) formData.append('icon', data.icon);
    
    const response = await api.post<ApiResponse<Service>>('/admin/services', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('[API] Service created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error creating service:', error);
    throw error;
  }
};

/**
 * Update service
 * Endpoint: PUT /api/v1/admin/services/{serviceId}
 * Content-Type: multipart/form-data
 */
export const updateServiceApi = async (
  serviceId: number, 
  data: Partial<Service> & { icon?: File }
): Promise<ApiResponse<Service>> => {
  try {
    console.log(`[API] Updating service ${serviceId}:`, data);
    
    const formData = new FormData();
    
    // Add all service fields to FormData (only if provided)
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.basePrice !== undefined) formData.append('basePrice', data.basePrice.toString());
    if (data.unit !== undefined) formData.append('unit', data.unit);
    if (data.estimatedDurationHours !== undefined) formData.append('estimatedDurationHours', data.estimatedDurationHours.toString());
    if (data.recommendedStaff !== undefined) formData.append('recommendedStaff', data.recommendedStaff.toString());
    if (data.categoryId !== undefined) formData.append('categoryId', data.categoryId.toString());
    if (data.isActive !== undefined) formData.append('isActive', data.isActive.toString());
    if (data.iconUrl !== undefined) formData.append('iconUrl', data.iconUrl);
    if (data.icon) formData.append('icon', data.icon);
    
    const response = await api.put<ApiResponse<Service>>(`/admin/services/${serviceId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('[API] Service updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error updating service:', error);
    throw error;
  }
};

/**
 * Delete service
 * Endpoint: DELETE /api/v1/admin/services/{serviceId}
 */
export const deleteServiceApi = async (serviceId: number): Promise<ApiResponse<void>> => {
  try {
    console.log(`[API] Deleting service ${serviceId}`);
    const response = await api.delete<ApiResponse<void>>(`/admin/services/${serviceId}`);
    console.log('[API] Service deleted:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error deleting service:', error);
    throw error;
  }
};

/**
 * Activate service
 * Endpoint: PATCH /api/v1/admin/services/{serviceId}/activate
 */
export const activateServiceApi = async (serviceId: number): Promise<ApiResponse<Service>> => {
  try {
    console.log(`[API] Activating service ${serviceId}`);
    const response = await api.patch<ApiResponse<Service>>(`/admin/services/${serviceId}/activate`);
    console.log('[API] Service activated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error activating service:', error);
    throw error;
  }
};

/**
 * =========================================
 * SERVICE OPTION MANAGEMENT
 * =========================================
 */

/**
 * Get all options for a service
 * Endpoint: GET /api/v1/admin/services/{serviceId}/options
 */
export const getAdminServiceOptionsApi = async (serviceId: number): Promise<ApiResponse<ServiceOption[]>> => {
  try {
    console.log(`[API] Fetching options for service ${serviceId}`);
    const response = await api.get<ApiResponse<ServiceOption[]>>(`/admin/services/${serviceId}/options`);
    console.log('[API] Service options fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching service options:', error);
    throw error;
  }
};

/**
 * Get option by ID
 * Endpoint: GET /api/v1/admin/services/options/{optionId}
 */
export const getAdminServiceOptionByIdApi = async (optionId: number): Promise<ApiResponse<ServiceOption>> => {
  try {
    console.log(`[API] Fetching option ${optionId}`);
    const response = await api.get<ApiResponse<ServiceOption>>(`/admin/services/options/${optionId}`);
    console.log('[API] Service option fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching service option:', error);
    throw error;
  }
};

/**
 * Create service option
 * Endpoint: POST /api/v1/admin/services/options
 */
export const createAdminServiceOptionApi = async (
  data: Omit<ServiceOption, 'optionId' | 'serviceName' | 'choices'>
): Promise<ApiResponse<ServiceOption>> => {
  try {
    console.log('[API] Creating option:', data);
    const response = await api.post<ApiResponse<ServiceOption>>('/admin/services/options', data);
    console.log('[API] Service option created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error creating service option:', error);
    throw error;
  }
};

/**
 * Update service option
 * Endpoint: PUT /api/v1/admin/services/options/{optionId}
 */
export const updateAdminServiceOptionApi = async (
  optionId: number,
  data: Partial<Omit<ServiceOption, 'optionId' | 'serviceName' | 'choices'>>
): Promise<ApiResponse<ServiceOption>> => {
  try {
    console.log(`[API] Updating service option ${optionId}:`, data);
    const response = await api.put<ApiResponse<ServiceOption>>(`/admin/services/options/${optionId}`, data);
    console.log('[API] Service option updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error updating service option:', error);
    throw error;
  }
};

/**
 * Delete service option
 * Endpoint: DELETE /api/v1/admin/services/options/{optionId}
 */
export const deleteAdminServiceOptionApi = async (optionId: number): Promise<ApiResponse<void>> => {
  try {
    console.log(`[API] Deleting service option ${optionId}`);
    const response = await api.delete<ApiResponse<void>>(`/admin/services/options/${optionId}`);
    console.log('[API] Service option deleted:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error deleting service option:', error);
    throw error;
  }
};

/**
 * =========================================
 * SERVICE OPTION CHOICE MANAGEMENT
 * =========================================
 */

/**
 * Get all choices for a service option
 * Endpoint: GET /api/v1/admin/services/options/{optionId}/choices
 */
export const getAdminServiceOptionChoicesApi = async (optionId: number): Promise<ApiResponse<ServiceOptionChoice[]>> => {
  try {
    console.log(`[API] Fetching choices for option ${optionId}`);
    const response = await api.get<ApiResponse<ServiceOptionChoice[]>>(`/admin/services/options/${optionId}/choices`);
    console.log('[API] Service option choices fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching service option choices:', error);
    throw error;
  }
};

/**
 * Get choice by ID
 * Endpoint: GET /api/v1/admin/services/choices/{choiceId}
 */
export const getAdminServiceChoiceByIdApi = async (choiceId: number): Promise<ApiResponse<ServiceOptionChoice>> => {
  try {
    console.log(`[API] Fetching choice ${choiceId}`);
    const response = await api.get<ApiResponse<ServiceOptionChoice>>(`/admin/services/choices/${choiceId}`);
    console.log('[API] Service choice fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching service choice:', error);
    throw error;
  }
};

/**
 * Create service option choice
 * Endpoint: POST /api/v1/admin/services/choices
 */
export const createAdminServiceOptionChoiceApi = async (
  data: Omit<ServiceOptionChoice, 'choiceId'>
): Promise<ApiResponse<ServiceOptionChoice>> => {
  try {
    console.log('[API] Creating choice:', data);
    const response = await api.post<ApiResponse<ServiceOptionChoice>>('/admin/services/choices', data);
    console.log('[API] Service option choice created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error creating service option choice:', error);
    throw error;
  }
};

/**
 * Update service option choice
 * Endpoint: PUT /api/v1/admin/services/choices/{choiceId}
 */
export const updateAdminServiceOptionChoiceApi = async (
  choiceId: number,
  data: Partial<Omit<ServiceOptionChoice, 'choiceId' | 'optionId'>>
): Promise<ApiResponse<ServiceOptionChoice>> => {
  try {
    console.log(`[API] Updating service option choice ${choiceId}:`, data);
    const response = await api.put<ApiResponse<ServiceOptionChoice>>(`/admin/services/choices/${choiceId}`, data);
    console.log('[API] Service option choice updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error updating service option choice:', error);
    throw error;
  }
};

/**
 * Delete service option choice
 * Endpoint: DELETE /api/v1/admin/services/choices/{choiceId}
 */
export const deleteAdminServiceOptionChoiceApi = async (choiceId: number): Promise<ApiResponse<void>> => {
  try {
    console.log(`[API] Deleting service option choice ${choiceId}`);
    const response = await api.delete<ApiResponse<void>>(`/admin/services/choices/${choiceId}`);
    console.log('[API] Service option choice deleted:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error deleting service option choice:', error);
    throw error;
  }
};

/**
 * =========================================
 * PRICING RULE MANAGEMENT
 * =========================================
 */

/**
 * Get all pricing rules for a service
 * Endpoint: GET /api/v1/admin/services/{serviceId}/pricing-rules
 */
export const getAdminServicePricingRulesApi = async (serviceId: number): Promise<ApiResponse<PricingRule[]>> => {
  try {
    console.log(`[API] Fetching pricing rules for service ${serviceId}`);
    const response = await api.get<ApiResponse<PricingRule[]>>(`/admin/services/${serviceId}/pricing-rules`);
    console.log('[API] Service pricing rules fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching service pricing rules:', error);
    throw error;
  }
};

/**
 * Get pricing rule by ID
 * Endpoint: GET /api/v1/admin/services/pricing-rules/{ruleId}
 */
export const getAdminPricingRuleByIdApi = async (ruleId: number): Promise<ApiResponse<PricingRule>> => {
  try {
    console.log(`[API] Fetching pricing rule ${ruleId}`);
    const response = await api.get<ApiResponse<PricingRule>>(`/admin/services/pricing-rules/${ruleId}`);
    console.log('[API] Pricing rule fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching pricing rule:', error);
    throw error;
  }
};

/**
 * Create pricing rule
 * Endpoint: POST /api/v1/admin/services/pricing-rules
 */
export const createAdminPricingRuleApi = async (
  data: Omit<PricingRule, 'ruleId' | 'serviceName'>
): Promise<ApiResponse<PricingRule>> => {
  try {
    console.log('[API] Creating pricing rule:', data);
    const response = await api.post<ApiResponse<PricingRule>>('/admin/services/pricing-rules', data);
    console.log('[API] Pricing rule created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error creating pricing rule:', error);
    throw error;
  }
};

/**
 * Update pricing rule
 * Endpoint: PUT /api/v1/admin/services/pricing-rules/{ruleId}
 */
export const updateAdminPricingRuleApi = async (
  ruleId: number,
  data: Partial<Omit<PricingRule, 'ruleId' | 'serviceName'>>
): Promise<ApiResponse<PricingRule>> => {
  try {
    console.log(`[API] Updating pricing rule ${ruleId}:`, data);
    const response = await api.put<ApiResponse<PricingRule>>(`/admin/services/pricing-rules/${ruleId}`, data);
    console.log('[API] Pricing rule updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error updating pricing rule:', error);
    throw error;
  }
};

/**
 * Delete pricing rule
 * Endpoint: DELETE /api/v1/admin/services/pricing-rules/{ruleId}
 */
export const deleteAdminPricingRuleApi = async (ruleId: number): Promise<ApiResponse<void>> => {
  try {
    console.log(`[API] Deleting pricing rule ${ruleId}`);
    const response = await api.delete<ApiResponse<void>>(`/admin/services/pricing-rules/${ruleId}`);
    console.log('[API] Pricing rule deleted:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error deleting pricing rule:', error);
    throw error;
  }
};

/**
 * =========================================
 * BOOKING MANAGEMENT
 * =========================================
 */

/**
 * Get all bookings (Admin only)
 * Endpoint: GET /api/v1/admin/bookings
 * Theo API-TestCases-Admin-GetAllBookings.md
 * Response format:
 * {
 *   success: true,
 *   data: [
 *     { success: true, message: "...", data: {...booking} },
 *     ...
 *   ],
 *   currentPage: 0,
 *   totalItems: 50,
 *   totalPages: 5
 * }
 */
export const getAllBookingsApi = async (params?: {
  page?: number;
  size?: number;
}): Promise<{
  success: boolean;
  data: any[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}> => {
  try {
    console.log('[API] Admin fetching all bookings with params:', params);
    const response = await api.get('/admin/bookings', {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10
      }
    });
    console.log('[API] Got all bookings:', response.data);
    
    // Extract actual booking data from nested wrapper
    const flattenedData = response.data.data?.map((item: any) => {
      // Each item has structure: { success, message, data: {...actualBooking} }
      return item.data || item;
    }) || [];
    
    return {
      ...response.data,
      data: flattenedData
    };
  } catch (error: any) {
    console.error('[API] Error fetching all bookings:', error);
    throw error;
  }
};

/**
 * Get unverified bookings (booking posts cần duyệt)
 * Endpoint: GET /api/v1/admin/bookings/unverified
 * Theo API-Admin-Booking-Verification.md
 */
export const getUnverifiedBookingsApi = async (params?: {
  page?: number;
  size?: number;
}): Promise<any> => {
  try {
    console.log('[API] Admin fetching unverified bookings:', params);
    const response = await api.get('/admin/bookings/unverified', {
      params: {
        page: params?.page || 0,
        size: params?.size || 10
      }
    });
    console.log('[API] Got unverified bookings:', response.data);
    
    // Extract actual booking data from nested wrapper if present
    if (response.data.data && Array.isArray(response.data.data)) {
      const flattenedData = response.data.data.map((item: any) => {
        // Each item might have structure: { success, message, data: {...actualBooking} }
        return item.data || item;
      });
      
      return {
        ...response.data,
        data: flattenedData
      };
    }
    
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching unverified bookings:', error);
    throw error;
  }
};

/**
 * Verify or reject booking post
 * Endpoint: PUT /api/v1/admin/bookings/{bookingId}/verify
 * Theo API-TestCases-Admin-BookingManagement.md
 */
export const verifyBookingApi = async (
  bookingId: string,
  data: {
    approve: boolean;
    rejectionReason?: string;
    adminComment?: string;
  }
): Promise<ApiResponse<any>> => {
  try {
    console.log(`[API] Admin verifying booking ${bookingId}:`, data);
    const response = await api.put<ApiResponse<any>>(
      `/admin/bookings/${bookingId}/verify`,
      data
    );
    console.log('[API] Booking verification result:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error verifying booking:', error);
    throw error;
  }
};

