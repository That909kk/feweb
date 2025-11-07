import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
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
  customerId?: string;
  customerName?: string;
  status: string;
  bookingTime?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  formattedTotalAmount?: string;
  totalPrice?: number;
  createdAt?: string;
  updatedAt?: string;
  note?: string;
  address?: {
    addressId?: string;
    fullAddress?: string;
    ward?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  };
  // Booking Post Feature fields
  title?: string;
  imageUrl?: string; // Deprecated: use imageUrls instead
  imageUrls?: string[]; // Array of image URLs
  isVerified?: boolean;
  adminComment?: string;
  promotion?: {
    promotionId: number;
    promoCode: string;
    description: string;
    discountType: string;
    discountValue: number;
    maxDiscountAmount?: number;
  } | null;
  payment?: {
    paymentId?: string;
    amount?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    transactionCode?: string;
    createdAt?: string;
    paidAt?: string | null;
  } | null;
  assignedEmployees?: Array<{
    employeeId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    avatar?: string;
    rating?: number | null;
    employeeStatus: string;
    skills?: string[];
    bio?: string;
  }>;
  services?: Array<{
    serviceId: number;
    name: string;
    description?: string;
    basePrice?: number;
    unit?: string;
    estimatedDurationHours?: number;
    iconUrl?: string;
    categoryName?: string;
    isActive?: boolean;
  }>;
  [key: string]: any;
};

type StatusKey =
  | 'ALL'
  | 'PENDING'
  | 'AWAITING_EMPLOYEE'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

const statusConfig: Record<StatusKey, { label: string; badge: string }> = {
  ALL: { label: 'Tất cả', badge: 'bg-slate-100 text-slate-700' },
  PENDING: { label: 'Chờ xử lý', badge: 'bg-violet-100 text-violet-700' },
  AWAITING_EMPLOYEE: { label: 'Chờ phân công', badge: 'bg-indigo-100 text-indigo-700' },
  CONFIRMED: { label: 'Đã xác nhận', badge: 'bg-sky-100 text-sky-700' },
  IN_PROGRESS: { label: 'Đang thực hiện', badge: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Đã hoàn thành', badge: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Đã hủy', badge: 'bg-rose-100 text-rose-700' }
};

const filterOrder: StatusKey[] = [
  'ALL',
  'PENDING',
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
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<StatusKey>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<BookingItem | null>(null);
  
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
      
      // Handle paginated response with content array
      if (response && typeof response === 'object' && 'content' in response) {
        const content = (response as any).content;
        if (Array.isArray(content)) {
          console.log('[OrdersPage] Setting bookings from content, count:', content.length);
          setBookings(content as BookingItem[]);
        } else {
          console.log('[OrdersPage] Content is not array, setting empty');
          setBookings([]);
        }
      } else if (Array.isArray(response)) {
        console.log('[OrdersPage] Setting bookings from array response, count:', response.length);
        setBookings(response as BookingItem[]);
      } else {
        console.log('[OrdersPage] Response format unknown, setting empty');
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

  // Prevent body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = selectedBooking !== null || showCancelDialog || showConvertDialog || showReviewDialog;
    
    if (isAnyModalOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        const yPosition = Math.abs(parseInt(scrollY));
        window.scrollTo(0, yPosition);
      }
    }

    return () => {
      // Cleanup on unmount
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        const yPosition = Math.abs(parseInt(scrollY));
        window.scrollTo(0, yPosition);
      }
    };
  }, [selectedBooking, showCancelDialog, showConvertDialog, showReviewDialog]);

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
    // Try to get service name from services array (new API format)
    if (booking.services && booking.services.length > 0) {
      // If multiple services, join their names
      if (booking.services.length === 1) {
        return booking.services[0].name;
      } else {
        return booking.services.map(s => s.name).join(', ');
      }
    }
    return 'Dịch vụ gia đình';
  };

  const resolveAddress = (booking: BookingItem) => {
    if (booking.address?.fullAddress) {
      return booking.address.fullAddress;
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
    if (!bookingToCancel?.bookingId) return;
    
    setIsCancelling(true);
    try {
      await cancelBooking(bookingToCancel.bookingId, cancelReason || undefined);
      // Refresh bookings list
      await loadBookings();
      // Close dialogs
      setShowCancelDialog(false);
      setBookingToCancel(null);
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
    // Get first employee from assignedEmployees array
    const employeeId = booking.assignedEmployees?.[0]?.employeeId;
    
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

    const modalContent = (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}>
        <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
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
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2 -mr-2">
              <div className="space-y-4">{/* Giảm spacing từ 5 xuống 4 */}
                {/* Status badges */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
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
                  <p className="text-xs text-slate-500">
                    {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('vi-VN') : '—'}
                  </p>
                </div>

                {/* Hiển thị title và images cho booking post */}
              {isPost && selectedBooking.title && (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 shadow-sm">
                  {/* Display multiple images or single image */}
                  {(selectedBooking.imageUrls && selectedBooking.imageUrls.length > 0) || selectedBooking.imageUrl ? (
                    <div className={`mb-4 grid gap-3 ${
                      selectedBooking.imageUrls && selectedBooking.imageUrls.length > 1
                        ? selectedBooking.imageUrls.length === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-2 sm:grid-cols-3'
                        : 'grid-cols-1'
                    }`}>
                      {selectedBooking.imageUrls && selectedBooking.imageUrls.length > 0 ? (
                        selectedBooking.imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={url} 
                              alt={`${selectedBooking.title} - Ảnh ${index + 1}`}
                              className="w-full rounded-xl object-cover h-48 shadow-md transition-transform group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                              {index + 1}/{selectedBooking.imageUrls?.length || 0}
                            </div>
                          </div>
                        ))
                      ) : selectedBooking.imageUrl ? (
                        <img 
                          src={selectedBooking.imageUrl} 
                          alt={selectedBooking.title}
                          className="w-full rounded-xl object-cover max-h-80 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2 mb-2">
                    {selectedBooking.services && selectedBooking.services.length > 0 && selectedBooking.services[0].iconUrl && (
                      <img 
                        src={selectedBooking.services[0].iconUrl} 
                        alt={selectedBooking.services[0].name}
                        className="h-6 w-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-sm font-medium text-indigo-600">
                      {selectedBooking.services && selectedBooking.services.length > 0 
                        ? selectedBooking.services[0].name 
                        : 'Dịch vụ'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-indigo-900">{selectedBooking.title}</h3>
                </div>
              )}                {/* Thông tin cơ bản: Dịch vụ & Chi phí */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 border border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Dịch vụ</p>
                    <div className="flex items-center gap-2">
                      {selectedBooking.services && selectedBooking.services.length > 0 && selectedBooking.services[0].iconUrl && (
                        <img 
                          src={selectedBooking.services[0].iconUrl} 
                          alt={selectedBooking.services[0].name}
                          className="h-6 w-6 object-contain flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <p className="text-sm font-bold text-slate-900 line-clamp-2">
                        {resolveServiceName(selectedBooking)}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 border border-emerald-100">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 mb-2">Chi phí</p>
                    <p className="text-lg font-bold text-emerald-700">
                      {resolveTotalAmount(selectedBooking)}
                    </p>
                  </div>
                </div>

              {/* Services Details */}
              {selectedBooking.services && selectedBooking.services.length > 0 && (
                <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-teal-900">
                    Chi tiết dịch vụ ({selectedBooking.services.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedBooking.services.map((service) => (
                      <div 
                        key={service.serviceId}
                        className="flex items-start gap-3 rounded-xl bg-white p-3"
                      >
                        {service.iconUrl && (
                          <img 
                            src={service.iconUrl} 
                            alt={service.name}
                            className="h-12 w-12 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">{service.name}</p>
                              {service.categoryName && (
                                <p className="text-xs text-slate-500">{service.categoryName}</p>
                              )}
                            </div>
                            {service.basePrice && (
                              <p className="text-sm font-semibold text-teal-700">
                                {service.basePrice.toLocaleString('vi-VN')}₫/{service.unit || 'Gói'}
                              </p>
                            )}
                          </div>
                          {service.description && (
                            <p className="mt-1 text-xs text-slate-600">{service.description}</p>
                          )}
                          {service.estimatedDurationHours && (
                            <p className="mt-1 text-xs text-slate-500">
                              Thời gian ước tính: {service.estimatedDurationHours} giờ
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {selectedBooking.payment && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-blue-900">Thông tin thanh toán</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Trạng thái:</span>
                      <span className={`font-semibold ${
                        selectedBooking.payment.paymentStatus === 'PAID' 
                          ? 'text-emerald-700' 
                          : 'text-amber-700'
                      }`}>
                        {selectedBooking.payment.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </span>
                    </div>
                    {selectedBooking.payment.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Phương thức:</span>
                        <span className="font-semibold text-slate-900">{selectedBooking.payment.paymentMethod}</span>
                      </div>
                    )}
                    {selectedBooking.payment.transactionCode && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Mã giao dịch:</span>
                        <span className="font-mono text-xs text-slate-900">{selectedBooking.payment.transactionCode}</span>
                      </div>
                    )}
                    {selectedBooking.payment.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Thanh toán lúc:</span>
                        <span className="text-slate-900">{new Date(selectedBooking.payment.paidAt).toLocaleString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Promotion Information */}
              {selectedBooking.promotion && (
                <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-purple-900">Khuyến mãi áp dụng</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-purple-200 px-2 py-0.5 font-mono text-xs font-semibold text-purple-900">
                        {selectedBooking.promotion.promoCode}
                      </span>
                      <span className="text-slate-600">{selectedBooking.promotion.description}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Giảm: {selectedBooking.promotion.discountType === 'FIXED_AMOUNT' 
                        ? `${selectedBooking.promotion.discountValue.toLocaleString('vi-VN')}₫`
                        : `${selectedBooking.promotion.discountValue}%`
                      }
                      {selectedBooking.promotion.maxDiscountAmount && 
                        ` (tối đa ${selectedBooking.promotion.maxDiscountAmount.toLocaleString('vi-VN')}₫)`
                      }
                    </p>
                  </div>
                </div>
              )}

                {/* Thời gian & Địa chỉ */}
                <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50/50 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <CalendarClock className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-sky-600 mb-1">Thời gian</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedBooking.bookingTime
                          ? new Date(selectedBooking.bookingTime).toLocaleString('vi-VN')
                          : selectedBooking.scheduledDate
                          ? `${new Date(selectedBooking.scheduledDate).toLocaleDateString('vi-VN')} ${selectedBooking.scheduledTime || ''}`
                          : 'Chưa cập nhật thời gian'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-sky-600 mb-1">Địa chỉ</p>
                      <p className="text-sm font-semibold text-slate-900">{resolveAddress(selectedBooking)}</p>
                    </div>
                  </div>
                </div>

                {/* Ghi chú */}
                {selectedBooking.note && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4">
                    <div className="flex items-start gap-2">
                      <NotebookText className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-600 mb-1">Ghi chú từ khách hàng</p>
                        <p className="text-sm text-amber-900">{selectedBooking.note}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedBooking.adminComment && (
                  <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-sky-600 mb-1">Phản hồi từ Admin</p>
                        <p className="text-sm text-sky-900">{selectedBooking.adminComment}</p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Hiển thị danh sách nhân viên được phân công */}
              {selectedBooking.assignedEmployees && selectedBooking.assignedEmployees.length > 0 && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-emerald-900">
                    Nhân viên được phân công ({selectedBooking.assignedEmployees.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedBooking.assignedEmployees.map((employee) => (
                      <div 
                        key={employee.employeeId}
                        className="flex items-center gap-3 rounded-xl bg-white p-3"
                      >
                        {employee.avatar && (
                          <img 
                            src={employee.avatar} 
                            alt={employee.fullName}
                            className="h-12 w-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(employee.fullName);
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{employee.fullName}</p>
                          <p className="text-xs text-slate-500">{employee.email}</p>
                          {employee.phoneNumber && (
                            <p className="text-xs text-slate-500">{employee.phoneNumber}</p>
                          )}
                          {employee.skills && employee.skills.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {employee.skills.map((skill, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {employee.rating !== null && employee.rating !== undefined && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-semibold text-slate-700">{employee.rating}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              </div>{/* Close space-y-4 div */}
            </div>{/* Close overflow-y-auto div */}
            
            {/* Action buttons - sticky at bottom */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
              {(statusKey === 'CONFIRMED' || statusKey === 'IN_PROGRESS') && (
                <Link
                  to={`/customer/chat?booking=${selectedBooking.bookingId}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-500"
                >
                  <MessageCircle className="h-4 w-4" />
                  Trao đổi
                </Link>
              )}
              {statusKey === 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => handleOpenReviewDialog(selectedBooking)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-500"
                >
                  <Star className="h-4 w-4" />
                  Đánh giá
                </button>
              )}
              {statusKey === 'AWAITING_EMPLOYEE' && !selectedBooking.title && (
                <button
                  type="button"
                  onClick={() => setShowConvertDialog(true)}
                  className="flex-1 rounded-full border-2 border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:-translate-y-0.5 hover:bg-indigo-50"
                >
                  Chuyển thành post
                </button>
              )}
              {canCancelBooking(selectedBooking) && (
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(true)}
                  className="flex-1 rounded-full border-2 border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:-translate-y-0.5 hover:bg-rose-50"
                >
                  Hủy đơn
                </button>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
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
          trendLabel="Cảm ơn bạn đã tin dùng dịch vụ của Home Mate."
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

        {isLoading ? (
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
                          <div className="flex items-center gap-2 mb-2">
                            {booking.services && booking.services.length > 0 && booking.services[0].iconUrl && (
                              <img 
                                src={booking.services[0].iconUrl} 
                                alt={booking.services[0].name}
                                className="h-6 w-6 object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span className="text-sm font-medium text-indigo-700">
                              {booking.services && booking.services.length > 0 
                                ? booking.services[0].name 
                                : 'Dịch vụ'}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-indigo-900">{booking.title}</h3>
                          {booking.isVerified === false && (
                            <span className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                              Hệ Thống Đang Xử Lý Yêu Cầu Của Bạn
                            </span>
                          )}
                          {booking.isVerified === true && (
                            <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Đã duyệt
                            </span>
                          )}
                        </div>
                        {/* Display first image as thumbnail */}
                        {(booking.imageUrls && booking.imageUrls.length > 0) || booking.imageUrl ? (
                          <div className="relative">
                            <img 
                              src={booking.imageUrls && booking.imageUrls.length > 0 ? booking.imageUrls[0] : booking.imageUrl!} 
                              alt={booking.title}
                              className="h-16 w-16 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {booking.imageUrls && booking.imageUrls.length > 1 && (
                              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                +{booking.imageUrls.length - 1}
                              </div>
                            )}
                          </div>
                        ) : null}
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
                        <div className="flex items-center gap-2">
                          {booking.services && booking.services.length > 0 && booking.services[0].iconUrl && (
                            <img 
                              src={booking.services[0].iconUrl} 
                              alt={booking.services[0].name}
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <h3 className="text-lg font-semibold text-slate-900">
                            {resolveServiceName(booking)}
                          </h3>
                        </div>
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
                      {/* Hiển thị thông tin nhân viên được phân công */}
                      {booking.assignedEmployees && booking.assignedEmployees.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500">Nhân viên:</span>
                          <div className="flex items-center gap-2">
                            {booking.assignedEmployees.slice(0, 2).map((employee, idx) => (
                              <div key={employee.employeeId} className="flex items-center gap-2">
                                {employee.avatar && (
                                  <img 
                                    src={employee.avatar} 
                                    alt={employee.fullName}
                                    className="h-6 w-6 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(employee.fullName) + '&size=24';
                                    }}
                                  />
                                )}
                                <span className="font-medium text-slate-700">{employee.fullName}</span>
                                {idx < Math.min(booking.assignedEmployees!.length - 1, 1) && (
                                  <span className="text-slate-400">,</span>
                                )}
                              </div>
                            ))}
                            {booking.assignedEmployees.length > 2 && (
                              <span className="text-slate-500">+{booking.assignedEmployees.length - 2} người</span>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Hiển thị số lượng dịch vụ nếu có nhiều dịch vụ */}
                      {!isPost && booking.services && booking.services.length > 1 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
                            {booking.services.length} dịch vụ
                          </span>
                        </div>
                      )}
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
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => {
                              setBookingToCancel(booking);
                              setShowCancelDialog(true);
                            }}
                            className="rounded-full border-2 border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 inline-flex items-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Hủy đơn
                          </button>
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
      {showCancelDialog && bookingToCancel && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-sm" onClick={() => setShowCancelDialog(false)}>
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <SectionCard
              title="Xác nhận hủy đơn"
              description={`Đơn ${bookingToCancel.bookingCode || bookingToCancel.bookingId}`}
              actions={
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setBookingToCancel(null);
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
        </div>, document.body
      )}

      {/* Convert to Post Dialog */}
      {showConvertDialog && selectedBooking && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-sm" onClick={() => setShowConvertDialog(false)}>
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
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
        </div>, document.body
      )}

      {/* Review Dialog */}
      {showReviewDialog && selectedBooking && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-sm overflow-y-auto" onClick={() => setShowReviewDialog(false)}>
          <div className="relative w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
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
        </div>, document.body
      )}
    </DashboardLayout>
  );
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export default OrdersPage;
