import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  Briefcase, 
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { SectionCard } from '../../shared/components';
import { getEmployeeScheduleApi } from '../../api/schedule';
import type { EmployeeSchedule } from '../../types/api';

const EmployeeSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const [scheduleData, setScheduleData] = useState<EmployeeSchedule | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeSchedule | null>(null); // Lưu thông tin nhân viên riêng
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false); // Loading riêng cho lịch
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Tính toán khoảng thời gian 7 ngày (Thứ 2 - Chủ nhật)
  useEffect(() => {
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    
    // Tính ngày thứ 2 của tuần
    const monday = new Date(current);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Nếu là Chủ nhật thì lùi 6 ngày, nếu không thì tính từ thứ 2
    monday.setDate(current.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    
    // Tính ngày Chủ nhật của tuần
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    setDateRange({
      start: monday.toISOString(),
      end: sunday.toISOString()
    });
  }, [selectedDate]);

  // Lấy dữ liệu lịch làm việc lần đầu (bao gồm thông tin nhân viên)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.id || !dateRange.start || !dateRange.end) return;

      try {
        setLoading(true);
        setError(null);
        const response = await getEmployeeScheduleApi(user.id, dateRange.start, dateRange.end);
        
        if (response.success && response.data) {
          setScheduleData(response.data);
          setEmployeeInfo(response.data); // Lưu thông tin nhân viên
        } else {
          setError(response.message || 'Không thể tải lịch làm việc');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tải lịch');
      } finally {
        setLoading(false);
      }
    };

    // Chỉ load lần đầu khi component mount
    if (!employeeInfo) {
      fetchInitialData();
    }
  }, [user?.id, dateRange, employeeInfo]);

  // Load lại lịch khi chuyển tuần (không load lại thông tin nhân viên)
  useEffect(() => {
    const fetchScheduleOnly = async () => {
      if (!user?.id || !dateRange.start || !dateRange.end || !employeeInfo) return;

      try {
        setScheduleLoading(true);
        setError(null);
        const response = await getEmployeeScheduleApi(user.id, dateRange.start, dateRange.end);
        
        if (response.success && response.data) {
          // Chỉ cập nhật timeSlots, giữ nguyên thông tin nhân viên
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

    // Chỉ load khi đã có thông tin nhân viên (không phải lần đầu)
    if (employeeInfo && dateRange.start && dateRange.end) {
      fetchScheduleOnly();
    }
  }, [dateRange]); // Chỉ phụ thuộc vào dateRange

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

  // Nhóm time slots theo ngày và ca (sáng/chiều)
  const groupTimeSlotsByDayAndShift = () => {
    if (!scheduleData?.timeSlots) return { days: [], morning: {}, afternoon: {} };

    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const days: Date[] = [];
    
    // Tạo danh sách các ngày trong tuần
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

  if (error) {
    return (
      <DashboardLayout
        role="EMPLOYEE"
        title="Lịch làm việc"
        description="Quản lý lịch làm việc của bạn"
      >
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
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
      description="Quản lý lịch làm việc của bạn"
    >
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

      {/* Lịch làm việc theo tuần */}
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
          {/* Loading overlay chỉ cho bảng lịch */}
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
              {/* Ca Sáng */}
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

              {/* Ca Chiều */}
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
    </DashboardLayout>
  );
};

export default EmployeeSchedulePage;
