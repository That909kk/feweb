import React, { useEffect, useState } from 'react';
import type { Conversation } from '../../types/chat';
import { getConversationsBySenderApi } from '../../api/chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

interface ConversationListProps {
  senderId: string; // customerId or employeeId
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  senderId,
  selectedConversationId,
  onConversationSelect,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, [senderId]);

  const loadConversations = async () => {
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
      
      // Sort conversations: active ones (canChat = true) first, locked ones (canChat = false) at bottom
      const sortedConversations = (response.data || []).sort((a, b) => {
        // If both have same canChat status, keep original order (by lastMessageTime from API)
        if (a.canChat === b.canChat) return 0;
        // Put active conversations (canChat = true) first
        return a.canChat ? -1 : 1;
      });
      
      setConversations(sortedConversations);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
      setError('Không thể tải danh sách cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

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

  if (conversations.length === 0) {
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
      {conversations.map((conversation) => {
        const isSelected = conversation.conversationId === selectedConversationId;
        const otherPersonName = conversation.employeeName || conversation.customerName;
        const otherPersonAvatar = conversation.employeeAvatar || conversation.customerAvatar;

        return (
          <div
            key={conversation.conversationId}
            onClick={() => onConversationSelect(conversation)}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              isSelected
                ? 'bg-blue-50 border-l-4 border-blue-600'
                : 'hover:bg-gray-50 border-l-4 border-transparent'
            } ${!conversation.canChat ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0 relative">
                {otherPersonAvatar ? (
                  <img
                    src={otherPersonAvatar}
                    alt={otherPersonName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {otherPersonName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {!conversation.canChat && (
                  <div className="absolute -bottom-1 -right-1 bg-gray-400 rounded-full p-1" title="Không thể trò chuyện">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {otherPersonName}
                  </h4>
                  {conversation.lastMessageTime && (
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatTime(conversation.lastMessageTime)}
                    </span>
                  )}
                </div>
                {conversation.lastMessage && (
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {conversation.bookingId && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      Booking
                    </span>
                  )}
                  {!conversation.canChat && (
                    <span className="inline-block px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                      Đã khóa
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
