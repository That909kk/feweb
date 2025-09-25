import { useState } from 'react';
import { 
  getAvailableBookingsApi, 
  acceptBookingDetailApi,
  cancelAssignmentApi
} from '../api/employee';

interface AvailableBooking {
  detailId: string;
  bookingCode: string;
  serviceName: string;
  address: string;
  bookingTime: string;
  estimatedDuration: number;
  quantity: number;
}

interface Assignment {
  assignmentId: string;
  bookingCode: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;
  bookingTime: string;
  estimatedDurationHours: number;
  pricePerUnit: number;
  quantity: number;
  totalAmount: number;
  status: string;
  assignedAt: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  note: string | null;
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

  const getAvailableBookings = async (
    employeeId: string,
    page: number = 0,
    size: number = 10
  ): Promise<AvailableBooking[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAvailableBookingsApi(employeeId, page, size);
      if (response && response.success && response.data) {
        setAvailableBookings(response.data.data || []);
        setIsInitialized(true);
        return response.data.data || [];
      } else {
        throw new Error(response?.message || 'Không thể tải danh sách booking khả dụng');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách booking khả dụng';
      setError(errorMessage);
      setAvailableBookings([]);
      setIsInitialized(true);
      console.error('Get available bookings error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const acceptBookingDetail = async (
    detailId: string,
    employeeId: string
  ): Promise<Assignment | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await acceptBookingDetailApi(detailId, employeeId);
      if (response && response.success) {
        // Remove the accepted booking from available list
        setAvailableBookings(prev => 
          prev.filter(booking => booking.detailId !== detailId)
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
  };

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