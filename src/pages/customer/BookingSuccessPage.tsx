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
  Eye,
  Loader2
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { SectionCard, MetricCard } from '../../shared/components';
import { getBookingStatusInVietnamese, getBookingStatusAccent, formatEndTime } from '../../shared/utils/bookingUtils';
import { createConversationApi, getConversationByBookingApi } from '../../api/chat';
import { useAuth } from '../../contexts/AuthContext';

const BookingSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const bookingData = location.state?.bookingData;
  const isMultiple = location.state?.isMultiple || false;
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [_conversationError, setConversationError] = useState<string | null>(null); // Reserved for future error display

  // Nếu không có dữ liệu booking, redirect về dashboard sau 1 giây (cho phép debug)
  useEffect(() => {
    if (!bookingData) {
      console.error('❌ BookingSuccessPage: No bookingData found in location.state');
      console.log('Location state:', location.state);
      const timer = setTimeout(() => {
        navigate('/customer/orders');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [bookingData, navigate, location.state]);

  // Hiển thị loading nếu chưa có dữ liệu
  if (!bookingData) {
    return (
      <DashboardLayout role="CUSTOMER" title="Đang tải...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Check if this is a recurring booking
  const isRecurring = bookingData.isRecurring || false;
  
  // Extract booking info based on single or multiple or recurring
  const firstBooking = isMultiple && bookingData.bookings?.length > 0 
    ? bookingData.bookings[0] 
    : bookingData;
  
  
  const displayAmount = isRecurring
    ? 'Thanh toán theo từng lần'
    : (isMultiple
      ? bookingData.formattedTotalAmount
      : (bookingData.formattedTotalAmount || new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(bookingData.totalPrice || bookingData.amount || 0)));

  // Lấy danh sách nhân viên từ assignments trong bookingDetails
  const assignedEmployees = firstBooking?.bookingDetails?.flatMap((detail: any) => 
    detail.assignments?.map((assignment: any) => assignment.employee) || []
  ).filter(Boolean) || [];

  // Tự động tạo conversation khi booking thành công và có nhân viên được phân công
  // Luồng: Kiểm tra conversation đã tồn tại -> Nếu chưa thì tạo mới với bookingId
  useEffect(() => {
    const createConversation = async () => {
      // Chỉ tạo conversation nếu:
      // 1. Có nhân viên được phân công
      // 2. Có customerId từ user context
      // 3. Có bookingId
      // 4. Chưa tạo conversation (conversationId === null)
      // 5. Không đang trong quá trình tạo
      if (
        assignedEmployees.length > 0 &&
        user?.customerId &&
        firstBooking.bookingId &&
        !conversationId &&
        !isCreatingConversation
      ) {
        setIsCreatingConversation(true);
        setConversationError(null);
        
        try {
          // Lấy employeeId của nhân viên đầu tiên được phân công
          const firstEmployee = assignedEmployees[0];
          const employeeId = firstEmployee.employeeId;

          console.log('[BookingSuccess] 🔄 Creating conversation with bookingId:', {
            customerId: user.customerId,
            employeeId: employeeId,
            bookingId: firstBooking.bookingId
          });

          // Gọi API POST /api/v1/conversations với bookingId bắt buộc
          const response = await createConversationApi({
            customerId: user.customerId,
            employeeId: employeeId,
            bookingId: firstBooking.bookingId
          });

          if (response.success && response.data) {
            setConversationId(response.data.conversationId);
            console.log('[BookingSuccess] ✅ Conversation created:', {
              conversationId: response.data.conversationId,
              bookingId: firstBooking.bookingId,
              employeeName: response.data.employeeName
            });
          } else {
            console.warn('[BookingSuccess] ⚠️ API returned success but no data');
          }
        } catch (error: any) {
          // Nếu conversation đã tồn tại cho booking này, thử lấy nó
          if (error?.response?.status === 400 || error?.response?.data?.message?.includes('already exists')) {
            console.log('[BookingSuccess] Conversation already exists, fetching it...');
            try {
              const existingConv = await getConversationByBookingApi(firstBooking.bookingId);
              if (existingConv.success && existingConv.data) {
                setConversationId(existingConv.data.conversationId);
                console.log('[BookingSuccess] ✅ Existing conversation found:', {
                  conversationId: existingConv.data.conversationId
                });
              }
            } catch (fetchError) {
              console.error('[BookingSuccess] ❌ Error fetching existing conversation:', fetchError);
            }
          } else {
            console.error('[BookingSuccess] ❌ Error creating conversation:', error);
            setConversationError(error?.response?.data?.message || 'Không thể tạo cuộc hội thoại');
          }
        } finally {
          setIsCreatingConversation(false);
        }
      }
    };

    createConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedEmployees.length, user?.customerId, firstBooking?.bookingId]);

  // Lấy trạng thái tiếng Việt và accent color
  const vietnameseStatus = getBookingStatusInVietnamese(firstBooking?.status || 'PENDING');
  const statusAccent = getBookingStatusAccent(firstBooking?.status || 'PENDING');

  // Tính tổng thời lượng từ bookingDetails
  const estimatedDuration = firstBooking?.bookingDetails?.length > 0
    ? firstBooking.bookingDetails[0].duration || firstBooking.bookingDetails[0].formattedDuration || '2 giờ'
    : '2 giờ';

  // Kiểm tra trạng thái thanh toán
  const paymentStatus = firstBooking?.paymentInfo?.paymentStatus || firstBooking?.payment?.paymentStatus || 'PENDING';
  const isPaid = paymentStatus === 'PAID' || paymentStatus === 'COMPLETED';
  const paymentMethodFromState = location.state?.paymentMethod;
  const paymentMethod = isRecurring 
    ? (paymentMethodFromState === 'cash' ? 'Tiền mặt' : paymentMethodFromState)
    : (firstBooking?.paymentInfo?.paymentMethod || firstBooking?.payment?.paymentMethod || '');
  const isCashPayment = paymentMethod.toUpperCase().includes('CASH') || paymentMethod.toUpperCase().includes('TIỀN MẶT');

  // Debug log
  console.log('🔍 BookingSuccess Debug:', {
    bookingData,
    firstBooking,
    address: firstBooking?.address,
    displayAmount,
    paymentStatus,
    isPaid,
    paymentMethod,
    isCashPayment
  });

  return (
    <DashboardLayout
      role="CUSTOMER"
      title={isPaid ? "Thanh toán thành công!" : "Đặt lịch thành công!"}
      description={isMultiple 
        ? `Đã tạo ${bookingData.totalBookingsCreated || 0} đơn hàng thành công. ${isCashPayment ? 'Vui lòng thanh toán trực tiếp cho nhân viên sau khi hoàn thành công việc.' : 'Chúng tôi sẽ liên hệ sớm nhất.'}`
        : `Đơn hàng ${bookingData.bookingCode || firstBooking?.bookingCode || 'N/A'} đã được tạo thành công. ${isCashPayment ? 'Vui lòng thanh toán trực tiếp cho nhân viên sau khi hoàn thành công việc.' : 'Chúng tôi sẽ liên hệ sớm nhất.'}`
      }
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
          <h1 className="mb-3 text-3xl font-bold">
            {isPaid ? 'Thanh toán thành công!' : 'Đặt lịch thành công!'}
          </h1>
          <p className="mb-4 text-lg text-emerald-50">
            {isRecurring ? (
              <>
                <span className="font-mono font-semibold text-white">{bookingData.title || 'Lịch định kỳ'}</span> đã được tạo<br/>
                <span className="text-sm">Tổng {bookingData.totalBookingsToBeCreated || 0} booking sẽ được tạo, {bookingData.totalGeneratedBookings || 0} booking đầu tiên đã sẵn sàng</span>
              </>
            ) : isMultiple ? (
              <>Đã tạo <span className="font-mono font-semibold text-white">{bookingData.totalBookingsCreated || 0} đơn hàng</span> thành công</>
            ) : (
              <>Đơn hàng <span className="font-mono font-semibold text-white">{bookingData.bookingCode || firstBooking?.bookingCode || 'N/A'}</span> đã được tạo</>
            )}
          </p>
          <div className="rounded-2xl bg-white/15 px-6 py-3 backdrop-blur-sm">
            <div className="text-sm text-emerald-50">
              {isCashPayment ? 'Tổng tiền cần thanh toán' : (isPaid ? 'Đã thanh toán' : 'Tổng thanh toán')}
            </div>
            <div className="text-2xl font-bold">{displayAmount}</div>
            {!isPaid && isCashPayment && (
              <div className="mt-2 text-sm text-yellow-200 font-medium">
                💵 Thanh toán trực tiếp cho nhân viên sau khi hoàn thành
              </div>
            )}
          </div>
          
          {/* Chat Ready Notification - Only show when conversation is ready */}
          {conversationId && assignedEmployees.length > 0 && (
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
          value={isRecurring ? bookingData.statusDisplay || 'ACTIVE' : vietnameseStatus}
          accent={isRecurring ? 'teal' : statusAccent}
          trendLabel={isRecurring ? 'Sẽ được xử lý tự động theo lịch' : 'Sẽ được xử lý trong vòng 24h'}
        />
          <MetricCard
          icon={Calendar}
          label={isRecurring ? "Khoảng thời gian" : (isMultiple ? "Thời gian đầu tiên" : "Thời gian thực hiện")}
          value={isRecurring 
            ? `${new Date(bookingData.startDate).toLocaleDateString('vi-VN')} - ${new Date(bookingData.endDate).toLocaleDateString('vi-VN')}`
            : (firstBooking?.bookingTime ? new Date(firstBooking.bookingTime).toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit',
                year: 'numeric'
              }) : 'N/A')
          }
          accent="teal"
          trendLabel={isRecurring
            ? `${bookingData.recurrenceDaysDisplay} - ${bookingData.bookingTime?.substring(0, 5) || ''}`
            : (firstBooking?.bookingTime ? `${new Date(firstBooking.bookingTime).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
              })} - ${estimatedDuration}` : 'N/A')
          }
        />
        <MetricCard
          icon={CreditCard}
          label="Thanh toán"
          value={isPaid ? 'Đã thanh toán' : (isCashPayment ? 'Thanh toán khi hoàn thành' : 'Chờ thanh toán')}
          accent={isPaid || isCashPayment ? 'teal' : 'amber'}
          trendLabel={paymentMethod || 'N/A'}
        />
      </div>

      {/* Multiple Bookings List */}
      {isMultiple && bookingData.bookings?.length > 0 && (
        <SectionCard
          title={`Danh sách ${bookingData.totalBookingsCreated} đơn hàng`}
          description="Tất cả các đơn hàng đã được tạo thành công."
          className="mt-6"
        >
          <div className="space-y-4">
            {bookingData.bookings.map((booking: any, index: number) => (
              <div key={booking.bookingId} className="rounded-2xl border border-brand-outline/20 bg-gradient-to-r from-white to-slate-50/50 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-navy">
                      Đơn hàng #{index + 1}: {booking.bookingCode}
                    </h3>
                    <p className="text-sm text-brand-text/70">
                      {new Date(booking.bookingTime).toLocaleDateString('vi-VN', { 
                        weekday: 'long',
                        day: '2-digit', 
                        month: '2-digit',
                        year: 'numeric'
                      })} - {new Date(booking.bookingTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-brand-text/70">Thành tiền</div>
                    <div className="text-xl font-bold text-emerald-600">{booking.formattedTotalAmount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Service Details */}
      <SectionCard
        title="Chi tiết dịch vụ"
        description="Thông tin đầy đủ về các dịch vụ bạn đã đặt."
        className="mt-6"
      >
        <div className="space-y-6">
          {(isRecurring 
            ? bookingData.service ? [{ service: bookingData.service, quantity: 1, formattedDuration: bookingData.service?.estimatedDurationHours ? `${bookingData.service.estimatedDurationHours}h` : '2h', formattedSubTotal: bookingData.service?.formattedPricePerUnit || 'Thanh toán theo từng lần', selectedChoices: [] }] : []
            : (firstBooking?.bookingDetails || firstBooking?.serviceDetails)
          )?.map((serviceDetail: any, index: number) => (
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
                  <h3 className="font-semibold text-brand-navy">
                    {isRecurring ? 'Lịch định kỳ' : 'Thời gian thực hiện'}
                  </h3>
                  <p className="text-sm text-brand-text/70">
                    {isRecurring ? bookingData.recurrenceTypeDisplay : `Dự kiến: ${bookingData.estimatedDuration || estimatedDuration}`}
                  </p>
                </div>
              </div>
              
              {isRecurring ? (
                /* Recurring booking time info */
                <div className="space-y-4">
                  {/* Date range */}
                  <div className="text-lg font-semibold text-brand-navy">
                    {new Date(bookingData.startDate).toLocaleDateString('vi-VN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} - {new Date(bookingData.endDate).toLocaleDateString('vi-VN', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  {/* Recurrence pattern */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="text-xs font-medium text-brand-text/70 mb-1">Lặp lại vào</div>
                      <div className="text-base font-bold text-blue-600">
                        {bookingData.recurrenceDaysDisplay}
                      </div>
                    </div>
                    
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="text-xs font-medium text-brand-text/70 mb-1">Giờ thực hiện</div>
                      <div className="text-lg font-bold text-emerald-600">
                        {bookingData.bookingTime?.substring(0, 5) || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Summary badge */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                    <Calendar className="h-4 w-4" />
                    {bookingData.totalGeneratedBookings || 0} booking đã tạo, {bookingData.totalBookingsToBeCreated || 0} booking sẽ tạo tổng cộng
                  </div>
                </div>
              ) : (
                /* Single booking time info */
                <div className="space-y-4">
                  {/* Ngày thực hiện */}
                  <div className="text-lg font-semibold text-brand-navy">
                    {firstBooking?.bookingTime ? new Date(firstBooking.bookingTime).toLocaleDateString('vi-VN', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'N/A'}
                  </div>
                  
                  {/* Khung thời gian - Hiển thị thời gian bắt đầu và dự kiến kết thúc */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="text-xs font-medium text-brand-text/70 mb-1">Bắt đầu</div>
                      <div className="text-lg font-bold text-blue-600">
                        {firstBooking?.bookingTime ? new Date(firstBooking.bookingTime).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="text-xs font-medium text-brand-text/70 mb-1">Dự kiến kết thúc</div>
                      <div className="text-lg font-bold text-emerald-600">
                        {firstBooking?.bookingTime && estimatedDuration 
                          ? formatEndTime(firstBooking.bookingTime, estimatedDuration)
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Duration badge */}
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                    <Clock className="h-4 w-4" />
                    Thời lượng: {estimatedDuration}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Note - Only show if note exists */}
            {firstBooking.note && (
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
                  <p className="text-brand-navy leading-relaxed">{firstBooking.note}</p>
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
                  {(isRecurring ? bookingData.address?.isDefault : firstBooking?.address?.isDefault) && (
                    <span className="text-xs text-emerald-600 font-medium">Địa chỉ mặc định</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium text-brand-navy">
                  {isRecurring 
                    ? (bookingData.address?.fullAddress || 'Chưa có thông tin địa chỉ')
                    : (firstBooking?.address?.fullAddress || 'Chưa có thông tin địa chỉ')
                  }
                </div>
                {(isRecurring ? bookingData.address : firstBooking?.address) && (
                  <div className="text-sm text-brand-text/70">
                    {[(isRecurring ? bookingData.address : firstBooking.address).ward, 
                      (isRecurring ? bookingData.address : firstBooking.address).district, 
                      (isRecurring ? bookingData.address : firstBooking.address).city]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Employee Assignment */}
        {assignedEmployees.length > 0 ? (
          <SectionCard
            title={`Nhân viên phân công (${assignedEmployees.length})`}
            description="Đội ngũ chuyên nghiệp sẽ thực hiện dịch vụ cho bạn."
          >
            <div className="space-y-4">
              {assignedEmployees.map((employee: any, index: number) => (
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
              
              {/* Chat Button - Hiển thị khi đã có conversation */}
              {conversationId && (
                <div className="pt-2">
                  <button
                    onClick={() => navigate(`/customer/chat/${conversationId}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-teal to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-teal/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-teal/30"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Nhắn tin với nhân viên
                  </button>
                </div>
              )}
              
              {/* Loading indicator khi đang tạo conversation */}
              {isCreatingConversation && (
                <div className="pt-2">
                  <div className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-6 py-3 text-sm font-medium text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-teal"></div>
                    Đang thiết lập cuộc trò chuyện...
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        ) : (
          <SectionCard
            title={firstBooking.status === 'AWAITING_EMPLOYEE' && firstBooking.isVerified === false ? 'Bài đăng tìm nhân viên' : 'Chờ phân công nhân viên'}
            description={firstBooking.status === 'AWAITING_EMPLOYEE' && firstBooking.isVerified === false ? 'Đơn của bạn đang chờ admin xác minh.' : 'Chúng tôi đang tìm nhân viên phù hợp nhất cho bạn.'}
          >
            {firstBooking.status === 'AWAITING_EMPLOYEE' && firstBooking.isVerified === false ? (
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
                {firstBooking.title && (
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
                      <p className="text-lg font-medium text-brand-navy">{firstBooking.title}</p>
                    </div>
                  </div>
                )}

                {/* Booking Post Images - Only show if images exist */}
                {(firstBooking.imageUrls && firstBooking.imageUrls.length > 0) || firstBooking.imageUrl ? (
                  <div className="rounded-2xl border border-brand-outline/20 bg-gradient-to-br from-cyan-50 to-blue-50 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100">
                        <Sparkles className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-navy">
                          Hình ảnh tham khảo
                          {firstBooking.imageUrls && firstBooking.imageUrls.length > 1 && (
                            <span className="ml-2 text-sm text-cyan-600">
                              ({firstBooking.imageUrls.length} ảnh)
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-brand-text/70">Ảnh khu vực cần dọn dẹp</p>
                      </div>
                    </div>
                    
                    {/* Grid display for multiple images */}
                    {firstBooking.imageUrls && firstBooking.imageUrls.length > 0 ? (
                      <div className={`grid gap-3 ${
                        firstBooking.imageUrls.length === 1 
                          ? 'grid-cols-1' 
                          : firstBooking.imageUrls.length === 2 
                          ? 'grid-cols-2' 
                          : 'grid-cols-2 sm:grid-cols-3'
                      }`}>
                        {firstBooking.imageUrls.map((url: string, index: number) => (
                          <div key={index} className="rounded-xl overflow-hidden shadow-md relative group">
                            <img 
                              src={url} 
                              alt={`Booking reference ${index + 1}`} 
                              className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                              {index + 1}/{firstBooking.imageUrls?.length || 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : firstBooking.imageUrl ? (
                      // Fallback to single imageUrl for backward compatibility
                      <div className="rounded-xl overflow-hidden shadow-md">
                        <img 
                          src={firstBooking.imageUrl} 
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
              {isRecurring ? (
                // Recurring booking service details
                bookingData.recurringBookingDetails?.map((serviceDetail: any, index: number) => (
                  <div key={index}>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-medium text-brand-navy">
                        {serviceDetail.service.name} × 1
                      </span>
                      <span className="font-semibold text-brand-navy">{serviceDetail.formattedSubTotal}</span>
                    </div>
                  </div>
                ))
              ) : (
                // Single/multiple booking service details
                (firstBooking?.bookingDetails || firstBooking?.serviceDetails)?.map((serviceDetail: any, index: number) => (
                  <div key={index}>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-medium text-brand-navy">
                        {serviceDetail.service?.name || serviceDetail.serviceName} × {serviceDetail.quantity || 1}
                      </span>
                      <span className="font-semibold text-brand-navy">{serviceDetail.formattedSubTotal || new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(serviceDetail.subTotal || serviceDetail.price || 0)}</span>
                    </div>
                    {serviceDetail.selectedChoices?.map((choice: any, choiceIndex: number) => (
                      <div key={choiceIndex} className="flex items-center justify-between py-1 pl-4 text-sm text-brand-text/70">
                        <span>+ {choice.choiceName}</span>
                        <span>{choice.formattedPriceAdjustment}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
              
              {/* Subtotal (Base Amount) */}
              {firstBooking?.baseAmount !== undefined && (
                <div className="border-t border-brand-outline/20 pt-3">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-brand-text/70">Tạm tính</span>
                    <span className="font-medium text-brand-navy">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(firstBooking.baseAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Fee Breakdown */}
              {firstBooking?.fees && firstBooking.fees.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-brand-text/70">Phụ phí</h4>
                  {firstBooking.fees.map((fee: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-1 pl-4">
                      <span className="text-sm text-brand-text/70">
                        {fee.name}
                        {fee.type === 'PERCENT' && (
                          <span className="ml-1 text-xs text-brand-text/50">
                            ({(fee.value * 100).toFixed(0)}%)
                          </span>
                        )}
                        {fee.systemSurcharge && (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            Hệ thống
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-amber-600">
                        +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fee.amount)}
                      </span>
                    </div>
                  ))}
                  
                  {/* Total Fees */}
                  {firstBooking?.totalFees !== undefined && (
                    <div className="flex items-center justify-between border-t border-dashed border-brand-outline/20 py-2 pl-4">
                      <span className="text-sm font-medium text-brand-text/70">Tổng phụ phí</span>
                      <span className="font-semibold text-amber-600">
                        +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(firstBooking.totalFees)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t border-brand-outline/20 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-brand-navy">Tổng cộng</span>
                  <span className="text-2xl font-bold text-emerald-600">{displayAmount}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-brand-outline/20 bg-white p-4">
              <div className="text-sm font-medium text-brand-text/70">Phương thức thanh toán</div>
              <div className="mt-1 font-semibold text-brand-navy">
                {isRecurring ? (
                  paymentMethod || 'Thanh toán theo từng lần'
                ) : (
                  firstBooking?.payment?.paymentMethod || firstBooking?.paymentInfo?.paymentMethod || firstBooking?.paymentInfo?.methodName || 'N/A'
                )}
              </div>
            </div>
            <div className="rounded-xl border border-brand-outline/20 bg-white p-4">
              <div className="text-sm font-medium text-brand-text/70">Mã giao dịch</div>
              <div className="mt-1 font-mono text-sm text-brand-navy">
                {isRecurring ? (
                  bookingData.recurringBookingId || 'N/A'
                ) : (
                  firstBooking?.payment?.transactionCode || firstBooking?.paymentInfo?.transactionCode || 'N/A'
                )}
              </div>
            </div>
            <div className="rounded-xl border border-brand-outline/20 bg-white p-4">
              <div className="text-sm font-medium text-brand-text/70">Trạng thái thanh toán</div>
              <div className="mt-1">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isRecurring
                    ? 'border border-blue-200 bg-blue-50 text-blue-700'
                    : (firstBooking?.payment?.paymentStatus || firstBooking?.paymentInfo?.paymentStatus) === 'PENDING' 
                      ? 'border border-amber-200 bg-amber-50 text-amber-700' 
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                  {isRecurring 
                    ? 'Thanh toán theo từng lần' 
                    : (firstBooking?.payment?.paymentStatus || firstBooking?.paymentInfo?.paymentStatus) === 'PENDING' 
                      ? 'Chờ thanh toán' 
                      : 'Đã thanh toán'
                  }
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-brand-outline/20 bg-white p-4">
              <div className="text-sm font-medium text-brand-text/70">Ngày tạo đơn</div>
              <div className="mt-1 text-sm text-brand-navy">
                {isRecurring 
                  ? (bookingData.createdAt ? new Date(bookingData.createdAt).toLocaleString('vi-VN') : 'N/A')
                  : (firstBooking?.createdAt ? new Date(firstBooking.createdAt).toLocaleString('vi-VN') : 'N/A')
                }
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
            to={`/customer/orders/${firstBooking.bookingId}`}
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
              !conversationId && firstBooking.assignedEmployees?.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            } ${isCreatingConversation ? 'opacity-70 pointer-events-none' : ''}`}
            onClick={(e) => {
              // Prevent navigation if no employees assigned or still creating conversation
              if ((!conversationId && firstBooking.assignedEmployees?.length === 0) || isCreatingConversation) {
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
                  : assignedEmployees.length > 0 
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