import React, { useState, useEffect, useCallback } from 'react';
import { useEmployeeProfile } from '../../../hooks';
import { useAuth } from '../../../contexts/AuthContext';
import Navigation from '../../../components/Navigation';
import employeeProfileData from '../../../static-data/pages/employee-profile.json';

interface EmployeeFormData {
  employeeId: string;
  avatar: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  birthdate: string;
  hiredDate: string;
  skills: string[];
  bio: string;
  rating: string;
  employeeStatus: string;
  username: string;
  accountStatus: string;
  isPhoneVerified: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  roles: Array<{
    roleId: number;
    roleName: string;
  }>;
}

interface EmployeeProfileProps {
  employeeId?: string;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = React.memo(({ employeeId }) => {
  const { user } = useAuth();
  const { profile, isLoading, isUpdating, error, updateProfile, fetchProfile, clearError } = useEmployeeProfile(
    employeeId || (user?.role === 'EMPLOYEE' ? user.id : undefined)
  );
  
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeId: '',
    avatar: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    isMale: true,
    birthdate: '',
    hiredDate: '',
    skills: [],
    bio: '',
    rating: '',
    employeeStatus: '',
    username: '',
    accountStatus: '',
    isPhoneVerified: false,
    lastLogin: '',
    createdAt: '',
    updatedAt: '',
    roles: []
  });

  const [skillsInput, setSkillsInput] = useState<string>('');

  // Get text data based on language (defaulting to Vietnamese)
  const textData = employeeProfileData?.vi || {};

  // Load employee data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        employeeId: profile.employeeId,
        avatar: profile.avatar || '',
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.account.phoneNumber || '',
        isMale: profile.isMale ?? true,
        birthdate: profile.birthdate || '',
        hiredDate: profile.hiredDate || '',
        skills: profile.skills || [],
        bio: profile.bio || '',
        rating: profile.rating || '',
        employeeStatus: profile.employeeStatus || '',
        username: profile.account.username || '',
        accountStatus: profile.account.status || '',
        isPhoneVerified: profile.account.isPhoneVerified ?? false,
        lastLogin: profile.account.lastLogin || '',
        createdAt: profile.createdAt || '',
        updatedAt: profile.updatedAt || '',
        roles: profile.account.roles || []
      });
      
      // Convert skills array to comma-separated string for input
      setSkillsInput(profile.skills ? profile.skills.join(', ') : '');
    }
  }, [profile]);

  // Clear success message after delay
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof EmployeeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle skills input change
  const handleSkillsChange = useCallback((value: string) => {
    setSkillsInput(value);
    // Convert comma-separated string to array
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
    handleInputChange('skills', skillsArray);
  }, [handleInputChange]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      clearError();
      
      // Validate required fields
      if (!formData.fullName.trim()) {
        throw new Error(textData.validations?.fullNameRequired || 'Họ tên không được để trống');
      }
      
      if (!formData.email.trim()) {
        throw new Error(textData.validations?.emailRequired || 'Email không được để trống');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error(textData.validations?.emailInvalid || 'Email không hợp lệ');
      }

      // Prepare update data
      const updateData = {
        avatar: formData.avatar,
        fullName: formData.fullName.trim(),
        isMale: formData.isMale,
        email: formData.email.trim(),
        birthdate: formData.birthdate,
        hiredDate: formData.hiredDate,
        skills: formData.skills,
        bio: formData.bio.trim(),
        rating: formData.rating === '' ? null : formData.rating, // Explicitly handle empty string
        employeeStatus: formData.employeeStatus || 'AVAILABLE'
      };

      // Only log in development
      if (import.meta.env.DEV) {
        console.log('[DEBUG] Update data being sent:', updateData);
        console.log('[DEBUG] formData.rating:', formData.rating, 'Type:', typeof formData.rating);
        console.log('[DEBUG] Final rating value:', updateData.rating, 'Type:', typeof updateData.rating);
      }

      const success = await updateProfile(updateData);
      
      if (success) {
        setIsEditing(false);
        setShowSuccess(true);
        // Refresh profile data
        await fetchProfile();
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa cập nhật';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Chưa có thông tin';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-red-100 text-red-800',
      'SUSPENDED': 'bg-yellow-100 text-yellow-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  // Early return if loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Đang tải thông tin nhân viên...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Early return if textData is not loaded
  if (!textData || !textData.fields) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Đang khởi tạo...</div>
        </div>
      </div>
    );
  }

  // Load employee data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        employeeId: profile.employeeId,
        avatar: profile.avatar || '',
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.account.phoneNumber || '',
        isMale: profile.isMale ?? true,
        birthdate: profile.birthdate || '',
        hiredDate: profile.hiredDate || '',
        skills: profile.skills || [],
        bio: profile.bio || '',
        rating: profile.rating || '',
        employeeStatus: profile.employeeStatus || '',
        username: profile.account.username || '',
        accountStatus: profile.account.status || '',
        isPhoneVerified: profile.account.isPhoneVerified ?? false,
        lastLogin: profile.account.lastLogin || '',
        createdAt: profile.createdAt || '',
        updatedAt: profile.updatedAt || '',
        roles: profile.account.roles || []
      });
      
      // Convert skills array to comma-separated string for input
      setSkillsInput(profile.skills ? profile.skills.join(', ') : '');
    }
  }, [profile]);

  // Clear success message after delay
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof EmployeeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle skills input change
  const handleSkillsChange = useCallback((value: string) => {
    setSkillsInput(value);
    // Convert comma-separated string to array
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
    handleInputChange('skills', skillsArray);
  }, [handleInputChange]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      clearError();
      
      // Validate required fields
      if (!formData.fullName.trim()) {
        throw new Error(textData.validations?.fullNameRequired || 'Họ tên không được để trống');
      }
      
      if (!formData.email.trim()) {
        throw new Error(textData.validations?.emailRequired || 'Email không được để trống');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error(textData.validations?.emailInvalid || 'Email không hợp lệ');
      }

      // Prepare update data
      const updateData = {
        avatar: formData.avatar,
        fullName: formData.fullName.trim(),
        isMale: formData.isMale,
        email: formData.email.trim(),
        birthdate: formData.birthdate,
        hiredDate: formData.hiredDate,
        skills: formData.skills,
        bio: formData.bio.trim(),
        rating: formData.rating === '' ? null : formData.rating, // Explicitly handle empty string
        employeeStatus: formData.employeeStatus || 'AVAILABLE'
      };

      // Only log in development
      if (import.meta.env.DEV) {
        console.log('[DEBUG] Update data being sent:', updateData);
        console.log('[DEBUG] formData.rating:', formData.rating, 'Type:', typeof formData.rating);
        console.log('[DEBUG] Final rating value:', updateData.rating, 'Type:', typeof updateData.rating);
      }

      const success = await updateProfile(updateData);
      
      if (success) {
        setIsEditing(false);
        setShowSuccess(true);
        // Refresh profile data
        await fetchProfile();
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    if (profile) {
      // Reset form data to original profile data
      setFormData({
        employeeId: profile.employeeId,
        avatar: profile.avatar || '',
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.account.phoneNumber || '',
        isMale: profile.isMale ?? true,
        birthdate: profile.birthdate || '',
        hiredDate: profile.hiredDate || '',
        skills: profile.skills || [],
        bio: profile.bio || '',
        rating: profile.rating || '',
        employeeStatus: profile.employeeStatus || '',
        username: profile.account.username || '',
        accountStatus: profile.account.status || '',
        isPhoneVerified: profile.account.isPhoneVerified ?? false,
        lastLogin: profile.account.lastLogin || '',
        createdAt: profile.createdAt || '',
        updatedAt: profile.updatedAt || '',
        roles: profile.account.roles || []
      });
      
      setSkillsInput(profile.skills ? profile.skills.join(', ') : '');
    }
    setIsEditing(false);
    clearError();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  // Format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{textData.messages?.loading || 'Đang tải thông tin...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">{textData.messages?.loadError || 'Không thể tải thông tin nhân viên'}</p>
            <button
              onClick={fetchProfile}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {textData.actions?.refresh || 'Thử lại'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{textData.title || 'Hồ sơ nhân viên'}</h1>
         
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {textData.messages?.saveSuccess || 'Cập nhật thông tin thành công!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button onClick={clearError} className="mt-2 text-sm text-red-600 hover:text-red-800 underline">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header with Title and Action Button */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={formData.avatar || 'https://via.placeholder.com/80'}
                    alt={formData.fullName}
                    className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{formData.fullName}</h3>
                  <p className="text-sm text-gray-600">Quản lý thông tin hồ sơ nhân viên</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      formData.employeeStatus === 'AVAILABLE' 
                        ? 'bg-green-100 text-green-800'
                        : formData.employeeStatus === 'BUSY'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {textData.statusOptions?.[formData.employeeStatus as keyof typeof textData.statusOptions] || formData.employeeStatus}
                    </span>
                    {formData.rating && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {textData.ratingOptions?.[formData.rating as keyof typeof textData.ratingOptions] || formData.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {textData.actions?.edit || 'Chỉnh sửa'}
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSubmit}
                      disabled={isUpdating}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isUpdating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {textData.messages?.saving || 'Đang lưu...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {textData.actions?.save || 'Lưu thay đổi'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {textData.actions?.cancel || 'Hủy'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information - Editable Fields */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {textData.sections?.basicInfo || 'Thông tin cơ bản'}
                </h4>
                
                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {textData.fields?.fullName || 'Họ và tên'} *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={textData.placeholders?.fullName || 'Nhập họ và tên'}
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{formData.fullName || 'Chưa cập nhật'}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {textData.fields?.gender || 'Giới tính'}
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.isMale ? 'male' : 'female'}
                        onChange={(e) => handleInputChange('isMale', e.target.value === 'male')}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="male">{textData.genderOptions?.male || 'Nam'}</option>
                        <option value="female">{textData.genderOptions?.female || 'Nữ'}</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                        {formData.isMale ? (textData.genderOptions?.male || 'Nam') : (textData.genderOptions?.female || 'Nữ')}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {textData.fields?.email || 'Email'} *
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={textData.placeholders?.email || 'Nhập địa chỉ email'}
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{formData.email || 'Chưa cập nhật'}</p>
                    )}
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {textData.fields?.birthdate || 'Ngày sinh'}
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formatDateForInput(formData.birthdate)}
                        onChange={(e) => handleInputChange('birthdate', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{formatDate(formData.birthdate)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Information */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v6.96" />
                  </svg>
                  {textData.sections?.workInfo || 'Thông tin công việc'}
                </h4>
                
                <div className="space-y-6">
                  {/* Hire Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {textData.fields?.hiredDate || 'Ngày vào làm'}
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formatDateForInput(formData.hiredDate)}
                        onChange={(e) => handleInputChange('hiredDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{formatDate(formData.hiredDate)}</p>
                    )}
                  </div>

                  {/* Employee Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {textData.fields?.employeeStatus || 'Trạng thái làm việc'}
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.employeeStatus}
                        onChange={(e) => handleInputChange('employeeStatus', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AVAILABLE">
                          {textData.statusOptions?.AVAILABLE || 'Sẵn sàng'}
                        </option>
                        <option value="BUSY">
                          {textData.statusOptions?.BUSY || 'Đang bận'}
                        </option>
                        <option value="UNAVAILABLE">
                          {textData.statusOptions?.UNAVAILABLE || 'Không có sẵn'}
                        </option>
                        <option value="ON_LEAVE">
                          {textData.statusOptions?.ON_LEAVE || 'Nghỉ phép'}
                        </option>
                      </select>
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                        {textData.statusOptions?.[formData.employeeStatus as keyof typeof textData.statusOptions] || formData.employeeStatus}
                      </p>
                    )}
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {textData.fields?.rating || 'Đánh giá'}
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.rating || ''}
                        onChange={(e) => handleInputChange('rating', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Chưa đánh giá</option>
                        <option value="HIGHEST">
                          {textData.ratingOptions?.HIGHEST || 'Xuất sắc'}
                        </option>
                        <option value="HIGH">
                          {textData.ratingOptions?.HIGH || 'Tốt'}
                        </option>
                        <option value="MEDIUM">
                          {textData.ratingOptions?.MEDIUM || 'Trung bình'}
                        </option>
                        <option value="LOW">
                          {textData.ratingOptions?.LOW || 'Kém'}
                        </option>
                        <option value="LOWEST">
                          {textData.ratingOptions?.LOWEST || 'Rất kém'}
                        </option>
                      </select>
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                        {formData.rating ? 
                          (textData.ratingOptions?.[formData.rating as keyof typeof textData.ratingOptions] || formData.rating) 
                          : 'Chưa đánh giá'
                        }
                      </p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {textData.fields?.skills || 'Kỹ năng'}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={skillsInput}
                        onChange={(e) => handleSkillsChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={textData.placeholders?.skills || 'Nhập kỹ năng (phân cách bằng dấu phẩy)'}
                      />
                    ) : (
                      <div className="py-2 px-3 bg-gray-50 rounded-md">
                        {formData.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">Chưa có kỹ năng</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {textData.fields?.bio || 'Giới thiệu bản thân'}
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={textData.placeholders?.bio || 'Giới thiệu về kinh nghiệm và kỹ năng của bạn...'}
                      />
                    ) : (
                      <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md">{formData.bio || 'Chưa có giới thiệu'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information - Read Only */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Thông tin tài khoản
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {textData.fields?.phoneNumber || 'Số điện thoại'}
                  </label>
                  <p className="text-gray-900 font-medium">{formData.phoneNumber || 'Chưa cập nhật'}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {textData.fields?.accountStatus || 'Trạng thái tài khoản'}
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    formData.accountStatus === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formData.accountStatus}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {textData.fields?.phoneVerified || 'Xác thực số điện thoại'}
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    formData.isPhoneVerified 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {formData.isPhoneVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {textData.fields?.lastLogin || 'Lần đăng nhập cuối'}
                  </label>
                  <p className="text-gray-900 font-medium text-sm">{formatDate(formData.lastLogin)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {textData.fields?.createdAt || 'Ngày tạo tài khoản'}
                  </label>
                  <p className="text-gray-900 font-medium text-sm">{formatDate(formData.createdAt)}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {textData.fields?.updatedAt || 'Cập nhật lần cuối'}
                  </label>
                  <p className="text-gray-900 font-medium text-sm">{formatDate(formData.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default EmployeeProfile;