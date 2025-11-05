/**
 * Admin Booking Verification Page
 * Duyệt/từ chối các booking posts (unverified bookings)
 * Theo API-Admin-Booking-Verification.md
 */

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, XCircle, Calendar, MapPin, User, Image as ImageIcon, 
  Loader2, AlertCircle, MessageSquare
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { MetricCard, SectionCard } from '../../shared/components';
import { getUnverifiedBookingsApi, verifyBookingApi } from '../../api/admin';

interface UnverifiedBooking {
  success: boolean;
  message: string;
  data: {
    bookingId: string;
    bookingCode: string;
    customerId: string;
    customerName: string;
    address: any;
    bookingTime: string;
    note: string;
    totalAmount: number;
    formattedTotalAmount: string;
    status: string;
    title: string | null;
    imageUrl: string | null;
    isVerified: boolean;
    adminComment: string | null;
    bookingDetails: any[];
  };
}

const BookingVerification: React.FC = () => {
  const [bookings, setBookings] = useState<UnverifiedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<UnverifiedBooking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminComment, setAdminComment] = useState('');

  useEffect(() => {
    loadUnverifiedBookings();
  }, [currentPage]);

  const loadUnverifiedBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getUnverifiedBookingsApi({ page: currentPage, size: 10 });
      
      setBookings(response.data || []);
      setTotalPages(response.totalPages || 1);
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

      // Reload danh sách
      await loadUnverifiedBookings();
      setProcessingId(null);
      setAdminComment('');
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
      setProcessingId(selectedBooking.data.bookingId);
      setError(null);

      await verifyBookingApi(selectedBooking.data.bookingId, {
        approve: false,
        rejectionReason,
        adminComment: adminComment || undefined
      });

      // Reload danh sách
      await loadUnverifiedBookings();
      
      // Close modal và reset
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectionReason('');
      setAdminComment('');
      setProcessingId(null);
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
        description="Duyệt hoặc từ chối các bài đăng tìm nhân viên"
      >
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
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-center text-slate-500">
            <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
            <p className="text-lg font-medium">Không có booking posts nào chờ duyệt</p>
            <p className="text-sm mt-2">Tất cả các bài đăng đã được xử lý</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.data.bookingId}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  {booking.data.imageUrl && (
                    <img
                      src={booking.data.imageUrl}
                      alt="Booking"
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {booking.data.bookingCode}
                      </h3>
                      {booking.data.title && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                          <MessageSquare className="h-3 w-3" />
                          {booking.data.title}
                        </span>
                      )}
                      {booking.data.imageUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          <ImageIcon className="h-3 w-3" />
                          Có hình ảnh
                        </span>
                      )}
                    </div>

                    <p className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <User className="h-4 w-4" />
                      {booking.data.customerName}
                    </p>

                    <p className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateTime(booking.data.bookingTime)}
                    </p>

                    <p className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      {booking.data.address.fullAddress}
                    </p>

                    {booking.data.note && (
                      <p className="text-sm text-slate-700 mb-2 italic">
                        "{booking.data.note}"
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="text-lg font-bold text-blue-600">
                        {booking.data.formattedTotalAmount}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openRejectModal(booking)}
                          disabled={processingId === booking.data.bookingId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {processingId === booking.data.bookingId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Từ chối
                        </button>

                        <button
                          onClick={() => handleApprove(booking.data.bookingId)}
                          disabled={processingId === booking.data.bookingId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {processingId === booking.data.bookingId ? (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === i
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Reject Modal */}
      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Từ chối Booking Post
            </h3>

            <p className="text-sm text-slate-600 mb-4">
              Booking: <span className="font-semibold">{selectedBooking.data.bookingCode}</span>
            </p>

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
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId === selectedBooking.data.bookingId}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingId === selectedBooking.data.bookingId ? (
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
