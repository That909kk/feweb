/**
 * Custom hook for managing Vietnam 2-level address system
 */

import { useState, useEffect, useCallback } from 'react';
import type { Province, Commune, AddressFormData } from '../types/address';
import { fetchProvinces, fetchCommunes, formatAddress } from '../api/address';

export const useAddress = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load provinces on mount
  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    setIsLoadingProvinces(true);
    setError(null);
    
    try {
      const data = await fetchProvinces();
      setProvinces(data); // API trả về array trực tiếp
    } catch (err) {
      setError('Không thể tải danh sách tỉnh/thành phố');
      console.error('Error loading provinces:', err);
    } finally {
      setIsLoadingProvinces(false);
    }
  };

  const loadCommunes = useCallback(async (provinceCode: string) => {
    if (!provinceCode) {
      setCommunes([]);
      return;
    }

    setIsLoadingCommunes(true);
    setError(null);
    
    try {
      const data = await fetchCommunes(provinceCode);
      setCommunes(data); // API trả về array trực tiếp
    } catch (err) {
      setError('Không thể tải danh sách phường/xã');
      console.error('Error loading communes:', err);
      setCommunes([]);
    } finally {
      setIsLoadingCommunes(false);
    }
  }, []);

  const getFullAddress = useCallback((addressData: AddressFormData): string => {
    return formatAddress(
      addressData.streetAddress,
      addressData.communeName,
      addressData.provinceName
    );
  }, []);

  const resetCommunes = useCallback(() => {
    setCommunes([]);
  }, []);

  return {
    provinces,
    communes,
    isLoadingProvinces,
    isLoadingCommunes,
    error,
    loadProvinces,
    loadCommunes,
    resetCommunes,
    getFullAddress
  };
};
