import React from 'react';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Tag, 
  Clock, 
  MapPin, 
  CreditCard,
  Users,
  Calendar,
  Repeat,
  Info,
  Receipt
} from 'lucide-react';
import type { 
  BookingPreviewResponse, 
  MultipleBookingPreviewResponse,
  RecurringBookingPreviewResponse,
  ServicePreviewItem,
  FeeBreakdownItem,
  PromotionPreviewInfo
} from '../../types/bookingPreview';

interface BookingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  
  // Preview data (one of these should be provided)
  singlePreview?: BookingPreviewResponse | null;
  multiplePreview?: MultipleBookingPreviewResponse | null;
  recurringPreview?: RecurringBookingPreviewResponse | null;
}

/**
 * Modal hiển thị thông tin phí trước khi xác nhận đặt lịch
 */
const BookingPreviewModal: React.FC<BookingPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  singlePreview,
  multiplePreview,
  recurringPreview
}) => {
  if (!isOpen) return null;

  // Determine which preview type we're showing
  const previewType = recurringPreview ? 'recurring' : multiplePreview ? 'multiple' : 'single';
  const hasError = (singlePreview && !singlePreview.valid) || 
                   (multiplePreview && !multiplePreview.valid) ||
                   (recurringPreview && !recurringPreview.valid);

  // Get errors
  const errors = singlePreview?.errors || multiplePreview?.errors || recurringPreview?.errors || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6" />
            <h2 className="text-lg font-semibold">
              {previewType === 'recurring' ? 'Chi tiết đặt lịch định kỳ' :
               previewType === 'multiple' ? 'Chi tiết nhiều lịch đặt' :
               'Chi tiết đơn hàng'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error Messages */}
          {hasError && errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Có lỗi xảy ra</p>
                  <ul className="mt-1 text-sm text-red-600 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Single Preview Content */}
          {previewType === 'single' && singlePreview && singlePreview.valid && (
            <SinglePreviewContent preview={singlePreview} />
          )}

          {/* Multiple Preview Content */}
          {previewType === 'multiple' && multiplePreview && multiplePreview.valid && (
            <MultiplePreviewContent preview={multiplePreview} />
          )}

          {/* Recurring Preview Content */}
          {previewType === 'recurring' && recurringPreview && recurringPreview.valid && (
            <RecurringPreviewContent preview={recurringPreview} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !!hasError}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Xác nhận đặt lịch</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ Sub-components ============

/**
 * Hiển thị danh sách dịch vụ
 */
const ServiceItemsList: React.FC<{ services: ServicePreviewItem[] }> = ({ services }) => (
  <div className="space-y-3">
    {services.map((service, index) => (
      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
        {service.iconUrl && (
          <img 
            src={service.iconUrl} 
            alt={service.serviceName}
            className="w-12 h-12 object-contain rounded-lg bg-white p-1"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-gray-900">{service.serviceName}</h4>
              <p className="text-sm text-gray-500">
                {service.quantity} {service.unit} × {service.formattedUnitPrice}
              </p>
            </div>
            <span className="font-semibold text-gray-900 whitespace-nowrap">
              {service.formattedSubTotal}
            </span>
          </div>
          
          {/* Selected choices */}
          {service.selectedChoices && service.selectedChoices.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {service.selectedChoices.map((choice, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                >
                  {choice.choiceName}
                  {choice.price > 0 && (
                    <span className="ml-1 text-blue-500">+{choice.formattedPrice}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Duration & Staff */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            {service.estimatedDuration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {service.estimatedDuration}
              </span>
            )}
            {service.recommendedStaff > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {service.recommendedStaff} nhân viên
              </span>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Hiển thị chi tiết phí
 */
const FeeBreakdownList: React.FC<{ fees: FeeBreakdownItem[] }> = ({ fees }) => (
  <div className="space-y-2">
    {fees.map((fee, index) => (
      <div key={index} className="flex items-center justify-between text-sm">
        <span className="text-gray-600 flex items-center gap-2">
          {fee.name}
          {fee.systemSurcharge && (
            <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
              Bắt buộc
            </span>
          )}
          {fee.type === 'PERCENT' && (
            <span className="text-gray-400">({(fee.value * 100).toFixed(0)}%)</span>
          )}
        </span>
        <span className="text-gray-900">+{fee.formattedAmount}</span>
      </div>
    ))}
  </div>
);

/**
 * Hiển thị thông tin khuyến mãi
 */
const PromotionInfo: React.FC<{ 
  promotion: PromotionPreviewInfo; 
  discountAmount: string;
}> = ({ promotion, discountAmount }) => (
  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
    <div className="flex items-center gap-2">
      <Tag className="w-4 h-4 text-green-600" />
      <div>
        <span className="font-medium text-green-800">{promotion.promoCode}</span>
        <p className="text-xs text-green-600">{promotion.description}</p>
      </div>
    </div>
    <span className="font-semibold text-green-600">-{discountAmount}</span>
  </div>
);

/**
 * Content cho single booking preview
 */
const SinglePreviewContent: React.FC<{ preview: BookingPreviewResponse }> = ({ preview }) => (
  <>
    {/* Customer & Address Info */}
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900">{preview.customerName}</p>
          <p className="text-sm text-gray-600">{preview.addressInfo?.fullAddress}</p>
          <p className="text-sm text-gray-500">{preview.customerPhone}</p>
        </div>
      </div>
      
      {preview.bookingTime && (
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-gray-700">
            {new Date(preview.bookingTime).toLocaleString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      )}
    </div>

    {/* Services */}
    <div>
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Info className="w-4 h-4" />
        Dịch vụ đã chọn ({preview.totalServices})
      </h3>
      {preview.serviceItems && <ServiceItemsList services={preview.serviceItems} />}
    </div>

    {/* Price Breakdown */}
    <div className="border-t pt-4 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Tạm tính</span>
        <span className="text-gray-900">{preview.formattedSubtotal}</span>
      </div>

      {/* Promotion */}
      {preview.promotionInfo && preview.formattedDiscountAmount && (
        <PromotionInfo 
          promotion={preview.promotionInfo} 
          discountAmount={preview.formattedDiscountAmount}
        />
      )}

      {/* After Discount */}
      {preview.discountAmount && preview.discountAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Sau giảm giá</span>
          <span className="text-gray-900">{preview.formattedTotalAfterDiscount}</span>
        </div>
      )}

      {/* Fees */}
      {preview.feeBreakdowns && preview.feeBreakdowns.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Phí dịch vụ</p>
          <FeeBreakdownList fees={preview.feeBreakdowns} />
        </div>
      )}

      {/* Total Fees */}
      {preview.totalFees && preview.totalFees > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tổng phí</span>
          <span className="text-gray-900">{preview.formattedTotalFees}</span>
        </div>
      )}

      {/* Grand Total */}
      <div className="flex justify-between items-center pt-3 border-t">
        <span className="font-semibold text-gray-900">Tổng thanh toán</span>
        <span className="text-2xl font-bold text-blue-600">{preview.formattedGrandTotal}</span>
      </div>

      {/* Payment Method */}
      {preview.paymentMethodName && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="w-4 h-4" />
          <span>Thanh toán: {preview.paymentMethodName}</span>
        </div>
      )}

      {/* Estimated Duration */}
      {preview.estimatedDuration && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Thời gian ước tính: {preview.estimatedDuration}</span>
        </div>
      )}
    </div>
  </>
);

/**
 * Content cho multiple booking preview
 */
const MultiplePreviewContent: React.FC<{ preview: MultipleBookingPreviewResponse }> = ({ preview }) => (
  <>
    {/* Summary Info */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-blue-800">
          {preview.bookingCount} lịch đặt
        </span>
      </div>
      <p className="text-sm text-blue-600">
        Tất cả các lịch sử dụng cùng dịch vụ và địa chỉ
      </p>
    </div>

    {/* Customer & Address */}
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900">{preview.customerName}</p>
          <p className="text-sm text-gray-600">{preview.addressInfo?.fullAddress}</p>
          <p className="text-sm text-gray-500">{preview.customerPhone}</p>
        </div>
      </div>
    </div>

    {/* Services */}
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">
        Dịch vụ ({preview.totalServices})
      </h3>
      <ServiceItemsList services={preview.serviceItems} />
    </div>

    {/* Booking Times */}
    {preview.bookingPreviews && preview.bookingPreviews.length > 0 && (
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Các lịch đặt</h3>
        <div className="space-y-2">
          {preview.bookingPreviews.slice(0, 5).map((booking, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">
                {booking.bookingTime && new Date(booking.bookingTime).toLocaleString('vi-VN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span className="text-sm font-medium">{booking.formattedGrandTotal}</span>
            </div>
          ))}
          {preview.bookingPreviews.length > 5 && (
            <p className="text-sm text-gray-500 text-center">
              +{preview.bookingPreviews.length - 5} lịch khác
            </p>
          )}
        </div>
      </div>
    )}

    {/* Price Summary */}
    <div className="border-t pt-4 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Giá mỗi lịch</span>
        <span className="text-gray-900">{preview.formattedPricePerBooking}</span>
      </div>

      {/* Promotion */}
      {preview.promotionInfo && (
        <PromotionInfo 
          promotion={preview.promotionInfo} 
          discountAmount={preview.formattedDiscountPerBooking}
        />
      )}

      {/* Fees per booking */}
      {preview.feeBreakdowns && preview.feeBreakdowns.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Phí mỗi lịch</p>
          <FeeBreakdownList fees={preview.feeBreakdowns} />
        </div>
      )}

      {/* Grand Total */}
      <div className="flex justify-between items-center pt-3 border-t">
        <div>
          <span className="font-semibold text-gray-900">Tổng thanh toán</span>
          <p className="text-xs text-gray-500">
            {preview.bookingCount} lịch × {preview.formattedPricePerBooking}
          </p>
        </div>
        <span className="text-2xl font-bold text-blue-600">
          {preview.formattedTotalEstimatedPrice}
        </span>
      </div>

      {/* Validation Summary */}
      {preview.invalidBookingsCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            {preview.invalidBookingsCount} lịch không hợp lệ sẽ không được tạo
          </p>
        </div>
      )}
    </div>
  </>
);

/**
 * Content cho recurring booking preview
 */
const RecurringPreviewContent: React.FC<{ preview: RecurringBookingPreviewResponse }> = ({ preview }) => (
  <>
    {/* Recurring Info */}
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Repeat className="w-5 h-5 text-purple-600" />
        <span className="font-semibold text-purple-800">
          Đặt lịch định kỳ
        </span>
      </div>
      <p className="text-sm text-purple-700">{preview.recurrenceDescription}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-purple-600">
        <span className="bg-purple-100 px-2 py-1 rounded">
          {preview.occurrenceCount} lần trong kỳ
        </span>
        <span className="bg-purple-100 px-2 py-1 rounded">
          Bắt đầu: {new Date(preview.startDate).toLocaleDateString('vi-VN')}
        </span>
        {preview.endDate && (
          <span className="bg-purple-100 px-2 py-1 rounded">
            Kết thúc: {new Date(preview.endDate).toLocaleDateString('vi-VN')}
          </span>
        )}
      </div>
    </div>

    {/* Customer & Address */}
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-900">{preview.customerName}</p>
          <p className="text-sm text-gray-600">{preview.addressInfo?.fullAddress}</p>
          <p className="text-sm text-gray-500">{preview.customerPhone}</p>
        </div>
      </div>
    </div>

    {/* Services */}
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">
        Dịch vụ ({preview.totalServices})
      </h3>
      <ServiceItemsList services={preview.serviceItems} />
    </div>

    {/* Planned Occurrences */}
    <div>
      <h3 className="font-semibold text-gray-900 mb-3">
        Các lịch dự kiến ({preview.occurrenceCount})
      </h3>
      <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
        {preview.plannedBookingTimes.slice(0, 10).map((time, index) => (
          <div 
            key={index}
            className="text-sm p-2 bg-gray-50 rounded flex items-center gap-2"
          >
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>
              {new Date(time).toLocaleString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        ))}
      </div>
      {preview.hasMoreOccurrences && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          +{preview.occurrenceCount - preview.plannedBookingTimes.length} lịch khác...
        </p>
      )}
    </div>

    {/* Price Summary */}
    <div className="border-t pt-4 space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Tạm tính mỗi lần</span>
        <span className="text-gray-900">{preview.formattedSubtotalPerOccurrence}</span>
      </div>

      {/* Promotion */}
      {preview.promotionInfo && (
        <PromotionInfo 
          promotion={preview.promotionInfo} 
          discountAmount={preview.formattedDiscountPerOccurrence}
        />
      )}

      {/* Fees */}
      {preview.feeBreakdowns && preview.feeBreakdowns.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Phí mỗi lần</p>
          <FeeBreakdownList fees={preview.feeBreakdowns} />
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Giá mỗi lần</span>
        <span className="font-medium text-gray-900">{preview.formattedPricePerOccurrence}</span>
      </div>

      {/* Grand Total */}
      <div className="flex justify-between items-center pt-3 border-t">
        <div>
          <span className="font-semibold text-gray-900">Tổng ước tính</span>
          <p className="text-xs text-gray-500">
            {preview.occurrenceCount} lần × {preview.formattedPricePerOccurrence}
          </p>
        </div>
        <span className="text-2xl font-bold text-blue-600">
          {preview.formattedTotalEstimatedPrice}
        </span>
      </div>

      {/* Note about estimates */}
      <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
        <Info className="w-4 h-4 inline mr-1" />
        Đây là ước tính cho {preview.occurrenceCount} lần đặt lịch. 
        Tổng thanh toán thực tế có thể thay đổi nếu có điều chỉnh trong quá trình.
      </div>
    </div>
  </>
);

export default BookingPreviewModal;
