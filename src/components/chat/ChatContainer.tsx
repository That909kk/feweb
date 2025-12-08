import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { Conversation, ConversationSummaryDTO } from '../../types/chat';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { webSocketService } from '../../services/websocket';
import { getConversationByIdApi } from '../../api/chat';
import { MessageCircle } from 'lucide-react';

interface ChatContainerProps {
  senderId: string; // customerId (for CUSTOMER) or employeeId (for EMPLOYEE) - dùng cho GET conversations
  accountId: string; // accountId - dùng cho send message và mark-read
  initialConversationId?: string; // conversationId để tự động mở conversation khi vào trang
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  senderId,
  accountId,
  initialConversationId
}) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [isLoadingInitialConversation, setIsLoadingInitialConversation] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  // State để lưu lastMessage và lastMessageTime từ WebSocket
  const [conversationSummaries, setConversationSummaries] = useState<Map<string, { lastMessage: string; lastMessageTime: string }>>(new Map());
  
  // Ref để track subscribed status
  const summarySubscribedRef = useRef(false);

  // Debug: Log senderId and accountId
  useEffect(() => {
    console.log('🔍 [ChatContainer] senderId (for conversations):', senderId);
    console.log('🔍 [ChatContainer] accountId (for messages):', accountId);
    console.log('🔍 [ChatContainer] initialConversationId:', initialConversationId);
  }, [senderId, accountId, initialConversationId]);

  // Handler cho conversation summary từ WebSocket
  const handleConversationSummary = useCallback((summary: ConversationSummaryDTO) => {
    console.log('[ChatContainer] Received conversation summary:', summary);
    console.log('[ChatContainer] Current accountId:', accountId);
    console.log('[ChatContainer] Summary senderId:', summary.senderId);
    console.log('[ChatContainer] Summary unreadCount from BE:', summary.unreadCount);
    
    // Nếu tin nhắn được gửi bởi chính mình (summary.senderId === accountId), bỏ qua unread count
    // Vì tin nhắn mình gửi không nên tính là unread cho mình
    const isMyMessage = summary.senderId === accountId;
    
    // Cập nhật unread count
    setUnreadCounts(prev => {
      const newMap = new Map(prev);
      const currentCount = prev.get(summary.conversationId) || 0;
      
      if (selectedConversation?.conversationId === summary.conversationId) {
        // Đang mở conversation này -> set về 0
        newMap.set(summary.conversationId, 0);
      } else if (isMyMessage) {
        // Tin nhắn của mình gửi đi -> không thay đổi unread count
        // Giữ nguyên giá trị hiện tại
      } else {
        // Tin nhắn từ người khác khi không đang mở conversation đó
        // Tăng lên 1 thay vì dùng giá trị từ BE (để tránh BE trả về sai)
        newMap.set(summary.conversationId, currentCount + 1);
      }
      
      console.log('[ChatContainer] Updated unread count for', summary.conversationId, ':', newMap.get(summary.conversationId));
      return newMap;
    });
    
    // Cập nhật lastMessage và lastMessageTime (luôn cập nhật để hiển thị tin nhắn mới)
    setConversationSummaries(prev => {
      const newMap = new Map(prev);
      newMap.set(summary.conversationId, {
        lastMessage: summary.lastMessage,
        lastMessageTime: summary.lastMessageTime
      });
      return newMap;
    });
  }, [selectedConversation?.conversationId, accountId]);

  // Subscribe to conversation summary khi WebSocket connected
  useEffect(() => {
    if (wsConnected && senderId && !summarySubscribedRef.current) {
      console.log('[ChatContainer] Subscribing to conversation summary for:', senderId);
      webSocketService.subscribeToConversationSummary(senderId, handleConversationSummary);
      summarySubscribedRef.current = true;
    }

    return () => {
      if (summarySubscribedRef.current && senderId) {
        console.log('[ChatContainer] Unsubscribing from conversation summary');
        webSocketService.unsubscribeFromConversationSummary(senderId);
        summarySubscribedRef.current = false;
      }
    };
  }, [wsConnected, senderId, handleConversationSummary]);

  // Load initial conversation if conversationId is provided
  useEffect(() => {
    const loadInitialConversation = async () => {
      if (initialConversationId && !selectedConversation) {
        setIsLoadingInitialConversation(true);
        try {
          console.log('[ChatContainer] Loading initial conversation:', initialConversationId);
          const response = await getConversationByIdApi(initialConversationId);
          if (response.success && response.data) {
            setSelectedConversation(response.data);
            console.log('[ChatContainer] ✅ Initial conversation loaded:', response.data);
          }
        } catch (error) {
          console.error('[ChatContainer] ❌ Error loading initial conversation:', error);
        } finally {
          setIsLoadingInitialConversation(false);
        }
      }
    };

    loadInitialConversation();
  }, [initialConversationId, selectedConversation]);

  const connectWebSocket = useCallback(async () => {
    try {
      setWsError(null);
      
      // Register handlers
      webSocketService.onConnected(() => {
        console.log('[Chat] WebSocket connected');
        setWsConnected(true);
        setWsError(null);
      });

      webSocketService.onDisconnected(() => {
        console.log('[Chat] WebSocket disconnected');
        setWsConnected(false);
      });

      webSocketService.onError((error) => {
        console.error('[Chat] WebSocket error:', error);
        setWsError('Mất kết nối real-time. Đang thử kết nối lại...');
      });

      // Connect
      await webSocketService.connect();
    } catch (error) {
      console.error('[Chat] Failed to connect WebSocket:', error);
      setWsError('Không thể kết nối chat real-time');
    }
  }, []); // Empty deps - handlers use setState which are stable

  useEffect(() => {
    connectWebSocket();

    return () => {
      webSocketService.disconnect();
    };
  }, [connectWebSocket]);

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Clear unread count cho conversation được chọn (sẽ được update lại khi mark-read xong)
    setUnreadCounts(prev => {
      const newMap = new Map(prev);
      newMap.set(conversation.conversationId, 0);
      return newMap;
    });
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  // Callback khi ChatWindow đã mark messages as read
  const handleMessagesRead = useCallback((conversationId: string) => {
    console.log('[ChatContainer] Messages marked as read for:', conversationId);
    setUnreadCounts(prev => {
      const newMap = new Map(prev);
      newMap.set(conversationId, 0);
      return newMap;
    });
  }, []);

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {wsError && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <p className="text-sm text-yellow-800">{wsError}</p>
        </div>
      )}

      <div className="flex h-full">
        {/* Conversations sidebar - hidden on mobile when chat is open */}
        <div className={`w-full lg:w-80 border-r border-gray-200 flex flex-col ${
          selectedConversation ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Tin nhắn
            </h2>
            {wsConnected && (
              <p className="text-xs text-blue-100 mt-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                Đang kết nối
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              senderId={senderId}
              selectedConversationId={selectedConversation?.conversationId}
              onConversationSelect={handleConversationSelect}
              unreadCounts={unreadCounts}
              conversationSummaries={conversationSummaries}
            />
          </div>
        </div>

        {/* Chat window - hidden on mobile when no conversation selected */}
        <div className={`flex-1 ${
          selectedConversation ? 'flex' : 'hidden lg:flex'
        } flex-col`}>
          {isLoadingInitialConversation ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải cuộc trò chuyện...</p>
              </div>
            </div>
          ) : selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              currentAccountId={accountId}
              currentSenderId={senderId}
              onBack={handleBack}
              onMessagesRead={handleMessagesRead}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageCircle className="mx-auto h-20 w-20 text-gray-300 mb-4" />
                <p className="text-lg font-medium">Chọn một cuộc trò chuyện</p>
                <p className="text-sm mt-2">Chọn cuộc trò chuyện từ danh sách bên trái</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
