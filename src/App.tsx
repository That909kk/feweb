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
import VoiceBookingPage from './pages/customer/VoiceBookingPage';
import RecurringBookingsPage from './pages/customer/RecurringBookingsPage';
import PaymentPage from './pages/customer/PaymentPage';
import PaymentCallbackPage from './pages/customer/PaymentCallbackPage';
import VNPayResultPage from './pages/customer/VNPayResultPage';
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
import EmployeeAssignments from './pages/employee/Assignments';

// Admin pages  
import { 
  AdminDashboard,
  AdminUserManagement,
  AdminServiceManagement,
  AdminBookingManagement,
  AdminContentManagement,
  AdminPermissionManagement,
  AdminAdditionalFeeManagement
} from './pages/admin';
import BookingVerification from './pages/admin/BookingVerification';
import AdminStatistics from './pages/admin/Statistics';

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
            <Route path="/customer/voice-booking" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <VoiceBookingPage />
              </ProtectedRoute>
            } />
            <Route path="/customer/recurring-bookings" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <RecurringBookingsPage />
              </ProtectedRoute>
            } />
            <Route path="/customer/payment" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <PaymentPage />
              </ProtectedRoute>
            } />
            <Route path="/customer/payment-callback" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <PaymentCallbackPage />
              </ProtectedRoute>
            } />
            <Route path="/payment/vnpay-result" element={
              <ProtectedRoute requiredRole="CUSTOMER">
                <VNPayResultPage />
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
            <Route path="/customer/chat/:conversationId" element={
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
            <Route path="/employee/assignments" element={
              <ProtectedRoute requiredRole="EMPLOYEE">
                <EmployeeAssignments />
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
            <Route path="/admin/statistics" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminStatistics />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminUserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminServiceManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminBookingManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/booking-verification" element={
              <ProtectedRoute requiredRole="ADMIN">
                <BookingVerification />
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
            <Route path="/admin/additional-fees" element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminAdditionalFeeManagement />
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
