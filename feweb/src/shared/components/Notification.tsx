import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  autoClose = false,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getStylesByType = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-100 border-green-400 text-green-700',
          icon: <CheckCircle className="w-5 h-5" />,
          iconColor: 'text-green-500'
        };
      case 'error':
        return {
          container: 'bg-red-100 border-red-400 text-red-700',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          container: 'bg-yellow-100 border-yellow-400 text-yellow-700',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-yellow-500'
        };
      case 'info':
        return {
          container: 'bg-blue-100 border-blue-400 text-blue-700',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-blue-500'
        };
      default:
        return {
          container: 'bg-gray-100 border-gray-400 text-gray-700',
          icon: <AlertCircle className="w-5 h-5" />,
          iconColor: 'text-gray-500'
        };
    }
  };

  const styles = getStylesByType();

  return (
    <div className={`p-4 border rounded-md ${styles.container} flex items-start space-x-3`}>
      <div className={styles.iconColor}>
        {styles.icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Notification;