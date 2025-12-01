import { useState } from 'react';
import { getAvailableEmployeesApi, checkEmployeeAvailabilityApi } from '../api/schedule';
import type { 
  EmployeeScheduleParams, 
  EmployeeSchedule,
  PaginationParams 
} from '../types/api';

export const useEmployeeSchedule = () => {
  const [employees, setEmployees] = useState<EmployeeSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const searchAvailableEmployees = async (
    params: EmployeeScheduleParams & PaginationParams
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAvailableEmployeesApi(params);
      if (response.success) {
        const data = response.data;
        setEmployees(Array.isArray(data) ? data : (data?.content || []));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paginatedData = data as any;
        setTotalPages(paginatedData?.totalPages || 0);
        setCurrentPage(paginatedData?.number ?? paginatedData?.currentPage ?? 0);
      } else {
        throw new Error(response.message || 'Failed to search available employees');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to search available employees';
      setError(errorMessage);
      console.error('Employee schedule search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmployeeAvailability = async (
    employeeId: string,
    date: string,
    timeSlot: string
  ): Promise<boolean> => {
    try {
      const response = await checkEmployeeAvailabilityApi(employeeId, date, timeSlot);
      if (response.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = response.data as any;
        return data.available ?? data.isAvailable ?? false;
      } else {
        throw new Error(response.message || 'Failed to check employee availability');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to check employee availability';
      console.error('Employee availability check error:', errorMessage);
      return false;
    }
  };

  return {
    employees,
    isLoading,
    error,
    totalPages,
    currentPage,
    searchAvailableEmployees,
    checkEmployeeAvailability
  };
};