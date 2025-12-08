# Admin Bookings APIs (updated 25-11-2025)

Các thay đổi liên quan đến admin booking để FE tích hợp.

- Được bảo vệ bởi `ROLE_ADMIN` (Bearer token).
- Kết quả luôn được sắp xếp `bookingTime` giảm dần.

## 1) GET `/api/v1/admin/bookings` (đã bổ sung filter)

- Mục đích: lấy danh sách booking sắp xếp theo `bookingTime` giảm dần với lọc trạng thái.
- Query params:
  - `page` (int, default 0, min 0)
  - `size` (int, default 10, max 100)
  - `fromDate` (optional, ISO date-time, ví dụ `2025-11-01T00:00:00`)
  - `status` (optional, enum `PENDING|AWAITING_EMPLOYEE|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED`)
- Sample request (dùng dữ liệu seed `postgres_data/init_sql/91_seed_services_and_bookings.sql`):
  ```
  GET /api/v1/admin/bookings?fromDate=2025-11-01T00:00:00&status=PENDING&page=0&size=5
  Authorization: Bearer <admin-token>
  ```
- Sample response (trích từ seed, các record PENDING, chưa verify):
  ```json
  {
    "totalPages": 3,
    "totalItems": 13,
    "currentPage": 0,
    "success": true,
    "data": [
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
                    "rating": "LOW",
                    "vipLevel": 2
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
                "bookingTime": "2025-11-25T08:00:00",
                "note": "Test nhiều assignments - Tổng vệ sinh căn hộ lớn",
                "totalAmount": 800000.00,
                "formattedTotalAmount": "800,000đ",
                "baseAmount": 800000.00,
                "totalFees": 0,
                "fees": [],
                "status": "PENDING",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000011",
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
                        "quantity": 2,
                        "pricePerUnit": 100000.00,
                        "formattedPricePerUnit": "100,000đ",
                        "subTotal": 200000.00,
                        "formattedSubTotal": "200,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000006",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000001",
                                    "fullName": "Jane Smith",
                                    "email": "jane.smith@example.com",
                                    "phoneNumber": "0912345678",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Cleaning",
                                        "Organizing"
                                    ],
                                    "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
                                },
                                "status": "PENDING",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            },
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000007",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000002",
                                    "fullName": "Bob Wilson",
                                    "email": "bob.wilson@examplefieldset.com",
                                    "phoneNumber": "0923456789",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Deep Cleaning",
                                        "Laundry"
                                    ],
                                    "bio": "Chuyên gia giặt ủi và làm sạch sâu."
                                },
                                "status": "PENDING",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    },
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
                        "quantity": 2,
                        "pricePerUnit": 300000.00,
                        "formattedPricePerUnit": "300,000đ",
                        "subTotal": 600000.00,
                        "formattedSubTotal": "600,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000008",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000003",
                                    "fullName": "Trần Văn Long",
                                    "email": "tranvanlong@gmail.com",
                                    "phoneNumber": "0887224321",
                                    "avatar": "https://i.pravatar.cc/150?img=33",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Vệ sinh tổng quát",
                                        "Lau dọn"
                                    ],
                                    "bio": "Nhiều năm kinh nghiệm vệ sinh nhà cửa, tỉ mỉ và cẩn thận."
                                },
                                "status": "PENDING",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "3 giờ",
                        "formattedDuration": "3 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-25T20:56:29"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000009",
                "bookingCode": "BK000009",
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
                    "rating": "MEDIUM",
                    "vipLevel": 3
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
                "bookingTime": "2025-11-20T14:00:00",
                "note": "Test cancel assignment - Giặt ủi",
                "totalAmount": 180000.00,
                "formattedTotalAmount": "180,000đ",
                "baseAmount": 180000.00,
                "totalFees": 0,
                "fees": [],
                "status": "PENDING",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000009",
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
                        "quantity": 5,
                        "pricePerUnit": 60000.00,
                        "formattedPricePerUnit": "60,000đ",
                        "subTotal": 180000.00,
                        "formattedSubTotal": "180,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000004",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000002",
                                    "fullName": "Bob Wilson",
                                    "email": "bob.wilson@examplefieldset.com",
                                    "phoneNumber": "0923456789",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Deep Cleaning",
                                        "Laundry"
                                    ],
                                    "bio": "Chuyên gia giặt ủi và làm sạch sâu."
                                },
                                "status": "PENDING",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "24 giờ",
                        "formattedDuration": "24 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-25T20:56:29"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000008",
                "bookingCode": "BK000008",
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
                    "rating": "HIGH",
                    "vipLevel": 4
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
                "bookingTime": "2025-11-15T09:00:00",
                "note": "Test assignment PENDING - Dọn dẹp căn hộ",
                "totalAmount": 50000.00,
                "formattedTotalAmount": "50,000đ",
                "baseAmount": 10000.00,
                "totalFees": 40000.00,
                "fees": [
                    {
                        "name": "Phí hệ thống",
                        "type": "PERCENT",
                        "value": 0.2000,
                        "amount": 40000.00,
                        "systemSurcharge": true
                    }
                ],
                "status": "PENDING",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000008",
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
                        "pricePerUnit": 50000.00,
                        "formattedPricePerUnit": "50,000đ",
                        "subTotal": 50000.00,
                        "formattedSubTotal": "50,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000003",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000001",
                                    "fullName": "Jane Smith",
                                    "email": "jane.smith@example.com",
                                    "phoneNumber": "0912345678",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Cleaning",
                                        "Organizing"
                                    ],
                                    "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
                                },
                                "status": "PENDING",
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
                "createdAt": "2025-11-25T20:56:29"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000026",
                "bookingCode": "BK000026",
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
                    "fullAddress": "567 Cách Mạng Tháng 8, Phường Chánh Phú Hòa, Thành phố Hồ Chí Minh",
                    "ward": "Phường Chánh Phú Hòa",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7843,
                    "longitude": 106.6801,
                    "isDefault": true
                },
                "bookingTime": "2025-11-08T10:30:00",
                "note": "Vệ sinh máy lạnh 2 cái",
                "totalAmount": 100000.00,
                "formattedTotalAmount": "100,000đ",
                "baseAmount": 100000.00,
                "totalFees": 0,
                "fees": [],
                "status": "PENDING",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000026",
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
                "createdAt": "2025-11-25T20:56:31"
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
                    "fullAddress": "567 Cách Mạng Tháng 8, Phường Chánh Phú Hòa, Thành phố Hồ Chí Minh",
                    "ward": "Phường Chánh Phú Hòa",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7843,
                    "longitude": 106.6801,
                    "isDefault": true
                },
                "bookingTime": "2025-11-07T14:30:00",
                "note": "Test cancel gần giờ - không được phép",
                "totalAmount": 180000.00,
                "formattedTotalAmount": "180,000đ",
                "baseAmount": 180000.00,
                "totalFees": 0,
                "fees": [],
                "status": "PENDING",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000014",
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
                        "pricePerUnit": 120000.00,
                        "formattedPricePerUnit": "120,000đ",
                        "subTotal": 120000.00,
                        "formattedSubTotal": "120,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000010",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000002",
                                    "fullName": "Bob Wilson",
                                    "email": "bob.wilson@examplefieldset.com",
                                    "phoneNumber": "0923456789",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Deep Cleaning",
                                        "Laundry"
                                    ],
                                    "bio": "Chuyên gia giặt ủi và làm sạch sâu."
                                },
                                "status": "PENDING",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "48 giờ",
                        "formattedDuration": "48 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-25T20:56:29"
            }
        }
    ]
  }
  ```
- Ghi chú:
  - Nếu không truyền `status`, API trả tất cả trạng thái.
  - Nếu không truyền `fromDate`, API không áp dụng lọc thời gian.

## 2) GET `/api/v1/admin/bookings/search` (endpoint mới)

- Mục đích: tìm kiếm booking theo `bookingCode` (tìm tương đối, không phân biệt hoa thường).
- Query params:
  - `bookingCode` (bắt buộc, string; hỗ trợ LIKE `%bookingCode%`)
  - `page` (int, default 0, min 0)
  - `size` (int, default 10, max 100)
- Sample request (dùng seed):
  ```
  GET /api/v1/admin/bookings/search?bookingCode=BK0000&page=0&size=5
  Authorization: Bearer <admin-token>
  ```
- Sample response (kết quả match với prefix BK0000 từ seed):
  ```json
  {
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000063",
                "bookingCode": "BK000063",
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
                "bookingTime": "2025-12-04T14:30:00",
                "note": "Booking hoàn thành - Đi chợ hộ + Nấu ăn",
                "totalAmount": 220000.00,
                "formattedTotalAmount": "220,000đ",
                "baseAmount": 220000.00,
                "totalFees": 0,
                "fees": [],
                "status": "COMPLETED",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000066",
                        "service": {
                            "serviceId": 8,
                            "name": "Đi chợ hộ",
                            "description": "Mua sắm và giao hàng tận nơi theo danh sách của bạn.",
                            "basePrice": 40000.00,
                            "unit": "Lần",
                            "estimatedDurationHours": 1.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601712/shopping_etf5iz.png",
                            "categoryName": "Việc nhà khác",
                            "isActive": true
                        },
                        "quantity": 2,
                        "pricePerUnit": 40000.00,
                        "formattedPricePerUnit": "40,000đ",
                        "subTotal": 80000.00,
                        "formattedSubTotal": "80,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000060",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000002",
                                    "fullName": "Bob Wilson",
                                    "email": "bob.wilson@examplefieldset.com",
                                    "phoneNumber": "0923456789",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Deep Cleaning",
                                        "Laundry"
                                    ],
                                    "bio": "Chuyên gia giặt ủi và làm sạch sâu."
                                },
                                "status": "COMPLETED",
                                "checkInTime": "2025-12-04 14:30:00",
                                "checkOutTime": "2025-12-04 15:30:00",
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "1 giờ",
                        "formattedDuration": "1 giờ"
                    },
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000067",
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
                        "quantity": 3,
                        "pricePerUnit": 60000.00,
                        "formattedPricePerUnit": "60,000đ",
                        "subTotal": 180000.00,
                        "formattedSubTotal": "180,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000061",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000003",
                                    "fullName": "Trần Văn Long",
                                    "email": "tranvanlong@gmail.com",
                                    "phoneNumber": "0887224321",
                                    "avatar": "https://i.pravatar.cc/150?img=33",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Vệ sinh tổng quát",
                                        "Lau dọn"
                                    ],
                                    "bio": "Nhiều năm kinh nghiệm vệ sinh nhà cửa, tỉ mỉ và cẩn thận."
                                },
                                "status": "COMPLETED",
                                "checkInTime": "2025-12-04 14:30:00",
                                "checkOutTime": "2025-12-04 17:00:00",
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "2 giờ 30 phút",
                        "formattedDuration": "2 giờ 30 phút"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-25T20:56:29"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000062",
                "bookingCode": "BK000062",
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
                    "rating": "MEDIUM",
                    "vipLevel": 3
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
                "bookingTime": "2025-12-03T10:00:00",
                "note": "Booking hoàn thành - Vệ sinh máy lạnh + Tổng vệ sinh",
                "totalAmount": 650000.00,
                "formattedTotalAmount": "650,000đ",
                "baseAmount": 650000.00,
                "totalFees": 0,
                "fees": [],
                "status": "COMPLETED",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000064",
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
                        "pricePerUnit": 150000.00,
                        "formattedPricePerUnit": "150,000đ",
                        "subTotal": 300000.00,
                        "formattedSubTotal": "300,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000058",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000003",
                                    "fullName": "Trần Văn Long",
                                    "email": "tranvanlong@gmail.com",
                                    "phoneNumber": "0887224321",
                                    "avatar": "https://i.pravatar.cc/150?img=33",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Vệ sinh tổng quát",
                                        "Lau dọn"
                                    ],
                                    "bio": "Nhiều năm kinh nghiệm vệ sinh nhà cửa, tỉ mỉ và cẩn thận."
                                },
                                "status": "COMPLETED",
                                "checkInTime": "2025-12-03 10:00:00",
                                "checkOutTime": "2025-12-03 12:00:00",
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "1 giờ",
                        "formattedDuration": "1 giờ"
                    },
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000065",
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
                        "quantity": 3,
                        "pricePerUnit": 100000.00,
                        "formattedPricePerUnit": "100,000đ",
                        "subTotal": 300000.00,
                        "formattedSubTotal": "300,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000059",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000001",
                                    "fullName": "Jane Smith",
                                    "email": "jane.smith@example.com",
                                    "phoneNumber": "0912345678",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Cleaning",
                                        "Organizing"
                                    ],
                                    "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
                                },
                                "status": "COMPLETED",
                                "checkInTime": "2025-12-03 10:00:00",
                                "checkOutTime": "2025-12-03 13:00:00",
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-25T20:56:29"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000061",
                "bookingCode": "BK000061",
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
                    "rating": "HIGH",
                    "vipLevel": 4
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
                "bookingTime": "2025-12-02T13:00:00",
                "note": "Booking hoàn thành - Giặt hấp cao cấp",
                "totalAmount": 360000.00,
                "formattedTotalAmount": "360,000đ",
                "baseAmount": 360000.00,
                "totalFees": 0,
                "fees": [],
                "status": "COMPLETED",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000063",
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
                        "quantity": 3,
                        "pricePerUnit": 120000.00,
                        "formattedPricePerUnit": "120,000đ",
                        "subTotal": 360000.00,
                        "formattedSubTotal": "360,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000057",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000002",
                                    "fullName": "Bob Wilson",
                                    "email": "bob.wilson@examplefieldset.com",
                                    "phoneNumber": "0923456789",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Deep Cleaning",
                                        "Laundry"
                                    ],
                                    "bio": "Chuyên gia giặt ủi và làm sạch sâu."
                                },
                                "status": "COMPLETED",
                                "checkInTime": "2025-12-02 13:00:00",
                                "checkOutTime": "2025-12-02 16:00:00",
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "48 giờ",
                        "formattedDuration": "48 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-25T20:56:29"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000060",
                "bookingCode": "BK000060",
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
                    "fullAddress": "89 Lý Thường Kiệt, Phường Long Nguyên, Thành phố Hồ Chí Minh",
                    "ward": "Phường Long Nguyên",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7993,
                    "longitude": 106.6554,
                    "isDefault": true
                },
                "bookingTime": "2025-12-01T09:30:00",
                "note": "Booking hoàn thành - Dọn dẹp theo giờ",
                "totalAmount": 150000.00,
                "formattedTotalAmount": "150,000đ",
                "baseAmount": 150000.00,
                "totalFees": 0,
                "fees": [],
                "status": "COMPLETED",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000062",
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
                        "quantity": 3,
                        "pricePerUnit": 50000.00,
                        "formattedPricePerUnit": "50,000đ",
                        "subTotal": 150000.00,
                        "formattedSubTotal": "150,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000056",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000001",
                                    "fullName": "Jane Smith",
                                    "email": "jane.smith@example.com",
                                    "phoneNumber": "0912345678",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Cleaning",
                                        "Organizing"
                                    ],
                                    "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
                                },
                                "status": "COMPLETED",
                                "checkInTime": "2025-12-01 09:30:00",
                                "checkOutTime": "2025-12-01 12:30:00",
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-25T20:56:29"
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
                    "rating": "LOW",
                    "vipLevel": 2
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
                "bookingTime": "2025-11-25T08:00:00",
                "note": "Test nhiều assignments - Tổng vệ sinh căn hộ lớn",
                "totalAmount": 800000.00,
                "formattedTotalAmount": "800,000đ",
                "baseAmount": 800000.00,
                "totalFees": 0,
                "fees": [],
                "status": "PENDING",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000011",
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
                        "quantity": 2,
                        "pricePerUnit": 100000.00,
                        "formattedPricePerUnit": "100,000đ",
                        "subTotal": 200000.00,
                        "formattedSubTotal": "200,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000006",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000001",
                                    "fullName": "Jane Smith",
                                    "email": "jane.smith@example.com",
                                    "phoneNumber": "0912345678",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Cleaning",
                                        "Organizing"
                                    ],
                                    "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
                                },
                                "status": "PENDING",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            },
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000007",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000002",
                                    "fullName": "Bob Wilson",
                                    "email": "bob.wilson@examplefieldset.com",
                                    "phoneNumber": "0923456789",
                                    "avatar": "https://picsum.photos/200",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Deep Cleaning",
                                        "Laundry"
                                    ],
                                    "bio": "Chuyên gia giặt ủi và làm sạch sâu."
                                },
                                "status": "PENDING",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    },
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
                        "quantity": 2,
                        "pricePerUnit": 300000.00,
                        "formattedPricePerUnit": "300,000đ",
                        "subTotal": 600000.00,
                        "formattedSubTotal": "600,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "as000001-0000-0000-0000-000000000008",
                                "employee": {
                                    "employeeId": "e1000001-0000-0000-0000-000000000003",
                                    "fullName": "Trần Văn Long",
                                    "email": "tranvanlong@gmail.com",
                                    "phoneNumber": "0887224321",
                                    "avatar": "https://i.pravatar.cc/150?img=33",
                                    "rating": "HIGH",
                                    "employeeStatus": "AVAILABLE",
                                    "skills": [
                                        "Vệ sinh tổng quát",
                                        "Lau dọn"
                                    ],
                                    "bio": "Nhiều năm kinh nghiệm vệ sinh nhà cửa, tỉ mỉ và cẩn thận."
                                },
                                "status": "PENDING",
                                "checkInTime": null,
                                "checkOutTime": null,
                                "createdAt": null,
                                "updatedAt": null
                            }
                        ],
                        "duration": "3 giờ",
                        "formattedDuration": "3 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-11-25T20:56:29"
            }
        }
    ],
    "success": true,
    "currentPage": 0,
    "totalItems": 57,
    "totalPages": 12
  }
  ```
- Lưu ý:
  - Chuỗi tìm kiếm được chuyển lowercase trước khi so sánh.
  - Vẫn sắp xếp theo `bookingTime` giảm dần.

## 3) GET `/api/v1/admin/bookings/unpaid` (endpoint mới, hỗ trợ isPaid)

- Mục đích: lấy booking theo tình trạng thanh toán (chưa thanh toán hoặc đã thanh toán), kèm paging và filter trạng thái booking.
- Query params:
  - `isPaid` (optional, boolean; default `false` để giữ hành vi cũ)
    - `false` ⇒ paymentStatus ≠ PAID (PENDING/FAILED/CANCELLED/REFUNDED)
    - `true`  ⇒ paymentStatus = PAID
  - `status` (optional, enum `PENDING|AWAITING_EMPLOYEE|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED`)
  - `page` (int, default 0, min 0)
  - `size` (int, default 10, max 100)
- Sample unpaid (seed `postgres_data/init_sql/95_seed_additional_bookings_and_payments.sql`):
  ```
  GET /api/v1/admin/bookings/unpaid?status=PENDING&page=0&size=5
  Authorization: Bearer <admin-token>
  ```
  Response (booking HKS000013, payment PENDING):
  ```json
  {
    "totalItems": 3,
    "totalPages": 1,
    "data": [
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
                    "fullAddress": "567 Cách Mạng Tháng 8, Phường Chánh Phú Hòa, Thành phố Hồ Chí Minh",
                    "ward": "Phường Chánh Phú Hòa",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7843,
                    "longitude": 106.6801,
                    "isDefault": true
                },
                "bookingTime": "2025-11-04T09:30:00",
                "note": "Vệ sinh 2 máy lạnh trong phòng.",
                "totalAmount": 50000.00,
                "formattedTotalAmount": "50,000đ",
                "baseAmount": 50000.00,
                "totalFees": 0,
                "fees": [],
                "status": "PENDING",
                "title": null,
                "imageUrls": [],
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
                "payment": {
                    "paymentId": "pay00001-0000-0000-0000-000000000005",
                    "amount": 50000.00,
                    "paymentMethod": "Thanh toán tiền mặt",
                    "paymentStatus": "PENDING",
                    "transactionCode": null,
                    "createdAt": "2025-11-25 20:56:30",
                    "paidAt": null
                },
                "createdAt": "2025-11-25T20:56:28"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000003",
                "bookingCode": "BK000003",
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
                "bookingTime": "2025-11-01T08:00:00",
                "note": "Cần vệ sinh tổng quát căn hộ 2 phòng ngủ.",
                "totalAmount": 200000.00,
                "formattedTotalAmount": "200,000đ",
                "baseAmount": 200000.00,
                "totalFees": 0,
                "fees": [],
                "status": "PENDING",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": false,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000001-0000-0000-0000-000000000003",
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
                        "pricePerUnit": 200000.00,
                        "formattedPricePerUnit": "200,000đ",
                        "subTotal": 200000.00,
                        "formattedSubTotal": "200,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": {
                    "paymentId": "pay00001-0000-0000-0000-000000000004",
                    "amount": 200000.00,
                    "paymentMethod": "Chuyển khoản ngân hàng",
                    "paymentStatus": "PENDING",
                    "transactionCode": "BFT20250901001",
                    "createdAt": "2025-11-25 20:56:30",
                    "paidAt": null
                },
                "createdAt": "2025-11-25T20:56:28"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0013-0000-0000-0000-000000000001",
                "bookingCode": "HKS000013",
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
                    "rating": "MEDIUM",
                    "vipLevel": 3
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
                "bookingTime": "2025-10-09T17:00:00",
                "note": "Dọn dẹp sau khi sửa chữa nhà",
                "totalAmount": 700000.00,
                "formattedTotalAmount": "700,000đ",
                "baseAmount": 700000.00,
                "totalFees": 0,
                "fees": [],
                "status": "PENDING",
                "title": null,
                "imageUrls": [],
                "isPost": false,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000013-0000-0000-0000-000000000001",
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
                        "quantity": 2,
                        "pricePerUnit": 350000.00,
                        "formattedPricePerUnit": "350,000đ",
                        "subTotal": 700000.00,
                        "formattedSubTotal": "700,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": {
                    "paymentId": "pay00005-0000-0000-0000-000000000001",
                    "amount": 700000.00,
                    "paymentMethod": null,
                    "paymentStatus": "PENDING",
                    "transactionCode": null,
                    "createdAt": "2025-11-25 20:56:30",
                    "paidAt": null
                },
                "createdAt": "2025-11-25T20:56:30"
            }
        }
    ],
    "success": true,
    "currentPage": 0
  }
  ```
- Sample paid (seed `postgres_data/init_sql/95_seed_additional_bookings_and_payments.sql`):
  ```
  GET /api/v1/admin/bookings/unpaid?isPaid=true&page=0&size=5
  Authorization: Bearer <admin-token>
  ```
  Response (booking HKS000007, payment PAID):
  ```json
  {
    "success": true,
    "data": [
      { "success": true, "data": { "bookingCode": "HKS000007", "status": "CONFIRMED", "bookingTime": "2025-10-06T16:00:00", "payment": { "paymentStatus": "PAID" } } }
    ],
    "currentPage": 0,
    "totalItems": 1,
    "totalPages": 1
  }
  ```
- Lưu ý:
  - Không truyền `isPaid` ⇒ mặc định lấy danh sách chưa thanh toán (giữ tương thích cũ).
  - Luôn sort theo `bookingTime` giảm dần.

## Tham chiếu dữ liệu mẫu

- Các booking code và trạng thái dùng trong ví dụ lấy từ `postgres_data/init_sql/91_seed_services_and_bookings.sql`.
- FE có thể seed DB cục bộ để chạy thử ngay với các mã: `BK000001` (COMPLETED), `BK000002` (CONFIRMED), `BK000003`…`BK000007` (PENDING, chưa verify), `BK000008`…`BK000013` (nhiều trạng thái), v.v.
