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

  // Utility functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Chưa có thông tin';
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch {
      return dateString;
    }
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

  // Error state
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Có lỗi xảy ra
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="bg-red-50 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100"
                  >
                    Tải lại trang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
                  {textData.messages?.updateSuccess || 'Cập nhật thông tin thành công!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && profile && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={clearError}
                    className="bg-red-50 text-red-500 p-1.5 rounded-md hover:bg-red-100"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {textData.title || 'Hồ Sơ Nhân Viên'}
                </h1>
                
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {textData.buttons?.cancel || 'Hủy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isUpdating}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                  >
                    {isUpdating && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {textData.buttons?.save || 'Lưu thay đổi'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {textData.buttons?.edit || 'Chỉnh sửa'}
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Avatar Section */}
            <div className="flex items-start space-x-6 pb-6 border-b border-gray-200">
              <div className="relative flex-shrink-0">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt={formData.fullName}
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-white font-medium text-4xl">
                      {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 border-2 border-white"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{formData.fullName || 'Chưa có tên'}</h2>
                  <p className="text-sm text-gray-500">{formData.email}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    {/* Work Status */}
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v6.96" />
                      </svg>
                      {formData.employeeStatus === 'AVAILABLE' && <span className="text-green-600 font-medium">Sẵn sàng</span>}
                      {formData.employeeStatus === 'BUSY' && <span className="text-orange-600 font-medium">Đang bận</span>}
                      {formData.employeeStatus === 'UNAVAILABLE' && <span className="text-red-600 font-medium">Không có sẵn</span>}
                      {formData.employeeStatus === 'ON_LEAVE' && <span className="text-purple-600 font-medium">Nghỉ phép</span>}
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      {formData.rating === 'HIGHEST' && <span className="text-emerald-600 font-medium">Xuất sắc</span>}
                      {formData.rating === 'HIGH' && <span className="text-blue-600 font-medium">Tốt</span>}
                      {formData.rating === 'MEDIUM' && <span className="text-yellow-600 font-medium">Trung bình</span>}
                      {formData.rating === 'LOW' && <span className="text-orange-600 font-medium">Kém</span>}
                      {formData.rating === 'LOWEST' && <span className="text-red-600 font-medium">Rất kém</span>}
                      {(!formData.rating || formData.rating === '') && <span className="text-gray-500">Chưa đánh giá</span>}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="mt-4">
                      <input
                        type="url"
                        value={formData.avatar}
                        onChange={(e) => handleInputChange('avatar', e.target.value)}
                        className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Hoặc nhập URL ảnh"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Tên đăng nhập</h5>
                  <p className="text-gray-900">{formData.username || 'Chưa có thông tin'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Số điện thoại</h5>
                  <div className="flex items-center">
                    <p className="text-gray-900">{formData.phoneNumber || 'Chưa có thông tin'}</p>
                    {formData.isPhoneVerified && (
                      <svg className="w-4 h-4 ml-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Trạng thái tài khoản</h5>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(formData.accountStatus)}`}>
                    {formData.accountStatus === 'ACTIVE' ? 'Hoạt động' : 
                     formData.accountStatus === 'INACTIVE' ? 'Không hoạt động' : 
                     formData.accountStatus === 'SUSPENDED' ? 'Tạm khóa' : formData.accountStatus}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Lần đăng nhập cuối</h5>
                  <p className="text-gray-900 text-sm">{formatDateTime(formData.lastLogin)}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Ngày tạo tài khoản</h5>
                  <p className="text-gray-900 text-sm">{formatDateTime(formData.createdAt)}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-500 mb-1">Cập nhật lần cuối</h5>
                  <p className="text-gray-900 text-sm">{formatDateTime(formData.updatedAt)}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <h5 className="text-sm font-medium text-gray-500 mb-2">Quyền hạn</h5>
                  <div className="flex flex-wrap gap-1">
                    {formData.roles.length > 0 ? (
                      formData.roles.map((role, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {role.roleName}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">Chưa có quyền hạn</span>
                    )}
                  </div>
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