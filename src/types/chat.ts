/**
 * Chat Feature Types
 * Dựa theo CHAT_FEATURE_README.md
 */

export type MessageType = 'TEXT' | 'IMAGE';

export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  messageType: MessageType;
  content: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  conversationId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string | null;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string | null;
  bookingId: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  isActive: boolean;
  canChat: boolean; // false nếu booking COMPLETED/CANCELLED hoặc conversation inactive
  createdAt: string;
  updatedAt: string;
  unreadCount?: number; // Số tin nhắn chưa đọc (cập nhật từ API hoặc WebSocket)
}

export interface CreateConversationRequest {
  customerId: string;
  employeeId: string;
  bookingId?: string;
}

export interface SendTextMessageRequest {
  conversationId: string;
  senderId: string;
  content: string;
}

export interface SendImageMessageRequest {
  conversationId: string;
  senderId: string;
  imageFile: File;
  caption?: string;
}

export interface ConversationListResponse {
  success: boolean;
  data: Conversation[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface MessageListResponse {
  success: boolean;
  data: ChatMessage[];
  currentPage: number;
  totalItems: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    receiverId?: string;
    conversationId?: string;
    unreadCount: number;
  };
}

// Response cho tổng unread count của participant
export interface TotalUnreadCountResponse {
  success: boolean;
  data: {
    receiverId: string;
    unreadCount: number;
  };
}

export interface GetOrCreateConversationParams {
  customerId: string;
  employeeId: string;
  bookingId?: string;
}

// WebSocket message format
export interface WebSocketMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  messageType: MessageType;
  content: string | null;
  imageUrl: string | null;
  timestamp?: string; // WebSocket dùng timestamp thay vì createdAt
  createdAt?: string; // Có thể có hoặc không
  isRead?: boolean; // Optional vì WebSocket message mới chưa có isRead
}

// WebSocket conversation summary (realtime unread count + last message)
export interface ConversationSummaryDTO {
  conversationId: string;
  participantId: string;
  senderId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}
