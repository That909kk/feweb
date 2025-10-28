/**
 * Address API for Vietnam 2-level administrative division
 * Using the new 2025 address system
 */

import type { ProvincesResponse, CommunesResponse } from '../types/address';

// Use proxy in development, direct URL in production
const ADDRESS_API_BASE_URL = import.meta.env.DEV 
  ? '/address-kit/2025-07-01'
  : import.meta.env.VITE_ADDRESS_KIT_API;

/**
 * Fetch all provinces in Vietnam
 */
export const fetchProvinces = async (): Promise<ProvincesResponse> => {
  try {
    const response = await fetch(`${ADDRESS_API_BASE_URL}/provinces`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch provinces: ${response.statusText}`);
    }
    
    const data: ProvincesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

/**
 * Fetch all communes for a specific province
 * @param provinceCode - The province code (e.g., "01" for Hanoi, "79" for Ho Chi Minh City)
 */
export const fetchCommunes = async (provinceCode: string): Promise<CommunesResponse> => {
  try {
    const response = await fetch(`${ADDRESS_API_BASE_URL}/provinces/${provinceCode}/communes`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch communes: ${response.statusText}`);
    }
    
    const data: CommunesResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching communes:', error);
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
