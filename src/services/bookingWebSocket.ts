/**
 * WebSocket Service for Realtime Booking Status & Assignment Progress
 * Sử dụng SockJS và STOMP để nhận realtime updates từ booking
 * Dựa theo booking-status-realtime.md (26-11-2025)
 */

import SockJS from 'sockjs-client';
import { Client, type IFrame, type IMessage } from '@stomp/stompjs';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080/ws';
const WS_ENDPOINT = '/notifications';

// Log WebSocket configuration
console.log('[BookingWS Config] WS_BASE_URL:', WS_BASE_URL);

// === Types ===

export type BookingStatus = 
  | 'PENDING' 
  | 'AWAITING_EMPLOYEE' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type StatusTrigger = 
  | 'CHECK_IN' 
  | 'CHECK_OUT' 
  | 'CHECK_OUT_ALL' 
  | 'EMPLOYEE_ACCEPT' 
  | 'ASSIGNMENT_CANCELLED' 
  | 'ADMIN_UPDATE' 
  | 'CUSTOMER_CANCEL';

export type AssignmentAction = 'CHECK_IN' | 'CHECK_OUT';

export type AssignmentStatus = 
  | 'PENDING' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

/**
 * Booking Status WebSocket Event
 * Topic: /topic/bookings/{bookingId}/status
 */
export interface BookingStatusWebSocketEvent {
  bookingId: string;
  bookingCode: string;
  status: BookingStatus;
  trigger: StatusTrigger;
  triggeredBy: string | null;
  note: string | null;
  at: string; // ISO-8601
}

/**
 * Assignment Progress WebSocket Event
 * Topic: /topic/bookings/{bookingId}/assignments
 */
export interface AssignmentProgressWebSocketEvent {
  bookingId: string;
  bookingCode: string;
  assignmentId: string;
  employeeId: string;
  employeeName: string;
  status: AssignmentStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  bookingStatusAfterUpdate: BookingStatus;
  at: string; // ISO-8601
  action: AssignmentAction;
}

// Handler types
type BookingStatusHandler = (event: BookingStatusWebSocketEvent) => void;
type AssignmentProgressHandler = (event: AssignmentProgressWebSocketEvent) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: unknown) => void;

// Subscription key
interface SubscriptionInfo {
  bookingId: string;
  type: 'status' | 'assignments';
  unsubscribe: () => void;
}

class BookingWebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  private bookingStatusHandlers: Map<string, BookingStatusHandler[]> = new Map();
  private assignmentProgressHandlers: Map<string, AssignmentProgressHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private disconnectionHandlers: ConnectionHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private isConnecting = false;
  private pendingSubscriptions: Array<{ bookingId: string; type: 'status' | 'assignments' }> = [];

  /**
   * Kết nối WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        console.log('[BookingWS] Already connected');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('[BookingWS] Connection already in progress');
        // Add to pending queue, will resolve when connected
        return;
      }

      this.isConnecting = true;
      console.log(`[BookingWS] Connecting to: ${WS_BASE_URL}${WS_ENDPOINT}`);

      try {
        const socket = new SockJS(`${WS_BASE_URL}${WS_ENDPOINT}`);

        this.client = new Client({
          webSocketFactory: () => socket as unknown as WebSocket,
          debug: (str: string) => {
            if (import.meta.env.DEV) {
              console.log('[BookingWS Debug]', str);
            }
          },
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 25000,
          heartbeatOutgoing: 25000,
        });

        this.client.onConnect = (frame: IFrame) => {
          console.log('[BookingWS] Connected successfully', frame);
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Process pending subscriptions
          this.processPendingSubscriptions();

          this.connectionHandlers.forEach(handler => handler());
          resolve();
        };

        this.client.onStompError = (frame: IFrame) => {
          console.error('[BookingWS] STOMP error', frame);
          this.isConnecting = false;
          this.errorHandlers.forEach(handler => handler(frame));
          reject(new Error('WebSocket STOMP error'));
        };

        this.client.onDisconnect = () => {
          console.log('[BookingWS] Disconnected');
          this.isConnecting = false;
          this.disconnectionHandlers.forEach(handler => handler());
          this.attemptReconnect();
        };

        this.client.onWebSocketError = (event) => {
          console.error('[BookingWS] WebSocket error', event);
          this.isConnecting = false;
          this.errorHandlers.forEach(handler => handler(event));
        };

        this.client.activate();
      } catch (error) {
        console.error('[BookingWS] Connection error:', error);
        this.isConnecting = false;
        this.errorHandlers.forEach(handler => handler(error));
        reject(error);
      }
    });
  }

  /**
   * Process pending subscriptions after connection
   */
  private processPendingSubscriptions(): void {
    const pending = [...this.pendingSubscriptions];
    this.pendingSubscriptions = [];

    pending.forEach(({ bookingId, type }) => {
      if (type === 'status') {
        this.subscribeToStatusInternal(bookingId);
      } else {
        this.subscribeToAssignmentsInternal(bookingId);
      }
    });
  }

  /**
   * Subscribe to booking status updates
   * Topic: /topic/bookings/{bookingId}/status
   */
  subscribeToStatus(bookingId: string, handler: BookingStatusHandler): () => void {
    // Add handler
    if (!this.bookingStatusHandlers.has(bookingId)) {
      this.bookingStatusHandlers.set(bookingId, []);
    }
    this.bookingStatusHandlers.get(bookingId)!.push(handler);

    // Subscribe if connected, otherwise add to pending
    if (this.client?.connected) {
      this.subscribeToStatusInternal(bookingId);
    } else {
      this.pendingSubscriptions.push({ bookingId, type: 'status' });
      // Auto connect if not connected
      this.connect().catch(console.error);
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.bookingStatusHandlers.get(bookingId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        // If no more handlers, unsubscribe from topic
        if (handlers.length === 0) {
          this.unsubscribeFromStatus(bookingId);
          this.bookingStatusHandlers.delete(bookingId);
        }
      }
    };
  }

  /**
   * Internal method to subscribe to status topic
   */
  private subscribeToStatusInternal(bookingId: string): void {
    const subscriptionKey = `status-${bookingId}`;
    
    // Already subscribed
    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    if (!this.client?.connected) {
      console.error('[BookingWS] Not connected. Cannot subscribe to status.');
      return;
    }

    const destination = `/topic/bookings/${bookingId}/status`;
    console.log(`[BookingWS] Subscribing to ${destination}`);

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const event: BookingStatusWebSocketEvent = JSON.parse(message.body);
        console.log('[BookingWS] Status event received:', event);

        const handlers = this.bookingStatusHandlers.get(bookingId);
        handlers?.forEach(handler => handler(event));
      } catch (error) {
        console.error('[BookingWS] Error parsing status event:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, {
      bookingId,
      type: 'status',
      unsubscribe: () => subscription.unsubscribe()
    });
  }

  /**
   * Unsubscribe from booking status updates
   */
  private unsubscribeFromStatus(bookingId: string): void {
    const subscriptionKey = `status-${bookingId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      console.log(`[BookingWS] Unsubscribing from status for booking ${bookingId}`);
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Subscribe to assignment progress updates
   * Topic: /topic/bookings/{bookingId}/assignments
   */
  subscribeToAssignments(bookingId: string, handler: AssignmentProgressHandler): () => void {
    // Add handler
    if (!this.assignmentProgressHandlers.has(bookingId)) {
      this.assignmentProgressHandlers.set(bookingId, []);
    }
    this.assignmentProgressHandlers.get(bookingId)!.push(handler);

    // Subscribe if connected, otherwise add to pending
    if (this.client?.connected) {
      this.subscribeToAssignmentsInternal(bookingId);
    } else {
      this.pendingSubscriptions.push({ bookingId, type: 'assignments' });
      this.connect().catch(console.error);
    }

    // Return unsubscribe function
    return () => {
      const handlers = this.assignmentProgressHandlers.get(bookingId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        if (handlers.length === 0) {
          this.unsubscribeFromAssignments(bookingId);
          this.assignmentProgressHandlers.delete(bookingId);
        }
      }
    };
  }

  /**
   * Internal method to subscribe to assignments topic
   */
  private subscribeToAssignmentsInternal(bookingId: string): void {
    const subscriptionKey = `assignments-${bookingId}`;
    
    if (this.subscriptions.has(subscriptionKey)) {
      return;
    }

    if (!this.client?.connected) {
      console.error('[BookingWS] Not connected. Cannot subscribe to assignments.');
      return;
    }

    const destination = `/topic/bookings/${bookingId}/assignments`;
    console.log(`[BookingWS] Subscribing to ${destination}`);

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const event: AssignmentProgressWebSocketEvent = JSON.parse(message.body);
        console.log('[BookingWS] Assignment progress event received:', event);

        const handlers = this.assignmentProgressHandlers.get(bookingId);
        handlers?.forEach(handler => handler(event));
      } catch (error) {
        console.error('[BookingWS] Error parsing assignment event:', error);
      }
    });

    this.subscriptions.set(subscriptionKey, {
      bookingId,
      type: 'assignments',
      unsubscribe: () => subscription.unsubscribe()
    });
  }

  /**
   * Unsubscribe from assignment progress updates
   */
  private unsubscribeFromAssignments(bookingId: string): void {
    const subscriptionKey = `assignments-${bookingId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      console.log(`[BookingWS] Unsubscribing from assignments for booking ${bookingId}`);
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Subscribe to both status and assignments for a booking
   */
  subscribeToBooking(
    bookingId: string,
    onStatusChange: BookingStatusHandler,
    onAssignmentProgress: AssignmentProgressHandler
  ): () => void {
    const unsubscribeStatus = this.subscribeToStatus(bookingId, onStatusChange);
    const unsubscribeAssignments = this.subscribeToAssignments(bookingId, onAssignmentProgress);

    return () => {
      unsubscribeStatus();
      unsubscribeAssignments();
    };
  }

  /**
   * Thử kết nối lại
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[BookingWS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[BookingWS] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('[BookingWS] Reconnect failed:', error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): void {
    if (this.client) {
      console.log('[BookingWS] Disconnecting...');
      
      // Unsubscribe all
      this.subscriptions.forEach((sub, key) => {
        console.log(`[BookingWS] Unsubscribing from ${key}`);
        sub.unsubscribe();
      });
      this.subscriptions.clear();
      this.bookingStatusHandlers.clear();
      this.assignmentProgressHandlers.clear();
      this.pendingSubscriptions = [];

      this.client.deactivate();
      this.client = null;
      this.isConnecting = false;
    }
  }

  /**
   * Đăng ký handler khi kết nối thành công
   */
  onConnected(handler: ConnectionHandler): () => void {
    this.connectionHandlers.push(handler);
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Đăng ký handler khi mất kết nối
   */
  onDisconnected(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.push(handler);
    return () => {
      const index = this.disconnectionHandlers.indexOf(handler);
      if (index > -1) {
        this.disconnectionHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Đăng ký handler khi có lỗi
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Export singleton instance
export const bookingWebSocketService = new BookingWebSocketService();
export default bookingWebSocketService;
