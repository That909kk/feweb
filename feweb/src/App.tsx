import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomeRedirect from './components/HomeRedirect';

// Public pages
import AuthPage from './pages/AuthPage';
import RegisterPage from './pages/RegisterPage';

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard';
import BookingPage from './pages/customer/BookingPage';
import BookingSuccessPage from './pages/customer/BookingSuccessPage';
import OrdersPage from './pages/customer/OrdersPage';
import ChatPage from './pages/customer/ChatPage';
import CustomerProfilePage from './pages/customer/ProfilePage';

// Employee pages
import { 
  EmployeeDashboard,
  EmployeeSchedule,
  EmployeeRequests,
  EmployeeProfile,
  EmployeeChatPage
} from './pages/employee';
import { BookingPosts } from './pages/employee/BookingPosts';

// Admin pages  
import { 
  AdminDashboard,
  AdminUserManagement,
  AdminBookingManagement,
  AdminContentManagement,
  AdminPermissionManagement
} from './pages/admin';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Home route with auth redirect */}
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Customer routes */}
            <Route path="/customer/dashboard" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/customer/booking" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <BookingPage />
              </ProtectedRoute>
            } />
            <Route path="/customer/booking-success" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <BookingSuccessPage />
              </ProtectedRoute>
            } />
            <Route path="/customer/orders" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/customer/chat" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <ChatPage />
              </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <CustomerProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Employee routes */}
            <Route path="/employee/dashboard" element={
              <ProtectedRoute requiredRole="EMPLOYEE">
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/employee/schedule" element={
              <ProtectedRoute requiredRole="EMPLOYEE">
                <EmployeeSchedule />
              </ProtectedRoute>
            } />
            <Route path="/employee/booking-posts" element={
              <ProtectedRoute requiredRole="EMPLOYEE">
                <BookingPosts />
              </ProtectedRoute>
            } />
            <Route path="/employee/requests" element={
              <ProtectedRoute requiredRole="EMPLOYEE">
                <EmployeeRequests />
              </ProtectedRoute>
            } />
            <Route path="/employee/profile" element={
              <ProtectedRoute requiredRole="EMPLOYEE">
                <EmployeeProfile />
              </ProtectedRoute>
            } />
            <Route path="/employee/chat" element={
              <ProtectedRoute requiredRole="EMPLOYEE">
                <EmployeeChatPage />
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminUserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminBookingManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/content" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminContentManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/permissions" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminPermissionManagement />
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
