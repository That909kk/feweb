import { useState, useCallback } from 'react';
import { 
  getAvailableBookingsApi, 
  acceptBookingDetailApi,
  cancelAssignmentApi
} from '../api/employee';

interface AvailableBooking {
  bookingDetailId: string;  // Changed from detailId
  bookingCode: string;
  serviceName: string;
  serviceAddress: string;   // Changed from address
  bookingTime: string;      // Format: "2024-09-26 09:30:00"
  estimatedDurationHours: number;  // Changed from estimatedDuration
  requiredEmployees: number;       // Changed from quantity
}

interface CancelAssignmentRequest {
  reason: string;
  employeeId: string;
}

export const useAvailableBookings = () => {
  const [availableBookings, setAvailableBookings] = useState<AvailableBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const getAvailableBookings = useCallback(async (
    employeeId: string,
    page: number = 0,
    size: number = 10
  ): Promise<AvailableBooking[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAvailableBookingsApi(employeeId, page, size);
      if (response && response.success && response.data) {
        setAvailableBookings(response.data || []);
        setIsInitialized(true);
        return response.data || [];
      } else {
        throw new Error(response?.message || 'Không thể tải danh sách booking khả dụng');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách booking khả dụ';
      setError(errorMessage);
      setAvailableBookings([]);
      setIsInitialized(true);
      console.error('Get available bookings error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const acceptBookingDetail = useCallback(async (
    bookingDetailId: string,
    employeeId: string
  ): Promise<any | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await acceptBookingDetailApi(bookingDetailId, employeeId);
      if (response && response.success) {
        console.log('[Hook] Accept booking successful:', response.data);
        
        // Remove the accepted booking from available list
        setAvailableBookings(prev => 
          prev.filter(booking => booking.bookingDetailId !== bookingDetailId)
        );
        return response.data;
      } else {
        throw new Error(response?.message || 'Không thể nhận công việc');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể nhận công việc';
      setError(errorMessage);
      console.error('Accept booking detail error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelAssignment = async (
    assignmentId: string,
    cancelRequest: CancelAssignmentRequest
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await cancelAssignmentApi(assignmentId, cancelRequest);
      if (response && response.success) {
        return true;
      } else {
        throw new Error(response?.message || 'Không thể hủy công việc');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể hủy công việc';
      setError(errorMessage);
      console.error('Cancel assignment error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    availableBookings,
    isLoading,
    isInitialized,
    error,
    getAvailableBookings,
    acceptBookingDetail,
    cancelAssignment
  };
};

export default useAvailableBookings;