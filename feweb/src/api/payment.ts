import { api } from './client';
import type { ApiResponse } from './client';
import type { 
  PaymentMethod, 
  CreatePaymentRequest, 
  PaymentResponse 
} from '../types/api';

/**
 * Payment API
 * Base URL: /api/v1/customer/payments
 */

// Get payment methods (public, no auth required)
export const getPaymentMethodsApi = async (): Promise<PaymentMethod[]> => {
  const response = await api.get<PaymentMethod[]>('/customer/payments/methods');
  return response.data;
};

// Create payment for booking (requires CUSTOMER role)
export const createPaymentApi = async (data: CreatePaymentRequest): Promise<PaymentResponse> => {
  const response = await api.post<PaymentResponse>('/customer/payments', data);
  return response.data;
};

// Get payment by ID
export const getPaymentByIdApi = async (paymentId: string): Promise<PaymentResponse> => {
  const response = await api.get<PaymentResponse>(`/customer/payments/${paymentId}`);
  return response.data;
};

// Get payment status
export const getPaymentStatusApi = async (paymentId: string): Promise<ApiResponse<{
  status: string;
  paymentUrl?: string;
  completedAt?: string;
}>> => {
  const response = await api.get<ApiResponse<{
    status: string;
    paymentUrl?: string;
    completedAt?: string;
  }>>(`/customer/payments/${paymentId}/status`);
  return response.data;
};