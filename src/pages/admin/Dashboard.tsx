import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, CalendarClock, BarChart3, Wrench, Receipt, Clock } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { MetricCard, SectionCard } from '../../shared/components';
import { getRevenueStatisticsApi } from '../../api/admin';
import type { RevenueStatistics } from '../../api/admin';

const AdminDashboard: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenueStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const revenueRes = await getRevenueStatisticsApi({ period: 'MONTH' });

        if (revenueRes.success && revenueRes.data) {
          setRevenueData(revenueRes.data);
        }
      } catch (error) {
        console.error('Error fetching quick stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuickStats();
  }, []);

  return (
    <DashboardLayout
      role="ADMIN"
      title="Dashboard Quản trị"
      description="Tổng quan hệ thống và các hoạt động chính"
    >
      {/* Quick Stats - Current Month */}
      {!loading && revenueData && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 sm:mb-6">
          <MetricCard
            icon={TrendingUp}
            label="Doanh thu tháng này"
            value={new Intl.NumberFormat('vi-VN', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(revenueData.totalRevenue) + ' ₫'}
            accent="teal"
            trendLabel={`${revenueData.totalBookings} booking hoàn thành`}
          />
          <MetricCard
            icon={CalendarClock}
            label="TB/Booking"
            value={new Intl.NumberFormat('vi-VN', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(revenueData.averageRevenuePerBooking) + ' ₫'}
            accent="teal"
            trendLabel="Doanh thu trung bình mỗi booking"
          />
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
      )}

      {!loading && !revenueData && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mb-4 sm:mb-6">
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
      )}

      <SectionCard
        title="Truy cập nhanh"
        description="Các tính năng quản lý chính của hệ thống"
      >
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <Link
            to="/admin/statistics"
            className="group flex flex-col justify-between rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-teal-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/60 hover:shadow-elevation-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10">
                <BarChart3 className="h-6 w-6 text-brand-teal" />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-semibold text-brand-navy group-hover:text-brand-teal">Thống kê & Báo cáo</p>
              <p className="text-sm text-brand-text/70 mt-1">Phân tích doanh thu và dịch vụ</p>
            </div>
          </Link>

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
            to="/admin/services"
            className="group flex flex-col justify-between rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-indigo-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/60 hover:shadow-elevation-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
                <Wrench className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-semibold text-brand-navy group-hover:text-brand-teal">Quản lý Dịch vụ</p>
              <p className="text-sm text-brand-text/70 mt-1">Cấu hình các dịch vụ</p>
            </div>
          </Link>
          
          <Link
            to="/admin/additional-fees"
            className="group flex flex-col justify-between rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-emerald-50/60 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/60 hover:shadow-elevation-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                <Receipt className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <p className="font-semibold text-brand-navy group-hover:text-brand-teal">Quản lý Phụ phí</p>
              <p className="text-sm text-brand-text/70 mt-1">Cấu hình phụ phí dịch vụ</p>
            </div>
          </Link>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
};

export default AdminDashboard;
