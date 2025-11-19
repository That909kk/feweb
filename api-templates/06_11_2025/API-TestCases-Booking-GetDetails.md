# API Test Cases - Get Booking Details

## Endpoint Information

### Customer Endpoint
- **URL**: `GET /api/v1/bookings/{bookingId}`
- **Authentication**: Required (ROLE_CUSTOMER, ROLE_ADMIN)
- **Authorization**: Customer and Admin

### Employee Endpoint
- **URL**: `GET /api/v1/employee/bookings/details/{bookingId}`
- **Authentication**: Required (ROLE_EMPLOYEE, ROLE_ADMIN)
- **Authorization**: Employee and Admin

### Admin Endpoint
- **URL**: `GET /api/v1/admin/bookings/{bookingId}`
- **Authentication**: Required (ROLE_ADMIN)
- **Authorization**: Admin only

---

## Test Cases - Customer Get Booking Details

### Test Case 1: Customer Gets COMPLETED Booking with Payment
**Request**:
```http
GET /api/v1/customer/bookings/b0000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token_john_doe}
```

**Expected Response (200 OK)**:
```json
{
    "success": true,
    "message": "Đặt lịch thành công",
    "data": {
        "bookingId": "b0000001-0000-0000-0000-000000000001",
        "bookingCode": "BK000001",
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
            "fullAddress": "123 Lê Trọng Tấn, Phường Thủ Dầu Một, Thành phố Hồ Chí Minh",
            "ward": "Phường Thủ Dầu Một",
            "city": "Thành phố Hồ Chí Minh",
            "latitude": 10.7943,
            "longitude": 106.6256,
            "isDefault": true
        },
        "bookingTime": "2025-08-20T09:00:00",
        "note": "Nhà có trẻ nhỏ, vui lòng lau dọn kỹ khu vực phòng khách.",
        "totalAmount": 480000.00,
        "formattedTotalAmount": "480,000đ",
        "status": "COMPLETED",
        "title": null,
        "imageUrls": [],
        "isPost": false,
        "isVerified": true,
        "adminComment": null,
        "promotion": {
            "promotionId": 1,
            "promoCode": "GIAM20K",
            "description": "Giảm giá 20,000đ cho mọi đơn hàng",
            "discountType": "FIXED_AMOUNT",
            "discountValue": 20000.00,
            "maxDiscountAmount": null
        },
        "bookingDetails": [
            {
                "bookingDetailId": "bd000001-0000-0000-0000-000000000001",
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
                        "assignmentId": "as000001-0000-0000-0000-000000000001",
                        "employee": {
                            "employeeId": "e1000001-0000-0000-0000-000000000002",
                            "fullName": "Bob Wilson",
                            "email": "bob.wilson@examplefieldset.com",
                            "phoneNumber": "0923456789",
                            "avatar": "https://picsum.photos/200",
                            "rating": null,
                            "employeeStatus": "AVAILABLE",
                            "skills": [
                                "Deep Cleaning",
                                "Laundry"
                            ],
                            "bio": "Chuyên gia giặt ủi và làm sạch sâu."
                        },
                        "status": "COMPLETED",
                        "checkInTime": "2025-08-20 09:00:00",
                        "checkOutTime": "2025-08-20 13:00:00",
                        "createdAt": null,
                        "updatedAt": null
                    }
                ],
                "duration": "2 giờ",
                "formattedDuration": "2 giờ"
            }
        ],
        "payment": {
            "paymentId": "pay00001-0000-0000-0000-000000000001",
            "amount": 480000.00,
            "paymentMethod": "Cổng thanh toán VNPAY",
            "paymentStatus": "PAID",
            "transactionCode": "VNP123456789",
            "createdAt": "2025-11-06 23:15:25",
            "paidAt": "2025-08-20 13:05:00"
        },
        "createdAt": "2025-11-06T23:15:25"
    }
}
```

---

## Test Cases - Employee Get Booking Details

### Test Case 2: Employee Gets Booking with CONFIRMED Status
**Request**:
```http
GET /api/v1/employee/bookings/details/b0000001-0000-0000-0000-000000000012
Authorization: Bearer {employee_token_le_van_nam}
```

**Expected Response (200 OK)**:
```json
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
            "fullAddress": "234 Võ Văn Tần, Phường Bến Cát, Thành phố Hồ Chí Minh",
            "ward": "Phường Bến Cát",
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
        "imageUrls": [],
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
        "createdAt": "2025-11-06T23:15:26"
    }
}
```

---

## Notes

- **Customer information is included in all responses** with full details (name, email, phone, avatar, etc.)
- **Address information** includes full address, ward, city, and coordinates
- **Booking details** include complete service information, pricing, and formatting
- **Assignments** show employee details when available
- **Payment information** is included for completed bookings with payment records
- **All endpoints require authentication** - appropriate role tokens must be provided
- **Customer endpoint** allows ROLE_CUSTOMER and ROLE_ADMIN
- **Employee endpoint** allows ROLE_EMPLOYEE and ROLE_ADMIN
- **Admin endpoint** allows ROLE_ADMIN only
- **Formatted amounts** use Vietnamese currency format (e.g., "500.000 ₫")
- **Date/time format** follows ISO 8601 (yyyy-MM-dd'T'HH:mm:ss)
