import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  FileText,
  HardHat,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
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
  CUSTOMER: 'Khach hang',
  EMPLOYEE: 'Nhan vien',
  ADMIN: 'Quan tri'
};

const navigationConfig: Record<UserRole, NavItemConfig[]> = {
  CUSTOMER: [
    {
      to: '/customer/dashboard',
      label: 'Tong quan',
      description: 'Trang thai moi nhat',
      icon: LayoutDashboard
    },
    {
      to: '/customer/booking',
      label: 'Dat lich',
      description: 'Tao yeu cau dich vu',
      icon: CalendarClock
    },
    {
      to: '/customer/orders',
      label: 'Don hang',
      description: 'Theo doi trang thai',
      icon: ClipboardList
    },
    {
      to: '/customer/payments',
      label: 'Thanh toan',
      description: 'Lich su giao dich',
      icon: FileText
    },
    {
      to: '/customer/chat',
      label: 'Trao doi',
      description: 'Lien lac nhan vien',
      icon: MessageCircle
    },
    {
      to: '/customer/profile',
      label: 'Ho so',
      description: 'Cap nhat thong tin',
      icon: UserRound
    }
  ],
  EMPLOYEE: [
    {
      to: '/employee/dashboard',
      label: 'Tong quan',
      description: 'Chiem nguong lich ban',
      icon: LayoutDashboard
    },
    {
      to: '/employee/schedule',
      label: 'Lich lam',
      description: 'Quan ly ca lam',
      icon: CalendarClock
    },
    {
      to: '/employee/available',
      label: 'Cong viec',
      description: 'Nhan them ca phu hop',
      icon: HardHat
    },
    {
      to: '/employee/requests',
      label: 'Yeu cau',
      description: 'Theo doi ho tro',
      icon: Sparkles
    },
    {
      to: '/employee/profile',
      label: 'Ho so',
      description: 'Cap nhat ky nang',
      icon: UserCog
    }
  ],
  ADMIN: [
    {
      to: '/admin/dashboard',
      label: 'Tong quan',
      description: 'Chi so hoat dong',
      icon: BarChart3
    },
    {
      to: '/admin/users',
      label: 'Nguoi dung',
      description: 'Quan ly tai khoan',
      icon: Users
    },
    {
      to: '/admin/bookings',
      label: 'Don hang',
      description: 'Giam sat tien do',
      icon: ShieldCheck
    },
    {
      to: '/admin/content',
      label: 'Noi dung',
      description: 'Quan tri thu vien',
      icon: Megaphone
    }
  ]
};

const quickActionConfig: Record<UserRole, QuickActionConfig> = {
  CUSTOMER: {
    to: '/customer/booking',
    label: 'Dat lich nhanh',
    hint: 'Su dung dia chi mac dinh',
    icon: Sparkles
  },
  EMPLOYEE: {
    to: '/employee/dashboard',
    label: 'Check-in ca lam',
    hint: 'Cap nhat trang thai cong viec',
    icon: HardHat
  },
  ADMIN: {
    to: '/admin/dashboard',
    label: 'Xem bao cao ngay',
    hint: 'Theo doi KPI trong ngay',
    icon: BarChart3
  }
};

const Navigation: React.FC<NavigationProps> = ({ role, collapsed = false, onNavigate }) => {
  const location = useLocation();
  const { selectedRole } = useAuth();

  const activeRole = role ?? selectedRole ?? 'CUSTOMER';
  const navItems = navigationConfig[activeRole];
  const quickAction = quickActionConfig[activeRole];
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
              'group flex w-full items-start gap-3 rounded-2xl border px-4 py-3 transition-all duration-200',
              active
                ? 'border-brand-teal bg-white shadow-elevation-sm'
                : 'border-transparent bg-transparent hover:border-brand-outline/60 hover:bg-white/60 hover:shadow-sm'
            ].join(' ')}
          >
            <item.icon
              className={[
                'h-5 w-5 flex-shrink-0 rounded-full p-1 transition-colors',
                active ? 'bg-brand-teal/10 text-brand-teal' : 'bg-brand-outline/20 text-brand-navy'
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
        'flex h-full flex-col justify-between border-r border-brand-outline/40 bg-gradient-to-b from-brand-surface/70 via-brand-surface to-brand-background/60 px-4 py-6',
        collapsed ? 'w-full' : 'w-72'
      ].join(' ')}
    >
      <div className="space-y-6">
        {!collapsed && (
          <div className="rounded-3xl border border-brand-outline/60 bg-white/90 p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-brand-teal">
              Workspace
            </p>
            <p className="mt-2 text-lg font-semibold text-brand-navy">Khu vuc {workspaceLabel}</p>
            <p className="mt-2 text-xs text-brand-text/60">
              Chon chuc nang phu hop voi nhu cau cong viec cua ban.
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

        <nav className="space-y-2">{navContent}</nav>
      </div>

      {!collapsed && (
        <div className="rounded-3xl border border-brand-outline/40 bg-white/70 p-4 text-xs text-brand-text/70 shadow-inner">
          <p className="font-semibold text-brand-navy">Trung tam ho tro</p>
          <p className="mt-2">
            Can ho tro? Goi <span className="font-semibold text-brand-teal">1900-9999</span> hoac
            gui email toi <span className="font-semibold text-brand-teal">support@giadung360.vn</span>.
          </p>
        </div>
      )}
    </div>
  );
};

export default Navigation;

