# API Test Cases - Get Customer Bookings with Date Filter

## Endpoint Information

- **URL**: `GET /api/v1/customer/bookings/customer/{customerId}`
- **Authentication**: Required (ROLE_CUSTOMER, ROLE_ADMIN)
- **Authorization**: Customer (own bookings) and Admin (any customer)
- **Description**: Lấy lịch sử booking của customer với khả năng lọc theo ngày

---

## Test Case 1: Customer Gets All Their Bookings

**Request**:
```http
GET /api/v1/customer/bookings/customer/c1000001-0000-0000-0000-000000000001?page=0&size=10
Authorization: Bearer {customer_token_john_doe}
```

**Expected Response (200 OK)**:
```json
{
    "content": [
        {
            "bookingId": "b0000001-0000-0000-0000-000000000001",
            "bookingCode": "BK000001",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000001",
                "fullAddress": "123 Đường Nguyễn Văn Linh, Phường Tân Phú",
                "ward": "Phường Tân Phú",
                "city": "Quận 7",
                "latitude": 10.7333,
                "longitude": 106.7181
            },
            "bookingTime": "2025-08-20T09:00:00",
            "note": "Nhà có trẻ nhỏ, vui lòng lau dọn kỹ khu vực phòng khách.",
            "totalAmount": "80.000 ₫",
            "status": "COMPLETED",
            "promotion": {
                "promotionId": "promo001",
                "promoCode": "GIAM20K",
                "description": "Giảm 20.000đ cho đơn hàng đầu tiên",
                "discountType": "FIXED_AMOUNT",
                "discountValue": 20000.0,
                "maxDiscountAmount": 20000.00
            },
            "payment": {
                "id": "pay00001-0000-0000-0000-000000000001",
                "amount": 80000.00,
                "paymentMethodName": "Tiền mặt",
                "paymentStatus": "PAID",
                "transactionCode": "TXN-20250820-001",
                "createdAt": "2025-08-20T13:00:00",
                "paidAt": "2025-08-20T13:05:00"
            },
            "title": null,
            "imageUrl": null,
            "isVerified": true,
            "assignedEmployees": [
                {
                    "employeeId": "e1000001-0000-0000-0000-000000000002",
                    "fullName": "Bob Wilson",
                    "email": "bob.wilson@examplefieldset.com",
                    "phoneNumber": "0923456789",
                    "avatar": "https://picsum.photos/200",
                    "rating": null,
                    "employeeStatus": "ACTIVE"
                }
            ],
            "services": [
                {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Dịch vụ vệ sinh tổng thể toàn bộ ngôi nhà",
                    "basePrice": 100000.00,
                    "unit": "lần",
                    "estimatedDurationHours": 4.0,
                    "iconUrl": "https://example.com/icons/deep-cleaning.png",
                    "categoryName": "Vệ sinh",
                    "isActive": true
                }
            ]
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
    "totalElements": 1,
    "totalPages": 1,
    "last": true,
    "size": 10,
    "number": 0,
    "first": true,
    "numberOfElements": 1,
    "empty": false
}
```

**Notes**:
- Trả về tất cả bookings của customer
- Sắp xếp theo `createdAt DESC` (mới nhất trước)
- Bao gồm thông tin đầy đủ: address, payment, promotion, employees, services

---

## Test Case 2: Customer Gets Bookings From Specific Date

**Request**:
```http
GET /api/v1/customer/bookings/customer/c1000001-0000-0000-0000-000000000004?fromDate=2025-11-02T00:00:00&page=0&size=10
Authorization: Bearer {customer_token_nguyen_van_an}
```

**Notes**:
- Customer: Nguyễn Văn An (c1000001-0000-0000-0000-000000000004)
- Lọc bookings có `bookingTime >= 2025-11-02T00:00:00`

**Expected Response (200 OK)**:
```json
{
    "content": [
        {
            "bookingId": "b0000001-0000-0000-0000-000000000010",
            "bookingCode": "BK000010",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000009",
                "fullAddress": "45 Nguyễn Huệ, Phường Bến Nghé, Thành phố Hồ Chí Minh",
                "ward": "Phường Bến Nghé",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7743,
                "longitude": 106.7043,
                "isDefault": true
            },
            "bookingTime": "2025-11-05T10:00",
            "note": "Vệ sinh tổng quát căn hộ",
            "formattedTotalAmount": "500,000đ",
            "status": "PENDING",
            "promotion": null,
            "payment": null,
            "title": null,
            "imageUrl": null,
            "isVerified": false,
            "assignedEmployees": [],
            "services": [
                {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                    "basePrice": 100000.00,
                    "unit": "Gói",
                    "estimatedDurationHours": 2.0,
                    "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                    "categoryName": "Dọn dẹp nhà",
                    "isActive": true
                }
            ]
        }
    ],
    "pageable": {
        "pageNumber": 0,
        "pageSize": 10,
        "sort": {
            "sorted": true,
            "unsorted": false,
            "empty": false
        },
        "offset": 0,
        "unpaged": false,
        "paged": true
    },
    "last": true,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "numberOfElements": 1,
    "size": 10,
    "number": 0,
    "sort": {
        "sorted": true,
        "unsorted": false,
        "empty": false
    },
    "empty": false
}
```

---

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customerId | string | Yes | - | ID của customer (path parameter) |
| fromDate | datetime | No | null | Lọc bookings có bookingTime >= fromDate (ISO 8601: yyyy-MM-dd'T'HH:mm:ss) |
| page | integer | No | 0 | Số trang (bắt đầu từ 0) |
| size | integer | No | 10 | Số lượng items mỗi trang (max: 100) |
| sort | string[] | No | createdAt,desc | Sắp xếp (property,direction) |

---

## Error Cases

### 1. Customer Not Found
**Request**:
```http
GET /api/v1/customer/bookings/customer/invalid-customer-id?page=0&size=10
Authorization: Bearer {customer_token}
```

**Expected Response (200 OK - Empty Page)**:
```json
{
    "content": [],
    "totalElements": 0,
    "totalPages": 0,
    "empty": true
}
```

### 2. Unauthorized - No Token
**Request**:
```http
GET /api/v1/customer/bookings/customer/c1000001-0000-0000-0000-000000000001
```

**Expected Response (403 Forbidden)**:
```json
{
    "success": false,
    "message": "Access denied"
}
```

### 3. Invalid Date Format
**Request**:
```http
GET /api/v1/customer/bookings/customer/c1000001-0000-0000-0000-000000000001?fromDate=2025-11-01
Authorization: Bearer {customer_token}
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

- **Date Filter**: Parameter `fromDate` là optional, nếu không truyền sẽ lấy tất cả bookings
- **Date Comparison**: Sử dụng `bookingTime >= fromDate` (lớn hơn hoặc bằng)
- **Sorting**: Giữ nguyên sort parameter từ request, default là `createdAt,desc`
- **Empty Customer**: Nếu customer không có booking nào (hoặc không tồn tại), trả về empty page
- **Authorization**: 
  - Customer chỉ xem được bookings của chính mình
  - Admin có thể xem bookings của bất kỳ customer nào
- **Complete Information**: Response bao gồm tất cả thông tin: address, payment, promotion, employees, services
- **Status Tracking**: Customer có thể theo dõi trạng thái từ PENDING → CONFIRMED → IN_PROGRESS → COMPLETED

---

# Admin API Test Cases - Get Bookings with Date Filter

## Endpoint 1: Get All Bookings (Admin)

### Endpoint Information

- **URL**: `GET /api/v1/admin/bookings`
- **Authentication**: Required (ROLE_ADMIN)
- **Description**: Admin lấy tất cả bookings với khả năng lọc theo ngày, sắp xếp theo bookingTime giảm dần

---

### Test Case 1.1: Admin Gets All Bookings Without Filter

**Request**:
```http
GET /api/v1/admin/bookings?page=0&size=10
Authorization: Bearer {admin_token}
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
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000009",
                "fullAddress": "123 Đường Lê Văn Việt, Phường Tăng Nhơn Phú A",
                "ward": "Phường Tăng Nhơn Phú A",
                "city": "Thành phố Thủ Đức",
                "latitude": 10.8506,
                "longitude": 106.7629
            },
            "bookingTime": "2025-11-05T10:00:00",
            "note": "Vệ sinh tổng quát căn hộ",
            "totalAmount": "500.000 ₫",
            "status": "PENDING",
            "promotion": null,
            "payment": null,
            "title": null,
            "imageUrl": null,
            "isVerified": false,
            "assignedEmployees": [],
            "services": [
                {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Dịch vụ vệ sinh tổng thể toàn bộ ngôi nhà",
                    "basePrice": 500000.00,
                    "unit": "lần",
                    "estimatedDurationHours": 4.0,
                    "iconUrl": "https://example.com/icons/deep-cleaning.png",
                    "categoryName": "Vệ sinh",
                    "isActive": true
                }
            ]
        },
        {
            "bookingId": "b0000001-0000-0000-0000-000000000003",
            "bookingCode": "BK000003",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000009",
                "fullAddress": "123 Đường Lê Văn Việt, Phường Tăng Nhơn Phú A",
                "ward": "Phường Tăng Nhơn Phú A",
                "city": "Thành phố Thủ Đức",
                "latitude": 10.8506,
                "longitude": 106.7629
            },
            "bookingTime": "2025-11-01T08:00:00",
            "note": "Cần vệ sinh tổng quát căn hộ 2 phòng ngủ.",
            "totalAmount": "500.000 ₫",
            "status": "PENDING",
            "promotion": null,
            "payment": null,
            "title": null,
            "imageUrl": null,
            "isVerified": false,
            "assignedEmployees": [],
            "services": [
                {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Dịch vụ vệ sinh tổng thể toàn bộ ngôi nhà",
                    "basePrice": 500000.00,
                    "unit": "lần",
                    "estimatedDurationHours": 4.0,
                    "iconUrl": "https://example.com/icons/deep-cleaning.png",
                    "categoryName": "Vệ sinh",
                    "isActive": true
                }
            ]
        },
        {
            "bookingId": "b0000001-0000-0000-0000-000000000001",
            "bookingCode": "BK000001",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000001",
                "fullAddress": "123 Đường Nguyễn Văn Linh, Phường Tân Phú",
                "ward": "Phường Tân Phú",
                "city": "Quận 7",
                "latitude": 10.7333,
                "longitude": 106.7181
            },
            "bookingTime": "2025-08-20T09:00:00",
            "note": "Nhà có trẻ nhỏ, vui lòng lau dọn kỹ khu vực phòng khách.",
            "totalAmount": "80.000 ₫",
            "status": "COMPLETED",
            "promotion": {
                "promotionId": "promo001",
                "promoCode": "GIAM20K",
                "description": "Giảm 20.000đ cho đơn hàng đầu tiên",
                "discountType": "FIXED_AMOUNT",
                "discountValue": 20000.0,
                "maxDiscountAmount": 20000.00
            },
            "payment": {
                "id": "pay00001-0000-0000-0000-000000000001",
                "amount": 80000.00,
                "paymentMethodName": "Tiền mặt",
                "paymentStatus": "PAID",
                "transactionCode": "TXN-20250820-001",
                "createdAt": "2025-08-20T13:00:00",
                "paidAt": "2025-08-20T13:05:00"
            },
            "title": null,
            "imageUrl": null,
            "isVerified": true,
            "assignedEmployees": [
                {
                    "employeeId": "e1000001-0000-0000-0000-000000000002",
                    "fullName": "Bob Wilson",
                    "email": "bob.wilson@examplefieldset.com",
                    "phoneNumber": "0923456789",
                    "avatar": "https://picsum.photos/200",
                    "rating": null,
                    "employeeStatus": "ACTIVE"
                }
            ],
            "services": [
                {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Dịch vụ vệ sinh tổng thể toàn bộ ngôi nhà",
                    "basePrice": 100000.00,
                    "unit": "lần",
                    "estimatedDurationHours": 4.0,
                    "iconUrl": "https://example.com/icons/deep-cleaning.png",
                    "categoryName": "Vệ sinh",
                    "isActive": true
                }
            ]
        }
    ],
    "currentPage": 0,
    "totalItems": 10,
    "totalPages": 1
}
```

**Notes**:
- Trả về tất cả bookings trong hệ thống
- Sắp xếp theo `bookingTime DESC` (mới nhất trước)
- Admin có thể xem bookings của tất cả customers

---

### Test Case 1.2: Admin Gets Bookings From Specific Date

**Request**:
```http
GET /api/v1/admin/bookings?fromDate=2025-11-10T00:00:00&page=0&size=10
Authorization: Bearer {admin_token}
```

**Expected Response (200 OK)**:
```json
{
    "success": true,
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000009",
                "bookingCode": "BK000009",
                "customerId": "c1000001-0000-0000-0000-000000000008",
                "customerName": "Hoàng Văn Em",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000008",
                    "fullName": "Hoàng Văn Em",
                    "avatar": "https://i.pravatar.cc/150?img=13",
                    "email": "hoangvanem@gmail.com",
                    "phoneNumber": "0943210987",
                    "isMale": true,
                    "birthdate": "1994-09-12",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000013",
                    "fullAddress": "89 Lý Thường Kiệt, Phường Nguyễn Cư Trinh, Thành phố Hồ Chí Minh",
                    "ward": "Phường Nguyễn Cư Trinh",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7993,
                    "longitude": 106.6554,
                    "isDefault": true
                },
                "bookingTime": "2025-11-10T14:00:00",
                "note": "Vệ sinh tổng quát lần 2",
                "totalAmount": 500000.00,
                "formattedTotalAmount": "500,000đ",
                "status": "CONFIRMED",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000009",
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
                        "pricePerUnit": 500000.00,
                        "formattedPricePerUnit": "500,000đ",
                        "subTotal": 500000.00,
                        "formattedSubTotal": "500,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "asgn0001-0000-0000-0000-000000000009",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000007",
                                    "fullName": "Hoàng Thị Phương",
                                    "email": "hoangthiphuong@gmail.com",
                                    "phoneNumber": "0843220987",
                                    "avatar": "https://i.pravatar.cc/150?img=28",
                                    "rating": null,
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Vệ sinh sofa",
                                        "Giặt thảm"
                                    ],
                                    "bio": "Chuyên vệ sinh sofa, thảm, rèm cửa bằng máy móc chuyên dụng."
                                },
                                "status": "ASSIGNED",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        }
    ],
    "totalPages": 1,
    "totalItems": 1,
    "currentPage": 0
}
```

**Notes**:
- Lọc bookings có `bookingTime >= 2025-11-10T00:00:00`

---

### Request Parameters (GET /api/v1/admin/bookings)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| fromDate | datetime | No | null | Lọc bookings có bookingTime >= fromDate (ISO 8601: yyyy-MM-dd'T'HH:mm:ss) |
| page | integer | No | 0 | Số trang (bắt đầu từ 0) |
| size | integer | No | 10 | Số lượng items mỗi trang (max: 100) |

---

## Endpoint 2: Get Unverified Bookings (Admin)

### Endpoint Information

- **URL**: `GET /api/v1/admin/bookings/unverified`
- **Authentication**: Required (ROLE_ADMIN)
- **Description**: Admin lấy danh sách bookings chưa được verify (posts) với khả năng lọc theo ngày

---

### Test Case 2.1: Admin Gets All Unverified Bookings

**Request**:
```http
GET /api/v1/admin/bookings/unverified?page=0&size=10
Authorization: Bearer {admin_token}
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
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000009",
                "fullAddress": "123 Đường Lê Văn Việt, Phường Tăng Nhơn Phú A",
                "ward": "Phường Tăng Nhơn Phú A",
                "city": "Thành phố Thủ Đức",
                "latitude": 10.8506,
                "longitude": 106.7629
            },
            "bookingTime": "2025-11-05T10:00:00",
            "note": "Vệ sinh tổng quát căn hộ",
            "totalAmount": "500.000 ₫",
            "status": "PENDING",
            "promotion": null,
            "payment": null,
            "title": null,
            "imageUrl": null,
            "isVerified": false,
            "assignedEmployees": [],
            "services": [
                {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Dịch vụ vệ sinh tổng thể toàn bộ ngôi nhà",
                    "basePrice": 500000.00,
                    "unit": "lần",
                    "estimatedDurationHours": 4.0,
                    "iconUrl": "https://example.com/icons/deep-cleaning.png",
                    "categoryName": "Vệ sinh",
                    "isActive": true
                }
            ]
        },
        {
            "bookingId": "b0000001-0000-0000-0000-000000000003",
            "bookingCode": "BK000003",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000009",
                "fullAddress": "123 Đường Lê Văn Việt, Phường Tăng Nhơn Phú A",
                "ward": "Phường Tăng Nhơn Phú A",
                "city": "Thành phố Thủ Đức",
                "latitude": 10.8506,
                "longitude": 106.7629
            },
            "bookingTime": "2025-11-01T08:00:00",
            "note": "Cần vệ sinh tổng quát căn hộ 2 phòng ngủ.",
            "totalAmount": "500.000 ₫",
            "status": "PENDING",
            "promotion": null,
            "payment": null,
            "title": null,
            "imageUrl": null,
            "isVerified": false,
            "assignedEmployees": [],
            "services": [
                {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Dịch vụ vệ sinh tổng thể toàn bộ ngôi nhà",
                    "basePrice": 500000.00,
                    "unit": "lần",
                    "estimatedDurationHours": 4.0,
                    "iconUrl": "https://example.com/icons/deep-cleaning.png",
                    "categoryName": "Vệ sinh",
                    "isActive": true
                }
            ]
        }
    ],
    "currentPage": 0,
    "totalItems": 2,
    "totalPages": 1
}
```

**Notes**:
- Chỉ trả về bookings có `isVerified = false`
- Sắp xếp theo `createdAt DESC` (mới nhất trước)
- Admin cần review và verify các bookings này

---

### Test Case 2.2: Admin Gets Unverified Bookings From Specific Date

**Request**:
```http
GET /api/v1/admin/bookings/unverified?fromDate=2025-11-06T00:00:00&page=0&size=10
Authorization: Bearer {admin_token}
```

**Expected Response (200 OK)**:
```json
{
    "success": true,
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000013",
                "bookingCode": "BK000013",
                "customerId": "c1000001-0000-0000-0000-000000000007",
                "customerName": "Phạm Thị Dung",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000007",
                    "fullName": "Phạm Thị Dung",
                    "avatar": "https://i.pravatar.cc/150?img=9",
                    "email": "phamthidung@gmail.com",
                    "phoneNumber": "0954321098",
                    "isMale": false,
                    "birthdate": "1996-05-30",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000012",
                    "fullAddress": "567 Cách Mạng Tháng 8, Phường Phạm Ngũ Lão, Thành phố Hồ Chí Minh",
                    "ward": "Phường Phạm Ngũ Lão",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7843,
                    "longitude": 106.6801,
                    "isDefault": true
                },
                "bookingTime": "2025-11-08T10:30:00",
                "note": "Vệ sinh máy lạnh 2 cái",
                "totalAmount": 100000.00,
                "formattedTotalAmount": "100,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000013",
                        "service": {
                            "serviceId": 4,
                            "name": "Vệ sinh máy lạnh",
                            "description": "Bảo trì, làm sạch dàn nóng và dàn lạnh, bơm gas nếu cần.",
                            "basePrice": 150000.00,
                            "unit": "Máy",
                            "estimatedDurationHours": 1.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600733/cooler_rnyppn.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 2,
                        "pricePerUnit": 50000.00,
                        "formattedPricePerUnit": "50,000đ",
                        "subTotal": 100000.00,
                        "formattedSubTotal": "100,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "1 giờ",
                        "formattedDuration": "1 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000011",
                "bookingCode": "BK000011",
                "customerId": "c1000001-0000-0000-0000-000000000005",
                "customerName": "Trần Thị Bích",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000005",
                    "fullName": "Trần Thị Bích",
                    "avatar": "https://i.pravatar.cc/150?img=5",
                    "email": "tranthibich@gmail.com",
                    "phoneNumber": "0976543210",
                    "isMale": false,
                    "birthdate": "1998-07-22",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000010",
                    "fullAddress": "128 Trần Hưng Đạo, Phường Cầu Kho, Thành phố Hồ Chí Minh",
                    "ward": "Phường Cầu Kho",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7657,
                    "longitude": 106.6921,
                    "isDefault": true
                },
                "bookingTime": "2025-11-06T14:00:00",
                "note": "Giặt ủi áo dài cao cấp",
                "totalAmount": 150000.00,
                "formattedTotalAmount": "150,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000011",
                        "service": {
                            "serviceId": 6,
                            "name": "Giặt hấp cao cấp",
                            "description": "Giặt khô cho các loại vải cao cấp như vest, áo dài, lụa.",
                            "basePrice": 120000.00,
                            "unit": "Bộ",
                            "estimatedDurationHours": 48.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601414/vest_2_kfigzg.png",
                            "categoryName": "Giặt ủi",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 150000.00,
                        "formattedPricePerUnit": "150,000đ",
                        "subTotal": 150000.00,
                        "formattedSubTotal": "150,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "48 giờ",
                        "formattedDuration": "48 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
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
                    "fullAddress": "45 Nguyễn Huệ, Phường Bến Nghé, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bến Nghé",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7743,
                    "longitude": 106.7043,
                    "isDefault": true
                },
                "bookingTime": "2025-11-05T10:00:00",
                "note": "Vệ sinh tổng quát căn hộ",
                "totalAmount": 500000.00,
                "formattedTotalAmount": "500,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000010",
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
                        "pricePerUnit": 500000.00,
                        "formattedPricePerUnit": "500,000đ",
                        "subTotal": 500000.00,
                        "formattedSubTotal": "500,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000014",
                "bookingCode": "BK000014",
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
                    "addressId": "adrs0001-0000-0000-0000-000000000001",
                    "fullAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
                    "ward": "Phường Tây Thạnh",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7943,
                    "longitude": 106.6256,
                    "isDefault": true
                },
                "bookingTime": "2025-11-06T10:00:00",
                "note": "Vệ sinh nhà cửa định kỳ",
                "totalAmount": 450000.00,
                "formattedTotalAmount": "450,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000014",
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
                        "pricePerUnit": 450000.00,
                        "formattedPricePerUnit": "450,000đ",
                        "subTotal": 450000.00,
                        "formattedSubTotal": "450,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000007",
                "bookingCode": "BK000007",
                "customerId": "c1000001-0000-0000-0000-000000000008",
                "customerName": "Hoàng Văn Em",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000008",
                    "fullName": "Hoàng Văn Em",
                    "avatar": "https://i.pravatar.cc/150?img=13",
                    "email": "hoangvanem@gmail.com",
                    "phoneNumber": "0943210987",
                    "isMale": true,
                    "birthdate": "1994-09-12",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000013",
                    "fullAddress": "89 Lý Thường Kiệt, Phường Nguyễn Cư Trinh, Thành phố Hồ Chí Minh",
                    "ward": "Phường Nguyễn Cư Trinh",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7993,
                    "longitude": 106.6554,
                    "isDefault": true
                },
                "bookingTime": "2025-11-05T11:00:00",
                "note": "Nấu ăn cho gia đình 6 người, 2 bữa.",
                "totalAmount": 330000.00,
                "formattedTotalAmount": "330,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000007",
                        "service": {
                            "serviceId": 7,
                            "name": "Nấu ăn gia đình",
                            "description": "Đi chợ (chi phí thực phẩm tính riêng) và chuẩn bị bữa ăn cho gia đình theo thực đơn yêu cầu.",
                            "basePrice": 60000.00,
                            "unit": "Giờ",
                            "estimatedDurationHours": 2.5,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601546/pan_ysmoql.png",
                            "categoryName": "Việc nhà khác",
                            "isActive": true
                        },
                        "quantity": 4,
                        "pricePerUnit": 350000.00,
                        "formattedPricePerUnit": "350,000đ",
                        "subTotal": 350000.00,
                        "formattedSubTotal": "350,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ 30 phút",
                        "formattedDuration": "2 giờ 30 phút"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:50"
            }
        }
    ],
    "totalPages": 1,
    "totalItems": 5,
    "currentPage": 0
}
```

**Notes**:
- Lọc unverified bookings có `bookingTime >= 2025-11-06T00:00:00`

---

### Test Case 2.3: Admin Gets Unverified Bookings - No Results

**Request**:
```http
GET /api/v1/admin/bookings/unverified?fromDate=2025-12-01T00:00:00&page=0&size=10
Authorization: Bearer {admin_token}
```

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

**Notes**:
- Không có unverified booking nào có bookingTime >= 2025-12-01
- Trả về empty array

---

### Request Parameters (GET /api/v1/admin/bookings/unverified)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| fromDate | datetime | No | null | Lọc bookings có bookingTime >= fromDate (ISO 8601: yyyy-MM-dd'T'HH:mm:ss) |
| page | integer | No | 0 | Số trang (bắt đầu từ 0) |
| size | integer | No | 10 | Số lượng items mỗi trang (max: 100) |

---

## Error Cases (Admin Endpoints)

### 1. Unauthorized - Not Admin Role
**Request**:
```http
GET /api/v1/admin/bookings?page=0&size=10
Authorization: Bearer {customer_token}
```

**Expected Response (403 Forbidden)**:
```json
{
    "success": false,
    "message": "Access denied. Admin role required."
}
```

### 2. Invalid Date Format
**Request**:
```http
GET /api/v1/admin/bookings?fromDate=2025-11-01
Authorization: Bearer {admin_token}
```

**Expected Response (400 Bad Request)**:
```json
{
    "success": false,
    "message": "Invalid date format. Use ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss"
}
```

### 3. Invalid Pagination Parameters
**Request**:
```http
GET /api/v1/admin/bookings?page=-1&size=0
Authorization: Bearer {admin_token}
```

**Expected Response (200 OK - Auto-corrected)**:
```json
{
    "success": true,
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000009",
                "bookingCode": "BK000009",
                "customerId": "c1000001-0000-0000-0000-000000000008",
                "customerName": "Hoàng Văn Em",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000008",
                    "fullName": "Hoàng Văn Em",
                    "avatar": "https://i.pravatar.cc/150?img=13",
                    "email": "hoangvanem@gmail.com",
                    "phoneNumber": "0943210987",
                    "isMale": true,
                    "birthdate": "1994-09-12",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000013",
                    "fullAddress": "89 Lý Thường Kiệt, Phường Nguyễn Cư Trinh, Thành phố Hồ Chí Minh",
                    "ward": "Phường Nguyễn Cư Trinh",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7993,
                    "longitude": 106.6554,
                    "isDefault": true
                },
                "bookingTime": "2025-11-10T14:00:00",
                "note": "Vệ sinh tổng quát lần 2",
                "totalAmount": 500000.00,
                "formattedTotalAmount": "500,000đ",
                "status": "CONFIRMED",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000009",
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
                        "pricePerUnit": 500000.00,
                        "formattedPricePerUnit": "500,000đ",
                        "subTotal": 500000.00,
                        "formattedSubTotal": "500,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "asgn0001-0000-0000-0000-000000000009",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000007",
                                    "fullName": "Hoàng Thị Phương",
                                    "email": "hoangthiphuong@gmail.com",
                                    "phoneNumber": "0843220987",
                                    "avatar": "https://i.pravatar.cc/150?img=28",
                                    "rating": null,
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Vệ sinh sofa",
                                        "Giặt thảm"
                                    ],
                                    "bio": "Chuyên vệ sinh sofa, thảm, rèm cửa bằng máy móc chuyên dụng."
                                },
                                "status": "ASSIGNED",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000013",
                "bookingCode": "BK000013",
                "customerId": "c1000001-0000-0000-0000-000000000007",
                "customerName": "Phạm Thị Dung",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000007",
                    "fullName": "Phạm Thị Dung",
                    "avatar": "https://i.pravatar.cc/150?img=9",
                    "email": "phamthidung@gmail.com",
                    "phoneNumber": "0954321098",
                    "isMale": false,
                    "birthdate": "1996-05-30",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000012",
                    "fullAddress": "567 Cách Mạng Tháng 8, Phường Phạm Ngũ Lão, Thành phố Hồ Chí Minh",
                    "ward": "Phường Phạm Ngũ Lão",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7843,
                    "longitude": 106.6801,
                    "isDefault": true
                },
                "bookingTime": "2025-11-08T10:30:00",
                "note": "Vệ sinh máy lạnh 2 cái",
                "totalAmount": 100000.00,
                "formattedTotalAmount": "100,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000013",
                        "service": {
                            "serviceId": 4,
                            "name": "Vệ sinh máy lạnh",
                            "description": "Bảo trì, làm sạch dàn nóng và dàn lạnh, bơm gas nếu cần.",
                            "basePrice": 150000.00,
                            "unit": "Máy",
                            "estimatedDurationHours": 1.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600733/cooler_rnyppn.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 2,
                        "pricePerUnit": 50000.00,
                        "formattedPricePerUnit": "50,000đ",
                        "subTotal": 100000.00,
                        "formattedSubTotal": "100,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "1 giờ",
                        "formattedDuration": "1 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000012",
                "bookingCode": "BK000012",
                "customerId": "c1000001-0000-0000-0000-000000000006",
                "customerName": "Lê Văn Cường",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000006",
                    "fullName": "Lê Văn Cường",
                    "avatar": "https://i.pravatar.cc/150?img=12",
                    "email": "levancuong@gmail.com",
                    "phoneNumber": "0965432109",
                    "isMale": true,
                    "birthdate": "1992-11-08",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000011",
                    "fullAddress": "234 Võ Văn Tần, Phường Võ Thị Sáu, Thành phố Hồ Chí Minh",
                    "ward": "Phường Võ Thị Sáu",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7788,
                    "longitude": 106.6897,
                    "isDefault": true
                },
                "bookingTime": "2025-11-07T09:00:00",
                "note": "Vệ sinh sofa da chuyên dụng",
                "totalAmount": 200000.00,
                "formattedTotalAmount": "200,000đ",
                "status": "CONFIRMED",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000012",
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
                        "pricePerUnit": 200000.00,
                        "formattedPricePerUnit": "200,000đ",
                        "subTotal": 200000.00,
                        "formattedSubTotal": "200,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "3 giờ",
                        "formattedDuration": "3 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000015",
                "bookingCode": "BK000015",
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
                "bookingTime": "2025-11-07T09:00:00",
                "note": "Giặt ủi quần áo công sở",
                "totalAmount": 200000.00,
                "formattedTotalAmount": "200,000đ",
                "status": "CONFIRMED",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000015",
                        "service": {
                            "serviceId": 6,
                            "name": "Giặt hấp cao cấp",
                            "description": "Giặt khô cho các loại vải cao cấp như vest, áo dài, lụa.",
                            "basePrice": 120000.00,
                            "unit": "Bộ",
                            "estimatedDurationHours": 48.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601414/vest_2_kfigzg.png",
                            "categoryName": "Giặt ủi",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 200000.00,
                        "formattedPricePerUnit": "200,000đ",
                        "subTotal": 200000.00,
                        "formattedSubTotal": "200,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "48 giờ",
                        "formattedDuration": "48 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000011",
                "bookingCode": "BK000011",
                "customerId": "c1000001-0000-0000-0000-000000000005",
                "customerName": "Trần Thị Bích",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000005",
                    "fullName": "Trần Thị Bích",
                    "avatar": "https://i.pravatar.cc/150?img=5",
                    "email": "tranthibich@gmail.com",
                    "phoneNumber": "0976543210",
                    "isMale": false,
                    "birthdate": "1998-07-22",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000010",
                    "fullAddress": "128 Trần Hưng Đạo, Phường Cầu Kho, Thành phố Hồ Chí Minh",
                    "ward": "Phường Cầu Kho",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7657,
                    "longitude": 106.6921,
                    "isDefault": true
                },
                "bookingTime": "2025-11-06T14:00:00",
                "note": "Giặt ủi áo dài cao cấp",
                "totalAmount": 150000.00,
                "formattedTotalAmount": "150,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000011",
                        "service": {
                            "serviceId": 6,
                            "name": "Giặt hấp cao cấp",
                            "description": "Giặt khô cho các loại vải cao cấp như vest, áo dài, lụa.",
                            "basePrice": 120000.00,
                            "unit": "Bộ",
                            "estimatedDurationHours": 48.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601414/vest_2_kfigzg.png",
                            "categoryName": "Giặt ủi",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 150000.00,
                        "formattedPricePerUnit": "150,000đ",
                        "subTotal": 150000.00,
                        "formattedSubTotal": "150,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "48 giờ",
                        "formattedDuration": "48 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000014",
                "bookingCode": "BK000014",
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
                    "addressId": "adrs0001-0000-0000-0000-000000000001",
                    "fullAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
                    "ward": "Phường Tây Thạnh",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7943,
                    "longitude": 106.6256,
                    "isDefault": true
                },
                "bookingTime": "2025-11-06T10:00:00",
                "note": "Vệ sinh nhà cửa định kỳ",
                "totalAmount": 450000.00,
                "formattedTotalAmount": "450,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000014",
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
                        "pricePerUnit": 450000.00,
                        "formattedPricePerUnit": "450,000đ",
                        "subTotal": 450000.00,
                        "formattedSubTotal": "450,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000007",
                "bookingCode": "BK000007",
                "customerId": "c1000001-0000-0000-0000-000000000008",
                "customerName": "Hoàng Văn Em",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000008",
                    "fullName": "Hoàng Văn Em",
                    "avatar": "https://i.pravatar.cc/150?img=13",
                    "email": "hoangvanem@gmail.com",
                    "phoneNumber": "0943210987",
                    "isMale": true,
                    "birthdate": "1994-09-12",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000013",
                    "fullAddress": "89 Lý Thường Kiệt, Phường Nguyễn Cư Trinh, Thành phố Hồ Chí Minh",
                    "ward": "Phường Nguyễn Cư Trinh",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7993,
                    "longitude": 106.6554,
                    "isDefault": true
                },
                "bookingTime": "2025-11-05T11:00:00",
                "note": "Nấu ăn cho gia đình 6 người, 2 bữa.",
                "totalAmount": 330000.00,
                "formattedTotalAmount": "330,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000007",
                        "service": {
                            "serviceId": 7,
                            "name": "Nấu ăn gia đình",
                            "description": "Đi chợ (chi phí thực phẩm tính riêng) và chuẩn bị bữa ăn cho gia đình theo thực đơn yêu cầu.",
                            "basePrice": 60000.00,
                            "unit": "Giờ",
                            "estimatedDurationHours": 2.5,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601546/pan_ysmoql.png",
                            "categoryName": "Việc nhà khác",
                            "isActive": true
                        },
                        "quantity": 4,
                        "pricePerUnit": 350000.00,
                        "formattedPricePerUnit": "350,000đ",
                        "subTotal": 350000.00,
                        "formattedSubTotal": "350,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ 30 phút",
                        "formattedDuration": "2 giờ 30 phút"
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
                    "fullAddress": "45 Nguyễn Huệ, Phường Bến Nghé, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bến Nghé",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7743,
                    "longitude": 106.7043,
                    "isDefault": true
                },
                "bookingTime": "2025-11-05T10:00:00",
                "note": "Vệ sinh tổng quát căn hộ",
                "totalAmount": 500000.00,
                "formattedTotalAmount": "500,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000010",
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
                        "pricePerUnit": 500000.00,
                        "formattedPricePerUnit": "500,000đ",
                        "subTotal": 500000.00,
                        "formattedSubTotal": "500,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:51"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000006",
                "bookingCode": "BK000006",
                "customerId": "c1000001-0000-0000-0000-000000000007",
                "customerName": "Phạm Thị Dung",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000007",
                    "fullName": "Phạm Thị Dung",
                    "avatar": "https://i.pravatar.cc/150?img=9",
                    "email": "phamthidung@gmail.com",
                    "phoneNumber": "0954321098",
                    "isMale": false,
                    "birthdate": "1996-05-30",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000012",
                    "fullAddress": "567 Cách Mạng Tháng 8, Phường Phạm Ngũ Lão, Thành phố Hồ Chí Minh",
                    "ward": "Phường Phạm Ngũ Lão",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7843,
                    "longitude": 106.6801,
                    "isDefault": true
                },
                "bookingTime": "2025-11-04T09:30:00",
                "note": "Vệ sinh 2 máy lạnh trong phòng.",
                "totalAmount": 50000.00,
                "formattedTotalAmount": "50,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000006",
                        "service": {
                            "serviceId": 4,
                            "name": "Vệ sinh máy lạnh",
                            "description": "Bảo trì, làm sạch dàn nóng và dàn lạnh, bơm gas nếu cần.",
                            "basePrice": 150000.00,
                            "unit": "Máy",
                            "estimatedDurationHours": 1.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600733/cooler_rnyppn.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 2,
                        "pricePerUnit": 25000.00,
                        "formattedPricePerUnit": "25,000đ",
                        "subTotal": 50000.00,
                        "formattedSubTotal": "50,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "1 giờ",
                        "formattedDuration": "1 giờ"
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
                "bookingId": "b0000001-0000-0000-0000-000000000005",
                "bookingCode": "BK000005",
                "customerId": "c1000001-0000-0000-0000-000000000006",
                "customerName": "Lê Văn Cường",
                "customer": {
                    "customerId": "c1000001-0000-0000-0000-000000000006",
                    "fullName": "Lê Văn Cường",
                    "avatar": "https://i.pravatar.cc/150?img=12",
                    "email": "levancuong@gmail.com",
                    "phoneNumber": "0965432109",
                    "isMale": true,
                    "birthdate": "1992-11-08",
                    "rating": null,
                    "vipLevel": null
                },
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000011",
                    "fullAddress": "234 Võ Văn Tần, Phường Võ Thị Sáu, Thành phố Hồ Chí Minh",
                    "ward": "Phường Võ Thị Sáu",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7788,
                    "longitude": 106.6897,
                    "isDefault": true
                },
                "bookingTime": "2025-11-03T14:00:00",
                "note": "Vệ sinh sofa 3 chỗ và 2 ghế đơn.",
                "totalAmount": 200000.00,
                "formattedTotalAmount": "200,000đ",
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000005",
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
                        "pricePerUnit": 80000.00,
                        "formattedPricePerUnit": "80,000đ",
                        "subTotal": 160000.00,
                        "formattedSubTotal": "160,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "3 giờ",
                        "formattedDuration": "3 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T09:20:50"
            }
        }
    ],
    "totalPages": 3,
    "totalItems": 26,
    "currentPage": 0
}
```

**Notes**:
- `page < 0` tự động điều chỉnh thành `page = 0`
- `size <= 0 || size > 100` tự động điều chỉnh thành `size = 10`

---

## Notes (Admin)

- **Admin Access**: Admin có quyền xem tất cả bookings của mọi customer
- **Date Filter**: Parameter `fromDate` là optional, filter theo `bookingTime >= fromDate`
- **Sorting**: 
  - `/admin/bookings`: Sắp xếp theo `bookingTime DESC`
  - `/admin/bookings/unverified`: Sắp xếp theo `createdAt DESC`
- **Auto Validation**: Pagination parameters được tự động validate và điều chỉnh
- **Complete Information**: Response bao gồm đầy đủ thông tin: customer, address, payment, promotion, employees, services
- **Verification Workflow**: 
  1. Customer tạo booking post
  2. Admin review qua `/admin/bookings/unverified`
  3. Admin approve/reject qua `/admin/bookings/{bookingId}/verify`