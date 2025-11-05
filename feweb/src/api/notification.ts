import { api } from './client';
import type { ApiResponse } from './client';

/**
 * Notification API
 * Base URL: /api/v1/notifications
 * Requires: Authorization header, CUSTOMER/EMPLOYEE/ADMIN role
 */

export interface Notification {
  notificationId: string;
  accountId: string;
  type: 'BOOKING_CREATED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'BOOKING_COMPLETED' | 
        'ASSIGNMENT_CREATED' | 'ASSIGNMENT_CANCELLED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 
        'REVIEW_RECEIVED' | 'SYSTEM_ANNOUNCEMENT';
  title: string;
  message: string;
  relatedId: string | null;
  relatedType: 'BOOKING' | 'ASSIGNMENT' | 'PAYMENT' | 'REVIEW' | null;
  isRead: boolean;
  readAt: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  actionUrl: string | null;
  createdAt: string;
}

export interface NotificationListParams {
  page?: number;
  size?: number;
  isRead?: boolean;
  type?: string;
  priority?: string;
  fromDate?: string;
  toDate?: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: Notification[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

/**
 * Get all notifications with pagination and filters
 * Endpoint: GET /api/v1/notifications
 */
export const getNotificationsApi = async (
  params?: NotificationListParams
): Promise<NotificationListResponse> => {
  try {
    console.log('[API] Fetching notifications with params:', params);
    const response = await api.get<NotificationListResponse>('/notifications', { params });
    console.log('[API] Notifications fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 * Endpoint: GET /api/v1/notifications/unread-count
 */
export const getUnreadNotificationCountApi = async (): Promise<UnreadCountResponse> => {
  try {
    console.log('[API] Fetching unread notification count');
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    console.log('[API] Unread count:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Get notification by ID
 * Endpoint: GET /api/v1/notifications/{notificationId}
 */
export const getNotificationByIdApi = async (
  notificationId: string
): Promise<ApiResponse<Notification>> => {
  try {
    console.log(`[API] Fetching notification ${notificationId}`);
    const response = await api.get<ApiResponse<Notification>>(`/notifications/${notificationId}`);
    console.log('[API] Notification fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error fetching notification:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * Endpoint: PUT /api/v1/notifications/{notificationId}/read
 */
export const markNotificationAsReadApi = async (
  notificationId: string
): Promise<ApiResponse<Notification>> => {
  try {
    console.log(`[API] Marking notification ${notificationId} as read`);
    const response = await api.put<ApiResponse<Notification>>(`/notifications/${notificationId}/read`);
    console.log('[API] Notification marked as read:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 * Endpoint: PUT /api/v1/notifications/mark-all-read
 */
export const markAllNotificationsAsReadApi = async (): Promise<ApiResponse<{ updatedCount: number }>> => {
  try {
    console.log('[API] Marking all notifications as read');
    const response = await api.put<ApiResponse<{ updatedCount: number }>>('/notifications/mark-all-read');
    console.log('[API] All notifications marked as read:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 * Endpoint: DELETE /api/v1/notifications/{notificationId}
 */
export const deleteNotificationApi = async (
  notificationId: string
): Promise<ApiResponse<void>> => {
  try {
    console.log(`[API] Deleting notification ${notificationId}`);
    const response = await api.delete<ApiResponse<void>>(`/notifications/${notificationId}`);
    console.log('[API] Notification deleted:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error deleting notification:', error);
    throw error;
  }
};

/**
 * Create notification (Admin only)
 * Endpoint: POST /api/v1/notifications
 */
export const createNotificationApi = async (data: {
  accountId: string;
  type: Notification['type'];
  title: string;
  message: string;
  relatedId?: string | null;
  relatedType?: Notification['relatedType'];
  priority?: Notification['priority'];
  actionUrl?: string | null;
}): Promise<ApiResponse<Notification>> => {
  try {
    console.log('[API] Creating notification:', data);
    const response = await api.post<ApiResponse<Notification>>('/notifications', data);
    console.log('[API] Notification created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[API] Error creating notification:', error);
    throw error;
  }
};
