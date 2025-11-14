import { useEffect, useState, useCallback } from 'react';
import { 
  notificationWebSocketService, 
  type NotificationWebSocketDTO,
  type UserRole 
} from '../services/notificationWebSocket';

interface UseWebSocketNotificationsOptions {
  accountId: string | null | undefined;
  role: UserRole | null | undefined;
  enabled?: boolean;
  onNotification?: (notification: NotificationWebSocketDTO) => void;
}

export const useWebSocketNotifications = ({
  accountId,
  role,
  enabled = true,
  onNotification
}: UseWebSocketNotificationsOptions) => {
  const [notifications, setNotifications] = useState<NotificationWebSocketDTO[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handler cho notifications mới
  const handleNotification = useCallback((notification: NotificationWebSocketDTO) => {
    console.log('[useWebSocketNotifications] New notification:', notification);
    
    // Thêm vào danh sách notifications
    setNotifications(prev => [notification, ...prev]);
    
    // Gọi callback nếu có
    if (onNotification) {
      onNotification(notification);
    }
    
    // Play sound cho urgent notifications
    if (notification.priority === 'URGENT') {
      playNotificationSound();
    }
  }, [onNotification]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      // Tạo simple beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('[useWebSocketNotifications] Error playing sound:', error);
    }
  }, []);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Remove notification by ID
  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
  }, []);

  useEffect(() => {
    if (!enabled || !accountId || !role) {
      console.log('[useWebSocketNotifications] WebSocket disabled or missing accountId/role');
      return;
    }

    console.log(`[useWebSocketNotifications] Connecting for account ${accountId} with role ${role}`);

    // Connect to WebSocket
    notificationWebSocketService.connect(accountId, role)
      .then(() => {
        console.log('[useWebSocketNotifications] Connected successfully');
        setConnected(true);
        setError(null);
      })
      .catch((err) => {
        console.error('[useWebSocketNotifications] Connection error:', err);
        setConnected(false);
        setError(err);
      });

    // Subscribe to notifications
    const unsubscribe = notificationWebSocketService.onNotification(handleNotification);

    // Connection handlers
    const handleConnected = () => {
      console.log('[useWebSocketNotifications] Connection established');
      setConnected(true);
      setError(null);
    };

    const handleDisconnected = () => {
      console.log('[useWebSocketNotifications] Connection lost');
      setConnected(false);
    };

    const handleError = (err: any) => {
      console.error('[useWebSocketNotifications] WebSocket error:', err);
      setError(err);
    };

    notificationWebSocketService.onConnected(handleConnected);
    notificationWebSocketService.onDisconnected(handleDisconnected);
    notificationWebSocketService.onError(handleError);

    // Cleanup
    return () => {
      unsubscribe();
      notificationWebSocketService.disconnect();
    };
  }, [accountId, role, enabled, handleNotification]);

  return {
    notifications,
    connected,
    error,
    clearNotifications,
    removeNotification
  };
};
