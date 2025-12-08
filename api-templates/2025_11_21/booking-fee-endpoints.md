# Booking & Additional Fee API (dữ liệu mẫu từ seed SQL)

## 1) Admin - Quản lý phụ phí
Prefix: `/api/v1/admin/additional-fees` (JWT admin). Tất cả response mẫu dưới đây dùng dữ liệu seed trong `postgres_data/init_sql/99_additional_fees.sql`.

### 1.1 POST `/` tạo phụ phí
**Request body (json đầy đủ)**:
```json
{
  "name": "Phí lễ",
  "description": "Phụ phí áp dụng ngày lễ",
  "feeType": "PERCENT",
  "value": 0.15,
  "systemSurcharge": false,
  "active": true,
  "priority": 3
}
```
**Response (json đầy đủ)**:
```json
{
  "id": "fee-peak-10",
  "name": "Phụ phí cao điểm",
  "description": "Áp dụng cho khung giờ cao điểm",
  "feeType": "PERCENT",
  "value": 0.10,
  "systemSurcharge": false,
  "active": true,
  "priority": 1,
  "createdAt": "2025-11-21T00:00:00",
  "updatedAt": "2025-11-21T00:00:00"
}
```

### 1.2 PUT `/{id}` cập nhật phụ phí
**Request body (json đầy đủ, giống POST)**:
```json
{
  "name": "Phí di chuyển xa",
  "description": "Áp dụng cho khu vực ngoại thành",
  "feeType": "FLAT",
  "value": 60000,
  "systemSurcharge": false,
  "active": true,
  "priority": 4
}
```
**Response**: đối tượng phụ phí đầy đủ (id không đổi), ví dụ:
```json
{
  "id": "fee-transport-50k",
  "name": "Phí di chuyển xa",
  "description": "Áp dụng cho khu vực ngoại thành",
  "feeType": "FLAT",
  "value": 60000,
  "systemSurcharge": false,
  "active": true,
  "priority": 4,
  "createdAt": "2025-11-21T00:00:00",
  "updatedAt": "2025-11-21T00:10:00"
}
```

### 1.3 POST `/{id}/activate?active=true|false` bật/tắt
**Response**:
```json
{
  "id": "fee-transport-50k",
  "name": "Phí di chuyển",
  "description": "Phí cố định cho khu vực xa",
  "feeType": "FLAT",
  "value": 50000,
  "systemSurcharge": false,
  "active": true,
  "priority": 2,
  "createdAt": "2025-11-21T00:00:00",
  "updatedAt": "2025-11-21T00:00:00"
}
```

### 1.4 POST `/{id}/system-surcharge` đặt làm phí hệ thống (tự tắt cái cũ)
**Response**:
```json
{
  "id": "fee-system-20",
  "name": "Phí hệ thống",
  "description": "Phụ phí mặc định 20% tính trên dịch vụ",
  "feeType": "PERCENT",
  "value": 0.20,
  "systemSurcharge": true,
  "active": true,
  "priority": 0,
  "createdAt": "2025-11-21T00:00:00",
  "updatedAt": "2025-11-21T00:00:00"
}
```

### 1.5 GET `/` danh sách phụ phí (phân trang)
**Query**: `page` (mặc định 0), `size` (mặc định 10), `sort` (mặc định `priority,asc`).
**Response đầy đủ**:
```json
{
  "content": [
    {
      "id": "fee-system-20",
      "name": "Phí hệ thống",
      "description": "Phụ phí mặc định 20% tính trên dịch vụ",
      "feeType": "PERCENT",
      "value": 0.20,
      "systemSurcharge": true,
      "active": true,
      "priority": 0,
      "createdAt": "2025-11-21T00:00:00",
      "updatedAt": "2025-11-21T00:00:00"
    },
    {
      "id": "fee-peak-10",
      "name": "Phụ phí cao điểm",
      "description": "Áp dụng cho khung giờ cao điểm",
      "feeType": "PERCENT",
      "value": 0.10,
      "systemSurcharge": false,
      "active": true,
      "priority": 1,
      "createdAt": "2025-11-21T00:00:00",
      "updatedAt": "2025-11-21T00:00:00"
    },
    {
      "id": "fee-transport-50k",
      "name": "Phí di chuyển",
      "description": "Phí cố định cho khu vực xa",
      "feeType": "FLAT",
      "value": 50000,
      "systemSurcharge": false,
      "active": true,
      "priority": 2,
      "createdAt": "2025-11-21T00:00:00",
      "updatedAt": "2025-11-21T00:00:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    }
  },
  "totalPages": 1,
  "totalElements": 3,
  "last": true,
  "first": true,
  "number": 0,
  "numberOfElements": 3,
  "size": 10,
  "sort": {
    "sorted": true,
    "unsorted": false,
    "empty": false
  },
  "empty": false
}
```

## 2) Booking (tạo mới) kèm breakdown phí (customer)
Prefix: `/api/v1/customer/bookings`

### 2.1 POST `/` tạo booking
**Request body mẫu**: form-data
Key: booking
Value:
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000001",
  "bookingTime": "2025-11-22T15:00:00",
  "note": "Làm sạch phòng khách",
  "promoCode": null,
  "additionalFeeIds": [], // có thể truyền mảng rỗng, hoặc id của fee
  "bookingDetails": [
    {
      "serviceId": 1,
      "quantity": 2,
      "expectedPrice": 100000,
      "expectedPricePerUnit": 50000,
      "selectedChoiceIds": []
    }
  ],
  "assignments": [],
  "paymentMethodId": 1
}
```
**Response đầy đủ (ví dụ booking mới với subtotal 200,000đ như BK000008 trong seed, có phụ thu hệ thống 20%)**:
```json
{
    "data": {
        "bookingId": "d8775410-0a14-4505-a3e4-b7365cfe1f27",
        "bookingCode": "BK39025",
        "status": "AWAITING_EMPLOYEE",
        "totalAmount": 60000.00,
        "formattedTotalAmount": "60,000đ",
        "bookingTime": "2025-11-22T15:00:00",
        "createdAt": "2025-11-21T16:43:20.059123",
        "title": null,
        "imageUrls": [],
        "isVerified": false,
        "adminComment": null,
        "customerInfo": {
            "addressId": "adrs0001-0000-0000-0000-000000000001",
            "fullAddress": "123 Lê Trọng Tấn, Phường Thủ Dầu Một, Thành phố Hồ Chí Minh",
            "ward": "Phường Thủ Dầu Một",
            "city": "Thành phố Hồ Chí Minh",
            "latitude": 10.7943,
            "longitude": 106.6256,
            "isDefault": true
        },
        "serviceDetails": [
            {
                "bookingDetailId": "74605f95-8ba3-43e7-988c-bdae5de741b2",
                "service": {
                    "serviceId": 1,
                    "name": "Dọn dẹp theo giờ",
                    "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                    "basePrice": 50000.00,
                    "unit": "Giờ",
                    "estimatedDurationHours": 2.0,
                    "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                    "categoryName": "Dọn dẹp nhà",
                    "isActive": true
                },
                "quantity": 1,
                "pricePerUnit": 50000.00,
                "formattedPricePerUnit": "50,000đ",
                "subTotal": 50000.00,
                "formattedSubTotal": "50,000đ",
                "selectedChoices": [],
                "assignments": [],
                "duration": "2 giờ",
                "formattedDuration": "2 giờ"
            }
        ],
        "paymentInfo": {
            "paymentId": "f6412936-8763-4164-9123-3c69afe13557",
            "amount": 60000.00,
            "paymentMethod": "Thanh toán tiền mặt",
            "paymentStatus": "PENDING",
            "transactionCode": "TXN_1763718200034",
            "createdAt": "2025-11-21 16:43:25",
            "paidAt": null
        },
        "promotionApplied": null,
        "assignedEmployees": [],
        "totalServices": 1,
        "totalEmployees": 0,
        "estimatedDuration": "2 giờ 0 phút",
        "hasPromotion": false,
        "hasAutoAssignedEmployees": false,
        "baseAmount": 50000.00,
        "totalFees": 10000,
        "fees": [
            {
                "name": "Phí hệ thống",
                "type": "PERCENT",
                "value": 0.2000,
                "amount": 10000,
                "systemSurcharge": true
            }
        ]
    },
    "success": true
}
```

### 2.2 GET `/{bookingId}` hoặc `/{bookingId}/charges` trả `BookingResponse` với breakdown
**Response đầy đủ (BK000002 từ seed)**:
```json
{
  "success": true,
  "data": {
    "bookingId": "b0000001-0000-0000-0000-000000000002",
    "bookingCode": "BK000002",
    "customerId": "c1000001-0000-0000-0000-000000000003",
    "customerName": "Jane Smith Customer",
    "address": {
      "addressId": "adrs0001-0000-0000-0000-000000000003",
      "fullAddress": "123 Đường ABC, Quận 1, TP.HCM",
      "ward": "Quận 1",
      "city": "TP.HCM"
    },
    "bookingTime": "2025-08-28T14:00:00",
    "note": "Vui lòng đến đúng giờ.",
    "totalAmount": 158000,
    "formattedTotalAmount": "158,000 VND",
    "baseAmount": 90000,
    "totalFees": 68000,
    "fees": [
      { "name": "Phí hệ thống", "type": "PERCENT", "value": 0.20, "amount": 18000, "systemSurcharge": true },
      { "name": "Phí di chuyển", "type": "FLAT", "value": 50000, "amount": 50000, "systemSurcharge": false }
    ],
    "bookingDetails": [
      {
        "service": { "serviceId": 1, "name": "Dọn dẹp theo giờ" },
        "quantity": 2,
        "pricePerUnit": 50000,
        "subTotal": 100000,
        "selectedChoiceIds": []
      }
    ],
    "payment": {
      "amount": 158000,
      "paymentMethod": "Chưa định nghĩa trong seed",
      "paymentStatus": "PENDING"
    },
    "status": "CONFIRMED",
    "isVerified": true,
    "createdAt": "2025-08-01T00:00:00"
  }
}
```

### 2.3 Ghi chú áp dụng phí
- Phụ thu hệ thống luôn tính theo % trên subtotal (sau khuyến mãi) và luôn được tự động áp dụng.
- Các phụ phí khác (PERCENT/FLAT) chỉ được áp dụng khi client gửi `additionalFeeIds` trong request và phụ phí đó đang `active=true`.
- Snapshot `booking_additional_fee` được lưu cùng booking để hiển thị lại cho customer/employee.

## 3) Dữ liệu seed liên quan (postgres_data/init_sql)
- Phí hệ thống mặc định: `fee-system-20` (PERCENT 0.20, active).
- Phí khác: `fee-peak-10` (PERCENT 0.10, active), `fee-transport-50k` (FLAT 50000, active).
- Áp dụng mẫu:
  - BK000001 (`b0000001-0000-0000-0000-000000000001`): Phí hệ thống 16,000; Phụ phí cao điểm 8,000.
  - BK000002 (`b0000001-0000-0000-0000-000000000002`): Phí hệ thống 18,000; Phí di chuyển 50,000.
  - BK000008 (`b0000001-0000-0000-0000-000000000008`): Phí hệ thống 40,000.
