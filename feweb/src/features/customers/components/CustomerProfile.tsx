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
    <div className="min-h-screen bg-brand-background">
      <Navigation />
      
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-status-success/10 border border-status-success/20 rounded-2xl p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-status-success" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-status-success">
                  {textData.messages?.updateSuccess || 'Cập nhật thông tin thành công!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-status-danger/10 border border-status-danger/20 rounded-2xl p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-status-danger" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-status-danger">{error}</p>
              </div>
              <div className="ml-3">
                <button
                  type="button"
                  onClick={clearError}
                  className="bg-status-danger/10 text-status-danger p-1.5 rounded-lg hover:bg-status-danger/20 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-brand-outline/40 bg-white/95 shadow-elevation-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevation-md mb-6">
          {/* Decorative Background */}
          <div className="absolute -top-12 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-brand-teal/20 to-transparent" />
          <div className="absolute -bottom-12 left-0 h-24 w-24 rounded-full bg-gradient-to-tr from-brand-secondary/20 to-transparent" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={formData.fullName}
                      className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center border-4 border-white shadow-lg">
                      <span className="text-white font-bold text-2xl sm:text-4xl">
                        {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'C'}
                      </span>
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute -bottom-2 -right-2 inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-teal text-white shadow-lg hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal border-2 border-white cursor-pointer transition-colors">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy mb-2">
                    {formData.fullName || 'Chưa có tên'}
                  </h1>
                  <p className="text-brand-text/70 mb-3">{formData.email}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {/* VIP Level Badge */}
                    <div className="flex items-center">
                      {formData.vipLevel === 'DIAMOND' && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 2l2 5h8l2-5-6 19L6 2z"/>
                          </svg>
                          Kim cương
                        </span>
                      )}
                      {formData.vipLevel === 'GOLD' && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-3 py-1 text-xs font-semibold text-white">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 2l2 5h8l2-5-6 19L6 2z"/>
                          </svg>
                          Vàng
                        </span>
                      )}
                      {formData.vipLevel === 'SILVER' && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 px-3 py-1 text-xs font-semibold text-white">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 2l2 5h8l2-5-6 19L6 2z"/>
                          </svg>
                          Bạc
                        </span>
                      )}
                      {formData.vipLevel === 'BRONZE' && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3 py-1 text-xs font-semibold text-white">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 2l2 5h8l2-5-6 19L6 2z"/>
                          </svg>
                          Đồng
                        </span>
                      )}
                      {(!formData.vipLevel || formData.vipLevel === '') && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-brand-outline/20 px-3 py-1 text-xs font-medium text-brand-text/70">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                          </svg>
                          Thành viên thường
                        </span>
                      )}
                    </div>
                    
                    {/* Rating Badge */}
                    {formData.rating && formData.rating > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-brand-secondary/20 px-3 py-1 text-xs font-medium text-brand-secondary">
                        <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {formData.rating} điểm
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 rounded-2xl border border-brand-outline/40 bg-white px-6 py-3 text-sm font-medium text-brand-text hover:bg-brand-background transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {textData.actions?.cancel || 'Hủy'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 rounded-2xl bg-brand-teal px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-brand-teal/90 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {textData.messages?.loading || 'Đang lưu...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {textData.actions?.save || 'Lưu thay đổi'}
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-navy px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-brand-navyHover transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {textData.actions?.edit || 'Chỉnh sửa'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Personal Information Section */}
        <div className="relative overflow-hidden rounded-3xl border border-brand-outline/40 bg-white/95 shadow-elevation-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevation-md mb-6">
          <div className="absolute -top-12 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-brand-secondary/20 to-transparent" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-navy/10">
                  <svg className="h-6 w-6 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-brand-navy">
                  Thông tin cá nhân
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.fullName}
                  <span className="text-status-danger ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder={textData.form.placeholders.fullName}
                    className={`block w-full px-4 py-3 rounded-2xl border-0 transition-all duration-200 ${
                      isEditing 
                        ? 'bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white' 
                        : 'bg-brand-outline/10 text-brand-text/90'
                    }`}
                    required
                  />
                  {isEditing && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-4 w-4 text-brand-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.email}
                  <span className="text-status-danger ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder={textData.form.placeholders.email}
                    className={`block w-full px-4 py-3 rounded-2xl border-0 transition-all duration-200 ${
                      isEditing 
                        ? 'bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white' 
                        : 'bg-brand-outline/10 text-brand-text/90'
                    }`}
                    required
                  />
                  {isEditing && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-4 w-4 text-brand-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.phoneNumber}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleInputChange}
                    disabled={true} 
                    placeholder={textData.form.placeholders.phoneNumber}
                    className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-outline/10 text-brand-text/90"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    {formData.isPhoneVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Đã xác thực
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-warning">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Chưa xác thực
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.gender}
                </label>
                <div className="relative">
                  <select
                    name="isMale"
                    value={formData.isMale?.toString() || 'true'}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`block w-full px-4 py-3 rounded-2xl border-0 transition-all duration-200 ${
                      isEditing 
                        ? 'bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white' 
                        : 'bg-brand-outline/10 text-brand-text/90'
                    }`}
                  >
                    <option value="true">{textData.form.genderOptions.male}</option>
                    <option value="false">{textData.form.genderOptions.female}</option>
                  </select>
                  {isEditing && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="h-4 w-4 text-brand-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Birthdate */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.birthdate}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`block w-full px-4 py-3 rounded-2xl border-0 transition-all duration-200 ${
                      isEditing 
                        ? 'bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white' 
                        : 'bg-brand-outline/10 text-brand-text/90'
                    }`}
                  />
                  {isEditing && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <svg className="h-4 w-4 text-brand-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.roles}
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.roles.map((role, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 px-3 py-1 text-sm font-medium text-brand-teal"
                    >
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {role.roleName}
                    </span>
                  ))}
                  {formData.roles.length === 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-outline/10 px-3 py-1 text-sm text-brand-text/60">
                      Chưa có vai trò
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Account Information Section */}
        <div className="relative overflow-hidden rounded-3xl border border-brand-outline/40 bg-white/95 shadow-elevation-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevation-md mb-6">
          <div className="absolute -top-12 left-0 h-32 w-32 rounded-full bg-gradient-to-br from-brand-navy/20 to-transparent" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10">
                  <svg className="h-6 w-6 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-brand-navy">
                  Thông tin tài khoản
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Account Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.accountStatus}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.accountStatus || ''}
                    disabled={true}
                    className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-outline/10 text-brand-text/90"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      formData.accountStatus === 'ACTIVE' ? 'text-status-success' : 'text-status-warning'
                    }`}>
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {formData.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone Verified Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.isPhoneVerified}
                </label>
                <div className="flex items-center justify-center">
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                    formData.isPhoneVerified 
                      ? 'bg-status-success/10 text-status-success border border-status-success/20' 
                      : 'bg-status-warning/10 text-status-warning border border-status-warning/20'
                  }`}>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      {formData.isPhoneVerified ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      )}
                    </svg>
                    {formData.isPhoneVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </span>
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.rating}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.rating ? `${formData.rating} ⭐` : 'Chưa có đánh giá'}
                    disabled={true}
                    className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-outline/10 text-brand-text/90"
                  />
                </div>
              </div>

              {/* VIP Level */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.vipLevel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.vipLevel || 'Thành viên thường'}
                    disabled={true}
                    className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-outline/10 text-brand-text/90"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Information Section */}
        <div className="relative overflow-hidden rounded-3xl border border-brand-outline/40 bg-white/95 shadow-elevation-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevation-md">
          <div className="absolute -top-12 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-brand-secondary/20 to-transparent" />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-secondary/10">
                  <svg className="h-6 w-6 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-brand-navy">
                  Thông tin hệ thống
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Last Login */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.lastLogin}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.lastLogin ? new Date(formData.lastLogin).toLocaleString('vi-VN') : 'Chưa có thông tin'}
                    disabled={true}
                    className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-outline/10 text-brand-text/90"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="h-4 w-4 text-brand-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Created At */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.createdAt}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.createdAt ? new Date(formData.createdAt).toLocaleString('vi-VN') : 'Chưa có thông tin'}
                    disabled={true}
                    className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-outline/10 text-brand-text/90"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="h-4 w-4 text-brand-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Updated At */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  {textData.form.fields.updatedAt}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.updatedAt ? new Date(formData.updatedAt).toLocaleString('vi-VN') : 'Chưa có thông tin'}
                    disabled={true}
                    className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-outline/10 text-brand-text/90"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <svg className="h-4 w-4 text-brand-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


