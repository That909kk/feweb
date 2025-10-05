import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, getRoles, isAuthenticated, isInitialized } = useAuth();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      console.log(`✅ User already authenticated, redirecting to dashboard for role: ${user.role}`);
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
  }, [isInitialized, isAuthenticated, user, navigate]);

  // Show loading while checking authentication status
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang kiểm tra trạng thái đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Don't render auth form if user is authenticated
  if (isAuthenticated && user) {
    return null; // Component will redirect in useEffect above
  }
  
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register' | 'selectRole'>(
    user && user.roles.length > 1 ? 'selectRole' : initialMode
  );
  
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  
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

  // Đặt lại availableRoles khi quay lại màn hình đăng nhập
  useEffect(() => {
    if (mode === 'login') {
      setAvailableRoles([]);
    }
  }, [mode]);

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
          const success = await login(formData.username, formData.password, roles[0]);
          if (success) {
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
          }
        } else {
          // Multiple roles - show role selection
          console.log(`🔍 [DEBUG] Nhiều vai trò, chuyển sang màn hình chọn vai trò`);
          setMode('selectRole');
        }
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (err) {
      console.error('❌ [DEBUG] Lỗi đăng nhập:', err);
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
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

  const handleRoleSelection = async (role: UserRole) => {
    try {
      const success = await login(formData.username, formData.password, role);
      if (success) {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chọn vai trò</h2>
            <p className="text-gray-600">Bạn có nhiều vai trò, hãy chọn vai trò để tiếp tục</p>
          </div>

          <div className="space-y-4">
            {availableRoles.length > 0 ? (
              // Trường hợp có vai trò từ API, hiển thị từ availableRoles
              availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelection(role)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-semibold text-gray-900">
                    {role === 'CUSTOMER' && 'Khách hàng'}
                    {role === 'EMPLOYEE' && 'Nhân viên giúp việc'}
                    {role === 'ADMIN' && 'Quản trị viên'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {role === 'CUSTOMER' && 'Đặt dịch vụ giúp việc'}
                    {role === 'EMPLOYEE' && 'Nhận việc và cung cấp dịch vụ'}
                    {role === 'ADMIN' && 'Quản lý hệ thống'}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Không tìm thấy vai trò nào.</p>
                <button 
                  onClick={() => setMode('login')}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-between">
            <Link
              to="/"
              className="flex items-center text-blue-600 hover:text-blue-800"
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
              className="text-blue-600 hover:text-blue-800"
            >
              Đăng nhập lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <h1 className="text-2xl font-bold text-blue-600">HomeHelper</h1>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </h2>
          <p className="text-gray-600">
            {mode === 'login' 
              ? 'Chào mừng bạn trở lại!'
              : 'Tạo tài khoản mới để bắt đầu'
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại tài khoản *
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="customer">Khách hàng</option>
                  <option value="employee">Nhân viên giúp việc</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đăng nhập *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên đăng nhập"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Nhập mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Quên mật khẩu?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập' : 'Đăng ký')}
          </button>

          <div className="text-center">
            <span className="text-gray-600">
              {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
            </span>
            <Link
              to="/register"
              className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Đăng ký
            </Link>
          </div>

          <div className="text-center pt-4 border-t">
            <Link
              to="/"
              className="flex items-center justify-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Về trang chủ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;