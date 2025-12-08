import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../layouts';

/**
 * PaymentCallbackPage - Xử lý callback từ VNPay
 * URL: /customer/payment-callback?vnp_ResponseCode=00&vnp_TransactionNo=xxx&bookingId=xxx
 */
const PaymentCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [message, setMessage] = useState('Đang xử lý kết quả thanh toán...');
  
  // Lấy các tham số từ URL
  const responseCode = searchParams.get('vnp_ResponseCode');
  const transactionNo = searchParams.get('vnp_TransactionNo');
  const bookingId = searchParams.get('bookingId');
  const amount = searchParams.get('vnp_Amount');

  useEffect(() => {
    const processPaymentResult = () => {
      // Kiểm tra responseCode
      if (responseCode === '00') {
        setStatus('success');
        setMessage('Thanh toán thành công!');
        
        // Sau 2 giây, chuyển đến trang booking success
        setTimeout(() => {
          if (bookingId) {
            // TODO: Fetch booking data và chuyển đến booking success page
            navigate('/customer/orders');
          } else {
            navigate('/customer/orders');
          }
        }, 2000);
      } else {
        setStatus('failed');
        
        // Map response code sang message
        const errorMessages: Record<string, string> = {
          '07': 'Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
          '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
          '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
          '11': 'Đã hết hạn chờ thanh toán (15 phút)',
          '12': 'Thẻ/Tài khoản bị khóa',
          '13': 'Nhập sai mật khẩu OTP',
          '24': 'Khách hàng hủy giao dịch',
          '51': 'Tài khoản không đủ số dư',
          '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
          '75': 'Ngân hàng thanh toán đang bảo trì',
          '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
          '99': 'Lỗi không xác định'
        };
        
        setMessage(errorMessages[responseCode || '99'] || 'Thanh toán không thành công');
      }
    };

    // Xử lý sau 1 giây để user thấy loading
    setTimeout(processPaymentResult, 1000);
  }, [responseCode, bookingId, navigate]);

  return (
    <DashboardLayout
      role="CUSTOMER"
      title={status === 'processing' ? 'Đang xử lý...' : (status === 'success' ? 'Thành công' : 'Thất bại')}
      description="Kết quả thanh toán VNPay"
    >
      <div className="flex items-center justify-center min-h-[50vh] sm:min-h-[60vh] px-4">
        <div className="max-w-md w-full">
          {/* Processing */}
          {status === 'processing' && (
            <div className="text-center">
              <div className="mb-4 sm:mb-6 flex justify-center">
                <Loader2 className="h-16 w-16 sm:h-20 sm:w-20 text-brand-teal animate-spin" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-2 sm:mb-3">
                Đang xử lý thanh toán
              </h2>
              <p className="text-sm sm:text-base text-brand-text/70">
                Vui lòng chờ trong giây lát...
              </p>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center">
              <div className="mb-4 sm:mb-6 flex justify-center">
                <div className="rounded-full bg-emerald-100 p-4 sm:p-6">
                  <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-emerald-600" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-2 sm:mb-3">
                Thanh toán thành công!
              </h2>
              <p className="text-sm sm:text-base text-brand-text/70 mb-4 sm:mb-6">{message}</p>
              
              {transactionNo && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="text-sm text-gray-600">Mã giao dịch</div>
                  <div className="font-mono font-semibold text-brand-navy">{transactionNo}</div>
                </div>
              )}
              
              {amount && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="text-sm text-gray-600">Số tiền đã thanh toán</div>
                  <div className="text-xl font-bold text-emerald-600">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(parseInt(amount) / 100)}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Đang chuyển đến trang đơn hàng...
              </p>
            </div>
          )}

          {/* Failed */}
          {status === 'failed' && (
            <div className="text-center">
              <div className="mb-4 sm:mb-6 flex justify-center">
                <div className="rounded-full bg-red-100 p-4 sm:p-6">
                  <XCircle className="h-16 w-16 sm:h-20 sm:w-20 text-red-600" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-2 sm:mb-3">
                Thanh toán thất bại
              </h2>
              <p className="text-sm sm:text-base text-red-600 mb-4 sm:mb-6">{message}</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left text-xs sm:text-sm text-yellow-800">
                    <p className="font-medium mb-1">Lưu ý:</p>
                    <p>Đơn hàng của bạn vẫn được giữ với trạng thái "Chờ thanh toán". Bạn có thể thử thanh toán lại.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => navigate('/customer/orders')}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-gray-300 text-brand-navy font-semibold hover:bg-gray-50 transition text-sm sm:text-base"
                >
                  Xem đơn hàng
                </button>
                <button
                  onClick={() => navigate('/customer/booking')}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-brand-teal text-white font-semibold hover:bg-brand-tealHover transition text-sm sm:text-base"
                >
                  Đặt lịch mới
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PaymentCallbackPage;
