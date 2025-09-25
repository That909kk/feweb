import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from '../pages/LandingPage';

const HomeRedirect = () => {
  const { user, selectedRole, isLoading, isInitialized } = useAuth();

  // Wait for auth to finish loading or initializing
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (user && selectedRole) {
    switch (selectedRole) {
      case 'CUSTOMER':
        return <Navigate to="/customer/dashboard" replace />;
      case 'EMPLOYEE':
        return <Navigate to="/employee/dashboard" replace />;
      case 'ADMIN':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        // If role is unknown, show landing page
        break;
    }
  }

  // If not authenticated, show LandingPage
  return <LandingPage />;
};

export default HomeRedirect;