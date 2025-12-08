/**
 * Additional Fee Types
 * Dựa theo booking-fee-endpoints.md
 */

export type FeeType = 'PERCENT' | 'FLAT';

export interface AdditionalFee {
  id: string;
  name: string;
  description: string;
  feeType: FeeType;
  value: number; // Nếu PERCENT thì value là tỷ lệ (0.20 = 20%), nếu FLAT thì value là số tiền
  systemSurcharge: boolean; // true = phí hệ thống mặc định
  active: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdditionalFeeRequest {
  name: string;
  description: string;
  feeType: FeeType;
  value: number;
  systemSurcharge?: boolean;
  active?: boolean;
  priority?: number;
}

export interface UpdateAdditionalFeeRequest {
  name: string;
  description: string;
  feeType: FeeType;
  value: number;
  systemSurcharge?: boolean;
  active?: boolean;
  priority?: number;
}

// Fee breakdown trong booking response
export interface BookingFee {
  name: string;
  type: FeeType;
  value: number;
  amount: number; // Số tiền thực tế được tính
  systemSurcharge: boolean;
}

// Paginated response cho danh sách phụ phí
export interface AdditionalFeePaginatedResponse {
  content: AdditionalFee[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  first: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  empty: boolean;
}
