import { api } from './client';
import type { ApiResponse } from './client';
import type {
  Conversation,
  ChatMessage,
  CreateConversationRequest,
  SendTextMessageRequest,
  SendImageMessageRequest,
  ConversationListResponse,
  MessageListResponse,
  UnreadCountResponse,
  GetOrCreateConversationParams,
} from '../types/chat';

/**
 * Chat API Service
 * Base URL: /api/v1
 * Dựa theo CHAT_FEATURE_README.md
 */

// ============ CONVERSATIONS API ============

/**
 * Create new conversation
 * POST /api/v1/conversations
 */
export const createConversationApi = async (
  data: CreateConversationRequest
): Promise<ApiResponse<Conversation>> => {
  try {
    console.log('[Chat API] Creating conversation:', data);
    const response = await api.post<ApiResponse<Conversation>>('/conversations', data);
    console.log('[Chat API] Conversation created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error creating conversation:', error);
    throw error;
  }
};

/**
 * Get conversation details by ID
 * GET /api/v1/conversations/{conversationId}
 */
export const getConversationByIdApi = async (
  conversationId: string
): Promise<ApiResponse<Conversation>> => {
  try {
    console.log(`[Chat API] Fetching conversation ${conversationId}`);
    const response = await api.get<ApiResponse<Conversation>>(`/conversations/${conversationId}`);
    console.log('[Chat API] Conversation fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error fetching conversation:', error);
    throw error;
  }
};

/**
 * Get user's conversations with pagination
 * GET /api/v1/conversations/sender/{senderId}
 */
export const getConversationsBySenderApi = async (
  senderId: string,
  params?: {
    page?: number;
    size?: number;
  }
): Promise<ConversationListResponse> => {
  try {
    console.log(`[Chat API] Fetching conversations for sender ${senderId}`, params);
    const response = await api.get<ConversationListResponse>(
      `/conversations/sender/${senderId}`,
      { params }
    );
    console.log('[Chat API] Conversations fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Find existing or create new conversation
 * GET /api/v1/conversations/get-or-create
 */
export const getOrCreateConversationApi = async (
  params: GetOrCreateConversationParams
): Promise<ApiResponse<Conversation>> => {
  try {
    console.log('[Chat API] Get or create conversation:', params);
    const response = await api.get<ApiResponse<Conversation>>('/conversations/get-or-create', {
      params,
    });
    console.log('[Chat API] Conversation fetched/created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error get/create conversation:', error);
    throw error;
  }
};

/**
 * Get conversation by booking ID
 * GET /api/v1/conversations/booking/{bookingId}
 */
export const getConversationByBookingApi = async (
  bookingId: string
): Promise<ApiResponse<Conversation>> => {
  try {
    console.log(`[Chat API] Fetching conversation for booking ${bookingId}`);
    const response = await api.get<ApiResponse<Conversation>>(
      `/conversations/booking/${bookingId}`
    );
    console.log('[Chat API] Conversation fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error fetching conversation by booking:', error);
    throw error;
  }
};

/**
 * Delete conversation (soft delete)
 * DELETE /api/v1/conversations/{conversationId}
 */
export const deleteConversationApi = async (
  conversationId: string
): Promise<ApiResponse<void>> => {
  try {
    console.log(`[Chat API] Deleting conversation ${conversationId}`);
    const response = await api.delete<ApiResponse<void>>(`/conversations/${conversationId}`);
    console.log('[Chat API] Conversation deleted');
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error deleting conversation:', error);
    throw error;
  }
};

// ============ MESSAGES API ============

/**
 * Send text message
 * POST /api/v1/messages/send/text
 */
export const sendTextMessageApi = async (
  data: SendTextMessageRequest
): Promise<ApiResponse<ChatMessage>> => {
  try {
    console.log('[Chat API] Sending text message:', data);
    
    // Use URLSearchParams for application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('conversationId', data.conversationId);
    params.append('senderId', data.senderId);
    params.append('content', data.content);

    const response = await api.post<ApiResponse<ChatMessage>>(
      '/messages/send/text',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    console.log('[Chat API] Text message sent:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error sending text message:', error);
    throw error;
  }
};

/**
 * Send image message
 * POST /api/v1/messages/send/image
 */
export const sendImageMessageApi = async (
  data: SendImageMessageRequest
): Promise<ApiResponse<ChatMessage>> => {
  try {
    console.log('[Chat API] Sending image message');
    const formData = new FormData();
    formData.append('conversationId', data.conversationId);
    formData.append('senderId', data.senderId);
    formData.append('imageFile', data.imageFile);
    if (data.caption) {
      formData.append('caption', data.caption);
    }

    const response = await api.post<ApiResponse<ChatMessage>>(
      '/messages/send/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log('[Chat API] Image message sent:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error sending image message:', error);
    throw error;
  }
};

/**
 * Get messages with pagination
 * GET /api/v1/messages/conversation/{conversationId}
 */
export const getMessagesApi = async (
  conversationId: string,
  params?: {
    page?: number;
    size?: number;
  }
): Promise<MessageListResponse> => {
  try {
    console.log(`[Chat API] Fetching messages for conversation ${conversationId}`, params);
    const response = await api.get<MessageListResponse>(
      `/messages/conversation/${conversationId}`,
      { params }
    );
    console.log('[Chat API] Messages fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error fetching messages:', error);
    throw error;
  }
};

/**
 * Get all messages (no pagination)
 * GET /api/v1/messages/conversation/{conversationId}/all
 */
export const getAllMessagesApi = async (
  conversationId: string
): Promise<ApiResponse<ChatMessage[]>> => {
  try {
    console.log(`[Chat API] Fetching all messages for conversation ${conversationId}`);
    const response = await api.get<ApiResponse<ChatMessage[]>>(
      `/messages/conversation/${conversationId}/all`
    );
    console.log('[Chat API] All messages fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error fetching all messages:', error);
    throw error;
  }
};

/**
 * Get unread message count
 * GET /api/v1/messages/conversation/{conversationId}/unread-count
 */
export const getUnreadMessageCountApi = async (
  conversationId: string
): Promise<UnreadCountResponse> => {
  try {
    console.log(`[Chat API] Fetching unread count for conversation ${conversationId}`);
    const response = await api.get<UnreadCountResponse>(
      `/messages/conversation/${conversationId}/unread-count`
    );
    console.log('[Chat API] Unread count fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error fetching unread count:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 * PUT /api/v1/messages/conversation/{conversationId}/mark-read?receiverId={receiverId}
 */
export const markMessagesAsReadApi = async (
  conversationId: string,
  receiverId: string
): Promise<ApiResponse<void>> => {
  try {
    console.log(`[Chat API] Marking messages as read for conversation ${conversationId}, receiverId: ${receiverId}`);
    const response = await api.put<ApiResponse<void>>(
      `/messages/conversation/${conversationId}/mark-read`,
      null,
      {
        params: { receiverId }
      }
    );
    console.log('[Chat API] Messages marked as read');
    return response.data;
  } catch (error: any) {
    console.error('[Chat API] Error marking messages as read:', error);
    throw error;
  }
};
