import { useState } from 'react';
import { 
  getEmployeeAssignmentsApi, 
  updateAssignmentStatusApi, 
  getEmployeeStatisticsApi 
} from '../api/employee';

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
      const response = await getEmployeeAssignmentsApi(employeeId, status, page, size);
      if (response && response.success && response.data) {
        setAssignments(response.data || []);
        setIsInitialized(true);
        return response.data || [];
      } else {
        throw new Error(response?.message || 'Failed to load assignments');
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

  const updateAssignmentStatus = async (
    assignmentId: string, 
    status: 'ACCEPTED' | 'STARTED' | 'COMPLETED' | 'REJECTED'
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await updateAssignmentStatusApi(assignmentId, status);
      if (response && response.success) {
        // Update local assignments
        setAssignments(prev => 
          prev.map(a => a.assignmentId === assignmentId ? { ...a, status } : a)
        );
        return true;
      } else {
        throw new Error(response?.message || 'Failed to update assignment status');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update assignment status';
      setError(errorMessage);
      console.error('Update assignment status error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    assignments,
    stats,
    isLoading,
    isInitialized,
    error,
    getAssignments,
    getStatistics,
    updateAssignmentStatus
  };
};

export default useEmployeeAssignments;