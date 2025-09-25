import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin,
  User,
  Eye,
  X,
  MessageCircle,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../hooks/useBooking';
import { useServices } from '../../hooks/useServices';
import Navigation from '../../components/Navigation';
import type { BookingResponse } from '../../types/api';

const OrdersPage: React.FC = () => {
  // console.log('OrdersPage rendered');
  const { user } = useAuth();
  const { getCustomerBookings, isLoading: bookingLoading } = useBooking();
  const { services, isLoading: servicesLoading } = useServices();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingResponse['data'][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  // Kết hợp trạng thái loading
  const combinedLoading = isLoading || bookingLoading || servicesLoading;

  // Hàm để tải lại đơn hàng khi người dùng chủ động muốn refresh
  const handleRefreshBookings = async () => {
    if (!user?.id || isLoading) return;
    
    setIsLoading(true);
    try {
      console.log('Manually refreshing bookings for customer ID:', user.id);
      const userBookings = await getCustomerBookings(user.id);
      if (userBookings) {
        setBookings(userBookings);
        console.log('Refreshed bookings:', userBookings.length);
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ load dữ liệu nếu chưa từng load và có user.id
    if (!hasLoadedRef.current && user?.id) {
      let isMounted = true;
      const loadBookings = async () => {
        setIsLoading(true);
        try {
          console.log('Loading bookings for customer ID:', user.id);
          const userBookings = await getCustomerBookings(user.id);
          if (isMounted && userBookings) {
            setBookings(userBookings);
            console.log('Loaded bookings:', userBookings.length);
            // Đánh dấu đã load xong
            hasLoadedRef.current = true;
          }
        } catch (error) {
          console.error('Error loading bookings:', error);
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      loadBookings();
      
      // Cleanup function để tránh memory leak và các vấn đề với component unmounted
      return () => {
        isMounted = false;
      };
    }
    
    return undefined; // Return undefined if no cleanup needed
  }, [user?.id, getCustomerBookings]); // Thêm getCustomerBookings để tránh lỗi
  
  // Filter bookings by status
  const filteredBookings = selectedStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === selectedStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Đã hoàn thành';
      case 'accepted':
        return 'Đã xác nhận';
      case 'in_progress':
        return 'Đang thực hiện';
      case 'pending':
        return 'Đang chờ';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getServiceIcon = (categoryId?: number) => {
    if (!categoryId) return '🛠️';
    // Map categoryId to icons - this should match with actual category IDs from API
    switch (categoryId) {
      case 1: return '🏠'; // cleaning
      case 2: return '👨‍🍳'; // cooking  
      case 3: return '👔'; // laundry
      case 4: return '❤️'; // care
      case 5: return '👶'; // childcare
      default: return '🛠️';
    }
  };

  const BookingDetailModal = ({ bookingId }: { bookingId: string }) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    const service = services.find(s => s.serviceId === Number(booking?.serviceId));
    const employee = booking?.employeeId ? null : null; // TODO: Get employee data when API available

    if (!booking || !service) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Chi tiết đơn hàng</h3>
            <button
              onClick={() => setSelectedBooking(null)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Service Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="w-14 h-14 rounded-lg mr-4 flex items-center justify-center overflow-hidden">
                {service.iconUrl ? (
                  <img src={service.iconUrl} alt={service.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="text-3xl">{getServiceIcon(service?.categoryId)}</div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{service.name}</h4>
                <p className="text-gray-600 mb-2">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                  <span className="text-lg font-semibold text-blue-600">
                    {booking.totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <span className="font-medium text-gray-900">Ngày: </span>
                <span className="text-gray-700">
                  {new Date(booking.scheduledDate).toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-500 mr-3" />
              <div>
                <span className="font-medium text-gray-900">Giờ: </span>
                <span className="text-gray-700">{booking.scheduledTime}</span>
                {service && <span className="text-gray-500 ml-2">({service.estimatedDurationHours * 60} phút)</span>}
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-500 mr-3 mt-0.5" />
              <div>
                <span className="font-medium text-gray-900">Địa chỉ: </span>
                <span className="text-gray-700">{booking.address}</span>
              </div>
            </div>

            {booking.notes && (
              <div className="flex items-start">
                <div className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex items-center justify-center">
                  📝
                </div>
                <div>
                  <span className="font-medium text-gray-900">Ghi chú: </span>
                  <span className="text-gray-700">{booking.notes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Employee Info */}
          {booking.employeeId ? (
            <div className="border-t pt-4 mb-6">
              <h5 className="font-semibold text-gray-900 mb-3">Thông tin nhân viên</h5>
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h6 className="font-medium text-gray-900">Nhân viên #{booking.employeeId}</h6>
                  <p className="text-sm text-gray-600 mt-1">Thông tin chi tiết đang được cập nhật</p>
                </div>
                <Link
                  to={`/customer/chat?employee=${booking.employeeId}`}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                >
                  <MessageCircle className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="border-t pt-4 mb-6">
              <h5 className="font-semibold text-gray-900 mb-3">Thông tin nhân viên</h5>
              <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                Chưa có nhân viên được phân công
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {booking.status === 'pending' && (
              <button className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                Hủy đơn
              </button>
            )}
            
            {booking.status === 'completed' && (
              <button className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">
                Đánh giá nhân viên
              </button>
            )}
            
            {(booking.status === 'accepted' || booking.status === 'in_progress') && (
              <Link
                                          to={`/customer/chat?booking=${booking.bookingId}`}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chat với nhân viên
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole="CUSTOMER" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Đơn hàng của tôi</h1>
          <button 
            onClick={handleRefreshBookings} 
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
              isLoading 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <svg 
              className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg p-1 mb-6 inline-flex shadow-sm">
          {[
            { key: 'all', label: 'Tất cả', count: bookings.length },
            { key: 'pending', label: 'Đang chờ', count: bookings.filter(b => b.status === 'pending').length },
            { key: 'accepted', label: 'Đã xác nhận', count: bookings.filter(b => b.status === 'accepted').length },
            { key: 'in_progress', label: 'Đang thực hiện', count: bookings.filter(b => b.status === 'in_progress').length },
            { key: 'completed', label: 'Đã hoàn thành', count: bookings.filter(b => b.status === 'completed').length },
            { key: 'cancelled', label: 'Đã hủy', count: bookings.filter(b => b.status === 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedStatus === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  selectedStatus === tab.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const service = services.find(s => s.serviceId === booking.serviceId);
              // Không cần employee data vì chúng ta chưa có API cho employee
              
              return (
                <div key={booking.bookingId} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start">
                      <div className="w-14 h-14 rounded-lg mr-4 flex items-center justify-center overflow-hidden">
                        {service?.iconUrl ? (
                          <img src={service.iconUrl} alt={service.name} className="w-full h-full object-contain" />
                        ) : (
                          <div className="text-3xl">{getServiceIcon(service?.categoryId)}</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {service?.name || `Dịch vụ #${booking.serviceId}`}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(booking.scheduledDate).toLocaleDateString('vi-VN')} - {booking.scheduledTime}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {booking.address.split(',')[0]}...
                          </div>
                          {booking.employeeId && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              Nhân viên #{booking.employeeId}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                      <div className="text-lg font-semibold text-blue-600 mt-2">
                        {booking.totalPrice.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Đặt ngày: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking.bookingId)}
                        className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem chi tiết
                      </button>
                      
                      {(booking.status === 'accepted' || booking.status === 'in_progress') && (
                        <Link
                          to={`/customer/chat?booking=${booking.bookingId}`}
                          className="flex items-center px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedStatus === 'all' ? 'Chưa có đơn hàng nào' : `Không có đơn ${getStatusText(selectedStatus).toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus === 'all' 
                ? 'Hãy đặt dịch vụ đầu tiên để bắt đầu trải nghiệm'
                : 'Thử thay đổi bộ lọc để xem các đơn khác'
              }
            </p>
            {selectedStatus === 'all' && (
              <Link
                to="/customer/booking"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Đặt dịch vụ ngay
              </Link>
            )}
          </div>
        )}

        {/* Booking Detail Modal */}
        {selectedBooking && <BookingDetailModal bookingId={selectedBooking} />}
      </main>
    </div>
  );
};

export default OrdersPage;