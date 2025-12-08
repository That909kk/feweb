export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  validationErrors?: ValidationError[];
}

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'EMPLOYEE';
export type DeviceType = 'WEB' | 'MOBILE' | 'ALL';
export type RoleStatus = 'ACTIVE' | 'INACTIVE';

// Auth Types
export interface GetRoleRequest {
  username: string;
  password: string;
}

export interface GetRoleResponse extends ApiResponse {
  data: Record<UserRole, RoleStatus>;
  roleNumbers: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  role: UserRole;
  deviceType: DeviceType;
}

export interface LoginResponse extends ApiResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    expireIn: number;
    role: UserRole;
    deviceType: DeviceType;
    data: CustomerData | EmployeeData | AdminData;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
}

export interface RegisterResponse extends ApiResponse {
  data: {
    username: string;
    email: string;
    role: UserRole;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse extends ApiResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    expireIn: number;
    deviceType: DeviceType;
  };
}

export interface ValidateTokenResponse extends ApiResponse {
  valid: boolean;
}

export interface ActiveSessionsResponse extends ApiResponse {
  data: {
    webSessions: number;
    mobileSessions: number;
  };
}

export interface LogoutResponse extends ApiResponse {
  deviceType?: DeviceType;
}

// User Profile Types
export interface CustomerData {
  customerId: string;
  accountId: string;
  username: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  status: string;
  address?: string;
  addressId?: string;
}

// Customer Update Types
export interface UpdateCustomerRequest {
  avatar?: string;
  fullName: string;
  isMale: boolean;
  email: string;
  birthdate: string; // ISO date string (YYYY-MM-DD)
}

export interface UpdateCustomerResponse extends ApiResponse {
  data: {
    customerId: string;
    avatar?: string;
    fullName: string;
    isMale: boolean;
    email: string;
    birthdate: string;
  };
}

// Get Customer Info Types  
export interface GetCustomerInfoResponse extends ApiResponse {
  data: {
    customerId: string;
    fullName: string;
    email: string;
    avatar?: string;
    isMale: boolean;
    birthdate?: string;
    rating?: number | null;
    vipLevel?: string | null;
    account: {
      accountId: string;
      phoneNumber: string;
      status: string;
      isPhoneVerified: boolean;
      lastLogin: string;
      roles: string[];
    };
    addresses?: Array<{
      addressId: string;
      fullAddress: string;
      ward: string;
      city: string;
      latitude: number;
      longitude: number;
      isDefault: boolean;
    }>;
  };
}

export interface EmployeeData {
  employeeId: string;
  accountId: string;
  username: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  status: string;
  specialization?: string;
  experience?: number;
  rating?: number;
}

export interface AdminData {
  adminProfileId: string;
  accountId: string;
  username: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  status: string;
  department?: string;
}

// Category Types
export interface Category {
  categoryId: number;
  categoryName: string;
  description: string;
  iconUrl: string;
  isActive: boolean;
  serviceCount: number;
}

export interface CategoryWithServices extends Category {
  services: Service[];
}

// Service Types
export interface Service {
  serviceId: number;
  name: string;
  description: string;
  basePrice: number;
  unit: string;
  estimatedDurationHours: number;
  iconUrl: string;
  isActive: boolean;
  formattedPrice?: string;
  formattedDuration?: string;
  serviceChoices?: ServiceChoice[];
  categoryId?: number;
  categoryName?: string;
}

export interface ServiceChoice {
  choiceId: number;
  choiceName: string;
  priceAdjustment: number;
  status: string;
}

export type ServiceOptionType =
  | 'SINGLE_CHOICE_RADIO'
  | 'SINGLE_CHOICE_DROPDOWN'
  | 'MULTIPLE_CHOICE_CHECKBOX'
  | 'QUANTITY_INPUT';

export interface ServiceOptionChoice {
  choiceId: number;
  choiceName: string;
  description?: string;
  priceAdjustment: number;
  durationAdjustmentHours?: number;
  recommendedStaffAdjustment?: number;
  iconUrl?: string;
  isDefault?: boolean;
}

export interface ServiceOption {
  optionId: number;
  optionName: string;
  optionType: ServiceOptionType;
  required: boolean;
  minSelection?: number;
  maxSelection?: number;
  dependentOnChoiceId?: number | null;
  quantityStep?: number;
  choices?: ServiceOptionChoice[];
}

export interface ServiceWithOptions {
  service: Service;
  options: ServiceOption[];
}

export interface CalculatePriceRequest {
  serviceId: number;
  selectedChoiceIds: number[];
  quantity: number;
}

export interface CalculatePriceResponse extends ApiResponse {
  data: {
    serviceId: number;
    serviceName: string;
    basePrice: number;
    totalAdjustment: number;
    finalPrice: number;
    suggestedStaff: number;
    estimatedDurationHours: number;
    formattedPrice?: string;
    formattedDuration?: string;
    breakdown?: {
      serviceName: string;
      basePrice: number;
      quantity: number;
      selectedOptions: Array<{
        choiceName: string;
        priceAdjustment: number;
      }>;
    };
  };
}

export interface PriceCalculationSelection {
  optionId: number;
  choiceIds?: number[];
  quantity?: number;
}

export interface PriceCalculationRequest {
  serviceId: number;
  bookingTime: string;
  selections: PriceCalculationSelection[];
}

export interface PriceCalculationResponse extends ApiResponse<{
  basePrice: number;
  adjustments: Array<{
    label: string;
    amount: number;
    description?: string;
  }>;
  totalAmount: number;
  formattedTotalAmount?: string;
  recommendedEmployees?: number;
  estimatedDurationHours?: number;
}> {}

export interface SuitableEmployee {
  employeeId: string;
  fullName: string;
  avatar?: string;
  rating?: number;
  totalCompletedJobs?: number;
  completedJobs?: number;
  hasWorkedWithCustomer?: boolean;
  distanceKm?: number;
  availableFrom?: string;
  availableTo?: string;
  primarySkills?: string[];
}

export interface SuitableEmployeesResponse extends ApiResponse<{
  availableEmployees: SuitableEmployee[];
}> {}

// Employee Schedule Types
export interface EmployeeScheduleParams {
  status?: 'AVAILABLE' | 'BUSY';
  district?: string;
  city?: string;
  from?: string; // ISO datetime
  to?: string; // ISO datetime;
}

export interface EmployeeSchedule {
  employeeId: string;
  fullName: string;
  avatar?: string;
  employeeStatus: string;
  rating?: string;
  skills?: string[];
  workingZones?: Array<{
    ward: string;
    city: string;
  }>;
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    type: 'AVAILABLE' | 'ASSIGNMENT' | 'UNAVAILABLE';
    reason?: string | null;
    bookingCode?: string | null;
    serviceName?: string | null;
    customerName?: string | null;
    address?: string | null;
    status?: string | null;
    durationHours: number;
  }>;
}

// Legacy availability format (kept for backward compatibility)
export interface EmployeeAvailability {
  employeeId: string;
  fullName: string;
  avatar?: string;
  status: string;
  rating?: number;
  experience?: number;
  specialization?: string;
  availability: Array<{
    date: string;
    timeSlots: string[];
  }>;
}

// Booking Types
export interface BookingDetailRequest {
  serviceId: number;
  quantity: number;
  expectedPrice: number;
  expectedPricePerUnit: number;
  selectedChoiceIds: number[];
}

export interface BookingAssignmentRequest {
  serviceId: number;
  employeeId: string;
}

export interface CreateBookingRequest {
  addressId: string | null; // Can be null when using newAddress
  newAddress?: {
    customerId: string;
    fullAddress: string;
    ward: string;
    district?: string;
    city: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null; // New address object when creating booking with new address
  bookingTime: string;
  note?: string | null;
  promoCode?: string | null;
  additionalFeeIds?: string[]; // Danh sách ID các phụ phí được áp dụng (optional)
  // Booking Post Feature fields (khi không chọn nhân viên)
  title?: string | null;
  imageUrl?: string | null; // Deprecated: Kept for backward compatibility, use imageUrls instead
  imageUrls?: string[] | null; // Array of image URLs (support multiple images 0-10)
  bookingDetails: BookingDetailRequest[];
  assignments?: BookingAssignmentRequest[];
  paymentMethodId: number;
}

export interface BookingValidationRequest {
  addressId: string;
  bookingTime: string;
  note?: string | null;
  promoCode?: string | null;
  bookingDetails: BookingDetailRequest[];
  assignments?: BookingAssignmentRequest[];
  fullAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface BookingValidationResponse {
  success?: boolean;
  isValid: boolean;
  calculatedTotalAmount: number | null;
  formattedTotalAmount?: string | null;
  errors: string[];
  conflicts: Array<{
    conflictType: string;
    employeeId?: string;
    conflictStartTime?: string;
    conflictEndTime?: string;
    reason?: string;
  }>;
  serviceValidations: Array<{
    serviceId: number;
    serviceName: string;
    exists: boolean;
    active: boolean;
    basePrice: number;
    calculatedPrice: number;
    expectedPrice: number;
    priceMatches: boolean;
    validChoiceIds: number[];
    invalidChoiceIds: number[];
    recommendedStaff?: number;
    valid: boolean;
  }>;
  customer: {
    customerId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
  } | null;
  address: {
    addressId: string;
    fullAddress: string;
    ward: string;
    city: string;
    latitude?: number;
    longitude?: number;
    isDefault: boolean;
  } | null;
  usingNewAddress: boolean;
}

export interface BookingResponse extends ApiResponse {
  data: {
    bookingId: string;
    bookingCode?: string;
    customerId: string;
    serviceId: number;
    status: string;
    totalPrice: number;
    totalAmount?: number;
    formattedTotalAmount?: string;
    scheduledDate: string;
    scheduledTime: string;
    bookingTime?: string;
    address: string;
    notes?: string;
    note?: string;
    employeeId?: string;
    createdAt: string;
    updatedAt: string;
    // Booking Post Feature fields
    title?: string;
    imageUrl?: string; // Deprecated: Kept for backward compatibility, use imageUrls instead
    imageUrls?: string[]; // Array of image URLs (support multiple images 0-10)
    isVerified?: boolean;
    adminComment?: string;
    // Additional fields
    totalServices?: number;
    totalEmployees?: number;
    // Fee breakdown fields (theo booking-fee-endpoints.md)
    baseAmount?: number; // Tổng tiền dịch vụ trước phí
    totalFees?: number; // Tổng phụ phí
    fees?: Array<{
      name: string;
      type: 'PERCENT' | 'FLAT';
      value: number;
      amount: number;
      systemSurcharge: boolean;
    }>;
    customerInfo?: {
      customerId: string;
      fullName: string;
      email: string;
      phoneNumber: string;
      addressId?: string;
      fullAddress?: string;
      ward?: string;
      district?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      isDefault?: boolean;
    };
    serviceDetails?: Array<{
      bookingDetailId: string;
      serviceId: number;
      serviceName: string;
      price: number;
      formattedPrice?: string;
      maxEmployees: number;
      startTime?: string;
      endTime?: string;
    }>;
    paymentInfo?: {
      paymentId: string;
      methodId: number;
      methodName: string;
      amount: number;
      formattedAmount?: string;
      status: string;
      transactionCode?: string;
      paidAt?: string;
    };
    assignedEmployees?: Array<{
      assignmentId: string;
      employeeId: string;
      employeeName: string;
      phoneNumber: string;
      avatar?: string;
      status: string;
    }>;
  };
}

// Booking Detail Types
export interface BookingDetail {
  bookingDetailId: string;
  bookingId: string;
  serviceId: number;
  serviceName: string;
  status: string;
  startTime: string;
  endTime: string;
  location?: string;
  customerAddress?: {
    fullAddress: string;
  };
  assignedEmployees: Array<{
    employeeId: string;
    fullName: string;
    avatar?: string;
  }>;
  maxEmployees: number;
  price: number;
}

// Payment Types
export interface PaymentMethod {
  methodId: number;
  methodCode: 'CASH' | 'MOMO' | 'VNPAY' | 'BANK_TRANSFER';
  methodName: string;
  description?: string;
  serviceCharge?: number;
  isActive?: boolean;
}

export interface CreatePaymentRequest {
  bookingId: string;
  methodId: number;
}

export interface PaymentDetail {
  paymentId: string;
  bookingCode: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED' | 'REFUNDED';
  paymentMethodName: string;
  transactionCode: string | null;
  createdAt: string;
  paidAt: string | null;
}

// Cancel Assignment Request
export interface CancelAssignmentRequest {
  reason: string;
  employeeId: string;
}

// Generic Pagination
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> extends ApiResponse {
  data: {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
  };
}

// Error Response
export interface ErrorResponse {
  success: false;
  message: string;
  details?: string;
}

// ============================================
// Employee Working Hours Types
// ============================================

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface WorkingHours {
  workingHoursId: string;
  dayOfWeek: DayOfWeek;
  dayOfWeekDisplay: string;
  startTime: string | null; // "HH:mm:ss" format
  endTime: string | null;
  isWorkingDay: boolean;
  breakStartTime: string | null;
  breakEndTime: string | null;
}

export interface SetWorkingHoursRequest {
  employeeId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
}

export interface DaySchedule {
  dayOfWeek: DayOfWeek;
  startTime: string | null;
  endTime: string | null;
  isWorkingDay: boolean;
  breakStartTime?: string | null;
  breakEndTime?: string | null;
}

export interface SetWeeklyWorkingHoursRequest {
  employeeId: string;
  weeklySchedule: DaySchedule[];
}

// ============================================
// Available Slots Types
// ============================================

export interface AvailableEmployee {
  employeeId: string;
  fullName: string;
  avatar?: string | null;
  rating?: number;
  experienceYears?: number;
  servicesProvided?: number;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  availableEmployeeCount: number;
  availableEmployees: AvailableEmployee[];
}

export interface DailyAvailableSlots {
  date: string;
  dayOfWeek: string;
  totalSlots: number;
  totalAvailableEmployees: number;
  slots: AvailableSlot[];
}

export interface AvailableSlotsParams {
  date: string; // YYYY-MM-DD
  ward?: string;
  city?: string;
  serviceId?: number;
  durationMinutes?: number;
  slotIntervalMinutes?: number;
}

export interface AvailableSlotsRangeParams {
  startDate: string;
  endDate: string;
  ward?: string;
  city?: string;
  serviceId?: number;
  durationMinutes?: number;
  slotIntervalMinutes?: number;
}

export interface CheckSlotParams {
  startTime: string;
  endTime: string;
  ward?: string;
  city?: string;
  minEmployees?: number;
}
