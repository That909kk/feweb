import React, { useEffect, useState } from 'react';
import { X, Bell, AlertCircle } from 'lucide-react';
import type { NotificationWebSocketDTO } from '../services/notificationWebSocket';

interface NotificationToastProps {
  notification: NotificationWebSocketDTO;
  onClose: () => void;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  notification, 
  onClose, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto close
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClick = () => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    handleClose();
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'URGENT':
        return 'bg-red-50 border-red-500';
      case 'HIGH':
        return 'bg-orange-50 border-orange-500';
      default:
        return 'bg-blue-50 border-blue-500';
    }
  };

  const getIcon = () => {
    if (notification.priority === 'URGENT') {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <Bell className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div
      className={`
        fixed top-20 right-4 z-[9999] max-w-md w-full
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          border-l-4 rounded-lg shadow-lg p-4
          ${getPriorityStyles()}
          cursor-pointer hover:shadow-xl transition-shadow
        `}
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm mb-1">
              {notification.title}
            </h4>
            <p className="text-gray-700 text-sm line-clamp-2">
              {notification.message}
            </p>
            {notification.actionUrl && (
              <p className="text-xs text-blue-600 mt-2 font-medium">
                Nhấn để xem chi tiết →
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface NotificationToastContainerProps {
  notifications: NotificationWebSocketDTO[];
  onRemove: (id: string) => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  notifications,
  onRemove
}) => {
  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.notificationId}
          style={{ top: `${80 + index * 120}px` }}
          className="fixed right-4 z-[9999]"
        >
          <NotificationToast
            notification={notification}
            onClose={() => onRemove(notification.notificationId)}
            duration={notification.priority === 'URGENT' ? 8000 : 5000}
          />
        </div>
      ))}
    </>
  );
};

export default NotificationToast;
