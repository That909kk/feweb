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
  COMPLETED: 'Da hoan thanh',
  CONFIRMED: 'Da xac nhan',
  IN_PROGRESS: 'Dang thuc hien',
  AWAITING_EMPLOYEE: 'Cho phan cong',
  PENDING: 'Dang cho',
  CANCELLED: 'Da huy'
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
  }, [getCustomerBookings, user]);

  const firstName = useMemo(() => {
    if (!user?.fullName) return 'KhÃ¡ch hÃ ng';
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
      title={`ChÃ o ${firstName}`}
      description="Theo dÃµi lá»‹ch dá»n dáº¹p, quáº£n lÃ½ Ä‘Æ¡n Ä‘Ã£ Ä‘áº·t vÃ  khÃ¡m phÃ¡ thÃªm dá»‹ch vá»¥ phÃ¹ há»£p vá»›i gia Ä‘Ã¬nh báº¡n."
      actions={
        <Link
          to="/customer/booking"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-teal shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-50"
        >
          <CalendarHeart className="h-4 w-4" />
          Äáº·t lá»‹ch má»›i
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <MetricCard
          icon={CalendarClock}
          label="Tá»•ng Ä‘Æ¡n Ä‘Ã£ Ä‘áº·t"
          value={`${metrics.total}`}
          accent="navy"
          trendLabel="Lá»‹ch cá»§a báº¡n luÃ´n Ä‘Æ°á»£c cáº­p nháº­t."
        />
        <MetricCard
          icon={CheckCircle2}
          label="ÄÆ¡n hoÃ n táº¥t"
          value={`${metrics.completed}`}
          accent="teal"
          trendLabel="Giá»¯ thÃ³i quen chÄƒm nhÃ  Ä‘á»u Ä‘áº·n nÃ o!"
        />
        <MetricCard
          icon={Sparkles}
          label="Äang chá» xá»­ lÃ½"
          value={`${metrics.awaiting}`}
          accent="amber"
          trendLabel="Æ¯u tiÃªn xá»­ lÃ½ trong hÃ´m nay."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="ÄÆ¡n sáº¯p diá»…n ra"
          description="Theo dÃµi cÃ¡c dá»‹ch vá»¥ sáº½ diá»…n ra trong vÃ i ngÃ y tá»›i."
          className="lg:col-span-2"
        >
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-10 text-brand-text/60">
              <CalendarClock className="mr-2 h-5 w-5 animate-spin" />
              Äang táº£i lá»‹ch háº¹n...
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="rounded-2xl bg-brand-background/70 p-6 text-center text-brand-text/60">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-brand-text/50" />
              <p>Báº¡n chÆ°a cÃ³ lá»‹ch háº¹n nÃ o sáº¯p tá»›i. Äáº·t dá»‹ch vá»¥ ngay Ä‘á»ƒ giá»¯ nhÃ  luÃ´n gá»n gÃ ng nhÃ©!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => {
                const serviceName = booking.serviceDetails?.[0]?.service.name || 'Dá»‹ch vá»¥ gia Ä‘Ã¬nh';
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
          title="Há»— trá»£ nhanh"
          description="Äá»™i ngÅ© CSKH luÃ´n sáºµn sÃ ng há»— trá»£ báº¡n 24/7."
        >
          <div className="rounded-2xl bg-gradient-to-br from-brand-navy via-brand-navyHover to-brand-teal p-6 text-white shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold">TrÃ² chuyá»‡n cÃ¹ng HomeCare</h4>
                <p className="mt-1 text-sm text-white/80">
                  Káº¿t ná»‘i trá»±c tiáº¿p vá»›i nhÃ¢n viÃªn há»— trá»£ hoáº·c ngÆ°á»i lao Ä‘á»™ng Ä‘Ã£ nháº­n viá»‡c.
                </p>
              </div>
            </div>
            <Link
              to="/customer/chat"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-teal shadow-inner transition hover:-translate-y-0.5"
            >
              Má»Ÿ trung tÃ¢m há»— trá»£
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Dá»‹ch vá»¥ Ä‘á» xuáº¥t cho báº¡n"
        description="CÃ¡c dá»‹ch vá»¥ phá»• biáº¿n giÃºp giá»¯ nhÃ  gá»n gÃ ng, an tÃ¢m."
      >
        {isLoadingServices ? (
          <div className="flex items-center justify-center py-10 text-brand-text/60">
            <Sparkles className="mr-2 h-5 w-5 animate-spin" />
            Äang táº£i gá»£i Ã½ dá»‹ch vá»¥...
          </div>
        ) : servicesError ? (
          <div className="rounded-2xl bg-rose-50 p-6 text-rose-600">
            KhÃ´ng thá»ƒ táº£i danh sÃ¡ch dá»‹ch vá»¥. Vui lÃ²ng thá»­ láº¡i sau.
          </div>
        ) : featuredServices.length === 0 ? (
          <div className="rounded-2xl bg-brand-background/70 p-6 text-center text-brand-text/60">
            Hiá»‡n chÆ°a cÃ³ dá»‹ch vá»¥ kháº£ dá»¥ng. Vui lÃ²ng quay láº¡i sau.
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
                    <span className="text-xs text-brand-text/50">~ {service.estimatedDurationHours * 60} phut</span>
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











