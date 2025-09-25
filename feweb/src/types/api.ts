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

export interface CalculatePriceRequest {
  serviceId: number;
  selectedChoiceIds: number[];
  quantity: number;
}

export interface CalculatePriceResponse extends ApiResponse {
  data: {
    basePrice: number;
    optionAdjustments: number;
    total: number;
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
  addressId: string; // Required by backend validation (@NotBlank)
  fullAddress?: string | null; // Optional alternative (not currently used)
  bookingTime: string;
  note?: string | null;
  promoCode?: string | null;
  bookingDetails: BookingDetailRequest[];
  assignments?: BookingAssignmentRequest[];
  paymentMethodId: number;
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
  id: number;
  name: string;
  type: 'CASH' | 'MOMO' | 'VNPAY' | 'BANK_TRANSFER';
  status: string;
}

export interface CreatePaymentRequest {
  bookingId: string;
  methodId: number;
  amount: number;
}

export interface PaymentResponse extends ApiResponse {
  data: {
    paymentId: string;
    bookingId: string;
    methodId: number;
    amount: number;
    status: string;
    paymentUrl?: string; // For online payment methods
    createdAt: string;
  };
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