import { useState } from 'react';
import { 
  getEmployeeAssignmentsApi,
  getEmployeeStatisticsApi 
} from '../api/employee';

// Assignment interface matching ACTUAL API response (07/11/2025)
// Backend returns: serviceAddress, estimatedDurationHours, totalAmount
interface Assignment {
  assignmentId: string;
  bookingCode: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;           // Backend uses "serviceAddress"
  bookingTime: string;              // Format: "2025-11-15 09:00:00"
  estimatedDurationHours: number;   // Backend uses "estimatedDurationHours"
  pricePerUnit: number;             // Giá mỗi đơn vị
  quantity: number;                 // Số lượng
  totalAmount: number;              // Backend uses "totalAmount"
  status: string;                   // PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
  assignedAt: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  note: string | null;
  customerEmail?: string;
  customerAvatar?: string;
}

interface EmployeeStats {
  completed: number;
  upcoming: number;
  totalEarnings: number;
}

export const useEmployeeAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<EmployeeStats>({ completed: 0, upcoming: 0, totalEarnings: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const getAssignments = async (
    employeeId: string, 
    status?: string, 
    page: number = 0, 
    size: number = 10
  ): Promise<Assignment[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use employee assignments API endpoint: GET /employee/{employeeId}/assignments
      const response = await getEmployeeAssignmentsApi(employeeId, status, page, size);
      
      console.log('[useEmployee] Assignments API Response:', response);
      
      if (response && response.success && response.data) {
        console.log('[useEmployee] Assignments data:', response.data);
        
        // Sort by bookingTime ascending (earliest first)
        const sortedAssignments = [...response.data].sort((a, b) => {
          const dateTimeA = new Date(a.bookingTime);
          const dateTimeB = new Date(b.bookingTime);
          return dateTimeA.getTime() - dateTimeB.getTime();
        });
        
        console.log('[useEmployee] Sorted assignments:', sortedAssignments);
        
        setAssignments(sortedAssignments);
        setIsInitialized(true);
        return sortedAssignments;
      } else {
        throw new Error('Failed to load assignments');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách công việc';
      setError(errorMessage);
      setAssignments([]);
      setIsInitialized(true);
      console.error('Get assignments error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getStatistics = async (employeeId: string): Promise<EmployeeStats | null> => {
    // Không set loading cho statistics để tránh nhấp nháy
    setError(null);

    try {
      const response = await getEmployeeStatisticsApi(employeeId);
      if (response && response.success) {
        setStats(response.data || { completed: 0, upcoming: 0, totalEarnings: 0 });
        return response.data;
      } else {
        throw new Error(response?.message || 'Failed to load statistics');
      }
    } catch (err: any) {
      console.error('Get statistics error:', err);
      
      // Keep default statistics
      const defaultStats = { completed: 0, upcoming: 0, totalEarnings: 0 };
      setStats(defaultStats);
      return defaultStats;
    }
  };

  return {
    assignments,
    stats,
    isLoading,
    isInitialized,
    error,
    getAssignments,
    getStatistics
  };
};

export default useEmployeeAssignments;