/**
 * Employee Booking Posts Page
 * Hiển thị các booking posts (verified awaiting employee) để nhân viên có thể nhận việc
 * Dựa theo API-Booking-Verified-Awaiting-Employee.md
 */

import React, { useEffect, useState } from 'react';
import { 
  Briefcase, Calendar, Clock, MapPin, AlertCircle, Loader2, 
  Tag, CheckCircle, Sparkles, X, ChevronLeft, ChevronRight, MapPinned
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
    customer?: {
      customerId: string;
      fullName: string;
      avatar: string;
      email: string;
      phoneNumber: string;
      isMale: boolean;
      birthdate: string;
      rating: number | null;
      vipLevel: string | null;
    };
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
    imageUrl: string | null; // Deprecated: use imageUrls instead
    imageUrls: string[] | null; // Array of image URLs
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBookingDetailId, setPendingBookingDetailId] = useState<string | null>(null);
  const [matchEmployeeZones, setMatchEmployeeZones] = useState(true);

  useEffect(() => {
    loadBookingPosts();
  }, [currentPage, matchEmployeeZones]);

  // Keyboard navigation for image gallery
  useEffect(() => {
    if (!selectedImage || currentImages.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      } else if (e.key === 'Escape') {
        closeImageGallery();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentImages, currentImageIndex]);

  const loadBookingPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getVerifiedAwaitingEmployeeBookingsApi(currentPage, 10, matchEmployeeZones);
      
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
    // Hiển thị popup xác nhận trước
    setPendingBookingDetailId(bookingDetailId);
    setShowConfirmModal(true);
  };

  const confirmAcceptBooking = async () => {
    if (!pendingBookingDetailId) return;

    // Get employeeId from profileData
    const employeeData = user?.profileData as any;
    const employeeId = employeeData?.employeeId;

    if (!employeeId) {
      setError('Không tìm thấy thông tin nhân viên');
      setShowConfirmModal(false);
      setPendingBookingDetailId(null);
      return;
    }

    try {
      setAcceptingId(pendingBookingDetailId);
      setError(null);
      setShowConfirmModal(false);

      await acceptBookingDetailApi(pendingBookingDetailId, employeeId);
      
      // Reload danh sách sau khi nhận việc thành công
      await loadBookingPosts();
      
      setAcceptingId(null);
      setPendingBookingDetailId(null);
    } catch (err: any) {
      console.error('Error accepting booking:', err);
      setError(err.message || 'Không thể nhận công việc này');
      setAcceptingId(null);
      setPendingBookingDetailId(null);
    }
  };

  const cancelAcceptBooking = () => {
    setShowConfirmModal(false);
    setPendingBookingDetailId(null);
  };

  const openImageGallery = (images: string[], startIndex: number = 0) => {
    setCurrentImages(images);
    setCurrentImageIndex(startIndex);
    setSelectedImage(images[startIndex]);
  };

  const closeImageGallery = () => {
    setSelectedImage(null);
    setCurrentImages([]);
    setCurrentImageIndex(0);
  };

  const goToPreviousImage = () => {
    if (currentImages.length === 0) return;
    const newIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(currentImages[newIndex]);
  };

  const goToNextImage = () => {
    if (currentImages.length === 0) return;
    const newIndex = (currentImageIndex + 1) % currentImages.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(currentImages[newIndex]);
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

  const getTimeAgo = (dateTimeStr: string) => {
    const now = new Date();
    const createdDate = new Date(dateTimeStr);
    const diffInMs = now.getTime() - createdDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Vừa xong';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else if (diffInDays === 1) {
      return 'Hôm qua';
    } else if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    } else {
      return formatDateTime(dateTimeStr);
    }
  };

  const metrics = {
    total: bookingPosts.length,
    withImage: bookingPosts.filter(bp => (bp.data.imageUrls && bp.data.imageUrls.length > 0) || bp.data.imageUrl).length
  };

  return (
    <>
      <DashboardLayout
        role="EMPLOYEE"
        title="Bài đăng tìm nhân viên"
        description="Các booking đã được xác minh đang chờ nhân viên nhận việc"
      >
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
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
        {/* Filter Toggle */}
        <div className="mb-4 sm:mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <MapPinned className="h-5 w-5 text-slate-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm sm:text-base text-slate-900">Hiển thị các bài đăng phù hợp</div>
                <div className="text-xs sm:text-sm text-slate-500">
                  {matchEmployeeZones 
                    ? 'Chỉ hiển thị công việc trong khu vực của bạn' 
                    : 'Hiển thị tất cả công việc (bao gồm ngoài khu vực)'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setMatchEmployeeZones(!matchEmployeeZones)}
              className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors ${
                matchEmployeeZones ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  matchEmployeeZones ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

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
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Tag bài đăng nếu có title hoặc imageUrls */}
                        {(bookingPost.data.title || (bookingPost.data.imageUrls && bookingPost.data.imageUrls.length > 0) || bookingPost.data.imageUrl) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700">
                            <Sparkles className="h-3 w-3" />
                            Bài đăng
                          </span>
                        )}
                        
                        {bookingPost.data.isVerified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle className="h-3 w-3" />
                            Đã xác minh
                          </span>
                        )}
                        {((bookingPost.data.imageUrls && bookingPost.data.imageUrls.length > 0) || bookingPost.data.imageUrl) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            <Tag className="h-3 w-3" />
                            {bookingPost.data.imageUrls && bookingPost.data.imageUrls.length > 1 
                              ? `${bookingPost.data.imageUrls.length} hình ảnh` 
                              : 'Có hình ảnh'}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2.5">
                        {bookingPost.data.customer?.avatar && (
                          <img
                            src={bookingPost.data.customer.avatar}
                            alt={bookingPost.data.customerName}
                            className="h-10 w-10 rounded-full object-cover border-2 border-slate-200"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-slate-700">{bookingPost.data.customerName}</span>
                          <span className="text-xs text-slate-500">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {getTimeAgo(bookingPost.data.createdAt)}
                          </span>
                        </div>
                      </div>
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
                    <div className="mb-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4">
                      <div className="text-lg font-bold text-indigo-900">
                        {bookingPost.data.title}
                      </div>
                    </div>
                  )}

                  {/* Images if exist - Display multiple images or single image */}
                  {((bookingPost.data.imageUrls && bookingPost.data.imageUrls.length > 0) || bookingPost.data.imageUrl) && (
                    <div className="mb-4">
                      {bookingPost.data.imageUrls && bookingPost.data.imageUrls.length > 0 ? (
                        <div className={`grid gap-1 ${
                          bookingPost.data.imageUrls.length === 1 
                            ? 'grid-cols-1' 
                            : bookingPost.data.imageUrls.length === 2 
                            ? 'grid-cols-2' 
                            : 'grid-cols-2'
                        }`}>
                          {bookingPost.data.imageUrls.slice(0, 5).map((url, index) => (
                            <div 
                              key={index} 
                              className={`relative rounded-lg overflow-hidden cursor-pointer ${
                                bookingPost.data.imageUrls!.length === 1 
                                  ? 'col-span-1 h-[400px]' 
                                  : bookingPost.data.imageUrls!.length === 2
                                  ? 'h-[300px]'
                                  : index === 0 && bookingPost.data.imageUrls!.length >= 3
                                  ? 'col-span-2 h-[300px]'
                                  : 'h-[150px]'
                              }`}
                              onClick={() => openImageGallery(bookingPost.data.imageUrls!, index)}
                            >
                              <img
                                src={url}
                                alt={`Hình ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Counter badge */}
                              <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded">
                                {index + 1}/{bookingPost.data.imageUrls?.length || 0}
                              </div>

                              {/* Show "+X more" on last visible image if there are more than 5 */}
                              {index === 4 && bookingPost.data.imageUrls!.length > 5 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                  <div className="text-white text-3xl font-bold">
                                    +{bookingPost.data.imageUrls!.length - 5}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : bookingPost.data.imageUrl ? (
                        <div 
                          className="relative rounded-lg overflow-hidden cursor-pointer h-[400px]"
                          onClick={() => openImageGallery([bookingPost.data.imageUrl!], 0)}
                        >
                          <img
                            src={bookingPost.data.imageUrl}
                            alt="Hình booking"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
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
                          {bookingPost.data.address.ward}, {bookingPost.data.address.city}
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

      {/* Image Modal/Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={closeImageGallery}
        >
          {/* Close button */}
          <button
            onClick={closeImageGallery}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-all hover:bg-white/20 z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image counter */}
          {currentImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm font-medium rounded-full z-10">
              {currentImageIndex + 1} / {currentImages.length}
            </div>
          )}

          {/* Previous button */}
          {currentImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPreviousImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 hover:scale-110 z-10"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Next button */}
          {currentImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 hover:scale-110 z-10"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Image */}
          <img
            src={selectedImage}
            alt="Booking post full view"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={cancelAcceptBooking}
        >
          <div 
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon warning */}
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-amber-100 p-3">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
            </div>

            {/* Title */}
            <h3 className="mb-3 text-center text-xl font-bold text-slate-900">
              Xác nhận nhận công việc
            </h3>

            {/* Warning message */}
            <div className="mb-6 space-y-3">
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">
                  ⚠️ Lưu ý quan trọng:
                </p>
                <ul className="space-y-2 text-sm text-red-700">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Bạn sẽ <strong>không thể hủy</strong> sau khi nhận công việc</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Bạn phải <strong>cam kết hoàn thành công việc đúng thời gian</strong></span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  📞 Nếu có thắc mắc, liên hệ:
                </p>
                <div className="space-y-1 text-sm text-blue-700">
                  <p><strong>Hotline:</strong> 0825371577</p>
                  <p><strong>Zalo:</strong> 0342287853 (Minh That)</p>
                  <p><strong>Email:</strong> mthat456@gmail.com</p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelAcceptBooking}
                className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 transition-all hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmAcceptBooking}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-medium text-white shadow-sm transition-all hover:shadow-md"
              >
                Xác nhận nhận việc
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingPosts;
