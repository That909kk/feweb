import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Edit3, Save, X, Upload, Shield, User, Calendar, Clock, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { SectionCard } from '../../shared/components';
import { useCustomer } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { changePasswordApi, type ChangePasswordRequest } from '../../api';
import changePasswordData from '../../static-data/pages/change-password.json';
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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showChangePasswordModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showChangePasswordModal]);
  
  // Change Password State
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  const currentCustomerId = user?.customerId;
  
  const passwordTextData = changePasswordData?.vi || {};
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCustomerId]);

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

  // Change Password Handlers
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePasswordForm = (): boolean => {
    if (!passwordData.currentPassword) {
      setPasswordError(passwordTextData.messages?.currentPasswordRequired || 'Vui lòng nhập mật khẩu hiện tại');
      return false;
    }
    if (!passwordData.newPassword) {
      setPasswordError(passwordTextData.messages?.newPasswordRequired || 'Vui lòng nhập mật khẩu mới');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError(passwordTextData.messages?.passwordTooShort || 'Mật khẩu mới phải có ít nhất 6 ký tự');
      return false;
    }
    if (passwordData.newPassword.length > 50) {
      setPasswordError(passwordTextData.messages?.passwordTooLong || 'Mật khẩu mới không được vượt quá 50 ký tự');
      return false;
    }
    if (!passwordData.confirmPassword) {
      setPasswordError(passwordTextData.messages?.confirmPasswordRequired || 'Vui lòng xác nhận mật khẩu mới');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(passwordTextData.messages?.passwordMismatch || 'Mật khẩu xác nhận không khớp');
      return false;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError(passwordTextData.messages?.samePassword || 'Mật khẩu mới phải khác mật khẩu hiện tại');
      return false;
    }
    return true;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;

    setPasswordLoading(true);
    setPasswordError('');

    try {
      const response = await changePasswordApi(passwordData);
      
      if (response.success) {
        setPasswordSuccess(true);
        setTimeout(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/auth';
        }, 2000);
      }
    } catch (err: any) {
      console.error('Change password error:', err);
      const errorMessage = err.response?.data?.message;
      
      if (errorMessage === 'Mật khẩu hiện tại không đúng') {
        setPasswordError(passwordTextData.messages?.incorrectPassword || errorMessage);
      } else if (errorMessage === 'Mật khẩu xác nhận không khớp') {
        setPasswordError(passwordTextData.messages?.passwordMismatch || errorMessage);
      } else {
        setPasswordError(errorMessage || passwordTextData.messages?.error || 'Có lỗi xảy ra khi đổi mật khẩu');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setShowChangePasswordModal(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setPasswordSuccess(false);
    setShowPasswords({ current: false, new: false, confirm: false });
  };

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
    <>
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

            {/* Change Password Button */}
            <div className="mt-6 pt-6 border-t border-brand-outline/20">
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-2xl hover:bg-brand-teal/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Lock className="h-4 w-4" />
                Đổi mật khẩu
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
    
    {showChangePasswordModal && ReactDOM.createPortal(
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCancelPasswordChange();
        }}
      >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand-teal to-brand-navy px-6 py-4 rounded-t-3xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {passwordTextData.title || 'Đổi mật khẩu'}
                  </h2>
                </div>
                <button
                  onClick={handleCancelPasswordChange}
                  className="p-1.5 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 overflow-y-auto flex-1 scrollbar-thin rounded-b-3xl">
              {passwordSuccess ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-status-success/20 to-status-success/10 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                    <CheckCircle className="w-12 h-12 text-status-success" />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-text mb-2">
                    {passwordTextData.messages?.success || 'Đổi mật khẩu thành công'}
                  </h3>
                  <p className="text-brand-text/60">
                    {passwordTextData.messages?.sessionEnded || 'Phiên làm việc đã kết thúc. Vui lòng đăng nhập lại.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">{passwordError && (
                    <div className="bg-status-danger/10 border border-status-danger/30 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top duration-200">
                      <div className="p-1 bg-status-danger/10 rounded-lg">
                        <XCircle className="w-5 h-5 text-status-danger" />
                      </div>
                      <p className="text-sm text-status-danger font-medium flex-1">{passwordError}</p>
                    </div>
                  )}

                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-brand-text">
                      {passwordTextData.labels?.currentPassword || 'Mật khẩu hiện tại'}
                      <span className="text-status-danger ml-1">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder={passwordTextData.labels?.currentPasswordPlaceholder || 'Nhập mật khẩu hiện tại'}
                        className="w-full px-4 py-3 pr-12 rounded-xl border-0 bg-gray-50 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all duration-200 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-all duration-200"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-brand-text">
                      {passwordTextData.labels?.newPassword || 'Mật khẩu mới'}
                      <span className="text-status-danger ml-1">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder={passwordTextData.labels?.newPasswordPlaceholder || 'Nhập mật khẩu mới (tối thiểu 6 ký tự)'}
                        className="w-full px-4 py-3 pr-12 rounded-xl border-0 bg-gray-50 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all duration-200 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-all duration-200"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      {passwordTextData.hints?.passwordRequirements || 'Mật khẩu phải có từ 6-50 ký tự'}
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-brand-text">
                      {passwordTextData.labels?.confirmPassword || 'Xác nhận mật khẩu mới'}
                      <span className="text-status-danger ml-1">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder={passwordTextData.labels?.confirmPasswordPlaceholder || 'Nhập lại mật khẩu mới'}
                        className="w-full px-4 py-3 pr-12 rounded-xl border-0 bg-gray-50 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all duration-200 placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-all duration-200"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Security Tip */}
                  <div className="bg-gradient-to-r from-brand-teal/10 to-brand-navy/10 border border-brand-teal/30 rounded-xl p-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-brand-teal/20 rounded-lg">
                        <Shield className="w-4 h-4 text-brand-teal" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-brand-teal mb-0.5">Lời khuyên bảo mật</p>
                        <p className="text-xs text-brand-text/70">
                          {passwordTextData.hints?.securityTip || 'Sử dụng mật khẩu mạnh với chữ hoa, chữ thường, số và ký tự đặc biệt'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="flex-1 bg-gradient-to-r from-brand-teal to-brand-navy text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold disabled:hover:shadow-none"
                    >
                      {passwordLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Đang xử lý...
                        </span>
                      ) : (
                        passwordTextData.actions?.submit || 'Đổi mật khẩu'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelPasswordChange}
                      disabled={passwordLoading}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {passwordTextData.actions?.cancel || 'Hủy'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ProfilePage;