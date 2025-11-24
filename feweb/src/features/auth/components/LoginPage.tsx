import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import type { UserRole } from '../../../types/api';
import backgroundImage from '../../../assets/images/login-background-ae28bb.png';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { getRoles, login, isLoading, error } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [loginError, setLoginError] = useState<string>('');

  const handleGetRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setLoginError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setLoginError('');
      const roles = await getRoles(username, password);
      
      if (roles.length === 0) {
        setLoginError('Tài khoản không có vai trò nào được kích hoạt');
        return;
      }
      
      if (roles.length === 1) {
        // Auto login with single role
        const success = await login(username, password, roles[0]);
        if (success) {
          navigateBasedOnRole(roles[0]);
        }
      } else {
        // Show role selection modal
        setAvailableRoles(roles);
        setShowRoleSelection(true);
      }
    } catch (err: any) {
      // Hiển thị thông báo lỗi từ API theo đúng tài liệu
      const errorMessage = err?.message || 'Đăng nhập thất bại';
      setLoginError(errorMessage);
    }
  };

  const handleRoleSelection = async (role: UserRole) => {
    try {
      setLoginError('');
      const success = await login(username, password, role);
      if (success) {
        setShowRoleSelection(false);
        navigateBasedOnRole(role);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Đăng nhập thất bại');
    }
  };

  const navigateBasedOnRole = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        navigate('/admin/dashboard');
        break;
      case 'EMPLOYEE':
        navigate('/employee/dashboard');
        break;
      case 'CUSTOMER':
        navigate('/customer/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Desktop Layout - Exact Figma Design */}
      <div className="figma-frame">
        
        {/* Background Layer 1 - Orange overlay behind */}
        <div className="bg-layer-1" />
        
        {/* Background Layer 2 - Main background image */}
        <div 
          className="bg-layer-2"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        
        {/* Background Layer 3 - Orange overlay on top */}
        <div className="bg-layer-3" />

        {/* Login Form Group - Exact positioning */}
        <div className="login-form-group">
          
          {/* Greeting text */}
          <div className="greeting-text">
            Hello! Verified Driver
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            {/* Black background */}
            <div className="tab-bg-black" />
            
            {/* White active tab background */}
            <div className={`tab-bg-white ${activeTab === 'login' ? 'login-active' : 'register-active'}`} />
            
            {/* Login button */}
            <button
              onClick={() => setActiveTab('login')}
              className="tab-login"
            >
              Login
            </button>
            
            {/* Register button */}
            <button
              onClick={() => setActiveTab('register')}
              className="tab-register"
            >
              Register
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleGetRoles}>
            {/* Error message */}
            {(loginError || error) && (
              <div className="error-message" style={{
                color: '#ff4444',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '16px',
                padding: '8px',
                backgroundColor: '#ffe6e6',
                borderRadius: '4px'
              }}>
                {loginError || error}
              </div>
            )}
            {/* Username Field */}
            <div className="username-field">
              {/* Username Label */}
              <div className="field-label">
                Username
              </div>
              
              {/* Username Input */}
              <div className="field-input-container">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="field-input"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="password-field">
              {/* Password Label */}
              <div className="field-label">
                Password
              </div>
              
              {/* Password Input */}
              <div className="field-input-container" style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Changed Password"
                  className="field-input"
                  style={{ paddingRight: '60px' }}
                  required
                />
                
                {/* Eye icon */}
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="password-eye"
                >
                  <svg
                    width="25"
                    height="20"
                    viewBox="0 0 25 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.5 0C7.5 0 3.23 3.11 1.5 7.5C3.23 11.89 7.5 15 12.5 15C17.5 15 21.77 11.89 23.5 7.5C21.77 3.11 17.5 0 12.5 0ZM12.5 12.5C10.02 12.5 8 10.48 8 8C8 5.52 10.02 3.5 12.5 3.5C14.98 3.5 17 5.52 17 8C17 10.48 14.98 12.5 12.5 12.5ZM12.5 5.5C11.12 5.5 10 6.62 10 8C10 9.38 11.12 10.5 12.5 10.5C13.88 10.5 15 9.38 15 8C15 6.62 13.88 5.5 12.5 5.5Z"
                      fill="#D4D3D3"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Terms text */}
            <div className="terms-text">
              By signing up you agree to terms and conditions 
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#cccccc' : undefined,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Đang xử lý...' : 'Login'}
            </button>
          </form>

          {/* Forgot password */}
          <button
            type="button"
            className="forgot-password"
          >
            Forgor password ?
          </button>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="mobile-login">
        {/* Mobile background */}
        <div 
          className="mobile-bg"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="mobile-bg-overlay" />
        
        {/* Mobile content */}
        <div className="mobile-content">
          <div className="mobile-greeting">
            Hello! Verified Driver
          </div>
          
          {/* Mobile tab nav */}
          <div className="mobile-tab-nav">
            <div className={`mobile-tab-bg ${activeTab}`} />
            <div className="mobile-tab-buttons">
              <button
                onClick={() => setActiveTab('login')}
                className="mobile-tab-btn"
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className="mobile-tab-btn"
              >
                Register
              </button>
            </div>
          </div>
          
          {/* Mobile form */}
          <form onSubmit={handleGetRoles}>
            <div className="mobile-form-group">
              <label className="mobile-label">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="mobile-input"
                required
              />
            </div>
            
            <div className="mobile-form-group">
              <label className="mobile-label">Password</label>
              <div className="mobile-password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Changed Password"
                  className="mobile-input"
                  style={{ paddingRight: '50px' }}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="mobile-password-eye"
                >
                  <svg width="25" height="20" viewBox="0 0 25 20" fill="none">
                    <path d="M12.5 0C7.5 0 3.23 3.11 1.5 7.5C3.23 11.89 7.5 15 12.5 15C17.5 15 21.77 11.89 23.5 7.5C21.77 3.11 17.5 0 12.5 0ZM12.5 12.5C10.02 12.5 8 10.48 8 8C8 5.52 10.02 3.5 12.5 3.5C14.98 3.5 17 5.52 17 8C17 10.48 14.98 12.5 12.5 12.5ZM12.5 5.5C11.12 5.5 10 6.62 10 8C10 9.38 11.12 10.5 12.5 10.5C13.88 10.5 15 9.38 15 8C15 6.62 13.88 5.5 12.5 5.5Z" fill="#D4D3D3"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="mobile-terms">
              By signing up you agree to terms and conditions
            </div>
            
            <button
              type="submit"
              className="mobile-submit"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : 'Login'}
            </button>
          </form>
          
          <div className="mobile-forgot">
            <button type="button">
              Forgor password ?
            </button>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleSelection && (
        <div className="role-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="role-modal" style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '300px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>
              Chọn vai trò đăng nhập
            </h3>
            <div className="role-buttons">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelection(role)}
                  disabled={isLoading}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '12px',
                    margin: '8px 0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {role === 'ADMIN' ? 'Quản trị viên' : 
                   role === 'EMPLOYEE' ? 'Nhân viên' : 'Khách hàng'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowRoleSelection(false)}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;