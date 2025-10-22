import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Crown,
  LogOut,
  Menu,
  MonitorSmartphone
} from 'lucide-react';
import Navigation from '../components/Navigation';
import NotificationCenter from '../components/NotificationCenter';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/api';

type SupportedRole = Extract<UserRole, 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'>;

type AppShellProps = {
  role: SupportedRole;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
};

const roleBadges: Record<SupportedRole, { label: string; tone: string }> = {
  CUSTOMER: { label: 'Workspace khách hàng', tone: 'bg-brand-teal/15 text-brand-teal' },
  EMPLOYEE: { label: 'Workspace nhân viên', tone: 'bg-emerald-100 text-emerald-700' },
  ADMIN: { label: 'Workspace quản trị', tone: 'bg-brand-navy/10 text-brand-navy' }
};

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: 'Khách hàng',
  EMPLOYEE: 'Nhân viên',
  ADMIN: 'Quản trị'
};

const AppShell: React.FC<AppShellProps> = ({
  role,
  title,
  description,
  actions,
  toolbar,
  children
}) => {
  const { user, availableRoles, selectedRole, selectRole, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const badge = roleBadges[role];

  const initials = useMemo(() => {
    if (!user?.fullName) return 'GU';
    const parts = user.fullName.trim().split(' ');
    const first = parts[0]?.[0] ?? '';
    const last = parts[parts.length - 1]?.[0] ?? '';
    return `${first}${last}`.toUpperCase();
  }, [user?.fullName]);

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRole = event.target.value as UserRole;
    if (nextRole && nextRole !== selectedRole) {
      selectRole(nextRole);
    }
  };

  const handleLogout = async () => {
    await logout('WEB');
  };

  return (
    <div className="flex min-h-screen bg-brand-background text-brand-text">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <Navigation role={role} />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Dieu huong"
        >
          <div
            className="fixed inset-0 bg-brand-text/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative ml-auto h-full w-80 bg-brand-surface shadow-elevation-md">
            <Navigation role={role} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="relative flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-outline/40 bg-brand-surface/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-brand-outline/60 p-2 text-brand-navy transition hover:border-brand-navy hover:text-brand-navy lg:hidden"
              aria-label="Mở menu điều hướng"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-navy text-sm font-semibold text-white shadow-elevation-sm">
                360
              </span>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-semibold text-brand-navy">Gia Dung 360</span>
                <span className="text-xs text-brand-text/60">Home service booking</span>
              </div>
            </Link>

            <span className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${badge.tone}`}>
              {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {availableRoles && availableRoles.length > 1 && (
              <label className="relative flex items-center gap-2 rounded-full border border-brand-outline/60 bg-white px-3 py-1 text-xs font-medium text-brand-text/80 shadow-sm">
                <MonitorSmartphone className="h-4 w-4 text-brand-teal" />
                <select
                  value={selectedRole ?? role}
                  onChange={handleRoleChange}
                  className="cursor-pointer appearance-none bg-transparent pr-5 text-sm font-semibold text-brand-navy focus:outline-none"
                >
                  {availableRoles.map(userRole => (
                    <option key={userRole} value={userRole}>
                      {roleLabels[userRole]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-brand-outline" />
              </label>
            )}

            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-full border border-brand-outline/60 bg-white p-2 text-brand-navy shadow-sm transition hover:border-brand-navy hover:text-brand-navy"
              aria-label="Mở thông báo"
              onClick={() => setNotifyOpen(true)}
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="group flex items-center gap-3 rounded-full border border-brand-outline/60 bg-white/90 px-3 py-1.5 text-sm shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal/10 font-semibold text-brand-teal">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName ?? 'Avatar'}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </span>
              <div className="hidden min-w-[120px] flex-col sm:flex">
                <span className="text-sm font-semibold text-brand-navy">{user?.fullName ?? 'Thành viên'}</span>
                <span className="text-xs text-brand-text/60">{user?.email ?? 'Chưa cập nhật email'}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-2 inline-flex items-center gap-1 rounded-full border border-brand-outline/50 px-2 py-1 text-xs font-semibold text-brand-text/70 transition hover:border-brand-navy hover:text-brand-navy"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 pb-12 pt-6 sm:px-6 lg:px-10">
          <header className="mb-8 space-y-6 rounded-3xl bg-white/85 p-6 shadow-elevation-sm backdrop-blur-sm transition hover:shadow-elevation-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-brand-navy`}>
                  <Crown className="h-4 w-4 text-brand-teal" />
                  {badge.label}
                </span>
                <h1 className="font-heading text-3xl font-semibold text-brand-navy sm:text-4xl">{title}</h1>
                {description && <p className="max-w-2xl text-sm text-brand-text/70">{description}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
            </div>
            {toolbar && <div className="border-t border-brand-outline/40 pt-5">{toolbar}</div>}
          </header>

          <main className="space-y-6 lg:space-y-8">{children}</main>
        </div>

        <footer className="mt-auto border-t border-brand-outline/40 bg-brand-surface/90 px-4 py-4 text-xs text-brand-text/60 sm:px-6 lg:px-10">
          Gia Dụng 360 © {new Date().getFullYear()} · Kiến tạo trải nghiệm giúp việc gia đình hiện đại.
        </footer>
      </div>

      <NotificationCenter
        role={role}
        isOpen={notifyOpen}
        onClose={() => setNotifyOpen(false)}
      />
    </div>
  );
};

export default AppShell;
