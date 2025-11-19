# Test Cases - Tạo Booking Mới Với Nhiều Ảnh

## API Endpoint
**POST** `/api/v1/customer/bookings`

## Content-Type
`multipart/form-data`

## Request Parameters

### 1. `booking` (required, application/json)
Request body dạng JSON string chứa thông tin booking:
```json
{
  "addressId": "string",
  "newAddress": {
    "streetAddress": "string",
    "provinceCode": "string",
    "districtCode": "string",
    "wardCode": "string"
  },
  "bookingTime": "ISO-8601 datetime",
  "note": "string (max 1000)",
  "title": "string (max 255)",
  "imageUrls": ["string (max 500)"],
  "promoCode": "string (max 20)",
  "bookingDetails": [{
    "serviceId": "string",
    "quantity": number
  }],
  "assignments": [{
    "employeeId": "string",
    "bookingDetailId": "string"
  }],
  "paymentMethodId": number
}
```

### 2. `images` (optional, multipart/form-data)
Danh sách file ảnh upload (0-10 ảnh)

---

## Test Cases

### **TC-BC-IMG-001: Tạo booking thành công không có ảnh**
**Mục đích:** Verify tạo booking thành công khi không upload ảnh

**Dữ liệu test:**
- Customer: `c1000001-0000-0000-0000-000000000004` (Nguyễn Văn An)
- Address: `adrs0001-0000-0000-0000-000000000009` (45 Nguyễn Huệ, Phường Phú An, TP.HCM)
- Service: Dọn dẹp theo giờ (base_price: 50,000đ/giờ)
- Employee: `e1000001-0000-0000-0000-000000000004` (Nguyễn Thị Mai)
- Payment Method: 1 (CASH - Thanh toán tiền mặt)

**Input:**
- `booking` (JSON):
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000009",
  "bookingTime": "2025-12-01T14:00:00",
  "note": "Cần dọn dẹp kỹ lưỡng phòng khách và phòng ngủ",
  "bookingDetails": [
    {
      "serviceId": "1",
      "quantity": 2
    }
  ],
  "assignments": [],
  "paymentMethodId": 1
}
```
- `images`: không truyền

**Expected Output:**
- Status Code: `201 Created`
- Response Body:
```json
{
  "success": true,
  "data": {
    "bookingId": "string (UUID)",
    "bookingCode": "BK12345678",
    "status": "CONFIRMED",
    "totalAmount": 100000,
    "formattedTotalAmount": "100.000 ₫",
    "bookingTime": "2025-12-01T14:00:00",
    "createdAt": "2025-11-06T...",
    "title": null,
    "imageUrls": [],
    "isVerified": true,
    "adminComment": null,
    "customerInfo": {
      "customerId": "c1000001-0000-0000-0000-000000000004",
      "fullName": "Nguyễn Văn An",
      "phoneNumber": "0987654321"
    },
    "serviceDetails": [
      {
        "serviceName": "Dọn dẹp theo giờ",
        "quantity": 2,
        "pricePerUnit": 50000,
        "subTotal": 100000
      }
    ],
    "paymentInfo": {
      "methodName": "Thanh toán tiền mặt",
      "status": "PENDING"
    },
    "assignedEmployees": [],
    "totalServices": 1,
    "totalEmployees": 0
  }
}
```

---

### **TC-BC-IMG-002: Tạo booking thành công với 1 ảnh**
**Mục đích:** Verify tạo booking thành công với 1 file ảnh (Booking Post - không có nhân viên)

**Dữ liệu test:**
- Customer: `c1000001-0000-0000-0000-000000000005` (Trần Thị Bích)
- Address: `adrs0001-0000-0000-0000-000000000010` (128 Trần Hưng Đạo, Phường Chánh Hiệp, TP.HCM)
- Service: Tổng vệ sinh (base_price: 100,000đ/gói)
- Payment Method: 2 (MOMO - Ví điện tử Momo)

**Input:**
- `booking` (JSON):
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000010",
  "bookingTime": "2025-12-01T14:00:00",
  "title": "Cần dọn dẹp nhà cấp tốc",
  "note": "Nhà có diện tích 50m2, cần vệ sinh tổng quát",
  "bookingDetails": [
    {
      "serviceId": "2",
      "quantity": 1
    }
  ],
  "assignments": [],
  "paymentMethodId": 2
}
```
- `images`: 1 file (image001.jpg, 2MB, image/jpeg)

**Expected Output:**
- Status Code: `201 Created`
- Response Body:
```json
{
  "success": true,
  "data": {
    "bookingId": "string (UUID)",
    "bookingCode": "BK12345678",
    "status": "AWAITING_EMPLOYEE",
    "totalAmount": 100000,
    "formattedTotalAmount": "100.000 ₫",
    "bookingTime": "2025-12-01T14:00:00",
    "createdAt": "2025-11-06T...",
    "title": "Cần dọn dẹp nhà cấp tốc",
    "imageUrls": [
      "https://res.cloudinary.com/.../image001.jpg"
    ],
    "isVerified": false,
    "adminComment": null,
    "customerInfo": {
      "customerId": "c1000001-0000-0000-0000-000000000005",
      "fullName": "Trần Thị Bích",
      "phoneNumber": "0976543210"
    },
    "serviceDetails": [
      {
        "serviceName": "Tổng vệ sinh",
        "quantity": 1,
        "pricePerUnit": 100000,
        "subTotal": 100000
      }
    ],
    "paymentInfo": {
      "methodName": "Ví điện tử Momo",
      "status": "PENDING"
    },
    "assignedEmployees": [],
    "totalServices": 1,
    "totalEmployees": 0
  }
}
```

---

### **TC-BC-IMG-003: Tạo booking thành công với nhiều ảnh (5 ảnh)**
**Mục đích:** Verify tạo booking thành công với nhiều file ảnh

**Dữ liệu test:**
- Customer: `c1000001-0000-0000-0000-000000000006` (Lê Văn Cường)
- Address: `adrs0001-0000-0000-0000-000000000011` (234 Võ Văn Tần, Phường Bến Cát, TP.HCM)
- Service: Vệ sinh Sofa - Nệm - Rèm (base_price: 300,000đ/gói)
- Payment Method: 3 (VNPAY - Cổng thanh toán VNPAY)

**Input:**
- `booking` (JSON):
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000011",
  "bookingTime": "2025-12-01T14:00:00",
  "title": "Cần vệ sinh sofa và rèm cửa",
  "note": "Nhà có 1 bộ sofa da, 2 bộ rèm cửa phòng khách",
  "bookingDetails": [
    {
      "serviceId": "3",
      "quantity": 1
    }
  ],
  "assignments": [],
  "paymentMethodId": 3
}
```
- `images`: 5 files (image1.jpg, image2.png, image3.jpeg, image4.jpg, image5.png - mỗi file ~3MB)

**Expected Output:**
- Status Code: `201 Created`
- Response Body:
```json
{
  "success": true,
  "data": {
    "bookingId": "string (UUID)",
    "bookingCode": "BK12345678",
    "status": "AWAITING_EMPLOYEE",
    "totalAmount": 300000,
    "formattedTotalAmount": "300.000 ₫",
    "bookingTime": "2025-12-01T14:00:00",
    "createdAt": "2025-11-06T...",
    "title": "Cần vệ sinh sofa và rèm cửa",
    "imageUrls": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.png",
      "https://res.cloudinary.com/.../image3.jpeg",
      "https://res.cloudinary.com/.../image4.jpg",
      "https://res.cloudinary.com/.../image5.png"
    ],
    "isVerified": false,
    "adminComment": null,
    "customerInfo": {
      "customerId": "c1000001-0000-0000-0000-000000000006",
      "fullName": "Lê Văn Cường",
      "phoneNumber": "0965432109"
    },
    "serviceDetails": [
      {
        "serviceName": "Vệ sinh Sofa - Nệm - Rèm",
        "quantity": 1,
        "pricePerUnit": 300000,
        "subTotal": 300000
      }
    ],
    "paymentInfo": {
      "methodName": "Cổng thanh toán VNPAY",
      "status": "PENDING"
    },
    "assignedEmployees": [],
    "totalServices": 1,
    "totalEmployees": 0
  }
}
```

---

### **TC-BC-IMG-004: Tạo booking thành công với số lượng ảnh tối đa (10 ảnh)**
**Mục đích:** Verify tạo booking thành công với số lượng ảnh tối đa cho phép

**Dữ liệu test:**
- Customer: `c1000001-0000-0000-0000-000000000007` (Phạm Thị Dung)
- Address: `adrs0001-0000-0000-0000-000000000012` (567 Cách Mạng Tháng 8, Phường Chánh Phú Hòa, TP.HCM)
- Services: Tổng vệ sinh (x2) + Vệ sinh máy lạnh (x2)
- Payment Method: 4 (BANK_TRANSFER - Chuyển khoản ngân hàng)

**Input:**
- `booking` (JSON):
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000012",
  "bookingTime": "2025-12-01T14:00:00",
  "title": "Cần dọn dẹp toàn bộ căn hộ và vệ sinh máy lạnh",
  "note": "Căn hộ 3 phòng ngủ, 2 máy lạnh cần vệ sinh",
  "bookingDetails": [
    {
      "serviceId": "2",
      "quantity": 2
    },
    {
      "serviceId": "4",
      "quantity": 2
    }
  ],
  "assignments": [],
  "paymentMethodId": 4
}
```
- `images`: 10 files (img1.jpg đến img10.jpg - mỗi file ~2MB)

**Expected Output:**
- Status Code: `201 Created`
- Response Body:
```json
{
  "success": true,
  "data": {
    "bookingId": "string (UUID)",
    "bookingCode": "BK12345678",
    "status": "AWAITING_EMPLOYEE",
    "totalAmount": 500000,
    "formattedTotalAmount": "500.000 ₫",
    "imageUrls": [
      "https://res.cloudinary.com/.../img1.jpg",
      "https://res.cloudinary.com/.../img2.jpg",
      "https://res.cloudinary.com/.../img3.jpg",
      "https://res.cloudinary.com/.../img4.jpg",
      "https://res.cloudinary.com/.../img5.jpg",
      "https://res.cloudinary.com/.../img6.jpg",
      "https://res.cloudinary.com/.../img7.jpg",
      "https://res.cloudinary.com/.../img8.jpg",
      "https://res.cloudinary.com/.../img9.jpg",
      "https://res.cloudinary.com/.../img10.jpg"
    ],
    "isVerified": false,
    "customerInfo": {
      "customerId": "c1000001-0000-0000-0000-000000000007",
      "fullName": "Phạm Thị Dung",
      "phoneNumber": "0954321098"
    },
    "serviceDetails": [
      {
        "serviceName": "Tổng vệ sinh",
        "quantity": 2,
        "pricePerUnit": 100000,
        "subTotal": 200000
      },
      {
        "serviceName": "Vệ sinh máy lạnh",
        "quantity": 2,
        "pricePerUnit": 150000,
        "subTotal": 300000
      }
    ],
    "totalServices": 2
  }
}
```

---

### **TC-BC-IMG-005: Tạo booking thất bại - Vượt quá số lượng ảnh cho phép (11 ảnh)**
**Mục đích:** Verify hệ thống từ chối khi upload quá 10 ảnh

**Input:**
- `booking` (JSON): [valid booking data]
- `images`: 11 files (img1.jpg đến img11.jpg)

**Expected Output:**
- Status Code: `400 Bad Request`
- Response Body:
```json
{
  "success": false,
  "message": "Số lượng ảnh không được vượt quá 10"
}
```

---

### **TC-BC-IMG-006: Tạo booking thất bại - File không phải ảnh**
**Mục đích:** Verify hệ thống từ chối file không phải định dạng ảnh

**Input:**
- `booking` (JSON): [valid booking data]
- `images`: 
  - file1.jpg (image/jpeg) ✓
  - document.pdf (application/pdf) ✗
  - file3.png (image/png) ✓

**Expected Output:**
- Status Code: `400 Bad Request`
- Response Body:
```json
{
  "success": false,
  "message": "Tất cả file phải là định dạng ảnh"
}
```

---

### **TC-BC-IMG-007: Tạo booking thất bại - File ảnh quá lớn**
**Mục đích:** Verify hệ thống từ chối file ảnh vượt quá 10MB

**Input:**
- `booking` (JSON): [valid booking data]
- `images`: 
  - image1.jpg (5MB) ✓
  - large-image.jpg (15MB) ✗

**Expected Output:**
- Status Code: `400 Bad Request`
- Response Body:
```json
{
  "success": false,
  "message": "Kích thước mỗi file không được vượt quá 10MB"
}
```

---

### **TC-BC-IMG-008: Tạo booking thất bại - Upload ảnh lỗi Cloudinary**
**Mục đích:** Verify xử lý lỗi khi không upload được lên Cloudinary

**Input:**
- `booking` (JSON): [valid booking data]
- `images`: 1 file (image.jpg, 2MB)
- **Giả lập:** Cloudinary service throw exception

**Expected Output:**
- Status Code: `500 Internal Server Error`
- Response Body:
```json
{
  "success": false,
  "message": "Lỗi khi tải ảnh lên: [error details]"
}
```

---

### **TC-BC-IMG-009: Tạo booking thành công - File ảnh empty được bỏ qua**
**Mục đích:** Verify hệ thống bỏ qua file ảnh rỗng

**Input:**
- `booking` (JSON): [valid booking data]
- `images`: 
  - image1.jpg (2MB) ✓
  - empty.jpg (0 bytes - empty file) ✗
  - image3.png (3MB) ✓

**Expected Output:**
- Status Code: `201 Created`
- Response Body:
```json
{
  "success": true,
  "data": {
    "bookingId": "string",
    "bookingCode": "BK12345678",
    "imageUrls": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image3.png"
    ]
  }
}
```

---

### **TC-BC-IMG-010: Tạo booking thành công - Nhiều định dạng ảnh khác nhau**
**Mục đích:** Verify hệ thống chấp nhận các định dạng ảnh khác nhau

**Input:**
- `booking` (JSON): [valid booking data]
- `images`: 
  - photo.jpg (image/jpeg) ✓
  - screenshot.png (image/png) ✓
  - diagram.gif (image/gif) ✓
  - photo.webp (image/webp) ✓

**Expected Output:**
- Status Code: `201 Created`
- Response Body:
```json
{
  "success": true,
  "data": {
    "bookingId": "string",
    "bookingCode": "BK12345678",
    "imageUrls": [
      "https://res.cloudinary.com/.../photo.jpg",
      "https://res.cloudinary.com/.../screenshot.png",
      "https://res.cloudinary.com/.../diagram.gif",
      "https://res.cloudinary.com/.../photo.webp"
    ]
  }
}
```

---

### **TC-BC-IMG-011: Tạo booking thất bại - JSON booking không hợp lệ**
**Mục đích:** Verify xử lý khi JSON booking bị lỗi format

**Input:**
- `booking` (JSON - invalid format):
```json
{
  "addressId": "addr001",
  "bookingTime": "invalid-datetime",
  "bookingDetails": "not-an-array"
}
```
- `images`: 2 valid image files

**Expected Output:**
- Status Code: `400 Bad Request`
- Response Body:
```json
{
  "success": false,
  "message": "Invalid booking data format: [parsing error details]"
}
```

---

### **TC-BC-IMG-012: Tạo booking thành công - Booking có nhân viên với ảnh**
**Mục đích:** Verify tạo booking thông thường (có nhân viên) kèm ảnh

**Dữ liệu test:**
- Customer: `c1000001-0000-0000-0000-000000000008` (Hoàng Văn Em)
- Address: `adrs0001-0000-0000-0000-000000000013` (89 Lý Thường Kiệt, Phường Long Nguyên, TP.HCM)
- Service: Giặt sấy theo kg (base_price: 30,000đ/kg)
- Employee: `e1000001-0000-0000-0000-000000000011` (Bùi Thị Tâm - chuyên giặt ủi)
- Payment Method: 1 (CASH)

**Input:**
- `booking` (JSON):
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000013",
  "bookingTime": "2025-12-01T14:00:00",
  "note": "Giặt quần áo gia đình, cẩn thận với quần áo trẻ em",
  "bookingDetails": [
    {
      "serviceId": "5",
      "quantity": 10
    }
  ],
  "assignments": [
    {
      "employeeId": "e1000001-0000-0000-0000-000000000011",
      "bookingDetailId": "temp-detail-001"
    }
  ],
  "paymentMethodId": 1
}
```
- `images`: 3 valid image files (hinh-quan-ao-1.jpg, hinh-quan-ao-2.jpg, hinh-quan-ao-3.jpg)

**Expected Output:**
- Status Code: `201 Created`
- Response Body:
```json
{
  "success": true,
  "data": {
    "bookingId": "string (UUID)",
    "bookingCode": "BK12345678",
    "status": "CONFIRMED",
    "totalAmount": 300000,
    "formattedTotalAmount": "300.000 ₫",
    "imageUrls": [
      "https://res.cloudinary.com/.../hinh-quan-ao-1.jpg",
      "https://res.cloudinary.com/.../hinh-quan-ao-2.jpg",
      "https://res.cloudinary.com/.../hinh-quan-ao-3.jpg"
    ],
    "isVerified": true,
    "customerInfo": {
      "customerId": "c1000001-0000-0000-0000-000000000008",
      "fullName": "Hoàng Văn Em",
      "phoneNumber": "0943210987"
    },
    "serviceDetails": [
      {
        "serviceName": "Giặt sấy theo kg",
        "quantity": 10,
        "pricePerUnit": 30000,
        "subTotal": 300000
      }
    ],
    "assignedEmployees": [
      {
        "employeeId": "e1000001-0000-0000-0000-000000000011",
        "employeeName": "Bùi Thị Tâm",
        "skills": ["Giặt ủi", "Chăm sóc quần áo"]
      }
    ],
    "totalEmployees": 1
  }
}
```

---

### **TC-BC-IMG-013: Tạo booking thành công - Booking post (không nhân viên) với ảnh**
**Mục đích:** Verify tạo booking post kèm ảnh

**Dữ liệu test:**
- Customer: `c1000001-0000-0000-0000-000000000009` (Võ Thị Phương)
- Address: `adrs0001-0000-0000-0000-000000000014` (321 Hoàng Văn Thụ, Phường Tây Nam, TP.HCM)
- Service: Nấu ăn gia đình (base_price: 60,000đ/giờ)
- Payment Method: 2 (MOMO)

**Input:**
- `booking` (JSON):
```json
{
  "addressId": "adrs0001-0000-0000-0000-000000000014",
  "bookingTime": "2025-12-01T14:00:00",
  "title": "Cần người nấu ăn cho gia đình 8 người",
  "note": "Nấu 3 bữa (sáng, trưa, tối), món Việt truyền thống",
  "bookingDetails": [
    {
      "serviceId": "7",
      "quantity": 6
    }
  ],
  "assignments": [],
  "paymentMethodId": 2
}
```
- `images`: 4 valid image files (kitchen-1.jpg, kitchen-2.jpg, menu-example-1.jpg, menu-example-2.jpg)

**Expected Output:**
- Status Code: `201 Created`
- Response Body:
```json
{
  "success": true,
  "data": {
    "bookingId": "string (UUID)",
    "bookingCode": "BK12345678",
    "status": "AWAITING_EMPLOYEE",
    "totalAmount": 360000,
    "formattedTotalAmount": "360.000 ₫",
    "title": "Cần người nấu ăn cho gia đình 8 người",
    "imageUrls": [
      "https://res.cloudinary.com/.../kitchen-1.jpg",
      "https://res.cloudinary.com/.../kitchen-2.jpg",
      "https://res.cloudinary.com/.../menu-example-1.jpg",
      "https://res.cloudinary.com/.../menu-example-2.jpg"
    ],
    "isVerified": false,
    "adminComment": null,
    "customerInfo": {
      "customerId": "c1000001-0000-0000-0000-000000000009",
      "fullName": "Võ Thị Phương",
      "phoneNumber": "0932109876"
    },
    "serviceDetails": [
      {
        "serviceName": "Nấu ăn gia đình",
        "quantity": 6,
        "pricePerUnit": 60000,
        "subTotal": 360000
      }
    ],
    "paymentInfo": {
      "methodName": "Ví điện tử Momo",
      "status": "PENDING"
    },
    "assignedEmployees": [],
    "totalEmployees": 0
  }
}
```

---

### **TC-BC-IMG-014: Tạo booking thất bại - Thiếu phần booking (required)**
**Mục đích:** Verify xử lý khi không có dữ liệu booking

**Input:**
- `booking`: không truyền hoặc null
- `images`: 2 valid image files

**Expected Output:**
- Status Code: `400 Bad Request`
- Response Body:
```json
{
  "success": false,
  "message": "Invalid booking data format: [error details]"
}
```

---

### **TC-BC-IMG-015: Tạo booking thành công - Ảnh có kích thước đúng giới hạn (10MB)**
**Mục đích:** Verify hệ thống chấp nhận file ảnh đúng 10MB

**Input:**
- `booking` (JSON): [valid booking data]
- `images`: 
  - image1.jpg (10MB - exactly at limit) ✓
  - image2.jpg (9.5MB) ✓

**Expected Output:**
- Status Code: `201 Created`
- Response Body:
```json
{
  "success": true,
  "data": {
    "bookingId": "string",
    "bookingCode": "BK12345678",
    "imageUrls": [
      "https://res.cloudinary.com/.../image1.jpg",
      "https://res.cloudinary.com/.../image2.jpg"
    ]
  }
}
```

---

## Validation Rules Summary

### Images Validation:
1. **Số lượng ảnh:** Tối đa 10 ảnh
2. **Định dạng file:** Chỉ chấp nhận file có `Content-Type` bắt đầu với `image/`
3. **Kích thước file:** Mỗi file tối đa 10MB
4. **File rỗng:** Tự động bỏ qua, không gây lỗi
5. **Upload lỗi:** Trả về lỗi 500 với thông báo chi tiết

### Booking Data Validation:
1. **booking:** Required, phải là JSON hợp lệ
2. **images:** Optional, có thể không truyền hoặc truyền danh sách rỗng

### Response Behavior:
1. Nếu upload thành công → `imageUrls` chứa danh sách URL từ Cloudinary
2. Nếu không upload ảnh → `imageUrls = []`
3. Thứ tự URL trong response tương ứng với thứ tự upload
4. Mỗi URL từ Cloudinary có format: `https://res.cloudinary.com/{cloud_name}/...`

---

## Notes
- API sử dụng `multipart/form-data` để hỗ trợ upload file
- Phần `booking` được truyền dưới dạng JSON string (part name: "booking")
- Phần `images` được truyền dưới dạng danh sách file (part name: "images")
- Ảnh được upload lên Cloudinary trước khi tạo booking
- Nếu có lỗi khi upload ảnh, booking sẽ không được tạo
- Hệ thống validate từng file ảnh một, nếu có 1 file invalid → reject toàn bộ request

---

## Data Reference - Dữ liệu Test Có Sẵn Trong Database

### Customers (Khách hàng)
| Customer ID | Full Name | Phone | Email |
|------------|-----------|-------|-------|
| c1000001-0000-0000-0000-000000000001 | John Doe | 0901234567 | john.doe@example.com |
| c1000001-0000-0000-0000-000000000004 | Nguyễn Văn An | 0987654321 | nguyenvanan@gmail.com |
| c1000001-0000-0000-0000-000000000005 | Trần Thị Bích | 0976543210 | tranthibich@gmail.com |
| c1000001-0000-0000-0000-000000000006 | Lê Văn Cường | 0965432109 | levancuong@gmail.com |
| c1000001-0000-0000-0000-000000000007 | Phạm Thị Dung | 0954321098 | phamthidung@gmail.com |
| c1000001-0000-0000-0000-000000000008 | Hoàng Văn Em | 0943210987 | hoangvanem@gmail.com |
| c1000001-0000-0000-0000-000000000009 | Võ Thị Phương | 0932109876 | vothiphuong@gmail.com |
| c1000001-0000-0000-0000-000000000010 | Đặng Văn Giang | 0921098765 | dangvangiang@gmail.com |

### Addresses (Địa chỉ)
| Address ID | Customer ID | Full Address | Ward | City |
|------------|-------------|--------------|------|------|
| adrs0001-0000-0000-0000-000000000001 | c1000001-0000-0000-0000-000000000001 | 123 Lê Trọng Tấn, Phường Thủ Dầu Một | Phường Thủ Dầu Một | Thành phố Hồ Chí Minh |
| adrs0001-0000-0000-0000-000000000009 | c1000001-0000-0000-0000-000000000004 | 45 Nguyễn Huệ, Phường Phú An | Phường Phú An | Thành phố Hồ Chí Minh |
| adrs0001-0000-0000-0000-000000000010 | c1000001-0000-0000-0000-000000000005 | 128 Trần Hưng Đạo, Phường Chánh Hiệp | Phường Chánh Hiệp | Thành phố Hồ Chí Minh |
| adrs0001-0000-0000-0000-000000000011 | c1000001-0000-0000-0000-000000000006 | 234 Võ Văn Tần, Phường Bến Cát | Phường Bến Cát | Thành phố Hồ Chí Minh |
| adrs0001-0000-0000-0000-000000000012 | c1000001-0000-0000-0000-000000000007 | 567 Cách Mạng Tháng 8, Phường Chánh Phú Hòa | Phường Chánh Phú Hòa | Thành phố Hồ Chí Minh |
| adrs0001-0000-0000-0000-000000000013 | c1000001-0000-0000-0000-000000000008 | 89 Lý Thường Kiệt, Phường Long Nguyên | Phường Long Nguyên | Thành phố Hồ Chí Minh |
| adrs0001-0000-0000-0000-000000000014 | c1000001-0000-0000-0000-000000000009 | 321 Hoàng Văn Thụ, Phường Tây Nam | Phường Tây Nam | Thành phố Hồ Chí Minh |

### Services (Dịch vụ)
| Service ID | Service Name | Category | Base Price | Unit | Estimated Duration |
|------------|--------------|----------|------------|------|-------------------|
| 1 | Dọn dẹp theo giờ | Dọn dẹp nhà | 50,000đ | Giờ | 2.0h |
| 2 | Tổng vệ sinh | Dọn dẹp nhà | 100,000đ | Gói | 2.0h |
| 3 | Vệ sinh Sofa - Nệm - Rèm | Dọn dẹp nhà | 300,000đ | Gói | 3.0h |
| 4 | Vệ sinh máy lạnh | Dọn dẹp nhà | 150,000đ | Máy | 1.0h |
| 5 | Giặt sấy theo kg | Giặt ủi | 30,000đ | Kg | 24.0h |
| 6 | Giặt hấp cao cấp | Giặt ủi | 120,000đ | Bộ | 48.0h |
| 7 | Nấu ăn gia đình | Việc nhà khác | 60,000đ | Giờ | 2.5h |
| 8 | Đi chợ hộ | Việc nhà khác | 40,000đ | Lần | 1.0h |

### Employees (Nhân viên)
| Employee ID | Full Name | Skills | Working Zone |
|-------------|-----------|--------|--------------|
| e1000001-0000-0000-0000-000000000001 | Jane Smith | Cleaning, Organizing | Phường Thủ Dầu Một |
| e1000001-0000-0000-0000-000000000002 | Bob Wilson | Deep Cleaning, Laundry | Phường Phú Lợi |
| e1000001-0000-0000-0000-000000000003 | Trần Văn Long | Vệ sinh tổng quát, Lau dọn | Phường Bình Dương |
| e1000001-0000-0000-0000-000000000004 | Nguyễn Thị Mai | Giặt ủi, Nấu ăn | Phường Phú An |
| e1000001-0000-0000-0000-000000000005 | Lê Văn Nam | Vệ sinh máy lạnh, Sửa chữa nhỏ | Phường Chánh Hiệp |
| e1000001-0000-0000-0000-000000000007 | Hoàng Thị Phương | Vệ sinh sofa, Giặt thảm | Phường Chánh Phú Hòa |
| e1000001-0000-0000-0000-000000000009 | Đặng Thị Rượu | Nấu ăn, Đi chợ | Phường Tây Nam |
| e1000001-0000-0000-0000-000000000011 | Bùi Thị Tâm | Giặt ủi, Chăm sóc quần áo | Phường Hòa Lợi |

### Payment Methods (Phương thức thanh toán)
| Method ID | Method Code | Method Name | Active |
|-----------|-------------|-------------|--------|
| 1 | CASH | Thanh toán tiền mặt | ✓ |
| 2 | MOMO | Ví điện tử Momo | ✓ |
| 3 | VNPAY | Cổng thanh toán VNPAY | ✓ |
| 4 | BANK_TRANSFER | Chuyển khoản ngân hàng | ✓ |

### Promotions (Mã khuyến mãi)
| Promo Code | Description | Discount Type | Discount Value | Max Discount |
|------------|-------------|---------------|----------------|--------------|
| GIAM20K | Giảm giá 20,000đ cho mọi đơn hàng | FIXED_AMOUNT | 20,000đ | - |
| KHAITRUONG10 | Giảm 10% mừng khai trương | PERCENTAGE | 10% | 50,000đ |

---

## Example cURL Commands

### Tạo booking không có ảnh
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Authorization: Bearer {token}" \
  -F 'booking={"addressId":"adrs0001-0000-0000-0000-000000000009","bookingTime":"2025-12-01T14:00:00","note":"Test booking","bookingDetails":[{"serviceId":"1","quantity":2}],"assignments":[],"paymentMethodId":1}'
```

### Tạo booking với 3 ảnh
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Authorization: Bearer {token}" \
  -F 'booking={"addressId":"adrs0001-0000-0000-0000-000000000010","bookingTime":"2025-12-01T14:00:00","title":"Cần dọn dẹp","bookingDetails":[{"serviceId":"2","quantity":1}],"assignments":[],"paymentMethodId":2}' \
  -F 'images=@image1.jpg' \
  -F 'images=@image2.jpg' \
  -F 'images=@image3.jpg'
```
