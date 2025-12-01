import React, { useEffect, useState, useCallback } from 'react';
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
  Clock,
  List,
  ClipboardList,
  Image as ImageIcon,
  Search,
  Edit
} from 'lucide-react';
import { useBooking } from '../../hooks/useBooking';
import { getAllBookingsApi, updateBookingStatusApi, getAdminBookingByIdApi, searchBookingsApi } from '../../api/admin';
import { DashboardLayout } from '../../layouts';
import { MetricCard, SectionCard } from '../../shared/components';

type BookingPost = {
  bookingId: string;
  bookingCode?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customer?: {
    customerId?: string;
    fullName?: string;
    avatar?: string;
    email?: string;
    phoneNumber?: string;
    isMale?: boolean;
    birthdate?: string;
    rating?: string | null; // LOW, MEDIUM, HIGH
    vipLevel?: number | null;
    [key: string]: any;
  };
  address?: {
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
  bookingTime?: string;
  note?: string | null;
  totalAmount?: number;
  formattedTotalAmount?: string;
  baseAmount?: number;
  totalFees?: number;
  fees?: Array<{
    name?: string;
    type?: string; // PERCENT, FIXED
    value?: number;
    amount?: number;
    systemSurcharge?: boolean;
  }>;
  status: string;
  isVerified?: boolean;
  isPost?: boolean;
  promotion?: {
    promotionId?: string;
    name?: string;
    description?: string;
    discountPercentage?: number;
    discountAmount?: number;
    [key: string]: any;
  } | null;
  payment?: {
    paymentId?: string;
    amount?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    transactionCode?: string;
    createdAt?: string;
    paidAt?: string | null;
    [key: string]: any;
  } | null;
  createdAt?: string;
  title?: string | null;
  imageUrl?: string | null; // Deprecated: use imageUrls or images instead
  imageUrls?: string[] | null; // Array of image URL strings
  images?: Array<{ // Array of image objects (from media service)
    imageId?: string;
    imageUrl?: string;
    url?: string;
    [key: string]: any;
  }>;
  adminComment?: string | null;
  bookingDetails?: Array<{
    bookingDetailId?: string;
    service?: {
      serviceId?: number;
      name?: string;
      description?: string;
      basePrice?: number;
      unit?: string;
      estimatedDurationHours?: number;
      iconUrl?: string;
      categoryName?: string;
      isActive?: boolean;
      [key: string]: any;
    };
    quantity?: number;
    pricePerUnit?: number;
    formattedPricePerUnit?: string;
    subTotal?: number;
    formattedSubTotal?: string;
    selectedChoices?: any[];
    assignments?: Array<{
      assignmentId?: string;
      employee?: {
        employeeId?: string;
        fullName?: string;
        email?: string;
        phoneNumber?: string;
        avatar?: string;
        rating?: string | null; // LOW, MEDIUM, HIGH
        employeeStatus?: string;
        skills?: string[];
        bio?: string;
        [key: string]: any;
      };
      status?: string;
      checkInTime?: string | null;
      checkOutTime?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
      [key: string]: any;
    }>;
    duration?: string;
    formattedDuration?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
};

// Helper function to translate status to Vietnamese
const translateStatus = (status: string | undefined): string => {
  if (!status) return 'Chưa có';
  const translations: { [key: string]: string } = {
    'ASSIGNED': 'Đã phân công',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy',
    'PENDING': 'Chờ xử lý',
    'CONFIRMED': 'Đã xác nhận',
    'AWAITING_EMPLOYEE': 'Chờ nhân viên',
    'PAID': 'Đã thanh toán',
    'FAILED': 'Thất bại',
    'IN_PROGRESS': 'Đang thực hiện'
  };
  return translations[status] || status;
};

// Helper function to calculate booking priority
const getBookingPriority = (booking: BookingPost) => {
  let priority = 0;
  
  // 1. Ưu tiên có hình ảnh (priority càng cao càng lên đầu)
  if ((booking.imageUrls && booking.imageUrls.length > 0) || booking.imageUrl || (booking.images && booking.images.length > 0)) {
    priority += 1000;
  }
  
  // 2. Ưu tiên theo thời gian booking
  if (booking.bookingTime) {
    const now = new Date();
    const bookingTime = new Date(booking.bookingTime);
    const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilBooking >= 4 && hoursUntilBooking <= 14) {
      // Rất gấp: 4-14 giờ
      priority += 500;
    } else if (hoursUntilBooking > 14 && hoursUntilBooking <= 20) {
      // Gấp: 14-20 giờ
      priority += 300;
    }
  }
  
  return priority;
};

// Helper function to get urgency label
const getUrgencyInfo = (booking: BookingPost): { label: string; level: 'urgent' | 'high' | null } | null => {
  if (!booking.bookingTime) return null;
  
  const now = new Date();
  const bookingTime = new Date(booking.bookingTime);
  const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilBooking >= 4 && hoursUntilBooking <= 14) {
    return { label: 'Rất gấp', level: 'urgent' };
  } else if (hoursUntilBooking > 14 && hoursUntilBooking <= 20) {
    return { label: 'Gấp', level: 'high' };
  }
  
  return null;
};

// Helper function to check if booking is expired
const isBookingExpired = (booking: BookingPost): boolean => {
  if (!booking.bookingTime) return false;
  
  const now = new Date();
  const bookingTime = new Date(booking.bookingTime);
  
  return bookingTime < now;
};

const AdminBookingManagement: React.FC = () => {
  const { getUnverifiedBookings, verifyBooking } = useBooking();
  const [activeTab, setActiveTab] = useState<'all' | 'unverified'>('unverified');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [bookings, setBookings] = useState<BookingPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingPost | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(true);
  const [adminComment, setAdminComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBooking, setDetailBooking] = useState<BookingPost | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [allBookingsRaw, setAllBookingsRaw] = useState<BookingPost[]>([]); // Store raw data for client-side filtering
  
  // Status counts for filter buttons
  const [statusCounts, setStatusCounts] = useState<{
    ALL: number;
    PENDING: number;
    CONFIRMED: number;
    AWAITING_EMPLOYEE: number;
    ASSIGNED: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
  }>({
    ALL: 0,
    PENDING: 0,
    CONFIRMED: 0,
    AWAITING_EMPLOYEE: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0
  });
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  
  // Update status modal states
  const [showUpdateStatusDialog, setShowUpdateStatusDialog] = useState(false);
  const [updateStatusBooking, setUpdateStatusBooking] = useState<BookingPost | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusAdminComment, setStatusAdminComment] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const loadUnverifiedBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getUnverifiedBookings({ page: 0, size: 100 });
      const bookingsData = response as BookingPost[];
      
      // Sort by priority: image first, then urgency
      const sortedBookings = [...bookingsData].sort((a, b) => {
        return getBookingPriority(b) - getBookingPriority(a);
      });
      
      setBookings(sortedBookings);
    } catch (err: any) {
      console.error('Failed to load unverified bookings:', err);
      setError('Không thể tải danh sách booking chờ xác minh');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllBookings = async (page: number = 0, status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookingsApi({ 
        page, 
        size: itemsPerPage,
        status: status && status !== 'ALL' ? status : undefined
      });
      // Response theo format mới: { success, data, currentPage, totalItems, totalPages }
      if (response && response.data) {
        setAllBookingsRaw(response.data);
        setTotalPages(response.totalPages || 0);
        setTotalItems(response.totalItems || 0);
        setCurrentPage(response.currentPage || 0);
      } else {
        setAllBookingsRaw([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.error('Failed to load all bookings:', err);
      setError('Không thể tải danh sách tất cả booking');
      setAllBookingsRaw([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Load status counts for filter buttons
  const loadStatusCounts = async () => {
    setIsLoadingCounts(true);
    try {
      const statuses = ['PENDING', 'CONFIRMED', 'AWAITING_EMPLOYEE', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
      
      // Call API for each status to get totalItems
      const countPromises = statuses.map(status => 
        getAllBookingsApi({ page: 0, size: 1, status }).then(res => ({
          status,
          count: res?.totalItems || 0
        })).catch(() => ({ status, count: 0 }))
      );
      
      // Also get total count (ALL)
      const allCountPromise = getAllBookingsApi({ page: 0, size: 1 }).then(res => ({
        status: 'ALL' as const,
        count: res?.totalItems || 0
      })).catch(() => ({ status: 'ALL' as const, count: 0 }));
      
      const results = await Promise.all([allCountPromise, ...countPromises]);
      
      const newCounts = results.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {} as Record<string, number>);
      
      setStatusCounts(prev => ({ ...prev, ...newCounts }));
    } catch (err) {
      console.error('Failed to load status counts:', err);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // Search bookings using API
  const searchBookings = useCallback(async (code: string, page: number = 0) => {
    if (!code.trim()) {
      // Nếu không có search code, load lại tất cả bookings
      loadAllBookings(page, statusFilter);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchBookingsApi({ 
        bookingCode: code.trim(), 
        page, 
        size: itemsPerPage 
      });
      
      if (response && response.data) {
        // Filter thêm theo status nếu có
        let filteredData = response.data;
        if (statusFilter && statusFilter !== 'ALL') {
          filteredData = response.data.filter(b => b.status === statusFilter);
        }
        setAllBookingsRaw(filteredData);
        setTotalPages(response.totalPages || 0);
        setTotalItems(response.totalItems || 0);
        setCurrentPage(response.currentPage || 0);
      } else {
        setAllBookingsRaw([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (err: any) {
      console.error('Failed to search bookings:', err);
      setError('Không thể tìm kiếm booking');
      setAllBookingsRaw([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, statusFilter]);

  // Debounce search
  useEffect(() => {
    if (activeTab !== 'all') return;
    
    const debounceTimer = setTimeout(() => {
      if (searchCode.trim()) {
        searchBookings(searchCode, 0);
      } else {
        loadAllBookings(0, statusFilter);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(debounceTimer);
  }, [searchCode, activeTab]);

  useEffect(() => {
    // Load cả hai loại bookings khi component mount
    loadUnverifiedBookings();
    loadAllBookings();
    loadStatusCounts(); // Load counts for filter buttons
    
    // Cleanup: unlock scroll khi component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    // Reload khi chuyển tab
    setCurrentPage(0);
    setSearchCode(''); // Reset search khi chuyển tab
    if (activeTab === 'all') {
      loadAllBookings(0, statusFilter);
    } else {
      loadUnverifiedBookings();
    }
  }, [activeTab]);

  // Reload khi thay đổi status filter
  useEffect(() => {
    if (activeTab === 'all') {
      setCurrentPage(0);
      if (searchCode.trim()) {
        searchBookings(searchCode, 0);
      } else {
        loadAllBookings(0, statusFilter);
      }
    }
  }, [statusFilter]);

  const handleVerify = async () => {
    if (!selectedBooking?.bookingId) return;

    // Validation: khi từ chối bắt buộc phải có lý do
    if (!isApproving && !adminComment.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      await verifyBooking(selectedBooking.bookingId, {
        approve: isApproving,
        adminComment: isApproving ? adminComment || undefined : undefined,
        rejectionReason: !isApproving ? adminComment : undefined
      });
      
      // Show success message
      setSuccessMessage(
        isApproving 
          ? 'Đã duyệt booking thành công!' 
          : 'Đã từ chối booking thành công!'
      );
      
      // Reload bookings and counts
      await loadUnverifiedBookings();
      loadStatusCounts(); // Reload counts for filter buttons
      
      // Close dialog
      setShowVerifyDialog(false);
      setSelectedBooking(null);
      setAdminComment('');
      setError(null);
      
      // Auto hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to verify booking:', err);
      setError('Không thể xác minh booking. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenUpdateStatusDialog = (booking: BookingPost) => {
    setUpdateStatusBooking(booking);
    setNewStatus(booking.status);
    setStatusAdminComment('');
    setShowUpdateStatusDialog(true);
    // Lock body scroll
    document.body.style.overflow = 'hidden';
  };

  const handleCloseUpdateStatusDialog = () => {
    setShowUpdateStatusDialog(false);
    setUpdateStatusBooking(null);
    setNewStatus('');
    setStatusAdminComment('');
    // Unlock body scroll
    document.body.style.overflow = 'unset';
  };

  const handleViewDetail = async (bookingId: string) => {
    setIsLoadingDetail(true);
    setShowDetailModal(true);
    setDetailBooking(null);
    setError(null);
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    try {
      const bookingDetail = await getAdminBookingByIdApi(bookingId);
      setDetailBooking(bookingDetail);
    } catch (err: any) {
      console.error('Failed to load booking details:', err);
      setError('Không thể tải chi tiết booking');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setDetailBooking(null);
    // Unlock body scroll
    document.body.style.overflow = 'unset';
  };

  const handleUpdateStatus = async () => {
    if (!updateStatusBooking?.bookingId || !newStatus) return;

    setIsProcessing(true);
    setError(null);
    try {
      await updateBookingStatusApi(updateStatusBooking.bookingId, {
        status: newStatus,
        adminComment: statusAdminComment.trim() || undefined
      });
      
      // Show success message
      setSuccessMessage('Cập nhật trạng thái booking thành công!');
      
      // Reload bookings at current page and counts
      await loadAllBookings(currentPage);
      loadStatusCounts(); // Reload counts for filter buttons
      
      // Close dialogs
      setShowUpdateStatusDialog(false);
      setShowConfirmDialog(false);
      setUpdateStatusBooking(null);
      setNewStatus('');
      setStatusAdminComment('');
      setError(null);
      
      // Unlock body scroll
      document.body.style.overflow = 'unset';
      
      // Auto hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update booking status:', err);
      setError('Không thể cập nhật trạng thái booking. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to sort bookings: prioritize active status and time closer to now (future first)
  const sortBookingsForDisplay = (bookingsToSort: BookingPost[]): BookingPost[] => {
    const now = new Date();
    
    return [...bookingsToSort].sort((a, b) => {
      // 1. Ưu tiên trạng thái đang hoạt động (không phải COMPLETED/CANCELLED)
      const isACompleted = a.status === 'COMPLETED' || a.status === 'CANCELLED';
      const isBCompleted = b.status === 'COMPLETED' || b.status === 'CANCELLED';
      
      if (isACompleted !== isBCompleted) {
        return isACompleted ? 1 : -1; // COMPLETED/CANCELLED xuống dưới
      }
      
      // 2. Sắp xếp theo thời gian gần nhất với hiện tại, ưu tiên tương lai
      const timeA = a.bookingTime ? new Date(a.bookingTime).getTime() : 0;
      const timeB = b.bookingTime ? new Date(b.bookingTime).getTime() : 0;
      const nowTime = now.getTime();
      
      const isAFuture = timeA >= nowTime;
      const isBFuture = timeB >= nowTime;
      
      // Ưu tiên tương lai hơn quá khứ
      if (isAFuture !== isBFuture) {
        return isAFuture ? -1 : 1; // Tương lai lên trên
      }
      
      // Cùng loại (cùng tương lai hoặc cùng quá khứ)
      if (isAFuture && isBFuture) {
        // Tương lai: gần nhất lên trên (thời gian nhỏ hơn lên trên)
        return timeA - timeB;
      } else {
        // Quá khứ: gần nhất lên trên (thời gian lớn hơn lên trên)
        return timeB - timeA;
      }
    });
  };

  // Apply filters - giờ đây API đã xử lý search và status filter cho tab 'all'
  let displayBookings: BookingPost[] = [];
  
  if (activeTab === 'all') {
    // Dữ liệu đã được filter từ server (search API hoặc getAllBookings với status)
    // Chỉ sắp xếp khi filter ALL (tất cả trạng thái)
    if (statusFilter === 'ALL') {
      displayBookings = sortBookingsForDisplay(allBookingsRaw);
    } else {
      displayBookings = allBookingsRaw;
    }
  } else {
    // Unverified tab - vẫn dùng client-side filter
    let filtered = bookings;
    
    // Apply search filter cho unverified tab
    if (searchCode.trim()) {
      filtered = filtered.filter(booking => 
        (booking.bookingCode?.toLowerCase().includes(searchCode.toLowerCase())) ||
        (booking.bookingId?.toLowerCase().includes(searchCode.toLowerCase()))
      );
    }
    
    displayBookings = filtered;
  }
  
  // Pagination logic - giờ đây server xử lý pagination cho tab 'all'
  let paginatedBookings = displayBookings;
  let totalPagesDisplay = totalPages || 1;
  let startIndex = currentPage * itemsPerPage;
  let endIndex = startIndex + displayBookings.length;
  let totalItemsDisplay = totalItems || displayBookings.length;
  
  if (activeTab !== 'all') {
    // Client-side pagination cho unverified tab
    totalItemsDisplay = displayBookings.length;
    totalPagesDisplay = Math.ceil(displayBookings.length / itemsPerPage) || 1;
    startIndex = currentPage * itemsPerPage;
    endIndex = Math.min(startIndex + itemsPerPage, displayBookings.length);
    paginatedBookings = displayBookings.slice(startIndex, endIndex);
  }
  
  const metrics = {
    total: activeTab === 'all' ? totalItems : allBookingsRaw.length,
    pending: bookings.filter(b => !b.isVerified).length,
    all: statusCounts.ALL > 0 ? statusCounts.ALL : totalItems,
    awaitingEmployee: statusCounts.AWAITING_EMPLOYEE
  };

  return (
    <>
      <DashboardLayout
        role="ADMIN"
        title="Quản lý Bookings"
        description="Xem tất cả bookings và xác minh các booking chờ phân công"
      >
      <div className="grid gap-6 lg:grid-cols-3">
        <MetricCard
          icon={List}
          label="Tổng tất cả booking"
          value={`${metrics.all}`}
          accent="navy"
          trendLabel="Tất cả booking trong hệ thống"
        />
        <MetricCard
          icon={ClipboardList}
          label="Booking chờ nhận"
          value={`${metrics.awaitingEmployee}`}
          accent="teal"
          trendLabel="Các booking chưa có nhân viên"
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
        title="Danh sách Bookings"
        description={`Tìm kiếm booking theo mã đơn hàng`}
      >
          {/* Search Box and Items Per Page Selector */}
          <div className="mb-6 flex gap-4 items-start">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value);
                  setCurrentPage(0);
                  // Debounce sẽ xử lý việc gọi API search
                }}
                placeholder="Tìm kiếm theo mã đơn hàng..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {searchCode && (
                <button
                  onClick={() => {
                    setSearchCode('');
                    setCurrentPage(0);
                    // Load lại danh sách khi xóa search
                    if (activeTab === 'all') {
                      loadAllBookings(0, statusFilter);
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Items per page selector */}
            {activeTab === 'all' && (
              <div className="flex items-center gap-2 text-sm">
                <label className="text-slate-600 whitespace-nowrap">Hiển thị:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setItemsPerPage(newSize);
                    setCurrentPage(0);
                    // Reload with new page size
                    if (searchCode.trim()) {
                      searchBookings(searchCode, 0);
                    } else {
                      loadAllBookings(0, statusFilter);
                    }
                  }}
                  className="px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-slate-600 whitespace-nowrap">/ trang</span>
              </div>
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
                <CheckCircle2 className="h-5 w-5" />
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

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-slate-200">
            <button
              onClick={() => {
                setActiveTab('unverified');
                setStatusFilter('ALL'); // Reset status filter when switching to unverified
              }}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition ${
                activeTab === 'unverified'
                  ? 'border-b-2 border-brand-navy text-brand-navy'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              Chờ xác minh ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition ${
                activeTab === 'all'
                  ? 'border-b-2 border-brand-navy text-brand-navy'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="h-4 w-4" />
              Tất cả booking ({totalItems})
            </button>
          </div>

          {/* Status Filter Tabs - Only show in 'all' tab */}
          {/* Status Filter Tabs - Only show in 'all' tab */}
          {activeTab === 'all' && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => { setStatusFilter('ALL'); setCurrentPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Tất cả {statusCounts.ALL > 0 && `(${statusCounts.ALL})`}
            </button>
            <button
              onClick={() => { setStatusFilter('PENDING'); setCurrentPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Chờ xử lý {statusCounts.PENDING > 0 && `(${statusCounts.PENDING})`}
            </button>
            <button
              onClick={() => { setStatusFilter('CONFIRMED'); setCurrentPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === 'CONFIRMED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Đã xác nhận {statusCounts.CONFIRMED > 0 && `(${statusCounts.CONFIRMED})`}
            </button>
            <button
              onClick={() => { setStatusFilter('AWAITING_EMPLOYEE'); setCurrentPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === 'AWAITING_EMPLOYEE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              Chờ nhân viên {statusCounts.AWAITING_EMPLOYEE > 0 && `(${statusCounts.AWAITING_EMPLOYEE})`}
            </button>
            <button
              onClick={() => { setStatusFilter('ASSIGNED'); setCurrentPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === 'ASSIGNED'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              Đã phân công {statusCounts.ASSIGNED > 0 && `(${statusCounts.ASSIGNED})`}
            </button>
            <button
              onClick={() => { setStatusFilter('IN_PROGRESS'); setCurrentPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              Đang thực hiện {statusCounts.IN_PROGRESS > 0 && `(${statusCounts.IN_PROGRESS})`}
            </button>
            <button
              onClick={() => { setStatusFilter('COMPLETED'); setCurrentPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === 'COMPLETED'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              Hoàn thành {statusCounts.COMPLETED > 0 && `(${statusCounts.COMPLETED})`}
            </button>
            <button
              onClick={() => { setStatusFilter('CANCELLED'); setCurrentPage(0); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                statusFilter === 'CANCELLED'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Đã hủy {statusCounts.CANCELLED > 0 && `(${statusCounts.CANCELLED})`}
            </button>
            {/* Loading indicator for counts */}
            {isLoadingCounts && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Đang tải...</span>
              </div>
            )}
          </div>
          )}

          {/* Results summary and Top Pagination */}
          {!isLoading && paginatedBookings.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                Hiển thị <span className="font-semibold text-slate-900">{startIndex + 1}-{endIndex}</span> trong tổng <span className="font-semibold text-slate-900">{totalItemsDisplay}</span> kết quả
                {(statusFilter !== 'ALL' || searchCode.trim()) && (
                  <span className="ml-2 text-blue-600">
                    {statusFilter !== 'ALL' && `(Lọc: ${statusFilter === 'AWAITING_EMPLOYEE' ? 'Chờ nhân viên' : translateStatus(statusFilter)})`}
                    {searchCode.trim() && ` (Tìm: "${searchCode}")`}
                  </span>
                )}
              </div>
              
              {/* Top Pagination - Compact version */}
              {totalPagesDisplay > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newPage = Math.max(0, currentPage - 1);
                      if (activeTab === 'all') {
                        if (searchCode.trim()) {
                          searchBookings(searchCode, newPage);
                        } else {
                          loadAllBookings(newPage, statusFilter);
                        }
                      } else {
                        setCurrentPage(newPage);
                      }
                    }}
                    disabled={currentPage === 0}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      currentPage === 0
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ←
                  </button>
                  
                  <span className="text-sm text-slate-600">
                    Trang <span className="font-semibold">{currentPage + 1}</span> / {totalPagesDisplay}
                  </span>
                  
                  <button
                    onClick={() => {
                      const newPage = Math.min(totalPagesDisplay - 1, currentPage + 1);
                      if (activeTab === 'all') {
                        if (searchCode.trim()) {
                          searchBookings(searchCode, newPage);
                        } else {
                          loadAllBookings(newPage, statusFilter);
                        }
                      } else {
                        setCurrentPage(newPage);
                      }
                    }}
                    disabled={currentPage === totalPagesDisplay - 1}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      currentPage === totalPagesDisplay - 1
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-slate-500">
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : paginatedBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 py-16 text-center">
              <CheckCircle2 className="mb-4 h-10 w-10 text-emerald-500" />
              <h3 className="text-lg font-semibold text-slate-900">
                {searchCode || statusFilter !== 'ALL' ? 'Không tìm thấy booking nào' : (activeTab === 'all' ? 'Chưa có booking nào' : 'Không có booking nào chờ xác minh')}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {searchCode || statusFilter !== 'ALL' ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' : (activeTab === 'all' ? 'Hệ thống chưa có booking nào' : 'Tất cả booking posts đã được xử lý')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBookings.map(booking => (
                <div
                  key={booking.bookingId}
                  className="flex flex-col rounded-2xl border border-brand-outline/40 bg-gradient-to-r from-white via-white to-sky-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:gap-5"
                >
                  {/* Image Section - Show first image or thumbnail */}
                  {((booking.imageUrls && booking.imageUrls.length > 0) || booking.imageUrl || (booking.images && booking.images.length > 0)) && (
                    <div className="flex-shrink-0 mb-4 sm:mb-0 relative">
                      <img
                        src={
                          booking.imageUrls && booking.imageUrls.length > 0 
                            ? booking.imageUrls[0] 
                            : booking.imageUrl 
                            ? booking.imageUrl 
                            : booking.images && booking.images.length > 0 
                            ? (booking.images[0].imageUrl || booking.images[0].url || '')
                            : ''
                        }
                        alt={booking.title || 'Booking image'}
                        className="w-full sm:w-32 h-32 rounded-xl object-cover border border-slate-200"
                      />
                      {/* Badge for multiple images */}
                      {((booking.imageUrls && booking.imageUrls.length > 1) || (booking.images && booking.images.length > 1)) && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          +{(booking.imageUrls?.length || booking.images?.length || 1) - 1}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content Section */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-slate-500">Mã đơn</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        {booking.bookingCode || booking.bookingId}
                      </span>
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                        booking.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                        booking.status === 'AWAITING_EMPLOYEE' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                        booking.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' :
                        booking.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700 border border-purple-300' :
                        booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border border-green-300' :
                        'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}>
                        {translateStatus(booking.status)}
                      </span>
                      
                      {/* isPost Badge */}
                      {booking.isPost && (
                        <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-700 border border-sky-300 px-2 py-1 text-xs font-semibold">
                          📢 Post
                        </span>
                      )}
                      
                      {!booking.isVerified && (
                        <span className="inline-flex items-center rounded-full border border-status-warning/30 bg-status-warning/10 px-3 py-1 text-xs font-semibold text-status-warning">
                          Chờ xác minh
                        </span>
                      )}
                      {/* Expired Badge - chỉ hiển thị ở tab unverified */}
                      {activeTab === 'unverified' && isBookingExpired(booking) && (
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold bg-slate-200 text-slate-700 border border-slate-400">
                          <XCircle className="h-3 w-3" />
                          Quá hạn
                        </span>
                      )}
                      {/* Urgency Badge - chỉ hiển thị ở tab unverified và chưa quá hạn */}
                      {activeTab === 'unverified' && !isBookingExpired(booking) && (() => {
                        const urgency = getUrgencyInfo(booking);
                        if (urgency) {
                          return (
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                              urgency.level === 'urgent'
                                ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                                : 'bg-orange-100 text-orange-700 border border-orange-300'
                            }`}>
                              <AlertCircle className="h-3 w-3" />
                              {urgency.label}
                            </span>
                          );
                        }
                        return null;
                      })()}
                      {((booking.imageUrls && booking.imageUrls.length > 0) || booking.imageUrl || (booking.images && booking.images.length > 0)) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          <ImageIcon className="h-3 w-3" />
                          {booking.imageUrls && booking.imageUrls.length > 1 
                            ? `${booking.imageUrls.length} hình ảnh`
                            : booking.images && booking.images.length > 1
                            ? `${booking.images.length} hình ảnh`
                            : 'Có hình ảnh'}
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
                        {booking.customerName || 'N/A'}
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
                      {booking.address && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-sky-500" />
                          {booking.address.fullAddress}
                        </span>
                      )}
                    </div>

                    {booking.note && (
                      <p className="mt-2 text-sm text-slate-600 italic">
                        <span className="font-medium">Ghi chú:</span> {booking.note}
                      </p>
                    )}

                    {/* Price and actions on mobile */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3 sm:hidden">
                      {booking.formattedTotalAmount && (
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <CreditCard className="h-4 w-4 text-emerald-500" />
                          {booking.formattedTotalAmount}
                        </span>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Nút Xem chi tiết */}
                        <button
                          onClick={() => handleViewDetail(booking.bookingId)}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-500"
                        >
                          <List className="h-4 w-4" />
                          Chi tiết
                        </button>

                        {/* Action buttons for mobile */}
                        {activeTab === 'unverified' && (
                          <>
                            {/* Chỉ hiển thị nút Duyệt nếu booking chưa quá hạn */}
                            {!isBookingExpired(booking) && (
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
                            )}
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
                          </>
                        )}
                        
                        {/* Nút Cập nhật trạng thái khi ở tab All - Mobile */}
                        {activeTab === 'all' && (
                          <button
                            onClick={() => handleOpenUpdateStatusDialog(booking)}
                            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-500"
                          >
                            <Edit className="h-4 w-4" />
                            Cập nhật
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price and actions on desktop */}
                  <div className="hidden sm:flex sm:flex-col sm:items-end sm:justify-between sm:gap-3">
                    {booking.formattedTotalAmount && (
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <CreditCard className="h-4 w-4 text-emerald-500" />
                        {booking.formattedTotalAmount}
                      </span>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {/* Nút Xem chi tiết */}
                      <button
                        onClick={() => handleViewDetail(booking.bookingId)}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-500"
                      >
                        <List className="h-4 w-4" />
                        Chi tiết
                      </button>

                      {/* Chỉ hiển thị nút Duyệt/Từ chối khi ở tab Unverified */}
                      {activeTab === 'unverified' && (
                        <>
                          {/* Chỉ hiển thị nút Duyệt nếu booking chưa quá hạn */}
                          {!isBookingExpired(booking) && (
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
                          )}
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
                        </>
                      )}
                      
                      {/* Nút Cập nhật trạng thái khi ở tab All */}
                      {activeTab === 'all' && (
                        <button
                          onClick={() => handleOpenUpdateStatusDialog(booking)}
                          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-500"
                        >
                          <Edit className="h-4 w-4" />
                          Cập nhật
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Pagination UI */}
          {!isLoading && paginatedBookings.length > 0 && totalPagesDisplay > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => {
                  const newPage = Math.max(0, currentPage - 1);
                  if (activeTab === 'all') {
                    if (searchCode.trim()) {
                      searchBookings(searchCode, newPage);
                    } else {
                      loadAllBookings(newPage, statusFilter);
                    }
                  } else {
                    setCurrentPage(newPage);
                  }
                }}
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
                {Array.from({ length: Math.min(totalPagesDisplay, 10) }, (_, i) => {
                  // Show first 5, last 5, or pages around current for large page counts
                  let pageNum = i;
                  if (totalPagesDisplay > 10) {
                    if (currentPage < 5) {
                      pageNum = i;
                    } else if (currentPage > totalPagesDisplay - 6) {
                      pageNum = totalPagesDisplay - 10 + i;
                    } else {
                      pageNum = currentPage - 4 + i;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => {
                        if (activeTab === 'all') {
                          if (searchCode.trim()) {
                            searchBookings(searchCode, pageNum);
                          } else {
                            loadAllBookings(pageNum, statusFilter);
                          }
                        } else {
                          setCurrentPage(pageNum);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => {
                  const newPage = Math.min(totalPagesDisplay - 1, currentPage + 1);
                  if (activeTab === 'all') {
                    if (searchCode.trim()) {
                      searchBookings(searchCode, newPage);
                    } else {
                      loadAllBookings(newPage, statusFilter);
                    }
                  } else {
                    setCurrentPage(newPage);
                  }
                }}
                disabled={currentPage === totalPagesDisplay - 1}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  currentPage === totalPagesDisplay - 1
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                Sau →
              </button>
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
                  {error && (
                    <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                      <AlertCircle className="h-5 w-5" />
                      {error}
                    </div>
                  )}

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
                      {!isApproving && <span className="ml-1 text-rose-500">*</span>}
                    </label>
                    <textarea
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      maxLength={500}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      placeholder={isApproving ? "Nhập ghi chú..." : "Nhập lý do từ chối (bắt buộc)..."}
                      required={!isApproving}
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
                      disabled={isProcessing || (!isApproving && !adminComment.trim())}
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

      {/* Detail Modal - Moved outside DashboardLayout */}
      {showDetailModal && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={handleCloseDetailModal}
        >
          <div className="min-h-screen flex items-start justify-center p-4">
            <div 
              className="relative w-full max-w-4xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <SectionCard
                title="Chi tiết Booking"
                description={isLoadingDetail ? "Đang tải..." : (detailBooking?.bookingCode ? `Mã đơn: ${detailBooking.bookingCode}` : '')}
                actions={
                  <button
                    onClick={handleCloseDetailModal}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                }
              >
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-slate-600">Đang tải chi tiết booking...</span>
                  </div>
                ) : detailBooking ? (() => {
                  const booking = detailBooking;
                  return (
                <div className="space-y-6">
                  {/* Thông tin khách hàng */}
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Thông tin khách hàng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Avatar và tên */}
                      {booking.customer?.avatar && (
                        <div className="md:col-span-2 flex items-center gap-3">
                          <img 
                            src={booking.customer.avatar} 
                            alt={booking.customer.fullName || booking.customerName || 'Customer'}
                            className="h-16 w-16 rounded-full object-cover border-2 border-blue-200"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 text-base">
                              {booking.customer.fullName || booking.customerName || 'Chưa có'}
                            </p>
                            {booking.customer?.rating && (
                              <p className={`text-sm font-medium ${
                                booking.customer.rating === 'HIGH' ? 'text-emerald-600' :
                                booking.customer.rating === 'MEDIUM' ? 'text-amber-600' :
                                booking.customer.rating === 'LOW' ? 'text-rose-600' :
                                'text-slate-600'
                              }`}>
                                ⭐ {booking.customer.rating === 'HIGH' ? 'Cao' : booking.customer.rating === 'MEDIUM' ? 'Trung bình' : booking.customer.rating === 'LOW' ? 'Thấp' : booking.customer.rating}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-slate-500">Tên:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {booking.customer?.fullName || booking.customerName || 'Chưa có'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-slate-500">ID:</span>
                        <span className="ml-2 font-medium text-slate-700 text-xs">
                          {booking.customer?.customerId || booking.customerId || 'Chưa có'}
                        </span>
                      </div>
                      
                      {(booking.customer?.phoneNumber || booking.customerPhone) && (
                        <div>
                          <span className="text-slate-500">SĐT:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {booking.customer?.phoneNumber || booking.customerPhone}
                          </span>
                        </div>
                      )}
                      
                      {(booking.customer?.email || booking.customerEmail) && (
                        <div>
                          <span className="text-slate-500">Email:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {booking.customer?.email || booking.customerEmail}
                          </span>
                        </div>
                      )}
                      
                      {booking.customer?.birthdate && (
                        <div>
                          <span className="text-slate-500">Ngày sinh:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {new Date(booking.customer.birthdate).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                      
                      {booking.customer?.isMale !== undefined && (
                        <div>
                          <span className="text-slate-500">Giới tính:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {booking.customer.isMale ? 'Nam' : 'Nữ'}
                          </span>
                        </div>
                      )}
                      
                      {booking.customer?.vipLevel !== undefined && booking.customer?.vipLevel !== null && (
                        <div className="md:col-span-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1 text-sm font-semibold text-white shadow-lg">
                            👑 VIP Level {booking.customer.vipLevel}
                          </span>
                        </div>
                      )}
                      
                      {booking.customer?.rating && (
                        <div>
                          <span className="text-slate-500">Đánh giá:</span>
                          <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            booking.customer.rating === 'HIGH' ? 'bg-emerald-100 text-emerald-700' :
                            booking.customer.rating === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                            booking.customer.rating === 'LOW' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {booking.customer.rating === 'HIGH' ? '⭐ Cao' : 
                             booking.customer.rating === 'MEDIUM' ? '⭐ Trung bình' : 
                             booking.customer.rating === 'LOW' ? '⭐ Thấp' : booking.customer.rating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      Địa chỉ
                    </h3>
                    <p className="text-sm text-slate-700">{booking.address?.fullAddress || 'Chưa có'}</p>
                    {booking.address?.ward && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-500">Phường/Xã:</span>
                          <span className="ml-1 font-medium">{booking.address.ward}</span>
                        </div>
                        {booking.address.district && (
                          <div>
                            <span className="text-slate-500">Quận/Huyện:</span>
                            <span className="ml-1 font-medium">{booking.address.district}</span>
                          </div>
                        )}
                        {booking.address.city && (
                          <div>
                            <span className="text-slate-500">Tỉnh/TP:</span>
                            <span className="ml-1 font-medium">{booking.address.city}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Thời gian */}
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <CalendarClock className="h-5 w-5 text-amber-600" />
                      Thời gian
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Thời gian booking:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {booking.bookingTime ? new Date(booking.bookingTime).toLocaleString('vi-VN') : 'Chưa có'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Tạo lúc:</span>
                        <span className="ml-2 font-medium text-slate-900">
                          {booking.createdAt ? new Date(booking.createdAt).toLocaleString('vi-VN') : 'Chưa có'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ghi chú */}
                  {booking.note && (
                    <div className="border-b border-slate-200 pb-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-purple-600" />
                        Ghi chú
                      </h3>
                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{booking.note}</p>
                    </div>
                  )}

                  {/* Dịch vụ */}
                  {booking.bookingDetails && booking.bookingDetails.length > 0 && (
                    <div className="border-b border-slate-200 pb-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-indigo-600" />
                        Dịch vụ đã chọn
                      </h3>
                      <div className="space-y-3">
                        {booking.bookingDetails.map((detail, index) => (
                          <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            {/* Service info */}
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="font-semibold text-slate-900 mb-1">
                                  {detail.service?.name || 'Chưa có'}
                                </div>
                                {detail.service?.description && (
                                  <p className="text-xs text-slate-500 mb-2">{detail.service.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                  {detail.service?.categoryName && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                      {detail.service.categoryName}
                                    </span>
                                  )}
                                  {detail.duration && (
                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                      ⏱️ {detail.duration}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {detail.service?.iconUrl && (
                                <img src={detail.service.iconUrl} alt="" className="h-12 w-12 object-cover rounded ml-3" />
                              )}
                            </div>
                            
                            {/* Pricing */}
                            <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t border-slate-200">
                              <div>
                                <span className="text-slate-500">Số lượng:</span>
                                <span className="ml-2 font-medium text-slate-900">{detail.quantity || 1}</span>
                              </div>
                              <div>
                                <span className="text-slate-500">Đơn giá:</span>
                                <span className="ml-2 font-medium text-slate-900">
                                  {detail.formattedPricePerUnit || detail.pricePerUnit || 'Chưa có'}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-500">Tổng:</span>
                                <span className="ml-2 font-bold text-emerald-600 text-base">
                                  {detail.formattedSubTotal || detail.subTotal || 'Chưa có'}
                                </span>
                              </div>
                            </div>

                            {/* Assignments */}
                            {detail.assignments && detail.assignments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <div className="text-xs font-semibold text-slate-700 mb-2">
                                  👷 Nhân viên được phân công ({detail.assignments.length})
                                </div>
                                <div className="space-y-2">
                                  {detail.assignments.map((assignment, aIndex) => (
                                    <div key={aIndex} className="bg-white p-2 rounded border border-slate-200">
                                      <div className="flex items-center gap-2">
                                        {assignment.employee?.avatar && (
                                          <img 
                                            src={assignment.employee.avatar} 
                                            alt={assignment.employee.fullName}
                                            className="h-8 w-8 rounded-full object-cover"
                                          />
                                        )}
                                        <div className="flex-1 text-xs">
                                          <div className="font-medium text-slate-900 flex items-center gap-1">
                                            {assignment.employee?.fullName || 'Chưa có'}
                                            {assignment.employee?.rating && (
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                assignment.employee.rating === 'HIGH' ? 'bg-emerald-100 text-emerald-700' :
                                                assignment.employee.rating === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                assignment.employee.rating === 'LOW' ? 'bg-rose-100 text-rose-700' :
                                                'bg-slate-100 text-slate-700'
                                              }`}>
                                                ⭐ {assignment.employee.rating === 'HIGH' ? 'Cao' : assignment.employee.rating === 'MEDIUM' ? 'TB' : assignment.employee.rating === 'LOW' ? 'Thấp' : assignment.employee.rating}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-slate-500">
                                            {assignment.employee?.phoneNumber || assignment.employee?.email || ''}
                                          </div>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          assignment.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                                          assignment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                          assignment.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                                          assignment.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' :
                                          assignment.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                          'bg-slate-100 text-slate-700'
                                        }`}>
                                          {translateStatus(assignment.status)}
                                        </span>
                                      </div>
                                      
                                      {/* Check-in/Check-out times */}
                                      {(assignment.checkInTime || assignment.checkOutTime) && (
                                        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-500">
                                          {assignment.checkInTime && (
                                            <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                                              🕐 In: {new Date(assignment.checkInTime).toLocaleString('vi-VN')}
                                            </span>
                                          )}
                                          {assignment.checkOutTime && (
                                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                              🕐 Out: {new Date(assignment.checkOutTime).toLocaleString('vi-VN')}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      
                                      {assignment.employee?.skills && assignment.employee.skills.length > 0 && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                          {assignment.employee.skills.map((skill, sIndex) => (
                                            <span key={sIndex} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                                              {skill}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tổng tiền và trạng thái */}
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                      Thanh toán & Trạng thái
                    </h3>
                    
                    {/* Promotion if exists */}
                    {booking.promotion && (
                      <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-purple-900">🎁 Khuyến mãi</span>
                        </div>
                        <div className="text-sm text-purple-700">
                          {booking.promotion.name || 'Chưa có'}
                          {booking.promotion.discountPercentage && (
                            <span className="ml-2 font-semibold">(-{booking.promotion.discountPercentage}%)</span>
                          )}
                          {booking.promotion.discountAmount && (
                            <span className="ml-2 font-semibold">(-{booking.promotion.discountAmount}đ)</span>
                          )}
                        </div>
                        {booking.promotion.description && (
                          <p className="text-xs text-purple-600 mt-1">{booking.promotion.description}</p>
                        )}
                      </div>
                    )}

                    {/* Chi tiết giá */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3">
                      <div className="space-y-2 text-sm">
                        {booking.baseAmount !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">Giá gốc:</span>
                            <span className="font-medium text-slate-900">
                              {booking.baseAmount?.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        )}
                        
                        {/* Hiển thị các khoản phí */}
                        {booking.fees && booking.fees.length > 0 && (
                          <div className="border-t border-slate-200 pt-2 mt-2">
                            {booking.fees.map((fee, idx) => (
                              <div key={idx} className="flex justify-between text-xs">
                                <span className="text-slate-500">
                                  {fee.name || 'Phí'} 
                                  {fee.type === 'PERCENT' && fee.value ? ` (${(fee.value * 100).toFixed(0)}%)` : ''}
                                </span>
                                <span className={`font-medium ${fee.systemSurcharge ? 'text-amber-600' : 'text-slate-700'}`}>
                                  +{fee.amount?.toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {booking.totalFees !== undefined && booking.totalFees > 0 && (
                          <div className="flex justify-between text-xs border-t border-slate-200 pt-2">
                            <span className="text-slate-500">Tổng phí:</span>
                            <span className="font-medium text-amber-600">
                              +{booking.totalFees?.toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between border-t border-slate-300 pt-2 mt-2">
                          <span className="font-semibold text-slate-700">Tổng cộng:</span>
                          <span className="font-bold text-emerald-600 text-lg">
                            {booking.formattedTotalAmount || `${booking.totalAmount?.toLocaleString('vi-VN')}đ` || 'Chưa có'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Trạng thái:</span>
                        <span className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                          booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          booking.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                          booking.status === 'AWAITING_EMPLOYEE' ? 'bg-blue-100 text-blue-700' :
                          booking.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-700' :
                          booking.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' :
                          booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {translateStatus(booking.status)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Xác minh:</span>
                        <span className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          booking.isVerified 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {booking.isVerified ? '✓ Đã duyệt' : '⏳ Chưa duyệt'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Loại:</span>
                        <span className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          booking.isPost 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {booking.isPost ? '📢 Booking Post' : '📋 Booking thường'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Payment details */}
                    {booking.payment && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="font-semibold text-slate-700 mb-2 text-sm">Thông tin thanh toán</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Phương thức:</span>
                            <span className="ml-2 font-medium text-slate-900">
                              {booking.payment.paymentMethod || 'Chưa có'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Trạng thái:</span>
                            <span className={`ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                              booking.payment.paymentStatus === 'COMPLETED' || booking.payment.paymentStatus === 'PAID' 
                                ? 'bg-emerald-100 text-emerald-700' :
                              booking.payment.paymentStatus === 'PENDING' 
                                ? 'bg-amber-100 text-amber-700' :
                              booking.payment.paymentStatus === 'CANCELLED' || booking.payment.paymentStatus === 'FAILED'
                                ? 'bg-rose-100 text-rose-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {translateStatus(booking.payment.paymentStatus)}
                            </span>
                          </div>
                          {booking.payment.transactionCode && (
                            <div className="md:col-span-2">
                              <span className="text-slate-500">Mã giao dịch:</span>
                              <span className="ml-2 font-mono text-slate-900 text-xs">
                                {booking.payment.transactionCode}
                              </span>
                            </div>
                          )}
                          {booking.payment.amount && (
                            <div>
                              <span className="text-slate-500">Số tiền:</span>
                              <span className="ml-2 font-semibold text-emerald-600">
                                {booking.payment.amount.toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          )}
                          {booking.payment.paidAt && (
                            <div>
                              <span className="text-slate-500">Thanh toán lúc:</span>
                              <span className="ml-2 font-medium text-slate-900">
                                {new Date(booking.payment.paidAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Admin comment if exists */}
                    {booking.adminComment && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="text-xs font-semibold text-amber-900 mb-1">💬 Ghi chú của hệ thống:</div>
                        <p className="text-sm text-amber-700">{booking.adminComment}</p>
                      </div>
                    )}
                  </div>

                  {/* Hình ảnh */}
                  {((booking.images && booking.images.length > 0) || (booking.imageUrls && booking.imageUrls.length > 0) || booking.imageUrl) && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-pink-600" />
                        Hình ảnh {booking.images ? `(${booking.images.length})` : booking.imageUrls ? `(${booking.imageUrls.length})` : '(1)'}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {booking.images && booking.images.length > 0 ? (
                          booking.images.map((image, index) => (
                            <div key={index} className="relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition">
                              <img
                                src={image.imageUrl || image.url}
                                alt={`Booking image ${index + 1}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ))
                        ) : booking.imageUrls && booking.imageUrls.length > 0 ? (
                          booking.imageUrls.map((url, index) => (
                            <div key={index} className="relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition">
                              <img
                                src={url}
                                alt={`Booking image ${index + 1}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {index + 1}/{booking.imageUrls?.length || 0}
                              </div>
                            </div>
                          ))
                        ) : booking.imageUrl ? (
                          <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm hover:shadow-md hover:scale-105 transition">
                            <img
                              src={booking.imageUrl}
                              alt="Booking image"
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Nút đóng ở cuối */}
                  <div className="flex justify-center pt-6 border-t border-slate-200">
                    <button
                      onClick={handleCloseDetailModal}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-500"
                    >
                      <X className="h-4 w-4" />
                      Đóng
                    </button>
                  </div>
                </div>
                );
                })() : (
                  <div className="text-center py-8 text-slate-500">
                    Không có dữ liệu
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      )}
      
      {/* Update Status Dialog */}
      {showUpdateStatusDialog && updateStatusBooking && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  Cập nhật trạng thái Booking
                </h3>
                <button
                  onClick={handleCloseUpdateStatusDialog}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 rounded-lg bg-slate-50 p-3">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Mã đơn:</span> {updateStatusBooking.bookingCode || updateStatusBooking.bookingId}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  <span className="font-semibold">Trạng thái hiện tại:</span>{' '}
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    updateStatusBooking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                    updateStatusBooking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    updateStatusBooking.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                    updateStatusBooking.status === 'AWAITING_EMPLOYEE' ? 'bg-blue-100 text-blue-700' :
                    updateStatusBooking.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-700' :
                    updateStatusBooking.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-700' :
                    updateStatusBooking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {translateStatus(updateStatusBooking.status)}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                {/* Status Selection */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Trạng thái mới <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="AWAITING_EMPLOYEE">Chờ nhân viên</option>
                    <option value="ASSIGNED">Đã phân công</option>
                    <option value="IN_PROGRESS">Đang thực hiện</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>

                {/* Admin Comment */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Ghi chú quản trị viên
                  </label>
                  <textarea
                    value={statusAdminComment}
                    onChange={(e) => setStatusAdminComment(e.target.value)}
                    placeholder="Nhập ghi chú về việc thay đổi trạng thái (tùy chọn)"
                    rows={3}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCloseUpdateStatusDialog}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  disabled={isProcessing}
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (!newStatus) {
                      setError('Vui lòng chọn trạng thái mới');
                      return;
                    }
                    setShowConfirmDialog(true);
                  }}
                  disabled={isProcessing || !newStatus}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </span>
                  ) : (
                    'Xác nhận'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && updateStatusBooking && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Xác nhận thay đổi
                </h3>
              </div>

              <p className="mb-6 text-sm text-slate-600">
                Bạn có chắc chắn muốn thay đổi trạng thái booking từ{' '}
                <span className="font-semibold text-slate-900">
                  {translateStatus(updateStatusBooking.status)}
                </span>{' '}
                sang{' '}
                <span className="font-semibold text-slate-900">
                  {translateStatus(newStatus)}
                </span>
                ?
              </p>

              {statusAdminComment && (
                <div className="mb-4 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Ghi chú:</p>
                  <p className="text-sm text-slate-600">{statusAdminComment}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  disabled={isProcessing}
                >
                  Không
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang cập nhật...
                    </span>
                  ) : (
                    'Có, thay đổi'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminBookingManagement;
