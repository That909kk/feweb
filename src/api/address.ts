/**
 * Address API for Vietnam 2-level administrative division
 * Sử dụng Backend API thay vì VITE_ADDRESS_KIT_API
 * Dựa theo API-TestCases-VietnamAddress.md
 */

import { api } from './client';
import type { Province, Commune } from '../types/address';

/**
 * Get all Vietnam communes/wards (latest data)
 * Endpoint: GET /api/v1/addresses/vietnam
 * Returns array directly
 */
export const fetchAllCommunes = async (): Promise<Commune[]> => {
  try {
    console.log('[Address API] Fetching all communes from backend');
    const response = await api.get<Commune[]>('/addresses/vietnam');
    console.log('[Address API] All communes fetched');
    return response.data;
  } catch (error) {
    console.error('[Address API] Error fetching all communes:', error);
    throw error;
  }
};

/**
 * Fetch all provinces in Vietnam
 * Endpoint: GET /api/v1/addresses/{effectiveDate}/provinces
 * Returns array directly
 */
export const fetchProvinces = async (effectiveDate: string = '2025-07-01'): Promise<Province[]> => {
  try {
    console.log(`[Address API] Fetching provinces for date ${effectiveDate}`);
    const response = await api.get<Province[]>(`/addresses/${effectiveDate}/provinces`);
    console.log('[Address API] Provinces fetched');
    return response.data;
  } catch (error) {
    console.error('[Address API] Error fetching provinces:', error);
    throw error;
  }
};

/**
 * Fetch all communes for a specific province
 * Endpoint: GET /api/v1/addresses/{effectiveDate}/provinces/{provinceId}/communes
 * Returns array directly
 * @param provinceCode - The province code (e.g., "01" for Hanoi, "79" for Ho Chi Minh City)
 * @param effectiveDate - Effective date (default: 2025-07-01)
 */
export const fetchCommunes = async (
  provinceCode: string, 
  effectiveDate: string = '2025-07-01'
): Promise<Commune[]> => {
  try {
    console.log(`[Address API] Fetching communes for province ${provinceCode}, date ${effectiveDate}`);
    const response = await api.get<Commune[]>(
      `/addresses/${effectiveDate}/provinces/${provinceCode}/communes`
    );
    console.log('[Address API] Communes fetched');
    return response.data;
  } catch (error) {
    console.error('[Address API] Error fetching communes:', error);
    throw error;
  }
};

/**
 * Format address according to Vietnam standard
 * Format: [Số nhà Tên đường], [Phường/Xã], [Tỉnh/Thành phố]
 */
export const formatAddress = (
  streetAddress: string,
  communeName: string,
  provinceName: string
): string => {
  const parts: string[] = [];
  
  if (streetAddress.trim()) {
    parts.push(streetAddress.trim());
  }
  
  if (communeName.trim()) {
    parts.push(communeName.trim());
  }
  
  if (provinceName.trim()) {
    parts.push(provinceName.trim());
  }
  
  return parts.join(', ');
};
