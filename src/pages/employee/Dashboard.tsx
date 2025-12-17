import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock8,
  ExternalLink,
  HardHat,
  Loader2,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  X
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployeeAssignments } from '../../hooks/useEmployee';
// import EmployeeBookings from '../../components/EmployeeBookings'; // Tạm thời comment do API lỗi
import { SectionCard, MetricCard } from '../../shared/components';


type AssignmentStatus =
  | 'ALL'
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

const statusDescriptors: Record<AssignmentStatus, { label: string; badge: string }> = {
  ALL: { label: 'Tất cả', badge: 'bg-slate-100 text-slate-700' },
  PENDING: { label: 'Chờ xác nhận', badge: 'bg-amber-100 text-amber-700' },
  ASSIGNED: { label: 'Đã nhận việc', badge: 'bg-sky-100 text-sky-700' },
  IN_PROGRESS: { label: 'Đang thực hiện', badge: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Đã hoàn thành', badge: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Đã hủy', badge: 'bg-rose-100 text-rose-700' },
  NO_SHOW: { label: 'Không đến', badge: 'bg-red-100 text-red-700' }
};

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    assignments,
    stats,
    isLoading,
    error,
    getAssignments,
    getStatistics,
  } = useEmployeeAssignments();

  const [statusFilter, setStatusFilter] = useState<AssignmentStatus>('ALL');
  const [isActioning, setIsActioning] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const employeeId = useMemo(() => {
    if (!user) return null;
    if (user.profileData && 'employeeId' in user.profileData) {
      return user.profileData.employeeId || user.id;
    }
    return user.id;
  }, [user]);

  useEffect(() => {
    if (employeeId) {
      getAssignments(employeeId, statusFilter === 'ALL' ? undefined : statusFilter);
      getStatistics(employeeId);
    }
  }, [employeeId, statusFilter]);

  const filteredAssignments = useMemo(() => {
    if (statusFilter === 'ALL') return assignments;
    return assignments.filter(item => item.status === statusFilter);
  }, [assignments, statusFilter]);

  const handleRefresh = async () => {
    if (!employeeId) return;
    setIsActioning(true);
    try {
      await Promise.all([
        getAssignments(employeeId, statusFilter === 'ALL' ? undefined : statusFilter),
        getStatistics(employeeId)
      ]);
    } finally {
      setIsActioning(false);
    }
  };

  const metrics = useMemo(() => {
    return {
      completed: stats.completed || 0,
      upcoming: stats.upcoming || 0
    };
  }, [stats]);

  return (
    <DashboardLayout
      role="EMPLOYEE"
      title={`Xin chào ${user?.fullName ?? ''}`}
      description="Theo dõi công việc được phân công, nhận thêm lịch trống và quản lý thu nhập minh bạch."
      actions={
        <button
          onClick={handleRefresh}
          disabled={isActioning}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-full bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-600 shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={isActioning ? 'h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'} />
          <span className="hidden sm:inline">Làm mới dữ liệu</span>
          <span className="sm:hidden">Làm mới</span>
        </button>
      }
    >
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2">
        <MetricCard
          icon={HardHat}
          label="Công việc đang tới"
          value={`${metrics.upcoming}`}
          accent="teal"
          trendLabel="Sẵn sàng đúng giờ, giữ uy tín với khách hàng."
        />
        <MetricCard
          icon={CheckCircle2}
          label="Hoàn thành tháng này"
          value={`${metrics.completed}`}
          accent="navy"
          trendLabel="Ghi nhận hiệu suất và đánh giá từ khách hàng."
        />
      </div>

      <SectionCard
        title="Công việc được phân công"
        description="Nhận xét thời gian, địa điểm và xác nhận ngay để giữ lịch ổn định."
        actions={
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(Object.keys(statusDescriptors) as AssignmentStatus[]).map((statusKey) => {
              const descriptor = statusDescriptors[statusKey];
              const isActive = statusFilter === statusKey;
              return (
                <button
                  key={statusKey}
                  onClick={() => setStatusFilter(statusKey)}
                  className={`rounded-full border px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition ${
                    isActive
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200'
                  }`}
                >
                  {descriptor.label}
                </button>
              );
            })}
          </div>
        }
      >
        {statusBanner && (
          <div
            className={`mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
              statusBanner.type === 'success'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-rose-100 bg-rose-50 text-rose-600'
            }`}
          >
            {statusBanner.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{statusBanner.text}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="ml-auto rounded-full bg-white/50 p-1 text-sm"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {isLoading && filteredAssignments.length === 0 ? (
          <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 py-16 text-slate-500">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Đang tải danh sách công việc...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 py-16 text-center text-slate-500">
            <ShieldCheck className="mb-4 h-10 w-10 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">Chưa có công việc ở trạng thái này</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Hãy kiểm tra mục “Nhận thêm công việc” để tăng thu nhập hoặc chọn bộ lọc khác.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAssignments.map(assignment => {
              const descriptor = statusDescriptors[assignment.status as AssignmentStatus] ?? statusDescriptors.ALL;
              return (
                <div
                  key={assignment.assignmentId}
                  className="flex flex-col gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white/90 p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-4">
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {assignment.bookingCode}
                      </p>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900">{assignment.serviceName}</h3>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold ${descriptor.badge}`}>
                      {descriptor.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5 sm:gap-2">
                      <CalendarClock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                      {assignment.bookingTime ? new Date(assignment.bookingTime).toLocaleString('vi-VN') : 'N/A'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 sm:gap-2">
                      <Clock8 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                      Ước tính {assignment.estimatedDurationHours ?? 0} giờ
                    </span>
                    <span className="inline-flex items-center gap-1.5 sm:gap-2">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                      <span className="line-clamp-1">{assignment.serviceAddress || 'Chưa có địa chỉ'}</span>
                    </span>
                  </div>

                  {/* Thông tin khách hàng */}
                  <div className="rounded-xl sm:rounded-2xl border border-emerald-100 bg-emerald-50 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-semibold text-emerald-900">
                      Khách hàng: {assignment.customerName}
                    </p>
                    {assignment.customerPhone && (
                      <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-emerald-700">
                        SĐT: {assignment.customerPhone}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-500">
                      Thu nhập dự kiến:{' '}
                      <span className="font-semibold text-emerald-600">
                        {(assignment.totalAmount ?? 0).toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('/employee/assignments')}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Theo dõi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Tạm thời ẩn do API booking-details đang lỗi 500 */}
      {/* <SectionCard
        title="Chi tiết công việc đang thực hiện"
        description="Theo dõi tiến độ và đánh dấu hoàn thành ngay tại đây."
      >
        <EmployeeBookings />
      </SectionCard> */}
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
