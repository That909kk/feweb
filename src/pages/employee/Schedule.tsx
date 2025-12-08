import React, { useEffect, useState, useCallback } from 'react';
import { 
  Clock, 
  Briefcase, 
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Settings,
  Save,
  RefreshCcw,
  Coffee,
  Calendar
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { SectionCard } from '../../shared/components';
import { 
  getEmployeeScheduleApi, 
  getWorkingHoursApi, 
  setWorkingHoursApi,
  initializeWorkingHoursApi
} from '../../api/schedule';
import type { EmployeeSchedule, WorkingHours, DayOfWeek } from '../../types/api';

const EmployeeSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState<EmployeeSchedule | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeSchedule | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState<'schedule' | 'working-hours'>('schedule');
  
  // Working hours edit state
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [editForm, setEditForm] = useState({
    startTime: '08:00',
    endTime: '18:00',
    isWorkingDay: true,
    breakStartTime: '12:00',
    breakEndTime: '13:00'
  });
  const [savingWorkingHours, setSavingWorkingHours] = useState(false);

  // Tính toán khoảng thời gian 7 ngày (Thứ 2 - Chủ nhật)
  useEffect(() => {
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay();
    
    const monday = new Date(current);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(current.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    setDateRange({
      start: monday.toISOString(),
      end: sunday.toISOString()
    });
  }, [selectedDate]);

  // Lấy khung giờ làm việc
  const fetchWorkingHours = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setWorkingHoursLoading(true);
      const response = await getWorkingHoursApi(user.id);
      
      if (response.success && response.data) {
        setWorkingHours(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching working hours:', err);
    } finally {
      setWorkingHoursLoading(false);
    }
  }, [user?.id]);

  // Lấy dữ liệu lịch làm việc lần đầu
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.id || !dateRange.start || !dateRange.end) return;

      try {
        setLoading(true);
        setError(null);
        const response = await getEmployeeScheduleApi(user.id, dateRange.start, dateRange.end);
        
        if (response.success && response.data) {
          setScheduleData(response.data);
          setEmployeeInfo(response.data);
        } else {
          setError(response.message || 'Không thể tải lịch làm việc');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tải lịch');
      } finally {
        setLoading(false);
      }
    };

    if (!employeeInfo) {
      fetchInitialData();
    }
  }, [user?.id, dateRange, employeeInfo]);

  // Fetch working hours khi component mount
  useEffect(() => {
    if (user?.id) {
      fetchWorkingHours();
    }
  }, [user?.id, fetchWorkingHours]);

  // Load lại lịch khi chuyển tuần
  useEffect(() => {
    const fetchScheduleOnly = async () => {
      if (!user?.id || !dateRange.start || !dateRange.end || !employeeInfo) return;

      try {
        setScheduleLoading(true);
        setError(null);
        const response = await getEmployeeScheduleApi(user.id, dateRange.start, dateRange.end);
        
        if (response.success && response.data) {
          setScheduleData({
            ...employeeInfo,
            timeSlots: response.data.timeSlots
          });
        } else {
          setError(response.message || 'Không thể tải lịch làm việc');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tải lịch');
      } finally {
        setScheduleLoading(false);
      }
    };

    if (employeeInfo && dateRange.start && dateRange.end) {
      fetchScheduleOnly();
    }
  }, [dateRange]);

  // Chuyển tuần
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Khởi tạo khung giờ làm việc mặc định
  const handleInitializeWorkingHours = async () => {
    if (!user?.id) return;
    
    try {
      setSavingWorkingHours(true);
      setError(null);
      const response = await initializeWorkingHoursApi(user.id);
      
      if (response.success && response.data) {
        setWorkingHours(response.data);
        setSuccessMessage('Đã khởi tạo khung giờ làm việc mặc định thành công');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || 'Không thể khởi tạo khung giờ làm việc');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi khởi tạo');
    } finally {
      setSavingWorkingHours(false);
    }
  };

  // Bắt đầu chỉnh sửa ngày làm việc
  const startEditingDay = (day: WorkingHours) => {
    setEditingDay(day.dayOfWeek);
    setEditForm({
      startTime: day.startTime?.substring(0, 5) || '08:00',
      endTime: day.endTime?.substring(0, 5) || '18:00',
      isWorkingDay: day.isWorkingDay,
      breakStartTime: day.breakStartTime?.substring(0, 5) || '12:00',
      breakEndTime: day.breakEndTime?.substring(0, 5) || '13:00'
    });
  };

  // Lưu thay đổi khung giờ làm việc
  const handleSaveWorkingHours = async () => {
    if (!user?.id || !editingDay) return;
    
    try {
      setSavingWorkingHours(true);
      setError(null);
      
      const response = await setWorkingHoursApi({
        employeeId: user.id,
        dayOfWeek: editingDay,
        startTime: editForm.isWorkingDay ? `${editForm.startTime}:00` : '08:00:00',
        endTime: editForm.isWorkingDay ? `${editForm.endTime}:00` : '18:00:00',
        isWorkingDay: editForm.isWorkingDay,
        breakStartTime: editForm.isWorkingDay ? `${editForm.breakStartTime}:00` : null,
        breakEndTime: editForm.isWorkingDay ? `${editForm.breakEndTime}:00` : null
      });
      
      if (response.success) {
        await fetchWorkingHours();
        setEditingDay(null);
        setSuccessMessage('Đã cập nhật khung giờ làm việc thành công');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || 'Không thể cập nhật khung giờ làm việc');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật');
    } finally {
      setSavingWorkingHours(false);
    }
  };

  // Nhóm time slots theo ngày và ca (sáng/chiều)
  const groupTimeSlotsByDayAndShift = () => {
    if (!scheduleData?.timeSlots) return { days: [], morning: {}, afternoon: {} };

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const days: Date[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    const morning: { [key: string]: typeof scheduleData.timeSlots } = {};
    const afternoon: { [key: string]: typeof scheduleData.timeSlots } = {};

    scheduleData.timeSlots.forEach(slot => {
      const slotStartTime = new Date(slot.startTime);
      const dateKey = slotStartTime.toLocaleDateString('vi-VN');
      const startHour = slotStartTime.getHours();
      
      // Phân loại ca DỰA VÀO GIỜ BẮT ĐẦU:
      // - Sáng: 0h-12h (trước 12h trưa)
      // - Chiều: 12h-24h (từ 12h trưa trở đi)
      if (startHour < 12) {
        if (!morning[dateKey]) morning[dateKey] = [];
        morning[dateKey].push(slot);
      } else {
        if (!afternoon[dateKey]) afternoon[dateKey] = [];
        afternoon[dateKey].push(slot);
      }
    });

    // Sắp xếp slots theo thời gian
    Object.keys(morning).forEach(key => {
      morning[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });
    Object.keys(afternoon).forEach(key => {
      afternoon[key].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    });

    return { days, morning, afternoon };
  };

  // Lấy status badge cho nhân viên
  const getEmployeeStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle2 className="h-3 w-3" />
            Đang làm việc
          </span>
        );
      case 'BUSY':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            <Briefcase className="h-3 w-3" />
            Bận
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            <XCircle className="h-3 w-3" />
            Không làm
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTimeOnly = (timeStr: string | null) => {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5);
  };

  if (loading) {
    return (
      <DashboardLayout
        role="EMPLOYEE"
        title="Lịch làm việc"
        description="Quản lý lịch làm việc của bạn"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </DashboardLayout>
    );
  }

  const { days, morning, afternoon } = groupTimeSlotsByDayAndShift();

  const formatDayHeader = (date: Date) => {
    const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
    const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return { dayName, dayMonth };
  };

  const renderSlot = (slot: any) => {
    // Xác định màu viền dựa trên trạng thái
    let borderColor = 'border-slate-300';
    let bgColor = 'bg-slate-50';
    let textColor = 'text-slate-700';

    if (slot.type === 'ASSIGNMENT') {
      // Màu viền theo trạng thái công việc
      switch (slot.status) {
        case 'ASSIGNED':
          borderColor = 'border-yellow-400 border-2';
          bgColor = 'bg-yellow-50';
          textColor = 'text-yellow-900';
          break;
        case 'IN_PROGRESS':
          borderColor = 'border-blue-400 border-2';
          bgColor = 'bg-blue-50';
          textColor = 'text-blue-900';
          break;
        case 'COMPLETED':
          borderColor = 'border-green-400 border-2';
          bgColor = 'bg-green-50';
          textColor = 'text-green-900';
          break;
        default:
          borderColor = 'border-slate-400 border-2';
          bgColor = 'bg-slate-50';
          textColor = 'text-slate-900';
      }
    } else if (slot.type === 'UNAVAILABLE') {
      borderColor = 'border-red-400 border-2';
      bgColor = 'bg-red-50';
      textColor = 'text-red-900';
    } else {
      borderColor = 'border-emerald-400 border-2';
      bgColor = 'bg-emerald-50';
      textColor = 'text-emerald-900';
    }

    return (
      <div
        key={`${slot.startTime}-${slot.bookingCode || 'unavail'}`}
        className={`rounded-lg border p-2 text-xs ${borderColor} ${bgColor}`}
      >
        <div className={`flex items-center gap-1 font-medium ${textColor}`}>
          <Clock className="h-3 w-3" />
          <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
        </div>
        {slot.type === 'ASSIGNMENT' && (
          <div className="mt-1 space-y-0.5">
            {slot.serviceName && (
              <div className={`font-medium ${textColor}`}>{slot.serviceName}</div>
            )}
            {slot.customerName && (
              <div className="text-slate-600 text-xs">{slot.customerName}</div>
            )}
            {slot.bookingCode && (
              <div className="text-slate-500 text-xs">{slot.bookingCode}</div>
            )}
            {slot.status && (
              <div className="mt-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  slot.status === 'ASSIGNED' ? 'bg-yellow-100 text-yellow-800' :
                  slot.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  slot.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {slot.status === 'ASSIGNED' ? 'Đã phân công' :
                   slot.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
                   slot.status === 'COMPLETED' ? 'Hoàn thành' :
                   slot.status}
                </span>
              </div>
            )}
          </div>
        )}
        {slot.type === 'UNAVAILABLE' && slot.reason && (
          <div className="mt-1 text-red-700">{slot.reason}</div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout
      role="EMPLOYEE"
      title="Lịch làm việc"
      description="Quản lý lịch làm việc và khung giờ của bạn"
    >
      {/* Success Popup Toast */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSuccessMessage(null)} />
          <div className="relative animate-in zoom-in-95 fade-in duration-200">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-8 py-6 shadow-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">Thành công!</p>
                <p className="mt-1 text-sm text-slate-600">{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Thông tin nhân viên */}
      {scheduleData && (
        <SectionCard title="Thông tin cá nhân">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full bg-emerald-100">
              {scheduleData.avatar ? (
                <img src={scheduleData.avatar} alt={scheduleData.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-8 w-8 text-emerald-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">{scheduleData.fullName}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {getEmployeeStatusBadge(scheduleData.employeeStatus)}
                {scheduleData.rating && (
                  <span className="text-sm text-slate-500">
                    Đánh giá: {scheduleData.rating}
                  </span>
                )}
              </div>
            </div>
          </div>

          {scheduleData.skills && scheduleData.skills.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Kỹ năng:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {scheduleData.skills.map((skill, index) => (
                  <span key={index} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {scheduleData.workingZones && scheduleData.workingZones.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Khu vực làm việc:</p>
              <div className="mt-2 space-y-1">
                {scheduleData.workingZones.map((zone, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-4 w-4 text-emerald-500" />
                    {zone.ward}, {zone.city}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'schedule'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Lịch làm việc tuần
        </button>
        <button
          onClick={() => setActiveTab('working-hours')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'working-hours'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Settings className="h-4 w-4" />
          Cài đặt khung giờ làm việc
        </button>
      </div>

      {/* Tab: Lịch làm việc theo tuần */}
      {activeTab === 'schedule' && (
        <SectionCard title="Lịch làm việc theo tuần">
          {/* Ghi chú màu sắc */}
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-700">Ghi chú:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-yellow-400 bg-yellow-50"></div>
                <span className="text-xs text-slate-600">Đã phân công</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-blue-400 bg-blue-50"></div>
                <span className="text-xs text-slate-600">Đang thực hiện</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-green-400 bg-green-50"></div>
                <span className="text-xs text-slate-600">Hoàn thành</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-red-400 bg-red-50"></div>
                <span className="text-xs text-slate-600">Nghỉ phép</span>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Tuần trước
            </button>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                onClick={goToToday}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Hôm nay
              </button>
            </div>

            <button
              onClick={goToNextWeek}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tuần sau
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Bảng lịch */}
          <div className="overflow-x-auto relative">
            {scheduleLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">Đang tải lịch...</span>
                </div>
              </div>
            )}
            
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 w-32">
                    Ca làm
                  </th>
                  {days.map((day, index) => {
                    const { dayName, dayMonth } = formatDayHeader(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <th
                        key={index}
                        className={`border border-slate-200 px-3 py-2 text-center text-sm font-semibold ${
                          isToday ? 'bg-emerald-100 text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        <div className="capitalize">{dayName}</div>
                        <div className="mt-1 text-xs font-normal">{dayMonth}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-slate-700">
                    Sáng
                  </td>
                  {days.map((day, index) => {
                    const dateKey = day.toLocaleDateString('vi-VN');
                    const slots = morning[dateKey] || [];
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <td
                        key={index}
                        className={`border border-slate-200 px-2 py-2 align-top ${
                          isToday ? 'bg-emerald-50' : 'bg-white'
                        }`}
                      >
                        <div className="space-y-2">
                          {slots.length > 0 ? (
                            slots.map(renderSlot)
                          ) : (
                            <div className="text-center text-xs text-slate-400">-</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="border border-slate-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-slate-700">
                    Chiều
                  </td>
                  {days.map((day, index) => {
                    const dateKey = day.toLocaleDateString('vi-VN');
                    const slots = afternoon[dateKey] || [];
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <td
                        key={index}
                        className={`border border-slate-200 px-2 py-2 align-top ${
                          isToday ? 'bg-emerald-50' : 'bg-white'
                        }`}
                      >
                        <div className="space-y-2">
                          {slots.length > 0 ? (
                            slots.map(renderSlot)
                          ) : (
                            <div className="text-center text-xs text-slate-400">-</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Tab: Cài đặt khung giờ làm việc */}
      {activeTab === 'working-hours' && (
        <SectionCard 
          title="Khung giờ làm việc hàng tuần"
          actions={
            <div className="flex gap-2">
              <button
                onClick={fetchWorkingHours}
                disabled={workingHoursLoading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCcw className={`h-4 w-4 ${workingHoursLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
              {workingHours.length === 0 && (
                <button
                  onClick={handleInitializeWorkingHours}
                  disabled={savingWorkingHours}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {savingWorkingHours ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )}
                  Khởi tạo mặc định
                </button>
              )}
            </div>
          }
        >
          <p className="mb-4 text-sm text-slate-600">
            Cài đặt khung giờ làm việc cho từng ngày trong tuần. Hệ thống sẽ sử dụng thông tin này để phân công công việc phù hợp.
          </p>

          {workingHoursLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <span className="ml-2 text-sm text-slate-600">Đang tải...</span>
            </div>
          ) : workingHours.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Clock className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Chưa có khung giờ làm việc</h3>
              <p className="mt-2 text-sm text-slate-600">
                Nhấn "Khởi tạo mặc định" để tạo khung giờ làm việc tiêu chuẩn (Thứ 2 - Thứ 7: 8:00-18:00, nghỉ trưa 12:00-13:00)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {workingHours.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className={`rounded-lg border p-4 transition ${
                    day.isWorkingDay 
                      ? 'border-emerald-200 bg-emerald-50/50' 
                      : 'border-slate-200 bg-slate-50'
                  } ${editingDay === day.dayOfWeek ? 'ring-2 ring-emerald-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        day.isWorkingDay ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-white'
                      }`}>
                        {day.isWorkingDay ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{day.dayOfWeekDisplay}</h4>
                        <p className="text-sm text-slate-600">
                          {day.isWorkingDay ? (
                            <>
                              <span className="font-medium text-emerald-700">
                                {formatTimeOnly(day.startTime)} - {formatTimeOnly(day.endTime)}
                              </span>
                              {day.breakStartTime && day.breakEndTime && (
                                <span className="ml-2 text-slate-500">
                                  (Nghỉ: {formatTimeOnly(day.breakStartTime)} - {formatTimeOnly(day.breakEndTime)})
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-red-600">Nghỉ</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => startEditingDay(day)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white"
                    >
                      <Settings className="h-4 w-4" />
                      Chỉnh sửa
                    </button>
                  </div>

                  {/* Edit Form */}
                  {editingDay === day.dayOfWeek && (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="col-span-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.isWorkingDay}
                              onChange={(e) => setEditForm({ ...editForm, isWorkingDay: e.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Ngày làm việc</span>
                          </label>
                        </div>

                        {editForm.isWorkingDay && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Giờ bắt đầu</label>
                              <input
                                type="time"
                                value={editForm.startTime}
                                onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Giờ kết thúc</label>
                              <input
                                type="time"
                                value={editForm.endTime}
                                onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <Coffee className="h-4 w-4" />
                                Giờ nghỉ trưa bắt đầu
                              </label>
                              <input
                                type="time"
                                value={editForm.breakStartTime}
                                onChange={(e) => setEditForm({ ...editForm, breakStartTime: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                <Coffee className="h-4 w-4" />
                                Giờ nghỉ trưa kết thúc
                              </label>
                              <input
                                type="time"
                                value={editForm.breakEndTime}
                                onChange={(e) => setEditForm({ ...editForm, breakEndTime: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => setEditingDay(null)}
                          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSaveWorkingHours}
                          disabled={savingWorkingHours}
                          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {savingWorkingHours ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Thông tin bổ sung */}
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Lưu ý quan trọng:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Khung giờ làm việc sẽ ảnh hưởng đến việc phân công công việc</li>
                  <li>Hệ thống sẽ tự động thêm 30 phút buffer giữa các công việc để di chuyển</li>
                  <li>Slot trong giờ nghỉ trưa sẽ không được đề xuất cho khách hàng</li>
                </ul>
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
};

export default EmployeeSchedulePage;
