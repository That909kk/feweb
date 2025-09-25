import { useState, useEffect } from 'react';
import { 
  getPaymentMethodsApi, 
  createPaymentApi, 
  getPaymentStatusApi 
} from '../api/payment';
import type { 
  PaymentMethod, 
  CreatePaymentRequest, 
  PaymentResponse 
} from '../types/api';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPaymentMethodsApi();
      if (response.success) {
        setPaymentMethods(response.data);
      } else {
        throw new Error(response.message || 'Failed to load payment methods');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to load payment methods';
      setError(errorMessage);
      console.error('Payment methods loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  return {
    paymentMethods,
    isLoading,
    error,
    refetch: loadPaymentMethods
  };
};

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (request: CreatePaymentRequest): Promise<PaymentResponse['data'] | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await createPaymentApi(request);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to create payment';
      setError(errorMessage);
      console.error('Create payment error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string): Promise<PaymentResponse['data'] | null> => {
    setError(null);

    try {
      const response = await getPaymentStatusApi(paymentId);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to check payment status');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to check payment status';
      setError(errorMessage);
      console.error('Check payment status error:', err);
      return null;
    }
  };

  return {
    isProcessing,
    error,
    createPayment,
    checkPaymentStatus
  };
};