import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  ClipboardList, 
  MessageCircle,
  Plus,
  Clock,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useServices } from '../../hooks/useServices';
import { useBooking } from '../../hooks/useBooking';
import Navigation from '../../components/Navigation';
import type { BookingResponse, CustomerData } from '../../types/api';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { services } = useServices();
  const { getCustomerBookings } = useBooking();
  const [recentBookings, setRecentBookings] = useState<BookingResponse[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  useEffect(() => {
    const loadRecentBookings = async () => {
      if (user) {
        setIsLoadingBookings(true);
        
        try {
          // Lấy ID khách hàng từ thông tin người dùng
          let customerId = user.id;
          
          // Kiểm tra nếu có profileData và là kiểu CustomerData
          if (user.profileData && 'customerId' in user.profileData) {
            customerId = (user.profileData as CustomerData).customerId || user.id;
          }
          
          // Gọi API để lấy dữ liệu booking
          if (customerId) {
            const bookings = await getCustomerBookings(customerId);
            if (bookings) {
              setRecentBookings(bookings);
            } else {
              // Nếu không có dữ liệu trả về, đặt mảng rỗng để tránh lỗi
              setRecentBookings([]);
            }
          } else {
            console.error('No valid customerId found');
          }
        } catch (error) {
          console.error('Error loading recent bookings:', error);
          // Đặt mảng rỗng để tránh lỗi khi API fails
          setRecentBookings([]);
        } finally {
          setIsLoadingBookings(false);
        }
      }
    };

    loadRecentBookings();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'ACCEPTED':
        return 'Đã xác nhận';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'PENDING':
        return 'Đang chờ';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getServiceIcon = (category?: string) => {
    switch (category) {
      case 'cleaning':
        return '🏠';
      case 'cooking':
        return '👨‍🍳';
      case 'laundry':
        return '👔';
      case 'care':
        return '❤️';
      case 'childcare':
        return '👶';
      default:
        return '🛠️';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Xin chào, {user?.fullName}!
          </h2>
          <p className="text-gray-600">
            Chào mừng bạn đến với bảng điều khiển khách hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Book Service */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Cần hỗ trợ gì hôm nay?</h3>
              <p className="text-blue-100 mb-6">
                Đặt dịch vụ giúp việc chỉ trong vài phút
              </p>
              <Link
                to="/customer/booking"
                className="inline-flex items-center bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Đặt giúp việc ngay
              </Link>
            </div>

            {/* Available Services */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Dịch vụ khả dụng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.length > 0 ? (
                  services.map((service) => (
                    <Link
                      key={service.serviceId}
                      to={`/customer/booking?service=${service.serviceId}`}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start">
                        <div className="w-14 h-14 rounded-lg mr-4 flex items-center justify-center overflow-hidden">
                          {service.iconUrl ? (
                            <img src={service.iconUrl} alt={service.name} className="w-full h-full object-contain" />
                          ) : (
                            <div className="text-3xl">{getServiceIcon(service.categoryName)}</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{service.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-600">
                              {service.basePrice.toLocaleString('vi-VN')}đ
                            </span>
                            <span className="text-sm text-gray-500">
                              {service.estimatedDurationHours * 60} phút
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Đang tải dịch vụ...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Đơn gần đây</h3>
                <Link
                  to="/customer/orders"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xem tất cả
                </Link>
              </div>
              
              {isLoadingBookings ? (
                <div className="text-center py-4 text-gray-500">
                  Đang tải...
                </div>
              ) : recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => {
                    // Get first service from serviceDetails
                    const firstService = booking.serviceDetails?.[0]?.service;
                    return (
                      <div key={booking.bookingId} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{firstService?.name || 'Dịch vụ'}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(booking.bookingTime).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {new Date(booking.bookingTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {booking.customerInfo.fullAddress.split(',')[0]}...
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Chưa có đơn nào</p>
                  <Link
                    to="/customer/booking"
                    className="inline-block mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Đặt đơn đầu tiên
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">💡 Mẹo sử dụng</h3>
              <ul className="space-y-2 text-sm text-green-700">
                <li>• Đặt trước 1-2 ngày để có nhiều lựa chọn nhân viên</li>
                <li>• Mô tả chi tiết yêu cầu để nhận dịch vụ tốt nhất</li>
                <li>• Đánh giá sau khi hoàn thành để giúp cải thiện dịch vụ</li>
              </ul>
              <Link
                to="/customer/chat"
                className="inline-flex items-center mt-4 text-green-600 hover:text-green-800 font-medium"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Liên hệ hỗ trợ
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard;