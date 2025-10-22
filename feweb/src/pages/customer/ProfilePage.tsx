import React, { useState, useEffect, useCallback } from 'react';
import { Edit3, Save, X, Upload, Shield, User, Calendar, Clock } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { SectionCard } from '../../shared/components';
import { useCustomer } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import customerProfileData from '../../static-data/pages/customer-profile.json';
import type { UpdateCustomerRequest } from '../../types';

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

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { updateCustomer, uploadAvatar, getCustomerInfo, isLoading, error, clearError } = useCustomer();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const currentCustomerId = user?.customerId;
  
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

  // Load customer data from API
  useEffect(() => {
    const loadCustomerData = async () => {
      if (currentCustomerId) {
        const data = await getCustomerInfo(currentCustomerId);
        if (data) {
          setFormData({
            customerId: data.customerId,
            avatar: data.avatar || '',
            fullName: data.fullName || '',
            email: data.email || '',
            phoneNumber: data.account.phoneNumber || '',
            isMale: data.isMale ?? true,
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
  }, [currentCustomerId, getCustomerInfo]);

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

      // Create update payload
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
        
        if (updatedAvatarUrl) {
          setPreviewUrl(updatedAvatarUrl);
        }
        
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
    setIsEditing(false);
    setAvatarFile(null);
    clearError();
    // Reload data from API
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
            isMale: data.isMale ?? true,
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
      <DashboardLayout
        role="CUSTOMER"
        title="Hồ sơ cá nhân"
        description="Không thể tải thông tin khách hàng. Vui lòng đăng nhập lại."
      >
        <div className="text-center py-12">
          <p className="text-brand-text/60">Vui lòng đăng nhập lại để xem thông tin hồ sơ.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="CUSTOMER"
      title="Hồ sơ cá nhân"
      description="Quản lý thông tin cá nhân và cài đặt tài khoản của bạn."
      actions={
        isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-brand-outline/40 bg-white px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-background transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-teal px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-brand-teal/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-navy px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-brand-navyHover transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            Chỉnh sửa
          </button>
        )
      }
    >
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-status-success/10 border border-status-success/20 rounded-2xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-status-success" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-status-success">
                Cập nhật thông tin thành công!
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
              <X className="h-5 w-5 text-status-danger" />
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
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <SectionCard
            title="Ảnh đại diện"
            description="Cập nhật ảnh đại diện của bạn"
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={formData.fullName}
                    className="h-32 w-32 rounded-3xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-white font-bold text-4xl">
                      {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
                {isEditing && (
                  <label className="absolute -bottom-2 -right-2 inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-teal text-white shadow-lg hover:bg-brand-teal/90 cursor-pointer transition-colors">
                    <Upload className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-brand-navy">
                  {formData.fullName || 'Chưa có tên'}
                </h3>
                <p className="text-brand-text/70">{formData.email}</p>
                
                {/* VIP Level Badge */}
                <div className="mt-3 flex justify-center">
                  {formData.vipLevel === 'DIAMOND' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                      Kim cương
                    </span>
                  )}
                  {formData.vipLevel === 'GOLD' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-3 py-1 text-xs font-semibold text-white">
                      Vàng
                    </span>
                  )}
                  {formData.vipLevel === 'SILVER' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 px-3 py-1 text-xs font-semibold text-white">
                      Bạc
                    </span>
                  )}
                  {formData.vipLevel === 'BRONZE' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-3 py-1 text-xs font-semibold text-white">
                      Đồng
                    </span>
                  )}
                  {(!formData.vipLevel || formData.vipLevel === '') && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-brand-outline/20 px-3 py-1 text-xs font-medium text-brand-text/70">
                      Thành viên thường
                    </span>
                  )}
                </div>

                {/* Rating */}
                {formData.rating && formData.rating > 0 && (
                  <div className="mt-2 flex items-center justify-center gap-1 text-sm text-brand-secondary">
                    <span>⭐ {formData.rating} điểm</span>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Personal Information */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Thông tin cá nhân"
            description="Cập nhật thông tin cá nhân của bạn"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Họ và tên <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`block w-full px-4 py-3 rounded-2xl border-0 transition-all duration-200 ${
                    isEditing 
                      ? 'bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white' 
                      : 'bg-brand-outline/10 text-brand-text/90'
                  }`}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Email <span className="text-status-danger">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`block w-full px-4 py-3 rounded-2xl border-0 transition-all duration-200 ${
                    isEditing 
                      ? 'bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white' 
                      : 'bg-brand-outline/10 text-brand-text/90'
                  }`}
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Số điện thoại
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phoneNumber || ''}
                    disabled={true}
                    className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-outline/10 text-brand-text/90"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    {formData.isPhoneVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-success">
                        <Shield className="h-3 w-3" />
                        Đã xác thực
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-status-warning">
                        <X className="h-3 w-3" />
                        Chưa xác thực
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Giới tính
                </label>
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
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </select>
              </div>

              {/* Birthdate */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Ngày sinh
                </label>
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
              </div>

              {/* Roles */}
              {formData.roles.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-brand-text/80">
                    Vai trò
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.roles.map((role, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 px-3 py-1 text-sm font-medium text-brand-teal"
                      >
                        <User className="h-3 w-3" />
                        {role.roleName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Account Info */}
        <div className="lg:col-span-3">
          <SectionCard
            title="Thông tin tài khoản"
            description="Thông tin hệ thống và trạng thái tài khoản"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Account Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Trạng thái tài khoản
                </label>
                <div className="flex items-center">
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                    formData.accountStatus === 'ACTIVE' 
                      ? 'bg-status-success/10 text-status-success border border-status-success/20' 
                      : 'bg-status-warning/10 text-status-warning border border-status-warning/20'
                  }`}>
                    <Shield className="h-4 w-4" />
                    {formData.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
              </div>

              {/* Last Login */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Đăng nhập cuối
                </label>
                <div className="flex items-center gap-2 text-sm text-brand-text/70">
                  <Clock className="h-4 w-4" />
                  {formData.lastLogin ? new Date(formData.lastLogin).toLocaleString('vi-VN') : 'Chưa có thông tin'}
                </div>
              </div>

              {/* Created At */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Ngày tạo
                </label>
                <div className="flex items-center gap-2 text-sm text-brand-text/70">
                  <Calendar className="h-4 w-4" />
                  {formData.createdAt ? new Date(formData.createdAt).toLocaleString('vi-VN') : 'Chưa có thông tin'}
                </div>
              </div>

              {/* Updated At */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Cập nhật cuối
                </label>
                <div className="flex items-center gap-2 text-sm text-brand-text/70">
                  <Clock className="h-4 w-4" />
                  {formData.updatedAt ? new Date(formData.updatedAt).toLocaleString('vi-VN') : 'Chưa có thông tin'}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;