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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {data.title}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {data.subtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                {data.form.username.label} <span className="text-red-500">*</span>
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
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {data.form.password.label} <span className="text-red-500">*</span>
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
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {data.form.confirmPassword.label} <span className="text-red-500">*</span>
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
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                {data.form.fullName.label} <span className="text-red-500">*</span>
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
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.fullName ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {data.form.email.label} <span className="text-red-500">*</span>
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
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                {data.form.phoneNumber.label} <span className="text-red-500">*</span>
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
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                {data.form.role.label} <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors.role ? 'border-red-300' : 'border-gray-300'
                } bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              >
                <option value="">-- Chọn loại tài khoản --</option>
                <option value="CUSTOMER">{data.form.role.options.CUSTOMER}</option>
                <option value="EMPLOYEE">{data.form.role.options.EMPLOYEE}</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {loading ? data.messages.registering : data.actions.register}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {data.actions.cancel}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="text-sm text-indigo-600 hover:text-indigo-500"
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