import { useState, useEffect } from 'react';
import { getEmployeeProfileApi, updateEmployeeProfileApi } from '../api/employee';

// Type definitions
interface EmployeeAccount {
  accountId: string;
  username: string;
  password: string;
  phoneNumber: string;
  status: string;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  roles: Array<{
    roleId: number;
    roleName: string;
  }>;
}

interface EmployeeProfile {
  employeeId: string;
  account: EmployeeAccount;
  avatar: string;
  fullName: string;
  isMale: boolean;
  email: string;
  birthdate: string;
  hiredDate: string;
  skills: string[];
  bio: string;
  rating: string | null;
  employeeStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateEmployeeProfileRequest {
  avatar: string;
  fullName: string;
  isMale: boolean;
  email: string;
  birthdate: string;
  hiredDate: string;
  skills: string[];
  bio: string;
  rating: string | null;
  employeeStatus: string;
}

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
      const updatedProfile = await updateEmployeeProfileApi(employeeId, profileData);
      
      // Update local state with new profile data
      if (profile) {
        setProfile({
          ...profile,
          ...updatedProfile,
          updatedAt: new Date().toISOString()
        });
      }
      
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