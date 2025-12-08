import { api } from './client';

/**
 * Review API Service
 * Base URL: /api/v1/reviews
 */

export interface ReviewCriteria {
  criteriaId: number;
  criteriaName: string;
}

export interface CriteriaRating {
  criteriaId: number;
  rating: number;
}

export interface ReviewDetail {
  criteriaId: number;
  criteriaName: string;
  rating: number;
}

export interface Review {
  reviewId: number;
  bookingId: string;
  customerId: string;
  employeeId: string;
  comment: string;
  createdAt: string;
  details: ReviewDetail[];
}

export interface CreateReviewRequest {
  bookingId: string;
  employeeId: string;
  comment: string;
  criteriaRatings: CriteriaRating[];
}

export interface EmployeeReviewSummary {
  employeeId: string;
  totalReviews: number;
  averageRating: number;
  ratingTier: string | null;
}

export interface PaginatedReviews {
  content: Review[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      orderBy: string;
      direction: string;
    };
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
}

// Create a review
export const createReviewApi = async (data: CreateReviewRequest): Promise<Review> => {
  const response = await api.post<Review>('/reviews', data);
  return response.data;
};

// Get all review criteria (no auth required)
export const getReviewCriteriaApi = async (): Promise<ReviewCriteria[]> => {
  const response = await api.get<ReviewCriteria[]>('/reviews/criteria');
  return response.data;
};

// Get reviews for a specific employee
export const getEmployeeReviewsApi = async (
  employeeId: string,
  page: number = 0,
  size: number = 10
): Promise<PaginatedReviews> => {
  const response = await api.get<PaginatedReviews>(`/reviews/employees/${employeeId}/reviews`, {
    params: { page, size }
  });
  return response.data;
};

// Get employee review summary
export const getEmployeeReviewSummaryApi = async (employeeId: string): Promise<EmployeeReviewSummary> => {
  const response = await api.get<EmployeeReviewSummary>(`/reviews/employees/${employeeId}/reviews/summary`);
  return response.data;
};

// Pending review item - Booking đã hoàn thành chưa đánh giá
export interface PendingReviewItem {
  bookingId: string;
  bookingCode: string;
  bookingTime: string;
  assignmentId: string;
  serviceName: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
}

export interface PendingReviewsResponse {
  success: boolean;
  data: PendingReviewItem[];
  total: number;
}

// Get pending reviews for current customer (bookings completed but not reviewed)
export const getPendingReviewsApi = async (): Promise<PendingReviewsResponse> => {
  const response = await api.get<PendingReviewsResponse>('/reviews/pending');
  return response.data;
};
