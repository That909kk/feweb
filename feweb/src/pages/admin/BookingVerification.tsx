/**
 * Admin Booking Verification Page
 * Duyệt/từ chối các booking posts (unverified bookings)
 * Theo API-Admin-Booking-Verification.md
 */

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, XCircle, Calendar, MapPin, User, Image as ImageIcon, 
  Loader2, AlertCircle, MessageSquare, Search
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { MetricCard, SectionCard } from '../../shared/components';
import { getUnverifiedBookingsApi, verifyBookingApi } from '../../api/admin';

interface UnverifiedBooking {
  bookingId: string;
  bookingCode: string;
  customerId: string;
  customerName: string;
  address: {
    addressId: string;
    fullAddress: string;
    street?: string;
    ward: string;
    district?: string;
    city: string;
    latitude?: number | null;
    longitude?: number | null;
    isDefault?: boolean;
  };
  bookingTime: string;
  note: string | null;
  totalAmount: number;
  formattedTotalAmount: string;
  status: string;
  title: string | null;
  imageUrl: string | null;
  isVerified: boolean;
  adminComment: string | null;
  createdAt: string;
}

const BookingVerification: React.FC = () => {
  const [bookings, setBookings] = useState<UnverifiedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<UnverifiedBooking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [filteredBookings, setFilteredBookings] = useState<UnverifiedBooking[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadUnverifiedBookings();
  }, []);

  // Filter bookings based on search
  useEffect(() => {
    if (searchCode.trim() === '') {
      setFilteredBookings(bookings);
    } else {
      const filtered = bookings.filter(booking => 
        booking.bookingCode.toLowerCase().includes(searchCode.toLowerCase()) ||
        booking.bookingId.toLowerCase().includes(searchCode.toLowerCase())
      );
      setFilteredBookings(filtered);
    }
    // Reset to first page when search changes
    setCurrentPage(0);
  }, [searchCode, bookings]);

  const loadUnverifiedBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load all unverified bookings without pagination parameters
      const response = await getUnverifiedBookingsApi({ page: 0, size: 1000 });
      
      if (response && Array.isArray(response.data)) {
        setBookings(response.data);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Error loading unverified bookings:', err);
      setError(err.message || 'Không thể tải danh sách booking posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      setError(null);

      await verifyBookingApi(bookingId, {
        approve: true,
        adminComment: adminComment || 'Booking đã được duyệt. Chúc quý khách có trải nghiệm tốt!'
      });

      // Show success message
      setSuccessMessage('Đã duyệt booking thành công!');

      // Reload danh sách
      await loadUnverifiedBookings();
      setProcessingId(null);
      setAdminComment('');

      // Auto hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error approving booking:', err);
      setError(err.message || 'Không thể duyệt booking này');
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking || !rejectionReason.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setProcessingId(selectedBooking.bookingId);
      setError(null);

      await verifyBookingApi(selectedBooking.bookingId, {
        approve: false,
        rejectionReason,
        adminComment: adminComment || undefined
      });

      // Show success message
      setSuccessMessage('Đã từ chối booking thành công!');

      // Reload danh sách
      await loadUnverifiedBookings();
      
      // Close modal và reset
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectionReason('');
      setAdminComment('');
      setProcessingId(null);

      // Auto hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error rejecting booking:', err);
      setError(err.message || 'Không thể từ chối booking này');
      setProcessingId(null);
    }
  };

  const openRejectModal = (booking: UnverifiedBooking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
    setRejectionReason('');
    setAdminComment('');
    setError(null);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedBooking(null);
    setRejectionReason('');
    setAdminComment('');
    setError(null);
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title="Duyệt Booking Posts"
      description="Xác minh các bài đăng tìm nhân viên từ khách hàng"
    >
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          icon={AlertCircle}
          label="Chờ duyệt"
          value={bookings.length.toString()}
          accent="amber"
          trendLabel="Booking posts đang chờ xác minh"
        />
      </div>

      <SectionCard
        title="Danh sách Booking Posts"
        description="Tìm kiếm booking theo mã đơn hàng"
      >
        {/* Search Box */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Tìm kiếm theo mã đơn hàng..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchCode && (
              <button
                onClick={() => setSearchCode('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchCode && (
            <p className="mt-2 text-sm text-slate-600">
              Tìm thấy <span className="font-semibold text-blue-600">{filteredBookings.length}</span> kết quả
            </p>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 text-sm ${
            successMessage.includes('Đã duyệt')
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : 'border-orange-100 bg-orange-50 text-orange-700'
          }`}>
            {successMessage.includes('Đã duyệt') ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-slate-500">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Đang tải dữ liệu...
          </div>
        ) : (searchCode ? filteredBookings : bookings).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-center text-slate-500">
            <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
            <p className="text-lg font-medium">
              {searchCode ? 'Không tìm thấy booking nào' : 'Không có booking posts nào chờ duyệt'}
            </p>
            <p className="text-sm mt-2">
              {searchCode ? `Không tìm thấy booking với mã "${searchCode}"` : 'Tất cả các bài đăng đã được xử lý'}
            </p>
          </div>
        ) : (
          <>
            {(() => {
              const displayBookings = searchCode ? filteredBookings : bookings;
              const totalPages = Math.ceil(displayBookings.length / itemsPerPage);
              const startIndex = currentPage * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const paginatedBookings = displayBookings.slice(startIndex, endIndex);
              
              return (
                <>
                  <div className="space-y-4">
                    {paginatedBookings.map((booking) => (
              <div
                key={booking.bookingId}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  {booking.imageUrl && (
                    <img
                      src={booking.imageUrl}
                      alt="Booking"
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {booking.bookingCode}
                      </h3>
                      {booking.title && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                          <MessageSquare className="h-3 w-3" />
                          {booking.title}
                        </span>
                      )}
                      {booking.imageUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          <ImageIcon className="h-3 w-3" />
                          Có hình ảnh
                        </span>
                      )}
                    </div>

                    <p className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <User className="h-4 w-4" />
                      {booking.customerName}
                    </p>

                    <p className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(booking.bookingTime)}
                    </p>

                    <p className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      {booking.address.fullAddress}
                    </p>

                    {booking.note && (
                      <p className="text-sm text-slate-700 mb-2 italic">
                        "{booking.note}"
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="text-lg font-bold text-blue-600">
                        {booking.formattedTotalAmount}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openRejectModal(booking)}
                          disabled={processingId === booking.bookingId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {processingId === booking.bookingId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Từ chối
                        </button>

                        <button
                          onClick={() => handleApprove(booking.bookingId)}
                          disabled={processingId === booking.bookingId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {processingId === booking.bookingId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Duyệt
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
                  </div>

                  {/* Pagination UI */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          currentPage === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        ← Trước
                      </button>

                      {/* Page Numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                              currentPage === i
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          currentPage === totalPages - 1
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Sau →
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </SectionCard>

      {/* Reject Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Từ chối Booking Post
            </h3>

            <p className="text-sm text-slate-600 mb-4">
              Booking: <span className="font-semibold">{selectedBooking.bookingCode}</span>
            </p>

            {error && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lý do từ chối <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="VD: Thông tin địa chỉ không rõ ràng..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ghi chú thêm (tùy chọn)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="VD: Vui lòng cập nhật lại địa chỉ chính xác..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeRejectModal}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId === selectedBooking.bookingId}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === selectedBooking.bookingId ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  'Xác nhận từ chối'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BookingVerification;
