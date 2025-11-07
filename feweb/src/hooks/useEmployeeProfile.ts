import { useState, useEffect } from 'react';
import { 
  getEmployeeProfileApi, 
  updateEmployeeProfileApi,
  type EmployeeProfile,
  type UpdateEmployeeProfileRequest
} from '../api/employee';

export const useEmployeeProfile = (employeeId: string | undefined) => {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch employee profile
  const fetchProfile = async () => {
    if (!employeeId) {
      setError('Employee ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getEmployeeProfileApi(employeeId);
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError(response.message || 'Không thể tải thông tin nhân viên');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải thông tin nhân viên');
      console.error('Error fetching employee profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Update employee profile
  const updateProfile = async (profileData: UpdateEmployeeProfileRequest): Promise<boolean> => {
    if (!employeeId) {
      setError('Employee ID is required');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await updateEmployeeProfileApi(employeeId, profileData);
      
      // Refetch profile to get latest data
      await fetchProfile();
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật thông tin nhân viên');
      console.error('Error updating employee profile:', err);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Load profile on mount and when employeeId changes
  useEffect(() => {
    if (employeeId) {
      fetchProfile();
    }
  }, [employeeId]);

  return {
    profile,
    isLoading,
    isUpdating,
    error,
    fetchProfile,
    updateProfile,
    clearError: () => setError(null)
  };
};

export default useEmployeeProfile;