import { api } from './client';

const VOICE_BOOKING_PREFIX = '/customer/bookings/voice';
// Timeout dài hơn cho voice booking vì cần xử lý audio (STT + AI)
const VOICE_BOOKING_TIMEOUT = 100000; // 60 giây

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

  const response = await api.post(
    `${VOICE_BOOKING_PREFIX}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: VOICE_BOOKING_TIMEOUT
    }
  );

  console.log('[VoiceBookingApi] Create raw response:', response);

  // Backend trả về VoiceBookingResponse trực tiếp hoặc trong .data
  const responseData = response.data;
  
  // Nếu responseData có requestId và status trực tiếp -> đó chính là VoiceBookingResponse
  if (responseData?.requestId && responseData?.status) {
    return responseData as VoiceBookingResponse;
  }
  
  // Nếu có nested data (wrapper ApiResponse)
  if (responseData?.data?.requestId) {
    return responseData.data as VoiceBookingResponse;
  }

  // Throw error nếu không có requestId
  throw new Error(responseData?.message || 'Không thể tạo yêu cầu đặt lịch bằng giọng nói');
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

  const response = await api.post(
    `${VOICE_BOOKING_PREFIX}/continue`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: VOICE_BOOKING_TIMEOUT
    }
  );

  console.log('[VoiceBookingApi] Continue raw response:', response);

  // Backend trả về VoiceBookingResponse trực tiếp hoặc trong .data
  const responseData = response.data;
  
  if (responseData?.requestId && responseData?.status) {
    return responseData as VoiceBookingResponse;
  }
  
  if (responseData?.data?.requestId) {
    return responseData.data as VoiceBookingResponse;
  }

  throw new Error(responseData?.message || 'Không thể bổ sung thông tin');
};

/**
 * Xác nhận draft booking
 */
export const confirmVoiceBookingApi = async (requestId: string): Promise<VoiceBookingResponse> => {
  const response = await api.post(
    `${VOICE_BOOKING_PREFIX}/confirm`,
    { requestId }
  );

  console.log('[VoiceBookingApi] Confirm raw response:', response);

  const responseData = response.data;
  
  if (responseData?.requestId && responseData?.status) {
    return responseData as VoiceBookingResponse;
  }
  
  if (responseData?.data?.requestId) {
    return responseData.data as VoiceBookingResponse;
  }

  // Nếu có success=true và bookingId thì cũng ok
  if (responseData?.success && responseData?.bookingId) {
    return responseData as VoiceBookingResponse;
  }

  throw new Error(responseData?.message || 'Không thể xác nhận đặt lịch');
};

/**
 * Hủy draft booking
 */
export const cancelVoiceBookingApi = async (requestId: string): Promise<VoiceBookingResponse> => {
  const response = await api.post(
    `${VOICE_BOOKING_PREFIX}/cancel`,
    { requestId }
  );

  console.log('[VoiceBookingApi] Cancel raw response:', response);

  const responseData = response.data;
  
  if (responseData?.requestId && responseData?.status) {
    return responseData as VoiceBookingResponse;
  }
  
  if (responseData?.data?.requestId) {
    return responseData.data as VoiceBookingResponse;
  }

  if (responseData?.success) {
    return responseData as VoiceBookingResponse;
  }

  throw new Error(responseData?.message || 'Không thể hủy đặt lịch');
};

/**
 * Lấy chi tiết voice booking request
 */
export const getVoiceBookingApi = async (requestId: string): Promise<VoiceBookingRequest> => {
  const response = await api.get(
    `${VOICE_BOOKING_PREFIX}/${requestId}`
  );

  const responseData = response.data;
  
  if (responseData?.requestId) {
    return responseData as VoiceBookingRequest;
  }
  
  if (responseData?.data?.requestId) {
    return responseData.data as VoiceBookingRequest;
  }

  throw new Error('Không thể lấy thông tin voice booking');
};

/**
 * Kiểm tra trạng thái dịch vụ voice booking
 */
export const getVoiceBookingStatusApi = async (): Promise<{ enabled: boolean; [key: string]: any }> => {
  const response = await api.get(
    `${VOICE_BOOKING_PREFIX}/status`
  );

  const responseData = response.data;
  
  // Response có thể là { enabled: boolean } trực tiếp hoặc trong .data
  if (typeof responseData?.enabled === 'boolean') {
    return responseData;
  }
  
  if (typeof responseData?.data?.enabled === 'boolean') {
    return responseData.data;
  }

  return { enabled: false };
};
