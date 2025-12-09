import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, X, Mail, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { forgotPasswordRequestApi, resetPasswordApi } from '../api/auth';
import type { UserRole } from '../types';

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, getRoles, isAuthenticated, isInitialized } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register' | 'selectRole'>(
    user && user.roles.length > 1 ? 'selectRole' : initialMode
  );
  
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
    userType: 'customer' as UserRole
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'otp' | 'success'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  
  // Countdown timer for OTP expiration
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated && user && !isRedirecting) {
      console.log(`✅ User already authenticated, redirecting to dashboard for role: ${user.role}`);
      setIsRedirecting(true);
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'EMPLOYEE':
          navigate('/employee/dashboard', { replace: true });
          break;
        case 'CUSTOMER':
        default:
          navigate('/customer/dashboard', { replace: true });
          break;
      }
    }
  }, [isInitialized, isAuthenticated, user, navigate, isRedirecting]);

  // Cập nhật availableRoles khi chuyển sang chế độ chọn vai trò
  useEffect(() => {
    console.log(`🔍 [DEBUG] useEffect chạy với mode=${mode}, availableRoles.length=${availableRoles.length}`);
    
    if (mode === 'selectRole' && availableRoles.length === 0) {
      // Lấy roles từ localStorage (đã lưu trong AuthContext)
      const storedUsername = localStorage.getItem('temp_username');
      const storedPassword = localStorage.getItem('temp_password');
      
      console.log(`🔍 [DEBUG] Stored credentials: username=${!!storedUsername}, password=${!!storedPassword}`);
      
      if (storedUsername && storedPassword) {
        console.log(`🔍 [DEBUG] Đang lấy vai trò từ localStorage trong useEffect`);
        getRoles(storedUsername, storedPassword)
          .then(roles => {
            console.log(`🔍 [DEBUG] Vai trò từ localStorage:`, roles);
            setAvailableRoles(roles);
          })
          .catch(err => console.error('❌ [DEBUG] Lỗi khi lấy vai trò:', err));
      }
    }
  }, [mode, availableRoles.length, getRoles]);

  // Đặt lại availableRoles khi quay lại màn hình đăng nhập
  useEffect(() => {
    if (mode === 'login') {
      setAvailableRoles([]);
    }
  }, [mode]);

  // ============= Forgot Password Handlers =============
  // IMPORTANT: All hooks must be called before any early returns (Rules of Hooks)
  const handleOpenForgotPassword = useCallback(() => {
    setShowForgotPassword(true);
    setForgotPasswordStep('email');
    setForgotEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    setCountdown(0);
    setCooldown(0);
  }, []);

  const handleCloseForgotPassword = useCallback(() => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setForgotEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotPasswordError('');
    setForgotPasswordSuccess('');
    setCountdown(0);
    setCooldown(0);
  }, []);

  // Show loading while checking authentication status or redirecting
  if (!isInitialized || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-teal border-t-transparent mx-auto"></div>
          <p className="mt-4 text-brand-navy font-medium">Đang kiểm tra trạng thái đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Don't render auth form if user is authenticated (safety check)
  if (isAuthenticated && user) {
    return null; // Component will redirect in useEffect above
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Get available roles
      console.log(`🔍 [DEBUG] Đang lấy vai trò cho username: ${formData.username}`);
      const roles = await getRoles(formData.username, formData.password);
      
      console.log(`🔍 [DEBUG] Các vai trò nhận được:`, roles);
      
      if (roles && roles.length > 0) {
        setAvailableRoles(roles);
        console.log(`🔍 [DEBUG] Đã lưu vào availableRoles:`, roles);
        
        if (roles.length === 1) {
          // Auto login with single role
          console.log(`🔍 [DEBUG] Đăng nhập tự động với vai trò duy nhất: ${roles[0]}`);
          const loginResult = await login(formData.username, formData.password, roles[0]);
          
          // Kiểm tra nếu cần xác thực email
          if (loginResult.requireEmailVerification && loginResult.email) {
            console.log(`⚠️ [DEBUG] Cần xác thực email: ${loginResult.email}`);
            navigate('/verify-email', { 
              state: { 
                email: loginResult.email, 
                fromLogin: true 
              } 
            });
            return;
          }
          
          if (loginResult.success) {
            // Navigate based on role
            const role = roles[0];
            switch (role) {
              case 'ADMIN':
                navigate('/admin/dashboard');
                break;
              case 'EMPLOYEE':
                navigate('/employee/dashboard');
                break;
              case 'CUSTOMER':
              default:
                navigate('/customer/dashboard');
                break;
            }
          } else if (loginResult.error) {
            setError(loginResult.error);
          }
        } else {
          // Multiple roles - show role selection
          console.log(`🔍 [DEBUG] Nhiều vai trò, chuyển sang màn hình chọn vai trò`);
          setMode('selectRole');
        }
      } else {
        setError('Không tìm thấy vai trò nào');
      }
    } catch (err: any) {
      console.error('❌ [DEBUG] Lỗi đăng nhập:', err);
      // Hiển thị thông báo lỗi từ API theo đúng tài liệu
      const errorMessage = err?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 8) {
      setError('Mật khẩu phải ít nhất 8 ký tự');
      return;
    }

    // Simulate registration
    alert('Đăng ký thành công! Vui lòng đăng nhập.');
    setMode('login');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordLoading(true);

    try {
      const response = await forgotPasswordRequestApi({ email: forgotEmail });
      if (response.success) {
        setForgotPasswordSuccess(response.message);
        setForgotPasswordStep('otp');
        setCountdown(response.expirationSeconds || 180);
        setCooldown(response.cooldownSeconds || 60);
      } else {
        setForgotPasswordError(response.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi OTP';
      setForgotPasswordError(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    
    setForgotPasswordError('');
    setForgotPasswordLoading(true);

    try {
      const response = await forgotPasswordRequestApi({ email: forgotEmail });
      if (response.success) {
        setForgotPasswordSuccess('Mã OTP mới đã được gửi');
        setCountdown(response.expirationSeconds || 180);
        setCooldown(response.cooldownSeconds || 60);
        setOtp('');
      } else {
        setForgotPasswordError(response.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi lại OTP';
      setForgotPasswordError(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');

    if (newPassword !== confirmNewPassword) {
      setForgotPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setForgotPasswordError('Mật khẩu phải ít nhất 6 ký tự');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const response = await resetPasswordApi({
        email: forgotEmail,
        otp: otp,
        newPassword: newPassword
      });
      
      if (response.success) {
        setForgotPasswordStep('success');
        setForgotPasswordSuccess(response.message);
        // Tự động đóng modal sau 3 giây
        setTimeout(() => {
          handleCloseForgotPassword();
        }, 3000);
      } else {
        setForgotPasswordError(response.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu';
      setForgotPasswordError(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleRoleSelection = async (role: UserRole) => {
    try {
      const loginResult = await login(formData.username, formData.password, role);
      
      // Kiểm tra nếu cần xác thực email
      if (loginResult.requireEmailVerification && loginResult.email) {
        console.log(`⚠️ [DEBUG] Cần xác thực email: ${loginResult.email}`);
        navigate('/verify-email', { 
          state: { 
            email: loginResult.email, 
            fromLogin: true 
          } 
        });
        return;
      }
      
      if (loginResult.success) {
        switch (role) {
          case 'ADMIN':
            navigate('/admin/dashboard');
            break;
          case 'EMPLOYEE':
            navigate('/employee/dashboard');
            break;
          case 'CUSTOMER':
          default:
            navigate('/customer/dashboard');
            break;
        }
      } else if (loginResult.error) {
        setError(loginResult.error);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi đăng nhập.');
    }
  };

  if (mode === 'selectRole') {
    console.log(`🔍 [DEBUG] Trong màn hình chọn vai trò`);
    console.log(`🔍 [DEBUG] availableRoles:`, availableRoles);
    console.log(`🔍 [DEBUG] user?.roles:`, user?.roles);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-elevation-sm border border-brand-outline/40 p-5 sm:p-8 w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-brand-teal/10 mb-3 sm:mb-4">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-2">Chọn vai trò</h2>
            <p className="text-sm sm:text-base text-brand-text/70">Bạn có nhiều vai trò, hãy chọn vai trò để tiếp tục</p>
          </div>

          <div className="space-y-3">
            {availableRoles.length > 0 ? (
              // Trường hợp có vai trò từ API, hiển thị từ availableRoles
              availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelection(role)}
                  className="w-full p-3 sm:p-4 border-2 border-brand-outline/40 rounded-xl sm:rounded-2xl hover:border-brand-teal hover:bg-brand-teal/5 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-brand-navy group-hover:text-brand-teal transition-colors">
                        {role === 'CUSTOMER' && 'Khách hàng'}
                        {role === 'EMPLOYEE' && 'Nhân viên giúp việc'}
                        {role === 'ADMIN' && 'Quản trị viên'}
                      </h3>
                      <p className="text-xs sm:text-sm text-brand-text/60 mt-0.5 sm:mt-1">
                        {role === 'CUSTOMER' && 'Đặt dịch vụ giúp việc'}
                        {role === 'EMPLOYEE' && 'Nhận việc và cung cấp dịch vụ'}
                        {role === 'ADMIN' && 'Quản lý hệ thống'}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-brand-teal opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-brand-text/60">
                <svg className="w-12 h-12 mx-auto mb-3 text-brand-text/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Không tìm thấy vai trò nào.</p>
                <button 
                  onClick={() => setMode('login')}
                  className="mt-4 text-brand-teal hover:text-brand-tealHover font-medium transition-colors"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between items-center pt-6 border-t border-brand-outline/40">
            <Link
              to="/"
              className="flex items-center text-brand-teal hover:text-brand-tealHover font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về trang chủ
            </Link>
            
            <button
              onClick={() => {
                localStorage.removeItem('temp_username');
                localStorage.removeItem('temp_password');
                setMode('login');
                setAvailableRoles([]);
              }}
              className="text-brand-teal hover:text-brand-tealHover font-medium transition-colors"
            >
              Đăng nhập lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-elevation-sm border border-brand-outline/40 p-5 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-block mb-3 sm:mb-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-brand-teal to-brand-navy bg-clip-text text-transparent">Home Mate</h1>
            </div>
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-1 sm:mb-2">
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </h2>
          <p className="text-brand-text/70">
            {mode === 'login' 
              ? 'Chào mừng bạn trở lại!'
              : 'Tạo tài khoản mới để bắt đầu'
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/30 text-status-danger rounded-2xl flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
                  placeholder="Nhập email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">
                  Loại tài khoản *
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
                  required
                >
                  <option value="customer">Khách hàng</option>
                  <option value="employee">Nhân viên giúp việc</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-2">
              Tên đăng nhập *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-2">
              Mật khẩu *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent pr-12 transition-all"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-text/50 hover:text-brand-navy transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-2">
                Xác nhận mật khẩu *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent pr-12 transition-all"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-text/50 hover:text-brand-navy transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleOpenForgotPassword}
                className="text-sm text-brand-teal hover:text-brand-tealHover font-medium transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand-teal to-brand-navy text-white py-3 rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </span>
            ) : (mode === 'login' ? 'Đăng nhập' : 'Đăng ký')}
          </button>

          <div className="text-center">
            <span className="text-brand-text/70">
              {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            </span>
            <Link
              to={mode === 'login' ? '/register' : '/auth'}
              className="ml-2 text-brand-teal hover:text-brand-tealHover font-medium transition-colors"
            >
              {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
            </Link>
          </div>

          <div className="text-center pt-4 border-t border-brand-outline/40">
            <Link
              to="/"
              className="flex items-center justify-center text-brand-teal hover:text-brand-tealHover font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về trang chủ
            </Link>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 relative animate-in fade-in zoom-in duration-200 my-auto">
            {/* Close Button */}
            <button
              onClick={handleCloseForgotPassword}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Step: Email Input */}
            {forgotPasswordStep === 'email' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-brand-teal" />
                  </div>
                  <h2 className="text-xl font-bold text-brand-navy">Quên mật khẩu?</h2>
                  <p className="text-brand-text/70 mt-2 text-sm">
                    Nhập email đã đăng ký để nhận mã OTP khôi phục mật khẩu
                  </p>
                </div>

                {forgotPasswordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{forgotPasswordError}</span>
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-navy mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all"
                      placeholder="Nhập email của bạn"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotPasswordLoading || !forgotEmail}
                    className="w-full bg-gradient-to-r from-brand-teal to-brand-navy text-white py-3 rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {forgotPasswordLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang gửi...
                      </span>
                    ) : 'Gửi mã OTP'}
                  </button>
                </form>
              </>
            )}

            {/* Step: OTP & New Password */}
            {forgotPasswordStep === 'otp' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8 text-brand-teal" />
                  </div>
                  <h2 className="text-xl font-bold text-brand-navy">Nhập mã OTP</h2>
                  <p className="text-brand-text/70 mt-2 text-sm">
                    Mã OTP đã được gửi đến <span className="font-medium text-brand-navy">{forgotEmail}</span>
                  </p>
                  {countdown > 0 && (
                    <p className="text-brand-teal font-medium mt-2">
                      Mã hết hạn sau: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                  {countdown === 0 && forgotPasswordStep === 'otp' && (
                    <p className="text-red-500 font-medium mt-2">
                      Mã OTP đã hết hạn, vui lòng gửi lại
                    </p>
                  )}
                </div>

                {forgotPasswordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">{forgotPasswordError}</span>
                  </div>
                )}

                {forgotPasswordSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-600">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{forgotPasswordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-navy mb-2">
                      Mã OTP (6 chữ số)
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all text-center text-2xl tracking-widest font-mono"
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-navy mb-2">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent pr-12 transition-all"
                        placeholder="Nhập mật khẩu mới"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-text/50 hover:text-brand-navy transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-navy mb-2">
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full p-3 border border-brand-outline/40 rounded-xl focus:ring-2 focus:ring-brand-teal focus:border-transparent pr-12 transition-all"
                        placeholder="Nhập lại mật khẩu mới"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-text/50 hover:text-brand-navy transition-colors"
                      >
                        {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotPasswordLoading || otp.length !== 6 || !newPassword || !confirmNewPassword}
                    className="w-full bg-gradient-to-r from-brand-teal to-brand-navy text-white py-3 rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {forgotPasswordLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : 'Đặt lại mật khẩu'}
                  </button>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordStep('email')}
                      className="text-sm text-brand-text/70 hover:text-brand-navy transition-colors"
                    >
                      ← Đổi email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={cooldown > 0 || forgotPasswordLoading}
                      className="flex items-center gap-1 text-sm text-brand-teal hover:text-brand-tealHover font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {cooldown > 0 ? `Gửi lại (${cooldown}s)` : 'Gửi lại OTP'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step: Success */}
            {forgotPasswordStep === 'success' && (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-brand-navy mb-2">Thành công!</h2>
                <p className="text-brand-text/70 mb-4">
                  {forgotPasswordSuccess || 'Mật khẩu của bạn đã được đặt lại thành công'}
                </p>
                <p className="text-sm text-brand-text/50">
                  Đang chuyển hướng về trang đăng nhập...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;