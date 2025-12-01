import React, { useState, useEffect } from 'react';
import { useAvailableBookings } from '../hooks/useAvailableBookings';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Calendar, Clock, MapPin, X } from 'lucide-react';
import type { EmployeeData } from '../types/api';

// Success Modal Component
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentData: {
    serviceName: string;
    bookingCode: string;
    scheduledDate: string;
    scheduledTime: string;
    estimatedDuration: number;
    price: number;
  } | null;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, assignmentData }) => {
  useEffect(() => {
    if (isOpen && assignmentData) {
      // Auto close after 2 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, assignmentData, onClose]);

  if (!isOpen || !assignmentData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-center">
          <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nhận việc thành công!</h3>
          <p className="text-gray-600">Công việc đã được thêm vào danh sách của bạn</p>
        </div>
      </div>
    </div>
  );
};

interface AvailableBookingsProps {
  onAcceptSuccess?: () => void;
}

const AvailableBookings: React.FC<AvailableBookingsProps> = ({ onAcceptSuccess }) => {
  const { user } = useAuth();
  const { 
    availableBookings, 
    isLoading, 
    error, 
    getAvailableBookings, 
    acceptBookingDetail
  } = useAvailableBookings();
  
  const [acceptingBookingId, setAcceptingBookingId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    serviceName: string;
    bookingCode: string;
    scheduledDate: string;
    scheduledTime: string;
    estimatedDuration: number;
    price: number;
  } | null>(null);

  useEffect(() => {
    const fetchAvailableBookings = async () => {
      if (user) {
        try {
          // Lấy ID nhân viên từ thông tin người dùng
          let employeeId = user.id;
          
          // Kiểm tra nếu có profileData và là kiểu EmployeeData
          if (user.profileData && 'employeeId' in user.profileData) {
            employeeId = (user.profileData as EmployeeData).employeeId || user.id;
          }
          
          console.log('[AvailableBookings] Fetching bookings for employee:', employeeId);
          
          if (employeeId) {
            await getAvailableBookings(employeeId);
          } else {
            console.error('No valid employeeId found');
          }
        } catch (err) {
          console.error('Error fetching available bookings:', err);
        }
      } else {
        console.log('[AvailableBookings] No user found, skipping fetch');
      }
    };

    fetchAvailableBookings();
  }, [user?.id]); // Only run when user.id changes



  const handleAcceptBooking = async (bookingDetailId: string) => {
    if (!user) {
      toast.error('Không thể xác định thông tin nhân viên');
      return;
    }

    // Get the correct employee ID
    let employeeId = user.id;
    if (user.profileData && 'employeeId' in user.profileData) {
      employeeId = (user.profileData as EmployeeData).employeeId || user.id;
    }

    if (!employeeId) {
      toast.error('Không thể xác định ID nhân viên');
      return;
    }

    setAcceptingBookingId(bookingDetailId);
    
    try {
      console.log(`Accepting booking ${bookingDetailId} for employee ${employeeId}`);
      const result = await acceptBookingDetail(bookingDetailId, employeeId);
      if (result) {
        // Set success data and show modal
        setSuccessData({
          serviceName: result.serviceName || '',
          bookingCode: result.bookingCode || '',
          scheduledDate: result.scheduledDate || '',
          scheduledTime: result.scheduledTime || '',
          estimatedDuration: result.estimatedDuration || 0,
          price: result.price || 0
        });
        setShowSuccessModal(true);
        
        // Refresh the available bookings list
        await getAvailableBookings(employeeId);
        
        // Notify parent component about successful acceptance
        onAcceptSuccess?.();
      }
    } catch (err: any) {
      console.error('Error accepting booking:', err);
      
      // Handle specific error messages
      const errorMessage = err.message || 'Có lỗi xảy ra khi nhận công việc';
      
      if (errorMessage.includes('Chi tiết dịch vụ đã có đủ nhân viên')) {
        toast.error('Dịch vụ này đã có đủ nhân viên');
      } else if (errorMessage.includes('đã được phân công công việc khác trong khung giờ này')) {
        toast.error('Bạn đã có công việc khác trong khung giờ này. Vui lòng chọn dịch vụ khác!');
      } else if (errorMessage.includes('Nhân viên đã nhận chi tiết dịch vụ này')) {
        toast.error('Bạn đã nhận dịch vụ này rồi');
      } else if (errorMessage.includes('Booking is in invalid status')) {
        toast.error('Dịch vụ này không còn khả dụng');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setAcceptingBookingId(null);
    }
  };

  if (isLoading && availableBookings.length === 0) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            if (user) {
              const employeeId = user.profileData && 'employeeId' in user.profileData 
                ? (user.profileData as EmployeeData).employeeId || user.id 
                : user.id;
              if (employeeId) {
                getAvailableBookings(employeeId);
              }
            }
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-6">Dịch vụ đang tìm nhân viên</h2>
      
      {/* Show available bookings count */}
      {availableBookings.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {availableBookings.length} dịch vụ khả dụng
          </span>
        </div>
      )}
      
      {availableBookings.length === 0 && !isLoading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Không có dịch vụ nào cần nhân viên vào lúc này.</p>
          <p className="text-xs text-gray-400 mt-2">Kiểm tra console để xem log API.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {availableBookings.map((booking) => (
            <div key={booking.bookingDetailId} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h3>
                  <div className="text-xs text-gray-500 mt-1">Mã: {booking.bookingCode}</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Ngày: {new Date(booking.bookingTime).toLocaleDateString('vi-VN', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    Thời gian: {new Date(booking.bookingTime).toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Địa chỉ: {booking.serviceAddress}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Thời lượng dự kiến: {booking.estimatedDurationHours}h</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="text-sm">Số lượng: {booking.requiredEmployees}</span>
                </div>
              </div>
              
              <div className="mt-4 border-t pt-4 flex justify-end">
                <button
                  onClick={() => handleAcceptBooking(booking.bookingDetailId)}
                  disabled={acceptingBookingId === booking.bookingDetailId}
                  className="flex items-center px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  {acceptingBookingId === booking.bookingDetailId ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Nhận việc
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={() => {
          if (user) {
            const employeeId = user.profileData && 'employeeId' in user.profileData 
              ? (user.profileData as EmployeeData).employeeId || user.id 
              : user.id;
            if (employeeId) {
              console.log('[AvailableBookings] Manual refresh triggered for employee:', employeeId);
              getAvailableBookings(employeeId);
            }
          }
        }}
        disabled={isLoading}
        className="mt-6 px-4 py-2 flex items-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            Đang tải...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới danh sách
          </>
        )}
      </button>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        assignmentData={successData}
      />
    </>
  );
};

export default AvailableBookings;