# API Test Cases - Employee Get Assigned Bookings

## Endpoint Information

- **URL**: `GET /api/v1/employee/bookings/{employeeId}`
- **Authentication**: Required (ROLE_EMPLOYEE, ROLE_ADMIN)
- **Authorization**: 
  - Employee chỉ có thể xem bookings của chính mình
  - Admin có thể xem bookings của bất kỳ employee nào
- **Description**: Lấy danh sách các booking mà employee có assignment, sắp xếp theo bookingTime tăng dần (sớm nhất trước)

---

## Test Case 1: Employee Gets Their Own Assigned Bookings Successfully

**Request**:
```http
GET /api/v1/employee/bookings/e1000001-0000-0000-0000-000000000001?page=0&size=10
Authorization: Bearer {employee_token_jane_smith}
```

**Notes**: 
- Token của Jane Smith (employeeId: e1000001-0000-0000-0000-000000000001)
- Employee đang request bookings của chính mình

**Expected Response (200 OK)**:
```json
{
    "totalPages": 1,
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000002",
                "bookingCode": "BK000002",
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
                "bookingTime": "2025-08-28T14:00:00",
                "note": "Vui lòng đến đúng giờ.",
                "totalAmount": 108000.00,
                "formattedTotalAmount": "108,000đ",
                "status": "CONFIRMED",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": {
                    "promotionId": 2,
                    "promoCode": "KHAITRUONG10",
                    "description": "Giảm 10% mừng khai trương",
                    "discountType": "PERCENTAGE",
                    "discountValue": 10.00,
                    "maxDiscountAmount": 50000.00
                },
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000002",
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
                        "quantity": 2,
                        "pricePerUnit": 60000.00,
                        "formattedPricePerUnit": "60,000đ",
                        "subTotal": 120000.00,
                        "formattedSubTotal": "120,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000002",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000001",
                                    "fullName": "Jane Smith",
                                    "email": "jane.smith@example.com",
                                    "phoneNumber": "0912345678",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": null,
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Cleaning",
                                        "Organizing"
                                    ],
                                    "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
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
                "payment": {
                    "paymentId": "pay00001-0000-0000-0000-000000000002",
                    "amount": 108000.00,
                    "paymentMethod": "Ví điện tử Momo",
                    "paymentStatus": "PENDING",
                    "transactionCode": null,
                    "createdAt": "2025-11-06 09:20:50",
                    "paidAt": null
                },
                "createdAt": "2025-11-06T09:20:50"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0007-0000-0000-0000-000000000001",
                "bookingCode": "HKS000007",
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
                    "addressId": "adrs0001-0000-0000-0000-000000000007",
                    "fullAddress": "432 Võ Văn Tần, Phường Bàn Cờ, TP. Hồ Chí Minh",
                    "ward": "Phường Bàn Cờ",
                    "city": "TP. Hồ Chí Minh",
                    "latitude": 10.7756,
                    "longitude": 106.6914,
                    "isDefault": false
                },
                "bookingTime": "2025-10-06T16:00:00",
                "note": "Dọn dẹp sau tiệc, nhiều rác cần dọn",
                "totalAmount": 500000.00,
                "formattedTotalAmount": "500,000đ",
                "status": "CONFIRMED",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000007-0000-0000-0000-000000000001",
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
                                "assignmentId": "assgn004-0000-0000-0000-000000000001",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000001",
                                    "fullName": "Jane Smith",
                                    "email": "jane.smith@example.com",
                                    "phoneNumber": "0912345678",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": null,
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Cleaning",
                                        "Organizing"
                                    ],
                                    "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
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
                "payment": {
                    "paymentId": "pay00004-0000-0000-0000-000000000001",
                    "amount": 500000.00,
                    "paymentMethod": null,
                    "paymentStatus": "PAID",
                    "transactionCode": "TXN20240926001",
                    "createdAt": "2025-11-06 09:20:50",
                    "paidAt": "2024-09-26 15:30:00"
                },
                "createdAt": "2025-11-06T09:20:50"
            }
        }
    ],
    "success": true,
    "currentPage": 0,
    "totalItems": 2
}
```

**Notes**:
- Response chỉ bao gồm các booking mà employee (Jane Smith - e1000001-0000-0000-0000-000000000001) có assignment
- Bookings được sắp xếp theo `bookingTime` tăng dần (booking sớm nhất hiển thị trước)
- Mỗi booking hiển thị đầy đủ thông tin customer, address, service details, và assignments
- Pagination được hỗ trợ với các tham số `page` và `size`

---

## Test Case 2: Employee Tries to Access Another Employee's Bookings (Forbidden)

**Request**:
```http
GET /api/v1/employee/bookings/e1000001-0000-0000-0000-000000000002?page=0&size=10
Authorization: Bearer {employee_token_jane_smith}
```

**Notes**:
- Token của Jane Smith (employeeId: e1000001-0000-0000-0000-000000000001)
- Đang cố truy cập bookings của Bob Wilson (employeeId: e1000001-0000-0000-0000-000000000002)

**Expected Response (403 Forbidden)**:
```json
{
    "success": false,
    "message": "Bạn không có quyền truy cập thông tin của nhân viên khác"
}
```

---

## Test Case 3: Admin Gets Any Employee's Assigned Bookings

**Request**:
```http
GET /api/v1/employee/bookings/e1000001-0000-0000-0000-000000000001?page=0&size=10
Authorization: Bearer {admin_token}
```

**Notes**:
- Token của Admin
- Admin có thể xem bookings của bất kỳ employee nào

**Expected Response (200 OK)**:
```json
{
    "totalPages": 1,
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000002",
                "bookingCode": "BK000002",
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
                "bookingTime": "2025-08-28T14:00:00",
                "note": "Vui lòng đến đúng giờ.",
                "totalAmount": 108000.00,
                "formattedTotalAmount": "108,000đ",
                "status": "CONFIRMED",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": {
                    "promotionId": 2,
                    "promoCode": "KHAITRUONG10",
                    "description": "Giảm 10% mừng khai trương",
                    "discountType": "PERCENTAGE",
                    "discountValue": 10.00,
                    "maxDiscountAmount": 50000.00
                },
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000002",
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
                        "quantity": 2,
                        "pricePerUnit": 60000.00,
                        "formattedPricePerUnit": "60,000đ",
                        "subTotal": 120000.00,
                        "formattedSubTotal": "120,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000002",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000001",
                                    "fullName": "Jane Smith",
                                    "email": "jane.smith@example.com",
                                    "phoneNumber": "0912345678",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": null,
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Cleaning",
                                        "Organizing"
                                    ],
                                    "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
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
                "payment": {
                    "paymentId": "pay00001-0000-0000-0000-000000000002",
                    "amount": 108000.00,
                    "paymentMethod": "Ví điện tử Momo",
                    "paymentStatus": "PENDING",
                    "transactionCode": null,
                    "createdAt": "2025-11-06 09:20:50",
                    "paidAt": null
                },
                "createdAt": "2025-11-06T09:20:50"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0007-0000-0000-0000-000000000001",
                "bookingCode": "HKS000007",
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
                    "addressId": "adrs0001-0000-0000-0000-000000000007",
                    "fullAddress": "432 Võ Văn Tần, Phường Bàn Cờ, TP. Hồ Chí Minh",
                    "ward": "Phường Bàn Cờ",
                    "city": "TP. Hồ Chí Minh",
                    "latitude": 10.7756,
                    "longitude": 106.6914,
                    "isDefault": false
                },
                "bookingTime": "2025-10-06T16:00:00",
                "note": "Dọn dẹp sau tiệc, nhiều rác cần dọn",
                "totalAmount": 500000.00,
                "formattedTotalAmount": "500,000đ",
                "status": "CONFIRMED",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000007-0000-0000-0000-000000000001",
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
                                "assignmentId": "assgn004-0000-0000-0000-000000000001",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000001",
                                    "fullName": "Jane Smith",
                                    "email": "jane.smith@example.com",
                                    "phoneNumber": "0912345678",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": null,
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Cleaning",
                                        "Organizing"
                                    ],
                                    "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
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
                "payment": {
                    "paymentId": "pay00004-0000-0000-0000-000000000001",
                    "amount": 500000.00,
                    "paymentMethod": null,
                    "paymentStatus": "PAID",
                    "transactionCode": "TXN20240926001",
                    "createdAt": "2025-11-06 09:20:50",
                    "paidAt": "2024-09-26 15:30:00"
                },
                "createdAt": "2025-11-06T09:20:50"
            }
        }
    ],
    "success": true,
    "currentPage": 0,
    "totalItems": 2
}
```

---

## Test Case 4: Employee with No Assignments

**Request**:
```http
GET /api/v1/employee/bookings/e1000001-0000-0000-0000-000000000006?page=0&size=10
Authorization: Bearer {employee_token_le_van_nam}
```

**Notes**:
- Token của Lê Văn Nam (employeeId: e1000001-0000-0000-0000-000000000006)
- Employee chưa có assignment nào

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
- Nếu employee chưa có assignment nào, trả về danh sách rỗng
- Không có lỗi, response vẫn thành công với `success: true`

---

## Test Case 5: Invalid Employee ID

**Request**:
```http
GET /api/v1/employee/bookings/invalid-employee-id?page=0&size=10
Authorization: Bearer {employee_token_jane_smith}
```

**Expected Response (400 Bad Request)**:
```json
{
    "success": false,
    "message": "Không tìm thấy nhân viên với ID: invalid-employee-id"
}
```

---

## Test Case 5: Invalid Employee ID

**Request**:
```http
GET /api/v1/employee/bookings/invalid-employee-id?page=0&size=10
Authorization: Bearer {employee_token_jane_smith}
```

**Expected Response (400 Bad Request)**:
```json
{
    "success": false,
    "message": "Không tìm thấy nhân viên với ID: invalid-employee-id"
}
```

---

## Test Case 6: Employee Gets Bookings From Specific Date

**Request**:
```http
GET /api/v1/employee/bookings/e1000001-0000-0000-0000-000000000001?fromDate=2025-08-28T00:00:00&page=0&size=10
Authorization: Bearer {employee_token_jane_smith}
```

**Notes**:
- Token của Jane Smith (employeeId: e1000001-0000-0000-0000-000000000001)
- Lọc bookings từ ngày 2025-08-28 trở đi
- Chỉ trả về bookings có bookingTime >= 2025-08-28T00:00:00

**Expected Response (200 OK)**:
```json
{
    "success": true,
    "data": [
        {
            "bookingId": "b0000001-0000-0000-0000-000000000002",
            "bookingCode": "BK000002",
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
                "fullAddress": "456 Đường Điện Biên Phủ, Phường Đa Kao",
                "ward": "Phường Đa Kao",
                "city": "Quận 1",
                "latitude": 10.7886,
                "longitude": 106.6992,
                "isDefault": true
            },
            "bookingTime": "2025-08-28T14:00:00",
            "note": "Vui lòng đến đúng giờ.",
            "totalAmount": 90000.00,
            "formattedTotalAmount": "90.000 ₫",
            "status": "CONFIRMED",
            "title": null,
            "imageUrls": [],
            "isVerified": true,
            "adminComment": null,
            "promotion": {
                "promotionId": "promo002",
                "promoCode": "KHAITRUONG10",
                "description": "Giảm 10% cho khách hàng mới",
                "discountType": "PERCENTAGE",
                "discountValue": 10.0,
                "maxDiscountAmount": 50000.00
            },
            "bookingDetails": [
                {
                    "id": "bd000001-0000-0000-0000-000000000002",
                    "service": {
                        "serviceId": 1,
                        "name": "Dọn dẹp theo giờ",
                        "description": "Dịch vụ dọn dẹp nhà cửa theo giờ",
                        "basePrice": 50000.00,
                        "unit": "giờ",
                        "estimatedDurationHours": 1.0,
                        "iconUrl": "https://example.com/icons/hourly-cleaning.png",
                        "categoryName": "Vệ sinh",
                        "isActive": true
                    },
                    "quantity": 2,
                    "pricePerUnit": 50000.00,
                    "formattedPricePerUnit": "50.000 ₫",
                    "subTotal": 100000.00,
                    "formattedSubTotal": "100.000 ₫",
                    "selectedChoices": [],
                    "assignments": [
                        {
                            "assignmentId": "as000001-0000-0000-0000-000000000002",
                            "employee": {
                                "employeeId": "e1000001-0000-0000-0000-000000000001",
                                "fullName": "Jane Smith",
                                "email": "jane.smith@example.com",
                                "phoneNumber": "0912345678",
                                "avatar": "https://picsum.photos/200",
                                "rating": null,
                                "employeeStatus": "ACTIVE",
                                "skills": ["Cleaning", "Organizing"],
                                "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
                            },
                            "status": "ASSIGNED",
                            "checkInTime": null,
                            "checkOutTime": null,
                            "createdAt": null,
                            "updatedAt": null
                        }
                    ],
                    "estimatedDuration": "1.0 giờ",
                    "formattedEstimatedDuration": "1.0 giờ"
                }
            ],
            "payment": null,
            "createdAt": "2025-08-28T13:00:00"
        }
    ],
    "currentPage": 0,
    "totalItems": 1,
    "totalPages": 1
}
```

**Notes**:
- Booking BK000001 (2025-08-20) bị loại bỏ vì bookingTime < fromDate
- Chỉ BK000002 (2025-08-28) được trả về

---

## Available Employees in Seed Data

### Employees with Assignments:
- **Jane Smith** (e1000001-0000-0000-0000-000000000001)
  - Email: jane.smith@example.com
  - Username: jane.smith
  - Có assignment ở BK000002 (2025-08-28T14:00:00)

- **Bob Wilson** (e1000001-0000-0000-0000-000000000002)
  - Email: bob.wilson@examplefieldset.com
  - Username: bob.wilson
  - Có assignment ở BK000001 (2025-08-20T09:00:00) - Status: COMPLETED

### Employees without Assignments (for testing):
- **Lê Văn Nam** (e1000001-0000-0000-0000-000000000006)
  - Email: levannnam@gmail.com
  - Username: levannnam
  - Chưa có assignment nào

- **Trần Văn Long** (e1000001-0000-0000-0000-000000000007)
  - Email: tranvanllong@gmail.com
  - Username: tranvanllong
  - Chưa có assignment nào

---

## Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| employeeId | string | Yes | - | ID của employee cần lấy bookings (path parameter) |
| fromDate | datetime | No | null | Lọc bookings từ thời điểm này trở đi (ISO 8601 format: yyyy-MM-dd'T'HH:mm:ss) |
| page | integer | No | 0 | Số trang (bắt đầu từ 0) |
| size | integer | No | 10 | Số lượng items mỗi trang (max: 100) |

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Trạng thái thành công của request |
| data | array | Danh sách bookings được phân công |
| currentPage | integer | Trang hiện tại |
| totalItems | long | Tổng số bookings |
| totalPages | integer | Tổng số trang |

---

## Error Cases

### 1. Unauthorized - No Token
**Request**:
```http
GET /api/v1/employee/bookings/e1000001-0000-0000-0000-000000000001
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
GET /api/v1/employee/bookings/e1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response (403 Forbidden)**:
```json
{
    "success": false,
    "message": "Access denied. Employee or Admin role required."
}
```

### 3. Forbidden - Employee Accessing Another Employee's Data
**Request**:
```http
GET /api/v1/employee/bookings/e1000001-0000-0000-0000-000000000002
Authorization: Bearer {employee_token_jane_smith}
```

**Notes**:
- Jane Smith (e1000001-0000-0000-0000-000000000001) trying to access Bob Wilson's (e1000001-0000-0000-0000-000000000002) bookings

**Expected Response (403 Forbidden)**:
```json
{
    "success": false,
    "message": "Bạn không có quyền truy cập thông tin của nhân viên khác"
}
```

### 4. Invalid Token
**Request**:
```http
GET /api/v1/employee/bookings/e1000001-0000-0000-0000-000000000001
Authorization: Bearer invalid_token
```

**Expected Response (401 Unauthorized)**:
```json
{
    "success": false,
    "message": "Invalid or expired token"
}
```

---

## Notes

- **Authentication required**: Chỉ ROLE_EMPLOYEE và ROLE_ADMIN mới có quyền truy cập
- **Authorization check**: 
  - Employee chỉ có thể xem bookings của chính mình (employeeId phải khớp với token)
  - Admin có thể xem bookings của bất kỳ employee nào
- **Employee ID validation**: Kiểm tra employeeId có tồn tại trong database
- **Sorting**: Bookings được sắp xếp theo `bookingTime` ASC (tăng dần) - booking sắp diễn ra sẽ hiển thị đầu tiên
- **Customer information**: Mỗi booking bao gồm đầy đủ thông tin customer (name, email, phone, avatar, etc.)
- **Pagination**: Hỗ trợ phân trang với `page` và `size` parameters
- **DISTINCT query**: Sử dụng DISTINCT để tránh trùng lặp khi employee có nhiều assignments trong cùng một booking
- **Assignment details**: Hiển thị đầy đủ thông tin assignments của employee trong mỗi booking

---

## Related Endpoints

- `GET /api/v1/employee/bookings/details/{bookingId}` - Lấy chi tiết một booking cụ thể
- `GET /api/v1/employee/bookings/verified-awaiting-employee` - Lấy danh sách bookings đã xác minh đang chờ employee
