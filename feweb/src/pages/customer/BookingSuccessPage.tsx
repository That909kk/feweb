import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  CreditCard, 
  User, 
  Sparkles,
  Calendar,
  Phone,
  Star,
  ArrowRight,
  MessageCircle,
  Eye
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { SectionCard, MetricCard } from '../../shared/components';
import { getBookingStatusInVietnamese, getBookingStatusAccent, formatEndTime } from '../../shared/utils/bookingUtils';
import { getOrCreateConversationApi } from '../../api/chat';
import { useAuth } from '../../contexts/AuthContext';

const BookingSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const bookingData = location.state?.bookingData;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [_conversationError, setConversationError] = useState<string | null>(null); // Reserved for future error display

  // Nếu không có dữ liệu booking, redirect về dashboard
  if (!bookingData) {
    navigate('/customer');
    return null;
  }

  // Tự động tạo conversation khi có nhân viên được phân công
  // Luồng: Sau khi xác nhận đặt lịch thành công -> gọi API get-or-create conversation -> hiển thị trang thành công
  useEffect(() => {
    const createConversation = async () => {
      // Chỉ tạo conversation nếu:
      // 1. Có nhân viên được phân công
      // 2. Có customerId từ user context
      // 3. Chưa tạo conversation (conversationId === null)
      // 4. Không đang trong quá trình tạo
      if (
        bookingData.assignedEmployees?.length > 0 &&
        user?.customerId &&
        !conversationId &&
        !isCreatingConversation
      ) {
        setIsCreatingConversation(true);
        setConversationError(null);
        
        try {
          // Lấy employeeId của nhân viên đầu tiên được phân công
          const firstEmployee = bookingData.assignedEmployees[0];
          const employeeId = firstEmployee.employeeId;

          console.log('[BookingSuccess] 🔄 Creating/Getting conversation:', {
            customerId: user.customerId,
            employeeId: employeeId
          });

          // Gọi API GET /api/v1/conversations/get-or-create
          const response = await getOrCreateConversationApi({
            customerId: user.customerId,
            employeeId: employeeId
          });

          if (response.success && response.data) {
            setConversationId(response.data.conversationId);
            console.log('[BookingSuccess] ✅ Conversation ready:', {
              conversationId: response.data.conversationId,
              isNewConversation: !response.data.lastMessage,
              employeeName: response.data.employeeName
            });
          } else {
            console.warn('[BookingSuccess] ⚠️ API returned success but no data');
          }
        } catch (error: any) {
          console.error('[BookingSuccess] ❌ Error creating conversation:', error);
          setConversationError(error?.response?.data?.message || 'Không thể tạo cuộc hội thoại');
          // Không hiển thị lỗi cho user, chỉ log để debug
          // Người dùng vẫn có thể chat sau thông qua trang chat list
        } finally {
          setIsCreatingConversation(false);
        }
      }
    };

    createConversation();
  }, [bookingData.assignedEmployees, user?.customerId, conversationId, isCreatingConversation]);

  // Lấy trạng thái tiếng Việt và accent color
  const vietnameseStatus = getBookingStatusInVietnamese(bookingData.status);
  const statusAccent = getBookingStatusAccent(bookingData.status);

  return (
    <DashboardLayout
      role="CUSTOMER"
      title="Đặt lịch thành công!"
      description={`Đơn hàng ${bookingData.bookingCode} đã được tạo thành công. Chúng tôi sẽ liên hệ sớm nhất.`}
      actions={
        <div className="flex gap-3">
          <Link
            to="/customer/orders"
            className="inline-flex items-center gap-2 rounded-full border border-brand-outline/40 bg-white px-5 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/40"
          >
            <Eye className="h-4 w-4" />
            Xem đơn hàng
          </Link>
          <Link
            to="/customer/booking"
            className="inline-flex items-center gap-2 rounded-full bg-brand-teal px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-teal/20 transition hover:-translate-y-0.5 hover:bg-brand-tealHover"
          >
            <Calendar className="h-4 w-4" />
            Đặt lịch mới
          </Link>
        </div>
      }
    >
      {/* Success Banner */}
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-8 text-white shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <CheckCircle className="h-10 w-10 text-white drop-shadow-sm" />
          </div>
          <h1 className="mb-3 text-3xl font-bold">Đặt lịch thành công!</h1>
          <p className="mb-4 text-lg text-emerald-50">
            Đơn hàng <span className="font-mono font-semibold text-white">{bookingData.bookingCode}</span> đã được tạo
          </p>
          <div className="rounded-2xl bg-white/15 px-6 py-3 backdrop-blur-sm">
            <div className="text-sm text-emerald-50">Tổng thanh toán</div>
            <div className="text-2xl font-bold">{bookingData.formattedTotalAmount}</div>
          </div>
          
          {/* Chat Ready Notification - Only show when conversation is ready */}
          {conversationId && bookingData.assignedEmployees?.length > 0 && (
            <div className="mt-4 animate-fade-in rounded-full bg-white/20 px-5 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <MessageCircle className="h-4 w-4" />
                <span>Bạn đã có thể chat với nhân viên ngay!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Info Cards */}
        <MetricCard
          icon={Clock}
          label="Trạng thái đơn"
          value={vietnameseStatus}
          accent={statusAccent}
          trendLabel="Sẽ được xử lý trong vòng 24h"
        />
        <MetricCard
          icon={Calendar}
          label="Thời gian thực hiện"
          value={new Date(bookingData.bookingTime).toLocaleDateString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit',
            year: 'numeric'
          })}
          accent="teal"
          trendLabel={`${new Date(bookingData.bookingTime).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          })} - ${bookingData.estimatedDuration}`}
        />
        <MetricCard
          icon={CreditCard}
          label="Thanh toán"
          value={bookingData.paymentInfo?.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : 'Đã thanh toán'}
          accent={bookingData.paymentInfo?.paymentStatus === 'PENDING' ? 'amber' : 'teal'}
          trendLabel={bookingData.paymentInfo?.paymentMethod || bookingData.paymentInfo?.methodName || 'N/A'}
        />
      </div>

      {/* Service Details */}
      <SectionCard
        title="Chi tiết dịch vụ"
        description="Thông tin đầy đủ về các dịch vụ bạn đã đặt."
        className="mt-6"
      >
        <div className="space-y-6">
          {bookingData.serviceDetails?.map((serviceDetail: any, index: number) => (
            <div key={index} className="rounded-2xl border border-brand-outline/20 bg-gradient-to-r from-white to-slate-50/50 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10">
                  <Sparkles className="h-6 w-6 text-brand-teal" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-brand-navy">{serviceDetail.service.name}</h3>
                  <p className="mb-4 text-brand-text/70">{serviceDetail.service.description}</p>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-white p-4">
                      <div className="text-sm font-medium text-brand-text/70">Số lượng</div>
                      <div className="text-lg font-semibold text-brand-navy">
                        {serviceDetail.quantity} {serviceDetail.service.unit}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-4">
                      <div className="text-sm font-medium text-brand-text/70">Thời gian</div>
                      <div className="text-lg font-semibold text-brand-navy">{serviceDetail.formattedDuration}</div>
                    </div>
                    <div className="rounded-xl bg-white p-4">
                      <div className="text-sm font-medium text-brand-text/70">Thành tiền</div>
                      <div className="text-lg font-semibold text-emerald-600">{serviceDetail.formattedSubTotal}</div>
                    </div>
                  </div>

                  {/* Service Options */}
                  {serviceDetail.selectedChoices?.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-3 text-sm font-medium text-brand-text/70">Tùy chọn thêm</div>
                      <div className="space-y-2">
                        {serviceDetail.selectedChoices.map((choice: any, choiceIndex: number) => (
                          <div key={choiceIndex} className="flex items-center justify-between rounded-xl bg-brand-teal/5 px-4 py-3">
                            <span className="text-sm font-medium text-brand-navy">
                              {choice.choiceName} ({choice.optionName})
                            </span>
                            <span className="text-sm font-semibold text-emerald-600">
                              {choice.formattedPriceAdjustment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Booking Information */}
        <SectionCard
          title="Thông tin đặt lịch"
          description="Chi tiết về thời gian và địa điểm thực hiện dịch vụ."
        >
          <div className="space-y-6">
            {/* Time Info */}
            <div className="rounded-2xl border border-brand-outline/20 bg-gradient-to-br from-blue-50 to-sky-50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-navy">Thời gian thực hiện</h3>
                  <p className="text-sm text-brand-text/70">Dự kiến: {bookingData.estimatedDuration}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Ngày thực hiện */}
                <div className="text-lg font-semibold text-brand-navy">
                  {new Date(bookingData.bookingTime).toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                
                {/* Khung thời gian - Hiển thị thời gian bắt đầu và dự kiến kết thúc */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="text-xs font-medium text-brand-text/70 mb-1">Bắt đầu</div>
                    <div className="text-lg font-bold text-blue-600">
                      {new Date(bookingData.bookingTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <div className="text-xs font-medium text-brand-text/70 mb-1">Dự kiến kết thúc</div>
                    <div className="text-lg font-bold text-emerald-600">
                      {formatEndTime(bookingData.bookingTime, bookingData.estimatedDuration)}
                    </div>
                  </div>
                </div>
                
                {/* Duration badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  <Clock className="h-4 w-4" />
                  Thời lượng: {bookingData.estimatedDuration}
                </div>
              </div>
            </div>

            {/* Customer Note - Only show if note exists */}
            {bookingData.note && (
              <div className="rounded-2xl border border-brand-outline/20 bg-gradient-to-br from-yellow-50 to-amber-50 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100">
                    <MessageCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-navy">Ghi chú của khách hàng</h3>
                    <p className="text-sm text-brand-text/70">Thông tin bổ sung</p>
                  </div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <p className="text-brand-navy leading-relaxed">{bookingData.note}</p>
                </div>
              </div>
            )}

            {/* Address Info */}
            <div className="rounded-2xl border border-brand-outline/20 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-navy">Địa chỉ khách hàng</h3>
                  {bookingData.customerInfo.isDefault && (
                    <span className="text-xs text-emerald-600 font-medium">Địa chỉ mặc định</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-brand-navy">{bookingData.customerInfo.fullAddress}</div>
                <div className="text-sm text-brand-text/70">
                  {bookingData.customerInfo.ward}, {bookingData.customerInfo.district}, {bookingData.customerInfo.city}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Employee Assignment */}
        {bookingData.assignedEmployees?.length > 0 ? (
          <SectionCard
            title={`Nhân viên phân công (${bookingData.totalEmployees})`}
            description="Đội ngũ chuyên nghiệp sẽ thực hiện dịch vụ cho bạn."
          >
            <div className="space-y-4">
              {bookingData.assignedEmployees.map((employee: any, index: number) => (
                <div key={index} className="flex items-center gap-4 rounded-2xl border border-brand-outline/20 bg-gradient-to-r from-white to-slate-50/50 p-4">
                  <img 
                    src={employee.avatar} 
                    alt={employee.fullName}
                    className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-brand-navy">{employee.fullName}</h3>
                    <div className="flex items-center gap-2 text-sm text-brand-text/70">
                      <Phone className="h-4 w-4" />
                      {employee.phoneNumber}
                    </div>
                    <div className="mt-1 text-xs text-brand-text/60">
                      Kỹ năng: {employee.skills?.join(', ') || 'N/A'}
                    </div>
                    {employee.rating && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                        <Star className="h-3 w-3 fill-current" />
                        {employee.rating}/5
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : (
          <SectionCard
            title={bookingData.status === 'AWAITING_EMPLOYEE' && bookingData.isVerified === false ? 'Bài đăng tìm nhân viên' : 'Chờ phân công nhân viên'}
            description={bookingData.status === 'AWAITING_EMPLOYEE' && bookingData.isVerified === false ? 'Đơn của bạn đang chờ admin xác minh.' : 'Chúng tôi đang tìm nhân viên phù hợp nhất cho bạn.'}
          >
            {bookingData.status === 'AWAITING_EMPLOYEE' && bookingData.isVerified === false ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                    <User className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="mb-2 font-semibold text-indigo-900">Bài đăng đang chờ xác minh</h3>
                  <p className="text-sm text-indigo-700 mb-4">
                    Đơn của bạn đã được tạo thành <strong>bài đăng tìm nhân viên</strong> và đang chờ admin xác minh. Sau khi được duyệt, bài đăng sẽ hiển thị công khai để nhân viên có thể đăng ký.
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
                    <Clock className="h-4 w-4" />
                    Thời gian xử lý: 1-24 giờ
                  </div>
                </div>

                {/* Booking Post Title - Only show if it's a booking post */}
                {bookingData.title && (
                  <div className="rounded-2xl border border-brand-outline/20 bg-gradient-to-br from-purple-50 to-pink-50 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-navy">Tiêu đề bài đăng</h3>
                        <p className="text-sm text-brand-text/70">Mô tả ngắn gọn về công việc</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <p className="text-lg font-medium text-brand-navy">{bookingData.title}</p>
                    </div>
                  </div>
                )}

                {/* Booking Post Images - Only show if images exist */}
                {(bookingData.imageUrls && bookingData.imageUrls.length > 0) || bookingData.imageUrl ? (
                  <div className="rounded-2xl border border-brand-outline/20 bg-gradient-to-br from-cyan-50 to-blue-50 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100">
                        <Sparkles className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-navy">
                          Hình ảnh tham khảo
                          {bookingData.imageUrls && bookingData.imageUrls.length > 1 && (
                            <span className="ml-2 text-sm text-cyan-600">
                              ({bookingData.imageUrls.length} ảnh)
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-brand-text/70">Ảnh khu vực cần dọn dẹp</p>
                      </div>
                    </div>
                    
                    {/* Grid display for multiple images */}
                    {bookingData.imageUrls && bookingData.imageUrls.length > 0 ? (
                      <div className={`grid gap-3 ${
                        bookingData.imageUrls.length === 1 
                          ? 'grid-cols-1' 
                          : bookingData.imageUrls.length === 2 
                          ? 'grid-cols-2' 
                          : 'grid-cols-2 sm:grid-cols-3'
                      }`}>
                        {bookingData.imageUrls.map((url: string, index: number) => (
                          <div key={index} className="rounded-xl overflow-hidden shadow-md relative group">
                            <img 
                              src={url} 
                              alt={`Booking reference ${index + 1}`} 
                              className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                              {index + 1}/{bookingData.imageUrls?.length || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : bookingData.imageUrl ? (
                      // Fallback to single imageUrl for backward compatibility
                      <div className="rounded-xl overflow-hidden shadow-md">
                        <img 
                          src={bookingData.imageUrl} 
                          alt="Booking reference" 
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <User className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="mb-2 font-semibold text-amber-900">Đang phân công nhân viên</h3>
                <p className="text-sm text-amber-700">
                  Chúng tôi sẽ thông báo ngay khi có nhân viên phù hợp được phân công cho đơn hàng của bạn.
                </p>
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* Payment Summary */}
      <SectionCard
        title="Tóm tắt thanh toán"
        description="Chi tiết về các khoản phí và phương thức thanh toán."
        className="mt-6"
      >
        <div className="space-y-6">
          {/* Service Breakdown */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-6">
            <h3 className="mb-4 font-semibold text-brand-navy">Chi tiết dịch vụ</h3>
            <div className="space-y-3">
              {bookingData.serviceDetails?.map((serviceDetail: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between py-2">
                    <span className="font-medium text-brand-navy">
                      {serviceDetail.service.name} × {serviceDetail.quantity}
                    </span>
                    <span className="font-semibold text-brand-navy">{serviceDetail.formattedSubTotal}</span>
                  </div>
                  {serviceDetail.selectedChoices?.map((choice: any, choiceIndex: number) => (
                    <div key={choiceIndex} className="flex items-center justify-between py-1 pl-4 text-sm text-brand-text/70">
                      <span>+ {choice.choiceName}</span>
                      <span>{choice.formattedPriceAdjustment}</span>
                    </div>
                  ))}
                </div>
              ))}
              
              <div className="border-t border-brand-outline/20 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-brand-navy">Tổng cộng</span>
                  <span className="text-2xl font-bold text-emerald-600">{bookingData.formattedTotalAmount}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-brand-outline/20 bg-white p-4">
              <div className="text-sm font-medium text-brand-text/70">Phương thức thanh toán</div>
              <div className="mt-1 font-semibold text-brand-navy">{bookingData.paymentInfo?.paymentMethod || bookingData.paymentInfo?.methodName || 'N/A'}</div>
            </div>
            <div className="rounded-xl border border-brand-outline/20 bg-white p-4">
              <div className="text-sm font-medium text-brand-text/70">Mã giao dịch</div>
              <div className="mt-1 font-mono text-sm text-brand-navy">{bookingData.paymentInfo?.transactionCode || 'N/A'}</div>
            </div>
            <div className="rounded-xl border border-brand-outline/20 bg-white p-4">
              <div className="text-sm font-medium text-brand-text/70">Trạng thái thanh toán</div>
              <div className="mt-1">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  bookingData.paymentInfo?.paymentStatus === 'PENDING' 
                    ? 'border border-amber-200 bg-amber-50 text-amber-700' 
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                  {bookingData.paymentInfo?.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : 'Đã thanh toán'}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-brand-outline/20 bg-white p-4">
              <div className="text-sm font-medium text-brand-text/70">Ngày tạo đơn</div>
              <div className="mt-1 text-sm text-brand-navy">
                {new Date(bookingData.createdAt).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard
        title="Thao tác nhanh"
        description="Các hành động hữu ích cho đơn hàng của bạn."
        className="mt-6"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            to={`/customer/orders/${bookingData.bookingId}`}
            className="group flex items-center gap-4 rounded-2xl border border-brand-outline/20 bg-gradient-to-r from-white to-blue-50/50 p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 group-hover:bg-blue-200">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-brand-navy group-hover:text-blue-600">Theo dõi đơn hàng</h3>
              <p className="text-sm text-brand-text/70">Xem chi tiết và cập nhật</p>
            </div>
            <ArrowRight className="h-5 w-5 text-brand-text/40 group-hover:text-blue-600" />
          </Link>

          {/* Chat Link - Navigate to conversation if created, otherwise to chat list */}
          <Link
            to={conversationId ? `/customer/chat/${conversationId}` : "/customer/chat"}
            className={`group flex items-center gap-4 rounded-2xl border border-brand-outline/20 bg-gradient-to-r from-white to-emerald-50/50 p-4 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg ${
              !conversationId && bookingData.assignedEmployees?.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            } ${isCreatingConversation ? 'opacity-70 pointer-events-none' : ''}`}
            onClick={(e) => {
              // Prevent navigation if no employees assigned or still creating conversation
              if ((!conversationId && bookingData.assignedEmployees?.length === 0) || isCreatingConversation) {
                e.preventDefault();
              }
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 group-hover:bg-emerald-200">
              {isCreatingConversation ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              ) : (
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-brand-navy group-hover:text-emerald-600">
                {isCreatingConversation ? 'Đang kết nối...' : 'Trao đổi'}
              </h3>
              <p className="text-sm text-brand-text/70">
                {isCreatingConversation 
                  ? 'Đang tạo cuộc hội thoại' 
                  : bookingData.assignedEmployees?.length > 0 
                    ? conversationId 
                      ? 'Chat với nhân viên' 
                      : 'Nhấn để bắt đầu chat'
                    : 'Chờ phân công nhân viên'}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-brand-text/40 group-hover:text-emerald-600" />
          </Link>

          <Link
            to="/customer/booking"
            className="group flex items-center gap-4 rounded-2xl border border-brand-outline/20 bg-gradient-to-r from-white to-teal-50/50 p-4 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 group-hover:bg-teal-200">
              <Calendar className="h-6 w-6 text-teal-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-brand-navy group-hover:text-teal-600">Đặt lịch mới</h3>
              <p className="text-sm text-brand-text/70">Tạo đơn hàng khác</p>
            </div>
            <ArrowRight className="h-5 w-5 text-brand-text/40 group-hover:text-teal-600" />
          </Link>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
};

export default BookingSuccessPage;