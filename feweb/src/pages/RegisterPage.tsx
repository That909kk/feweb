import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import registerData from '../static-data/pages/register.json';
import { useRegister } from '../hooks/useRegister';
import Notification from '../shared/components/Notification';
import type { RegisterRequest, UserRole } from '../types/api';

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole | '';
}

interface FormErrors {
  [key: string]: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, error: hookError, clearError } = useRegister();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    role: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      const registerRequest: RegisterRequest = {
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role as UserRole
      };

      const response = await register(registerRequest);
      
      if (response.success) {
        setSuccessMessage(data.messages.registerSuccess);
        setTimeout(() => {
          navigate('/auth', { state: { tab: 'login' } });
        }, 2000);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-teal to-brand-navy bg-clip-text text-transparent">Home Mate</h1>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-brand-navy">
          {data.title}
        </h2>
        <p className="mt-2 text-center text-sm text-brand-text/70">
          {data.subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-sm py-8 px-4 shadow-elevation-sm border border-brand-outline/40 sm:rounded-3xl sm:px-10">
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
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={data.form.password.placeholder}
                className={`appearance-none relative block w-full px-3 py-2.5 border ${
                  errors.password ? 'border-status-danger/50' : 'border-brand-outline/40'
                } placeholder-brand-text/40 text-brand-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
              />
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
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={data.form.confirmPassword.placeholder}
                className={`appearance-none relative block w-full px-3 py-2.5 border ${
                  errors.confirmPassword ? 'border-status-danger/50' : 'border-brand-outline/40'
                } placeholder-brand-text/40 text-brand-navy rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all sm:text-sm`}
              />
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
              {errors.phoneNumber && (
                <p className="mt-1.5 text-sm text-status-danger flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Role */}
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