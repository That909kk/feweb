import { useState, useEffect, useCallback, useRef } from 'react';
import { getConversationsBySenderApi, getUnreadMessageCountApi } from '../api/chat';
import { webSocketService } from '../services/websocket';
import type { ConversationSummaryDTO } from '../types/chat';

interface UseChatUnreadCountOptions {
  /** senderId là customerId hoặc employeeId */
  senderId: string | null | undefined;
  /** Có enable hook không */
  enabled?: boolean;
  /** Interval refresh (ms), mặc định 60s */
  refreshInterval?: number;
}

interface UseChatUnreadCountResult {
  /** Tổng số tin nhắn chưa đọc (chỉ từ conversations có thể chat) */
  unreadCount: number;
  /** Đang loading */
  loading: boolean;
  /** Lỗi nếu có */
  error: Error | null;
  /** Refresh manually */
  refresh: () => Promise<void>;
}

/**
 * Hook để lấy tổng số tin nhắn chat chưa đọc
 * - Chỉ tính từ các conversations có canChat = true
 * - Subscribe WebSocket để cập nhật realtime
 * - Auto refresh theo interval
 */
export const useChatUnreadCount = ({
  senderId,
  enabled = true,
  refreshInterval = 60000
}: UseChatUnreadCountOptions): UseChatUnreadCountResult => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const subscribedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch tổng unread count từ các conversations có canChat = true
  const fetchUnreadCount = useCallback(async () => {
    if (!senderId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 1. Lấy danh sách conversations
      const conversationsResponse = await getConversationsBySenderApi(senderId, { page: 0, size: 100 });
      const conversations = conversationsResponse.data || [];
      
      // 2. Lọc chỉ lấy conversations có canChat = true
      const activeConversations = conversations.filter(conv => conv.canChat);
      
      if (activeConversations.length === 0) {
        setUnreadCount(0);
        return;
      }
      
      // 3. Fetch unread count cho từng conversation
      const counts = await Promise.all(
        activeConversations.map(async (conv) => {
          try {
            const response = await getUnreadMessageCountApi(conv.conversationId, senderId);
            return response.success && response.data ? response.data.unreadCount : 0;
          } catch {
            return 0;
          }
        })
      );
      
      // 4. Tính tổng
      const total = counts.reduce((sum, count) => sum + count, 0);
      setUnreadCount(total);
      
    } catch (err) {
      console.error('[useChatUnreadCount] Error fetching unread count:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch unread count'));
    } finally {
      setLoading(false);
    }
  }, [senderId]);

  // Handler cho WebSocket conversation summary
  const handleSummary = useCallback((summary: ConversationSummaryDTO) => {
    console.log('[useChatUnreadCount] Received summary:', summary);
    // Khi nhận được summary mới, refresh lại tổng unread count
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Subscribe WebSocket khi connected
  useEffect(() => {
    if (!enabled || !senderId) return;

    const checkAndSubscribe = () => {
      if (webSocketService.isConnected() && !subscribedRef.current) {
        console.log('[useChatUnreadCount] Subscribing to summary for:', senderId);
        webSocketService.subscribeToConversationSummary(senderId, handleSummary);
        subscribedRef.current = true;
      }
    };

    // Check ngay khi mount
    checkAndSubscribe();

    // Đăng ký handler khi connected
    const onConnected = () => {
      checkAndSubscribe();
    };

    webSocketService.onConnected(onConnected);

    return () => {
      if (subscribedRef.current && senderId) {
        webSocketService.unsubscribeFromConversationSummary(senderId);
        subscribedRef.current = false;
      }
    };
  }, [enabled, senderId, handleSummary]);

  // Fetch ban đầu và setup interval
  useEffect(() => {
    if (!enabled || !senderId) return;

    // Fetch ngay lập tức
    fetchUnreadCount();

    // Setup interval refresh
    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, senderId, fetchUnreadCount, refreshInterval]);

  return {
    unreadCount,
    loading,
    error,
    refresh: fetchUnreadCount
  };
};

export default useChatUnreadCount;
