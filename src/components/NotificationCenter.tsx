import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MapPin,
  Shield,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../hooks/useBooking';
import { useEmployeeAssignments } from '../hooks/useEmployee';
import api, { type ApiResponse } from '../api/client';
import type { UserRole } from '../types/api';

type SupportedRole = Extract<UserRole, 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'>;

type NotificationCenterProps = {
  role: SupportedRole;
  isOpen: boolean;
  onClose: () => void;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  meta?: string;
  status?: string;
};

type AdminSummaryResponse = ApiResponse<{
  totalBookingsToday: number;
  completedRate: number;
  inProgressCount: number;
  pendingCount: number;
}>;

type SessionResponse = ApiResponse<{
  webSessions: number;
  mobileSessions: number;
}>;

const roleLabels: Record<SupportedRole, string> = {
  CUSTOMER: 'khach hang',
  EMPLOYEE: 'nhan vien',
  ADMIN: 'quan tri'
};

const statusPalette: Record<string, { label: string; tone: string }> = {
  COMPLETED: { label: 'Hoan thanh', tone: 'bg-status-success/10 text-status-success' },
  CONFIRMED: { label: 'Da xac nhan', tone: 'bg-brand-teal/10 text-brand-teal' },
  IN_PROGRESS: { label: 'Dang thuc hien', tone: 'bg-status-warning/10 text-status-warning' },
  PENDING: { label: 'Dang cho', tone: 'bg-brand-outline/20 text-brand-navy' },
  AWAITING_EMPLOYEE: { label: 'Cho phan cong', tone: 'bg-status-info/10 text-status-info' },
  CANCELLED: { label: 'Da huy', tone: 'bg-status-danger/10 text-status-danger' },
  INFO: { label: 'He thong', tone: 'bg-status-info/10 text-status-info' }
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ role, isOpen, onClose }) => {
  const { user } = useAuth();
  const { getCustomerBookings } = useBooking();
  const { getAssignments } = useEmployeeAssignments();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (role === 'CUSTOMER' && user?.id) {
          const bookings = await getCustomerBookings(user.id, { size: 5, direction: 'DESC' });
          const bookingList = bookings.content || bookings;
          const customerItems: NotificationItem[] = (Array.isArray(bookingList) ? bookingList : []).slice(0, 5).map((booking: any, index: number) => ({
            id: booking.bookingId ?? booking.bookingCode ?? `booking-${index}`,
            title: `Don ${booking.bookingCode ?? booking.bookingId}`,
            description: booking.serviceDetails?.[0]?.service?.name ?? 'Dich vu gia dinh',
            meta: booking.bookingTime
              ? new Date(booking.bookingTime).toLocaleString('vi-VN')
              : booking.updatedAt
              ? new Date(booking.updatedAt).toLocaleString('vi-VN')
              : undefined,
            status: booking.status
          }));
          setItems(customerItems);
          return;
        }

        if (role === 'EMPLOYEE' && user) {
          // Lấy employeeId từ customerId hoặc id
          const employeeId = user.customerId || user.id;

          if (!employeeId) {
            setItems([]);
            return;
          }

          const assignments = await getAssignments(employeeId, undefined, 0, 5);
          const employeeItems: NotificationItem[] = (assignments ?? []).slice(0, 5).map((assignment, index) => ({
            id: assignment.assignmentId ?? `assignment-${index}`,
            title: assignment.serviceName ?? 'Cong viec moi',
            description: assignment.customerName
              ? `Khach: ${assignment.customerName} · SDT ${assignment.customerPhone}`
              : 'Cap nhat cong viec',
            meta: assignment.bookingTime
              ? new Date(assignment.bookingTime).toLocaleString('vi-VN')
              : assignment.assignedAt
              ? new Date(assignment.assignedAt).toLocaleString('vi-VN')
              : undefined,
            status: assignment.status
          }));
          setItems(employeeItems);
          return;
        }

        if (role === 'ADMIN') {
          const [summaryRes, sessionRes] = await Promise.allSettled([
            api.get<AdminSummaryResponse>('/admin/bookings/summary'),
            api.get<SessionResponse>('/auth/sessions')
          ]);

          const adminItems: NotificationItem[] = [];

          if (summaryRes.status === 'fulfilled' && summaryRes.value.data.success) {
            const summary = summaryRes.value.data.data;
            adminItems.push({
              id: 'summary-today',
              title: 'Bao cao ngay',
              description: `Tong don: ${summary.totalBookingsToday} · Hoan thanh ${summary.completedRate}%`,
              meta: new Date().toLocaleDateString('vi-VN'),
              status: summary.pendingCount > 0 ? 'IN_PROGRESS' : 'COMPLETED'
            });
            adminItems.push({
              id: 'summary-progress',
              title: 'Dang xu ly',
              description: `Dang thuc hien: ${summary.inProgressCount} · Cho duyet: ${summary.pendingCount}`,
              status: summary.pendingCount > 0 ? 'PENDING' : 'IN_PROGRESS'
            });
          }

          if (sessionRes.status === 'fulfilled' && sessionRes.value.data.success) {
            const sessions = sessionRes.value.data.data;
            adminItems.push({
              id: 'sessions',
              title: 'Phien dang nhap',
              description: `Web: ${sessions.webSessions} · Mobile: ${sessions.mobileSessions}`,
              status: 'INFO'
            });
          }

          setItems(adminItems);
          return;
        }

        setItems([]);
      } catch (err: any) {
        console.error('Notification center error:', err);
        setError(err?.message || 'Khong the tai thong bao');
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [getAssignments, getCustomerBookings, isOpen, role, user]);

  const panelClasses = useMemo(
    () =>
      [
        'fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-elevation-md transition-transform duration-300 ease-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      ].join(' '),
    [isOpen]
  );

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-40 bg-brand-text/30 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        ].join(' ')}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside className={panelClasses} aria-hidden={!isOpen} aria-label="Trung tam thong bao">
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-brand-outline/40 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">Thong bao moi</h2>
              <p className="text-xs text-brand-text/60">
                Cap nhat theo thoi gian thuc tu he thong {roleLabels[role]}.
              </p>
            </div>
            <button
              type="button"
              aria-label="Dong thong bao"
              className="rounded-full border border-brand-outline/60 p-2 text-brand-text/60 transition hover:border-brand-navy hover:text-brand-navy"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-brand-text/70">
                <Loader2 className="h-5 w-5 animate-spin text-brand-teal" />
                Dang tai du lieu tu API...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-status-danger/20 bg-status-danger/5 px-4 py-8 text-center text-sm text-status-danger">
                <AlertCircle className="mb-2 h-6 w-6" />
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-outline/30 bg-brand-background/60 px-4 py-10 text-center text-sm text-brand-text/60">
                <Sparkles className="mb-3 h-6 w-6 text-brand-teal" />
                Khong co thong bao moi.
              </div>
            ) : (
              <ul className="space-y-3">
                {items.map(item => {
                  const palette = item.status ? statusPalette[item.status] ?? null : null;
                  return (
                    <li
                      key={item.id}
                      className="rounded-3xl border border-brand-outline/40 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-elevation-sm"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
                          {palette ? (
                            palette.label.startsWith('Hoan') ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <Shield className="h-5 w-5" />
                            )
                          ) : role === 'CUSTOMER' ? (
                            <CalendarClock className="h-5 w-5" />
                          ) : (
                            <MapPin className="h-5 w-5" />
                          )}
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-brand-navy">{item.title}</p>
                            {palette && (
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${palette.tone}`}>
                                {palette.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-text/70">{item.description}</p>
                          {item.meta && (
                            <p className="text-[11px] uppercase tracking-wide text-brand-text/45">{item.meta}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="border-t border-brand-outline/40 px-5 py-3 text-[11px] text-brand-text/60">
            Du lieu duoc dong bo truc tiep tu cac API domain: Booking, Assignment, Auth.
          </footer>
        </div>
      </aside>
    </>
  );
};

export default NotificationCenter;
