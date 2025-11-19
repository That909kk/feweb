# API Test Cases - Get Verified Awaiting Employee Bookings (matchEmployeeZones Parameter)

## Endpoint Information

- **URL**: `GET /api/v1/employee/bookings/verified-awaiting-employee`
- **Authentication**: Required (ROLE_EMPLOYEE, ROLE_ADMIN)
- **Parameters**: 
  - `fromDate` (optional): LocalDateTime (ISO format)
  - `page` (optional, default: 0): int
  - `size` (optional, default: 10): int
  - `matchEmployeeZones` (optional, default: true): boolean - Lọc theo khu vực làm việc của employee

---

## Test Case 1: matchEmployeeZones = true (Lọc theo khu vực employee)

**Request**:
```http
GET /api/v1/employee/bookings/verified-awaiting-employee?page=0&size=10&matchEmployeeZones=true
Authorization: Bearer {employee_token}
```

**Expected Response (200 OK)**:
```json
{
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0024-0000-0000-0000-000000000001",
                "bookingCode": "HKSVA024",
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
                "bookingTime": "2025-11-12T09:00:00",
                "note": "Vệ sinh tổng quát nhà phố Tây Thạnh",
                "totalAmount": 450000.00,
                "formattedTotalAmount": "450,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": "Tổng vệ sinh nhà phố Tây Thạnh",
                "imageUrls": [
                    "https://res.cloudinary.com/demo/image/upload/v1731000011/booking/house_cleaning.jpg"
                ],
                "isPost": true,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bdva024-0000-0000-0000-000000000001",
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
                "createdAt": "2025-11-06T23:15:26"
            }
        }
    ],
    "success": true,
    "currentPage": 0,
    "totalItems": 1,
    "totalPages": 1
}
```

---

## Test Case 2: matchEmployeeZones = false (Không lọc theo khu vực)

**Request**:
```http
GET /api/v1/employee/bookings/verified-awaiting-employee?page=0&size=10&matchEmployeeZones=false
Authorization: Bearer {employee_token}
```

**Expected Response (200 OK)**:
```json
{
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0024-0000-0000-0000-000000000001",
                "bookingCode": "HKSVA024",
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
                "bookingTime": "2025-11-12T09:00:00",
                "note": "Vệ sinh tổng quát nhà phố Tây Thạnh",
                "totalAmount": 450000.00,
                "formattedTotalAmount": "450,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": "Tổng vệ sinh nhà phố Tây Thạnh",
                "imageUrls": [
                    "https://res.cloudinary.com/demo/image/upload/v1731000011/booking/house_cleaning.jpg"
                ],
                "isPost": true,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bdva024-0000-0000-0000-000000000001",
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
                "createdAt": "2025-11-06T23:15:26"
            }
        },
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
                    "fullAddress": "104 Lê Lợi, Phường Bình Dương, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bình Dương",
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
                "imageUrls": [],
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
                "createdAt": "2025-11-06T23:15:26"
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
                    "fullAddress": "456 Lê Lợi, Phường Phú Lợi, Thành phố Hồ Chí Minh",
                    "ward": "Phường Phú Lợi",
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
                "imageUrls": [],
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
                "createdAt": "2025-11-06T23:15:26"
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
                    "fullAddress": "789 Nguyễn Văn Cừ, Phường Vĩnh Tân, Thành phố Hồ Chí Minh",
                    "ward": "Phường Vĩnh Tân",
                    "city": "Thành phố Hồ Chí Minh",
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
                "imageUrls": [],
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
                "createdAt": "2025-11-06T23:15:26"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0014-0000-0000-0000-000000000001",
                "bookingCode": "HKSVA014",
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
                    "fullAddress": "789 Nguyễn Văn Cừ, Phường Vĩnh Tân, Thành phố Hồ Chí Minh",
                    "ward": "Phường Vĩnh Tân",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7594,
                    "longitude": 106.6822,
                    "isDefault": false
                },
                "bookingTime": "2025-11-10T08:00:00",
                "note": "Ưu tiên phòng khách và ban công",
                "totalAmount": 420000.00,
                "formattedTotalAmount": "420,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": "Dọn dẹp căn hộ phố đi bộ Nguyễn Huệ",
                "imageUrls": [
                    "https://res.cloudinary.com/demo/image/upload/v1731000001/booking/saigon_balcony.jpg"
                ],
                "isPost": true,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bdva014-0000-0000-0000-000000000001",
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
                        "quantity": 4,
                        "pricePerUnit": 105000.00,
                        "formattedPricePerUnit": "105,000đ",
                        "subTotal": 420000.00,
                        "formattedSubTotal": "420,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T23:15:26"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0015-0000-0000-0000-000000000001",
                "bookingCode": "HKSVA015",
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
                    "addressId": "adrs0001-0000-0000-0000-000000000005",
                    "fullAddress": "321 Phan Văn Trị, Phường Bình Cơ, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bình Cơ",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.8011,
                    "longitude": 106.7067,
                    "isDefault": false
                },
                "bookingTime": "2025-11-10T13:30:00",
                "note": "Cần xử lý bụi mịn và cửa kính",
                "totalAmount": 380000.00,
                "formattedTotalAmount": "380,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": "Vệ sinh căn hộ Bình Lợi",
                "imageUrls": [
                    "https://res.cloudinary.com/demo/image/upload/v1731000002/booking/glass_cleaning.jpg"
                ],
                "isPost": true,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bdva015-0000-0000-0000-000000000001",
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
                        "pricePerUnit": 380000.00,
                        "formattedPricePerUnit": "380,000đ",
                        "subTotal": 380000.00,
                        "formattedSubTotal": "380,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T23:15:26"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0016-0000-0000-0000-000000000001",
                "bookingCode": "HKSVA016",
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
                    "addressId": "adrs0001-0000-0000-0000-000000000006",
                    "fullAddress": "567 Lý Thường Kiệt, Phường Tân Hiệp, Thành phố Hồ Chí Minh",
                    "ward": "Phường Tân Hiệp",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7993,
                    "longitude": 106.6554,
                    "isDefault": false
                },
                "bookingTime": "2025-11-11T09:00:00",
                "note": "Lau chùi nội thất gỗ và rèm",
                "totalAmount": 560000.00,
                "formattedTotalAmount": "560,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": "Chăm sóc nhà phố Tân Sơn Nhất",
                "imageUrls": [
                    "https://res.cloudinary.com/demo/image/upload/v1731000003/booking/wood_cleaning.jpg"
                ],
                "isPost": true,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bdva016-0000-0000-0000-000000000001",
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
                        "pricePerUnit": 560000.00,
                        "formattedPricePerUnit": "560,000đ",
                        "subTotal": 560000.00,
                        "formattedSubTotal": "560,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "3 giờ",
                        "formattedDuration": "3 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T23:15:26"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0017-0000-0000-0000-000000000001",
                "bookingCode": "HKSVA017",
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
                "bookingTime": "2025-11-11T15:00:00",
                "note": "Chuẩn bị đón khách cuối tuần",
                "totalAmount": 460000.00,
                "formattedTotalAmount": "460,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": "Dọn nhà chung cư Quận 1",
                "imageUrls": [
                    "https://res.cloudinary.com/demo/image/upload/v1731000004/booking/living_room.jpg"
                ],
                "isPost": true,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bdva017-0000-0000-0000-000000000001",
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
                        "quantity": 4,
                        "pricePerUnit": 115000.00,
                        "formattedPricePerUnit": "115,000đ",
                        "subTotal": 460000.00,
                        "formattedSubTotal": "460,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T23:15:26"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0018-0000-0000-0000-000000000001",
                "bookingCode": "HKSVA018",
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
                    "fullAddress": "128 Trần Hưng Đạo, Phường Chánh Hiệp, Thành phố Hồ Chí Minh",
                    "ward": "Phường Chánh Hiệp",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7657,
                    "longitude": 106.6921,
                    "isDefault": true
                },
                "bookingTime": "2025-11-12T08:30:00",
                "note": "Giặt thảm phòng ngủ và sofa",
                "totalAmount": 520000.00,
                "formattedTotalAmount": "520,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": "Vệ sinh cao cấp Phường Cầu Kho",
                "imageUrls": [
                    "https://res.cloudinary.com/demo/image/upload/v1731000005/booking/bedroom_cleanup.jpg"
                ],
                "isPost": true,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bdva018-0000-0000-0000-000000000001",
                        "service": {
                            "serviceId": 5,
                            "name": "Giặt sấy theo kg",
                            "description": "Giặt và sấy khô quần áo thông thường, giao nhận tận nơi.",
                            "basePrice": 30000.00,
                            "unit": "Kg",
                            "estimatedDurationHours": 24.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601210/shirt_nmee0d.png",
                            "categoryName": "Giặt ủi",
                            "isActive": true
                        },
                        "quantity": 10,
                        "pricePerUnit": 52000.00,
                        "formattedPricePerUnit": "52,000đ",
                        "subTotal": 520000.00,
                        "formattedSubTotal": "520,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "24 giờ",
                        "formattedDuration": "24 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T23:15:26"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0019-0000-0000-0000-000000000001",
                "bookingCode": "HKSVA019",
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
                "bookingTime": "2025-11-12T14:00:00",
                "note": "Khử khuẩn đồ chơi trẻ em",
                "totalAmount": 340000.00,
                "formattedTotalAmount": "340,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": "Dịch vụ vệ sinh gia đình trẻ nhỏ",
                "imageUrls": [
                    "https://res.cloudinary.com/demo/image/upload/v1731000006/booking/kids_room.jpg"
                ],
                "isPost": true,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bdva019-0000-0000-0000-000000000001",
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
                        "pricePerUnit": 340000.00,
                        "formattedPricePerUnit": "340,000đ",
                        "subTotal": 340000.00,
                        "formattedSubTotal": "340,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-06T23:15:26"
            }
        }
    ],
    "success": true,
    "currentPage": 0,
    "totalItems": 14,
    "totalPages": 2
}
```

---

## Error Cases

**Error Case 1: Unauthorized Access (Customer token)**
```http
GET /api/v1/employee/bookings/verified-awaiting-employee
Authorization: Bearer {customer_token}
```

Response (403 Forbidden):
```json
{
    "timestamp": "2025-11-06T12:00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied"
}
```

**Error Case 2: No Authentication**
```http
GET /api/v1/employee/bookings/verified-awaiting-employee
```

Response (401 Unauthorized):
```json
{
    "timestamp": "2025-11-06T12:00:00",
    "status": 401,
    "error": "Unauthorized",
    "message": "Full authentication is required to access this resource"
}
```
