import { api } from './client';
import type { ApiResponse } from './client';
import type { 
  PaymentMethod, 
  CreatePaymentRequest, 
  PaymentDetail 
} from '../types/api';

/**
 * Payment API
 * Base URL: /api/v1/customer/payments
 */

// Get payment methods
// Dựa theo API-TestCases-Payment.md Test Case 15
// Endpoint: GET /api/v1/customer/payments/methods
// Response: Trả về trực tiếp array, không có wrapper ApiResponse
export const getPaymentMethodsApi = async (): Promise<PaymentMethod[]> => {
  const response = await api.get<PaymentMethod[]>('/customer/payments/methods');
  return response.data;
};

// Create payment for booking (requires CUSTOMER role)
export const createPaymentApi = async (data: CreatePaymentRequest): Promise<PaymentDetail> => {
  const response = await api.post<PaymentDetail>('/customer/payments', data);
  return response.data;
};

// Get payment by ID
export const getPaymentByIdApi = async (paymentId: string): Promise<PaymentDetail> => {
  const response = await api.get<PaymentDetail>(`/customer/payments/${paymentId}`);
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

// Get payment for a specific booking
export const getPaymentByBookingIdApi = async (bookingId: string): Promise<PaymentDetail> => {
  const response = await api.get<PaymentDetail>(`/customer/payments/booking/${bookingId}`);
  return response.data;
};

// Get payment history for customer with pagination
export interface PaymentHistoryItem {
  paymentId: string;
  bookingCode: string;
  amount: number;
  status: string;
  paymentMethodName: string;
  transactionCode: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface PaginatedPaymentHistory {
  content: PaymentHistoryItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      ascending: boolean;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export const getPaymentHistoryApi = async (
  customerId: string,
  page: number = 0,
  size: number = 10,
  sort: string = 'createdAt,desc'
): Promise<PaginatedPaymentHistory> => {
  const response = await api.get<PaginatedPaymentHistory>(
    `/customer/payments/history/${customerId}`,
    {
      params: { page, size, sort }
    }
  );
  return response.data;
};
