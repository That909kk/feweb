import React, { useEffect, useState } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Loader2, 
  MapPin,
  User,
  CreditCard,
  XCircle,
  Clock
} from 'lucide-react';
import { useBooking } from '../../hooks/useBooking';
import { DashboardLayout } from '../../layouts';
import { MetricCard, SectionCard } from '../../shared/components';

type BookingPost = {
  bookingId: string;
  bookingCode?: string;
  customerId?: string;
  customerName?: string;
  title?: string;
  imageUrl?: string;
  isVerified?: boolean;
  status: string;
  bookingTime?: string;
  totalAmount?: number;
  formattedTotalAmount?: string;
  createdAt?: string;
  customerInfo?: {
    fullName: string;
    phoneNumber?: string;
    fullAddress?: string;
  };
  serviceDetails?: Array<{
    serviceName: string;
    price?: number;
    formattedPrice?: string;
  }>;
  note?: string;
  [key: string]: any;
};

const AdminBookingManagement: React.FC = () => {
  const { getUnverifiedBookings, verifyBooking } = useBooking();
  const [bookings, setBookings] = useState<BookingPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingPost | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(true);
  const [adminComment, setAdminComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUnverifiedBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUnverifiedBookings({ page: 0, size: 100 });
      setBookings(response as BookingPost[]);
    } catch (err: any) {
      console.error('Failed to load unverified bookings:', err);
      setError('Không thể tải danh sách booking chờ xác minh');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUnverifiedBookings();
  }, []);

  const handleVerify = async () => {
    if (!selectedBooking?.bookingId) return;

    setIsProcessing(true);
    try {
      await verifyBooking(selectedBooking.bookingId, {
        approve: isApproving,
        adminComment: isApproving ? adminComment || undefined : undefined,
        rejectionReason: !isApproving ? adminComment || 'Thông tin không đầy đủ' : undefined
      });
      
      // Reload bookings
      await loadUnverifiedBookings();
      
      // Close dialog
      setShowVerifyDialog(false);
      setSelectedBooking(null);
      setAdminComment('');
    } catch (err: any) {
      console.error('Failed to verify booking:', err);
      setError('Không thể xác minh booking. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const metrics = {
    total: bookings.length,
    pending: bookings.filter(b => !b.isVerified).length
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title="Quản lý Booking Posts"
      description="Xác minh và quản lý các booking chờ phân công nhân viên"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricCard
          icon={CalendarClock}
          label="Tổng booking chờ xác minh"
          value={`${metrics.total}`}
          accent="navy"
          trendLabel="Các booking chưa có nhân viên được phân công"
        />
        <MetricCard
          icon={AlertCircle}
          label="Chờ duyệt"
          value={`${metrics.pending}`}
          accent="amber"
          trendLabel="Cần xác minh trước khi hiển thị công khai"
        />
      </div>

      <SectionCard
        title="Danh sách Booking Posts"
        description="Xem và xác minh các booking post từ khách hàng"
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
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 py-16 text-center">
              <CheckCircle2 className="mb-4 h-10 w-10 text-emerald-500" />
              <h3 className="text-lg font-semibold text-slate-900">Không có booking nào chờ xác minh</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Tất cả booking posts đã được xử lý
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div
                  key={booking.bookingId}
                  className="flex flex-col justify-between rounded-2xl border border-brand-outline/40 bg-gradient-to-r from-white via-white to-sky-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-slate-500">Mã đơn</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        {booking.bookingCode || booking.bookingId}
                      </span>
                      {!booking.isVerified && (
                        <span className="inline-flex items-center rounded-full border border-status-warning/30 bg-status-warning/10 px-3 py-1 text-xs font-semibold text-status-warning">
                          Chờ xác minh
                        </span>
                      )}
                    </div>
                    
                    {booking.title && (
                      <h3 className="text-lg font-semibold text-brand-navy">
                        {booking.title}
                      </h3>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-brand-text/70">
                      <span className="inline-flex items-center gap-2">
                        <User className="h-4 w-4 text-sky-500" />
                        {booking.customerInfo?.fullName || booking.customerName || 'N/A'}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-sky-500" />
                        {booking.bookingTime 
                          ? new Date(booking.bookingTime).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
                          : 'Chưa cập nhật'}
                      </span>
                      {booking.bookingTime && (
                        <span className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 text-sky-500" />
                          {new Date(booking.bookingTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {booking.customerInfo?.fullAddress && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-sky-500" />
                          {booking.customerInfo.fullAddress}
                        </span>
                      )}
                    </div>

                    {booking.serviceDetails && booking.serviceDetails.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {booking.serviceDetails.map((service, idx) => (
                          <span 
                            key={idx}
                            className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                          >
                            {service.serviceName}
                            {service.formattedPrice && ` - ${service.formattedPrice}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col items-start gap-3 sm:mt-0 sm:items-end">
                    {booking.formattedTotalAmount && (
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CreditCard className="h-4 w-4 text-emerald-500" />
                        {booking.formattedTotalAmount}
                      </span>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsApproving(true);
                          setShowVerifyDialog(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Duyệt
                      </button>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsApproving(false);
                          setShowVerifyDialog(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-500"
                      >
                        <XCircle className="h-4 w-4" />
                        Từ chối
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Verify Dialog */}
        {showVerifyDialog && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm">
            <div className="relative w-full max-w-md">
              <SectionCard
                title={isApproving ? 'Duyệt Booking Post' : 'Từ chối Booking Post'}
                description={`Đơn ${selectedBooking.bookingCode || selectedBooking.bookingId}`}
                actions={
                  <button
                    onClick={() => {
                      setShowVerifyDialog(false);
                      setSelectedBooking(null);
                      setAdminComment('');
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                    aria-label="Đóng"
                  >
                    <X className="h-4 w-4" />
                  </button>
                }
              >
                <div className="space-y-4">
                  <div className={`rounded-2xl border p-4 text-sm ${
                    isApproving 
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-rose-100 bg-rose-50 text-rose-700'
                  }`}>
                    {isApproving ? (
                      <>
                        <CheckCircle2 className="mr-2 inline h-4 w-4 align-text-top" />
                        Bạn chắc chắn muốn duyệt booking post này? Sau khi duyệt, booking sẽ được hiển thị công khai.
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-2 inline h-4 w-4 align-text-top" />
                        Bạn chắc chắn muốn từ chối booking post này? Booking sẽ bị hủy và khách hàng sẽ nhận được thông báo.
                      </>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {isApproving ? 'Ghi chú admin (tùy chọn)' : 'Lý do từ chối'}
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      placeholder={isApproving ? "Nhập ghi chú..." : "Nhập lý do từ chối..."}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {adminComment.length}/500 ký tự
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowVerifyDialog(false);
                        setSelectedBooking(null);
                        setAdminComment('');
                      }}
                      disabled={isProcessing}
                      className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={isProcessing}
                      className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isApproving
                          ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-500'
                          : 'bg-rose-600 shadow-rose-200 hover:bg-rose-500'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          {isApproving ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {isApproving ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </DashboardLayout>
  );
};

export default AdminBookingManagement;
