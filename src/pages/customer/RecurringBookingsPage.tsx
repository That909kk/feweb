import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRecurringBooking } from '../../hooks/useRecurringBooking';
import type { RecurringBooking } from '../../hooks/useRecurringBooking';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Calendar, Clock, MapPin, XCircle, CheckCircle, AlertCircle } from 'lucide-react';

const RecurringBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getRecurringBookings, cancelRecurringBooking, isLoading } = useRecurringBooking();
  
  const [recurringBookings, setRecurringBookings] = useState<RecurringBooking[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<RecurringBooking | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecurringBookings();
  }, [currentPage]);

  const loadRecurringBookings = async () => {
    if (!user?.customerId) return;
    
    try {
      const response = await getRecurringBookings(user.customerId, currentPage, 10);
      setRecurringBookings(response.data);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      setError(error.message || 'Không thể tải danh sách lịch định kỳ');
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !user?.customerId || !cancelReason.trim()) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }

    try {
      await cancelRecurringBooking(user.customerId, selectedBooking.recurringBookingId, {
        reason: cancelReason
      });
      
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      loadRecurringBookings();
      
      alert('Đã hủy lịch định kỳ thành công!');
    } catch (error: any) {
      setError(error.message || 'Không thể hủy lịch định kỳ');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Đang hoạt động
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
            <XCircle className="w-4 h-4 mr-1" />
            Đã hủy
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Đã hoàn thành
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      role="CUSTOMER"
      title="Lịch định kỳ"
      description="Quản lý các lịch đặt dịch vụ định kỳ của bạn"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch định kỳ</h1>
            <p className="mt-2 text-gray-600">
              Quản lý các lịch đặt dịch vụ tự động của bạn
            </p>
          </div>
          <button
            onClick={() => navigate('/customer/booking')}
            className="px-6 py-3 bg-gradient-to-r from-brand-navy to-brand-teal text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            + Tạo lịch mới
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && recurringBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : recurringBookings.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Chưa có lịch định kỳ nào</h3>
            <p className="mt-2 text-gray-600">Tạo lịch định kỳ để tự động đặt dịch vụ theo chu kỳ</p>
            <button
              onClick={() => navigate('/customer/booking')}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-brand-navy to-brand-teal text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              Tạo lịch định kỳ đầu tiên
            </button>
          </div>
        ) : (
          /* Bookings List */
          <div className="space-y-6">
            {recurringBookings.map((booking) => (
              <div
                key={booking.recurringBookingId}
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {booking.title}
                      </h3>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(booking.status)}
                        <span className="text-sm text-gray-500">
                          {booking.recurrenceTypeDisplay}
                        </span>
                      </div>
                    </div>
                    {booking.status === 'ACTIVE' && (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowCancelModal(true);
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold"
                      >
                        Hủy lịch
                      </button>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {booking.recurringBookingDetails.map((detail) => (
                      <div key={detail.bookingDetailId} className="flex items-start bg-gray-50 rounded-lg p-4">
                        <img
                          src={detail.service.iconUrl}
                          alt={detail.service.name}
                          className="w-12 h-12 rounded-lg mr-3"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{detail.service.name}</h4>
                          <p className="text-sm text-gray-600">{detail.formattedPricePerUnit}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Schedule Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-brand-teal mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Lịch trình</p>
                        <p className="font-semibold text-gray-900">{booking.recurrenceDaysDisplay}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock className="w-5 h-5 text-brand-teal mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Thời gian</p>
                        <p className="font-semibold text-gray-900">{booking.bookingTime}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-brand-teal mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Địa chỉ</p>
                        <p className="font-semibold text-gray-900 line-clamp-2">{booking.address.fullAddress}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="bg-brand-teal/5 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Thời gian:</strong> {booking.startDate} đến {booking.endDate}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Tổng booking đã tạo</p>
                        <p className="text-2xl font-bold text-brand-teal">{booking.totalGeneratedBookings}</p>
                      </div>
                      {booking.upcomingBookings !== null && (
                        <div>
                          <p className="text-sm text-gray-600">Booking sắp tới</p>
                          <p className="text-2xl font-bold text-brand-navy">{booking.upcomingBookings}</p>
                        </div>
                      )}
                    </div>
                    {booking.note && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Ghi chú</p>
                        <p className="text-sm text-gray-900">{booking.note}</p>
                      </div>
                    )}
                  </div>

                  {/* Cancelled Info */}
                  {booking.status === 'CANCELLED' && booking.cancellationReason && (
                    <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Lý do hủy:</strong> {booking.cancellationReason}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Hủy lúc: {booking.cancelledAt}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span className="px-4 py-2 bg-brand-teal text-white rounded-lg">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Hủy lịch định kỳ
              </h3>
              <p className="text-gray-600 mb-4">
                Bạn có chắc chắn muốn hủy lịch định kỳ "<strong>{selectedBooking.title}</strong>"?
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Tất cả các booking tương lai sẽ bị hủy. 
                  Các booking đã hoàn thành hoặc đang thực hiện sẽ không bị ảnh hưởng.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do hủy <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy lịch định kỳ..."
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                    setCancelReason('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Đóng
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancelReason.trim() || isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecurringBookingsPage;
