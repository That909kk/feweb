import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { 
  getNotificationsApi, 
  getUnreadNotificationCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
  type Notification,
  type NotificationListParams
} from '../api/notification';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications';
import type { UserRole, NotificationWebSocketDTO } from '../services/notificationWebSocket';
import { NotificationToastContainer } from './NotificationToast';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [toastNotifications, setToastNotifications] = useState<NotificationWebSocketDTO[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine current role from user
  const currentRole: UserRole | null = user?.role as UserRole || null;
  
  // Show toast for new notifications
  const showNotificationToast = useCallback((notification: NotificationWebSocketDTO) => {
    console.log('[NotificationBell] New notification toast:', notification.title);
    
    // Add to toast notifications
    setToastNotifications(prev => [...prev, notification]);
    
    // Update the unread count and reload notifications list
    loadUnreadCount();
    
    // If dropdown is open, reload notifications
    if (isOpen) {
      loadNotifications(0);
    }
  }, [isOpen]);

  // Remove toast notification
  const removeToastNotification = useCallback((notificationId: string) => {
    setToastNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
  }, []);

  // WebSocket notifications (role-based)
  const { connected: wsConnected } = useWebSocketNotifications({
    accountId: user?.id,
    role: currentRole,
    enabled: !!user?.id && !!currentRole,
    onNotification: showNotificationToast
  });

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCountApi();
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Load notifications
  const loadNotifications = async (page: number = 0) => {
    setIsLoading(true);
    try {
      const params: NotificationListParams = {
        page,
        size: 10,
      };
      const response = await getNotificationsApi(params);
      if (response.success && response.data) {
        if (page === 0) {
          setNotifications(response.data);
        } else {
          setNotifications(prev => [...prev, ...response.data]);
        }
        setCurrentPage(response.currentPage);
        setTotalPages(response.totalPages);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsReadApi(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif.notificationId === notificationId
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotificationApi(notificationId);
      setNotifications(prev => prev.filter(notif => notif.notificationId !== notificationId));
      loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Load more notifications
  const handleLoadMore = () => {
    if (currentPage + 1 < totalPages) {
      loadNotifications(currentPage + 1);
    }
  };

  // Load unread count on mount and set interval
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadNotifications(0);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'BOOKING_CREATED':
      case 'BOOKING_CONFIRMED':
        return '📅';
      case 'BOOKING_CANCELLED':
        return '❌';
      case 'BOOKING_COMPLETED':
        return '✅';
      case 'ASSIGNMENT_CREATED':
        return '👷';
      case 'ASSIGNMENT_CANCELLED':
        return '🚫';
      case 'PAYMENT_SUCCESS':
        return '💰';
      case 'PAYMENT_FAILED':
        return '⚠️';
      case 'REVIEW_RECEIVED':
        return '⭐';
      case 'SYSTEM_ANNOUNCEMENT':
        return '📢';
      default:
        return '🔔';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* WebSocket Status Indicator */}
        {wsConnected && (
          <span className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-white" 
                title="Real-time notifications active" />
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="font-semibold text-gray-800">Thông báo</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(80vh - 60px)' }}>
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        handleMarkAsRead(notification.notificationId);
                      }
                      if (notification.actionUrl) {
                        window.location.href = notification.actionUrl;
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={`font-medium text-sm ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.notificationId);
                            }}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            aria-label="Xóa thông báo"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Load More Button */}
                {currentPage + 1 < totalPages && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full p-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Tải thêm'
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Toast Notifications */}
      <NotificationToastContainer 
        notifications={toastNotifications}
        onRemove={removeToastNotification}
      />
    </div>
  );
};

export default NotificationBell;
