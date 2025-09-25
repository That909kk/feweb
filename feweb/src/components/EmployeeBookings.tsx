import React, { useState, useEffect } from 'react';
import { useEmployeeBookings } from '../hooks/useEmployeeBookings';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, MapPin, DollarSign, CheckCircle, PlayCircle, XCircle } from 'lucide-react';

const EmployeeBookings: React.FC = () => {
  const { user } = useAuth();
  const { 
    bookingDetails, 
    isLoading, 
    error, 
    getEmployeeBookingDetails, 
    startBookingDetail,
    completeBookingDetail
  } = useEmployeeBookings();
  
  const [actioningBookingId, setActioningBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Get the correct employee ID
      let employeeId = user.id;
      if (user.profileData && 'employeeId' in user.profileData) {
        employeeId = user.profileData.employeeId || user.id;
      }

      if (employeeId) {
        console.log(`Getting booking details for employee ${employeeId}`);
        getEmployeeBookingDetails(employeeId);
      } else {
        console.error('No valid employeeId found');
      }
    }
  }, [getEmployeeBookingDetails, user]);

  const handleStartBooking = async (bookingDetailId: string) => {
    setActioningBookingId(bookingDetailId);
    
    try {
      const result = await startBookingDetail(bookingDetailId);
      if (result) {
        toast.success('Bắt đầu công việc thành công!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi bắt đầu công việc');
    } finally {
      setActioningBookingId(null);
    }
  };

  const handleCompleteBooking = async (bookingDetailId: string) => {
    setActioningBookingId(bookingDetailId);
    
    try {
      const result = await completeBookingDetail(bookingDetailId);
      if (result) {
        toast.success('Hoàn thành công việc thành công!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra khi hoàn thành công việc');
    } finally {
      setActioningBookingId(null);
    }
  };

  // Get status display and color
  const getStatusInfo = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' };
      case 'ACCEPTED':
        return { label: 'Đã nhận', color: 'bg-blue-100 text-blue-800' };
      case 'IN_PROGRESS':
        return { label: 'Đang thực hiện', color: 'bg-orange-100 text-orange-800' };
      case 'COMPLETED':
        return { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' };
      case 'CANCELLED':
        return { label: 'Đã hủy', color: 'bg-red-100 text-red-800' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (isLoading && bookingDetails.length === 0) {
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
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => user?.id && getEmployeeBookingDetails(user.id)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Công việc của tôi</h2>
      
      {bookingDetails.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">Bạn chưa nhận công việc nào.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookingDetails.map((booking) => {
            const statusInfo = getStatusInfo(booking.status);
            return (
              <div key={booking.bookingDetailId} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h3>
                  <span className={`px-2 py-1 ${statusInfo.color} text-xs rounded-full`}>
                    {statusInfo.label}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Ngày: {new Date(booking.startTime).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      {new Date(booking.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(booking.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>Địa chỉ: {booking.location || 'Không có thông tin'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>{booking.price.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>
                
                <div className="mt-4 border-t pt-4 flex justify-end">
                  {booking.status === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStartBooking(booking.bookingDetailId)}
                      disabled={actioningBookingId === booking.bookingDetailId}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-2"
                    >
                      {actioningBookingId === booking.bookingDetailId ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Bắt đầu
                        </>
                      )}
                    </button>
                  )}
                  
                  {booking.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleCompleteBooking(booking.bookingDetailId)}
                      disabled={actioningBookingId === booking.bookingDetailId}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {actioningBookingId === booking.bookingDetailId ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Hoàn thành
                        </>
                      )}
                    </button>
                  )}
                  
                  {(booking.status === 'COMPLETED' || booking.status === 'CANCELLED') && (
                    <span className="text-sm text-gray-500 italic">
                      {booking.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đã hủy'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <button 
        onClick={() => user?.id && getEmployeeBookingDetails(user.id)}
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

export default EmployeeBookings;