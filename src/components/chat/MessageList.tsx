import React, { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../types/chat';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onLoadMore,
  hasMore,
  loading
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imageModal, setImageModal] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessageTime = (dateString: string) => {
    if (!dateString) {
      return '';
    }
    
    try {
      const date = new Date(dateString);
      
      // Kiểm tra date có hợp lệ không
      if (isNaN(date.getTime())) {
        console.warn('[MessageList] Invalid date:', dateString);
        return '';
      }
      
      if (isToday(date)) {
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        return 'Hôm qua ' + format(date, 'HH:mm');
      } else {
        return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
      }
    } catch (error) {
      console.error('[MessageList] Error formatting date:', dateString, error);
      return '';
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="mt-2">Chưa có tin nhắn nào</p>
          <p className="text-sm mt-1">Gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : 'Tải tin nhắn cũ hơn'}
          </button>
        )}

        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          
          // Debug: Log message để kiểm tra createdAt
          if (!message.createdAt) {
            console.warn('[MessageList] Message missing createdAt:', message);
          }

          return (
            <div
              key={message.messageId}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-1.5 sm:space-x-2 max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar */}
                {!isOwn && (
                  <div className="flex-shrink-0">
                    {message.senderAvatar ? (
                      <img
                        src={message.senderAvatar}
                        alt={message.senderName}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-[10px] sm:text-xs">
                          {message.senderName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div>
                  {message.messageType === 'TEXT' && message.content && (
                    <div
                      className={`rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 ${
                        isOwn
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                    </div>
                  )}

                  {message.messageType === 'IMAGE' && message.imageUrl && (
                    <div
                      className={`rounded-2xl overflow-hidden ${
                        isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
                      }`}
                    >
                      <img
                        src={message.imageUrl}
                        alt="Hình ảnh"
                        className="max-w-[200px] sm:max-w-xs max-h-48 sm:max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setImageModal(message.imageUrl)}
                      />
                      {message.content && (
                        <div
                          className={`px-4 py-2 ${
                            isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap text-sm">{message.content}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time and status */}
                  <div className={`flex items-center space-x-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-gray-500">
                      {formatMessageTime(message.createdAt)}
                    </span>
                    {isOwn && (
                      <span className="text-xs">
                        {message.isRead ? (
                          <CheckCheck className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Image modal - outside scrollable area */}
      {imageModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setImageModal(null)}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={imageModal}
            alt="Xem ảnh lớn"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
