import React, { useState, useEffect, useCallback } from 'react';
import { useCustomer } from '../../../hooks';
import { useAuth } from '../../../contexts/AuthContext';
import Navigation from '../../../components/Navigation';
import customerProfileData from '../../../static-data/pages/customer-profile.json';
import type { UpdateCustomerRequest } from '../../../types';

interface CustomerFormData {
  customerId: string;
  avatar?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  isMale: boolean;
  birthdate: string;
  accountStatus: string;
  isPhoneVerified: boolean;
  rating?: number | null;
  vipLevel?: string | null;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  roles: Array<{
    roleId: number;
    roleName: string;
  }>;
}

interface CustomerProfileProps {
  customerId?: string;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ customerId }) => {
  const { user } = useAuth();
  const { updateCustomer, uploadAvatar, getCustomerInfo, isLoading, error, clearError } = useCustomer();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Use customerId from props or from user
  const currentCustomerId = customerId || user?.customerId;

  const [formData, setFormData] = useState<CustomerFormData>({
    customerId: '',
    avatar: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    isMale: true,
    birthdate: '',
    accountStatus: '',
    isPhoneVerified: false,
    rating: null,
    vipLevel: null,
    lastLogin: '',
    createdAt: '',
    updatedAt: '',
    roles: []
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(formData.avatar || '');

  // Get text data based on language (defaulting to Vietnamese)
  const textData = customerProfileData?.vi || {};

  // Early return if textData is not loaded
  if (!textData || !textData.form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  // Load customer data from API
  useEffect(() => {
    const loadCustomerData = async () => {
      if (currentCustomerId) {
        const data = await getCustomerInfo(currentCustomerId);
        if (data) {
          // Populate form with data from API response
          setFormData({
            customerId: data.customerId,
            avatar: data.avatar || '',
            fullName: data.fullName || '',
            email: data.email || '',
            phoneNumber: data.account.phoneNumber || '',
            isMale: data.isMale ?? true, // Use nullish coalescing to handle null/undefined
            birthdate: data.birthdate || '',
            accountStatus: data.account.status || '',
            isPhoneVerified: data.account.isPhoneVerified ?? false,
            rating: data.rating ?? null,
            vipLevel: data.vipLevel || null,
            lastLogin: data.account.lastLogin || '',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
            roles: data.account.roles || []
          });
          setPreviewUrl(data.avatar || '');
        }
      }
    };

    loadCustomerData();
  }, [currentCustomerId]); // Removed getCustomerInfo from dependencies

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'isMale') {
      setFormData(prev => ({
        ...prev,
        isMale: value === 'true'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!currentCustomerId) {
      console.error('No customer ID available');
      return;
    }

    clearError();

    try {
      // Upload avatar first if there's a new file
      let updatedAvatarUrl = formData.avatar;
      if (avatarFile) {
        const avatarResult = await uploadAvatar(currentCustomerId, avatarFile);
        if (avatarResult?.customer?.avatar) {
          updatedAvatarUrl = avatarResult.customer.avatar;
        }
      }

      // Create update payload with only allowed fields according to API spec
      const updateData: UpdateCustomerRequest = {
        avatar: updatedAvatarUrl || '',
        fullName: formData.fullName,
        isMale: formData.isMale,
        email: formData.email,
        birthdate: formData.birthdate
      };

      const result = await updateCustomer(currentCustomerId, updateData);
      
      if (result) {
        setShowSuccess(true);
        setIsEditing(false);
        setTimeout(() => setShowSuccess(false), 3000);
        
        // Update preview URL with the new avatar
        if (updatedAvatarUrl) {
          setPreviewUrl(updatedAvatarUrl);
        }
        
        // Update form data with response data
        setFormData(prev => ({
          ...prev,
          avatar: result.data.avatar || '',
          fullName: result.data.fullName,
          isMale: result.data.isMale,
          email: result.data.email,
          birthdate: result.data.birthdate || ''
        }));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  }, [currentCustomerId, formData, avatarFile, clearError, uploadAvatar, updateCustomer]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    clearError();
  }, [clearError]);

  const handleCancel = useCallback(() => {
    // Reset form data sẽ load lại từ API hoặc reset về empty state
    setIsEditing(false);
    setAvatarFile(null);
    clearError();
    // Reload data từ API
    if (currentCustomerId) {
      const loadData = async () => {
        const data = await getCustomerInfo(currentCustomerId);
        if (data) {
          setFormData({
            customerId: data.customerId,
            avatar: data.avatar || '',
            fullName: data.fullName || '',
            email: data.email || '',
            phoneNumber: data.account.phoneNumber || '',
            isMale: data.isMale ?? true, // Use nullish coalescing to handle null/undefined
            birthdate: data.birthdate || '',
            accountStatus: data.account.status || '',
            isPhoneVerified: data.account.isPhoneVerified ?? false,
            rating: data.rating ?? null,
            vipLevel: data.vipLevel || null,
            lastLogin: data.account.lastLogin || '',
            createdAt: data.createdAt || '',
            updatedAt: data.updatedAt || '',
            roles: data.account.roles || []
          });
          setPreviewUrl(data.avatar || '');
        }
      };
      loadData();
    }
  }, [currentCustomerId, getCustomerInfo, clearError]);

  if (!currentCustomerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Không thể tải thông tin khách hàng
          </h2>
          <p className="text-gray-600">Vui lòng đăng nhập lại</p>
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
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {textData.title || 'Hồ Sơ Khách Hàng'}
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
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {textData.buttons?.cancel || 'Hủy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 flex items-center"
                  >
                    {isLoading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                  onClick={handleEdit}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
            {/* Customer Avatar Section */}
            <div className="flex items-start space-x-6 pb-6 border-b border-gray-200">
              <div className="relative flex-shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={formData.fullName}
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-white font-medium text-4xl">
                      {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'C'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 border-2 border-white"
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
                    {/* VIP Level */}
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                      </svg>
                      {formData.vipLevel === 'DIAMOND' && <span className="text-purple-600 font-medium">Kim cương</span>}
                      {formData.vipLevel === 'GOLD' && <span className="text-yellow-600 font-medium">Vàng</span>}
                      {formData.vipLevel === 'SILVER' && <span className="text-gray-600 font-medium">Bạc</span>}
                      {formData.vipLevel === 'BRONZE' && <span className="text-orange-600 font-medium">Đồng</span>}
                      {(!formData.vipLevel || formData.vipLevel === '') && <span className="text-gray-500">Thành viên thường</span>}
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      {formData.rating && formData.rating >= 4.5 && <span className="text-emerald-600 font-medium">Xuất sắc ({formData.rating}⭐)</span>}
                      {formData.rating && formData.rating >= 4.0 && formData.rating < 4.5 && <span className="text-blue-600 font-medium">Tốt ({formData.rating}⭐)</span>}
                      {formData.rating && formData.rating >= 3.0 && formData.rating < 4.0 && <span className="text-yellow-600 font-medium">Trung bình ({formData.rating}⭐)</span>}
                      {formData.rating && formData.rating >= 2.0 && formData.rating < 3.0 && <span className="text-orange-600 font-medium">Kém ({formData.rating}⭐)</span>}
                      {formData.rating && formData.rating < 2.0 && <span className="text-red-600 font-medium">Rất kém ({formData.rating}⭐)</span>}
                      {(!formData.rating || formData.rating === 0) && <span className="text-gray-500">Chưa đánh giá</span>}
                    </div>
                  </div>
                  {isEditing && (
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="block w-full max-w-xs text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information - Combined Section */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Thông tin cơ bản
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {textData.form.fields.fullName}
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder={textData.form.placeholders.fullName}
                    className="block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-purple-50 disabled:text-gray-900 border-0"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {textData.form.fields.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder={textData.form.placeholders.email}
                    className="block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-purple-50 disabled:text-gray-900 border-0"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {textData.form.fields.phoneNumber}
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder={textData.form.placeholders.phoneNumber}
                    className="block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-purple-50 disabled:text-gray-900 border-0"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {textData.form.fields.gender}
                  </label>
                  <select
                    name="isMale"
                    value={formData.isMale?.toString() || 'true'}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-purple-50 disabled:text-gray-900 border-0"
                  >
                    <option value="true">{textData.form.genderOptions.male}</option>
                    <option value="false">{textData.form.genderOptions.female}</option>
                  </select>
                </div>

                {/* Birthdate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {textData.form.fields.birthdate}
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="block w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:bg-purple-50 disabled:text-gray-900 border-0"
                    required
                  />
                </div>

                {/* Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {textData.form.fields.roles}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.roles.map((role, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                      >
                        {role.roleName}
                      </span>
                    ))}
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
                {/* Account Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {textData.form.fields.accountStatus}
                  </label>
                  <input
                    type="text"
                value={formData.accountStatus || ''}
                disabled={true}
                className="block w-full px-3 py-2 rounded-md shadow-sm bg-purple-50 text-gray-900 border-0"
              />
            </div>

            {/* Phone Verified */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {textData.form.fields.isPhoneVerified}
              </label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  formData.isPhoneVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {formData.isPhoneVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                </span>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {textData.form.fields.rating}
              </label>
              <input
                type="text"
                value={formData.rating ? `${formData.rating} ⭐` : 'Chưa có đánh giá'}
                disabled={true}
                className="block w-full px-3 py-2 rounded-md shadow-sm bg-purple-50 text-gray-900 border-0"
              />
            </div>

            {/* VIP Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {textData.form.fields.vipLevel}
              </label>
              <input
                type="text"
                value={formData.vipLevel || 'Thành viên thường'}
                disabled={true}
                className="block w-full px-3 py-2 rounded-md shadow-sm bg-purple-50 text-gray-900 border-0"
              />
            </div>
              </div>
            </div>

            {/* Thông tin hệ thống */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Thông tin hệ thống</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Last Login */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {textData.form.fields.lastLogin}
                  </label>
                  <input
                    type="text"
                    value={formData.lastLogin ? new Date(formData.lastLogin).toLocaleString('vi-VN') : ''}
                    disabled={true}
                    className="block w-full px-3 py-2 rounded-md shadow-sm bg-purple-50 text-gray-900 border-0"
                  />
                </div>

                {/* Created At */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {textData.form.fields.createdAt}
                  </label>
                  <input
                    type="text"
                    value={formData.createdAt ? new Date(formData.createdAt).toLocaleString('vi-VN') : ''}
                    disabled={true}
                    className="block w-full px-3 py-2 rounded-md shadow-sm bg-purple-50 text-gray-900 border-0"
                  />
                </div>

            {/* Updated At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {textData.form.fields.updatedAt}
              </label>
              <input
                type="text"
                value={formData.updatedAt ? new Date(formData.updatedAt).toLocaleString('vi-VN') : ''}
                disabled={true}
                className="block w-full px-3 py-2 rounded-md shadow-sm bg-purple-50 text-gray-900 border-0"
              />
            </div>
              </div>
            </div>

            {/* Action Buttons - Only show when editing */}
            {isEditing && (
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {textData.actions.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {textData.messages.loading}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {textData.actions.update}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};