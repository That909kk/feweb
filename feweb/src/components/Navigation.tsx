import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  FileText,
  HardHat,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserRound,
  Users
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/api';

type NavigationProps = {
  role?: UserRole;
  collapsed?: boolean;
  onNavigate?: () => void;
};

type NavItemConfig = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

type QuickActionConfig = {
  to: string;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: 'Khách hàng',
  EMPLOYEE: 'Nhân viên',
  ADMIN: 'Quản trị'
};

const navigationConfig: Record<UserRole, NavItemConfig[]> = {
  CUSTOMER: [
    {
      to: '/customer/dashboard',
      label: 'Tổng quan',
      description: 'Trạng thái mới nhất',
      icon: LayoutDashboard
    },
    {
      to: '/customer/booking',
      label: 'Đặt lịch',
      description: 'Tạo yêu cầu dịch vụ',
      icon: CalendarClock
    },
    {
      to: '/customer/orders',
      label: 'Đơn hàng',
      description: 'Theo dõi trạng thái',
      icon: ClipboardList
    },
    {
      to: '/customer/payments',
      label: 'Thanh toán',
      description: 'Lịch sử giao dịch',
      icon: FileText
    },
    {
      to: '/customer/chat',
      label: 'Trao đổi',
      description: 'Liên lạc nhân viên',
      icon: MessageCircle
    },
    {
      to: '/customer/profile',
      label: 'Hồ sơ',
      description: 'Cập nhật thông tin',
      icon: UserRound
    }
  ],
  EMPLOYEE: [
    {
      to: '/employee/dashboard',
      label: 'Tổng quan',
      description: 'Chiêm ngưỡng lịch bận',
      icon: LayoutDashboard
    },
    {
      to: '/employee/schedule',
      label: 'Lịch làm',
      description: 'Quản lý ca làm',
      icon: CalendarClock
    },
    {
      to: '/employee/booking-posts',
      label: 'Bài đăng',
      description: 'Nhận việc từ bài đăng',
      icon: Megaphone
    },
    {
      to: '/employee/available',
      label: 'Công việc',
      description: 'Nhận thêm ca phù hợp',
      icon: HardHat
    },
    {
      to: '/employee/requests',
      label: 'Yêu cầu',
      description: 'Theo dõi hỗ trợ',
      icon: Sparkles
    },
    {
      to: '/employee/chat',
      label: 'Trao đổi',
      description: 'Chat với khách hàng',
      icon: MessageCircle
    },
    {
      to: '/employee/profile',
      label: 'Hồ sơ',
      description: 'Cập nhật kỹ năng',
      icon: UserCog
    }
  ],
  ADMIN: [
    {
      to: '/admin/dashboard',
      label: 'Tổng quan',
      description: 'Chỉ số hoạt động',
      icon: BarChart3
    },
    {
      to: '/admin/users',
      label: 'Người dùng',
      description: 'Quản lý tài khoản',
      icon: Users
    },
    {
      to: '/admin/services',
      label: 'Dịch vụ',
      description: 'Quản lý dịch vụ',
      icon: Settings
    },
    {
      to: '/admin/bookings',
      label: 'Đơn hàng',
      description: 'Giám sát tiến độ',
      icon: ClipboardList
    },
    {
      to: '/admin/content',
      label: 'Nội dung',
      description: 'Quản trị thư viện',
      icon: Megaphone
    },
    {
      to: '/admin/permissions',
      label: 'Phân quyền',
      description: 'Cấu hình quyền truy cập',
      icon: ShieldCheck
    }
  ]
};

const quickActionConfig: Record<UserRole, QuickActionConfig> = {
  CUSTOMER: {
    to: '/customer/booking',
    label: 'Đặt lịch nhanh',
    hint: 'Sử dụng địa chỉ mặc định',
    icon: Sparkles
  },
  EMPLOYEE: {
    to: '/employee/dashboard',
    label: 'Check-in ca làm',
    hint: 'Cập nhật trạng thái công việc',
    icon: HardHat
  },
  ADMIN: {
    to: '/admin/dashboard',
    label: 'Xem báo cáo ngày',
    hint: 'Theo dõi KPI trong ngày',
    icon: BarChart3
  }
};

const Navigation: React.FC<NavigationProps> = ({ role, collapsed, onNavigate }) => {
  const { selectedRole, logout } = useAuth();
  const location = useLocation();

  const activeRole = role ?? selectedRole ?? 'CUSTOMER';
  const navItems = useMemo(() => navigationConfig[activeRole], [activeRole]);
  const quickAction = useMemo(() => quickActionConfig[activeRole], [activeRole]);
  const workspaceLabel = roleLabels[activeRole];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navContent = useMemo(
    () =>
      navItems.map(item => {
        const active = isActive(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={[
              'group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200',
              collapsed ? 'justify-center' : 'items-start',
              active
                ? 'border-brand-teal bg-white shadow-elevation-sm'
                : 'border-transparent bg-transparent hover:border-brand-outline/60 hover:bg-white/60 hover:shadow-sm'
            ].join(' ')}
            title={collapsed ? item.label : undefined}
          >
            <item.icon
              className={[
                'h-5 w-5 flex-shrink-0 transition-colors',
                collapsed ? 'mx-auto' : '',
                active 
                  ? 'text-brand-teal' 
                  : 'text-brand-navy'
              ].join(' ')}
            />
            {!collapsed && (
              <div className="flex flex-col">
                <span
                  className={[
                    'text-sm font-semibold tracking-tight',
                    active ? 'text-brand-navy' : 'text-brand-text/80'
                  ].join(' ')}
                >
                  {item.label}
                </span>
                <span className="text-xs text-brand-text/60">{item.description}</span>
              </div>
            )}
          </Link>
        );
      }),
    [collapsed, navItems]
  );

  return (
    <div
      className={[
        'flex h-full flex-col border-r border-brand-outline/40 bg-gradient-to-b from-brand-surface/70 via-brand-surface to-brand-background/60 px-4 py-6 transition-all duration-300 overflow-y-auto',
        collapsed ? 'w-20' : 'w-72'
      ].join(' ')}
    >
      <div className="flex flex-col justify-between min-h-full">
        {/* Top section */}
        <div className="space-y-6 flex-shrink-0">
          {!collapsed && (
            <div className="rounded-3xl border border-brand-outline/60 bg-white/90 p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-teal">
                Workspace
              </p>
              <p className="mt-2 text-lg font-semibold text-brand-navy">Khu vực {workspaceLabel}</p>
              <p className="mt-2 text-xs text-brand-text/60">
                Chọn chức năng phù hợp với nhu cầu công việc của bạn.
              </p>
            </div>
          )}

          {quickAction && !collapsed && (
            <Link
              to={quickAction.to}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-3xl bg-brand-navy px-4 py-4 text-white shadow-elevation-sm transition hover:-translate-y-0.5 hover:bg-brand-navyHover"
            >
              <quickAction.icon className="h-5 w-5 text-white/90" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold">{quickAction.label}</span>
                <span className="text-xs text-white/70">{quickAction.hint}</span>
              </div>
            </Link>
          )}

          {/* Collapsed quick action */}
          {quickAction && collapsed && (
            <Link
              to={quickAction.to}
              onClick={onNavigate}
              className="flex items-center justify-center rounded-full bg-brand-navy p-3 text-white shadow-elevation-sm transition hover:-translate-y-0.5 hover:bg-brand-navyHover"
              title={quickAction.label}
            >
              <quickAction.icon className="h-5 w-5" />
            </Link>
          )}

          <nav className="space-y-2">{navContent}</nav>
        </div>

        {/* Bottom section */}
        <div className="flex-shrink-0 mt-6">
          {!collapsed && (
            <div className="space-y-3">
              <div className="rounded-3xl border border-brand-outline/40 bg-white/70 p-4 text-xs text-brand-text/70 shadow-inner">
                <p className="font-semibold text-brand-navy">Trung tâm hỗ trợ</p>
                <p className="mt-2">
                  Cần hỗ trợ? Gọi <span className="font-semibold text-brand-teal">1900-9999</span> hoặc
                  gửi email tới <span className="font-semibold text-brand-teal">support@giadung360.vn</span>.
                </p>
              </div>
              
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-3 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 transition hover:bg-red-100 hover:border-red-300"
              >
                <LogOut className="h-5 w-5" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold">Đăng xuất</span>
                  <span className="text-xs text-red-600/70">Thoát khỏi tài khoản</span>
                </div>
              </button>
            </div>
          )}

          {/* Collapsed footer */}
          {collapsed && (
            <div className="space-y-3">
              <button
                onClick={() => logout()}
                className="flex w-full items-center justify-center rounded-full border border-red-200 bg-red-50 p-3 text-red-700 transition hover:bg-red-100 hover:border-red-300"
                title="Đăng xuất"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;

