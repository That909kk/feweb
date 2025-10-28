import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CalendarHeart,
  CheckCircle2,
  Clock,
  Droplets,
  Heart,
  MapPin,
  MessageCircle,
  Sparkles,
  Users,
  UtensilsCrossed
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { useServices } from '../../hooks/useServices';
import { useBooking } from '../../hooks/useBooking';
import { MetricCard, SectionCard } from '../../shared/components';

type CustomerBooking = {
  bookingId: string;
  bookingCode?: string;
  status: string;
  bookingTime?: string;
  formattedTotalAmount?: string;
  totalPrice?: number;
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
};

const statusBadgeMap: Record<string, string> = {
  COMPLETED: 'border border-status-success/30 bg-status-success/10 text-status-success',
  CONFIRMED: 'border border-brand-teal/30 bg-brand-teal/10 text-brand-teal',
  IN_PROGRESS: 'border border-status-warning/30 bg-status-warning/10 text-status-warning',
  AWAITING_EMPLOYEE: 'border border-status-info/30 bg-status-info/10 text-status-info',
  PENDING: 'border border-brand-outline/40 bg-brand-outline/20 text-brand-navy',
  CANCELLED: 'border border-status-danger/30 bg-status-danger/10 text-status-danger',
  default: 'border border-brand-outline/40 bg-brand-outline/20 text-brand-text/70'
};

const statusLabelMap: Record<string, string> = {
  COMPLETED: 'Đã hoàn thành',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  AWAITING_EMPLOYEE: 'Chờ phân công',
  PENDING: 'Đang chờ',
  CANCELLED: 'Đã hủy'
};

const serviceIconFallback: Record<string, React.ComponentType<{ className?: string }>> = {
  cleaning: Sparkles,
  cooking: UtensilsCrossed,
  laundry: Droplets,
  childcare: Users,
  care: Heart,
  default: Sparkles
};

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { services, isLoading: isLoadingServices, error: servicesError } = useServices();
  const { getCustomerBookings } = useBooking();
  const [recentBookings, setRecentBookings] = useState<CustomerBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  useEffect(() => {
    const loadRecentBookings = async () => {
      if (!user?.id) return;

      setIsLoadingBookings(true);
      try {
        const bookings = await getCustomerBookings(user.id);
        if (Array.isArray(bookings)) {
          setRecentBookings(bookings as CustomerBooking[]);
        }
      } catch (error) {
        console.error('Load customer bookings error:', error);
        setRecentBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    };

    loadRecentBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const firstName = useMemo(() => {
    if (!user?.fullName) return 'Khách hàng';
    const parts = user.fullName.trim().split(' ');
    return parts[parts.length - 1] || user.fullName;
  }, [user]);

  const metrics = useMemo(() => {
    const total = recentBookings.length;
    const completed = recentBookings.filter(item => item.status === 'COMPLETED').length;
    const awaiting = recentBookings.filter(item => item.status === 'AWAITING_EMPLOYEE' || item.status === 'PENDING').length;

    return {
      total,
      completed,
      awaiting
    };
  }, [recentBookings]);

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return recentBookings
      .filter(item => {
        if (!item.bookingTime) return false;
        return new Date(item.bookingTime) >= now;
      })
      .sort((a, b) => (a.bookingTime || '').localeCompare(b.bookingTime || ''))
      .slice(0, 3);
  }, [recentBookings]);

  const featuredServices = useMemo(() => services.slice(0, 4), [services]);

  const renderStatusBadge = (status: string) => {
    const badgeClass = statusBadgeMap[status] || statusBadgeMap.default;
    const label = statusLabelMap[status] || status;
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
        {label}
      </span>
    );
  };

  return (
    <DashboardLayout
      role="CUSTOMER"
      title={`Chào ${firstName}`}
      description="Theo dõi lịch dọn dẹp, quản lý đơn đã đặt và khám phá thêm dịch vụ phù hợp với gia đình bạn."
      actions={
        <Link
          to="/customer/booking"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-teal shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-50"
        >
          <CalendarHeart className="h-4 w-4" />
          Đặt lịch mới
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <MetricCard
          icon={CalendarClock}
          label="Tổng đơn đã đặt"
          value={`${metrics.total}`}
          accent="navy"
          trendLabel="Lịch của bạn luôn được cập nhật."
        />
        <MetricCard
          icon={CheckCircle2}
          label="Đơn hoàn tất"
          value={`${metrics.completed}`}
          accent="teal"
          trendLabel="Giữ thói quen chăm nhà đều đặn nào!"
        />
        <MetricCard
          icon={Sparkles}
          label="Đang chờ xử lý"
          value={`${metrics.awaiting}`}
          accent="amber"
          trendLabel="Ưu tiên xử lý trong hôm nay."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Đơn sắp diễn ra"
          description="Theo dõi các dịch vụ sẽ diễn ra trong vài ngày tới."
          className="lg:col-span-2"
        >
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-10 text-brand-text/60">
              <CalendarClock className="mr-2 h-5 w-5 animate-spin" />
              Đang tải lịch hẹn...
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="rounded-2xl bg-brand-background/70 p-6 text-center text-brand-text/60">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-brand-text/50" />
              <p>Bạn chưa có lịch hẹn nào sắp tới. Đặt dịch vụ ngay để giữ nhà luôn gọn gàng nhé!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => {
                const serviceName = booking.serviceDetails?.[0]?.service.name || 'Dịch vụ gia đình';
                const startTime = booking.bookingTime ? new Date(booking.bookingTime) : null;
                return (
                  <div
                    key={booking.bookingId}
                    className="flex flex-col justify-between rounded-2xl border border-brand-outline/40 bg-gradient-to-r from-white via-white to-sky-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-brand-navy">{serviceName}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-brand-text/70">
                        {startTime && (
                          <>
                            <span className="inline-flex items-center gap-2">
                              <CalendarClock className="h-4 w-4 text-sky-500" />
                              {startTime.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Clock className="h-4 w-4 text-sky-500" />
                              {startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                        {booking.customerInfo?.fullAddress && (
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-sky-500" />
                            {booking.customerInfo.fullAddress}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col items-end gap-2 sm:mt-0 sm:items-end">
                      {renderStatusBadge(booking.status)}
                      {booking.formattedTotalAmount && (
                        <span className="text-sm font-semibold text-slate-700">
                          {booking.formattedTotalAmount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Hỗ trợ nhanh"
          description="Đội ngũ CSKH luôn sẵn sàng hỗ trợ bạn 24/7."
        >
          <div className="rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navyHover to-brand-teal p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold">Trò chuyện cùng HomeCare</h4>
                <p className="mt-1 text-sm text-white/80">
                  Kết nối trực tiếp với nhân viên hỗ trợ hoặc người lao động đã nhận việc.
                </p>
              </div>
            </div>
            <Link
              to="/customer/chat"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-teal shadow-inner transition hover:-translate-y-0.5"
            >
              Mở trung tâm hỗ trợ
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Dịch vụ đề xuất cho bạn"
        description="Các dịch vụ phổ biến giúp giữ nhà gọn gàng, an tâm."
      >
        {isLoadingServices ? (
          <div className="flex items-center justify-center py-10 text-brand-text/60">
            <Sparkles className="mr-2 h-5 w-5 animate-spin" />
            Đang tải gợi ý dịch vụ...
          </div>
        ) : servicesError ? (
          <div className="rounded-2xl bg-rose-50 p-6 text-rose-600">
            Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.
          </div>
        ) : featuredServices.length === 0 ? (
          <div className="rounded-2xl bg-brand-background/70 p-6 text-center text-brand-text/60">
            Hiện chưa có dịch vụ khả dụng. Vui lòng quay lại sau.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredServices.map((service) => {
              const Icon =
                serviceIconFallback[service.categoryName as keyof typeof serviceIconFallback] ||
                serviceIconFallback.default;
              return (
                <Link
                  key={service.serviceId}
                  to={`/customer/booking?serviceId=${service.serviceId}`}
                  className="group relative flex flex-col rounded-2xl border border-brand-outline/40 bg-white/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/60 hover:shadow-elevation-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 text-2xl">
                    {service.iconUrl ? (
                      <img src={service.iconUrl} alt={service.name} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      <Icon className="h-5 w-5 text-brand-teal" />
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-brand-navy group-hover:text-brand-teal">
                    {service.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-brand-text/70">
                    {service.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm font-semibold text-brand-teal">
                    <span>{service.basePrice.toLocaleString('vi-VN')} VND</span>
                    <span className="text-xs text-brand-text/50">~ {service.estimatedDurationHours * 60} phút</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </SectionCard>
    </DashboardLayout>
  );
};

export default CustomerDashboard;











