/**
 * Employee Booking Posts Page
 * Hiển thị các booking posts (verified awaiting employee) để nhân viên có thể nhận việc
 * Dựa theo API-Booking-Verified-Awaiting-Employee.md
 */

import React, { useEffect, useState } from 'react';
import { 
  Briefcase, Calendar, Clock, MapPin, AlertCircle, Loader2, 
  Tag, CheckCircle, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getVerifiedAwaitingEmployeeBookingsApi, acceptBookingDetailApi } from '../../api/employee';
import DashboardLayout from '../../layouts/DashboardLayout';
import { MetricCard, SectionCard } from '../../shared/components';

interface BookingPost {
  success: boolean;
  message: string;
  data: {
    bookingId: string;
    bookingCode: string;
    customerId: string;
    customerName: string;
    address: {
      addressId: string;
      fullAddress: string;
      ward: string;
      city: string;
      latitude: number;
      longitude: number;
      isDefault: boolean;
    };
    bookingTime: string;
    note: string;
    totalAmount: number;
    formattedTotalAmount: string;
    status: string;
    title: string | null;
    imageUrl: string | null;
    isVerified: boolean;
    adminComment: string | null;
    promotion: any;
    bookingDetails: Array<{
      bookingDetailId: string;
      service: {
        serviceId: number;
        name: string;
        description: string;
        basePrice: number;
        unit: string;
        estimatedDurationHours: number;
        iconUrl: string;
        categoryName: string;
        isActive: boolean;
      };
      quantity: number;
      pricePerUnit: number;
      formattedPricePerUnit: string;
      subTotal: number;
      formattedSubTotal: string;
      selectedChoices: any[];
      assignments: any[];
      duration: string;
      formattedDuration: string;
    }>;
    payment: any;
    createdAt: string;
  };
}

export const BookingPosts: React.FC = () => {
  const { user } = useAuth();
  const [bookingPosts, setBookingPosts] = useState<BookingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadBookingPosts();
  }, [currentPage]);

  const loadBookingPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getVerifiedAwaitingEmployeeBookingsApi(currentPage, 10);
      
      setBookingPosts(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (err: any) {
      console.error('Error loading booking posts:', err);
      setError(err.message || 'Không thể tải danh sách booking posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingDetailId: string) => {
    // Get employeeId from profileData
    const employeeData = user?.profileData as any;
    const employeeId = employeeData?.employeeId;

    if (!employeeId) {
      setError('Không tìm thấy thông tin nhân viên');
      return;
    }

    try {
      setAcceptingId(bookingDetailId);
      setError(null);

      await acceptBookingDetailApi(bookingDetailId, employeeId);
      
      // Reload danh sách sau khi nhận việc thành công
      await loadBookingPosts();
      
      setAcceptingId(null);
    } catch (err: any) {
      console.error('Error accepting booking:', err);
      setError(err.message || 'Không thể nhận công việc này');
      setAcceptingId(null);
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const metrics = {
    total: bookingPosts.length,
    withImage: bookingPosts.filter(bp => bp.data.imageUrl).length
  };

  return (
    <DashboardLayout
      role="EMPLOYEE"
      title="Bài đăng tìm nhân viên"
      description="Các booking đã được xác minh đang chờ nhân viên nhận việc"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <MetricCard
          icon={Briefcase}
          label="Tổng bài đăng khả dụng"
          value={`${metrics.total}`}
          accent="teal"
          trendLabel="Các công việc đã được admin xác minh"
        />
        <MetricCard
          icon={Tag}
          label="Bài đăng có hình ảnh"
          value={`${metrics.withImage}`}
          accent="navy"
          trendLabel="Khách hàng đã đăng kèm hình ảnh chi tiết"
        />
      </div>

      <SectionCard
        title="Danh sách Bài đăng"
        description="Nhấn 'Nhận việc' để nhận công việc phù hợp với bạn"
      >
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 py-16 text-slate-500">
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            Đang tải dữ liệu...
          </div>
        ) : bookingPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-6 py-16 text-center text-slate-500">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="font-medium text-slate-700">Không có bài đăng nào</p>
            <p className="mt-1 text-sm">Hiện tại không có công việc nào đang chờ nhận</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookingPosts.map((bookingPost) => (
              <div
                key={bookingPost.data.bookingId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {bookingPost.data.bookingCode}
                        </h3>
                        {bookingPost.data.isVerified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle className="h-3 w-3" />
                            Đã xác minh
                          </span>
                        )}
                        {bookingPost.data.imageUrl && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                            <Tag className="h-3 w-3" />
                            Có hình ảnh
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                        <User className="h-4 w-4" />
                        {bookingPost.data.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">
                        {bookingPost.data.formattedTotalAmount}
                      </div>
                      <div className="text-xs text-slate-500">Tổng giá trị</div>
                    </div>
                  </div>

                  {/* Title if exists (booking post) */}
                  {bookingPost.data.title && (
                    <div className="mb-4 rounded-xl bg-indigo-50 p-4">
                      <div className="text-sm font-medium text-indigo-900">
                        {bookingPost.data.title}
                      </div>
                    </div>
                  )}

                  {/* Image if exists */}
                  {bookingPost.data.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={bookingPost.data.imageUrl}
                        alt="Booking post"
                        className="h-48 w-full rounded-xl object-cover"
                      />
                    </div>
                  )}

                  {/* Info grid */}
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                      <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
                      <div>
                        <div className="text-xs font-medium text-slate-500">Thời gian</div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {formatDateTime(bookingPost.data.bookingTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                      <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
                      <div>
                        <div className="text-xs font-medium text-slate-500">Địa điểm</div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {bookingPost.data.address.fullAddress}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  {bookingPost.data.note && (
                    <div className="mb-4 rounded-xl bg-amber-50 p-3">
                      <div className="text-xs font-medium text-amber-700">Ghi chú</div>
                      <div className="mt-1 text-sm text-amber-900">{bookingPost.data.note}</div>
                    </div>
                  )}

                  {/* Services */}
                  <div className="mb-4 space-y-2">
                    <div className="text-xs font-medium text-slate-500">Dịch vụ yêu cầu</div>
                    {bookingPost.data.bookingDetails.map((detail) => (
                      <div
                        key={detail.bookingDetailId}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="flex items-center gap-3">
                          {detail.service.iconUrl && (
                            <img
                              src={detail.service.iconUrl}
                              alt={detail.service.name}
                              className="h-10 w-10 rounded-lg"
                            />
                          )}
                          <div>
                            <div className="font-medium text-slate-900">
                              {detail.service.name}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {detail.formattedDuration}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-900">
                            {detail.formattedSubTotal}
                          </div>
                          <div className="text-xs text-slate-500">
                            {detail.quantity} {detail.service.unit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    {bookingPost.data.bookingDetails.map((detail) => (
                      <button
                        key={detail.bookingDetailId}
                        onClick={() => handleAcceptBooking(detail.bookingDetailId)}
                        disabled={acceptingId === detail.bookingDetailId}
                        className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-medium text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {acceptingId === detail.bookingDetailId ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang nhận việc...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Nhận việc: {detail.service.name}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang trước
            </button>
            <span className="text-sm text-slate-600">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        )}
      </SectionCard>
    </DashboardLayout>
  );
};
