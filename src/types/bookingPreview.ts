// Types cho Booking Preview APIs
// Dựa theo API-Booking-Preview.md và API-Booking-Preview-Multiple-Recurring.md

// ============ Request Types ============

export interface BookingPreviewDetailRequest {
  serviceId: number;
  quantity?: number; // default: 1
  selectedChoiceIds?: number[];
  expectedPrice?: number;
  expectedPricePerUnit?: number;
}

export interface NewAddressRequest {
  customerId?: string;
  fullAddress: string;
  ward: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Request cho single booking preview
 * POST /api/v1/customer/bookings/preview
 */
export interface BookingPreviewRequest {
  customerId?: string; // Optional, Admin only
  addressId?: string; // Required if newAddress is null
  newAddress?: NewAddressRequest; // Required if addressId is null
  bookingTime?: string; // ISO DateTime, optional for preview
  note?: string; // max 1000 chars
  title?: string; // max 255 chars
  promoCode?: string; // max 20 chars
  bookingDetails: BookingPreviewDetailRequest[];
  paymentMethodId?: number | null;
  additionalFeeIds?: string[];
}

/**
 * Request cho multiple booking preview
 * POST /api/v1/customer/bookings/preview/multiple
 */
export interface MultipleBookingPreviewRequest {
  customerId?: string; // Optional, Admin only
  addressId?: string;
  newAddress?: NewAddressRequest;
  bookingTimes: string[]; // Array of ISO DateTime strings
  note?: string;
  title?: string;
  promoCode?: string;
  bookingDetails: BookingPreviewDetailRequest[];
  paymentMethodId?: number | null;
  additionalFeeIds?: string[];
}

export type RecurrenceType = 'WEEKLY' | 'MONTHLY';

/**
 * Request cho recurring booking preview
 * POST /api/v1/customer/bookings/preview/recurring
 */
export interface RecurringBookingPreviewRequest {
  customerId?: string; // Optional, Admin only
  addressId?: string;
  newAddress?: NewAddressRequest;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[]; // 1-7 for WEEKLY, 1-31 for MONTHLY
  bookingTime: string; // LocalTime (HH:mm:ss or HH:mm)
  startDate: string; // LocalDate (YYYY-MM-DD)
  endDate?: string; // LocalDate, optional
  maxPreviewOccurrences?: number; // default: 30
  note?: string;
  title?: string;
  promoCode?: string;
  bookingDetails: BookingPreviewDetailRequest[];
  paymentMethodId?: number | null;
  additionalFeeIds?: string[];
}

// ============ Response Types ============

export interface ChoicePreviewItem {
  choiceId: number;
  choiceName: string;
  optionName: string;
  price: number;
  formattedPrice: string;
}

export interface ServicePreviewItem {
  serviceId: number;
  serviceName: string;
  serviceDescription: string;
  iconUrl: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  formattedUnitPrice: string;
  subTotal: number;
  formattedSubTotal: string;
  selectedChoices: ChoicePreviewItem[];
  estimatedDuration: string;
  recommendedStaff: number;
}

export interface AddressPreviewInfo {
  addressId: string;
  fullAddress: string;
  ward: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface PromotionPreviewInfo {
  promotionId: number;
  promoCode: string;
  description: string;
  discountType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  discountValue: number;
  maxDiscountAmount?: number | null;
}

export interface FeeBreakdownItem {
  name: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  amount: number;
  formattedAmount: string;
  systemSurcharge: boolean;
}

/**
 * Response cho single booking preview
 * POST /api/v1/customer/bookings/preview
 */
export interface BookingPreviewResponse {
  valid: boolean;
  errors: string[];
  
  // Customer Info
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  
  // Address Info
  addressInfo: AddressPreviewInfo | null;
  usingNewAddress: boolean;
  
  // Booking Time
  bookingTime: string | null;
  
  // Service Items
  serviceItems: ServicePreviewItem[] | null;
  totalServices: number;
  totalQuantity: number;
  
  // Subtotal (before discount)
  subtotal: number | null;
  formattedSubtotal: string | null;
  
  // Promotion Info
  promotionInfo: PromotionPreviewInfo | null;
  discountAmount: number | null;
  formattedDiscountAmount: string | null;
  
  // After Discount
  totalAfterDiscount: number | null;
  formattedTotalAfterDiscount: string | null;
  
  // Fees
  feeBreakdowns: FeeBreakdownItem[] | null;
  totalFees: number | null;
  formattedTotalFees: string | null;
  
  // Grand Total
  grandTotal: number | null;
  formattedGrandTotal: string | null;
  
  // Additional Info
  estimatedDuration: string | null;
  recommendedStaff: number;
  note: string | null;
  paymentMethodId: number | null;
  paymentMethodName: string | null;
}

/**
 * Response cho multiple booking preview
 * POST /api/v1/customer/bookings/preview/multiple
 */
export interface MultipleBookingPreviewResponse {
  valid: boolean;
  errors: string[];
  bookingCount: number;
  
  // Shared Service Info (dùng chung cho tất cả booking)
  serviceItems: ServicePreviewItem[];
  totalServices: number;
  totalQuantityPerBooking: number;
  subtotalPerBooking: number;
  formattedSubtotalPerBooking: string;
  
  // Customer & Address Info
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressInfo: AddressPreviewInfo;
  usingNewAddress: boolean;
  
  // Fees & Promotion (áp dụng cho mỗi booking)
  feeBreakdowns: FeeBreakdownItem[];
  totalFeesPerBooking: number;
  formattedTotalFeesPerBooking: string;
  
  promotionInfo: PromotionPreviewInfo | null;
  discountPerBooking: number;
  formattedDiscountPerBooking: string;
  
  pricePerBooking: number;
  formattedPricePerBooking: string;
  
  // Individual booking previews
  bookingPreviews: BookingPreviewResponse[];
  
  // Aggregated Totals
  totalEstimatedPrice: number;
  formattedTotalEstimatedPrice: string;
  totalEstimatedDuration: string;
  
  // Validation summary
  validBookingsCount: number;
  invalidBookingsCount: number;
  invalidBookingTimes: string[];
  
  // Payment Info
  paymentMethodId: number | null;
  paymentMethodName: string | null;
}

/**
 * Response cho recurring booking preview
 * POST /api/v1/customer/bookings/preview/recurring
 */
export interface RecurringBookingPreviewResponse {
  valid: boolean;
  errors: string[];
  
  // Shared Service Info
  serviceItems: ServicePreviewItem[];
  totalServices: number;
  totalQuantityPerOccurrence: number;
  subtotalPerOccurrence: number;
  formattedSubtotalPerOccurrence: string;
  
  // Customer & Address Info
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  addressInfo: AddressPreviewInfo;
  usingNewAddress: boolean;
  
  // Fees & Discount
  feeBreakdowns: FeeBreakdownItem[];
  totalFeesPerOccurrence: number;
  formattedTotalFeesPerOccurrence: string;
  
  promotionInfo: PromotionPreviewInfo | null;
  discountPerOccurrence: number;
  formattedDiscountPerOccurrence: string;
  
  // Recurrence Info
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  recurrenceDescription: string;
  bookingTime: string;
  startDate: string;
  endDate: string | null;
  
  // Planned Occurrences
  plannedBookingTimes: string[];
  occurrenceCount: number;
  maxPreviewOccurrences: number;
  hasMoreOccurrences: boolean;
  
  // Pricing
  pricePerOccurrence: number;
  formattedPricePerOccurrence: string;
  totalEstimatedPrice: number;
  formattedTotalEstimatedPrice: string;
  
  // Single booking preview (for first occurrence)
  singleBookingPreview?: BookingPreviewResponse;
  
  // Payment Info
  paymentMethodId: number | null;
  paymentMethodName: string | null;
}
