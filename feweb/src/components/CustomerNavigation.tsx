import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Home, Calendar, CreditCard, User, Menu, LogOut, X, MessageSquare } from 'lucide-react';

interface CustomerNavigationProps {
  className?: string;
}

const CustomerNavigation: React.FC<CustomerNavigationProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, selectedRole, logout } = useAuth();
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Menu cho customer
  const menuItems = [
    { path: '/customer/dashboard', label: 'Trang chủ', icon: <Home className="w-5 h-5" /> },
    { path: '/customer/bookings', label: 'Đặt lịch', icon: <Calendar className="w-5 h-5" /> },
    { path: '/customer/orders', label: 'Đơn hàng', icon: <CreditCard className="w-5 h-5" /> },
    { path: '/customer/chat', label: 'Nhắn tin', icon: <MessageSquare className="w-5 h-5" /> },
    { path: '/customer/profile', label: 'Hồ sơ', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className={`${className}`}>
      {/* Mobile menu toggle */}
      <button 
        className="lg:hidden fixed top-4 right-4 z-50 bg-primary text-white p-2 rounded-full shadow-lg"
        onClick={toggleMenu}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile navigation */}
      <div 
        className={`fixed inset-0 bg-white z-40 transition-transform duration-300 lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="font-bold text-xl text-primary">Thành Thật</div>
            <button onClick={toggleMenu}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 py-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{user?.fullName || 'Khách'}</div>
                  <div className="text-sm text-gray-500">{selectedRole || 'Chưa đăng nhập'}</div>
                </div>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {user && (
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 text-red-500 w-full px-3 py-3 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop navigation */}
      <div className="hidden lg:flex flex-col h-full border-r bg-white shadow-sm">
        <div className="p-4 border-b">
          <div className="font-bold text-xl text-primary">Thành Thật</div>
        </div>

        <div className="flex-1 py-6 px-4">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-3">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-500" />
              )}
            </div>
            <div className="text-center">
              <div className="font-medium text-lg">{user?.fullName || 'Khách'}</div>
              <div className="text-sm text-gray-500">{selectedRole || 'CUSTOMER'}</div>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {user && (
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 text-red-500 w-full px-3 py-3 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Đăng xuất</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerNavigation;