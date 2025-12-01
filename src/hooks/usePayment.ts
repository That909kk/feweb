import { useState, useEffect } from 'react';
import { 
  getPaymentMethodsApi, 
  createPaymentApi, 
  getPaymentStatusApi 
} from '../api/payment';
import type { 
  PaymentMethod, 
  CreatePaymentRequest, 
  PaymentDetail 
} from '../types/api';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const methods = await getPaymentMethodsApi();
      // API trả về trực tiếp PaymentMethod[], không có wrapper
      setPaymentMethods(methods || []);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to load payment methods';
      setError(errorMessage);
      console.error('Payment methods loading error:', err);
      setPaymentMethods([]);
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

  const createPayment = async (request: CreatePaymentRequest): Promise<PaymentDetail | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await createPaymentApi(request);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to create payment';
      setError(errorMessage);
      console.error('Create payment error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string): Promise<PaymentDetail | null> => {
    setError(null);

    try {
      const response = await getPaymentStatusApi(paymentId);
      if (response.success) {
        return {
          paymentId,
          bookingCode: '',
          amount: 0,
          status: response.data.status as PaymentDetail['status'],
          paymentMethodName: '',
          transactionCode: response.data.paymentUrl ?? null,
          createdAt: '',
          paidAt: response.data.completedAt ?? null
        };
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
