import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { getBookingByIdApi } from '../../api/booking';

const VNPayResultPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');
  const [transactionInfo, setTransactionInfo] = useState<any>(null);

  useEffect(() => {
    // Lấy thông tin từ query parameters
    const paymentStatus = searchParams.get('status');
    const responseCode = searchParams.get('responseCode');
    const transactionNo = searchParams.get('transactionNo');
    const amount = searchParams.get('amount');
    const orderInfo = searchParams.get('orderInfo');
    const bankCode = searchParams.get('bankCode');
    const cardType = searchParams.get('cardType');

    console.log('VNPay callback params:', {
      status: paymentStatus,
      responseCode,
      transactionNo,
      amount,
      orderInfo
    });

    // Xử lý kết quả thanh toán
    const handlePaymentResult = async () => {
      if (paymentStatus === 'success' && responseCode === '00') {
        setStatus('success');
        setMessage('Thanh toán thành công!');
        setTransactionInfo({
          transactionNo,
          amount: amount ? parseInt(amount) : 0,
          orderInfo,
          bankCode,
          cardType
        });

        // Extract bookingId from orderInfo
        // orderInfo có thể là UUID trực tiếp hoặc có prefix "booking-"
        let bookingId = null;
        if (orderInfo) {
          // Thử match với prefix "booking-" hoặc "booking " trước
          const withPrefixMatch = orderInfo.match(/booking[- ]([a-zA-Z0-9-]+)/i);
          if (withPrefixMatch) {
            bookingId = withPrefixMatch[1];
          } else {
            // Nếu không có prefix, kiểm tra xem có phải UUID không
            const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
            if (uuidPattern.test(orderInfo.trim())) {
              bookingId = orderInfo.trim();
            } else {
              // Fallback: lấy toàn bộ orderInfo nếu không match pattern nào
              bookingId = orderInfo.trim();
            }
          }
        }

        console.log('Extracted bookingId:', bookingId, 'from orderInfo:', orderInfo);

        if (bookingId) {
          try {
            // Gọi API để lấy thông tin booking đầy đủ
            console.log('Fetching booking details for:', bookingId);
            const bookingResponse = await getBookingByIdApi(bookingId);
            
            if (bookingResponse && bookingResponse.data) {
              console.log('Booking details fetched successfully:', bookingResponse.data);
              
              // Redirect đến trang booking success với dữ liệu đầy đủ sau 2 giây
              setTimeout(() => {
                navigate('/customer/booking-success', {
                  state: {
                    bookingData: bookingResponse.data,
                    isMultiple: false
                  }
                });
              }, 2000);
            } else {
              console.error('Invalid booking response:', bookingResponse);
              // Fallback: redirect với dữ liệu cơ bản
              setTimeout(() => {
                navigate('/customer/booking-success', {
                  state: {
                    bookingData: {
                      bookingId: bookingId,
                      amount: amount ? parseInt(amount) : 0,
                      transactionNo: transactionNo,
                      paymentMethod: 'VNPAY',
                      formattedTotalAmount: new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(amount ? parseInt(amount) : 0)
                    },
                    isMultiple: false
                  }
                });
              }, 2000);
            }
          } catch (error) {
            console.error('Error fetching booking details:', error);
            // Fallback: redirect với dữ liệu cơ bản
            setTimeout(() => {
              navigate('/customer/booking-success', {
                state: {
                  bookingData: {
                    bookingId: bookingId,
                    amount: amount ? parseInt(amount) : 0,
                    transactionNo: transactionNo,
                    paymentMethod: 'VNPAY',
                    formattedTotalAmount: new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(amount ? parseInt(amount) : 0)
                  },
                  isMultiple: false
                }
              });
            }, 2000);
          }
        } else {
          console.error('Could not extract bookingId from orderInfo:', orderInfo);
          // Redirect về dashboard nếu không có bookingId
          setTimeout(() => {
            navigate('/customer/orders');
          }, 2000);
        }
      } else {
        setStatus('failed');
        setMessage(getErrorMessage(responseCode || '99'));
        setTransactionInfo({
          responseCode,
          orderInfo
        });

        // Redirect về trang booking sau 3 giây
        setTimeout(() => {
          navigate('/customer/booking');
        }, 3000);
      }
    };

    handlePaymentResult();
  }, [searchParams, navigate]);

  const getErrorMessage = (code: string): string => {
    const errorMessages: Record<string, string> = {
      '07': 'Giao dịch bị nghi ngờ gian lận',
      '09': 'Thẻ chưa đăng ký dịch vụ Internet Banking',
      '10': 'Xác thực thông tin thẻ không đúng quá 3 lần',
      '11': 'Đã hết hạn chờ thanh toán',
      '12': 'Thẻ bị khóa',
      '13': 'Sai mật khẩu OTP',
      '24': 'Khách hàng hủy giao dịch',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng đang bảo trì',
      '79': 'Nhập sai mật khẩu quá số lần quy định',
      '99': 'Giao dịch thất bại'
    };
    return errorMessages[code] || 'Giao dịch không thành công';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <DashboardLayout role={user?.role || 'CUSTOMER'} title="Kết quả thanh toán">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
          <div className="text-center">
            {/* Icon */}
            <div className="mb-4 sm:mb-6 flex justify-center">
              {status === 'loading' && (
                <div className="bg-blue-100 rounded-full p-3 sm:p-4">
                  <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="bg-green-100 rounded-full p-3 sm:p-4">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
                </div>
              )}
              {status === 'failed' && (
                <div className="bg-red-100 rounded-full p-3 sm:p-4">
                  <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-600" />
                </div>
              )}
            </div>

            {/* Message */}
            <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${
              status === 'success' ? 'text-green-600' : 
              status === 'failed' ? 'text-red-600' : 
              'text-gray-800'
            }`}>
              {message}
            </h2>

            {/* Success description */}
            {status === 'success' && (
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Đang chuyển đến trang xác nhận đặt lịch...
              </p>
            )}

            {/* Failed description */}
            {status === 'failed' && (
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Đang chuyển về trang đặt lịch để thử lại...
              </p>
            )}

            {/* Transaction info */}
            {transactionInfo && status === 'success' && (
              <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg p-4 sm:p-6 text-left">
                <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Thông tin giao dịch</h3>
                <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                  {transactionInfo.transactionNo && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã giao dịch:</span>
                      <span className="font-semibold">{transactionInfo.transactionNo}</span>
                    </div>
                  )}
                  {transactionInfo.amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(transactionInfo.amount)}
                      </span>
                    </div>
                  )}
                  {transactionInfo.bankCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngân hàng:</span>
                      <span className="font-semibold">{transactionInfo.bankCode}</span>
                    </div>
                  )}
                  {transactionInfo.cardType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại thẻ:</span>
                      <span className="font-semibold">{transactionInfo.cardType}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error info */}
            {transactionInfo && status === 'failed' && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-semibold text-red-800 mb-2">Chi tiết lỗi</h3>
                    <p className="text-sm text-red-700">
                      Mã lỗi: {transactionInfo.responseCode}
                    </p>
                    {transactionInfo.orderInfo && (
                      <p className="text-sm text-red-600 mt-1">
                        {transactionInfo.orderInfo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading animation */}
            {status === 'loading' && (
              <p className="text-gray-600 mt-4">
                Đang xác minh giao dịch với VNPay...
              </p>
            )}
          </div>
        </div>

        {/* Support info */}
        {status === 'failed' && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-800 mb-2">Cần hỗ trợ?</h3>
                <p className="text-sm text-blue-700">
                  Nếu bạn đã bị trừ tiền nhưng giao dịch thất bại, vui lòng liên hệ bộ phận chăm sóc khách hàng để được hỗ trợ.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VNPayResultPage;
