## API Endpoint Covered
**GET /customer/{customerId}** - Get Customer Bookings with Pagination

## GET /customer/{customerId} - Get Customer Bookings

### Test Case 1: Successfully Get Customer Bookings (Default Pagination)
- **Test Case ID**: TC_CUSTOMER_BOOKINGS_001
- **Description**: Verify that a customer can retrieve their bookings with default pagination settings.
- **Preconditions**: 
  - Customer is authenticated with valid token.
  - Customer has existing bookings.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/bookings/customer/c1000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    ```
- **Expected Output**:
  ```json
  {
    "content": [
        {
            "bookingId": "book0004-0000-0000-0000-000000000001",
            "bookingCode": "HKS000004",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000004",
                "fullAddress": "789 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh",
                "ward": "Phường Chợ Quán",
                "city": "TP. Hồ Chí Minh",
                "latitude": 10.7594,
                "longitude": 106.6822,
                "isDefault": false
            },
            "bookingTime": "2025-10-05T08:00",
            "note": "Cần dọn dẹp tổng quát, chú ý khu vực bếp",
            "formattedTotalAmount": "450,000đ",
            "status": "AWAITING_EMPLOYEE",
            "promotion": null,
            "payment": null,
            "title": null,
            "imageUrl": null,
            "isVerified": true,
            "assignedEmployees": [],
            "services": [
                {
                    "serviceId": 1,
                    "name": "Dọn dẹp theo giờ",
                    "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                    "basePrice": 50000.00,
                    "unit": "Giờ",
                    "estimatedDurationHours": 2.0,
                    "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                    "categoryName": "Dọn dẹp nhà",
                    "isActive": true
                }
            ]
        },
        {
            "bookingId": "book0007-0000-0000-0000-000000000001",
            "bookingCode": "HKS000007",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000007",
                "fullAddress": "432 Võ Văn Tần, Phường Bàn Cờ, TP. Hồ Chí Minh",
                "ward": "Phường Bàn Cờ",
                "city": "TP. Hồ Chí Minh",
                "latitude": 10.7756,
                "longitude": 106.6914,
                "isDefault": false
            },
            "bookingTime": "2025-10-06T16:00",
            "note": "Dọn dẹp sau tiệc, nhiều rác cần dọn",
            "formattedTotalAmount": "500,000đ",
            "status": "CONFIRMED",
            "promotion": null,
            "payment": {
                "paymentId": "pay00004-0000-0000-0000-000000000001",
                "amount": 500000.00,
                "paymentMethod": null,
                "paymentStatus": "PAID",
                "transactionCode": "TXN20240926001",
                "createdAt": "2025-11-04 10:30:40",
                "paidAt": "2024-09-26 15:30:00"
            },
            "title": null,
            "imageUrl": null,
            "isVerified": true,
            "assignedEmployees": [
                {
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
                }
            ],
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
        },
        {
            "bookingId": "book0009-0000-0000-0000-000000000001",
            "bookingCode": "HKS000009",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000001",
                "fullAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
                "ward": "Phường Tây Thạnh",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7943,
                "longitude": 106.6256,
                "isDefault": true
            },
            "bookingTime": "2025-10-07T15:30",
            "note": "Cần dọn nhà trước khi có khách",
            "formattedTotalAmount": "300,000đ",
            "status": "AWAITING_EMPLOYEE",
            "promotion": null,
            "payment": null,
            "title": null,
            "imageUrl": null,
            "isVerified": true,
            "assignedEmployees": [],
            "services": [
                {
                    "serviceId": 1,
                    "name": "Dọn dẹp theo giờ",
                    "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                    "basePrice": 50000.00,
                    "unit": "Giờ",
                    "estimatedDurationHours": 2.0,
                    "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                    "categoryName": "Dọn dẹp nhà",
                    "isActive": true
                }
            ]
        },
        {
            "bookingId": "book0012-0000-0000-0000-000000000001",
            "bookingCode": "HKS000012",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000004",
                "fullAddress": "789 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh",
                "ward": "Phường Chợ Quán",
                "city": "TP. Hồ Chí Minh",
                "latitude": 10.7594,
                "longitude": 106.6822,
                "isDefault": false
            },
            "bookingTime": "2025-10-09T11:00",
            "note": "Vệ sinh máy lạnh và quạt trần",
            "formattedTotalAmount": "550,000đ",
            "status": "AWAITING_EMPLOYEE",
            "promotion": null,
            "payment": null,
            "title": null,
            "imageUrl": null,
            "isVerified": true,
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
        },
        {
            "bookingId": "b0000001-0000-0000-0000-000000000001",
            "bookingCode": "BK000001",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000001",
                "fullAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
                "ward": "Phường Tây Thạnh",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7943,
                "longitude": 106.6256,
                "isDefault": true
            },
            "bookingTime": "2025-08-20T09:00",
            "note": "Nhà có trẻ nhỏ, vui lòng lau dọn kỹ khu vực phòng khách.",
            "formattedTotalAmount": "480,000đ",
            "status": "COMPLETED",
            "promotion": {
                "promotionId": 1,
                "promoCode": "GIAM20K",
                "description": "Giảm giá 20,000đ cho mọi đơn hàng",
                "discountType": "FIXED_AMOUNT",
                "discountValue": 20000.00,
                "maxDiscountAmount": null
            },
            "payment": {
                "paymentId": "pay00001-0000-0000-0000-000000000001",
                "amount": 480000.00,
                "paymentMethod": "Cổng thanh toán VNPAY",
                "paymentStatus": "PAID",
                "transactionCode": "VNP123456789",
                "createdAt": "2025-11-04 10:30:39",
                "paidAt": "2025-08-20 13:05:00"
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
                    "employeeStatus": "AVAILABLE",
                    "skills": [
                        "Deep Cleaning",
                        "Laundry"
                    ],
                    "bio": "Chuyên gia giặt ủi và làm sạch sâu."
                }
            ],
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
        "paged": true,
        "unpaged": false
    },
    "last": true,
    "totalElements": 5,
    "totalPages": 1,
    "first": true,
    "numberOfElements": 5,
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
- **Status Code**: `200 OK`