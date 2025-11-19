# API Tạo Nhiều Booking Với Nhiều Mốc Thời Gian

## Mô tả

API này cho phép tạo nhiều booking cùng lúc với các mốc thời gian khác nhau. Điều này hữu ích khi khách hàng muốn đặt cùng một dịch vụ cho nhiều ngày/giờ khác nhau một cách nhanh chóng.

## Thông tin Endpoint

**URL:** `POST /api/v1/customer/bookings/multiple`

**Authentication:** Yêu cầu JWT Token với role `ROLE_CUSTOMER` hoặc `ROLE_ADMIN`

**Content-Type:** `multipart/form-data`

## Request Parameters

### 1. booking (JSON string) - Required

Cấu trúc JSON:

```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000011",
  "bookingTimes": ["2025-12-01T14:00:00", "2025-12-04T14:00:00"],
  "title": "Cần vệ sinh sofa và rèm cửa",
  "note": "Nhà có 1 bộ sofa da, 2 bộ rèm cửa phòng khách",
  "bookingDetails": [
    {
      "serviceId": "3",
      "quantity": 1
    }
  ],
  "assignments": [],
  "paymentMethodId": 1
}
```

### 2. images (files) - Optional

Danh sách các file ảnh (max 10 ảnh, mỗi ảnh max 10MB)

## Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| addressId | string | Có* | ID địa chỉ có sẵn (bắt buộc nếu không có newAddress) |
| newAddress | object | Có* | Địa chỉ mới (bắt buộc nếu không có addressId) |
| bookingTimes | array | Có | Mảng các mốc thời gian muốn đặt (phải ở tương lai) |
| note | string | Không | Ghi chú cho booking (max 1000 ký tự) |
| title | string | Không | Tiêu đề booking (max 255 ký tự) |
| imageUrls | array | Không | Mảng URL ảnh (được tự động thêm khi upload images) |
| promoCode | string | Không | Mã khuyến mãi (max 20 ký tự) |
| bookingDetails | array | Có | Danh sách dịch vụ cần đặt |
| assignments | array | Không | Danh sách phân công nhân viên |
| paymentMethodId | int | Có | ID phương thức thantoán |

*Lưu ý: Phải có một trong hai: addressId hoặc newAddress, không được có cả hai hoặc không có cả hai.

## Response

### Success Response (HTTP 201)

```json
{
    "success": true,
    "data": {
        "totalBookingsCreated": 2,
        "successfulBookings": 2,
        "failedBookings": 0,
        "totalAmount": 600000.00,
        "formattedTotalAmount": "600,000 VND",
        "bookings": [
            {
                "bookingId": "3232c595-c0e6-4817-ab5f-39f117691e21",
                "bookingCode": "BK72664410",
                "status": "AWAITING_EMPLOYEE",
                "totalAmount": 300000.00,
                "formattedTotalAmount": "300,000đ",
                "bookingTime": "2025-12-01T14:00:00",
                "createdAt": "2025-11-12T17:19:32.771882",
                "title": "Cần vệ sinh sofa và rèm cửa",
                "imageUrls": [],
                "isVerified": false,
                "adminComment": null,
                "customerInfo": {
                    "addressId": "adrs0001-0000-0000-0000-000000000011",
                    "fullAddress": "234 Võ Văn Tần, Phường Bến Cát, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bến Cát",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7788,
                    "longitude": 106.6897,
                    "isDefault": true
                },
                "serviceDetails": [
                    {
                        "bookingDetailId": "f29a5737-20cc-41db-9872-58e7c6439bbe",
                        "service": {
                            "serviceId": 3,
                            "name": "Vệ sinh Sofa - Nệm - Rèm",
                            "description": "Giặt sạch và khử khuẩn Sofa, Nệm, Rèm cửa bằng máy móc chuyên dụng.",
                            "basePrice": 300000.00,
                            "unit": "Gói",
                            "estimatedDurationHours": 3.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600057/sofa_bed_vkkjz8.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 300000.00,
                        "formattedPricePerUnit": "300,000đ",
                        "subTotal": 300000.00,
                        "formattedSubTotal": "300,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "3 giờ",
                        "formattedDuration": "3 giờ"
                    }
                ],
                "paymentInfo": {
                    "paymentId": "69f1b46b-a189-4ed1-9413-d55a1c8282ed",
                    "amount": 300000.00,
                    "paymentMethod": "Thanh toán tiền mặt",
                    "paymentStatus": "PENDING",
                    "transactionCode": "TXN_1762942772656",
                    "createdAt": "2025-11-12 17:19:32",
                    "paidAt": null
                },
                "promotionApplied": null,
                "assignedEmployees": [],
                "totalServices": 1,
                "totalEmployees": 0,
                "estimatedDuration": "3 giờ 0 phút",
                "hasPromotion": false,
                "hasAutoAssignedEmployees": false
            },
            {
                "bookingId": "11648c33-897d-4e2a-86fe-e1d6bb7e65f6",
                "bookingCode": "BK72995584",
                "status": "AWAITING_EMPLOYEE",
                "totalAmount": 300000.00,
                "formattedTotalAmount": "300,000đ",
                "bookingTime": "2025-12-04T14:00:00",
                "createdAt": "2025-11-12T17:19:32.999421",
                "title": "Cần vệ sinh sofa và rèm cửa",
                "imageUrls": [],
                "isVerified": false,
                "adminComment": null,
                "customerInfo": {
                    "addressId": "adrs0001-0000-0000-0000-000000000011",
                    "fullAddress": "234 Võ Văn Tần, Phường Bến Cát, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bến Cát",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7788,
                    "longitude": 106.6897,
                    "isDefault": true
                },
                "serviceDetails": [
                    {
                        "bookingDetailId": "0d34fb96-9c29-4e1d-9400-25a8beabd35b",
                        "service": {
                            "serviceId": 3,
                            "name": "Vệ sinh Sofa - Nệm - Rèm",
                            "description": "Giặt sạch và khử khuẩn Sofa, Nệm, Rèm cửa bằng máy móc chuyên dụng.",
                            "basePrice": 300000.00,
                            "unit": "Gói",
                            "estimatedDurationHours": 3.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600057/sofa_bed_vkkjz8.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 300000.00,
                        "formattedPricePerUnit": "300,000đ",
                        "subTotal": 300000.00,
                        "formattedSubTotal": "300,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "3 giờ",
                        "formattedDuration": "3 giờ"
                    }
                ],
                "paymentInfo": {
                    "paymentId": "00195916-f0be-4934-8836-addf87def1df",
                    "amount": 300000.00,
                    "paymentMethod": "Thanh toán tiền mặt",
                    "paymentStatus": "PENDING",
                    "transactionCode": "TXN_1762942772995",
                    "createdAt": "2025-11-12 17:19:33",
                    "paidAt": null
                },
                "promotionApplied": null,
                "assignedEmployees": [],
                "totalServices": 1,
                "totalEmployees": 0,
                "estimatedDuration": "3 giờ 0 phút",
                "hasPromotion": false,
                "hasAutoAssignedEmployees": false
            }
        ],
        "errors": []
    }
}
```

### Error Response (HTTP 400)

```json
{
  "success": false,
  "message": "Invalid booking data format: ..."
}
```

hoặc

```json
{
  "success": false,
  "message": "Số lượng ảnh không được vượt quá 10"
}
```

### Error Response (HTTP 500)

```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi tạo các booking"
}
```

## Validation Rules

1. **bookingTimes**:
   - Không được để trống
   - Mỗi thời gian phải ở tương lai
   - Phải là mảng hợp lệ

2. **Images** (nếu có):
   - Tối đa 10 ảnh
   - Mỗi ảnh tối đa 10MB
   - Phải là định dạng ảnh (image/*)

3. **addressId hoặc newAddress**:
   - Phải có một trong hai
   - Không được có cả hai cùng lúc

4. **bookingDetails**:
   - Không được để trống
   - Phải có ít nhất 1 dịch vụ

## Business Logic

1. API sẽ lặp qua từng mốc thời gian trong `bookingTimes`
2. Với mỗi mốc thời gian, tạo một booking riêng biệt
3. Nếu có lỗi xảy ra với một booking, các booking khác vẫn tiếp tục được tạo
4. Kết quả cuối cùng bao gồm:
   - Danh sách các booking thành công
   - Danh sách các booking thất bại với lý do lỗi
   - Tổng số tiền của tất cả booking thành công

## Notes

- Tính năng này không rollback nếu một trong các booking thất bại
- Mỗi booking được tạo độc lập, có bookingId và bookingCode riêng
- Tổng số tiền chỉ tính cho các booking thành công
- Validation được thực hiện cho từng booking riêng biệt
- Auto-assign nhân viên (nếu có) được thực hiện cho từng booking
