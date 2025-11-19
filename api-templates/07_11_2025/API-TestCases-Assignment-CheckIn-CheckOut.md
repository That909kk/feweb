# API Test Cases - Assignment Check-In & Check-Out

## Endpoint: POST /api/v1/employee/assignments/{assignmentId}/check-in

### Mô tả
Endpoint cho phép nhân viên điểm danh bắt đầu công việc, có thể đính kèm nhiều ảnh minh chứng.

### Authorization
- **Required**: Yes
- **Role**: ROLE_EMPLOYEE

---

## Test Case 1: Check-in với nhiều ảnh thành công

### Input

#### Path Parameter
```
assignmentId: "ASG20241107001"
```

#### Request Parts

**Part 1: request (application/json)**
```json
{
  "employeeId": "EMP001",
  "imageDescription": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp"
}
```

**Part 2: images (multipart/form-data)**
```
- Số lượng: 5 files
- File 1: living_room_before.jpg (2.5 MB, image/jpeg)
- File 2: bedroom_before.jpg (1.8 MB, image/jpeg)
- File 3: kitchen_before.jpg (2.1 MB, image/jpeg)
- File 4: bathroom_before.jpg (1.5 MB, image/png)
- File 5: balcony_before.jpg (2.0 MB, image/jpeg)
```

#### cURL Example
```bash
curl -X POST "http://localhost:8080/api/v1/employee/assignments/ASG20241107001/check-in" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F 'request={"employeeId":"EMP001","imageDescription":"Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp"};type=application/json' \
  -F "images=@living_room_before.jpg" \
  -F "images=@bedroom_before.jpg" \
  -F "images=@kitchen_before.jpg" \
  -F "images=@bathroom_before.jpg" \
  -F "images=@balcony_before.jpg"
```

#### Postman Configuration
```
Method: POST
URL: http://localhost:8080/api/v1/employee/assignments/ASG20241107001/check-in

Headers:
- Authorization: Bearer <token>

Body (form-data):
- request (Text): 
  {
    "employeeId": "EMP001",
    "imageDescription": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp"
  }
- images (File): [Select multiple files]
  - living_room_before.jpg
  - bedroom_before.jpg
  - kitchen_before.jpg
  - bathroom_before.jpg
  - balcony_before.jpg
```

### Output

#### Response Status
```
200 OK
```

#### Response Body
```json
{
  "success": true,
  "message": "Điểm danh bắt đầu công việc thành công",
  "data": {
    "assignmentId": "ASG20241107001",
    "bookingId": "BKG20241107001",
    "employeeId": "EMP001",
    "employeeName": "Nguyễn Văn A",
    "employeePhone": "0901234567",
    "serviceCode": "SRV001",
    "serviceName": "Dọn dẹp nhà cửa",
    "bookingDateTime": "2024-11-07T09:00:00",
    "customerName": "Trần Thị B",
    "customerPhone": "0912345678",
    "customerAddress": "123 Nguyễn Huệ, Quận 1, TP.HCM",
    "status": "IN_PROGRESS",
    "checkInTime": "2024-11-07T09:05:30",
    "checkOutTime": null,
    "checkInImages": [
      {
        "imageId": "IMG001",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/living_room_before_1699334730.jpg",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      },
      {
        "imageId": "IMG002",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/bedroom_before_1699334730.jpg",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      },
      {
        "imageId": "IMG003",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/kitchen_before_1699334730.jpg",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      },
      {
        "imageId": "IMG004",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/bathroom_before_1699334730.png",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      },
      {
        "imageId": "IMG005",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/balcony_before_1699334730.jpg",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      }
    ],
    "checkOutImages": [],
    "note": null,
    "totalPrice": 500000,
    "duration": "3 giờ"
  }
}
```

### Expected Behavior
- ✅ Hệ thống chấp nhận tất cả 5 ảnh
- ✅ Tất cả ảnh được upload lên cloud storage
- ✅ Status của assignment chuyển sang `IN_PROGRESS`
- ✅ `checkInTime` được ghi nhận
- ✅ Tất cả ảnh đều có cùng `imageDescription`
- ✅ Response trả về đầy đủ thông tin assignment và danh sách ảnh

---

## Test Case 2: Check-in với quá nhiều ảnh (Validation Error)

### Input

#### Path Parameter
```
assignmentId: "ASG20241107002"
```

#### Request Parts

**Part 1: request (application/json)**
```json
{
  "employeeId": "EMP002",
  "imageDescription": "Ảnh kiểm tra trước khi làm"
}
```

**Part 2: images (multipart/form-data)**
```
- Số lượng: 11 files (vượt quá giới hạn 10)
- File 1-11: image_1.jpg, image_2.jpg, ..., image_11.jpg
```

### Output

#### Response Status
```
400 Bad Request
```

#### Response Body
```json
{
  "success": false,
  "message": "Số lượng ảnh không được vượt quá 10",
  "data": null
}
```

---

## Endpoint: POST /api/v1/employee/assignments/{assignmentId}/check-out

### Mô tả
Endpoint cho phép nhân viên chấm công kết thúc công việc, đính kèm nhiều ảnh kết quả công việc.

### Authorization
- **Required**: Yes
- **Role**: ROLE_EMPLOYEE

---

## Test Case 3: Check-out với nhiều ảnh thành công

### Input

#### Path Parameter
```
assignmentId: "ASG20241107001"
```

#### Request Parts

**Part 1: request (application/json)**
```json
{
  "employeeId": "EMP001",
  "imageDescription": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực"
}
```

**Part 2: images (multipart/form-data)**
```
- Số lượng: 8 files
- File 1: living_room_after.jpg (3.2 MB, image/jpeg)
- File 2: bedroom_after.jpg (2.8 MB, image/jpeg)
- File 3: kitchen_after.jpg (3.5 MB, image/jpeg)
- File 4: bathroom_after.jpg (2.2 MB, image/png)
- File 5: balcony_after.jpg (2.9 MB, image/jpeg)
- File 6: dining_room_after.jpg (2.6 MB, image/jpeg)
- File 7: floor_after.jpg (3.1 MB, image/jpeg)
- File 8: window_after.jpg (2.4 MB, image/jpeg)
```

#### cURL Example
```bash
curl -X POST "http://localhost:8080/api/v1/employee/assignments/ASG20241107001/check-out" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F 'request={"employeeId":"EMP001","imageDescription":"Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực"};type=application/json' \
  -F "images=@living_room_after.jpg" \
  -F "images=@bedroom_after.jpg" \
  -F "images=@kitchen_after.jpg" \
  -F "images=@bathroom_after.jpg" \
  -F "images=@balcony_after.jpg" \
  -F "images=@dining_room_after.jpg" \
  -F "images=@floor_after.jpg" \
  -F "images=@window_after.jpg"
```

#### Postman Configuration
```
Method: POST
URL: http://localhost:8080/api/v1/employee/assignments/ASG20241107001/check-out

Headers:
- Authorization: Bearer <token>

Body (form-data):
- request (Text): 
  {
    "employeeId": "EMP001",
    "imageDescription": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực"
  }
- images (File): [Select multiple files]
  - living_room_after.jpg
  - bedroom_after.jpg
  - kitchen_after.jpg
  - bathroom_after.jpg
  - balcony_after.jpg
  - dining_room_after.jpg
  - floor_after.jpg
  - window_after.jpg
```

### Output

#### Response Status
```
200 OK
```

#### Response Body
```json
{
  "success": true,
  "message": "Chấm công kết thúc công việc thành công",
  "data": {
    "assignmentId": "ASG20241107001",
    "bookingId": "BKG20241107001",
    "employeeId": "EMP001",
    "employeeName": "Nguyễn Văn A",
    "employeePhone": "0901234567",
    "serviceCode": "SRV001",
    "serviceName": "Dọn dẹp nhà cửa",
    "bookingDateTime": "2024-11-07T09:00:00",
    "customerName": "Trần Thị B",
    "customerPhone": "0912345678",
    "customerAddress": "123 Nguyễn Huệ, Quận 1, TP.HCM",
    "status": "COMPLETED",
    "checkInTime": "2024-11-07T09:05:30",
    "checkOutTime": "2024-11-07T12:10:45",
    "checkInImages": [
      {
        "imageId": "IMG001",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/living_room_before_1699334730.jpg",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      },
      {
        "imageId": "IMG002",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/bedroom_before_1699334730.jpg",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      },
      {
        "imageId": "IMG003",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/kitchen_before_1699334730.jpg",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      },
      {
        "imageId": "IMG004",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/bathroom_before_1699334730.png",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      },
      {
        "imageId": "IMG005",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkin/ASG20241107001/balcony_before_1699334730.jpg",
        "description": "Hình ảnh hiện trạng trước khi làm việc - phòng khách, phòng ngủ, nhà bếp",
        "uploadedAt": "2024-11-07T09:05:30"
      }
    ],
    "checkOutImages": [
      {
        "imageId": "IMG006",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkout/ASG20241107001/living_room_after_1699345845.jpg",
        "description": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực",
        "uploadedAt": "2024-11-07T12:10:45"
      },
      {
        "imageId": "IMG007",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkout/ASG20241107001/bedroom_after_1699345845.jpg",
        "description": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực",
        "uploadedAt": "2024-11-07T12:10:45"
      },
      {
        "imageId": "IMG008",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkout/ASG20241107001/kitchen_after_1699345845.jpg",
        "description": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực",
        "uploadedAt": "2024-11-07T12:10:45"
      },
      {
        "imageId": "IMG009",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkout/ASG20241107001/bathroom_after_1699345845.png",
        "description": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực",
        "uploadedAt": "2024-11-07T12:10:45"
      },
      {
        "imageId": "IMG010",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkout/ASG20241107001/balcony_after_1699345845.jpg",
        "description": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực",
        "uploadedAt": "2024-11-07T12:10:45"
      },
      {
        "imageId": "IMG011",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkout/ASG20241107001/dining_room_after_1699345845.jpg",
        "description": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực",
        "uploadedAt": "2024-11-07T12:10:45"
      },
      {
        "imageId": "IMG012",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkout/ASG20241107001/floor_after_1699345845.jpg",
        "description": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực",
        "uploadedAt": "2024-11-07T12:10:45"
      },
      {
        "imageId": "IMG013",
        "imageUrl": "https://storage.cloudinary.com/housekeeping/checkout/ASG20241107001/window_after_1699345845.jpg",
        "description": "Hình ảnh sau khi hoàn thành công việc - đã dọn dẹp sạch sẽ tất cả các khu vực",
        "uploadedAt": "2024-11-07T12:10:45"
      }
    ],
    "note": null,
    "totalPrice": 500000,
    "duration": "3 giờ",
    "actualWorkingTime": "3 giờ 5 phút"
  }
}
```

### Expected Behavior
- ✅ Hệ thống chấp nhận tất cả 8 ảnh
- ✅ Tất cả ảnh được upload lên cloud storage với folder riêng (checkout)
- ✅ Status của assignment chuyển sang `COMPLETED`
- ✅ `checkOutTime` được ghi nhận
- ✅ Tính được `actualWorkingTime` dựa trên checkInTime và checkOutTime
- ✅ Tất cả ảnh đều có cùng `imageDescription`
- ✅ Response trả về đầy đủ cả ảnh check-in và check-out
- ✅ Hệ thống có thể gửi notification cho customer về việc hoàn thành công việc

---

## Test Case 4: Check-out với file không phải ảnh (Validation Error)

### Input

#### Path Parameter
```
assignmentId: "ASG20241107003"
```

#### Request Parts

**Part 1: request (application/json)**
```json
{
  "employeeId": "EMP003",
  "imageDescription": "Kết quả công việc"
}
```

**Part 2: images (multipart/form-data)**
```
- Số lượng: 3 files
- File 1: result_1.jpg (2.0 MB, image/jpeg)
- File 2: report.pdf (1.5 MB, application/pdf) ❌ Không phải ảnh
- File 3: result_3.jpg (2.2 MB, image/jpeg)
```

### Output

#### Response Status
```
400 Bad Request
```

#### Response Body
```json
{
  "success": false,
  "message": "Tất cả file phải là định dạng ảnh",
  "data": null
}
```

---

## Validation Rules

### Số lượng ảnh
- **Tối đa**: 10 ảnh cho mỗi lần check-in hoặc check-out
- **Tối thiểu**: Không bắt buộc (có thể không gửi ảnh)

### Định dạng file
- **Chấp nhận**: image/jpeg, image/png, image/jpg, image/gif, image/webp
- **Không chấp nhận**: PDF, Word, Excel, Video, v.v.

### Kích thước file
- **Tối đa mỗi file**: 10 MB
- **Tổng kích thước**: Không giới hạn (nhưng nên < 100 MB cho performance)

### Image Description
- **Bắt buộc**: Không (optional)
- **Độ dài**: 0-500 ký tự
- **Mục đích**: Mô tả chung cho tất cả ảnh trong lần upload

---

## Notes

### Performance Considerations
- Upload nhiều ảnh có thể mất thời gian
- Nên implement progress indicator cho user experience tốt hơn
- Consider async upload hoặc chunked upload cho file lớn

### Storage Organization
```
/housekeeping/
  /checkin/
    /{assignmentId}/
      /image_1_{timestamp}.jpg
      /image_2_{timestamp}.jpg
  /checkout/
    /{assignmentId}/
      /image_1_{timestamp}.jpg
      /image_2_{timestamp}.jpg
```

### Error Scenarios
1. **Assignment không tồn tại**: 404 Not Found
2. **Employee không có quyền**: 403 Forbidden
3. **Assignment đã check-in rồi**: 400 Bad Request (for check-in)
4. **Assignment chưa check-in**: 400 Bad Request (for check-out)
5. **Quá nhiều ảnh**: 400 Bad Request
6. **File không đúng format**: 400 Bad Request
7. **File quá lớn**: 400 Bad Request
8. **Upload ảnh thất bại**: 500 Internal Server Error
