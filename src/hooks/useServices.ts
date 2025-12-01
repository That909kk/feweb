import { useState, useEffect } from 'react';
import {
  getServicesApi,
  calculatePriceApi,
  getServiceOptionsApi,
  calculateServicePriceApi,
  getSuitableEmployeesApi
} from '../api/services';
import type {
  Service,
  CalculatePriceRequest,
  CalculatePriceResponse,
  ServiceWithOptions,
  SuitableEmployee
} from '../types/api';export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getServicesApi();
      if (response.success) {
        setServices(response.data);
      } else {
        throw new Error(response.message || 'Failed to load services');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to load services';
      setError(errorMessage);
      console.error('Services loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return {
    services,
    isLoading,
    error,
    refetch: loadServices
  };
};

export const usePriceCalculation = () => {
  const [calculation, setCalculation] = useState<CalculatePriceResponse['data'] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrice = async (request: CalculatePriceRequest) => {
    setIsCalculating(true);
    setError(null);

    try {
      const response = await calculatePriceApi(request);
      if (response.success) {
        setCalculation(response.data);
      } else {
        throw new Error(response.message || 'Failed to calculate price');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to calculate price';
      setError(errorMessage);
      console.error('Price calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const clearCalculation = () => {
    setCalculation(null);
    setError(null);
  };

  return {
    calculation,
    isCalculating,
    error,
    calculatePrice,
    clearCalculation
  };
};

// Hook for service options
export const useServiceOptions = () => {
  const [serviceOptions, setServiceOptions] = useState<ServiceWithOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServiceOptions = async (serviceId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getServiceOptionsApi(serviceId);
      if (response.success) {
        setServiceOptions(response.data);
      } else {
        throw new Error(response.message || 'Failed to load service options');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to load service options';
      setError(errorMessage);
      console.error('Service options loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearServiceOptions = () => {
    setServiceOptions(null);
    setError(null);
  };

  return {
    serviceOptions,
    isLoading,
    error,
    loadServiceOptions,
    clearServiceOptions
  };
};

// Hook for price calculation with options
export const useServicePriceCalculation = () => {
  const [priceData, setPriceData] = useState<CalculatePriceResponse['data'] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateServicePrice = async (request: CalculatePriceRequest) => {
    setIsCalculating(true);
    setError(null);

    try {
      const response = await calculateServicePriceApi(request);
      if (response.success) {
        setPriceData(response.data);
      } else {
        throw new Error(response.message || 'Failed to calculate service price');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to calculate service price';
      setError(errorMessage);
      console.error('Service price calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const clearPriceData = () => {
    setPriceData(null);
    setError(null);
  };

  return {
    priceData,
    isCalculating,
    error,
    calculateServicePrice,
    clearPriceData
  };
};

// Hook for suitable employees
export const useSuitableEmployees = () => {
  const [employeesData, setEmployeesData] = useState<SuitableEmployee[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuitableEmployees = async (params: {
    serviceId: number;
    bookingTime: string;
    ward?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getSuitableEmployeesApi(params);
      if (response.success) {
        // Handle different response formats
        // API response format: { success: true, data: [...] } or { success: true, data: { availableEmployees: [...] } }
        const employeesArray = Array.isArray(response.data) 
          ? response.data 
          : response.data?.availableEmployees || [];
        setEmployeesData(employeesArray);
      } else {
        throw new Error(response.message || 'Failed to load suitable employees');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to load suitable employees';
      setError(errorMessage);
      console.error('Suitable employees loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearEmployeesData = () => {
    setEmployeesData(null);
    setError(null);
  };

  return {
    employeesData,
    isLoading,
    error,
    loadSuitableEmployees,
    clearEmployeesData
  };
};