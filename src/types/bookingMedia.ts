/**
 * Booking Media Types
 * Dựa theo API-TestCases-BookingMedia.md
 */

export type MediaType = 'CHECK_IN_IMAGE' | 'CHECK_OUT_IMAGE' | 'BOOKING_POST_IMAGE';

export interface BookingMedia {
  mediaId: string;
  assignmentId: string;
  mediaUrl: string;
  publicId: string;
  mediaType: MediaType;
  description: string | null;
  uploadedAt: string;
}

export interface CheckInRequest {
  employeeId: string;
  imageDescription?: string;
}

export interface CheckOutRequest {
  employeeId: string;
  imageDescription?: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    bookingCode: string;
    serviceName: string;
    customerName: string;
    customerPhone: string;
    serviceAddress: string;
    bookingTime: string;
    estimatedDurationHours: number;
    pricePerUnit: number;
    quantity: number;
    totalAmount: number;
    status: string;
    assignedAt: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    note: string | null;
  };
}

export interface CheckOutResponse {
  success: boolean;
  message: string;
  data: {
    assignmentId: string;
    bookingCode: string;
    serviceName: string;
    customerName: string;
    customerPhone: string;
    serviceAddress: string;
    bookingTime: string;
    estimatedDurationHours: number;
    pricePerUnit: number;
    quantity: number;
    totalAmount: number;
    status: string;
    assignedAt: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    note: string | null;
  };
}

export interface BookingMediaListResponse {
  success: boolean;
  data: BookingMedia[];
}
