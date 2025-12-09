import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import registerData from '../static-data/pages/register.json';
import { useRegister } from '../hooks/useRegister';
import Notification from '../shared/components/Notification';
import type { RegisterRequest, UserRole } from '../types/api';
import type { Province, Commune } from '../types/address';
import { fetchProvinces, fetchCommunes, formatAddress } from '../api/address';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole | '';
  // Address fields
  provinceCode: string;
  communeCode: string;
  streetAddress: string;
}

interface FormErrors {
  [key: string]: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, error: hookError, clearError } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    role: '',
    provinceCode: '',
    communeCode: '',
    streetAddress: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Address data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  // Clear any existing auth tokens when visiting register page
  useEffect(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }, []);
  
  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await fetchProvinces();
        setProvinces(data);
      } catch (error) {
        console.error('Failed to load provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };
    loadProvinces();
  }, []);
  
  // Load communes when province changes
  useEffect(() => {
    if (formData.provinceCode) {
      const loadCommunes = async () => {
        setLoadingCommunes(true);
        setCommunes([]);
        setFormData(prev => ({ ...prev, communeCode: '' }));
        try {
          const data = await fetchCommunes(formData.provinceCode);
          setCommunes(data);
        } catch (error) {
          console.error('Failed to load communes:', error);
        } finally {
          setLoadingCommunes(false);
        }
      };
      loadCommunes();
    } else {
      setCommunes([]);
    }
  }, [formData.provinceCode]);

  const data = registerData.vi; // Có thể thay đổi theo ngôn ngữ người dùng

  const validateField = (name: string, value: string): string => {
    const { validationErrors } = data.messages;

    switch (name) {
      case 'username':
        if (!value) return validationErrors.usernameRequired;
        if (value.length < 3 || value.length > 50) return validationErrors.usernameLength;
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return validationErrors.usernameFormat;
        break;
      
      case 'password':
        if (!value) return validationErrors.passwordRequired;
        if (value.length < 6) return validationErrors.passwordLength;
        if (value.length > 100) return validationErrors.passwordMaxLength || 'Mật khẩu không được vượt quá 100 ký tự';
        break;
      
      case 'confirmPassword':
        if (!value) return validationErrors.confirmPasswordRequired;
        if (value !== formData.password) return validationErrors.passwordMismatch;
        break;
      
      case 'fullName':
        if (!value) return validationErrors.fullNameRequired;
        if (value.length > 100) return validationErrors.fullNameLength;
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) return validationErrors.fullNameFormat;
        break;
      
      case 'email':
        if (!value) return validationErrors.emailRequired;
        if (value.length > 255) return validationErrors.emailLength;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return validationErrors.emailFormat;
        break;
      
      case 'phoneNumber':
        if (!value) return validationErrors.phoneRequired;
        if (!/^(\+84[0-9]{9,10}|0[0-9]{9})$/.test(value)) return validationErrors.phoneFormat;
        break;
      
      case 'role':
        if (!value) return validationErrors.roleRequired;
        break;
      
      case 'provinceCode':
        if (!value) return 'Vui lòng chọn Tỉnh/Thành phố';
        break;
      
      case 'communeCode':
        if (!value) return 'Vui lòng chọn Phường/Xã';
        break;
      
      case 'streetAddress':
        if (!value) return 'Vui lòng nhập số nhà, tên đường';
        if (value.length > 200) return 'Địa chỉ không được vượt quá 200 ký tự';
        break;
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Real-time validation for password confirmation
    if (name === 'confirmPassword' || (name === 'password' && formData.confirmPassword)) {
      const confirmPasswordError = name === 'confirmPassword' 
        ? validateField('confirmPassword', value)
        : validateField('confirmPassword', formData.confirmPassword);
      
      setErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData] as string);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');
    clearError();

    if (!validateForm()) return;

    try {
      // Lấy thông tin địa chỉ
      const selectedProvince = provinces.find(p => p.code === formData.provinceCode);
      const selectedCommune = communes.find(c => c.code === formData.communeCode);
      
      const fullAddress = formatAddress(
        formData.streetAddress,
        selectedCommune?.name || '',
        selectedProvince?.name || ''
      );
      
      const registerRequest: RegisterRequest = {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role as UserRole,
        address: {
          fullAddress: fullAddress,
          ward: selectedCommune?.name || '',
          city: selectedProvince?.name || '',
          latitude: null,
          longitude: null
        }
      };

      const response = await register(registerRequest);
      
      if (response.success) {
        // Đăng ký thành công, chuyển sang trang xác thực OTP
        navigate('/verify-email', { 
          state: { 
            email: formData.email,
            fromRegister: true 
          } 
        });
      } else {
        setApiError(response.message || data.messages.registerError);
      }
    } catch (error: any) {
      if (error.response?.data?.field && error.response?.data?.message) {
        // API validation error
        setErrors({ [error.response.data.field]: error.response.data.message });
      } else {
        setApiError(hookError || error.response?.data?.message || data.messages.registerError);
      }
    }
  };

  const handleCancel = () => {
    navigate('/auth');
  };

  const handleLoginRedirect = () => {
    navigate('/auth', { state: { tab: 'login' } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-brand-teal to-brand-navy bg-clip-text text-transparent">Home Mate</h1>
        </div>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-brand-navy">
          {data.title}
        </h2>
        <p className="mt-2 text-center text-sm text-brand-text/70">
          {data.subtitle}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-sm py-6 sm:py-8 px-4 shadow-elevation-sm border border-brand-outline/40 rounded-2xl sm:rounded-3xl sm:px-10">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4">
              <Notification
                type="success"
                message={successMessage}
                onClose={() => setSuccessMessage('')}
              />
            </div>
          )}

          {/* API Error Message */}
          {apiError && (
            <div className="mb-4">
              <Notification
                type="error"
                message={apiError}
                onClose={() => setApiError('')}
              />
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Role - Đưa lên đầu */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-brand-navy mb-2">
                {data.form.role.label} <span className="text-status-danger">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`block w-full px-3 py-2.5 border ${
                  errors.role ? 'border-status-danger/50' : 'border-brand-outline/40'
                } bg-white text-brand-navy rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
              >
                <option value="">-- Chọn loại tài khoản --</option>
                <option value="CUSTOMER">{data.form.role.options.CUSTOMER}</option>
                <option value="EMPLOYEE">{data.form.role.options.EMPLOYEE}</option>
              </select>
              {errors.role && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.role}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-brand-navy mb-2">
                {data.form.username.label} <span className="text-status-danger">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={data.form.username.placeholder}
                className={`appearance-none relative block w-full px-3 py-2.5 border ${
                  errors.username ? 'border-status-danger/50' : 'border-brand-outline/40'
                } placeholder-brand-text/40 text-brand-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
              />
              {!errors.username && data.form.username.helperText && (
                <p className="mt-1.5 text-xs text-brand-text/60">{data.form.username.helperText}</p>
              )}
              {errors.username && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-brand-navy mb-2">
                {data.form.password.label} <span className="text-status-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder={data.form.password.placeholder}
                  className={`appearance-none relative block w-full px-3 py-2.5 pr-10 border ${
                    errors.password ? 'border-status-danger/50' : 'border-brand-outline/40'
                  } placeholder-brand-text/40 text-brand-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text/50 hover:text-brand-navy transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {!errors.password && data.form.password.helperText && (
                <p className="mt-1.5 text-xs text-brand-text/60">{data.form.password.helperText}</p>
              )}
              {errors.password && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-navy mb-2">
                {data.form.confirmPassword.label} <span className="text-status-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder={data.form.confirmPassword.placeholder}
                  className={`appearance-none relative block w-full px-3 py-2.5 pr-10 border ${
                    errors.confirmPassword ? 'border-status-danger/50' : 'border-brand-outline/40'
                  } placeholder-brand-text/40 text-brand-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text/50 hover:text-brand-navy transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-brand-navy mb-2">
                {data.form.fullName.label} <span className="text-status-danger">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={data.form.fullName.placeholder}
                className={`appearance-none relative block w-full px-3 py-2.5 border ${
                  errors.fullName ? 'border-status-danger/50' : 'border-brand-outline/40'
                } placeholder-brand-text/40 text-brand-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
              />
              {!errors.fullName && data.form.fullName.helperText && (
                <p className="mt-1.5 text-xs text-brand-text/60">{data.form.fullName.helperText}</p>
              )}
              {errors.fullName && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-navy mb-2">
                {data.form.email.label} <span className="text-status-danger">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={data.form.email.placeholder}
                className={`appearance-none relative block w-full px-3 py-2.5 border ${
                  errors.email ? 'border-status-danger/50' : 'border-brand-outline/40'
                } placeholder-brand-text/40 text-brand-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
              />
              {!errors.email && data.form.email.helperText && (
                <p className="mt-1.5 text-xs text-brand-text/60">{data.form.email.helperText}</p>
              )}
              {errors.email && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-brand-navy mb-2">
                {data.form.phoneNumber.label} <span className="text-status-danger">*</span>
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={data.form.phoneNumber.placeholder}
                className={`appearance-none relative block w-full px-3 py-2.5 border ${
                  errors.phoneNumber ? 'border-status-danger/50' : 'border-brand-outline/40'
                } placeholder-brand-text/40 text-brand-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
              />
              {!errors.phoneNumber && data.form.phoneNumber.helperText && (
                <p className="mt-1.5 text-xs text-brand-text/60">{data.form.phoneNumber.helperText}</p>
              )}
              {errors.phoneNumber && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Address Section Header */}
            <div className="border-t border-brand-outline/40 pt-5 mt-2">
              <h3 className="text-sm font-semibold text-brand-navy mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Địa chỉ
              </h3>
            </div>

            {/* Province */}
            <div>
              <label htmlFor="provinceCode" className="block text-sm font-medium text-brand-navy mb-2">
                Tỉnh/Thành phố <span className="text-status-danger">*</span>
              </label>
              <select
                id="provinceCode"
                name="provinceCode"
                required
                value={formData.provinceCode}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={loadingProvinces}
                className={`block w-full px-3 py-2.5 border ${
                  errors.provinceCode ? 'border-status-danger/50' : 'border-brand-outline/40'
                } bg-white text-brand-navy rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm disabled:bg-gray-100 disabled:cursor-wait`}
              >
                <option value="">
                  {loadingProvinces ? 'Đang tải...' : '-- Chọn Tỉnh/Thành phố --'}
                </option>
                {provinces.map(province => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
              {errors.provinceCode && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.provinceCode}
                </p>
              )}
            </div>

            {/* Commune/Ward */}
            <div>
              <label htmlFor="communeCode" className="block text-sm font-medium text-brand-navy mb-2">
                Phường/Xã <span className="text-status-danger">*</span>
              </label>
              <select
                id="communeCode"
                name="communeCode"
                required
                value={formData.communeCode}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={!formData.provinceCode || loadingCommunes}
                className={`block w-full px-3 py-2.5 border ${
                  errors.communeCode ? 'border-status-danger/50' : 'border-brand-outline/40'
                } bg-white text-brand-navy rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                <option value="">
                  {loadingCommunes ? 'Đang tải...' : !formData.provinceCode ? 'Vui lòng chọn Tỉnh/Thành phố trước' : '-- Chọn Phường/Xã --'}
                </option>
                {communes.map(commune => (
                  <option key={commune.code} value={commune.code}>
                    {commune.name}
                  </option>
                ))}
              </select>
              {errors.communeCode && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.communeCode}
                </p>
              )}
            </div>

            {/* Street Address */}
            <div>
              <label htmlFor="streetAddress" className="block text-sm font-medium text-brand-navy mb-2">
                Số nhà, Tên đường <span className="text-status-danger">*</span>
              </label>
              <input
                id="streetAddress"
                name="streetAddress"
                type="text"
                required
                value={formData.streetAddress}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Ví dụ: 123 Nguyễn Văn Cừ"
                className={`appearance-none relative block w-full px-3 py-2.5 border ${
                  errors.streetAddress ? 'border-status-danger/50' : 'border-brand-outline/40'
                } placeholder-brand-text/40 text-brand-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
              />
              <p className="mt-1.5 text-xs text-brand-text/60">Nhập số nhà và tên đường (không cần nhập Phường/Xã, Tỉnh/Thành phố)</p>
              {errors.streetAddress && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.streetAddress}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white transition-all duration-300 ${
                  loading 
                    ? 'bg-brand-text/40 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-brand-teal to-brand-navy hover:-translate-y-0.5 hover:shadow-lg'
                }`}
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? data.messages.registering : data.actions.register}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border-2 border-brand-outline/40 text-sm font-semibold rounded-xl text-brand-navy bg-white hover:bg-brand-background hover:border-brand-teal transition-all duration-300 disabled:opacity-50"
              >
                {data.actions.cancel}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-brand-outline/40">
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="text-sm text-brand-teal hover:text-brand-tealHover font-medium transition-colors"
              >
                {data.actions.login}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;