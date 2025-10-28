import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  MessageCircle,
  NotebookText,
  RefreshCcw,
  Star,
  X
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../hooks/useBooking';
import { useServices } from '../../hooks/useServices';
import { MetricCard, SectionCard } from '../../shared/components';
import { 
  getReviewCriteriaApi, 
  createReviewApi, 
  type ReviewCriteria, 
  type CriteriaRating 
} from '../../api/review';

type BookingItem = {
  bookingId: string;
  bookingCode?: string;
  status: string;
  serviceId?: number;
  bookingTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  formattedTotalAmount?: string;
  totalPrice?: number;
  createdAt?: string;
  updatedAt?: string;
  note?: string;
  address?: string | { fullAddress?: string };
  // Booking Post Feature fields
  title?: string;
  imageUrl?: string;
  isVerified?: boolean;
  adminComment?: string;
  customerInfo?: {
    fullAddress: string;
  };
  serviceDetails?: Array<{
    service: {
      name: string;
      description?: string;
      iconUrl?: string;
    };
  }>;
  payment?: {
    paymentStatus?: string;
    paymentMethod?: string;
    amount?: number;
  };
  [key: string]: any;
};

type StatusKey =
  | 'ALL'
  | 'AWAITING_EMPLOYEE'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

const statusConfig: Record<StatusKey, { label: string; badge: string }> = {
  ALL: { label: 'Tất cả', badge: 'bg-slate-100 text-slate-700' },
  AWAITING_EMPLOYEE: { label: 'Chờ phân công', badge: 'bg-indigo-100 text-indigo-700' },
  CONFIRMED: { label: 'Đã xác nhận', badge: 'bg-sky-100 text-sky-700' },
  IN_PROGRESS: { label: 'Đang thực hiện', badge: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Đã hoàn thành', badge: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Đã hủy', badge: 'bg-rose-100 text-rose-700' }
};

const filterOrder: StatusKey[] = [
  'ALL',
  'AWAITING_EMPLOYEE',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
];

const normalizeStatus = (status?: string): StatusKey => {
  if (!status) return 'ALL';
  const normalized = status.toUpperCase() as StatusKey;
  return filterOrder.includes(normalized) ? normalized : 'ALL';
};

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { getCustomerBookings, cancelBooking, convertBookingToPost } = useBooking();
  const { services, isLoading: isLoadingServices } = useServices();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<StatusKey>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // State for convert to post feature
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  // State for review feature
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewCriteria, setReviewCriteria] = useState<ReviewCriteria[]>([]);
  const [reviewRatings, setReviewRatings] = useState<Record<number, number>>({});
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!user?.id) {
      console.log('[OrdersPage] No user ID, skipping load bookings');
      return;
    }
    console.log('[OrdersPage] Loading bookings for user:', user.id);
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCustomerBookings(user.id);
      console.log('[OrdersPage] Got bookings response:', response);
      if (Array.isArray(response)) {
        console.log('[OrdersPage] Setting bookings, count:', response.length);
        setBookings(response as BookingItem[]);
      } else {
        console.log('[OrdersPage] Response is not array, setting empty');
        setBookings([]);
      }
    } catch (err: any) {
      console.error('[OrdersPage] Failed to load bookings:', err);
      setError('Không thể tải danh sách đơn dịch vụ. Vui lòng thử lại sau.');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    loadReviewCriteria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadReviewCriteria = async () => {
    try {
      const criteria = await getReviewCriteriaApi();
      setReviewCriteria(criteria);
      // Initialize ratings with default value of 5 stars
      const initialRatings: Record<number, number> = {};
      criteria.forEach(c => {
        initialRatings[c.criteriaId] = 5;
      });
      setReviewRatings(initialRatings);
    } catch (err) {
      console.error('Failed to load review criteria:', err);
    }
  };

  const metrics = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(item => normalizeStatus(item.status) === 'COMPLETED').length;
    const awaiting = bookings.filter(item => normalizeStatus(item.status) === 'AWAITING_EMPLOYEE').length;
    return { total, completed, awaiting };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (selectedFilter === 'ALL') return bookings;
    return bookings.filter(item => normalizeStatus(item.status) === selectedFilter);
  }, [bookings, selectedFilter]);

  const resolveServiceName = (booking: BookingItem) => {
    const detailedName = booking.serviceDetails?.[0]?.service.name;
    if (detailedName) return detailedName;
    if (typeof booking.serviceId === 'number') {
      const svc = services.find(service => service.serviceId === booking.serviceId);
      if (svc) return svc.name;
    }
    return 'Dịch vụ gia đình';
  };

  const resolveAddress = (booking: BookingItem) => {
    if (booking.customerInfo?.fullAddress) return booking.customerInfo.fullAddress;
    if (typeof booking.address === 'string') return booking.address;
    if (booking.address && 'fullAddress' in booking.address) {
      return booking.address.fullAddress || 'Chưa cập nhật địa chỉ';
    }
    return 'Chưa cập nhật địa chỉ';
  };

  const resolveTotalAmount = (booking: BookingItem) => {
    if (booking.formattedTotalAmount) return booking.formattedTotalAmount;
    if (booking.totalPrice) return `${booking.totalPrice.toLocaleString('vi-VN')}₫`;
    if (booking.payment?.amount) return `${booking.payment.amount.toLocaleString('vi-VN')}₫`;
    return '—';
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking?.bookingId) return;
    
    setIsCancelling(true);
    try {
      await cancelBooking(selectedBooking.bookingId, cancelReason || undefined);
      // Refresh bookings list
      await loadBookings();
      // Close dialogs
      setShowCancelDialog(false);
      setSelectedBooking(null);
      setCancelReason('');
    } catch (err: any) {
      console.error('Failed to cancel booking:', err);
      setError('Không thể hủy đơn. Vui lòng thử lại sau.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConvertToPost = async () => {
    if (!selectedBooking?.bookingId || !postTitle) {
      setError('Vui lòng nhập tiêu đề bài post');
      return;
    }
    
    setIsConverting(true);
    try {
      await convertBookingToPost(selectedBooking.bookingId, {
        title: postTitle,
        imageUrl: postImageUrl || undefined
      });
      // Refresh bookings list
      await loadBookings();
      // Close dialogs
      setShowConvertDialog(false);
      setSelectedBooking(null);
      setPostTitle('');
      setPostImageUrl('');
    } catch (err: any) {
      console.error('Failed to convert booking to post:', err);
      setError('Không thể chuyển đơn thành bài post. Vui lòng thử lại sau.');
    } finally {
      setIsConverting(false);
    }
  };

  const canCancelBooking = (booking: BookingItem) => {
    const statusKey = normalizeStatus(booking.status);
    // Theo API-TestCases-CancelBooking.md: PENDING, CONFIRMED, AWAITING_EMPLOYEE có thể hủy
    return ['PENDING', 'CONFIRMED', 'AWAITING_EMPLOYEE'].includes(statusKey);
  };

  const handleOpenReviewDialog = (booking: BookingItem) => {
    // Get first employee from assignments if available
    const employeeId = booking.assignments?.[0]?.employee?.employeeId || 
                      booking.assignments?.[0]?.employeeId;
    
    if (!employeeId) {
      setError('Không tìm thấy thông tin nhân viên để đánh giá');
      return;
    }
    
    setSelectedEmployeeId(employeeId);
    setSelectedBooking(booking);
    setShowReviewDialog(true);
    // Reset review form
    setReviewComment('');
    const initialRatings: Record<number, number> = {};
    reviewCriteria.forEach(c => {
      initialRatings[c.criteriaId] = 5;
    });
    setReviewRatings(initialRatings);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking?.bookingId || !selectedEmployeeId) {
      setError('Thông tin đánh giá không hợp lệ');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const criteriaRatings: CriteriaRating[] = Object.entries(reviewRatings).map(
        ([criteriaId, rating]) => ({
          criteriaId: parseInt(criteriaId),
          rating
        })
      );

      await createReviewApi({
        bookingId: selectedBooking.bookingId,
        employeeId: selectedEmployeeId,
        comment: reviewComment,
        criteriaRatings
      });

      // Close dialog and refresh
      setShowReviewDialog(false);
      setSelectedBooking(null);
      setSelectedEmployeeId(null);
      await loadBookings();
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setError(err.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderDetailSheet = () => {
    if (!selectedBooking) return null;
    const statusKey = normalizeStatus(selectedBooking.status);
    const badgePalette = statusConfig[statusKey] || statusConfig.ALL;
    const isPost = statusKey === 'AWAITING_EMPLOYEE' && selectedBooking.title;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl">
          <SectionCard
            title={`Đơn ${selectedBooking.bookingCode || selectedBooking.bookingId}`}
            description={isPost ? 'Chi tiết bài đăng tìm nhân viên' : 'Chi tiết lịch đặt của bạn'}
            actions={
              <button
                onClick={() => setSelectedBooking(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            }
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgePalette.badge}`}>
                    {statusConfig[statusKey]?.label}
                  </span>
                  {isPost && selectedBooking.isVerified === false && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Chờ admin duyệt
                    </span>
                  )}
                  {isPost && selectedBooking.isVerified === true && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Đã duyệt
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  Tạo lúc {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('vi-VN') : '—'}
                </p>
              </div>

              {/* Hiển thị title và image cho booking post */}
              {isPost && selectedBooking.title && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <h3 className="text-lg font-semibold text-indigo-900">{selectedBooking.title}</h3>
                  {selectedBooking.imageUrl && (
                    <img 
                      src={selectedBooking.imageUrl} 
                      alt={selectedBooking.title}
                      className="mt-3 w-full rounded-xl object-cover max-h-64"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dịch vụ</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {resolveServiceName(selectedBooking)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chi phí dự kiến</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {resolveTotalAmount(selectedBooking)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CalendarClock className="h-5 w-5 text-sky-500" />
                  <span>
                    {selectedBooking.bookingTime
                      ? new Date(selectedBooking.bookingTime).toLocaleString('vi-VN')
                      : selectedBooking.scheduledDate
                      ? `${new Date(selectedBooking.scheduledDate).toLocaleDateString('vi-VN')} ${selectedBooking.scheduledTime || ''}`
                      : 'Chưa cập nhật thời gian'}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="h-5 w-5 text-sky-500" />
                  <span>{resolveAddress(selectedBooking)}</span>
                </div>
              </div>

              {selectedBooking.note && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                  <NotebookText className="mr-2 inline h-4 w-4 align-text-top" />
                  Ghi chú: {selectedBooking.note}
                </div>
              )}
              
              {selectedBooking.adminComment && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-700">
                  <AlertCircle className="mr-2 inline h-4 w-4 align-text-top" />
                  Admin: {selectedBooking.adminComment}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {(statusKey === 'CONFIRMED' || statusKey === 'IN_PROGRESS') && (
                  <Link
                    to={`/customer/chat?booking=${selectedBooking.bookingId}`}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-500"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Trao đổi với nhân viên
                  </Link>
                )}
                {/* Nút đánh giá cho booking COMPLETED */}
                {statusKey === 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => handleOpenReviewDialog(selectedBooking)}
                    className="flex-1 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-500 inline-flex items-center justify-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Đánh giá dịch vụ
                  </button>
                )}
                {/* Nút chuyển thành bài post - chỉ hiển thị với AWAITING_EMPLOYEE chưa có title */}
                {statusKey === 'AWAITING_EMPLOYEE' && !selectedBooking.title && (
                  <button
                    type="button"
                    onClick={() => setShowConvertDialog(true)}
                    className="flex-1 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:-translate-y-0.5 hover:bg-indigo-50"
                  >
                    Chuyển thành bài post
                  </button>
                )}
                {canCancelBooking(selectedBooking) && (
                  <button
                    type="button"
                    onClick={() => setShowCancelDialog(true)}
                    className="flex-1 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:-translate-y-0.5 hover:bg-rose-50"
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout
      role="CUSTOMER"
      title="Đơn dịch vụ của bạn"
      description="Theo dõi trạng thái đặt lịch, chủ động trao đổi và quản lý trải nghiệm chăm sóc ngôi nhà của bạn."
      actions={
        <button
          onClick={loadBookings}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-sky-600 shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Làm mới
        </button>
      }
    >
      {/* Debug Info */}
      {import.meta.env.DEV && (
        <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <strong>Debug:</strong> User ID: {user?.id || 'Not logged in'} | Bookings: {bookings.length}
        </div>
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
        <MetricCard
          icon={CalendarClock}
          label="Tổng đơn đã đặt"
          value={`${metrics.total}`}
          accent="navy"
          trendLabel="Lịch trình được cập nhật liên tục."
        />
        <MetricCard
          icon={CheckCircle2}
          label="Đơn hoàn tất"
          value={`${metrics.completed}`}
          accent="teal"
          trendLabel="Cảm ơn bạn đã tin dùng HouseCare Hub."
        />
        <MetricCard
          icon={MessageCircle}
          label="Chờ phân công"
          value={`${metrics.awaiting}`}
          accent="amber"
          trendLabel="Chúng tôi sẽ sắp xếp nhân viên sớm nhất."
        />
      </div>

      <SectionCard
        title="Quản lý trạng thái"
        description="Bộ lọc giúp bạn xem nhanh các đơn theo trạng thái xử lý."
        headerSpacing="compact"
      >
        <div className="mb-6 flex w-full gap-2 overflow-x-auto pb-1">
          {filterOrder.map(filterKey => {
            const palette = statusConfig[filterKey];
            const isActive = selectedFilter === filterKey;
            const count =
              filterKey === 'ALL'
                ? bookings.length
                : bookings.filter(item => normalizeStatus(item.status) === filterKey).length;

            return (
              <button
                key={filterKey}
                onClick={() => setSelectedFilter(filterKey)}
                className={cx(
                  'flex min-w-[150px] flex-col rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5',
                  isActive
                    ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600'
                )}
              >
                <span className="text-sm font-semibold">{palette.label}</span>
                <span className="mt-1 text-xs text-slate-400">Có {count} đơn</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {isLoading || isLoadingServices ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-slate-500">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Đang tải dữ liệu đặt lịch...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 py-16 text-center">
            <CalendarClock className="mb-4 h-10 w-10 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">
              {selectedFilter === 'ALL' 
                ? 'Bạn chưa có đơn dịch vụ nào'
                : 'Chưa có đơn nào ở trạng thái này'}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {selectedFilter === 'ALL'
                ? 'Hãy đặt lịch dịch vụ đầu tiên của bạn để trải nghiệm dịch vụ chăm sóc nhà cửa chuyên nghiệp.'
                : 'Hãy thử thay đổi bộ lọc hoặc đặt lịch dịch vụ mới để giữ cho tổ ấm luôn gọn gàng.'}
            </p>
            <Link
              to="/customer/booking"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-500"
            >
              {selectedFilter === 'ALL' ? 'Đặt dịch vụ đầu tiên' : 'Đặt dịch vụ ngay'}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => {
              const statusKey = normalizeStatus(booking.status);
              const badgePalette = statusConfig[statusKey] || statusConfig.ALL;
              const isPost = statusKey === 'AWAITING_EMPLOYEE' && booking.title;
              const dateText = booking.bookingTime
                ? new Date(booking.bookingTime).toLocaleString('vi-VN')
                : booking.scheduledDate
                ? `${new Date(booking.scheduledDate).toLocaleDateString('vi-VN')} ${booking.scheduledTime || ''}`
                : 'Chưa cập nhật thời gian';

              return (
                <div
                  key={booking.bookingId}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Hiển thị title và image cho booking post */}
                  {isPost && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-indigo-900">{booking.title}</h3>
                          {booking.isVerified === false && (
                            <span className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                              Chờ admin duyệt
                            </span>
                          )}
                          {booking.isVerified === true && (
                            <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Đã duyệt
                            </span>
                          )}
                        </div>
                        {booking.imageUrl && (
                          <img 
                            src={booking.imageUrl} 
                            alt={booking.title}
                            className="h-16 w-16 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-slate-500">Mã đơn</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                          {booking.bookingCode || booking.bookingId}
                        </span>
                      </div>
                      {!isPost && (
                        <h3 className="text-lg font-semibold text-slate-900">
                          {resolveServiceName(booking)}
                        </h3>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-sky-500" />
                          {dateText}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-sky-500" />
                          {resolveAddress(booking)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgePalette.badge}`}>
                        {statusConfig[statusKey]?.label}
                      </span>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <CreditCard className="h-4 w-4 text-emerald-500" />
                        {resolveTotalAmount(booking)}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
                        >
                          Xem chi tiết
                        </button>
                        {statusKey === 'COMPLETED' && (
                          <button
                            onClick={() => handleOpenReviewDialog(booking)}
                            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-500 inline-flex items-center gap-2"
                          >
                            <Star className="h-4 w-4" />
                            Đánh giá
                          </button>
                        )}
                        {(statusKey === 'CONFIRMED' || statusKey === 'IN_PROGRESS') && (
                          <Link
                            to={`/customer/chat?booking=${booking.bookingId}`}
                            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-500"
                          >
                            Liên hệ nhân viên
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {renderDetailSheet()}
      
      {/* Cancel Booking Dialog */}
      {showCancelDialog && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <SectionCard
              title="Xác nhận hủy đơn"
              description={`Đơn ${selectedBooking.bookingCode || selectedBooking.bookingId}`}
              actions={
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelReason('');
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              }
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                  <AlertCircle className="mr-2 inline h-4 w-4 align-text-top" />
                  Bạn có chắc chắn muốn hủy đơn này? Hành động này không thể hoàn tác.
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Lý do hủy (tùy chọn, tối đa 500 ký tự)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    maxLength={500}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    placeholder="Nhập lý do hủy đơn của bạn..."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {cancelReason.length}/500 ký tự
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCancelDialog(false);
                      setCancelReason('');
                    }}
                    disabled={isCancelling}
                    className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelBooking}
                    disabled={isCancelling}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:-translate-y-0.5 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang hủy...
                      </>
                    ) : (
                      'Xác nhận hủy'
                    )}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Convert to Post Dialog */}
      {showConvertDialog && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <SectionCard
              title="Chuyển thành bài post tìm nhân viên"
              description={`Đơn ${selectedBooking.bookingCode || selectedBooking.bookingId}`}
              actions={
                <button
                  onClick={() => {
                    setShowConvertDialog(false);
                    setPostTitle('');
                    setPostImageUrl('');
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              }
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-700">
                  <AlertCircle className="mr-2 inline h-4 w-4 align-text-top" />
                  Thêm tiêu đề và hình ảnh để bài đăng của bạn thu hút hơn với nhân viên.
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tiêu đề bài post <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value.slice(0, 255))}
                    maxLength={255}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="VD: Cần nhân viên dọn dẹp nhà cấp tốc"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {postTitle.length}/255 ký tự
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    URL hình ảnh (tùy chọn)
                  </label>
                  <input
                    type="url"
                    value={postImageUrl}
                    onChange={(e) => setPostImageUrl(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="https://example.com/image.jpg"
                  />
                  {postImageUrl && (
                    <img
                      src={postImageUrl}
                      alt="Preview"
                      className="mt-3 w-full rounded-xl object-cover max-h-48"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConvertDialog(false);
                      setPostTitle('');
                      setPostImageUrl('');
                    }}
                    disabled={isConverting}
                    className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleConvertToPost}
                    disabled={isConverting || !postTitle}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Chuyển thành bài post'
                    )}
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Review Dialog */}
      {showReviewDialog && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-8">
            <SectionCard
              title="Đánh giá dịch vụ"
              description={`Đơn ${selectedBooking.bookingCode || selectedBooking.bookingId}`}
              actions={
                <button
                  onClick={() => {
                    setShowReviewDialog(false);
                    setSelectedBooking(null);
                    setSelectedEmployeeId(null);
                    setReviewComment('');
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              }
            >
              <div className="space-y-5">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                  <Star className="mr-2 inline h-4 w-4 align-text-top" />
                  Đánh giá của bạn giúp chúng tôi cải thiện chất lượng dịch vụ.
                </div>

                {/* Rating Criteria */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Đánh giá chi tiết</h3>
                  {reviewCriteria.map(criteria => (
                    <div key={criteria.criteriaId} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700">
                          {criteria.criteriaName}
                        </span>
                        <span className="text-sm font-semibold text-amber-600">
                          {reviewRatings[criteria.criteriaId] || 5}/5
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => setReviewRatings(prev => ({
                              ...prev,
                              [criteria.criteriaId]: rating
                            }))}
                            className="transition hover:scale-110"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                rating <= (reviewRatings[criteria.criteriaId] || 5)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nhận xét (tùy chọn)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {reviewComment.length}/500 ký tự
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReviewDialog(false);
                      setSelectedBooking(null);
                      setSelectedEmployeeId(null);
                      setReviewComment('');
                    }}
                    disabled={isSubmittingReview}
                    className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingReview ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4" />
                        Gửi đánh giá
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

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export default OrdersPage;
