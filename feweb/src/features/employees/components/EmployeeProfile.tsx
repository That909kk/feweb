import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Edit3, Save, X, Shield, Lock, Eye, EyeOff, CheckCircle, XCircle, MapPin, Briefcase, Award } from 'lucide-react';
import { DashboardLayout } from '../../../layouts';
import { SectionCard } from '../../../shared/components';
import { useEmployeeProfile } from '../../../hooks';
import { useAuth } from '../../../contexts/AuthContext';
import { changePasswordApi, type ChangePasswordRequest } from '../../../api';
import changePasswordData from '../../../static-data/pages/change-password.json';

interface WorkingZone {
  ward: string;
  city: string;
}

interface Role {
  roleId: number;
  roleName: string;
}

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
  rating: string | null;
  employeeStatus: string;
  accountStatus: string;
  isPhoneVerified: boolean;
  lastLogin: string;
  roles: Role[];
  workingZones: WorkingZone[];
}

interface EmployeeProfileProps {
  employeeId?: string;
}

const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employeeId }) => {
  const { user } = useAuth();
  const currentEmployeeId = employeeId || user?.employeeId;
  
  const { profile, isLoading, error, updateProfile, fetchProfile, clearError } = useEmployeeProfile(currentEmployeeId);
  
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
  
  const passwordTextData = changePasswordData?.vi || {};

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
    rating: null,
    employeeStatus: '',
    accountStatus: '',
    isPhoneVerified: false,
    lastLogin: '',
    roles: [],
    workingZones: []
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [skillsInput, setSkillsInput] = useState<string>('');

  // Load employee data from API
  useEffect(() => {
    if (profile) {
      const newFormData = {
        employeeId: profile.employeeId,
        avatar: profile.avatar || '',
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.account?.phoneNumber || '',
        isMale: profile.isMale ?? true,
        birthdate: profile.birthdate || '',
        hiredDate: profile.hiredDate || '',
        skills: profile.skills || [],
        bio: profile.bio || '',
        rating: profile.rating ?? null,
        employeeStatus: profile.employeeStatus || '',
        accountStatus: profile.account?.status || '',
        isPhoneVerified: profile.account?.isPhoneVerified ?? false,
        lastLogin: profile.account?.lastLogin || '',
        roles: profile.account?.roles || [],
        workingZones: profile.workingZones || []
      };
      setFormData(newFormData);
      setPreviewUrl(profile.avatar || '');
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleSkillsChange = useCallback((value: string) => {
    setSkillsInput(value);
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    clearError();
  }, [clearError]);

  const handleCancel = useCallback(() => {
    if (profile) {
      setFormData({
        employeeId: profile.employeeId,
        avatar: profile.avatar || '',
        fullName: profile.fullName || '',
        email: profile.email || '',
        phoneNumber: profile.account?.phoneNumber || '',
        isMale: profile.isMale ?? true,
        birthdate: profile.birthdate || '',
        hiredDate: profile.hiredDate || '',
        skills: profile.skills || [],
        bio: profile.bio || '',
        rating: profile.rating ?? null,
        employeeStatus: profile.employeeStatus || '',
        accountStatus: profile.account?.status || '',
        isPhoneVerified: profile.account?.isPhoneVerified ?? false,
        lastLogin: profile.account?.lastLogin || '',
        roles: profile.account?.roles || [],
        workingZones: profile.workingZones || []
      });
      setPreviewUrl(profile.avatar || '');
      setSkillsInput(profile.skills ? profile.skills.join(', ') : '');
    }
    setIsEditing(false);
    clearError();
  }, [profile, clearError]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!currentEmployeeId) {
      console.error('No employee ID available');
      return;
    }

    clearError();

    try {
      // For now, just update without avatar upload
      // You can add uploadAvatar functionality similar to customer if needed
      
      const updateData = {
        avatar: formData.avatar,
        fullName: formData.fullName,
        isMale: formData.isMale,
        email: formData.email,
        birthdate: formData.birthdate,
        hiredDate: formData.hiredDate,
        skills: formData.skills,
        bio: formData.bio,
        rating: formData.rating,
        employeeStatus: formData.employeeStatus
      };

      const success = await updateProfile(updateData);
      
      if (success) {
        setShowSuccess(true);
        setIsEditing(false);
        setTimeout(() => setShowSuccess(false), 3000);
        await fetchProfile();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  }, [currentEmployeeId, formData, clearError, updateProfile, fetchProfile]);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'AVAILABLE': 'bg-status-success/10 text-status-success border-status-success/20',
      'BUSY': 'bg-orange-50 text-orange-700 border-orange-200',
      'UNAVAILABLE': 'bg-status-danger/10 text-status-danger border-status-danger/20',
      'ON_LEAVE': 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'AVAILABLE': 'Sẵn sàng',
      'BUSY': 'Đang bận',
      'UNAVAILABLE': 'Không khả dụng',
      'ON_LEAVE': 'Nghỉ phép'
    };
    return texts[status] || status;
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout role="EMPLOYEE" title="Hồ Sơ Nhân Viên">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
            <p className="mt-4 text-brand-text/60">Đang tải thông tin nhân viên...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <DashboardLayout role="EMPLOYEE" title="Hồ Sơ Nhân Viên">
        <div className="bg-status-danger/10 border border-status-danger/20 rounded-2xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-status-danger" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-status-danger">
                Có lỗi xảy ra
              </h3>
              <div className="mt-2 text-sm text-status-danger/80">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="bg-status-danger/10 text-status-danger px-3 py-2 rounded-xl text-sm font-medium hover:bg-status-danger/20"
                >
                  Tải lại trang
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
    <DashboardLayout
      role="EMPLOYEE"
      title="Hồ Sơ Nhân Viên"
      description="Quản lý thông tin cá nhân và tài khoản"
      actions={
        isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-navy px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-brand-navyHover transition-colors"
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
                      {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'E'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-brand-navy">
                  {formData.fullName || 'Chưa có tên'}
                </h3>
                <p className="text-brand-text/70">{formData.email}</p>
                {formData.employeeStatus && (
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(formData.employeeStatus)}`}>
                      <Briefcase className="h-3 w-3" />
                      {getStatusText(formData.employeeStatus)}
                    </span>
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
                <input
                  type="tel"
                  value={formData.phoneNumber || ''}
                  disabled={true}
                  className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-outline/10 text-brand-text/90"
                />
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  name="birthdate"
                  value={formatDate(formData.birthdate)}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`block w-full px-4 py-3 rounded-2xl border-0 transition-all duration-200 ${
                    isEditing 
                      ? 'bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white' 
                      : 'bg-brand-outline/10 text-brand-text/90'
                  }`}
                />
              </div>

              {/* Hired Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Ngày vào làm
                </label>
                <input
                  type="date"
                  name="hiredDate"
                  value={formatDate(formData.hiredDate)}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`block w-full px-4 py-3 rounded-2xl border-0 transition-all duration-200 ${
                    isEditing 
                      ? 'bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white' 
                      : 'bg-brand-outline/10 text-brand-text/90'
                  }`}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Skills & Bio Section */}
        <div className="lg:col-span-3">
          <SectionCard
            title="Kỹ năng & Giới thiệu"
            description="Thông tin về kỹ năng và mô tả công việc"
          >
            <div className="grid grid-cols-1 gap-6">
              {/* Skills */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Kỹ năng
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => handleSkillsChange(e.target.value)}
                    placeholder="Nhập kỹ năng, cách nhau bởi dấu phẩy (VD: Dọn dẹp, Nấu ăn, Chăm sóc)"
                    className="block w-full px-4 py-3 rounded-2xl border-0 bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white transition-all duration-200"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills && formData.skills.length > 0 ? (
                      formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
                        >
                          <Award className="h-3.5 w-3.5" />
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-brand-text/50 italic">Chưa có kỹ năng</p>
                    )}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-brand-text/80">
                  Giới thiệu bản thân
                </label>
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Mô tả kinh nghiệm và điểm mạnh của bạn..."
                  className={`block w-full px-4 py-3 rounded-2xl border-0 transition-all duration-200 resize-none ${
                    isEditing 
                      ? 'bg-brand-background shadow-sm ring-1 ring-brand-outline/30 focus:ring-2 focus:ring-brand-teal focus:bg-white' 
                      : 'bg-brand-outline/10 text-brand-text/90'
                  }`}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Working Zones */}
        {formData.workingZones && formData.workingZones.length > 0 && (
          <div className="lg:col-span-3">
            <SectionCard
              title="Khu vực làm việc"
              description="Các khu vực bạn có thể phục vụ"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.workingZones.map((zone, index) => (
                  <div
                    key={index}
                    className="relative p-4 rounded-2xl border-2 border-brand-outline/20 bg-white hover:border-brand-teal/40 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="p-2 bg-brand-teal/10 rounded-xl">
                          <MapPin className="h-5 w-5 text-brand-teal" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="space-y-1">
                          <p className="text-xs text-brand-text/60">
                            <span className="font-medium">Phường/Xã:</span> {zone.ward}
                          </p>
                          <p className="text-xs text-brand-text/60">
                            <span className="font-medium">Thành phố:</span> {zone.city}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Account Security */}
        <div className="lg:col-span-3">
          <SectionCard
            title="Bảo mật tài khoản"
            description="Quản lý mật khẩu và bảo mật"
          >
            <div className="pt-2">
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
    
    {/* Change Password Modal */}
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
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
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

export default EmployeeProfile;
