/**
 * WebSocket Service for Real-time Chat
 * Sử dụng SockJS và STOMP
 * Dựa theo CHAT_FEATURE_README.md và websocket_realtime_test.html
 */

import SockJS from 'sockjs-client';
import { Client, type IFrame, type IMessage } from '@stomp/stompjs';
import type { WebSocketMessage } from '../types/chat';

const WS_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8080';
const WS_ENDPOINT = '/ws/chat';

type MessageHandler = (message: WebSocketMessage) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: any) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, any> = new Map();
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private disconnectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isConnecting = false;

  /**
   * Kết nối WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        console.log('[WebSocket] Already connected');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('[WebSocket] Connection already in progress');
        return;
      }

      this.isConnecting = true;
      console.log('[WebSocket] Connecting to:', `${WS_URL}${WS_ENDPOINT}`);

      try {
        // Tạo SockJS socket
        const socket = new SockJS(`${WS_URL}${WS_ENDPOINT}`);

        // Tạo STOMP client
        this.client = new Client({
          webSocketFactory: () => socket as any,
          debug: (str: string) => {
            console.log('[WebSocket Debug]', str);
          },
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
        });

        // Xử lý kết nối thành công
        this.client.onConnect = (frame: IFrame) => {
          console.log('[WebSocket] Connected successfully', frame);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Gọi các connection handlers
          this.connectionHandlers.forEach(handler => handler());
          
          resolve();
        };

        // Xử lý lỗi
        this.client.onStompError = (frame: IFrame) => {
          console.error('[WebSocket] STOMP error', frame);
          this.isConnecting = false;
          
          // Gọi các error handlers
          this.errorHandlers.forEach(handler => handler(frame));
          
          reject(new Error('WebSocket STOMP error'));
        };

        // Xử lý mất kết nối
        this.client.onDisconnect = () => {
          console.log('[WebSocket] Disconnected');
          this.isConnecting = false;
          
          // Gọi các disconnection handlers
          this.disconnectionHandlers.forEach(handler => handler());
          
          // Thử kết nối lại
          this.attemptReconnect();
        };

        // Xử lý lỗi WebSocket
        this.client.onWebSocketError = (event) => {
          console.error('[WebSocket] WebSocket error', event);
          this.isConnecting = false;
          this.errorHandlers.forEach(handler => handler(event));
        };

        // Kích hoạt kết nối
        this.client.activate();

      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        this.isConnecting = false;
        this.errorHandlers.forEach(handler => handler(error));
        reject(error);
      }
    });
  }

  /**
   * Thử kết nối lại
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('[WebSocket] Reconnect failed:', error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    if (this.client) {
      console.log('[WebSocket] Disconnecting...');
      
      // Hủy tất cả subscriptions
      this.subscriptions.forEach((subscription, conversationId) => {
        console.log(`[WebSocket] Unsubscribing from conversation ${conversationId}`);
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      this.messageHandlers.clear();

      // Deactivate client
      this.client.deactivate();
      this.client = null;
      this.isConnecting = false;
    }
  }

  /**
   * Subscribe to conversation messages
   * @param conversationId ID của conversation
   * @param handler Callback xử lý message
   */
  subscribeToConversation(conversationId: string, handler: MessageHandler): void {
    if (!this.client?.connected) {
      console.error('[WebSocket] Not connected. Call connect() first.');
      return;
    }

    // Lưu handler
    if (!this.messageHandlers.has(conversationId)) {
      this.messageHandlers.set(conversationId, []);
    }
    this.messageHandlers.get(conversationId)!.push(handler);

    // Nếu đã subscribe rồi thì không subscribe lại
    if (this.subscriptions.has(conversationId)) {
      console.log(`[WebSocket] Already subscribed to conversation ${conversationId}`);
      return;
    }

    const destination = `/topic/conversation/${conversationId}`;
    console.log(`[WebSocket] Subscribing to ${destination}`);

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.body);
        console.log('[WebSocket] Message received:', data);

        // Gọi tất cả handlers cho conversation này
        const handlers = this.messageHandlers.get(conversationId) || [];
        handlers.forEach(h => h(data));
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });

    this.subscriptions.set(conversationId, subscription);
  }

  /**
   * Unsubscribe from conversation
   */
  unsubscribeFromConversation(conversationId: string): void {
    const subscription = this.subscriptions.get(conversationId);
    if (subscription) {
      console.log(`[WebSocket] Unsubscribing from conversation ${conversationId}`);
      subscription.unsubscribe();
      this.subscriptions.delete(conversationId);
      this.messageHandlers.delete(conversationId);
    }
  }

  /**
   * Đăng ký handler khi kết nối thành công
   */
  onConnected(handler: ConnectionHandler): void {
    this.connectionHandlers.push(handler);
  }

  /**
   * Đăng ký handler khi mất kết nối
   */
  onDisconnected(handler: ConnectionHandler): void {
    this.disconnectionHandlers.push(handler);
  }

  /**
   * Đăng ký handler khi có lỗi
   */
  onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
