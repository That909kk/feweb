import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const VOICE_BOOKING_PREFIX = '/customer/bookings/voice';

export interface VoiceBookingResponse {
  success: boolean;
  message: string;
  requestId: string;
  status: 'PROCESSING' | 'PARTIAL' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  isFinal: boolean;
  transcript?: string;
  confidenceScore?: number | null;
  processingTimeMs?: number | null;
  missingFields?: string[];
  clarificationMessage?: string;
  preview?: VoiceBookingPreview;
  bookingId?: string;
  extractedInfo?: Record<string, any>;
  speech?: {
    message?: SpeechData;
    clarification?: SpeechData;
  };
  errorDetails?: string | null;
  failureHints?: string[] | null;
  retryAfterMs?: number | null;
}

export interface SpeechData {
  text: string;
  audioUrl: string;
  provider?: string;
  processingTimeMs?: number;
}

export interface VoiceBookingPreview {
  addressId?: number;
  address?: string;
  ward?: string;
  city?: string;
  bookingTime?: string;
  note?: string;
  promoCode?: string | null;
  paymentMethodId?: number | null;
  totalAmount: number;
  totalAmountFormatted: string;
  services: VoiceBookingServicePreview[];
  employees?: VoiceBookingEmployeePreview[];
  autoAssignedEmployees?: boolean;
}

export interface VoiceBookingServicePreview {
  serviceId: number;
  serviceName?: string;
  quantity: number;
  unitPrice: number;
  unitPriceFormatted: string;
  subtotal: number;
  subtotalFormatted: string;
  selectedChoiceIds?: number[] | null;
}

export interface VoiceBookingEmployeePreview {
  employeeId: string;
  fullName: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface VoiceBookingRequest {
  requestId: string;
  customerId: string;
  status: string;
  transcript?: string;
  hints?: string;
  previewPayload?: string;
  bookingId?: string;
  missingFields?: string;
  confidenceScore?: number;
  processingTimeMs?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tạo yêu cầu voice booking mới
 */
export const createVoiceBookingApi = async (
  audio: File,
  hints?: Record<string, any>
): Promise<VoiceBookingResponse> => {
  const formData = new FormData();
  formData.append('audio', audio);
  if (hints) {
    formData.append('hints', JSON.stringify(hints));
  }

  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE_URL}${VOICE_BOOKING_PREFIX}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.data;
};

/**
 * Bổ sung thông tin cho request PARTIAL / AWAITING_CONFIRMATION
 */
export const continueVoiceBookingApi = async (
  requestId: string,
  audio?: File,
  additionalText?: string,
  explicitFields?: Record<string, any>
): Promise<VoiceBookingResponse> => {
  const formData = new FormData();
  formData.append('requestId', requestId);
  
  if (audio) {
    formData.append('audio', audio);
  }
  if (additionalText) {
    formData.append('additionalText', additionalText);
  }
  if (explicitFields) {
    formData.append('explicitFields', JSON.stringify(explicitFields));
  }

  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE_URL}${VOICE_BOOKING_PREFIX}/continue`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.data;
};

/**
 * Xác nhận draft booking
 */
export const confirmVoiceBookingApi = async (requestId: string): Promise<VoiceBookingResponse> => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE_URL}${VOICE_BOOKING_PREFIX}/confirm`,
    { requestId },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.data;
};

/**
 * Hủy draft booking
 */
export const cancelVoiceBookingApi = async (requestId: string): Promise<VoiceBookingResponse> => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_BASE_URL}${VOICE_BOOKING_PREFIX}/cancel`,
    { requestId },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.data;
};

/**
 * Lấy chi tiết voice booking request
 */
export const getVoiceBookingApi = async (requestId: string): Promise<VoiceBookingRequest> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_BASE_URL}${VOICE_BOOKING_PREFIX}/${requestId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.data;
};

/**
 * Kiểm tra trạng thái dịch vụ voice booking
 */
export const getVoiceBookingStatusApi = async (): Promise<{ enabled: boolean; [key: string]: any }> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `${API_BASE_URL}${VOICE_BOOKING_PREFIX}/status`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.data;
};
