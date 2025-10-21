import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock8,
  HardHat,
  Loader2,
  MapPin,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  X,
  XCircle
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployeeAssignments } from '../../hooks/useEmployee';
import AvailableBookings from '../../components/AvailableBookings';
import EmployeeBookings from '../../components/EmployeeBookings';
import { SectionCard, MetricCard } from '../../shared/components';
import { cancelAssignmentApi } from '../../api/employee';

type AssignmentStatus =
  | 'ALL'
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

const statusDescriptors: Record<AssignmentStatus, { label: string; badge: string }> = {
  ALL: { label: 'Tất cả', badge: 'bg-slate-100 text-slate-700' },
  ASSIGNED: { label: 'Mới phân công', badge: 'bg-sky-100 text-sky-700' },
  CONFIRMED: { label: 'Đã nhận việc', badge: 'bg-cyan-100 text-cyan-700' },
  IN_PROGRESS: { label: 'Đang thực hiện', badge: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Đã hoàn thành', badge: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Đã hủy', badge: 'bg-rose-100 text-rose-700' }
};

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
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

  const openCancelModal = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelReason('');
    setSelectedAssignmentId(null);
  };

  const confirmCancelAssignment = async () => {
    if (!selectedAssignmentId || !employeeId || !cancelReason.trim()) {
      return;
    }
    setIsActioning(true);
    try {
      await cancelAssignmentApi(selectedAssignmentId, {
        reason: cancelReason.trim(),
        employeeId
      });
      await getAssignments(employeeId, statusFilter === 'ALL' ? undefined : statusFilter);
      setStatusBanner({
        type: 'success',
        text: 'Bạn đã hủy công việc thành công. Điều phối viên sẽ ghi nhận lý do của bạn.'
      });
      closeCancelModal();
    } catch (err: any) {
      console.error('Cancel assignment error:', err);
      setStatusBanner({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Không thể hủy công việc lúc này. Vui lòng thử lại sau.'
      });
    } finally {
      setIsActioning(false);
    }
  };

  const metrics = useMemo(() => {
    return {
      completed: stats.completed || 0,
      upcoming: stats.upcoming || 0,
      totalEarnings: stats.totalEarnings || 0
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
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={isActioning ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Làm mới dữ liệu
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
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
        <MetricCard
          icon={CalendarClock}
          label="Thu nhập ước tính"
          value={`${metrics.totalEarnings.toLocaleString('vi-VN')}₫`}
          accent="amber"
          trendLabel="Cập nhật theo từng công việc đã chốt."
        />
      </div>

      <SectionCard
        title="Công việc được phân công"
        description="Nhận xét thời gian, địa điểm và xác nhận ngay để giữ lịch ổn định."
        actions={
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusDescriptors) as AssignmentStatus[]).map((statusKey) => {
              const descriptor = statusDescriptors[statusKey];
              const isActive = statusFilter === statusKey;
              return (
                <button
                  key={statusKey}
                  onClick={() => setStatusFilter(statusKey)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
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
                  className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {assignment.bookingCode}
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900">{assignment.serviceName}</h3>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${descriptor.badge}`}>
                      {descriptor.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-emerald-500" />
                      {new Date(assignment.bookingTime).toLocaleString('vi-VN')}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock8 className="h-4 w-4 text-emerald-500" />
                      Ước tính {assignment.estimatedDurationHours} giờ
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      {assignment.serviceAddress}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                    Khách hàng: <strong>{assignment.customerName}</strong> · SĐT: <strong>{assignment.customerPhone}</strong>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-500">
                      Thu nhập dự kiến:{' '}
                      <span className="font-semibold text-emerald-600">
                        {assignment.totalAmount.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {assignment.status === 'ASSIGNED' && (
                        <button
                          onClick={() => openCancelModal(assignment.assignmentId)}
                          className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:border-rose-300"
                        >
                          Từ chối
                        </button>
                      )}
                      {(assignment.status === 'ASSIGNED' || assignment.status === 'CONFIRMED') && (
                        <button
                          onClick={() => openCancelModal(assignment.assignmentId)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300"
                        >
                          Hủy công việc
                        </button>
                      )}
                      <button
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-500"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Mở hướng dẫn
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Nhận thêm công việc phù hợp"
        description="Lựa chọn các lịch trống để tối ưu thời gian làm việc của bạn."
      >
        <AvailableBookings
          onAcceptSuccess={handleRefresh}
        />
      </SectionCard>

      <SectionCard
        title="Chi tiết công việc đang thực hiện"
        description="Theo dõi tiến độ và đánh dấu hoàn thành ngay tại đây."
      >
        <EmployeeBookings />
      </SectionCard>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Hủy nhận công việc</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Vui lòng cho biết lý do để chúng tôi sắp xếp lịch phù hợp hơn trong tương lai.
                </p>
              </div>
              <button
                onClick={closeCancelModal}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={cancelReason}
              onChange={event => setCancelReason(event.target.value)}
              rows={4}
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Ví dụ: Trùng lịch cá nhân, sức khỏe không đảm bảo..."
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeCancelModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                Giữ lại
              </button>
              <button
                onClick={confirmCancelAssignment}
                disabled={!cancelReason.trim() || isActioning}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:-translate-y-0.5 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                {isActioning ? 'Đang gửi...' : 'Hủy công việc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
