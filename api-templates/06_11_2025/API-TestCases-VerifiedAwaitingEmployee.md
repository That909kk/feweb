# API Test Cases - Get Verified Awaiting Employee Bookings

## Endpoint Information

- **URL**: `GET /api/v1/employee/bookings/verified-awaiting-employee`
- **Authentication**: Required (ROLE_EMPLOYEE, ROLE_ADMIN)
- **Authorization**: Employee and Admin
- **Description**: Lấy danh sách các booking đã được admin xác minh (verified) và đang chờ được phân công employee

---

## Test Case 1: Get All Verified Awaiting Employee Bookings

**Request**:
```http
GET /api/v1/employee/bookings/verified-awaiting-employee?page=0&size=10
Authorization: Bearer {employee_token}
```

**Expected Response (200 OK)**:
```json
{
    "success": true,
    "data": [
        {
            "bookingId": "b0000001-0000-0000-0000-000000000010",
            "bookingCode": "BK000010",
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
                "fullAddress": "123 Đường Lê Văn Việt, Phường Tăng Nhơn Phú A",
                "ward": "Phường Tăng Nhơn Phú A",
                "city": "Thành phố Thủ Đức",
                "latitude": 10.8506,
                "longitude": 106.7629,
                "isDefault": true
            },
            "bookingTime": "2025-11-05T10:00:00",
            "note": "Vệ sinh tổng quát căn hộ",
            "totalAmount": 500000.00,
            "formattedTotalAmount": "500.000 ₫",
            "status": "AWAITING_EMPLOYEE",
            "title": null,
            "imageUrl": null,
            "isVerified": true,
            "adminComment": null,
            "promotion": null,
            "bookingDetails": [
                {
                    "id": "bd000001-0000-0000-0000-000000000010",
                    "service": {
                        "serviceId": 2,
                        "name": "Tổng vệ sinh",
                        "description": "Dịch vụ vệ sinh tổng thể toàn bộ ngôi nhà",
                        "basePrice": 500000.00,
                        "unit": "lần",
                        "estimatedDurationHours": 4.0,
                        "iconUrl": "https://example.com/icons/deep-cleaning.png",
                        "categoryName": "Vệ sinh",
                        "isActive": true
                    },
                    "quantity": 1,
                    "pricePerUnit": 500000.00,
                    "formattedPricePerUnit": "500.000 ₫",
                    "subTotal": 500000.00,
                    "formattedSubTotal": "500.000 ₫",
                    "selectedChoices": [],
                    "assignments": [],
                    "estimatedDuration": "4.0 giờ",
                    "formattedEstimatedDuration": "4.0 giờ"
                }
            ],
            "payment": null,
            "createdAt": "2025-11-05T09:00:00"
        }
    ],
    "currentPage": 0,
    "totalItems": 1,
    "totalPages": 1
}
```

**Notes**:
- Chỉ trả về bookings có `isVerified = true`
- Chỉ trả về bookings có `status = AWAITING_EMPLOYEE`
- Không có assignment nào được phân công
- Sắp xếp theo `createdAt DESC` (mới nhất trước)

---

## Test Case 2: Get Verified Awaiting Employee Bookings From Specific Date

**Request**:
```http
GET /api/v1/employee/bookings/verified-awaiting-employee?fromDate=2025-11-07T00:00:00&page=0&size=10
Authorization: Bearer {employee_token}
```

**Notes**:
- Lọc bookings có `bookingTime >= 2025-10-08T00:00:00`
- Sắp xếp theo `bookingTime ASC` (sớm nhất trước)

**Expected Response (200 OK)**:
```json
{
    "success": true,
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0010-0000-0000-0000-000000000001",
                "bookingCode": "HKS000010",
                "customerId": "c1000001-0000-0000-0000-000000000003",
                "customerName": "Jane Smith Customer",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000003",
                    "fullName": "Jane Smith Customer",
                    "avatar": "https://picsum.photos/200",
                    "email": "jane.smith.customer@example.com",
                    "phoneNumber": "0912345678",
                    "isMale": false,
                    "birthdate": "2003-04-14",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000003",
                    "fullAddress": "104 Lê Lợi, Phường Bến Nghé, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bến Nghé",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.8142,
                    "longitude": 106.6938,
                    "isDefault": true
                },
                "bookingTime": "2025-10-08T08:30:00",
                "note": "Lau kính cửa sổ và ban công",
                "totalAmount": 250000.00,
                "formattedTotalAmount": "250,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000010-0000-0000-0000-000000000001",
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
                        "pricePerUnit": 250000.00,
                        "formattedPricePerUnit": "250,000đ",
                        "subTotal": 250000.00,
                        "formattedSubTotal": "250,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:50"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0011-0000-0000-0000-000000000001",
                "bookingCode": "HKS000011",
                "customerId": "c1000001-0000-0000-0000-000000000002",
                "customerName": "Mary Jones",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000002",
                    "fullName": "Mary Jones",
                    "avatar": "https://picsum.photos/200",
                    "email": "mary.jones@example.com",
                    "phoneNumber": "0909876543",
                    "isMale": false,
                    "birthdate": "2003-01-19",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000002",
                    "fullAddress": "456 Lê Lợi, Phường Bến Thành, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bến Thành",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7769,
                    "longitude": 106.7009,
                    "isDefault": true
                },
                "bookingTime": "2025-10-08T13:00:00",
                "note": "Dọn dẹp và sắp xếp tủ quần áo",
                "totalAmount": 350000.00,
                "formattedTotalAmount": "350,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000011-0000-0000-0000-000000000001",
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
                        "pricePerUnit": 350000.00,
                        "formattedPricePerUnit": "350,000đ",
                        "subTotal": 350000.00,
                        "formattedSubTotal": "350,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:50"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0012-0000-0000-0000-000000000001",
                "bookingCode": "HKS000012",
                "customerId": "c1000001-0000-0000-0000-000000000001",
                "customerName": "John Doe",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000001",
                    "fullName": "John Doe",
                    "avatar": "https://picsum.photos/200",
                    "email": "john.doe@example.com",
                    "phoneNumber": "0901234567",
                    "isMale": true,
                    "birthdate": "2003-09-10",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000004",
                    "fullAddress": "789 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh",
                    "ward": "Phường Chợ Quán",
                    "city": "TP. Hồ Chí Minh",
                    "latitude": 10.7594,
                    "longitude": 106.6822,
                    "isDefault": false
                },
                "bookingTime": "2025-10-09T11:00:00",
                "note": "Vệ sinh máy lạnh và quạt trần",
                "totalAmount": 550000.00,
                "formattedTotalAmount": "550,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000012-0000-0000-0000-000000000001",
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
                        "pricePerUnit": 550000.00,
                        "formattedPricePerUnit": "550,000đ",
                        "subTotal": 550000.00,
                        "formattedSubTotal": "550,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:50"
            }
        }
    ],
    "totalPages": 1,
    "totalItems": 3,
    "currentPage": 0
}
```
- Sắp xếp theo bookingTime ASC khi có fromDate

---

## Test Case 3: No Verified Awaiting Employee Bookings

**Request**:
```http
GET /api/v1/employee/bookings/verified-awaiting-employee?fromDate=2026-01-01T00:00:00&page=0&size=10
Authorization: Bearer {employee_token}
```

**Notes**:
- Lọc từ ngày 01/01/2026 (tương lai xa)
- Không có booking nào thỏa mãn điều kiện

**Expected Response (200 OK)**:
```json
{
    "success": true,
    "data": [],
    "currentPage": 0,
    "totalItems": 0,
    "totalPages": 0
}
```

---

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| fromDate | datetime | No | null | Lọc bookings có bookingTime >= fromDate (ISO 8601: yyyy-MM-dd'T'HH:mm:ss) |
| page | integer | No | 0 | Số trang (bắt đầu từ 0) |
| size | integer | No | 10 | Số lượng items mỗi trang (max: 100) |

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Trạng thái thành công |
| data | array | Danh sách bookings đã verified đang chờ employee |
| currentPage | integer | Trang hiện tại |
| totalItems | long | Tổng số bookings |
| totalPages | integer | Tổng số trang |

---

## Booking Filtering Rules

**Điều kiện để booking xuất hiện trong kết quả**:
1. ✅ `isVerified = true` (đã được admin xác minh)
2. ✅ `status = AWAITING_EMPLOYEE` (đang chờ phân công employee)
3. ✅ Nếu có `fromDate`: `bookingTime >= fromDate`

**Sorting**:
- Không có `fromDate`: Sắp xếp theo `createdAt DESC` (booking mới tạo nhất trước)
- Có `fromDate`: Sắp xếp theo `bookingTime ASC` (booking sớm nhất trước)

---

## Error Cases

### 1. Unauthorized - No Token
**Request**:
```http
GET /api/v1/employee/bookings/verified-awaiting-employee
```

**Expected Response (403 Forbidden)**:
```json
{
    "success": false,
    "message": "Access denied"
}
```

### 2. Forbidden - Customer Token Used
**Request**:
```http
GET /api/v1/employee/bookings/verified-awaiting-employee
Authorization: Bearer {customer_token}
```

**Expected Response (403 Forbidden)**:
```json
{
    "success": false,
    "message": "Access denied. Employee or Admin role required."
}
```

### 3. Invalid Date Format
**Request**:
```http
GET /api/v1/employee/bookings/verified-awaiting-employee?fromDate=invalid-date
Authorization: Bearer {employee_token}
```

**Expected Response (400 Bad Request)**:
```json
{
    "success": false,
    "message": "Invalid date format. Use ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss"
}
```

---

## Notes

- **Purpose**: Employee và Admin xem các booking đã verified cần được phân công
- **Use Case**: 
  - Employee tìm booking để nhận việc
  - Admin theo dõi booking chưa được phân công
- **Date Filter**: Hữu ích để lọc booking trong tương lai hoặc từ một ngày cụ thể
- **Sorting Strategy**:
  - Không filter: Hiển thị booking mới tạo trước (có thể urgent)
  - Có filter: Hiển thị booking sắp diễn ra trước (theo timeline)
- **No Assignments**: Tất cả bookings trong response đều chưa có employee nào được phân công
- **Verified Only**: Chỉ admin mới có thể verify booking, nên tất cả booking trong response đã qua kiểm duyệt

---

## Related Endpoints

- `GET /api/v1/employee/bookings/{employeeId}` - Lấy bookings đã được phân công cho employee
- `GET /api/v1/employee/bookings/details/{bookingId}` - Lấy chi tiết một booking
- `POST /api/v1/admin/bookings/{bookingId}/verify` - Admin verify booking (tạo AWAITING_EMPLOYEE status)
