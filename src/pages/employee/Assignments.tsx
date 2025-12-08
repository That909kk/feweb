import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock8,
  Loader2,
  MapPin,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  Timer,
  Upload,
  X,
  XCircle
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployeeAssignments } from '../../hooks/useEmployee';
import { cancelAssignmentApi, checkInAssignmentApi, checkOutAssignmentApi, acceptAssignmentApi } from '../../api/employee';

// Component đồng hồ bấm giờ
const WorkingTimer: React.FC<{ checkInTime: string }> = ({ checkInTime }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const checkInDate = new Date(checkInTime);
    
    // Cập nhật thời gian mỗi giây
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - checkInDate.getTime();
      setElapsedTime(Math.floor(diff / 1000)); // Chuyển sang giây
    }, 1000);

    return () => clearInterval(interval);
  }, [checkInTime]);

  // Format thời gian thành HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-white shadow-lg">
      <Timer className="h-5 w-5 animate-pulse" />
      <span className="font-mono text-lg font-bold tracking-wider">
        {formatTime(elapsedTime)}
      </span>
    </div>
  );
};

type AssignmentStatus =
  | 'ALL'
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OTHER';

const statusDescriptors: Record<AssignmentStatus, { label: string; selectedClass: string; unselectedClass: string; badgeClass: string }> = {
  ALL: { 
    label: 'Tất cả', 
    selectedClass: 'bg-slate-600 text-white shadow-sm',
    unselectedClass: 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700'
  },
  PENDING: { 
    label: 'Chờ xác nhận', 
    selectedClass: 'bg-amber-600 text-white shadow-sm',
    unselectedClass: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-700'
  },
  ASSIGNED: { 
    label: 'Đã nhận việc', 
    selectedClass: 'bg-sky-600 text-white shadow-sm',
    unselectedClass: 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200',
    badgeClass: 'bg-sky-100 text-sky-700'
  },
  IN_PROGRESS: { 
    label: 'Đang thực hiện', 
    selectedClass: 'bg-blue-600 text-white shadow-sm',
    unselectedClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700'
  },
  COMPLETED: { 
    label: 'Đã hoàn thành', 
    selectedClass: 'bg-emerald-600 text-white shadow-sm',
    unselectedClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-700'
  },
  CANCELLED: { 
    label: 'Đã hủy', 
    selectedClass: 'bg-rose-600 text-white shadow-sm',
    unselectedClass: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
    badgeClass: 'bg-rose-100 text-rose-700'
  },
  OTHER: { 
    label: 'Khác', 
    selectedClass: 'bg-gray-600 text-white shadow-sm',
    unselectedClass: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200',
    badgeClass: 'bg-gray-100 text-gray-700'
  }
};

const EmployeeAssignments: React.FC = () => {
  const { user } = useAuth();
  const {
    assignments,
    isLoading,
    error,
    getAssignments,
  } = useEmployeeAssignments();

  const [statusFilter, setStatusFilter] = useState<AssignmentStatus>('ALL');
  const [isActioning, setIsActioning] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAcceptWarningModal, setShowAcceptWarningModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [checkInDescription, setCheckInDescription] = useState('');
  const [checkInImages, setCheckInImages] = useState<File[]>([]);
  const [checkOutDescription, setCheckOutDescription] = useState('');
  const [checkOutImages, setCheckOutImages] = useState<File[]>([]);
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
      // Luôn lấy tất cả assignments để tính số lượng cho các tab
      getAssignments(employeeId, undefined);
    }
  }, [employeeId]);

  const filteredAssignments = useMemo(() => {
    let filtered = statusFilter === 'ALL' 
      ? assignments 
      : assignments.filter(item => item.status === statusFilter);
    
    // Sắp xếp theo khoảng cách thời gian so với hiện tại
    return filtered.sort((a, b) => {
      const now = new Date().getTime();
      const timeA = a.bookingTime ? new Date(a.bookingTime).getTime() : 0;
      const timeB = b.bookingTime ? new Date(b.bookingTime).getTime() : 0;
      
      // Đối với trạng thái ASSIGNED: sắp xếp theo khoảng cách thời gian so với hiện tại
      // Công việc nào gần giờ hiện tại nhất (sắp tới) sẽ lên đầu
      if (statusFilter === 'ASSIGNED') {
        const distanceA = Math.abs(timeA - now);
        const distanceB = Math.abs(timeB - now);
        return distanceA - distanceB; // Khoảng cách gần nhất lên đầu
      }
      
      // Các trạng thái khác: sắp xếp theo thời gian tăng dần (sắp diễn ra trước)
      return timeA - timeB;
    });
  }, [assignments, statusFilter]);

  const handleRefresh = async () => {
    if (!employeeId) return;
    setIsActioning(true);
    try {
      await getAssignments(employeeId, undefined);
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
    setSelectedAssignmentId(null);
    setCancelReason('');
  };

  const confirmCancelAssignment = async () => {
    if (!selectedAssignmentId || !cancelReason.trim() || !employeeId) return;

    setIsActioning(true);
    try {
      await cancelAssignmentApi(selectedAssignmentId, {
        reason: cancelReason,
        employeeId: employeeId
      });
      setStatusBanner({
        type: 'success',
        text: 'Đã hủy công việc. Hệ thống sẽ tìm nhân viên thay thế.'
      });
      closeCancelModal();
      if (employeeId) {
        await getAssignments(employeeId, undefined);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể hủy công việc. Vui lòng thử lại.';
      setStatusBanner({ type: 'error', text: message });
    } finally {
      setIsActioning(false);
      setTimeout(() => setStatusBanner(null), 5000);
    }
  };

  const handleCheckIn = async (assignmentId: string) => {
    if (!employeeId) return;
    
    setIsActioning(true);
    try {
      await checkInAssignmentApi(assignmentId, employeeId, checkInDescription, checkInImages);
      setStatusBanner({
        type: 'success',
        text: 'Check-in thành công! Chúc bạn làm việc hiệu quả.'
      });
      closeCheckInModal();
      if (employeeId) {
        await getAssignments(employeeId, undefined);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Check-in không thành công. Vui lòng thử lại.';
      setStatusBanner({ type: 'error', text: message });
    } finally {
      setIsActioning(false);
      setTimeout(() => setStatusBanner(null), 5000);
    }
  };

  const openCheckInModal = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setCheckInDescription('');
    setCheckInImages([]);
    setShowCheckInModal(true);
  };

  const closeCheckInModal = () => {
    setShowCheckInModal(false);
    setSelectedAssignmentId(null);
    setCheckInDescription('');
    setCheckInImages([]);
  };

  const confirmCheckIn = () => {
    if (!selectedAssignmentId) return;
    handleCheckIn(selectedAssignmentId);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Kiểm tra số lượng ảnh (tối đa 10)
    if (checkInImages.length + fileArray.length > 10) {
      setStatusBanner({
        type: 'error',
        text: 'Số lượng ảnh không được vượt quá 10'
      });
      setTimeout(() => setStatusBanner(null), 5000);
      return;
    }

    // Kiểm tra định dạng file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setStatusBanner({
        type: 'error',
        text: 'Tất cả file phải là định dạng ảnh (JPEG, PNG, GIF, WebP)'
      });
      setTimeout(() => setStatusBanner(null), 5000);
      return;
    }

    // Kiểm tra kích thước file (tối đa 10MB mỗi file)
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      setStatusBanner({
        type: 'error',
        text: 'Kích thước mỗi ảnh không được vượt quá 10MB'
      });
      setTimeout(() => setStatusBanner(null), 5000);
      return;
    }

    setCheckInImages(prev => [...prev, ...fileArray]);
  };

  const removeImage = (index: number) => {
    setCheckInImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckOut = async (assignmentId: string) => {
    if (!employeeId) return;
    
    setIsActioning(true);
    try {
      await checkOutAssignmentApi(assignmentId, employeeId, checkOutDescription, checkOutImages);
      setStatusBanner({
        type: 'success',
        text: 'Check-out thành công! Đánh giá của bạn rất quan trọng với khách hàng.'
      });
      closeCheckOutModal();
      if (employeeId) {
        await getAssignments(employeeId, undefined);
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Check-out không thành công. Vui lòng thử lại.';
      setStatusBanner({ type: 'error', text: message });
    } finally {
      setIsActioning(false);
      setTimeout(() => setStatusBanner(null), 5000);
    }
  };

  const openCheckOutModal = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setCheckOutDescription('');
    setCheckOutImages([]);
    setShowCheckOutModal(true);
  };

  const closeCheckOutModal = () => {
    setShowCheckOutModal(false);
    setSelectedAssignmentId(null);
    setCheckOutDescription('');
    setCheckOutImages([]);
  };

  const confirmCheckOut = () => {
    if (!selectedAssignmentId) return;
    handleCheckOut(selectedAssignmentId);
  };

  const handleCheckOutImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Kiểm tra số lượng ảnh (tối đa 10)
    if (checkOutImages.length + fileArray.length > 10) {
      setStatusBanner({
        type: 'error',
        text: 'Số lượng ảnh không được vượt quá 10'
      });
      setTimeout(() => setStatusBanner(null), 5000);
      return;
    }

    // Kiểm tra định dạng file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setStatusBanner({
        type: 'error',
        text: 'Tất cả file phải là định dạng ảnh (JPEG, PNG, GIF, WebP)'
      });
      setTimeout(() => setStatusBanner(null), 5000);
      return;
    }

    // Kiểm tra kích thước file (tối đa 10MB mỗi file)
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      setStatusBanner({
        type: 'error',
        text: 'Kích thước mỗi ảnh không được vượt quá 10MB'
      });
      setTimeout(() => setStatusBanner(null), 5000);
      return;
    }

    setCheckOutImages(prev => [...prev, ...fileArray]);
  };

  const removeCheckOutImage = (index: number) => {
    setCheckOutImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAcceptAssignment = async (assignmentId: string) => {
    if (!employeeId) return;
    
    setIsActioning(true);
    try {
      await acceptAssignmentApi(assignmentId, employeeId);
      setStatusBanner({
        type: 'success',
        text: 'Đã nhận việc thành công! Hãy chuẩn bị và đến đúng giờ nhé.'
      });
      setShowAcceptWarningModal(false);
      setSelectedAssignmentId(null);
      await getAssignments(employeeId, undefined);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể nhận công việc. Vui lòng thử lại.';
      setStatusBanner({ type: 'error', text: message });
    } finally {
      setIsActioning(false);
      setTimeout(() => setStatusBanner(null), 5000);
    }
  };

  const openAcceptWarningModal = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setShowAcceptWarningModal(true);
  };

  const closeAcceptWarningModal = () => {
    setShowAcceptWarningModal(false);
    setSelectedAssignmentId(null);
  };

  const confirmAcceptAssignment = () => {
    if (!selectedAssignmentId) return;
    handleAcceptAssignment(selectedAssignmentId);
  };

  return (
    <DashboardLayout
      role="EMPLOYEE"
      title="Công việc được phân công"
      description="Quản lý các công việc đã được phân công và theo dõi tiến độ thực hiện."
      actions={
        <button
          onClick={handleRefresh}
          disabled={isActioning}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-emerald-600 shadow-lg shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCcw className={isActioning ? 'h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin' : 'h-3.5 w-3.5 sm:h-4 sm:w-4'} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      }
    >
      {/* Status Banner */}
      {statusBanner && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            statusBanner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{statusBanner.text}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-4 sm:mb-6 flex overflow-x-auto pb-2 gap-1.5 sm:gap-2 scrollbar-hide">
        {(Object.keys(statusDescriptors) as AssignmentStatus[]).map(status => {
          const descriptor = statusDescriptors[status];
          const count = status === 'ALL' 
            ? assignments.length 
            : assignments.filter(a => a.status === status).length;
          
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${
                statusFilter === status
                  ? descriptor.selectedClass
                  : descriptor.unselectedClass
              }`}
            >
              {descriptor.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 py-16 text-slate-500">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          Đang tải danh sách công việc...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-slate-50 py-16 text-center text-slate-500">
          <ShieldCheck className="mb-4 h-10 w-10 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">Chưa có công việc ở trạng thái này</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Hãy kiểm tra các bộ lọc khác hoặc nhận thêm công việc mới.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredAssignments.map(assignment => {
            const descriptor = statusDescriptors[assignment.status as AssignmentStatus] ?? statusDescriptors.ALL;
            
            // Kiểm tra thời gian check-in có hợp lệ không (sớm 10 phút, trễ 5 phút)
            const canCheckIn = (() => {
              if (assignment.status !== 'ASSIGNED' || !assignment.bookingTime) return false;
              
              const now = new Date();
              const bookingTime = new Date(assignment.bookingTime);
              const earliestCheckIn = new Date(bookingTime.getTime() - 10 * 60000); // -10 phút
              const latestCheckIn = new Date(bookingTime.getTime() + 5 * 60000); // +5 phút
              
              return now >= earliestCheckIn && now <= latestCheckIn;
            })();
            
            return (
              <div
                key={assignment.assignmentId}
                className="flex flex-col gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-slate-100 bg-white/90 p-4 sm:p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1 sm:gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                        {assignment.serviceName}
                      </h3>
                      <span className={`rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold ${descriptor.badgeClass}`}>
                        {descriptor.label}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500">Mã: {assignment.bookingCode}</p>
                  </div>
                  
                  {/* Đồng hồ bấm giờ ở góc phải trên cho IN_PROGRESS */}
                  {assignment.status === 'IN_PROGRESS' && assignment.checkInTime && (
                    <WorkingTimer checkInTime={assignment.checkInTime} />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5 sm:gap-2">
                    <CalendarClock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                    {assignment.bookingTime ? new Date(assignment.bookingTime).toLocaleString('vi-VN') : 'N/A'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 sm:gap-2">
                    <Clock8 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                    Ước tính {assignment.estimatedDurationHours ?? 0} giờ
                  </span>
                  <span className="inline-flex items-center gap-1.5 sm:gap-2">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
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

                {/* Ghi chú công việc */}
                {assignment.note && (
                  <div className="rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-700 mb-0.5 sm:mb-1">
                      📝 Ghi chú:
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {assignment.note}
                    </p>
                  </div>
                )}

                {/* Thông tin thời gian check-in cho trạng thái IN_PROGRESS */}
                {assignment.status === 'IN_PROGRESS' && assignment.checkInTime && (
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      ⏱️ Thông tin làm việc:
                    </p>
                    <div className="flex flex-col gap-1 text-xs text-blue-700">
                      <p>
                        • Bắt đầu lúc:{' '}
                        <span className="font-semibold">
                          {new Date(assignment.checkInTime).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </span>
                      </p>
                      <p className="text-blue-600 font-medium mt-1">
                        Đang tính giờ... Nhấn Check-out khi hoàn thành!
                      </p>
                    </div>
                  </div>
                )}

                {/* Hiển thị khoảng thời gian check-in cho trạng thái ASSIGNED */}
                {assignment.status === 'ASSIGNED' && assignment.bookingTime && (
                  <div className={`rounded-2xl border p-4 ${
                    canCheckIn 
                      ? 'border-blue-100 bg-blue-50' 
                      : 'border-amber-100 bg-amber-50'
                  }`}>
                    <p className={`text-sm font-semibold mb-2 ${
                      canCheckIn ? 'text-blue-900' : 'text-amber-900'
                    }`}>
                      ⏰ Thời gian check-in:
                    </p>
                    <div className={`flex flex-col gap-1 text-xs ${
                      canCheckIn ? 'text-blue-700' : 'text-amber-700'
                    }`}>
                      <p>
                        • Sớm nhất:{' '}
                        <span className="font-semibold">
                          {new Date(new Date(assignment.bookingTime).getTime() - 10 * 60000).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {' '}(trước 10 phút)
                      </p>
                      <p>
                        • Muộn nhất:{' '}
                        <span className="font-semibold">
                          {new Date(new Date(assignment.bookingTime).getTime() + 5 * 60000).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {' '}(sau 5 phút)
                      </p>
                      {!canCheckIn && (
                        <p className="mt-2 font-semibold text-amber-800 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Chưa đến thời gian check-in
                        </p>
                      )}
                      {canCheckIn && (
                        <p className="mt-2 font-semibold text-blue-800 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Có thể check-in ngay bây giờ
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">
                    Thu nhập dự kiến:{' '}
                    <span className="font-semibold text-emerald-600">
                      {(assignment.totalAmount ?? 0).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Nút Nhận việc - hiển thị cho PENDING */}
                    {assignment.status === 'PENDING' && (
                      <button
                        onClick={() => openAcceptWarningModal(assignment.assignmentId)}
                        disabled={isActioning}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Nhận việc
                      </button>
                    )}

                    {/* Nút Check-in - hiển thị cho ASSIGNED */}
                    {assignment.status === 'ASSIGNED' && (
                      <button
                        onClick={() => openCheckInModal(assignment.assignmentId)}
                        disabled={isActioning || !canCheckIn}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition ${
                          canCheckIn
                            ? 'bg-blue-600 shadow-blue-200 hover:-translate-y-0.5 hover:bg-blue-500'
                            : 'bg-gray-400 shadow-gray-200 cursor-not-allowed'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                        title={
                          !canCheckIn
                            ? 'Chỉ có thể check-in trong khoảng từ 10 phút trước đến 5 phút sau giờ hẹn'
                            : 'Bắt đầu công việc'
                        }
                      >
                        <PlayCircle className="h-4 w-4" />
                        Check-in
                      </button>
                    )}

                    {/* Nút Check-out - hiển thị cho IN_PROGRESS */}
                    {assignment.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => openCheckOutModal(assignment.assignmentId)}
                        disabled={isActioning}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Check-out
                      </button>
                    )}

                    {/* Nút Từ chối - chỉ hiển thị cho PENDING */}
                    {assignment.status === 'PENDING' && (
                      <button
                        onClick={() => openCancelModal(assignment.assignmentId)}
                        disabled={isActioning}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Từ chối
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <PlayCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Check-in công việc</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Điểm danh bắt đầu công việc và upload hình ảnh hiện trạng
                  </p>
                </div>
              </div>
              <button
                onClick={closeCheckInModal}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mô tả ảnh */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mô tả hình ảnh (Tùy chọn)
              </label>
              <textarea
                value={checkInDescription}
                onChange={e => setCheckInDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Ví dụ: Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp..."
              />
              <p className="mt-1 text-xs text-slate-500">
                {checkInDescription.length}/500 ký tự
              </p>
            </div>

            {/* Upload ảnh */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hình ảnh check-in (Tối đa 10 ảnh)
              </label>
              
              <div className="mb-3">
                <label className="inline-flex items-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 cursor-pointer">
                  <Upload className="h-5 w-5" />
                  Chọn ảnh từ thiết bị
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Định dạng: JPEG, PNG, GIF, WebP • Kích thước tối đa: 10MB/ảnh
                </p>
              </div>

              {/* Preview ảnh đã chọn */}
              {checkInImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {checkInImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-slate-200"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 rounded-full bg-rose-600 p-1.5 text-white shadow-lg opacity-0 group-hover:opacity-100 transition hover:bg-rose-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="mt-1 text-xs text-slate-600 truncate">
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                ℹ️ Lưu ý:
              </p>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Hình ảnh giúp ghi nhận hiện trạng trước khi làm việc</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Bạn có thể không upload ảnh nếu không cần thiết</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Sau khi check-in, bạn sẽ bắt đầu tính thời gian làm việc</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeCheckInModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmCheckIn}
                disabled={isActioning}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                {isActioning ? 'Đang xử lý...' : 'Xác nhận Check-in'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-out Modal */}
      {showCheckOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-emerald-100 p-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Check-out công việc</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Kết thúc công việc và upload hình ảnh kết quả
                  </p>
                </div>
              </div>
              <button
                onClick={closeCheckOutModal}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mô tả ảnh */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mô tả hình ảnh (Tùy chọn)
              </label>
              <textarea
                value={checkOutDescription}
                onChange={e => setCheckOutDescription(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Ví dụ: Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực..."
              />
              <p className="mt-1 text-xs text-slate-500">
                {checkOutDescription.length}/500 ký tự
              </p>
            </div>

            {/* Upload ảnh */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Hình ảnh check-out (Tối đa 10 ảnh)
              </label>
              
              <div className="mb-3">
                <label className="inline-flex items-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-100 cursor-pointer">
                  <Upload className="h-5 w-5" />
                  Chọn ảnh từ thiết bị
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleCheckOutImageChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  Định dạng: JPEG, PNG, GIF, WebP • Kích thước tối đa: 10MB/ảnh
                </p>
              </div>

              {/* Preview ảnh đã chọn */}
              {checkOutImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {checkOutImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-slate-200"
                      />
                      <button
                        onClick={() => removeCheckOutImage(index)}
                        className="absolute top-2 right-2 rounded-full bg-rose-600 p-1.5 text-white shadow-lg opacity-0 group-hover:opacity-100 transition hover:bg-rose-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="mt-1 text-xs text-slate-600 truncate">
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 mb-4">
              <p className="text-sm font-semibold text-emerald-900 mb-2">
                ✅ Lưu ý:
              </p>
              <ul className="space-y-1 text-sm text-emerald-800">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">•</span>
                  <span>Hình ảnh giúp ghi nhận kết quả công việc đã hoàn thành</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">•</span>
                  <span>Bạn có thể không upload ảnh nếu không cần thiết</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">•</span>
                  <span>Sau khi check-out, công việc sẽ chuyển sang trạng thái hoàn thành</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeCheckOutModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmCheckOut}
                disabled={isActioning}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isActioning ? 'Đang xử lý...' : 'Xác nhận Check-out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Warning Modal */}
      {showAcceptWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Xác nhận nhận việc</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Vui lòng đọc kỹ thông tin trước khi xác nhận
                  </p>
                </div>
              </div>
              <button
                onClick={closeAcceptWarningModal}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                ⚠️ Lưu ý quan trọng:
              </p>
              <ul className="space-y-2 text-sm text-amber-800">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>Sau khi nhận việc, bạn <strong>KHÔNG THỂ HỦY</strong> công việc này.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>Hãy đảm bảo bạn có thể hoàn thành công việc đúng thời gian đã hẹn.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>Việc không thực hiện đúng cam kết sẽ ảnh hưởng đến uy tín của bạn.</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                📞 Thông tin liên hệ hỗ trợ:
              </p>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• <strong>Hotline:</strong> 0825371577</p>
                <p>• <strong>Zalo:</strong> 0342287853 (Minh That)</p>
                <p>• <strong>Email:</strong> mthat456@gmail.com</p>
                <p className="text-xs text-blue-700 mt-2">
                  Liên hệ nếu bạn có bất kỳ thắc mắc hoặc vấn đề gì.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeAcceptWarningModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmAcceptAssignment}
                disabled={isActioning}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isActioning ? 'Đang xử lý...' : 'Xác nhận nhận việc'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
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

export default EmployeeAssignments;
