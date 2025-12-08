import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { Conversation } from '../../types/chat';
import { getConversationsBySenderApi, getUnreadMessageCountApi } from '../../api/chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

interface ConversationSummary {
  lastMessage: string;
  lastMessageTime: string;
}

interface ConversationListProps {
  senderId: string; // customerId or employeeId - dùng cho cả API conversations và unread-count
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
  unreadCounts?: Map<string, number>; // Map<conversationId, unreadCount> - từ WebSocket realtime
  conversationSummaries?: Map<string, ConversationSummary>; // Map<conversationId, summary> - từ WebSocket realtime
}

export const ConversationList: React.FC<ConversationListProps> = ({
  senderId,
  selectedConversationId,
  onConversationSelect,
  unreadCounts: externalUnreadCounts,
  conversationSummaries,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localUnreadCounts, setLocalUnreadCounts] = useState<Map<string, number>>(new Map());

  // Fetch unread counts cho các conversations có thể chat
  const fetchUnreadCounts = useCallback(async (conversationsList: Conversation[]) => {
    const counts = new Map<string, number>();
    
    // Chỉ fetch unread count cho các conversation có canChat = true
    const activeConversations = conversationsList.filter(conv => conv.canChat);
    
    await Promise.all(
      activeConversations.map(async (conv) => {
        try {
          // receiverId phải là participantId (customerId hoặc employeeId), KHÔNG PHẢI accountId
          const response = await getUnreadMessageCountApi(conv.conversationId, senderId);
          if (response.success && response.data) {
            counts.set(conv.conversationId, response.data.unreadCount);
          }
        } catch (err) {
          console.error(`[ConversationList] Error fetching unread count for ${conv.conversationId}:`, err);
          counts.set(conv.conversationId, 0);
        }
      })
    );
    
    setLocalUnreadCounts(counts);
  }, [senderId]);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[ConversationList] Loading conversations for senderId:', senderId);
      const response = await getConversationsBySenderApi(senderId, {
        page: 0,
        size: 50,
      });
      console.log('[ConversationList] API response:', response);
      console.log('[ConversationList] Conversations data:', response.data);
      console.log('[ConversationList] Number of conversations:', response.data?.length || 0);
      
      // Lưu conversations, sẽ được sort trong useMemo
      const conversationsList = response.data || [];
      setConversations(conversationsList);
      
      // Fetch unread counts sau khi load conversations
      if (conversationsList.length > 0) {
        fetchUnreadCounts(conversationsList);
      }
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError('Không thể tải danh sách cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  }, [senderId, fetchUnreadCounts]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return '';
    }
  };

  // Merge conversations với realtime summaries, lọc bỏ canChat = false và sort theo lastMessageTime mới nhất
  const sortedConversations = useMemo(() => {
    // Chỉ lấy các conversation có thể chat
    const activeConversations = conversations.filter(conv => conv.canChat);
    
    const merged = activeConversations.map(conv => {
      const summary = conversationSummaries?.get(conv.conversationId);
      if (summary) {
        return {
          ...conv,
          lastMessage: summary.lastMessage,
          lastMessageTime: summary.lastMessageTime
        };
      }
      return conv;
    });

    // Sort theo lastMessageTime (mới nhất lên đầu)
    return merged.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
  }, [conversations, conversationSummaries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={loadConversations}
          className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (sortedConversations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MessageCircle className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <p className="text-lg font-medium">Chưa có cuộc trò chuyện nào</p>
        <p className="text-sm mt-2">Bắt đầu trò chuyện với nhân viên hoặc khách hàng</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sortedConversations.map((conversation) => {
        const isSelected = conversation.conversationId === selectedConversationId;
        
        // Xác định tên và avatar người đối thoại
        // So sánh senderId với conversation để biết user hiện tại là ai
        const isCurrentUserCustomer = senderId === conversation.customerId;
        
        // Customer thấy tên Employee, Employee thấy tên Customer
        const otherPersonName = isCurrentUserCustomer 
          ? conversation.employeeName 
          : conversation.customerName;
          
        const otherPersonAvatar = isCurrentUserCustomer 
          ? conversation.employeeAvatar 
          : conversation.customerAvatar;

        // Lấy unreadCount: ưu tiên external (từ WebSocket) > local (từ API fetch) > conversation object
        const unreadCount = externalUnreadCounts?.get(conversation.conversationId) 
          ?? localUnreadCounts.get(conversation.conversationId) 
          ?? conversation.unreadCount 
          ?? 0;

        return (
          <div
            key={conversation.conversationId}
            onClick={() => onConversationSelect(conversation)}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              isSelected
                ? 'bg-blue-50 border-l-4 border-blue-600'
                : 'hover:bg-gray-50 border-l-4 border-transparent'
            }`}
          >
            <div className="flex items-start space-x-2 sm:space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                {otherPersonAvatar ? (
                  <img
                    src={otherPersonAvatar}
                    alt={otherPersonName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-base sm:text-lg">
                      {otherPersonName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Badge unread count */}
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-sm font-semibold truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                    {otherPersonName}
                  </h4>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessageTime)}
                      </span>
                    )}
                  </div>
                </div>
                {conversation.lastMessage && (
                  <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {conversation.lastMessage}
                  </p>
                )}
                {conversation.bookingId && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      Booking
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
