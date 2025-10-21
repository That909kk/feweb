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
  X
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../hooks/useBooking';
import { useServices } from '../../hooks/useServices';
import { MetricCard, SectionCard } from '../../shared/components';

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
  const { getCustomerBookings } = useBooking();
  const { services, isLoading: isLoadingServices } = useServices();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<StatusKey>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCustomerBookings(user.id);
      if (Array.isArray(response)) {
        setBookings(response as BookingItem[]);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      setError('Không thể tải danh sách đơn dịch vụ. Vui lòng thử lại sau.');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user?.id]);

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

  const renderDetailSheet = () => {
    if (!selectedBooking) return null;
    const statusKey = normalizeStatus(selectedBooking.status);
    const badgePalette = statusConfig[statusKey] || statusConfig.ALL;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm">
        <div className="relative w-full max-w-2xl">
          <SectionCard
            title={`Đơn ${selectedBooking.bookingCode || selectedBooking.bookingId}`}
            description="Chi tiết lịch đặt của bạn"
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
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgePalette.badge}`}>
                  {statusConfig[statusKey]?.label}
                </span>
                <p className="text-sm text-slate-500">
                  Tạo lúc {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString('vi-VN') : '—'}
                </p>
              </div>

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
                {statusKey === 'AWAITING_EMPLOYEE' && (
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:-translate-y-0.5"
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
            <h3 className="text-lg font-semibold text-slate-900">Chưa có đơn nào ở trạng thái này</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Hãy thử thay đổi bộ lọc hoặc đặt lịch dịch vụ mới để giữ cho tổ ấm luôn gọn gàng.
            </p>
            <Link
              to="/customer/booking"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-500"
            >
              Đặt dịch vụ ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => {
              const statusKey = normalizeStatus(booking.status);
              const badgePalette = statusConfig[statusKey] || statusConfig.ALL;
              const dateText = booking.bookingTime
                ? new Date(booking.bookingTime).toLocaleString('vi-VN')
                : booking.scheduledDate
                ? `${new Date(booking.scheduledDate).toLocaleDateString('vi-VN')} ${booking.scheduledTime || ''}`
                : 'Chưa cập nhật thời gian';

              return (
                <div
                  key={booking.bookingId}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-slate-500">Mã đơn</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        {booking.bookingCode || booking.bookingId}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {resolveServiceName(booking)}
                    </h3>
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
              );
            })}
          </div>
        )}
      </SectionCard>

      {renderDetailSheet()}
    </DashboardLayout>
  );
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export default OrdersPage;
