/**
 * Utilities for booking-related operations
 */

export type BookingStatus = 
  | 'PENDING'
  | 'AWAITING_EMPLOYEE'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type StatusAccent = 'navy' | 'teal' | 'amber' | 'secondary' | 'slate';

/**
 * Chuyển đổi trạng thái booking từ tiếng Anh sang tiếng Việt
 * @param status - Trạng thái booking bằng tiếng Anh
 * @returns Trạng thái booking bằng tiếng Việt
 */
export const getBookingStatusInVietnamese = (status: BookingStatus | string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'Chờ xử lý',
    'AWAITING_EMPLOYEE': 'Chờ nhân viên xác nhận',
    'CONFIRMED': 'Đã xác nhận',
    'IN_PROGRESS': 'Đang thực hiện',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy'
  };
  
  return statusMap[status] || status;
};

/**
 * Lấy màu accent dựa trên trạng thái booking
 * @param status - Trạng thái booking
 * @returns Màu accent tương ứng
 */
export const getBookingStatusAccent = (status: BookingStatus | string): StatusAccent => {
  const accentMap: Record<string, StatusAccent> = {
    'PENDING': 'amber',
    'AWAITING_EMPLOYEE': 'amber',
    'CONFIRMED': 'teal',
    'IN_PROGRESS': 'navy',
    'COMPLETED': 'teal',
    'CANCELLED': 'slate'
  };
  
  return accentMap[status] || 'secondary';
};

/**
 * Lấy icon class dựa trên trạng thái booking
 * @param status - Trạng thái booking
 * @returns CSS class cho icon
 */
export const getBookingStatusIcon = (status: BookingStatus | string): string => {
  const iconMap: Record<string, string> = {
    'PENDING': 'text-amber-600',
    'AWAITING_EMPLOYEE': 'text-amber-600',
    'CONFIRMED': 'text-teal-600',
    'IN_PROGRESS': 'text-blue-600',
    'COMPLETED': 'text-emerald-600',
    'CANCELLED': 'text-slate-600'
  };
  
  return iconMap[status] || 'text-slate-600';
};

/**
 * Kiểm tra xem trạng thái có phải là trạng thái hoàn thành không
 * @param status - Trạng thái booking
 * @returns True nếu là trạng thái hoàn thành
 */
export const isBookingCompleted = (status: BookingStatus | string): boolean => {
  return status === 'COMPLETED';
};

/**
 * Kiểm tra xem trạng thái có phải là trạng thái đã hủy không
 * @param status - Trạng thái booking
 * @returns True nếu là trạng thái đã hủy
 */
export const isBookingCancelled = (status: BookingStatus | string): boolean => {
  return status === 'CANCELLED';
};

/**
 * Kiểm tra xem booking có thể hủy được không
 * @param status - Trạng thái booking
 * @returns True nếu có thể hủy
 */
export const canCancelBooking = (status: BookingStatus | string): boolean => {
  return ['PENDING', 'AWAITING_EMPLOYEE', 'CONFIRMED'].includes(status);
};

/**
 * Lấy thông báo mô tả trạng thái
 * @param status - Trạng thái booking
 * @returns Thông báo mô tả trạng thái
 */
export const getBookingStatusDescription = (status: BookingStatus | string): string => {
  const descriptionMap: Record<string, string> = {
    'PENDING': 'Đơn hàng đang chờ được xử lý',
    'AWAITING_EMPLOYEE': 'Đang chờ nhân viên xác nhận thời gian',
    'CONFIRMED': 'Đơn hàng đã được xác nhận và sẵn sàng thực hiện',
    'IN_PROGRESS': 'Nhân viên đang thực hiện dịch vụ',
    'COMPLETED': 'Dịch vụ đã hoàn thành thành công',
    'CANCELLED': 'Đơn hàng đã được hủy bỏ'
  };
  
  return descriptionMap[status] || 'Trạng thái không xác định';
};

/**
 * Tính toán thời gian kết thúc dựa trên thời gian bắt đầu và thời lượng ước tính
 * @param startTime - Thời gian bắt đầu
 * @param estimatedDuration - Thời lượng ước tính (ví dụ: "2 giờ 30 phút")
 * @returns Date object của thời gian kết thúc
 */
export const calculateEndTime = (startTime: string | Date, estimatedDuration: string): Date => {
  const start = new Date(startTime);
  
  // Parse duration từ estimatedDuration (ví dụ: "2 giờ 30 phút" hoặc "2 hours 30 minutes")
  let totalMinutes = 0;
  
  // Tìm giờ
  const hoursMatch = estimatedDuration.match(/(\d+)\s*(giờ|hour)/i);
  if (hoursMatch) {
    totalMinutes += parseInt(hoursMatch[1]) * 60;
  }
  
  // Tìm phút
  const minutesMatch = estimatedDuration.match(/(\d+)\s*(phút|minute)/i);
  if (minutesMatch) {
    totalMinutes += parseInt(minutesMatch[1]);
  }
  
  // Nếu không parse được, mặc định 2 giờ
  if (totalMinutes === 0) {
    totalMinutes = 120;
  }
  
  return new Date(start.getTime() + (totalMinutes * 60 * 1000));
};

/**
 * Format thời gian kết thúc thành chuỗi hiển thị
 * @param startTime - Thời gian bắt đầu
 * @param estimatedDuration - Thời lượng ước tính
 * @returns Thời gian kết thúc định dạng "HH:mm"
 */
export const formatEndTime = (startTime: string | Date, estimatedDuration: string): string => {
  const endTime = calculateEndTime(startTime, estimatedDuration);
  return endTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};