import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const BookingSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingData = location.state?.bookingData;

  // Nếu không có dữ liệu booking, redirect về dashboard
  if (!bookingData) {
    navigate('/customer');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Về Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="bg-green-600 text-white p-8 rounded-t-lg text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Đặt lịch thành công!</h1>
          <p className="text-green-100 text-lg">Mã đơn hàng: {bookingData.bookingCode}</p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-b-lg shadow-sm p-8">
          <div className="space-y-8">
            {/* Thông tin dịch vụ */}
            {bookingData.serviceDetails?.map((serviceDetail, index) => (
              <div key={index} className="border-b pb-6 last:border-b-0">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                  </svg>
                  Dịch vụ đã chọn
                </h3>
                <div className="ml-9">
                  <p className="font-medium text-xl mb-2">{serviceDetail.service.name}</p>
                  <p className="text-gray-600 mb-3">{serviceDetail.service.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Số lượng:</span>
                      <span className="ml-2">{serviceDetail.quantity} {serviceDetail.service.unit}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Thời gian:</span>
                      <span className="ml-2">{serviceDetail.formattedDuration}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Giá:</span>
                      <span className="ml-2 font-semibold text-green-600">{serviceDetail.formattedSubTotal}</span>
                    </div>
                  </div>
                  {serviceDetail.selectedChoices?.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2">Tùy chọn thêm:</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {serviceDetail.selectedChoices.map((choice, choiceIndex) => (
                          <div key={choiceIndex} className="flex justify-between items-center py-1">
                            <span className="text-sm">
                              <strong>{choice.choiceName}</strong> ({choice.optionName})
                            </span>
                            <span className="text-sm font-semibold text-green-600">
                              {choice.formattedPriceAdjustment}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Grid Layout cho các thông tin khác */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Thông tin thời gian */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Thời gian thực hiện
                </h3>
                <div className="ml-9 space-y-2">
                  <p className="font-medium text-lg">
                    {new Date(bookingData.bookingTime).toLocaleDateString('vi-VN', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-gray-700">
                    Lúc {new Date(bookingData.bookingTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-gray-500">Thời gian dự kiến: {bookingData.estimatedDuration}</p>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                    bookingData.status === 'PENDING' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {bookingData.status === 'PENDING' ? 'Chờ xác nhận' : bookingData.status}
                  </span>
                </div>
              </div>

              {/* Thông tin địa chỉ */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Địa chỉ khách hàng
                </h3>
                <div className="ml-9">
                  <p className="font-medium text-lg mb-2">{bookingData.customerInfo.fullAddress}</p>
                  <p className="text-gray-600 mb-2">
                    {bookingData.customerInfo.ward}, {bookingData.customerInfo.district}, {bookingData.customerInfo.city}
                  </p>
                  {bookingData.customerInfo.isDefault && (
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      Địa chỉ mặc định
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin nhân viên */}
            {bookingData.assignedEmployees?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Nhân viên được phân công ({bookingData.totalEmployees})
                </h3>
                <div className="ml-9">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookingData.assignedEmployees.map((employee, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <img 
                          src={employee.avatar} 
                          alt={employee.fullName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-lg">{employee.fullName}</p>
                          <p className="text-gray-600">{employee.phoneNumber}</p>
                          <p className="text-sm text-gray-500">
                            Kỹ năng: {employee.skills.join(', ')}
                          </p>
                          {employee.rating && (
                            <p className="text-sm text-yellow-600">⭐ {employee.rating}/5</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Thông tin thanh toán */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Chi phí và thanh toán
              </h3>
              <div className="ml-9">
                <div className="bg-gray-50 p-6 rounded-lg">
                  {/* Chi tiết từng dịch vụ */}
                  {bookingData.serviceDetails?.map((serviceDetail, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{serviceDetail.service.name} x{serviceDetail.quantity}</span>
                        <span className="font-semibold">{serviceDetail.formattedSubTotal}</span>
                      </div>
                      {serviceDetail.selectedChoices?.map((choice, choiceIndex) => (
                        <div key={choiceIndex} className="flex justify-between text-sm text-gray-600 ml-4 mb-1">
                          <span>+ {choice.choiceName}</span>
                          <span>{choice.formattedPriceAdjustment}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  
                  <hr className="my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Tổng cộng:</span>
                    <span className="text-3xl font-bold text-green-600">
                      {bookingData.formattedTotalAmount}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Phương thức thanh toán:</strong></p>
                    <p className="text-gray-600">{bookingData.paymentInfo.paymentMethod}</p>
                  </div>
                  <div>
                    <p><strong>Mã giao dịch:</strong></p>
                    <p className="text-gray-600 font-mono">{bookingData.paymentInfo.transactionCode}</p>
                  </div>
                  <div>
                    <p><strong>Trạng thái thanh toán:</strong></p>
                    <span className={`inline-block px-3 py-1 text-xs rounded-full ${
                      bookingData.paymentInfo.paymentStatus === 'PENDING' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {bookingData.paymentInfo.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : 'Đã thanh toán'}
                    </span>
                  </div>
                  <div>
                    <p><strong>Ngày tạo đơn:</strong></p>
                    <p className="text-gray-600">{new Date(bookingData.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Về Dashboard
          </button>
          <button
            onClick={() => navigate(`/customer/bookings/${bookingData.bookingId}`)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Theo dõi đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;