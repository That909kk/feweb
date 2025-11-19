# VNPay Payment Integration - Booking Flow

## Tài khoản test VNPay Sandbox

**Ngân hàng NCB**
- Số thẻ: `9704198526191432198`
- Tên chủ thẻ: `NGUYEN VAN A`
- Ngày phát hành: `07/15`
- Mật khẩu OTP: `123456`

---

## Flow thanh toán từ Booking đến Payment

### Bước 1: Tạo Booking

**HTTP Request**:
```http
POST /api/v1/customer/bookings HTTP/1.1
Host: localhost:8080
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}

--boundary
Content-Disposition: form-data; name="booking"
Content-Type: application/json

{
  "addressId": "address-uuid",
  "newAddress": null,
  "bookingTime": "2025-11-15T09:00:00",
  "note": "Dọn dẹp toàn bộ nhà",
  "title": "Dọn dẹp nhà cửa",
  "imageUrls": [],
  "promoCode": null,
  "bookingDetails": [
    {
      "serviceId": "service-uuid",
      "quantity": 1
    }
  ],
  "assignments": null,
  "paymentMethodId": "payment-method-uuid"
}

--boundary
Content-Disposition: form-data; name="images"; filename="image1.jpg"
Content-Type: image/jpeg

<binary image data>
--boundary--
```

**HTTP Response**:
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "bookingId": "booking-123-uuid",
    "bookingCode": "BK-20251110-001",
    "totalPrice": 500000,
    "bookingTime": "2025-11-15T09:00:00",
    "createdAt": "2025-11-10T14:30:00",
    "services": [
      {
        "serviceId": "service-uuid",
        "serviceName": "Dọn dẹp nhà cửa",
        "quantity": 1,
        "price": 500000
      }
    ],
    "paymentMethod": {
      "id": "payment-method-uuid",
      "name": "VNPay",
      "code": "VNPAY"
    },
    "imageUrls": ["https://res.cloudinary.com/.../image1.jpg"]
  }
}
```

---

### Bước 2: Tạo Payment URL với VNPay

**HTTP Request**:
```http
POST /api/v1/payment/vnpay/create HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "bookingId": "booking-123-uuid",
  "amount": 500000,
  "orderInfo": "Thanh toan don hang booking-123-uuid",
  "orderType": "other",
  "locale": "vn",
  "bankCode": ""
}
```

**Lưu ý về Request Parameters**:
- `bookingId` (required): ID của booking cần thanh toán
- `amount` (required): Số tiền thanh toán (VND, không có thập phân)
- `orderInfo` (optional): Thông tin đơn hàng, mặc định là "Thanh toan don hang {bookingId}"
- `orderType` (optional): Loại đơn hàng, mặc định là "other"
- `locale` (optional): Ngôn ngữ (vn/en), mặc định là "vn"
- `bankCode` (optional): Mã ngân hàng cụ thể (để chọn ngân hàng trước)

**HTTP Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Tạo URL thanh toán thành công",
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=50000000&vnp_Command=pay&vnp_CreateDate=20251110143500&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=Thanh+toan+don+hang+booking-123-uuid&vnp_OrderType=other&vnp_ReturnUrl=http://localhost:8080/api/v1/payment/vnpay/callback&vnp_TmnCode=DEMO&vnp_TxnRef=payment-uuid_1699614900000&vnp_Version=2.1.0&vnp_ExpireDate=20251110145000&vnp_SecureHash=abc123..."
  }
}
```

**Lưu ý về Response**:
- Payment URL có thời hạn 15 phút (vnp_ExpireDate)
- vnp_TxnRef được tạo theo format: `{paymentId}_{timestamp}`
- vnp_Amount được nhân 100 (VNPay yêu cầu số tiền ở đơn vị nhỏ nhất)

---

### Bước 3: User thực hiện thanh toán trên VNPay

**User Action**: 
- Frontend redirect user đến `paymentUrl`
- User nhập thông tin thẻ:
  - Số thẻ: 9704198526191432198
  - Tên: NGUYEN VAN A
  - Ngày phát hành: 07/15
  - OTP: 123456

---

### Bước 4: VNPay callback về Backend

Từ nay backend có **2 endpoint** để xử lý callback:

| Endpoint | Mục đích | Response |
| --- | --- | --- |
| `GET /api/v1/payment/vnpay/callback` | API callback truyền thống. Phù hợp cho Postman/manual test. | JSON (`success`, `message`, `data`). |
| `GET /api/v1/payment/vnpay/callback/redirect?client=web|mobile` | Callback dành cho user thực sự. Sau khi xử lý sẽ **redirect** về app FE/Mobile kèm trạng thái. | HTTP 302 → URL cấu hình. |

#### 4.1 JSON callback (API/manual)

**HTTP Request từ VNPay**:
```http
GET /api/v1/payment/vnpay/callback?vnp_Amount=50000000&...&vnp_SecureHash=xyz789... HTTP/1.1
Host: backend.local
```

**HTTP Response từ Backend (Thành công)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Thanh toán thành công",
  "data": {
    "transactionNo": "14012678",
    "amount": 500000,
    "bankCode": "NCB",
    "cardType": "ATM",
    "orderInfo": "Thanh toan don hang booking-123-uuid",
    "payDate": "20251110144500"
  }
}
```

**HTTP Response từ Backend (Thất bại)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": false,
  "message": "Thanh toán không thành công",
  "data": {
    "responseCode": "24",
    "orderInfo": "Thanh toan don hang booking-123-uuid"
  }
}
```

#### 4.2 Redirect callback (đi vào thực tế)

VNPay sẽ gọi:  
`GET /api/v1/payment/vnpay/callback/redirect?client=web&{params_vnp...}`

Backend xử lý signature giống bước 4.1, sau đó trả **302** về URL tương ứng client:

| Query `client` | Config (application.yml) | Default |
| --- | --- | --- |
| `web` | `vnpay.frontend-redirect-url` (`VNPAY_FE_REDIRECT_URL`) | `http://localhost:5173/payment/vnpay-result` |
| `mobile`/`app` | `vnpay.mobile-redirect-url` (`VNPAY_MOBILE_REDIRECT_URL`) | `housekeeping://payment/vnpay-result` |

**HTTP Response (thành công)**:
```
HTTP/1.1 302 Found
Location: https://fe.app/payment/vnpay-result?status=success&transactionNo=14012678&amount=500000&responseCode=00&orderInfo=...
```

**HTTP Response (thất bại hoặc lỗi)**:
```
HTTP/1.1 302 Found
Location: https://fe.app/payment/vnpay-result?status=failed&responseCode=24&orderInfo=...
```

Payload redirect kèm sẵn: `status`, `responseCode`, `transactionNo`, `amount`, `bankCode`, `cardType`, `orderInfo`. FE/Mobile chỉ cần đọc query và hiển thị trạng thái.

**Các Response Code của VNPay**:
- `00`: Giao dịch thành công
- `07`: Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)
- `09`: Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng
- `10`: Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần
- `11`: Giao dịch không thành công do: Đã hết hạn chờ thanh toán
- `12`: Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa
- `13`: Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP)
- `24`: Giao dịch không thành công do: Khách hàng hủy giao dịch
- `51`: Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch
- `65`: Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày
- `75`: Ngân hàng thanh toán đang bảo trì
- `79`: Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định
- `99`: Các lỗi khác

**Backend xử lý**:
1. Validate chữ ký (vnp_SecureHash) để đảm bảo request từ VNPay hợp lệ
2. Extract payment ID từ vnp_TxnRef
3. Cập nhật trạng thái Payment:
   - Nếu `vnp_ResponseCode = "00"`: Set `paymentStatus = PAID`, lưu `transactionCode` và `paidAt`
   - Nếu khác: Set `paymentStatus = FAILED`
4. Lưu Payment vào database

---

### Bước 5: Kiểm tra Payment Status

**HTTP Request**:
```http
GET /api/v1/payment/vnpay/status/booking-123-uuid HTTP/1.1
Host: localhost:8080
Authorization: Bearer {jwt_token}
```

**HTTP Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Get payment status successfully",
  "data": {
    "bookingId": "booking-123-uuid",
    "status": "PENDING"
  }
}
```

**Lưu ý**: 
- Endpoint này hiện tại chỉ trả về thông tin cơ bản (TODO: cần implement đầy đủ)
- Để lấy thông tin payment đầy đủ, nên gọi endpoint `GET /api/v1/customer/bookings/{bookingId}` (xem Bước 6)

---

### Bước 6: Kiểm tra Booking đã thanh toán

**HTTP Request**:
```http
GET /api/v1/customer/bookings/booking-123-uuid HTTP/1.1
Host: localhost:8080
Authorization: Bearer {jwt_token}
```

**HTTP Response**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "bookingId": "booking-123-uuid",
  "bookingCode": "BK-20251110-001",
  "customerId": "customer-uuid",
  "customerName": "Nguyễn Văn A",
  "customerPhone": "0123456789",
  "bookingTime": "2025-11-15T09:00:00",
  "address": {
    "addressId": "address-uuid",
    "houseNumber": "123",
    "street": "Võ Văn Ngân",
    "ward": "Linh Chiểu",
    "district": "Thủ Đức",
    "city": "Hồ Chí Minh",
    "fullAddress": "123 Võ Văn Ngân, Phường Linh Chiểu, Quận Thủ Đức, Thành phố Hồ Chí Minh"
  },
  "note": "Dọn dẹp toàn bộ nhà",
  "title": "Dọn dẹp nhà cửa",
  "status": "PENDING",
  "totalPrice": 500000,
  "discount": 0,
  "finalPrice": 500000,
  "promoCode": null,
  "services": [
    {
      "serviceId": "service-uuid",
      "serviceName": "Dọn dẹp nhà cửa",
      "categoryName": "Vệ sinh",
      "quantity": 1,
      "unitPrice": 500000,
      "totalPrice": 500000
    }
  ],
  "paymentInfo": {
    "paymentId": "payment-uuid",
    "amount": 500000,
    "paymentMethod": "VNPay",
    "paymentStatus": "PAID",
    "transactionCode": "14012678",
    "createdAt": "2025-11-10 14:30:00",
    "paidAt": "2025-11-10 14:45:00"
  },
  "imageUrls": ["https://res.cloudinary.com/.../image1.jpg"],
  "createdAt": "2025-11-10 14:30:00",
  "updatedAt": "2025-11-10 14:45:00",
  "assignments": []
}
```

**Cấu trúc PaymentInfo trong Response**:
- `paymentId`: ID của payment record
- `amount`: Số tiền thanh toán (BigDecimal)
- `paymentMethod`: Tên phương thức thanh toán (từ PaymentMethod entity)
- `paymentStatus`: Trạng thái thanh toán (PENDING, PAID, FAILED)
- `transactionCode`: Mã giao dịch từ VNPay
- `createdAt`: Thời gian tạo payment (format: yyyy-MM-dd HH:mm:ss)
- `paidAt`: Thời gian thanh toán thành công (format: yyyy-MM-dd HH:mm:ss)

---

### Bước 7: VNPay IPN (Instant Payment Notification)

VNPay cũng gửi một POST request đến IPN endpoint để thông báo kết quả thanh toán (độc lập với callback). IPN được sử dụng để đảm bảo backend nhận được thông báo ngay cả khi user đóng trình duyệt sau khi thanh toán.

**HTTP Request từ VNPay**:
```http
POST /api/v1/payment/vnpay/ipn HTTP/1.1
Host: localhost:8080
Content-Type: application/x-www-form-urlencoded

vnp_Amount=50000000&vnp_BankCode=NCB&vnp_BankTranNo=VNP01234567&vnp_CardType=ATM&vnp_OrderInfo=Thanh+toan+don+hang+booking-123-uuid&vnp_PayDate=20251110144500&vnp_ResponseCode=00&vnp_TmnCode=DEMO&vnp_TransactionNo=14012678&vnp_TransactionStatus=00&vnp_TxnRef=payment-uuid_1699614900000&vnp_SecureHash=xyz789...
```

**HTTP Response từ Backend (Thành công)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

**HTTP Response từ Backend (Thất bại)**:
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "RspCode": "99",
  "Message": "Unknown error"
}
```

**Lưu ý**:
- IPN endpoint xử lý tương tự callback endpoint
- Response format khác: sử dụng `RspCode` và `Message` theo yêu cầu của VNPay
- IPN được gọi từ VNPay server, không phụ thuộc vào user's browser

---

### Error Handling

**Common Error Responses**:

1. **Invalid booking**:
```json
{
  "success": false,
  "message": "Booking not found"
}
```

2. **Invalid signature**:
```json
{
  "success": false,
  "message": "Thanh toán không thành công",
  "data": {
    "responseCode": "97",
    "orderInfo": "..."
  }
}
```

3. **Payment creation error**:
```json
{
  "success": false,
  "message": "Lỗi khi tạo thanh toán: {error_detail}"
}
```

---

## Lưu ý quan trọng

1. **Amount Format**: VNPay yêu cầu số tiền ở đơn vị nhỏ nhất (không có thập phân)
   - Frontend/API: 500,000 VND
   - VNPay API: 50,000,000 (nhân 100)

2. **Timeout**: Payment URL có hiệu lực 15 phút (vnp_ExpireDate)

3. **Transaction Reference**: Format `{paymentId}_{timestamp}` để đảm bảo unique và có thể trace back

4. **Dual Notification**: VNPay gửi cả callback (redirect browser) và IPN (server-to-server) để đảm bảo backend nhận được thông báo

5. **Idempotency**: Callback và IPN có thể được gọi nhiều lần, cần handle để tránh duplicate processing

6. **Payment Status Flow**:
   - Initial: `PENDING` (khi tạo booking/payment)
   - Success: `PAID` (sau callback/IPN với responseCode="00")
   - Failure: `FAILED` (sau callback/IPN với responseCode khác "00")

7. **Security**: Luôn validate `vnp_SecureHash` trước khi xử lý callback/IPN

8. **Redirect Config**: 
   - `vnpay.frontend-redirect-url` & `vnpay.mobile-redirect-url` có thể override qua biến môi trường (`VNPAY_FE_REDIRECT_URL`, `VNPAY_MOBILE_REDIRECT_URL`).
   - Khi VNPay redirect user thật, hãy cấu hình `vnp_ReturnUrl` trỏ tới `/callback/redirect?client=web` (hoặc `client=mobile`) để tránh người dùng bị kẹt lại ở backend JSON.


