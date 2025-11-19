# Test Cases: Auto-Assign Employee in Booking Creation

## Tổng quan
Test 3 luồng đặt booking với tính năng tự động phân công nhân viên

## Ngày kiểm thử
9 tháng 11, 2025

## Thông tin tài khoản test
- **Customer**: john_doe / password: `password123`
  - customer_id: `c1000001-0000-0000-0000-000000000001`
  - address_id: `adrs0001-0000-0000-0000-000000000001`
  - Ward: `Phường Tây Thạnh`, City: `TP. Hồ Chí Minh`

---

## LUỒNG 1: Đặt booking - Tự động phân công nhân viên

### Bước 1: Tạo booking (auto-assign)
**POST** `/api/v1/customer/bookings`
- Content-Type: `multipart/form-data`
- Authorization: `Bearer {accessToken}`

**Input**:
- `booking` (JSON):
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000001",
  "bookingTime": "2025-11-20T09:00:00",
  "note": "Test auto-assign employee",
  "bookingDetails": [
    {
      "serviceId": 1,
      "quantity": 1
    }
  ],
  "paymentMethodId": 1
}
```

**Output**:
```json
{
    "data": {
        "bookingId": "5752b6bf-a0d5-4eab-bcb8-bc9b573fb5eb",
        "bookingCode": "BK7630663",
        "status": "PENDING",
        "totalAmount": 100000.00,
        "formattedTotalAmount": "100,000đ",
        "bookingTime": "2025-11-20T09:00:00",
        "createdAt": "2025-11-09T17:21:47.707983",
        "title": null,
        "imageUrls": [],
        "isVerified": true,
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
                "bookingDetailId": "58b80f75-a27e-4c80-a821-16155b86960d",
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
                "pricePerUnit": 50000.00,
                "formattedPricePerUnit": "50,000đ",
                "subTotal": 100000.00,
                "formattedSubTotal": "100,000đ",
                "selectedChoices": [],
                "assignments": [
                    {
                        "assignmentId": "1efb3cce-2617-4f15-8e48-78ed68da4994",
                        "employee": {
                            "employeeId": "e1000001-0000-0000-0000-000000000033",
                            "fullName": "Đặng Thị Bé",
                            "email": "dangthir1@gmail.com",
                            "phoneNumber": "0912000017",
                            "avatar": "https://i.pravatar.cc/150?img=25",
                            "rating": "HIGH",
                            "employeeStatus": "AVAILABLE",
                            "skills": [
                                "Nấu ăn",
                                "Đi chợ"
                            ],
                            "bio": "Nấu ăn đa dạng món Việt."
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
        "paymentInfo": {
            "paymentId": "2f70ea3b-cf65-4d52-a113-11184fa557cc",
            "amount": 100000.00,
            "paymentMethod": "Thanh toán tiền mặt",
            "paymentStatus": "PENDING",
            "transactionCode": "TXN_1762683707622",
            "createdAt": "2025-11-09 17:21:47",
            "paidAt": null
        },
        "promotionApplied": null,
        "assignedEmployees": [
            {
                "employeeId": "e1000001-0000-0000-0000-000000000033",
                "fullName": "Đặng Thị Bé",
                "email": "dangthir1@gmail.com",
                "phoneNumber": "0912000017",
                "avatar": "https://i.pravatar.cc/150?img=25",
                "rating": "HIGH",
                "employeeStatus": "AVAILABLE",
                "skills": [
                    "Nấu ăn",
                    "Đi chợ"
                ],
                "bio": "Nấu ăn đa dạng món Việt."
            }
        ],
        "totalServices": 1,
        "totalEmployees": 1,
        "estimatedDuration": "2 giờ 0 phút",
        "hasPromotion": false,
        "hasAutoAssignedEmployees": true
    },
    "success": true
}
```

### Bước 2: Kiểm tra booking
**GET** `/api/v1/customer/bookings/{bookingId}`
- Authorization: `Bearer {accessToken}`

**Output**:
```json
{
    "success": true,
    "message": "Đặt lịch thành công",
    "data": {
        "bookingId": "5752b6bf-a0d5-4eab-bcb8-bc9b573fb5eb",
        "bookingCode": "BK7630663",
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
        "bookingTime": "2025-11-20T09:00:00",
        "note": "Test auto-assign employee",
        "totalAmount": 100000.00,
        "formattedTotalAmount": "100,000đ",
        "status": "PENDING",
        "title": null,
        "imageUrls": [],
        "isPost": false,
        "isVerified": true,
        "adminComment": null,
        "promotion": null,
        "bookingDetails": [
            {
                "bookingDetailId": "58b80f75-a27e-4c80-a821-16155b86960d",
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
                "pricePerUnit": 50000.00,
                "formattedPricePerUnit": "50,000đ",
                "subTotal": 100000.00,
                "formattedSubTotal": "100,000đ",
                "selectedChoices": [],
                "assignments": [
                    {
                        "assignmentId": "1efb3cce-2617-4f15-8e48-78ed68da4994",
                        "employee": {
                            "employeeId": "e1000001-0000-0000-0000-000000000033",
                            "fullName": "Đặng Thị Bé",
                            "email": "dangthir1@gmail.com",
                            "phoneNumber": "0912000017",
                            "avatar": "https://i.pravatar.cc/150?img=25",
                            "rating": "HIGH",
                            "employeeStatus": "AVAILABLE",
                            "skills": [
                                "Nấu ăn",
                                "Đi chợ"
                            ],
                            "bio": "Nấu ăn đa dạng món Việt."
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
        "payment": {
            "paymentId": "2f70ea3b-cf65-4d52-a113-11184fa557cc",
            "amount": 100000.00,
            "paymentMethod": "Thanh toán tiền mặt",
            "paymentStatus": "PENDING",
            "transactionCode": "TXN_1762683707622",
            "createdAt": "2025-11-09 17:21:47",
            "paidAt": null
        },
        "createdAt": "2025-11-09T17:21:47"
    }
}
```

---

## LUỒNG 2: Đặt booking - Chọn nhân viên thủ công

### Bước 1: Tìm nhân viên phù hợp
**GET** `/api/v1/customer/services/employee/suitable`
- Authorization: `Bearer {accessToken}`
- Params:
  - `serviceId=1`
  - `bookingTime=2025-11-20T14:00:00`
  - `ward=Phường Thủ Dầu Một`
  - `city=TP. Hồ Chí Minh`

**Output**:
```json
{
    "success": true,
    "message": "Tìm thấy 3 nhân viên phù hợp cho dịch vụ Dọn dẹp theo giờ | Sắp xếp theo mô hình ML employee-rec-v1",
    "data": [
        {
            "employeeId": "e1000001-0000-0000-0000-000000000033",
            "fullName": "Đặng Thị Bé",
            "avatar": "https://i.pravatar.cc/150?img=25",
            "skills": [
                "Nấu ăn",
                "Đi chợ"
            ],
            "rating": "4.10/5 · Tốt",
            "status": "AVAILABLE",
            "workingWards": [
                "Phường Thủ Dầu Một"
            ],
            "workingCity": "Thành phố Hồ Chí Minh",
            "completedJobs": 20,
            "recommendation": {
                "score": 0.707,
                "modelVersion": "employee-rec-v1",
                "featureSignals": {
                    "rating": 0.4,
                    "completedJobs": 0.46211715726000974,
                    "locationAffinity": 1.0,
                    "skillVersatility": 0.25,
                    "bookingTimeFit": 0.7
                }
            }
        },
        {
            "employeeId": "e1000001-0000-0000-0000-000000000017",
            "fullName": "Nguyễn Văn Ba",
            "avatar": "https://i.pravatar.cc/150?img=51",
            "skills": [
                "Vệ sinh nhà cửa",
                "Lau dọn"
            ],
            "rating": "4.10/5 · Tốt",
            "status": "AVAILABLE",
            "workingWards": [
                "Phường Thủ Dầu Một"
            ],
            "workingCity": "Thành phố Hồ Chí Minh",
            "completedJobs": 15,
            "recommendation": {
                "score": 0.703,
                "modelVersion": "employee-rec-v1",
                "featureSignals": {
                    "rating": 0.4,
                    "completedJobs": 0.35835739835078595,
                    "locationAffinity": 1.0,
                    "skillVersatility": 0.25,
                    "bookingTimeFit": 0.7
                }
            }
        },
        {
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "fullName": "Jane Smith",
            "avatar": "https://picsum.photos/200",
            "skills": [
                "Cleaning",
                "Organizing"
            ],
            "rating": "4.24/5 · Tốt",
            "status": "AVAILABLE",
            "workingWards": [
                "Phường Thủ Dầu Một"
            ],
            "workingCity": "Thành phố Hồ Chí Minh",
            "completedJobs": 14,
            "recommendation": {
                "score": 0.702,
                "modelVersion": "employee-rec-v1",
                "featureSignals": {
                    "rating": 0.4,
                    "completedJobs": 0.3363755443363322,
                    "locationAffinity": 1.0,
                    "skillVersatility": 0.25,
                    "bookingTimeFit": 0.7
                }
            }
        }
    ]
}
```

### Bước 2: Tạo booking với nhân viên đã chọn
**POST** `/api/v1/customer/bookings`
- Content-Type: `multipart/form-data`
- Authorization: `Bearer {accessToken}`

**Input**:
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000001",
  "bookingTime": "2025-11-20T14:00:00",
  "note": "Chọn nhân viên Jane Smith",
  "bookingDetails": [
    {
      "serviceId": 1,
      "quantity": 1
    }
  ],
  "assignments": [
    {
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "serviceId": 1
    }
  ],
  "paymentMethodId": 1
}
```

**Output**:
```json
{
    "data": {
        "bookingId": "d763d13f-f07c-465c-98bf-b013fad5a87d",
        "bookingCode": "BK49456014",
        "status": "PENDING",
        "totalAmount": 50000.00,
        "formattedTotalAmount": "50,000đ",
        "bookingTime": "2025-11-20T14:00:00",
        "createdAt": "2025-11-09T17:25:49.463228",
        "title": null,
        "imageUrls": [],
        "isVerified": true,
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
                "bookingDetailId": "37f09412-1d33-4b61-bb9e-dfa301dfea89",
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
                "assignments": [
                    {
                        "assignmentId": "cf24a19a-c5aa-4c06-a588-1dd478d0120e",
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
        "paymentInfo": {
            "paymentId": "d491ce05-f740-4c3c-af68-bb1bab682c04",
            "amount": 50000.00,
            "paymentMethod": "Thanh toán tiền mặt",
            "paymentStatus": "PENDING",
            "transactionCode": "TXN_1762683949456",
            "createdAt": "2025-11-09 17:25:49",
            "paidAt": null
        },
        "promotionApplied": null,
        "assignedEmployees": [
            {
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
            }
        ],
        "totalServices": 1,
        "totalEmployees": 1,
        "estimatedDuration": "2 giờ 0 phút",
        "hasPromotion": false,
        "hasAutoAssignedEmployees": false
    },
    "success": true
}
```

---

## LUỒNG 3: Đặt booking - Post

### Bước 1: Tạo booking post với title và imageUrls
**POST** `/api/v1/customer/bookings`
- Content-Type: `multipart/form-data`
- Authorization: `Bearer {accessToken}`

**Input** (Form-data):
- `booking` (JSON):
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000001",
  "bookingTime": "2025-11-21T08:00:00",
  "title": "Cần dọn dẹp nhà gấp vào rạng sáng",
  "note": "Không tìm thấy nhân viên, tạo post",
  "bookingDetails": [
    {
      "serviceId": 1,
      "quantity": 1
    }
  ],
  "paymentMethodId": 1
}
```
- `images` (Files): 1 ảnh nhà cần dọn dẹp

**Output**:
```json
{
    "data": {
        "bookingId": "e2976bf2-4832-4ca4-abf0-6ced833a7c68",
        "bookingCode": "BK45990214",
        "status": "AWAITING_EMPLOYEE",
        "totalAmount": 50000.00,
        "formattedTotalAmount": "50,000đ",
        "bookingTime": "2025-11-21T08:00:00",
        "createdAt": "2025-11-09T17:27:25.99763",
        "title": "Cần dọn dẹp nhà gấp vào rạng sáng",
        "imageUrls": ["https://res.cloudinary.com/..."],
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
                "bookingDetailId": "2dac8107-6fd8-4fa2-a627-1c86d4617181",
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
            "paymentId": "428f0328-92a6-42e4-8214-a0a2f16b51e5",
            "amount": 50000.00,
            "paymentMethod": "Thanh toán tiền mặt",
            "paymentStatus": "PENDING",
            "transactionCode": "TXN_1762684045989",
            "createdAt": "2025-11-09 17:27:26",
            "paidAt": null
        },
        "promotionApplied": null,
        "assignedEmployees": [],
        "totalServices": 1,
        "totalEmployees": 0,
        "estimatedDuration": "2 giờ 0 phút",
        "hasPromotion": false,
        "hasAutoAssignedEmployees": false
    },
    "success": true
}
```

---

## Lưu ý quan trọng

1. **Logic auto-assign kích hoạt** chỉ khi:
   - `assignments` = null hoặc []
   - `title` = null hoặc ""
   - `imageUrls` = null hoặc []

2. **Nhân viên được chọn tự động**:
   - Nhân viên đầu tiên (best) từ `findSuitableEmployees`
   - Đã được sắp xếp theo recommendation score
   - Đảm bảo available trong time slot

3. **Booking Post** (Luồng 3):
   - Cần có `title` và/hoặc `imageUrls`
   - `isVerified = false`, cần admin approve
   - Không tự động assign nhân viên
