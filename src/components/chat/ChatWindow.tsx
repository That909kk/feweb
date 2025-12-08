import React, { useEffect, useState } from 'react';
import type { Conversation, ChatMessage } from '../../types/chat';
import { getMessagesApi, sendTextMessageApi, sendImageMessageApi, markMessagesAsReadApi } from '../../api/chat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { webSocketService } from '../../services/websocket';

interface ChatWindowProps {
  conversation: Conversation;
  currentAccountId: string; // accountId - dùng cho send message & mark-read
  currentSenderId: string; // customerId hoặc employeeId - dùng để xác định user hiện tại
  onBack?: () => void;
  onMessagesRead?: (conversationId: string) => void; // Callback khi đã mark messages as read
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  currentAccountId,
  currentSenderId,
  onBack,
  onMessagesRead
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Xác định tên và avatar của người đối thoại (không phải mình)
  // So sánh currentSenderId (customerId/employeeId) với conversation
  const isCurrentUserCustomer = currentSenderId === conversation.customerId;
  
  // Nếu user hiện tại là Customer → hiển thị thông tin Employee
  // Nếu user hiện tại là Employee → hiển thị thông tin Customer
  const otherPersonName = isCurrentUserCustomer 
    ? conversation.employeeName 
    : conversation.customerName;
      
  const otherPersonAvatar = isCurrentUserCustomer 
    ? conversation.employeeAvatar 
    : conversation.customerAvatar;

  // Debug: Log để kiểm tra
  useEffect(() => {
    console.log('🔍 [ChatWindow] currentAccountId:', currentAccountId);
    console.log('🔍 [ChatWindow] currentSenderId:', currentSenderId);
    console.log('🔍 [ChatWindow] conversation.customerId:', conversation.customerId);
    console.log('🔍 [ChatWindow] conversation.employeeId:', conversation.employeeId);
    console.log('🔍 [ChatWindow] isCurrentUserCustomer:', isCurrentUserCustomer);
    console.log('🔍 [ChatWindow] otherPersonName:', otherPersonName);
  }, [currentAccountId, currentSenderId, conversation, isCurrentUserCustomer, otherPersonName]);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    markAsRead();

    return () => {
      webSocketService.unsubscribeFromConversation(conversation.conversationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.conversationId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMessagesApi(conversation.conversationId, {
        page: 0,
        size: 50
      });
      // Messages are in descending order, reverse to show oldest first
      setMessages([...(response.data || [])].reverse());
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError('Không thể tải tin nhắn');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    webSocketService.subscribeToConversation(
      conversation.conversationId,
      (newMessage) => {
        console.log('New message received via WebSocket:', newMessage);
        
        // Convert WebSocket message to ChatMessage format
        const chatMessage: ChatMessage = {
          messageId: newMessage.messageId,
          conversationId: newMessage.conversationId,
          senderId: newMessage.senderId,
          senderName: newMessage.senderName,
          senderAvatar: newMessage.senderAvatar,
          messageType: newMessage.messageType,
          content: newMessage.content,
          imageUrl: newMessage.imageUrl,
          isRead: newMessage.isRead ?? false,
          createdAt: newMessage.timestamp || newMessage.createdAt || new Date().toISOString()
        };
        
        setMessages(prev => [...prev, chatMessage]);
        
        // Mark as read if sender is not current user
        if (newMessage.senderId !== currentAccountId) {
          markAsRead();
        }
      }
    );
  };

  const markAsRead = async () => {
    try {
      // receiverId phải là participantId (customerId hoặc employeeId), KHÔNG PHẢI accountId
      await markMessagesAsReadApi(conversation.conversationId, currentSenderId);
      // Thông báo cho parent component
      onMessagesRead?.(conversation.conversationId);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleSendText = async (content: string) => {
    try {
      // senderId phải là accountId, không phải customerId/employeeId
      await sendTextMessageApi({
        conversationId: conversation.conversationId,
        senderId: currentAccountId,
        content
      });
      
      // Message will be added via WebSocket automatically
      // No need to add optimistically to avoid duplicates
    } catch (err: any) {
      console.error('Error sending text:', err);
      throw err;
    }
  };

  const handleSendImage = async (file: File, caption?: string) => {
    try {
      await sendImageMessageApi({
        conversationId: conversation.conversationId,
        senderId: currentAccountId,
        imageFile: file,
        caption
      });

      // Message will be added via WebSocket automatically
      // No need to add optimistically to avoid duplicates
    } catch (err: any) {
      console.error('Error sending image:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadMessages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          {otherPersonAvatar ? (
            <img
              src={otherPersonAvatar}
              alt={otherPersonName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold">
                {otherPersonName?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-900">{otherPersonName}</h3>
            {conversation.bookingId && (
              <p className="text-xs text-gray-500">Liên quan đến booking</p>
            )}
          </div>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentAccountId}
      />

      {/* Input */}
      {conversation.canChat ? (
        <MessageInput
          onSendText={handleSendText}
          onSendImage={handleSendImage}
        />
      ) : (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Không thể trò chuyện - Booking đã hoàn thành hoặc bị hủy</span>
          </div>
        </div>
      )}
    </div>
  );
};
