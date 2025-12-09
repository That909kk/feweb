import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import emailOtpData from '../static-data/pages/email-otp-verification.json';
import { useEmailOtp } from '../hooks/useEmailOtp';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../shared/components/Notification';

interface LocationState {
  email?: string;
  fromRegister?: boolean;
  fromLogin?: boolean;
}

const EmailOtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const state = location.state as LocationState | null;
  
  const email = state?.email || '';
  const fromRegister = state?.fromRegister || false;
  const fromLogin = state?.fromLogin || false;
  
  const {
    loading,
    error,
    successMessage,
    cooldownSeconds,
    expirationSeconds,
    canResend,
    sendOtp,
    verifyOtp,
    checkCooldown,
    clearError,
    clearSuccessMessage
  } = useEmailOtp();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const data = emailOtpData.vi; // Có thể thay đổi theo ngôn ngữ người dùng

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      // Nếu từ login thì chuyển về login, nếu từ register thì chuyển về register
      navigate('/auth', { state: { tab: fromLogin ? 'login' : 'register' } });
    }
  }, [email, navigate, fromLogin]);

  // Send OTP on mount
  useEffect(() => {
    if (email && !isOtpSent) {
      sendOtp(email)
        .then(() => {
          setIsOtpSent(true);
        })
        .catch((err) => {
          console.error('Failed to send initial OTP:', err);
          console.error('Error response:', err.response?.data);
          // Vẫn đánh dấu là đã cố gửi để không gửi lại liên tục
          setIsOtpSent(true);
          // Nếu lỗi 429 hoặc 400 (có thể do cooldown), kiểm tra thời gian còn lại
          if (err.response?.status === 429 || err.response?.status === 400) {
            checkCooldown(email);
          }
        });
    }
  }, [email, sendOtp, isOtpSent, checkCooldown]);

  // Redirect after successful verification - xử lý khác nhau cho login và register
  useEffect(() => {
    if (isVerified) {
      const timer = setTimeout(() => {
        // Clear pending verification data
        localStorage.removeItem('pendingEmailVerification');
        localStorage.removeItem('pendingVerificationEmail');
        
        if (fromLogin) {
          // Nếu từ login, sau khi verify thành công cần login lại
          // Vì token cũ đã được lưu tạm, cần clear và yêu cầu đăng nhập lại
          logout();
          navigate('/auth', { 
            state: { 
              tab: 'login',
              message: 'Xác thực email thành công! Vui lòng đăng nhập lại.'
            } 
          });
        } else {
          // Từ register thì chuyển về login như cũ
          navigate('/auth', { state: { tab: 'login' } });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVerified, navigate, fromLogin, logout]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setOtpError('');
    clearError();
    
    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down for backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    // Focus last filled input or next empty one
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // Validate OTP
  const validateOtp = (): boolean => {
    const { validationErrors } = data.messages;
    const otpString = otp.join('');
    
    if (!otpString) {
      setOtpError(validationErrors.otpRequired);
      return false;
    }
    
    if (otpString.length !== 6) {
      setOtpError(validationErrors.otpLength);
      return false;
    }
    
    if (!/^\d{6}$/.test(otpString)) {
      setOtpError(validationErrors.otpFormat);
      return false;
    }
    
    return true;
  };

  // Handle verify
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateOtp()) return;
    
    try {
      const otpString = otp.join('');
      const response = await verifyOtp(email, otpString);
      
      if (response.success) {
        setIsVerified(true);
      }
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (!canResend || loading) return;
    
    try {
      await sendOtp(email);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Failed to resend OTP:', err);
    }
  };

  // Handle back/cancel navigation - logout nếu từ login
  const handleBack = async () => {
    if (fromLogin) {
      // Nếu từ login mà bấm back/cancel thì cần logout và quay về login
      localStorage.removeItem('pendingEmailVerification');
      localStorage.removeItem('pendingVerificationEmail');
      await logout();
      navigate('/auth', { state: { tab: 'login' } });
    } else if (fromRegister) {
      navigate('/auth', { state: { tab: 'register' } });
    } else {
      navigate(-1);
    }
  };

  // Handle skip - chỉ cho phép từ register, từ login thì phải verify hoặc logout
  const handleSkip = async () => {
    if (fromLogin) {
      // Nếu từ login mà skip thì cần logout
      localStorage.removeItem('pendingEmailVerification');
      localStorage.removeItem('pendingVerificationEmail');
      await logout();
      navigate('/auth', { state: { tab: 'login' } });
    } else {
      navigate('/auth', { state: { tab: 'login' } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo & Title */}
        <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
          {/* Email display */}
          <div className="text-center mb-6">
            <p className="text-sm text-brand-text/70">{data.emailSentTo}</p>
            <p className="text-brand-navy font-semibold mt-1">{email}</p>
          </div>

          {/* Success Message - Xác thực thành công */}
          {isVerified && (
            <div className="mb-4">
              <Notification
                type="success"
                message={data.messages.verifySuccess}
              />
              <p className="text-center text-sm text-brand-text/70 mt-2">
                {data.messages.redirecting}
              </p>
            </div>
          )}

          {/* Success Message - Gửi OTP thành công (chỉ hiển thị khi chưa xác thực) */}
          {successMessage && !isVerified && (
            <div className="mb-4">
              <Notification
                type="success"
                message={successMessage}
                onClose={clearSuccessMessage}
              />
            </div>
          )}

          {/* Error Message */}
          {(error || otpError) && !isVerified && (
            <div className="mb-4">
              <Notification
                type="error"
                message={otpError || error || ''}
                onClose={() => {
                  setOtpError('');
                  clearError();
                }}
              />
            </div>
          )}

          {/* Expiration Timer */}
          {expirationSeconds > 0 && !isVerified && (
            <div className="text-center mb-4">
              <p className="text-sm text-brand-text/70">
                {data.timer.expires}{' '}
                <span className={`font-semibold ${expirationSeconds <= 30 ? 'text-status-danger' : 'text-brand-teal'}`}>
                  {formatTime(expirationSeconds)}
                </span>
              </p>
            </div>
          )}

          {expirationSeconds === 0 && isOtpSent && !isVerified && !loading && (
            <div className="text-center mb-4">
              <p className="text-sm text-status-danger font-medium">
                {data.timer.expired}
              </p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-brand-navy mb-3 text-center">
                {data.form.otp.label}
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={loading || isVerified}
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border ${
                      otpError || error ? 'border-status-danger/50' : 'border-brand-outline/40'
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || isVerified || otp.join('').length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-teal to-brand-navy hover:from-brand-teal/90 hover:to-brand-navy/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{data.messages.verifying}</span>
                </div>
              ) : (
                data.actions.verify
              )}
            </button>

            {/* Resend Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend || loading || isVerified}
                className={`text-sm font-medium transition-colors ${
                  canResend && !loading && !isVerified
                    ? 'text-brand-teal hover:text-brand-teal/80 cursor-pointer'
                    : 'text-brand-text/40 cursor-not-allowed'
                }`}
              >
                {cooldownSeconds > 0 ? (
                  <span>
                    {data.actions.resendIn} {cooldownSeconds}s
                  </span>
                ) : (
                  data.actions.resend
                )}
              </button>
            </div>

            {/* Skip & Back Buttons */}
            <div className="text-center pt-4 border-t border-brand-outline/40 space-y-2">
              {fromLogin ? (
                // Nếu từ login, hiển thị thông báo yêu cầu xác thực
                <>
                  <p className="text-sm text-status-warning font-medium mb-2">
                    ⚠️ Bạn cần xác thực email để tiếp tục sử dụng hệ thống
                  </p>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-sm font-medium text-status-danger hover:text-status-danger/80 transition-colors"
                  >
                    Hủy và quay lại đăng nhập
                  </button>
                </>
              ) : (
                // Nếu từ register, cho phép skip
                <>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-sm font-medium text-brand-teal hover:text-brand-teal/80 transition-colors"
                  >
                    {data.actions.skip} →
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={handleBack}
                      className="text-sm font-medium text-brand-text/70 hover:text-brand-navy transition-colors"
                    >
                      ← {data.actions.back}
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmailOtpVerificationPage;
