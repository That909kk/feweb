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

// Service Options Types
export interface ServiceOption {
  optionId: number;
  optionName: string;
  optionType: 'SINGLE_CHOICE_RADIO' | 'SINGLE_CHOICE_DROPDOWN' | 'MULTIPLE_CHOICE_CHECKBOX' | 'QUANTITY_INPUT';
  displayOrder: number;
  isRequired: boolean;
  parentChoiceId?: number;
  choices: ServiceOptionChoice[];
}

export interface ServiceOptionChoice {
  choiceId: number;
  choiceName: string;
  displayOrder: number;
  isDefault: boolean;
}

export interface ServiceWithOptions extends Service {
  options: ServiceOption[];
}

// Price Calculation Types
export interface PriceCalculationRequest {
  serviceId: number;
  selectedChoiceIds: number[];
  quantity?: number;
}

export interface PriceCalculationResponse extends ApiResponse {
  data: {
    serviceId: number;
    serviceName: string;
    basePrice: number;
    totalAdjustment: number;
    finalPrice: number;
    suggestedStaff: number;
    estimatedDurationHours: number;
    formattedPrice: string;
    formattedDuration: string;
  };
}

// Suitable Employees Types
export interface SuitableEmployeesRequest {
  serviceId: number;
  bookingTime: string; // ISO datetime
  latitude: number;
  longitude: number;
  selectedChoiceIds?: number[];
}

export interface SuitableEmployee {
  employeeId: string;
  fullName: string;
  avatar: string;
  skills: string[];
  rating: string;
  status: string;
  workingDistricts: string[];
  workingCity: string;
  completedJobs: number;
}

export interface SuitableEmployeesResponse extends ApiResponse {
  data: {
    availableEmployees: SuitableEmployee[];
    totalFound: number;
    requiredStaff: number;
  };
}

// Booking Validation Types
export interface BookingValidationRequest {
  addressId?: string;
  newAddress?: {
    customerId: string;
    fullAddress: string;
    ward: string;
    district: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  bookingTime: string; // ISO datetime
  note?: string;
  promoCode?: string | null;
  bookingDetails: Array<{
    serviceId: number;
    quantity: number;
    expectedPrice: number;
    expectedPricePerUnit: number;
    selectedChoiceIds: number[];
  }>;
  assignments?: Array<{
    serviceId: number;
    employeeId: string;
  }> | null;
  paymentMethodId: number;
}

export interface BookingValidationResponse {
  valid: boolean; // API returns 'valid' not 'isValid'
  calculatedTotalAmount: number | null;
  formattedTotalAmount?: string;
  errors: string[];
  conflicts: Array<{
    conflictType: string;
    employeeId: string;
    conflictStartTime: string;
    conflictEndTime: string;
    reason: string;
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
    recommendedStaff: number;
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
    district: string;
    city: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  } | null;
  usingNewAddress: boolean;
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
  addressId?: string | null;
  newAddress?: {
    customerId: string;
    fullAddress: string;
    ward: string;
    district: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  bookingTime: string;
  note?: string | null;
  promoCode?: string | null;
  bookingDetails: BookingDetailRequest[];
  assignments?: BookingAssignmentRequest[] | null;
  paymentMethodId: number;
}

export interface BookingResponse {
  bookingId: string;
  bookingCode: string;
  status: string;
  totalAmount: number;
  formattedTotalAmount: string;
  bookingTime: string;
  createdAt: string;
  customerInfo: {
    addressId: string;
    fullAddress: string;
    ward: string;
    district: string;
    city: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
  };
  serviceDetails: Array<{
    bookingDetailId: string;
    service: {
      serviceId: number;
      name: string;
      description: string;
      basePrice: number;
      unit: string;
      estimatedDurationHours: number;
      iconUrl: string;
      categoryName: string;
      isActive: boolean;
    };
    quantity: number;
    pricePerUnit: number;
    formattedPricePerUnit: string;
    subTotal: number;
    formattedSubTotal: string;
    selectedChoices: Array<{
      choiceId: number;
      choiceName: string;
      optionName: string;
      priceAdjustment: number;
      formattedPriceAdjustment: string;
    }>;
    assignments: Array<{
      assignmentId: string;
      employee: {
        employeeId: string;
        fullName: string;
        email: string;
        phoneNumber: string;
        avatar: string;
      };
      status: string;
    }>;
    duration: string;
    formattedDuration: string;
  }>;
  paymentInfo: {
    paymentId: string;
    amount: number;
    paymentMethod: {
      methodId: number;
      name: string;
      isActive: boolean;
    };
    paymentStatus: string;
    transactionCode: string;
    createdAt: string;
    paidAt: string | null;
  };
  promotionApplied: any | null;
  assignedEmployees: Array<{
    employeeId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    avatar: string;
    rating: number | null;
    employeeStatus: string;
    skills: string[];
    bio: string;
  }>;
  totalServices: number;
  totalEmployees: number;
  estimatedDuration: string;
  hasPromotion: boolean;
}

// Payment Method Types
export interface PaymentMethod {
  methodId: number;
  methodCode: string;
  methodName: string;
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