# API Đặt Lịch Định Kỳ (Recurring Booking)

## Tổng quan
Tính năng đặt lịch định kỳ cho phép khách hàng tạo các booking tự động theo chu kỳ tuần hoặc tháng. Hệ thống sẽ tự động tạo các booking theo lịch định kỳ đã được thiết lập.

## Các API

### 1. Tạo Lịch Định Kỳ

**Endpoint:** `POST /api/v1/customer/recurring-bookings/{customerId}`

**Authorization:** Bearer Token (ROLE_CUSTOMER)

**Path Parameters:**
- `customerId`: ID của khách hàng

**Request Body:**
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000009",
  "newAddress": {
    "customerId": "c1000001-0000-0000-0000-000000000004",
    "fullAddress": "45 Nguyễn Huệ, Phường Phú An, Thành phố Hồ Chí Minh",
    "ward": "Phường Phú An",
    "city": "Thành phố Hồ Chí Minh",
    "latitude": 10.7743,
    "longitude": 106.7043
  },
  "recurrenceType": "WEEKLY",
  "recurrenceDays": [1, 3, 5],
  "bookingTime": "14:00:00",
  "startDate": "2025-11-20",
  "endDate": "2026-12-30",
  "note": "Vệ sinh định kỳ căn hộ 2 phòng ngủ",
  "title": "Dọn dẹp hàng tuần",
  "promoCode": null,
  "bookingDetails": [
    {
      "serviceId": 2,
      "quantity": 1
    }
  ]
}
```

**Response thành công (201):**
```json
{
    "success": true,
    "message": "Đặt lịch định kỳ thành công",
    "data": {
        "success": true,
        "message": "Đặt lịch định kỳ thành công",
        "recurringBooking": {
            "recurringBookingId": "6216b5fc-2e98-45ca-a692-af5a218c9448",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
            "customer": {
                "customerId": "c1000001-0000-0000-0000-000000000004",
                "fullName": "Nguyễn Văn An",
                "avatar": "https://i.pravatar.cc/150?img=11",
                "email": "nguyenvanan@gmail.com",
                "phoneNumber": "0987654321",
                "isMale": true,
                "birthdate": "1995-03-15",
                "rating": null,
                "vipLevel": null
            },
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000009",
                "fullAddress": "45 Nguyễn Huệ, Phường Phú An, Thành phố Hồ Chí Minh",
                "ward": "Phường Phú An",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7743,
                "longitude": 106.7043,
                "isDefault": true
            },
            "recurrenceType": "WEEKLY",
            "recurrenceTypeDisplay": "Hàng tuần",
            "recurrenceDays": [
                1,
                3,
                5
            ],
            "recurrenceDaysDisplay": "Thứ 2, Thứ 4, Thứ 6",
            "bookingTime": "14:00:00",
            "startDate": "2025-11-20",
            "endDate": "2026-12-30",
            "note": "Vệ sinh định kỳ căn hộ 2 phòng ngủ",
            "title": "Dọn dẹp hàng tuần",
            "promotion": null,
            "recurringBookingDetails": [
                {
                    "bookingDetailId": "01105fbc-b4cc-4992-87c4-bf78dc45d2da",
                    "service": {
                        "serviceId": 2,
                        "name": "Tổng vệ sinh",
                        "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                        "basePrice": 100000.00,
                        "unit": "Gói",
                        "estimatedDurationHours": 2.0,
                        "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                        "categoryName": "Dọn dẹp nhà",
                        "isActive": true
                    },
                    "quantity": 1,
                    "pricePerUnit": 100000.00,
                    "formattedPricePerUnit": "100,000 đ",
                    "subTotal": 100000.00,
                    "formattedSubTotal": "100,000 đ",
                    "selectedChoices": [],
                    "assignments": [],
                    "duration": "2.0h",
                    "formattedDuration": "2.0h"
                }
            ],
            "status": "ACTIVE",
            "statusDisplay": "Đang hoạt động",
            "cancelledAt": null,
            "cancellationReason": null,
            "createdAt": "2025-11-18T13:12:23",
            "updatedAt": "2025-11-18T13:12:23",
            "totalGeneratedBookings": 12,
            "upcomingBookings": 12
        },
        "generatedBookingIds": [
            "ae511261-30da-4ce7-9e2c-e5f52573d435",
            "5dceacd2-8005-426a-89a3-8d768ccf4b02",
            "e2f13f1e-bf03-462a-acdc-8676eef59e5f",
            "4e41d105-4327-4ca0-b4b4-07a135f3bd6d",
            "4653f922-7587-4d4b-8c9b-d6acced37e0c",
            "9b7df1c1-7861-4a9f-b1a9-33de1fd843e8",
            "9cecea20-28f9-4396-b113-a732cc61f02b",
            "fa65d823-2e8d-4212-8a74-a1d4758a5e50",
            "7b3f7141-a156-4b9c-afd3-6d47e9bcabd5",
            "b2739bfd-7722-4d16-bf10-85d978eed57a",
            "8c049b6f-8c07-479b-9ec4-9d06b01d3e06",
            "3daccb6c-6e0c-4a23-b55f-a33adf7c5acb"
        ],
        "totalBookingsToBeCreated": 174
    }
}
```

---

### 2. Hủy Lịch Định Kỳ

**Endpoint:** `PUT /api/v1/customer/recurring-bookings/{customerId}/{recurringBookingId}/cancel`

**Authorization:** Bearer Token (ROLE_CUSTOMER)

**Path Parameters:**
- `customerId`: ID của khách hàng
- `recurringBookingId`: ID của lịch định kỳ cần hủy

**Request Body:**
```json
{
  "reason": "Không còn nhu cầu sử dụng dịch vụ"
}
```

**Response thành công (200):**
```json
{
    "success": true,
    "message": "Đã hủy lịch định kỳ thành công",
    "data": {
        "recurringBookingId": "6216b5fc-2e98-45ca-a692-af5a218c9448",
        "customerId": "c1000001-0000-0000-0000-000000000004",
        "customerName": "Nguyễn Văn An",
        "customer": {
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "fullName": "Nguyễn Văn An",
            "avatar": "https://i.pravatar.cc/150?img=11",
            "email": "nguyenvanan@gmail.com",
            "phoneNumber": "0987654321",
            "isMale": true,
            "birthdate": "1995-03-15",
            "rating": null,
            "vipLevel": null
        },
        "address": {
            "addressId": "adrs0001-0000-0000-0000-000000000009",
            "fullAddress": "45 Nguyễn Huệ, Phường Phú An, Thành phố Hồ Chí Minh",
            "ward": "Phường Phú An",
            "city": "Thành phố Hồ Chí Minh",
            "latitude": 10.7743,
            "longitude": 106.7043,
            "isDefault": true
        },
        "recurrenceType": "WEEKLY",
        "recurrenceTypeDisplay": "Hàng tuần",
        "recurrenceDays": [
            1,
            3,
            5
        ],
        "recurrenceDaysDisplay": "Thứ 2, Thứ 4, Thứ 6",
        "bookingTime": "14:00:00",
        "startDate": "2025-11-20",
        "endDate": "2026-12-30",
        "note": "Vệ sinh định kỳ căn hộ 2 phòng ngủ",
        "title": "Dọn dẹp hàng tuần",
        "promotion": null,
        "recurringBookingDetails": [
            {
                "bookingDetailId": "01105fbc-b4cc-4992-87c4-bf78dc45d2da",
                "service": {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                    "basePrice": 100000.00,
                    "unit": "Gói",
                    "estimatedDurationHours": 2.0,
                    "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                    "categoryName": "Dọn dẹp nhà",
                    "isActive": true
                },
                "quantity": 1,
                "pricePerUnit": 100000.00,
                "formattedPricePerUnit": "100,000 đ",
                "subTotal": 100000.00,
                "formattedSubTotal": "100,000 đ",
                "selectedChoices": [],
                "assignments": [],
                "duration": "2.0h",
                "formattedDuration": "2.0h"
            }
        ],
        "status": "CANCELLED",
        "statusDisplay": "Đã hủy",
        "cancelledAt": "2025-11-18T13:14:46",
        "cancellationReason": "Không còn nhu cầu sử dụng dịch vụ",
        "createdAt": "2025-11-18T13:12:23",
        "updatedAt": "2025-11-18T13:12:23",
        "totalGeneratedBookings": 12,
        "upcomingBookings": null
    }
}
```

**Lưu ý:** 
- Khi hủy lịch định kỳ, tất cả các booking tương lai (chưa thực hiện) sẽ bị xóa
- Các booking đã hoàn thành hoặc đang thực hiện sẽ không bị ảnh hưởng

---

### 3. Lấy Danh Sách Lịch Định Kỳ

**Endpoint:** `GET /api/v1/customer/recurring-bookings/{customerId}`

**Authorization:** Bearer Token (ROLE_CUSTOMER)

**Path Parameters:**
- `customerId`: ID của khách hàng

**Query Parameters:**
- `page`: Trang (default: 0)
- `size`: Số lượng mỗi trang (default: 10)

**Response thành công (200):**
```json
{
    "currentPage": 0,
    "totalItems": 2,
    "totalPages": 1,
    "data": [
        {
            "recurringBookingId": "6216b5fc-2e98-45ca-a692-af5a218c9448",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
            "customer": {
                "customerId": "c1000001-0000-0000-0000-000000000004",
                "fullName": "Nguyễn Văn An",
                "avatar": "https://i.pravatar.cc/150?img=11",
                "email": "nguyenvanan@gmail.com",
                "phoneNumber": "0987654321",
                "isMale": true,
                "birthdate": "1995-03-15",
                "rating": null,
                "vipLevel": null
            },
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000009",
                "fullAddress": "45 Nguyễn Huệ, Phường Phú An, Thành phố Hồ Chí Minh",
                "ward": "Phường Phú An",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7743,
                "longitude": 106.7043,
                "isDefault": true
            },
            "recurrenceType": "WEEKLY",
            "recurrenceTypeDisplay": "Hàng tuần",
            "recurrenceDays": [
                1,
                3,
                5
            ],
            "recurrenceDaysDisplay": "Thứ 2, Thứ 4, Thứ 6",
            "bookingTime": "14:00:00",
            "startDate": "2025-11-20",
            "endDate": "2026-12-30",
            "note": "Vệ sinh định kỳ căn hộ 2 phòng ngủ",
            "title": "Dọn dẹp hàng tuần",
            "promotion": null,
            "recurringBookingDetails": [
                {
                    "bookingDetailId": "01105fbc-b4cc-4992-87c4-bf78dc45d2da",
                    "service": {
                        "serviceId": 2,
                        "name": "Tổng vệ sinh",
                        "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                        "basePrice": 100000.00,
                        "unit": "Gói",
                        "estimatedDurationHours": 2.0,
                        "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                        "categoryName": "Dọn dẹp nhà",
                        "isActive": true
                    },
                    "quantity": 1,
                    "pricePerUnit": 100000.00,
                    "formattedPricePerUnit": "100,000 đ",
                    "subTotal": 100000.00,
                    "formattedSubTotal": "100,000 đ",
                    "selectedChoices": [],
                    "assignments": [],
                    "duration": "2.0h",
                    "formattedDuration": "2.0h"
                }
            ],
            "status": "ACTIVE",
            "statusDisplay": "Đang hoạt động",
            "cancelledAt": null,
            "cancellationReason": null,
            "createdAt": "2025-11-18T13:12:23",
            "updatedAt": "2025-11-18T13:12:23",
            "totalGeneratedBookings": 12,
            "upcomingBookings": 12
        },
        {
            "recurringBookingId": "34f43915-ce77-499f-9db1-39b8545b9edb",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
            "customer": {
                "customerId": "c1000001-0000-0000-0000-000000000004",
                "fullName": "Nguyễn Văn An",
                "avatar": "https://i.pravatar.cc/150?img=11",
                "email": "nguyenvanan@gmail.com",
                "phoneNumber": "0987654321",
                "isMale": true,
                "birthdate": "1995-03-15",
                "rating": null,
                "vipLevel": null
            },
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000009",
                "fullAddress": "45 Nguyễn Huệ, Phường Phú An, Thành phố Hồ Chí Minh",
                "ward": "Phường Phú An",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7743,
                "longitude": 106.7043,
                "isDefault": true
            },
            "recurrenceType": "WEEKLY",
            "recurrenceTypeDisplay": "Hàng tuần",
            "recurrenceDays": [
                1,
                3,
                5
            ],
            "recurrenceDaysDisplay": "Thứ 2, Thứ 4, Thứ 6",
            "bookingTime": "14:00:00",
            "startDate": "2025-11-20",
            "endDate": "2026-12-30",
            "note": "Vệ sinh định kỳ căn hộ 2 phòng ngủ",
            "title": "Dọn dẹp hàng tuần",
            "promotion": null,
            "recurringBookingDetails": [
                {
                    "bookingDetailId": "089ac986-7863-43e6-862f-b8a65b4aed59",
                    "service": {
                        "serviceId": 2,
                        "name": "Tổng vệ sinh",
                        "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                        "basePrice": 100000.00,
                        "unit": "Gói",
                        "estimatedDurationHours": 2.0,
                        "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                        "categoryName": "Dọn dẹp nhà",
                        "isActive": true
                    },
                    "quantity": 1,
                    "pricePerUnit": 100000.00,
                    "formattedPricePerUnit": "100,000 đ",
                    "subTotal": 100000.00,
                    "formattedSubTotal": "100,000 đ",
                    "selectedChoices": [],
                    "assignments": [],
                    "duration": "2.0h",
                    "formattedDuration": "2.0h"
                }
            ],
            "status": "ACTIVE",
            "statusDisplay": "Đang hoạt động",
            "cancelledAt": null,
            "cancellationReason": null,
            "createdAt": "2025-11-18T13:11:31",
            "updatedAt": "2025-11-18T13:11:31",
            "totalGeneratedBookings": 12,
            "upcomingBookings": 12
        }
    ],
    "success": true
}
```

---

### 4. Lấy Chi Tiết Lịch Định Kỳ

**Endpoint:** `GET /api/v1/customer/recurring-bookings/{customerId}/{recurringBookingId}`

**Authorization:** Bearer Token (ROLE_CUSTOMER)

**Path Parameters:**
- `customerId`: ID của khách hàng
- `recurringBookingId`: ID của lịch định kỳ

**Response thành công (200):**
```json
{
    "data": {
        "recurringBookingId": "6216b5fc-2e98-45ca-a692-af5a218c9448",
        "customerId": "c1000001-0000-0000-0000-000000000004",
        "customerName": "Nguyễn Văn An",
        "customer": {
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "fullName": "Nguyễn Văn An",
            "avatar": "https://i.pravatar.cc/150?img=11",
            "email": "nguyenvanan@gmail.com",
            "phoneNumber": "0987654321",
            "isMale": true,
            "birthdate": "1995-03-15",
            "rating": null,
            "vipLevel": null
        },
        "address": {
            "addressId": "adrs0001-0000-0000-0000-000000000009",
            "fullAddress": "45 Nguyễn Huệ, Phường Phú An, Thành phố Hồ Chí Minh",
            "ward": "Phường Phú An",
            "city": "Thành phố Hồ Chí Minh",
            "latitude": 10.7743,
            "longitude": 106.7043,
            "isDefault": true
        },
        "recurrenceType": "WEEKLY",
        "recurrenceTypeDisplay": "Hàng tuần",
        "recurrenceDays": [
            1,
            3,
            5
        ],
        "recurrenceDaysDisplay": "Thứ 2, Thứ 4, Thứ 6",
        "bookingTime": "14:00:00",
        "startDate": "2025-11-20",
        "endDate": "2026-12-30",
        "note": "Vệ sinh định kỳ căn hộ 2 phòng ngủ",
        "title": "Dọn dẹp hàng tuần",
        "promotion": null,
        "recurringBookingDetails": [
            {
                "bookingDetailId": "01105fbc-b4cc-4992-87c4-bf78dc45d2da",
                "service": {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                    "basePrice": 100000.00,
                    "unit": "Gói",
                    "estimatedDurationHours": 2.0,
                    "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                    "categoryName": "Dọn dẹp nhà",
                    "isActive": true
                },
                "quantity": 1,
                "pricePerUnit": 100000.00,
                "formattedPricePerUnit": "100,000 đ",
                "subTotal": 100000.00,
                "formattedSubTotal": "100,000 đ",
                "selectedChoices": [],
                "assignments": [],
                "duration": "2.0h",
                "formattedDuration": "2.0h"
            }
        ],
        "status": "ACTIVE",
        "statusDisplay": "Đang hoạt động",
        "cancelledAt": null,
        "cancellationReason": null,
        "createdAt": "2025-11-18T13:12:23",
        "updatedAt": "2025-11-18T13:12:23",
        "totalGeneratedBookings": 12,
        "upcomingBookings": 12
    },
    "success": true
}
```

---

## Luồng Hoạt Động

### Tạo Lịch Định Kỳ
1. Khách hàng gửi request tạo lịch định kỳ
2. Hệ thống validate:
   - Địa chỉ
   - Loại lặp lại (WEEKLY/MONTHLY)
   - Ngày lặp lại hợp lệ
   - Ngày bắt đầu phải từ hôm nay
   - Dịch vụ có thể đặt
3. Tạo bản ghi recurring booking
4. Tự động tạo booking cho 30 ngày tới
5. Trả về thông tin lịch định kỳ

### Hủy Lịch Định Kỳ
1. Khách hàng gửi request hủy với lý do
2. Hệ thống:
   - Đánh dấu lịch định kỳ là CANCELLED
   - Xóa tất cả booking tương lai (status = PENDING hoặc AWAITING_EMPLOYEE)
   - Giữ lại các booking đã hoàn thành hoặc đang thực hiện

### Tự Động Tạo Booking
1. Scheduler chạy mỗi ngày lúc 2:00 AM
2. Tìm tất cả lịch định kỳ đang ACTIVE
3. Tạo booking cho 30 ngày tới nếu chưa có
4. Booking được tạo tự động có link về lịch định kỳ gốc

---

## Enum Values

### RecurrenceType
- `WEEKLY`: Lặp lại theo tuần
- `MONTHLY`: Lặp lại theo tháng

### RecurringBookingStatus
- `ACTIVE`: Đang hoạt động
- `CANCELLED`: Đã hủy
- `COMPLETED`: Đã hoàn thành (hết hạn)

---

## Validation Rules

### Recurrence Days
- **WEEKLY**: 
  - Giá trị: 1-7
  - 1 = Thứ 2, 2 = Thứ 3, ..., 7 = Chủ nhật
  - Ví dụ: [1, 3, 5] = Thứ 2, Thứ 4, Thứ 6
  
- **MONTHLY**:
  - Giá trị: 1-31
  - Ngày trong tháng
  - Ví dụ: [1, 15, 30] = Ngày 1, 15, 30 hàng tháng

### Dates
- `startDate`: Phải từ hôm nay trở đi
- `endDate`: Nếu có, phải sau `startDate`

### Booking Time
- Format: HH:mm:ss
- Giờ trong ngày khi tạo booking tự động

---

## Error Codes

| Code | Message |
|------|---------|
| 400 | Địa chỉ là bắt buộc |
| 400 | Ngày lặp lại không được để trống |
| 400 | Ngày trong tuần phải từ 1 (Thứ 2) đến 7 (Chủ nhật) |
| 400 | Ngày trong tháng phải từ 1 đến 31 |
| 400 | Ngày bắt đầu phải từ hôm nay trở đi |
| 400 | Ngày kết thúc phải sau ngày bắt đầu |
| 401 | Invalid or expired token |
| 404 | Không tìm thấy lịch định kỳ |
| 500 | Lỗi tạo lịch định kỳ |

---

## Notes

1. **Tự động tạo booking**: Scheduler chạy mỗi ngày lúc 2:00 AM để tạo booking cho 30 ngày tới
2. **Xóa booking tương lai**: Khi hủy lịch định kỳ, chỉ xóa booking có status PENDING hoặc AWAITING_EMPLOYEE
3. **Link booking với recurring**: Mỗi booking tự động tạo sẽ có `recurring_booking_id` để trace về lịch gốc
4. **Promotion**: Có thể áp dụng mã giảm giá cho tất cả booking trong lịch định kỳ
5. **Auto-assign nhân viên**: Booking tự động tạo sẽ được auto-assign nhân viên nếu có
