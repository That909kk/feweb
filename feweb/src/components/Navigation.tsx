import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../shared/components/Button';

interface NavItem {
  label: string;
  path: string;
  roles: string[];
}

interface NavigationProps {
  userRole?: string; // Optional userRole prop for backward compatibility
}

const Navigation: React.FC<NavigationProps> = ({ userRole }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    // Use the logout function from AuthContext which calls the /api/v1/auth/logout API
    await logout();
    navigate('/auth');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems: NavItem[] = [
    // Customer routes
    { label: 'Đặt lịch', path: '/customer/booking', roles: ['CUSTOMER'] },
    { label: 'Đơn hàng', path: '/customer/orders', roles: ['CUSTOMER'] },
    { label: 'Hỗ trợ', path: '/customer/chat', roles: ['CUSTOMER'] },
    { label: 'Hồ sơ', path: '/customer/profile', roles: ['CUSTOMER'] },
    
    // Employee routes
    { label: 'Lịch làm việc', path: '/employee/schedule', roles: ['EMPLOYEE'] },
    { label: 'Yêu cầu', path: '/employee/requests', roles: ['EMPLOYEE'] },
    { label: 'Hồ sơ', path: '/employee/profile', roles: ['EMPLOYEE'] },
    
    // Admin routes
    { label: 'Quản lý đặt lịch', path: '/admin/bookings', roles: ['ADMIN'] },
    { label: 'Quản lý nội dung', path: '/admin/content', roles: ['ADMIN'] },
    { label: 'Quản lý người dùng', path: '/admin/users', roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter(item => {
    // If userRole prop is provided, use it; otherwise use the role from auth context
    const currentRole = userRole || user?.role;
    
    if (!currentRole) {
      // If no role available, only show items that don't require auth
      return item.roles.includes('GUEST');
    }
    // Otherwise, filter based on the role
    return item.roles.includes(currentRole);
  });

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-teal-500 text-white w-full shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          {/* Logo that redirects to appropriate dashboard based on user role */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => {
              if (isAuthenticated && user?.role) {
                switch (user.role) {
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
              } else {
                navigate('/');
              }
            }}
          >
            <div className="mr-2">
              <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-2xl font-bold font-poppins tracking-wide">
              <span className="text-white">Home</span>
              <span className="text-yellow-300">Service</span>
            </div>
          </div>
          
          {/* Mobile menu button */}
          {isMobile && (
            <button 
              onClick={toggleMenu}
              className="p-2 focus:outline-none hover:bg-teal-700 rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          )}
          
          {/* Desktop navigation */}
          {!isMobile && (
            <div className="flex items-center space-x-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-md font-medium hover:bg-teal-700 hover:text-yellow-300 transition-colors ${
                    location.pathname === item.path 
                      ? 'bg-teal-700 text-yellow-300 font-semibold' 
                      : 'text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <Button 
                  onClick={handleLogout}
                  className="ml-4 bg-red-500 hover:bg-red-600 shadow-sm"
                >
                  Đăng xuất
                </Button>
              ) : (
                <Link to="/auth">
                  <Button className="ml-4 shadow-sm border border-yellow-400 hover:border-yellow-300">Đăng nhập</Button>
                </Link>
              )}
            </div>
          )}
        </div>
        
        {/* Mobile navigation menu */}
        {isMobile && isMenuOpen && (
          <div className="pt-2 pb-4 bg-teal-600 rounded-b-lg shadow-lg border-t border-teal-700">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-md m-1 hover:bg-teal-700 hover:text-yellow-300 transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-teal-700 text-yellow-300 font-semibold' 
                    : 'text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 m-1 text-red-300 hover:bg-teal-700 hover:text-red-200 transition-colors rounded-md font-medium"
              >
                Đăng xuất
              </button>
            ) : (
              <Link 
                to="/auth"
                className="block px-4 py-3 m-1 text-yellow-300 hover:bg-teal-700 transition-colors rounded-md font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Đăng nhập
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;