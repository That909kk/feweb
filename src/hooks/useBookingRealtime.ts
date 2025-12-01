/**
 * useBookingRealtime Hook
 * React hook để subscribe và nhận realtime booking status & assignment progress
 * Dựa theo booking-status-realtime.md (26-11-2025)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  bookingWebSocketService,
  type BookingStatusWebSocketEvent,
  type AssignmentProgressWebSocketEvent,
  type BookingStatus,
} from '../services/bookingWebSocket';

export interface UseBookingRealtimeOptions {
  /**
   * Booking ID để subscribe
   */
  bookingId: string | null | undefined;
  
  /**
   * Enable/disable subscription
   */
  enabled?: boolean;
  
  /**
   * Callback khi trạng thái booking thay đổi
   */
  onStatusChange?: (event: BookingStatusWebSocketEvent) => void;
  
  /**
   * Callback khi có tiến độ assignment mới (check-in/check-out)
   */
  onAssignmentProgress?: (event: AssignmentProgressWebSocketEvent) => void;
  
  /**
   * Callback khi booking hoàn thành (status = COMPLETED)
   */
  onBookingCompleted?: (event: BookingStatusWebSocketEvent) => void;
  
  /**
   * Callback khi booking bị hủy
   */
  onBookingCancelled?: (event: BookingStatusWebSocketEvent) => void;
  
  /**
   * Callback khi nhân viên check-in
   */
  onEmployeeCheckIn?: (event: AssignmentProgressWebSocketEvent) => void;
  
  /**
   * Callback khi nhân viên check-out
   */
  onEmployeeCheckOut?: (event: AssignmentProgressWebSocketEvent) => void;
}

export interface BookingRealtimeState {
  /**
   * Trạng thái kết nối WebSocket
   */
  connected: boolean;
  
  /**
   * Trạng thái hiện tại của booking (từ WS event cuối cùng)
   */
  currentStatus: BookingStatus | null;
  
  /**
   * Event status cuối cùng nhận được
   */
  lastStatusEvent: BookingStatusWebSocketEvent | null;
  
  /**
   * Danh sách các assignment progress events đã nhận
   */
  assignmentEvents: AssignmentProgressWebSocketEvent[];
  
  /**
   * Event assignment progress cuối cùng
   */
  lastAssignmentEvent: AssignmentProgressWebSocketEvent | null;
  
  /**
   * Lỗi nếu có
   */
  error: Error | null;
}

export const useBookingRealtime = ({
  bookingId,
  enabled = true,
  onStatusChange,
  onAssignmentProgress,
  onBookingCompleted,
  onBookingCancelled,
  onEmployeeCheckIn,
  onEmployeeCheckOut,
}: UseBookingRealtimeOptions) => {
  const [state, setState] = useState<BookingRealtimeState>({
    connected: false,
    currentStatus: null,
    lastStatusEvent: null,
    assignmentEvents: [],
    lastAssignmentEvent: null,
    error: null,
  });

  // Refs cho callbacks để tránh re-subscription khi callbacks thay đổi
  const callbacksRef = useRef({
    onStatusChange,
    onAssignmentProgress,
    onBookingCompleted,
    onBookingCancelled,
    onEmployeeCheckIn,
    onEmployeeCheckOut,
  });

  // Update refs khi callbacks thay đổi
  useEffect(() => {
    callbacksRef.current = {
      onStatusChange,
      onAssignmentProgress,
      onBookingCompleted,
      onBookingCancelled,
      onEmployeeCheckIn,
      onEmployeeCheckOut,
    };
  }, [onStatusChange, onAssignmentProgress, onBookingCompleted, onBookingCancelled, onEmployeeCheckIn, onEmployeeCheckOut]);

  // Handle status change
  const handleStatusChange = useCallback((event: BookingStatusWebSocketEvent) => {
    console.log('[useBookingRealtime] Status changed:', event);
    
    setState(prev => ({
      ...prev,
      currentStatus: event.status,
      lastStatusEvent: event,
    }));

    // Call general status change callback
    callbacksRef.current.onStatusChange?.(event);

    // Call specific callbacks based on status
    if (event.status === 'COMPLETED') {
      callbacksRef.current.onBookingCompleted?.(event);
    } else if (event.status === 'CANCELLED') {
      callbacksRef.current.onBookingCancelled?.(event);
    }
  }, []);

  // Handle assignment progress
  const handleAssignmentProgress = useCallback((event: AssignmentProgressWebSocketEvent) => {
    console.log('[useBookingRealtime] Assignment progress:', event);
    
    setState(prev => ({
      ...prev,
      assignmentEvents: [...prev.assignmentEvents, event],
      lastAssignmentEvent: event,
      // Update current status if provided
      currentStatus: event.bookingStatusAfterUpdate || prev.currentStatus,
    }));

    // Call general progress callback
    callbacksRef.current.onAssignmentProgress?.(event);

    // Call specific callbacks based on action
    if (event.action === 'CHECK_IN') {
      callbacksRef.current.onEmployeeCheckIn?.(event);
    } else if (event.action === 'CHECK_OUT') {
      callbacksRef.current.onEmployeeCheckOut?.(event);
    }
  }, []);

  // Connection handlers
  useEffect(() => {
    const handleConnected = () => {
      console.log('[useBookingRealtime] Connected');
      setState(prev => ({ ...prev, connected: true, error: null }));
    };

    const handleDisconnected = () => {
      console.log('[useBookingRealtime] Disconnected');
      setState(prev => ({ ...prev, connected: false }));
    };

    const handleError = (error: unknown) => {
      console.error('[useBookingRealtime] Error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error(String(error)) 
      }));
    };

    const unsubConnected = bookingWebSocketService.onConnected(handleConnected);
    const unsubDisconnected = bookingWebSocketService.onDisconnected(handleDisconnected);
    const unsubError = bookingWebSocketService.onError(handleError);

    // Check initial connection state
    if (bookingWebSocketService.isConnected()) {
      setState(prev => ({ ...prev, connected: true }));
    }

    return () => {
      unsubConnected();
      unsubDisconnected();
      unsubError();
    };
  }, []);

  // Subscribe to booking
  useEffect(() => {
    if (!enabled || !bookingId) {
      console.log('[useBookingRealtime] Subscription disabled or no bookingId');
      return;
    }

    console.log(`[useBookingRealtime] Subscribing to booking ${bookingId}`);

    // Reset state for new booking
    setState(prev => ({
      ...prev,
      currentStatus: null,
      lastStatusEvent: null,
      assignmentEvents: [],
      lastAssignmentEvent: null,
    }));

    // Subscribe to both status and assignments
    const unsubscribe = bookingWebSocketService.subscribeToBooking(
      bookingId,
      handleStatusChange,
      handleAssignmentProgress
    );

    return () => {
      console.log(`[useBookingRealtime] Unsubscribing from booking ${bookingId}`);
      unsubscribe();
    };
  }, [bookingId, enabled, handleStatusChange, handleAssignmentProgress]);

  // Clear assignment events
  const clearAssignmentEvents = useCallback(() => {
    setState(prev => ({
      ...prev,
      assignmentEvents: [],
      lastAssignmentEvent: null,
    }));
  }, []);

  // Manual reconnect
  const reconnect = useCallback(async () => {
    try {
      await bookingWebSocketService.connect();
      setState(prev => ({ ...prev, connected: true, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error(String(error)) 
      }));
    }
  }, []);

  return {
    ...state,
    clearAssignmentEvents,
    reconnect,
  };
};

export type { BookingStatusWebSocketEvent, AssignmentProgressWebSocketEvent };
export default useBookingRealtime;
