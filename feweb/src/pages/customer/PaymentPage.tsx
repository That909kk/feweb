import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  DollarSign, 
  CheckCircle, 
  Loader2,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { SectionCard } from '../../shared/components';
import { usePayment } from '../../hooks/usePayment';
import { useAuth } from '../../contexts/AuthContext';
import { createVNPayPaymentApi } from '../../api/payment';
import { getBookingByIdApi } from '../../api/booking';
import type { PaymentMethod } from '../../types/api';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isProcessing, error } = usePayment();

  // Lấy thông tin từ state được truyền qua navigation
  const bookingData = location.state?.bookingData;
  const paymentMethods = location.state?.paymentMethods || [];
  const selectedMethodId = location.state?.selectedMethodId;

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isAutoProcessing, setIsAutoProcessing] = useState(true);

  // Redirect nếu không có dữ liệu booking
  useEffect(() => {
    // Check for both single booking (bookingId) and multiple bookings (bookings array)
    const hasValidBookingData = bookingData && (bookingData.bookingId || (bookingData.bookings && bookingData.bookings.length > 0));
    if (!hasValidBookingData) {
      navigate('/customer/booking');
    }
  }, [bookingData, navigate]);

  // Set phương thức thanh toán đã chọn và tự động xử lý thanh toán
  useEffect(() => {
    if (selectedMethodId && paymentMethods.length > 0 && isAutoProcessing) {
      const method = paymentMethods.find((m: PaymentMethod) => m.methodId === parseInt(selectedMethodId));
      if (method) {
        setSelectedPaymentMethod(method);
        // Tự động xử lý thanh toán
        handleAutoPayment(method);
      }
    }
  }, [selectedMethodId, paymentMethods, isAutoProcessing]);

  // Hàm xử lý thanh toán tự động
  const handleAutoPayment = async (method: PaymentMethod) => {
    if (!method || !bookingData) {
      return;
    }

    try {
      setPaymentError(null);
      setIsAutoProcessing(false);

      // Nếu là thanh toán tiền mặt, chuyển thẳng sang trang thành công
      if (method.methodCode === 'CASH') {
        setIsPaymentComplete(true);
        
        // Check if this is multiple bookings or single booking
        const isMultipleBookings = bookingData.bookings && Array.isArray(bookingData.bookings) && bookingData.bookings.length > 0;
        
        if (isMultipleBookings) {
          // For multiple bookings, fetch full details for each booking
          try {
            console.log('[Auto Payment] Fetching full details for multiple bookings...');
            const bookingDetailsPromises = bookingData.bookings.map((booking: any) => 
              getBookingByIdApi(booking.bookingId)
            );
            
            const bookingResponses = await Promise.all(bookingDetailsPromises);
            const fullBookings = bookingResponses
              .filter(response => response && response.data)
              .map(response => response.data);
            
            console.log('[Auto Payment] Full booking details fetched for all bookings:', fullBookings);
            
            setTimeout(() => {
              navigate('/customer/booking-success', {
                state: {
                  bookingData: {
                    ...bookingData,
                    bookings: fullBookings
                  },
                  isMultiple: true
                }
              });
            }, 1500);
            return;
          } catch (error) {
            console.error('[Auto Payment] Failed to fetch full booking details for multiple bookings:', error);
            // Fallback to original bookingData
          }
        } else {
          // Single booking - fetch full details
          const bookingId = bookingData.bookingId;
          
          if (bookingId) {
            try {
              console.log('[Auto Payment] Fetching full booking details for cash payment:', bookingId);
              const bookingResponse = await getBookingByIdApi(bookingId);
              
              if (bookingResponse && bookingResponse.data) {
                console.log('[Auto Payment] Full booking details fetched:', bookingResponse.data);
                
                setTimeout(() => {
                  navigate('/customer/booking-success', {
                    state: {
                      bookingData: bookingResponse.data,
                      isMultiple: false
                    }
                  });
                }, 1500);
                return;
              }
            } catch (error) {
              console.error('[Auto Payment] Failed to fetch full booking details:', error);
              // Fallback to original bookingData
            }
          }
        }
        
        // Fallback: use original bookingData
        console.warn('[Auto Payment] Using fallback - original bookingData without full details');
        setTimeout(() => {
          navigate('/customer/booking-success', {
            state: {
              bookingData: bookingData,
              isMultiple: isMultipleBookings
            }
          });
        }, 1500);
        return;
      }

      // Determine bookingId - for multiple bookings, use the first one
      const bookingId = bookingData.bookingId || (bookingData.bookings && bookingData.bookings[0]?.bookingId);
      
      if (!bookingId) {
        setPaymentError('Không tìm thấy mã đặt lịch. Vui lòng thử lại.');
        return;
      }

      // Lấy amount từ bookingData
      const amount = bookingData.totalAmount || bookingData.amount || 0;

      // Với VNPay, Momo và Bank Transfer - gọi API VNPay để lấy payment URL
      if (method.methodCode === 'VNPAY' || method.methodCode === 'MOMO' || method.methodCode === 'BANK_TRANSFER') {
        try {
          const requestData = {
            bookingId: bookingId,
            amount: amount,
            orderInfo: `Thanh toan don hang ${bookingData.bookingCode || bookingId}`,
            orderType: 'other',
            locale: 'vn',
            bankCode: method.methodCode === 'MOMO' ? 'MOMO' : ''
          };
          
          console.log('🔄 [VNPay] Creating payment with data:', requestData);
          
          const vnpayResponse = await createVNPayPaymentApi(requestData);
          
          console.log('✅ [VNPay] Response received:', vnpayResponse);

          if (vnpayResponse.success && vnpayResponse.data.paymentUrl) {
            // Redirect đến trang thanh toán VNPay
            console.log('🚀 [VNPay] Redirecting to:', vnpayResponse.data.paymentUrl);
            window.location.href = vnpayResponse.data.paymentUrl;
          } else {
            console.error('❌ [VNPay] Failed:', vnpayResponse);
            setPaymentError(vnpayResponse.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.');
          }
        } catch (err: any) {
          console.error('❌ [VNPay] Error:', err);
          console.error('❌ [VNPay] Error Response:', err?.response?.data);
          setPaymentError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi kết nối với cổng thanh toán');
        }
      } else {
        // Fallback cho các phương thức khác (nếu có)
        setPaymentError('Phương thức thanh toán chưa được hỗ trợ');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err?.message || 'Có lỗi xảy ra khi xử lý thanh toán');
    }
  };

  // Xử lý thanh toán (dùng cho nút thử lại khi có lỗi)
  const handlePayment = async () => {
    if (!selectedPaymentMethod || !bookingData) {
      setPaymentError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    try {
      setPaymentError(null);

      // Nếu là thanh toán tiền mặt, chuyển thẳng sang trang thành công
      if (selectedPaymentMethod.methodCode === 'CASH') {
        setIsPaymentComplete(true);
        
        // Check if this is multiple bookings or single booking
        const isMultipleBookings = bookingData.bookings && Array.isArray(bookingData.bookings) && bookingData.bookings.length > 0;
        
        if (isMultipleBookings) {
          // For multiple bookings, fetch full details for each booking
          try {
            console.log('Fetching full details for multiple bookings...');
            const bookingDetailsPromises = bookingData.bookings.map((booking: any) => 
              getBookingByIdApi(booking.bookingId)
            );
            
            const bookingResponses = await Promise.all(bookingDetailsPromises);
            const fullBookings = bookingResponses
              .filter(response => response && response.data)
              .map(response => response.data);
            
            console.log('Full booking details fetched for all bookings:', fullBookings);
            
            setTimeout(() => {
              navigate('/customer/booking-success', {
                state: {
                  bookingData: {
                    ...bookingData,
                    bookings: fullBookings
                  },
                  isMultiple: true
                }
              });
            }, 1500);
            return;
          } catch (error) {
            console.error('Failed to fetch full booking details for multiple bookings:', error);
            // Fallback to original bookingData
          }
        } else {
          // Single booking - fetch full details
          const bookingId = bookingData.bookingId;
          
          if (bookingId) {
            try {
              console.log('Fetching full booking details for cash payment:', bookingId);
              const bookingResponse = await getBookingByIdApi(bookingId);
              
              if (bookingResponse && bookingResponse.data) {
                console.log('Full booking details fetched:', bookingResponse.data);
                
                setTimeout(() => {
                  navigate('/customer/booking-success', {
                    state: {
                      bookingData: bookingResponse.data,
                      isMultiple: false
                    }
                  });
                }, 1500);
                return;
              }
            } catch (error) {
              console.error('Failed to fetch full booking details:', error);
              // Fallback to original bookingData
            }
          }
        }
        
        // Fallback: use original bookingData
        setTimeout(() => {
          navigate('/customer/booking-success', {
            state: {
              bookingData: bookingData,
              isMultiple: isMultipleBookings
            }
          });
        }, 1500);
        return;
      }

      // Determine bookingId - for multiple bookings, use the first one
      const bookingId = bookingData.bookingId || (bookingData.bookings && bookingData.bookings[0]?.bookingId);
      
      if (!bookingId) {
        setPaymentError('Không tìm thấy mã đặt lịch. Vui lòng thử lại.');
        return;
      }

      // Lấy amount từ bookingData
      const amount = bookingData.totalAmount || bookingData.amount || 0;

      // Với VNPay, Momo và Bank Transfer - gọi API VNPay để lấy payment URL
      if (selectedPaymentMethod.methodCode === 'VNPAY' || selectedPaymentMethod.methodCode === 'MOMO' || selectedPaymentMethod.methodCode === 'BANK_TRANSFER') {
        try {
          const requestData = {
            bookingId: bookingId,
            amount: amount,
            orderInfo: `Thanh toan don hang ${bookingData.bookingCode || bookingId}`,
            orderType: 'other',
            locale: 'vn',
            bankCode: selectedPaymentMethod.methodCode === 'MOMO' ? 'MOMO' : ''
          };
          
          console.log('🔄 [VNPay Retry] Creating payment with data:', requestData);
          
          const vnpayResponse = await createVNPayPaymentApi(requestData);
          
          console.log('✅ [VNPay Retry] Response received:', vnpayResponse);

          if (vnpayResponse.success && vnpayResponse.data.paymentUrl) {
            // Redirect đến trang thanh toán VNPay
            console.log('🚀 [VNPay Retry] Redirecting to:', vnpayResponse.data.paymentUrl);
            window.location.href = vnpayResponse.data.paymentUrl;
          } else {
            console.error('❌ [VNPay Retry] Failed:', vnpayResponse);
            setPaymentError(vnpayResponse.message || 'Không thể tạo link thanh toán. Vui lòng thử lại.');
          }
        } catch (err: any) {
          console.error('❌ [VNPay Retry] Error:', err);
          console.error('❌ [VNPay Retry] Error Response:', err?.response?.data);
          setPaymentError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi kết nối với cổng thanh toán');
        }
      } else {
        // Fallback cho các phương thức khác (nếu có)
        setPaymentError('Phương thức thanh toán chưa được hỗ trợ');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err?.message || 'Có lỗi xảy ra khi xử lý thanh toán');
    }
  };

  const getPaymentMethodIcon = (methodCode: string) => {
    switch (methodCode) {
      case 'CASH':
        return <DollarSign className="w-6 h-6" />;
      case 'MOMO':
        return <Wallet className="w-6 h-6" />;
      case 'VNPAY':
        return <CreditCard className="w-6 h-6" />;
      case 'BANK_TRANSFER':
        return <Building2 className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (!bookingData) {
    return null;
  }

  // Hiển thị màn hình loading khi đang xử lý thanh toán hoặc tự động xử lý
  if (isProcessing || isPaymentComplete || isAutoProcessing) {
    return (
      <DashboardLayout role={user?.role || 'CUSTOMER'} title="Thanh toán">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            {isPaymentComplete ? (
              <>
                <div className="mb-4 flex justify-center">
                  <div className="bg-green-100 rounded-full p-4">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedPaymentMethod?.methodCode === 'CASH' ? 'Đặt lịch thành công!' : 'Thanh toán thành công!'}
                </h2>
                <p className="text-gray-600">
                  {selectedPaymentMethod?.methodCode === 'CASH' 
                    ? 'Bạn sẽ thanh toán trực tiếp cho nhân viên sau khi hoàn thành. Đang chuyển đến trang xác nhận...'
                    : 'Đang chuyển đến trang xác nhận...'
                  }
                </p>
              </>
            ) : (
              <>
                <div className="mb-4 flex justify-center">
                  <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Đang xử lý thanh toán...
                </h2>
                <p className="text-gray-600">
                  Vui lòng không đóng trang này
                </p>
                {selectedPaymentMethod && (
                  <div className="mt-4 flex items-center justify-center text-gray-500">
                    <div className="p-2 rounded-lg bg-gray-100 mr-3">
                      {getPaymentMethodIcon(selectedPaymentMethod.methodCode)}
                    </div>
                    <p>{selectedPaymentMethod.methodName}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={user?.role || 'CUSTOMER'} title="Thanh toán">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/customer/booking')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại đặt lịch
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Xác nhận thanh toán</h1>
          <p className="text-gray-600 mt-2">
            Đã xảy ra lỗi trong quá trình thanh toán
          </p>
        </div>

        {/* Error display */}
        {(error || paymentError) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">Lỗi thanh toán</h3>
              <p className="text-red-700 text-sm">{error || paymentError}</p>
            </div>
          </div>
        )}

        {/* Payment info card */}
        <SectionCard title="Thông tin thanh toán">
          <div className="space-y-6">
            {/* Payment method display */}
            {selectedPaymentMethod && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Phương thức thanh toán đã chọn</p>
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                    {getPaymentMethodIcon(selectedPaymentMethod.methodCode)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">
                      {selectedPaymentMethod.methodName}
                    </p>
                    {selectedPaymentMethod.description && (
                      <p className="text-sm text-gray-600">
                        {selectedPaymentMethod.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Booking info */}
            <div className="border-t pt-4">
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">Mã đặt lịch</p>
                <p className="font-semibold text-gray-800">
                  {bookingData.bookingCode || (bookingData.bookings && bookingData.bookings[0]?.bookingCode) || 'Đang xử lý...'}
                </p>
                {bookingData.bookings && bookingData.bookings.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    và {bookingData.bookings.length - 1} đặt lịch khác
                  </p>
                )}
              </div>

              <div className="flex justify-between mb-2">
                <p className="text-gray-600">Tạm tính</p>
                <p className="font-semibold">
                  {formatCurrency(bookingData.totalAmount || bookingData.amount || 0)}
                </p>
              </div>
              {selectedPaymentMethod?.serviceCharge && selectedPaymentMethod.serviceCharge > 0 && (
                <div className="flex justify-between mb-2">
                  <p className="text-gray-600">Phí dịch vụ</p>
                  <p className="font-semibold">
                    {formatCurrency(selectedPaymentMethod.serviceCharge)}
                  </p>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <p className="font-bold text-gray-800">Tổng cộng</p>
                <p className="font-bold text-blue-600 text-xl">
                  {formatCurrency(
                    (bookingData.totalAmount || bookingData.amount || 0) + 
                    (selectedPaymentMethod?.serviceCharge || 0)
                  )}
                </p>
              </div>
            </div>

            {/* Retry button */}
            <button
              onClick={handlePayment}
              disabled={!selectedPaymentMethod || isProcessing}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                !selectedPaymentMethod || isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                'Thử lại thanh toán'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              Bằng việc thanh toán, bạn đồng ý với các điều khoản và điều kiện của chúng tôi
            </p>
          </div>
        </SectionCard>

        {/* Additional info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Lưu ý quan trọng</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Thanh toán bằng tiền mặt: Bạn sẽ thanh toán trực tiếp cho nhân viên sau khi hoàn thành dịch vụ</li>
                <li>• Thanh toán online: Bạn sẽ được chuyển đến trang thanh toán của đối tác</li>
                <li>• Đặt lịch chỉ được xác nhận sau khi thanh toán thành công</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentPage;
