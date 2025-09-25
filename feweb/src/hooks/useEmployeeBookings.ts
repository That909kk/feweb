import { useState } from 'react';
import { 
  acceptBookingDetailApi, 
  getEmployeeBookingDetailsApi, 
  getAvailableBookingDetailsApi, 
  startBookingDetailApi, 
  completeBookingDetailApi 
} from '../api/employeeBooking';
import type { BookingDetail } from '../types/api';

export const useEmployeeBookings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetail[]>([]);
  const [availableBookings, setAvailableBookings] = useState<BookingDetail[]>([]);

  // Get booking details for the current employee
  const getEmployeeBookingDetails = async (employeeId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getEmployeeBookingDetailsApi(employeeId);
      if (response.success) {
        setBookingDetails(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to load booking details');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to load booking details';
      setError(errorMessage);
      console.error('Get employee booking details error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get available booking details that can be accepted
  const getAvailableBookingDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getAvailableBookingDetailsApi();
      if (response.success) {
        setAvailableBookings(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to load available bookings');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to load available bookings';
      setError(errorMessage);
      console.error('Get available booking details error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Accept a booking detail
  const acceptBookingDetail = async (bookingDetailId: string, employeeId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await acceptBookingDetailApi(bookingDetailId, employeeId);
      if (response.success) {
        // Update local state with the accepted booking
        const updatedAvailableBookings = availableBookings.filter(
          booking => booking.bookingDetailId !== bookingDetailId
        );
        setAvailableBookings(updatedAvailableBookings);
        
        // Add to employee bookings if not already there
        const isAlreadyInBookings = bookingDetails.some(
          booking => booking.bookingDetailId === bookingDetailId
        );
        
        if (!isAlreadyInBookings) {
          setBookingDetails([...bookingDetails, response.data]);
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to accept booking');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to accept booking';
      setError(errorMessage);
      console.error('Accept booking detail error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Start a booking detail (mark as in-progress)
  const startBookingDetail = async (bookingDetailId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await startBookingDetailApi(bookingDetailId);
      if (response.success) {
        // Update local state
        const updatedBookings = bookingDetails.map(booking => 
          booking.bookingDetailId === bookingDetailId ? response.data : booking
        );
        setBookingDetails(updatedBookings);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to start booking');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to start booking';
      setError(errorMessage);
      console.error('Start booking detail error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Complete a booking detail
  const completeBookingDetail = async (bookingDetailId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await completeBookingDetailApi(bookingDetailId);
      if (response.success) {
        // Update local state
        const updatedBookings = bookingDetails.map(booking => 
          booking.bookingDetailId === bookingDetailId ? response.data : booking
        );
        setBookingDetails(updatedBookings);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to complete booking');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to complete booking';
      setError(errorMessage);
      console.error('Complete booking detail error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a booking can be accepted (not full)
  const canAcceptBooking = (booking: BookingDetail) => {
    if (!booking) return false;
    return booking.assignedEmployees.length < booking.maxEmployees;
  };

  return {
    isLoading,
    error,
    bookingDetails,
    availableBookings,
    getEmployeeBookingDetails,
    getAvailableBookingDetails,
    acceptBookingDetail,
    startBookingDetail,
    completeBookingDetail,
    canAcceptBooking
  };
};