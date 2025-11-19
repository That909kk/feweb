import React, { useEffect, useState, useCallback } from 'react';
import type { Conversation } from '../../types/chat';
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

  // Debug: Log senderId and accountId
  useEffect(() => {
    console.log('🔍 [ChatContainer] senderId (for conversations):', senderId);
    console.log('🔍 [ChatContainer] accountId (for messages):', accountId);
    console.log('🔍 [ChatContainer] initialConversationId:', initialConversationId);
  }, [senderId, accountId, initialConversationId]);

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
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

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
