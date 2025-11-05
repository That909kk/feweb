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
            "bookingId": "bc260995-5d7d-40fe-94db-b4d8695d3ad5",
            "bookingCode": "BK64923095",
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
            "bookingTime": "2025-11-27T10:00",
            "note": "Cần dọn dẹp kỹ lưỡng phòng khách và bếp",
            "formattedTotalAmount": "100,000đ",
            "status": "PENDING",
            "promotion": null,
            "payment": {
                "paymentId": "a0af1189-562e-4d33-a7a0-3a89f9e736b8",
                "amount": 100000.00,
                "paymentMethod": "Thanh toán tiền mặt",
                "paymentStatus": "PENDING",
                "transactionCode": "TXN_1761965564920",
                "createdAt": "2025-11-01 09:52:45",
                "paidAt": null
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
            ]
        },
        {
            "bookingId": "77cc774b-9da9-427f-ab5b-bb29ab96c667",
            "bookingCode": "BK69558467",
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
            "bookingTime": "2025-11-26T10:00",
            "note": "Cần dọn dẹp kỹ lưỡng phòng khách và bếp",
            "formattedTotalAmount": "100,000đ",
            "status": "PENDING",
            "promotion": null,
            "payment": {
                "paymentId": "9536e445-5d7b-4b71-a04b-8f94597b9bec",
                "amount": 100000.00,
                "paymentMethod": "Thanh toán tiền mặt",
                "paymentStatus": "PENDING",
                "transactionCode": "TXN_1761963169558",
                "createdAt": "2025-11-01 09:12:49",
                "paidAt": null
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
            ]
        },
        {
            "bookingId": "f5a4f023-9920-44d3-a068-c03a76493aa3",
            "bookingCode": "BK27620656",
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
            "bookingTime": "2025-11-05T14:00",
            "note": null,
            "formattedTotalAmount": "100,000đ",
            "status": "AWAITING_EMPLOYEE",
            "promotion": null,
            "payment": {
                "paymentId": "c57f0795-56ab-492a-b302-95785fc2d23d",
                "amount": 100000.00,
                "paymentMethod": "Thanh toán tiền mặt",
                "paymentStatus": "PENDING",
                "transactionCode": "TXN_1761962927620",
                "createdAt": "2025-11-01 09:08:47",
                "paidAt": null
            },
            "title": "Dọn dẹp phòng khách và bếp",
            "imageUrl": "https://res.cloudinary.com/dhhntolb5/image/upload/v1761962927/booking_images/o4gwqqx12qwsht6fjxvf.jpg",
            "isVerified": false,
            "assignedEmployees": []
        },
        {
            "bookingId": "825344a5-6cfb-43d9-8bb5-cac2f3624cd1",
            "bookingCode": "BK39914698",
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
            "bookingTime": "2025-11-05T09:00",
            "note": null,
            "formattedTotalAmount": "50,000đ",
            "status": "AWAITING_EMPLOYEE",
            "promotion": null,
            "payment": {
                "paymentId": "bfdcb383-2161-4afc-b082-6c704bb80c94",
                "amount": 50000.00,
                "paymentMethod": "Thanh toán tiền mặt",
                "paymentStatus": "PENDING",
                "transactionCode": "TXN_1761962839914",
                "createdAt": "2025-11-01 09:07:19",
                "paidAt": null
            },
            "title": "Cần dọn dẹp nhà cấp tốc",
            "imageUrl": null,
            "isVerified": false,
            "assignedEmployees": []
        },
        {
            "bookingId": "6d82a515-1505-4c6d-94ac-4a2b9341ebda",
            "bookingCode": "BK9619263",
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
            "bookingTime": "2025-11-05T09:00",
            "note": null,
            "formattedTotalAmount": "100,000đ",
            "status": "AWAITING_EMPLOYEE",
            "promotion": null,
            "payment": {
                "paymentId": "bddcfe4e-fad2-4354-bba2-edb381cf3aea",
                "amount": 100000.00,
                "paymentMethod": "Thanh toán tiền mặt",
                "paymentStatus": "PENDING",
                "transactionCode": "TXN_1761962809609",
                "createdAt": "2025-11-01 09:06:49",
                "paidAt": null
            },
            "title": "Cần dọn dẹp nhà cấp tốc",
            "imageUrl": null,
            "isVerified": false,
            "assignedEmployees": []
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
            "assignedEmployees": []
        },
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
            "assignedEmployees": []
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
                "createdAt": "2025-11-01 06:03:00",
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
            "assignedEmployees": []
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
                "createdAt": "2025-11-01 06:03:00",
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
            ]
        }
    ],
    "pageable": {
        "pageNumber": 0,
        "pageSize": 10,
        "sort": {
            "empty": false,
            "sorted": true,
            "unsorted": false
        },
        "offset": 0,
        "paged": true,
        "unpaged": false
    },
    "totalElements": 10,
    "totalPages": 1,
    "last": true,
    "size": 10,
    "number": 0,
    "sort": {
        "empty": false,
        "sorted": true,
        "unsorted": false
    },
    "numberOfElements": 10,
    "first": true,
    "empty": false
  }
  ```
- **Status Code**: `200 OK`