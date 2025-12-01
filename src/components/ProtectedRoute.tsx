import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  redirectTo = '/auth' 
}) => {
  const { isAuthenticated, selectedRole, isInitialized } = useAuth();
  const location = useLocation();

  // Show loading while initializing to prevent flash redirect
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!selectedRole || !roles.includes(selectedRole)) {
      // Redirect to appropriate dashboard based on user's role
      switch (selectedRole) {
        case 'ADMIN':
          return <Navigate to="/admin/dashboard" replace />;
        case 'EMPLOYEE':
          return <Navigate to="/employee/dashboard" replace />;
        case 'CUSTOMER':
        default:
          return <Navigate to="/customer/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;