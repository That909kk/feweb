/**
 * WebSocket Service for Real-time Notifications
 * Sử dụng SockJS và STOMP với role-based routing
 * Dựa theo API-WebSocket-Real-Time-Notifications.md
 */

import SockJS from 'sockjs-client';
import { Client, type IFrame, type IMessage } from '@stomp/stompjs';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080/ws';
const WS_ENDPOINT = '/notifications';

// Log WebSocket configuration
console.log('[NotificationWS Config] WS_BASE_URL from env:', import.meta.env.VITE_WS_BASE_URL);
console.log('[NotificationWS Config] Final WS_BASE_URL:', WS_BASE_URL);
console.log('[NotificationWS Config] Full WebSocket URL:', `${WS_BASE_URL}${WS_ENDPOINT}`);

export type UserRole = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';

export interface NotificationWebSocketDTO {
  notificationId: string;
  accountId: string;
  targetRole: UserRole;  // Role this notification is intended for
  type: string;  // BOOKING_CREATED, BOOKING_CONFIRMED, ASSIGNMENT_CREATED, etc.
  title: string;
  message: string;
  relatedId: string;  // bookingId, assignmentId, etc.
  relatedType: string;  // BOOKING, ASSIGNMENT, PAYMENT, etc.
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  actionUrl: string;  // Deep link to relevant page
  createdAt: string;  // ISO 8601 timestamp
}

type NotificationHandler = (notification: NotificationWebSocketDTO) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: any) => void;

class NotificationWebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, any> = new Map();
  private notificationHandlers: NotificationHandler[] = [];
  private connectionHandlers: ConnectionHandler[] = [];
  private disconnectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private isConnecting = false;
  private currentAccountId: string | null = null;
  private currentRole: UserRole | null = null;

  /**
   * Kết nối WebSocket với role-based routing
   */
  connect(accountId: string, role: UserRole): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        // Nếu đã connect với cùng account và role, không cần connect lại
        if (this.currentAccountId === accountId && this.currentRole === role) {
          console.log('[NotificationWS] Already connected with same account and role');
          resolve();
          return;
        }
        
        // Nếu khác account hoặc role, disconnect và connect lại
        console.log('[NotificationWS] Reconnecting with different account or role');
        this.disconnect();
      }

      if (this.isConnecting) {
        console.log('[NotificationWS] Connection already in progress');
        return;
      }

      this.isConnecting = true;
      this.currentAccountId = accountId;
      this.currentRole = role;
      
      console.log(`[NotificationWS] Connecting to: ${WS_BASE_URL}${WS_ENDPOINT}`);
      console.log(`[NotificationWS] Account: ${accountId}, Role: ${role}`);

      try {
        // Tạo SockJS socket
        const socket = new SockJS(`${WS_BASE_URL}${WS_ENDPOINT}`);

        // Tạo STOMP client
        this.client = new Client({
          webSocketFactory: () => socket as any,
          debug: (str: string) => {
            console.log('[NotificationWS Debug]', str);
          },
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
        });

        // Xử lý kết nối thành công
        this.client.onConnect = (frame: IFrame) => {
          console.log('[NotificationWS] Connected successfully', frame);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Subscribe to role-specific notifications
          this.subscribeToNotifications(accountId, role);
          
          // Gọi các connection handlers
          this.connectionHandlers.forEach(handler => handler());
          
          resolve();
        };

        // Xử lý lỗi
        this.client.onStompError = (frame: IFrame) => {
          console.error('[NotificationWS] STOMP error', frame);
          this.isConnecting = false;
          
          // Gọi các error handlers
          this.errorHandlers.forEach(handler => handler(frame));
          
          reject(new Error('WebSocket STOMP error'));
        };

        // Xử lý mất kết nối
        this.client.onDisconnect = () => {
          console.log('[NotificationWS] Disconnected');
          this.isConnecting = false;
          
          // Gọi các disconnection handlers
          this.disconnectionHandlers.forEach(handler => handler());
          
          // Thử kết nối lại
          this.attemptReconnect();
        };

        // Xử lý lỗi WebSocket
        this.client.onWebSocketError = (event) => {
          console.error('[NotificationWS] WebSocket error', event);
          this.isConnecting = false;
          this.errorHandlers.forEach(handler => handler(event));
        };

        // Kích hoạt kết nối
        this.client.activate();

      } catch (error) {
        console.error('[NotificationWS] Connection error:', error);
        this.isConnecting = false;
        this.errorHandlers.forEach(handler => handler(error));
        reject(error);
      }
    });
  }

  /**
   * Subscribe to role-specific notifications
   */
  private subscribeToNotifications(accountId: string, role: UserRole): void {
    if (!this.client?.connected) {
      console.error('[NotificationWS] Not connected. Cannot subscribe.');
      return;
    }

    // Role-based destination theo document
    const destination = `/user/${accountId}/${role}/queue/notifications`;
    console.log(`[NotificationWS] Subscribing to ${destination}`);

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const notification: NotificationWebSocketDTO = JSON.parse(message.body);
        console.log('[NotificationWS] Notification received:', notification);

        // Gọi tất cả notification handlers
        this.notificationHandlers.forEach(handler => handler(notification));
      } catch (error) {
        console.error('[NotificationWS] Error parsing notification:', error);
      }
    });

    const subscriptionKey = `${accountId}-${role}`;
    this.subscriptions.set(subscriptionKey, subscription);
  }

  /**
   * Thử kết nối lại
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[NotificationWS] Max reconnect attempts reached');
      return;
    }

    if (!this.currentAccountId || !this.currentRole) {
      console.log('[NotificationWS] No account/role info for reconnect');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[NotificationWS] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(this.currentAccountId!, this.currentRole!).catch(error => {
        console.error('[NotificationWS] Reconnect failed:', error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    if (this.client) {
      console.log('[NotificationWS] Disconnecting...');
      
      // Hủy tất cả subscriptions
      this.subscriptions.forEach((subscription, key) => {
        console.log(`[NotificationWS] Unsubscribing from ${key}`);
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      this.notificationHandlers = [];

      // Deactivate client
      this.client.deactivate();
      this.client = null;
      this.isConnecting = false;
      this.currentAccountId = null;
      this.currentRole = null;
    }
  }

  /**
   * Đăng ký handler cho notifications
   */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.notificationHandlers.indexOf(handler);
      if (index > -1) {
        this.notificationHandlers.splice(index, 1);
      }
    };
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

  /**
   * Get current account and role
   */
  getCurrentInfo(): { accountId: string | null; role: UserRole | null } {
    return {
      accountId: this.currentAccountId,
      role: this.currentRole
    };
  }
}

// Export singleton instance
export const notificationWebSocketService = new NotificationWebSocketService();
export default notificationWebSocketService;
