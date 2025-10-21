import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MessageCircle, SendHorizontal, UserCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { useBooking } from '../../hooks/useBooking';
import { SectionCard } from '../../shared/components';

type BookingItem = {
  bookingId: string;
  bookingCode?: string;
  status: string;
  serviceId?: number;
  bookingTime?: string;
  createdAt?: string;
  updatedAt?: string;
  note?: string;
  customerInfo?: {
    fullAddress: string;
  };
  address?: string | { fullAddress?: string };
  serviceDetails?: Array<{
    service: {
      name: string;
    };
  }>;
  [key: string]: any;
};

type ConversationMessage = {
  id: string;
  role: 'customer' | 'system';
  content: string;
  timestamp?: string;
};

const statusMessages: Record<string, string> = {
  AWAITING_EMPLOYEE: 'Đơn đang chờ phân công nhân viên phù hợp.',
  CONFIRMED: 'Đơn đã được xác nhận. Nhân viên sẽ đến đúng giờ đã hẹn.',
  IN_PROGRESS: 'Nhân viên đang thực hiện dịch vụ tại địa chỉ của bạn.',
  COMPLETED: 'Dịch vụ đã hoàn tất. Cảm ơn bạn đã sử dụng HouseCare Hub!',
  CANCELLED: 'Đơn đã được hủy theo yêu cầu.'
};

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { getCustomerBookings, updateBooking, isLoading } = useBooking();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadBookings = async () => {
    if (!user?.id) return;
    const data = await getCustomerBookings(user.id);
    if (Array.isArray(data)) {
      setBookings(data as BookingItem[]);
      if (data.length > 0 && !selectedBookingId) {
        setSelectedBookingId(data[0].bookingId);
      }
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user?.id]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [feedback]);

  const selectedBooking = useMemo(
    () => bookings.find(item => item.bookingId === selectedBookingId) || null,
    [bookings, selectedBookingId]
  );

  const conversation = useMemo<ConversationMessage[]>(() => {
    if (!selectedBooking) return [];
    const messages: ConversationMessage[] = [];

    messages.push({
      id: 'created',
      role: 'customer',
      content: `Bạn đã đặt dịch vụ ${
        selectedBooking.serviceDetails?.[0]?.service.name || 'gia đình'
      } với mã ${selectedBooking.bookingCode || selectedBooking.bookingId}.`,
      timestamp: selectedBooking.createdAt
    });

    const statusMessage = statusMessages[selectedBooking.status];
    if (statusMessage) {
      messages.push({
        id: 'status',
        role: 'system',
        content: statusMessage,
        timestamp: selectedBooking.bookingTime || selectedBooking.updatedAt
      });
    }

    if (selectedBooking.note) {
      messages.push({
        id: 'note',
        role: 'customer',
        content: selectedBooking.note,
        timestamp: selectedBooking.updatedAt
      });
    }

    return messages;
  }, [selectedBooking]);

  const handleSendMessage = async () => {
    if (!selectedBooking || !message.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = { note: message.trim() };
      const result = await updateBooking(selectedBooking.bookingId, payload);
      if (result?.success) {
        setMessage('');
        await loadBookings();
        setFeedback({ type: 'success', text: 'Đã cập nhật ghi chú cho đơn dịch vụ.' });
      } else {
        setFeedback({ type: 'error', text: 'Không thể gửi ghi chú. Vui lòng thử lại.' });
      }
    } catch (error) {
      console.error('Send support message error:', error);
      setFeedback({ type: 'error', text: 'Không thể gửi ghi chú. Vui lòng thử lại.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      role="CUSTOMER"
      title="Trung tâm hỗ trợ"
      description="Trao đổi nhanh với đội ngũ chăm sóc khách hàng và theo dõi ghi chú trên từng đơn đặt dịch vụ."
    >
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <SectionCard
          title="Đơn đặt dịch vụ"
          description="Chọn đơn để xem lịch trao đổi và cập nhật thông tin."
          headerSpacing="compact"
        >
          {isLoading && bookings.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải đơn đặt dịch vụ...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
              <MessageCircle className="mx-auto mb-3 h-6 w-6" />
              <p>Chưa có đơn dịch vụ để trao đổi. Hãy đặt dịch vụ để bắt đầu.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(booking => {
                const isActive = booking.bookingId === selectedBookingId;
                return (
                  <button
                    key={booking.bookingId}
                    onClick={() => setSelectedBookingId(booking.bookingId)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 ${
                      isActive
                        ? 'border-sky-300 bg-sky-50/70 text-sky-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        {booking.bookingCode || booking.bookingId}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {booking.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {booking.serviceDetails?.[0]?.service.name || 'Dịch vụ gia đình'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {booking.createdAt
                        ? new Date(booking.createdAt).toLocaleString('vi-VN')
                        : '—'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Trao đổi & ghi chú"
          description={
            selectedBooking
              ? 'Thông tin được đồng bộ với bộ phận chăm sóc khách hàng.'
              : 'Hãy chọn một đơn để xem chi tiết.'
          }
        >
          {selectedBooking ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                    <UserCircle2 className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {bookingTitle(selectedBooking)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {addressLabel(selectedBooking)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex-1 space-y-4 overflow-y-auto pr-2">
                {conversation.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'customer' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        message.role === 'customer'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.timestamp && (
                        <span className="mt-2 block text-xs opacity-70">
                          {new Date(message.timestamp).toLocaleString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {conversation.length === 0 && (
                  <div className="rounded-2xl bg-slate-50 p-5 text-center text-slate-500">
                    <MessageCircle className="mx-auto mb-3 h-6 w-6" />
                    <p>Chưa có trao đổi nào cho đơn này.</p>
                  </div>
                )}
              </div>

              {feedback && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                    feedback.type === 'success'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                      : 'border-rose-100 bg-rose-50 text-rose-600'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <div className="mt-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <label className="block text-sm font-semibold text-slate-700">
                  Gửi cập nhật đến đội ngũ hỗ trợ
                </label>
                <textarea
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  placeholder="Nhập nội dung trao đổi, ví dụ: Giúp mình đến sớm hơn 15 phút nhé..."
                  rows={3}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendHorizontal className="h-4 w-4" />
                    )}
                    Gửi ghi chú
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center text-slate-500">
              <MessageCircle className="h-8 w-8" />
              <p>Chọn một đơn dịch vụ ở bên trái để xem hoặc gửi trao đổi.</p>
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardLayout>
  );
};

const bookingTitle = (booking: BookingItem) =>
  booking.serviceDetails?.[0]?.service.name || 'Dịch vụ gia đình';

const addressLabel = (booking: BookingItem) => {
  if (booking.customerInfo?.fullAddress) return booking.customerInfo.fullAddress;
  if (typeof booking.address === 'string') return booking.address;
  if (booking.address && 'fullAddress' in booking.address) {
    return booking.address.fullAddress || 'Chưa cập nhật địa chỉ';
  }
  return 'Chưa cập nhật địa chỉ';
};

export default ChatPage;
