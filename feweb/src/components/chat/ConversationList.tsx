import React, { useEffect, useState } from 'react';
import { Conversation } from '../../types/chat';
import { getConversationsByAccountApi } from '../../api/chat';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MessageCircle } from 'lucide-react';

interface ConversationListProps {
  accountId: string;
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  accountId,
  selectedConversationId,
  onConversationSelect,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, [accountId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getConversationsByAccountApi(accountId, {
        page: 0,
        size: 50,
      });
      setConversations(response.data || []);
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
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
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
                {conversation.bookingId && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    Booking
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
