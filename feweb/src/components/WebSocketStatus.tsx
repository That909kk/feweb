import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications';
import type { UserRole } from '../services/notificationWebSocket';
import { Bell, Wifi, WifiOff } from 'lucide-react';

/**
 * WebSocket Notification Status Component
 * Hiển thị trạng thái kết nối WebSocket real-time
 */
export const WebSocketStatus: React.FC = () => {
  const { user } = useAuth();
  const currentRole: UserRole | null = user?.role as UserRole || null;

  const { connected, notifications } = useWebSocketNotifications({
    accountId: user?.id,
    role: currentRole,
    enabled: !!user?.id && !!currentRole
  });

  if (!user?.id || !currentRole) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm
        ${connected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}
      `}>
        {connected ? (
          <>
            <Wifi className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-medium">
              Real-time Active
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">
              Connecting...
            </span>
          </>
        )}
        {notifications.length > 0 && (
          <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-white rounded-full">
            <Bell className="w-3 h-3 text-blue-600" />
            <span className="text-xs font-semibold text-blue-600">
              {notifications.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebSocketStatus;
