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
    account: {
      accountId: string;
      username: string;
      password: string;
      phoneNumber: string;
      status: string;
      isPhoneVerified: boolean;
      createdAt: string;
      updatedAt: string;
      lastLogin: string;
      roles: Array<{
        roleId: number;
        roleName: string;
      }>;
    };
    avatar?: string;
    fullName: string;
    isMale: boolean;
    email: string;
    birthdate?: string;
    rating?: number | null;
    vipLevel?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface EmployeeData {
  employeeId: string;
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
  addressId: string | null; // Can be null when using fullAddress
  fullAddress?: string | null; // Optional alternative for new address
  bookingTime: string;
  note?: string | null;
  promoCode?: string | null;
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
    scheduledDate: string;
    scheduledTime: string;
    address: string;
    notes?: string;
    employeeId?: string;
    createdAt: string;
    updatedAt: string;
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
  amount: number;
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
