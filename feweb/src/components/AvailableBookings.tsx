import React, { useState, useEffect } from 'react';
import { useAvailableBookings } from '../hooks/useAvailableBookings';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import type { EmployeeData } from '../types/api';

const AvailableBookings: React.FC = () => {
  const { user } = useAuth();
  const { 
    availableBookings, 
    isLoading, 
    error, 
    getAvailableBookings, 
    acceptBookingDetail
  } = useAvailableBookings();
  
  const [acceptingBookingId, setAcceptingBookingId] = useState<string | null>(null);

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
          
          if (employeeId) {
            await getAvailableBookings(employeeId);
          } else {
            console.error('No valid employeeId found');
          }
        } catch (err) {
          console.error('Error fetching available bookings:', err);
        }
      }
    };

    fetchAvailableBookings();
  }, [user, getAvailableBookings]);

  const handleAcceptBooking = async (detailId: string) => {
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

    setAcceptingBookingId(detailId);
    
    try {
      console.log(`Accepting booking ${detailId} for employee ${employeeId}`);
      const result = await acceptBookingDetail(detailId, employeeId);
      if (result) {
        toast.success('Đã nhận công việc thành công!');
        // Refresh the list
        await getAvailableBookings(employeeId);
      }
    } catch (err: any) {
      console.error('Error accepting booking:', err);
      if (err.message === 'Chi tiết dịch vụ đã có đủ nhân viên') {
        toast.error('Dịch vụ này đã có đủ nhân viên');
      } else {
        toast.error(err.message || 'Có lỗi xảy ra khi nhận công việc');
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
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Dịch vụ đang tìm nhân viên</h2>
      
      {availableBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Không có dịch vụ nào cần nhân viên vào lúc này.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {availableBookings.map((booking) => (
            <div key={booking.detailId} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h3>
                  <div className="text-xs text-gray-500 mt-1">Mã: {booking.bookingCode}</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Ngày: {new Date(booking.bookingTime).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    Thời gian: {new Date(booking.bookingTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>Địa chỉ: {booking.address}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Thời lượng dự kiến: {booking.estimatedDuration}h</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <span className="text-sm">Số lượng: {booking.quantity}</span>
                </div>
              </div>
              
              <div className="mt-4 border-t pt-4 flex justify-end">
                <button
                  onClick={() => handleAcceptBooking(booking.detailId)}
                  disabled={acceptingBookingId === booking.detailId}
                  className="flex items-center px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                >
                  {acceptingBookingId === booking.detailId ? (
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
              getAvailableBookings(employeeId);
            }
          }
        }}
        className="mt-6 px-4 py-2 flex items-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Làm mới danh sách
      </button>
    </div>
  );
};

export default AvailableBookings;