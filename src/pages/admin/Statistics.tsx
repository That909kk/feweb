import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts';
import { RevenueChart, ServiceBookingChart } from '../../components/charts';
import { PeriodSelector, type PeriodType } from '../../components/statistics';
import { getRevenueStatisticsApi, getServiceBookingStatisticsApi } from '../../api/admin';
import type { RevenueStatistics, ServiceBookingStatistics } from '../../api/admin';
import { TrendingUp, Package, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminStatistics: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueData, setRevenueData] = useState<RevenueStatistics | null>(null);
  const [serviceData, setServiceData] = useState<ServiceBookingStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params =
        period === 'CUSTOM'
          ? { startDate, endDate }
          : { period };

      const [revenueRes, serviceRes] = await Promise.all([
        getRevenueStatisticsApi(params),
        getServiceBookingStatisticsApi(params),
      ]);

      if (revenueRes.success && revenueRes.data) {
        setRevenueData(revenueRes.data);
      }

      if (serviceRes.success && serviceRes.data) {
        setServiceData(serviceRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      const errorMessage = err.response?.data?.message || 'Không thể tải thống kê';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'CUSTOM') {
      fetchStatistics();
    }
  }, [period]);

  useEffect(() => {
    if (period === 'CUSTOM' && startDate && endDate) {
      if (startDate > endDate) {
        toast.error('Ngày bắt đầu không thể sau ngày kết thúc');
        return;
      }
      fetchStatistics();
    }
  }, [startDate, endDate]);

  return (
    <DashboardLayout
      role="ADMIN"
      title="Thống kê & Báo cáo"
      description="Phân tích doanh thu và dịch vụ theo thời gian"
    >
      {/* Period Selector */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-brand-outline/40 p-4 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-brand-navy mb-3 sm:mb-4">
          Chọn khoảng thời gian
        </h2>
        <PeriodSelector
          period={period}
          startDate={startDate}
          endDate={endDate}
          onPeriodChange={setPeriod}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mb-4"></div>
            <p className="text-brand-text/70">Đang tải thống kê...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Lỗi tải dữ liệu</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Revenue Statistics */}
      {!loading && !error && revenueData && (
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-brand-outline/40 p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-brand-teal/10">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-brand-teal" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-brand-navy">
                  Thống kê Doanh thu
                </h2>
                <p className="text-xs sm:text-sm text-brand-text/70">
                  Tổng số booking: {revenueData.totalBookings}
                </p>
              </div>
            </div>

            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 rounded-xl p-3 sm:p-4 border border-sky-200/50">
                <p className="text-xs sm:text-sm text-sky-700 font-medium mb-1">Tổng doanh thu</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-sky-900">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(revenueData.totalRevenue)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-3 sm:p-4 border border-green-200/50">
                <p className="text-xs sm:text-sm text-green-700 font-medium mb-1">TB/Booking</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(revenueData.averageRevenuePerBooking)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3 sm:p-4 border border-orange-200/50">
                <p className="text-xs sm:text-sm text-orange-700 font-medium mb-1">Cao nhất</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(revenueData.maxBookingAmount)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 sm:p-4 border border-purple-200/50">
                <p className="text-xs sm:text-sm text-purple-700 font-medium mb-1">Thấp nhất</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(revenueData.minBookingAmount)}
                </p>
              </div>
            </div>

            {/* Revenue Chart */}
            <RevenueChart data={revenueData} />
          </div>
        </div>
      )}

      {/* Service Statistics */}
      {!loading && !error && serviceData && serviceData.totalBookings > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-brand-outline/40 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                <Package className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-brand-navy">
                  Thống kê Dịch vụ
                </h2>
                <p className="text-sm text-brand-text/70">
                  Tổng số booking: {serviceData.totalBookings}
                </p>
              </div>
            </div>

            {/* Service Summary Table */}
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-outline/40">
                    <th className="text-left py-3 px-4 font-semibold text-brand-navy">Hạng</th>
                    <th className="text-left py-3 px-4 font-semibold text-brand-navy">Dịch vụ</th>
                    <th className="text-right py-3 px-4 font-semibold text-brand-navy">Số booking</th>
                    <th className="text-right py-3 px-4 font-semibold text-brand-navy">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceData.serviceStatistics.map((stat) => (
                    <tr
                      key={stat.serviceId}
                      className="border-b border-brand-outline/20 hover:bg-sky-50/30 transition"
                    >
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal font-semibold">
                          #{stat.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-brand-navy">
                        {stat.serviceName}
                      </td>
                      <td className="py-3 px-4 text-right text-brand-text">
                        {stat.bookingCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-block px-3 py-1 bg-brand-teal/10 text-brand-teal rounded-full font-semibold">
                          {stat.percentage.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Service Chart */}
            <ServiceBookingChart data={serviceData} />
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !error && serviceData && serviceData.totalBookings === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Không có dữ liệu
          </h3>
          <p className="text-gray-500">
            Không có booking nào trong khoảng thời gian này
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminStatistics;
