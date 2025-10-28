import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, TrendingUp, CalendarClock } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { MetricCard, SectionCard } from '../../shared/components';

const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout
      role="ADMIN"
      title="Dashboard Quản trị"
      description="Tổng quan hệ thống và các hoạt động chính"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricCard
          icon={CalendarClock}
          label="Tổng Booking Chờ Xác Minh"
          value="4"
          accent="navy"
          trendLabel="Các booking chưa có nhân viên được phân công"
        />
        <MetricCard
          icon={Clock}
          label="Chờ Duyệt"
          value="4"
          accent="amber"
          trendLabel="Cần xác minh trước khi hiển thị công khai"
        />
      </div>

      <SectionCard
        title="Về Booking Posts"
        description="Hệ thống quản lý đặt dịch vụ và phân công nhân viên"
      >
        <div className="space-y-4">
          <p className="text-brand-text/70">
            Hệ thống Booking Posts cho phép khách hàng tạo yêu cầu đặt dịch vụ 
            và chờ nhân viên phản công. Admin có vai trò xác minh và quản lý 
            các booking này trước khi hiển thị công khai.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 rounded-2xl border border-brand-outline/40 bg-gradient-to-r from-white to-sky-50/30 p-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-brand-navy rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-navy">Booking chờ xác minh</p>
                <p className="text-sm text-brand-text/70 mt-1">Chưa có nhân viên nào phản công</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-brand-outline/40 bg-gradient-to-r from-white to-amber-50/30 p-4">
              <div className="flex-shrink-0 mt-1">
                <div className="w-2 h-2 bg-status-warning rounded-full"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-navy">Chờ duyệt</p>
                <p className="text-sm text-brand-text/70 mt-1">Cần admin xác minh để công khai</p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Truy cập nhanh"
        description="Các tính năng quản lý chính của hệ thống"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            to="/admin/bookings"
            className="group flex flex-col justify-between rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/60 hover:shadow-elevation-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10">
                <TrendingUp className="h-6 w-6 text-brand-teal" />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-semibold text-brand-navy group-hover:text-brand-teal">Xem tất cả Bookings</p>
              <p className="text-sm text-brand-text/70 mt-1">Quản lý toàn bộ booking</p>
            </div>
          </Link>
          
          <Link
            to="/admin/users"
            className="group flex flex-col justify-between rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/60 hover:shadow-elevation-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-semibold text-brand-navy group-hover:text-brand-teal">Quản lý Người dùng</p>
              <p className="text-sm text-brand-text/70 mt-1">Xem danh sách người dùng</p>
            </div>
          </Link>
          
          <Link
            to="/admin/permissions"
            className="group flex flex-col justify-between rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-emerald-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/60 hover:shadow-elevation-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-semibold text-brand-navy group-hover:text-brand-teal">Quản lý Phân quyền</p>
              <p className="text-sm text-brand-text/70 mt-1">Cấu hình quyền hạn</p>
            </div>
          </Link>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
};

export default AdminDashboard;
