import { api } from './client';
import type { ApiResponse } from './client';

/**
 * OTP API Service
 * Base URL: /api/v1/otp
 */

// Request/Response Types
export interface SendOtpRequest {
  email: string;
  otpType: 'VERIFY_EMAIL';
}

export interface SendOtpResponse extends ApiResponse {
  success: boolean;
  message: string;
  expirationSeconds: number;
  cooldownSeconds: number;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse extends ApiResponse {
  success: boolean;
  message: string;
}

export interface ResendCooldownResponse extends ApiResponse {
  success: boolean;
  cooldownSeconds: number;
  canResend: boolean;
}

// Send Email OTP for verification
export const sendEmailOtpApi = async (data: SendOtpRequest): Promise<SendOtpResponse> => {
  console.log('[sendEmailOtpApi] Calling POST /otp/email/send with data:', data);
  const response = await api.post<SendOtpResponse>('/otp/email/send', data);
  console.log('[sendEmailOtpApi] Response received:', response.data);
  return response.data;
};

// Verify Email OTP
export const verifyEmailOtpApi = async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  console.log('[verifyEmailOtpApi] Calling POST /otp/email/verify with data:', data);
  const response = await api.post<VerifyOtpResponse>('/otp/email/verify', data);
  console.log('[verifyEmailOtpApi] Response received:', response.data);
  return response.data;
};

// Check Resend Cooldown
export const checkResendCooldownApi = async (email: string): Promise<ResendCooldownResponse> => {
  console.log('[checkResendCooldownApi] Calling GET /otp/email/resend-cooldown for email:', email);
  const response = await api.get<ResendCooldownResponse>('/otp/email/resend-cooldown', {
    params: { email }
  });
  console.log('[checkResendCooldownApi] Response received:', response.data);
  return response.data;
};
