# API Test Cases - Booking Media Feature

## API Endpoints Covered
1. **POST /api/v1/employee/assignments/{assignmentId}/check-in** - Check-in with optional image
2. **POST /api/v1/employee/assignments/{assignmentId}/check-out** - Check-out with optional image
3. **GET /api/v1/booking-media/assignment/{assignmentId}** - Get all media for assignment
4. **GET /api/v1/booking-media/booking/{bookingId}** - Get all media for booking

---

## POST /api/v1/employee/assignments/{assignmentId}/check-in

### Test Case 1: Successfully Check-in With Image
- **Test Case ID**: TC_CHECKIN_001
- **Description**: Verify that an employee can check-in and upload an image successfully.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status.
  - Current time is within check-in window (10 minutes before to 5 minutes after booking time).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001","imageDescription":"Ảnh trước khi dọn phòng khách"}
    image: <image_file.jpg>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Điểm danh bắt đầu công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000001",
      "bookingCode": "BK000001",
      "serviceName": "Dọn dẹp theo giờ",
      "customerName": "John Doe",
      "customerPhone": "0901234567",
      "serviceAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
      "bookingTime": "2025-11-05 09:00:00",
      "estimatedDurationHours": 2.0,
      "pricePerUnit": 50000.00,
      "quantity": 1,
      "totalAmount": 100000.00,
      "status": "IN_PROGRESS",
      "assignedAt": "2025-11-04 08:00:00",
      "checkInTime": "2025-11-05 08:55:00",
      "checkOutTime": null,
      "note": "Nhà có trẻ nhỏ, vui lòng lau dọn kỹ"
    }
  }
  ```
- **Status Code**: `200 OK`
- **Additional Verification**: Image is uploaded to Cloudinary and saved in booking_media table with media_type = 'CHECK_IN_IMAGE'

---

### Test Case 2: Check-in With Invalid Image Type
- **Test Case ID**: TC_CHECKIN_002
- **Description**: Verify that check-in fails when uploading a non-image file.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    image: <document.pdf>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File phải là định dạng ảnh",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 3: Check-in With Oversized Image
- **Test Case ID**: TC_CHECKIN_003
- **Description**: Verify that check-in fails when uploading an image larger than 5MB.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    image: <large_image_6mb.jpg>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Kích thước file không được vượt quá 5MB",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 4: Check-in Outside Time Window
- **Test Case ID**: TC_CHECKIN_004
- **Description**: Verify that check-in fails when attempted outside the allowed time window.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status.
  - Current time is NOT within check-in window (more than 10 minutes before or 5 minutes after booking time).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ được điểm danh trong khoảng từ 08:50 05/11/2025 đến 09:05 05/11/2025",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 5: Check-in Already Checked-in Assignment
- **Test Case ID**: TC_CHECKIN_005
- **Description**: Verify that an assignment cannot be checked-in twice.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and already has checkInTime set.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Công việc đã được điểm danh bắt đầu",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

## POST /api/v1/employee/assignments/{assignmentId}/check-out

### Test Case 6: Successfully Check-out With Image
- **Test Case ID**: TC_CHECKOUT_001
- **Description**: Verify that an employee can check-out and upload an image successfully.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in IN_PROGRESS status.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-out`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001","imageDescription":"Ảnh sau khi hoàn thành dọn dẹp"}
    image: <image_file.jpg>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Chấm công kết thúc công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000001",
      "bookingCode": "BK000001",
      "serviceName": "Dọn dẹp theo giờ",
      "customerName": "John Doe",
      "customerPhone": "0901234567",
      "serviceAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
      "bookingTime": "2025-11-05 09:00:00",
      "estimatedDurationHours": 2.0,
      "pricePerUnit": 50000.00,
      "quantity": 1,
      "totalAmount": 100000.00,
      "status": "COMPLETED",
      "assignedAt": "2025-11-04 08:00:00",
      "checkInTime": "2025-11-05 08:55:00",
      "checkOutTime": "2025-11-05 11:00:00",
      "note": "Nhà có trẻ nhỏ, vui lòng lau dọn kỹ"
    }
  }
  ```
- **Status Code**: `200 OK`
- **Additional Verification**: Image is uploaded to Cloudinary and saved in booking_media table with media_type = 'CHECK_OUT_IMAGE'

---

### Test Case 7: Check-out Without Check-in
- **Test Case ID**: TC_CHECKOUT_002
- **Description**: Verify that check-out fails when assignment has not been checked-in.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status (not IN_PROGRESS).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-out`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ có thể chấm công kết thúc khi công việc đang được thực hiện",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

## GET /api/v1/booking-media/assignment/{assignmentId}

### Test Case 8: Successfully Get All Media for Assignment
- **Test Case ID**: TC_GET_MEDIA_001
- **Description**: Verify that all media for an assignment can be retrieved.
- **Preconditions**: 
  - User is authenticated (Employee, Customer, or Admin).
  - Assignment exists and has media uploaded.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/assignment/as000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "mediaId": "media001-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkin_job1.jpg",
        "publicId": "booking_images/checkin_job1",
        "mediaType": "CHECK_IN_IMAGE",
        "description": "Ảnh trước khi bắt đầu công việc",
        "uploadedAt": "2025-11-04T08:55:30"
      },
      {
        "mediaId": "media002-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkout_job1.jpg",
        "publicId": "booking_images/checkout_job1",
        "mediaType": "CHECK_OUT_IMAGE",
        "description": "Ảnh sau khi hoàn thành công việc",
        "uploadedAt": "2025-11-04T11:00:15"
      }
    ],
    "totalItems": 2
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 9: Get Media for Assignment With No Media
- **Test Case ID**: TC_GET_MEDIA_002
- **Description**: Verify that empty array is returned when assignment has no media.
- **Preconditions**: 
  - User is authenticated.
  - Assignment exists but has no media uploaded.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/assignment/as000002-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [],
    "totalItems": 0
  }
  ```
- **Status Code**: `200 OK`

---

## GET /api/v1/booking-media/booking/{bookingId}

### Test Case 10: Successfully Get All Media for Booking
- **Test Case ID**: TC_GET_BOOKING_MEDIA_001
- **Description**: Verify that all media for a booking (across all assignments) can be retrieved.
- **Preconditions**: 
  - User is authenticated.
  - Booking exists and has assignments with media uploaded.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/booking/b0000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "mediaId": "media001-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkin_job1.jpg",
        "publicId": "booking_images/checkin_job1",
        "mediaType": "CHECK_IN_IMAGE",
        "description": "Ảnh trước khi bắt đầu công việc",
        "uploadedAt": "2025-11-04T08:55:30"
      },
      {
        "mediaId": "media002-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkout_job1.jpg",
        "publicId": "booking_images/checkout_job1",
        "mediaType": "CHECK_OUT_IMAGE",
        "description": "Ảnh sau khi hoàn thành công việc",
        "uploadedAt": "2025-11-04T11:00:15"
      }
    ],
    "totalItems": 2
  }
  ```
- **Status Code**: `200 OK`

---

## Summary

### Coverage Summary
- ✅ Check-in with valid image
- ✅ Check-in with invalid file type
- ✅ Check-in with oversized file
- ✅ Check-in outside time window
- ✅ Duplicate check-in prevention
- ✅ Check-out with valid image
- ✅ Check-out without prior check-in
- ✅ Get all media for assignment
- ✅ Get media for assignment with no media
- ✅ Get all media for booking

### Total Test Cases: 10

### Key Features Tested
1. **Image Upload**: Valid image, invalid type, oversized file
2. **Check-in/Check-out**: Time window validation, status validation, duplicate prevention
3. **Media Retrieval**: By assignment, by booking, empty results
4. **Authentication**: All endpoints require valid authorization
5. **Error Handling**: Proper error messages and status codes

---

## POST /api/v1/employee/assignments/{assignmentId}/check-in

### Test Case 1: Successfully Check-in Without Image
- **Test Case ID**: TC_CHECKIN_001
- **Description**: Verify that an employee can check-in to an assignment without uploading an image.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status.
  - Current time is within check-in window (10 minutes before to 5 minutes after booking time).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Điểm danh bắt đầu công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "status": "IN_PROGRESS",
      "checkInTime": "2025-11-04T08:55:00",
      "checkOutTime": null
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Successfully Check-in With Image
- **Test Case ID**: TC_CHECKIN_002
- **Description**: Verify that an employee can check-in and upload an image successfully.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status.
  - Current time is within check-in window.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001","imageDescription":"Ảnh trước khi dọn phòng khách"}
    image: <image_file.jpg>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Điểm danh bắt đầu công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "status": "IN_PROGRESS",
      "checkInTime": "2025-11-04T08:55:00",
      "checkOutTime": null
    }
  }
  ```
- **Status Code**: `200 OK`
- **Additional Verification**: Image is uploaded to Cloudinary and saved in booking_media table with media_type = 'CHECK_IN_IMAGE'

---

### Test Case 3: Check-in With Invalid Image Type
- **Test Case ID**: TC_CHECKIN_003
- **Description**: Verify that check-in fails when uploading a non-image file.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    image: <document.pdf>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File phải là định dạng ảnh",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 4: Check-in With Oversized Image
- **Test Case ID**: TC_CHECKIN_004
- **Description**: Verify that check-in fails when uploading an image larger than 5MB.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    image: <large_image_6mb.jpg>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Kích thước file không được vượt quá 5MB",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 5: Check-in Outside Time Window
- **Test Case ID**: TC_CHECKIN_005
- **Description**: Verify that check-in fails when attempted outside the allowed time window.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status.
  - Current time is NOT within check-in window (more than 10 minutes before or 5 minutes after booking time).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ được điểm danh trong khoảng từ 08:50 05/11/2025 đến 09:05 05/11/2025",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 6: Check-in Already Checked-in Assignment
- **Test Case ID**: TC_CHECKIN_006
- **Description**: Verify that an assignment cannot be checked-in twice.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and already has checkInTime set.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Công việc đã được điểm danh bắt đầu",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

## POST /api/v1/employee/assignments/{assignmentId}/check-out

### Test Case 7: Successfully Check-out Without Image
- **Test Case ID**: TC_CHECKOUT_001
- **Description**: Verify that an employee can check-out from an assignment without uploading an image.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in IN_PROGRESS status.
  - Assignment has been checked-in.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-out`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Chấm công kết thúc công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "status": "COMPLETED",
      "checkInTime": "2025-11-04T08:55:00",
      "checkOutTime": "2025-11-04T11:00:00"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 8: Successfully Check-out With Image
- **Test Case ID**: TC_CHECKOUT_002
- **Description**: Verify that an employee can check-out and upload an image successfully.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in IN_PROGRESS status.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-out`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001","imageDescription":"Ảnh sau khi hoàn thành dọn dẹp"}
    image: <image_file.jpg>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Chấm công kết thúc công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "status": "COMPLETED",
      "checkInTime": "2025-11-04T08:55:00",
      "checkOutTime": "2025-11-04T11:00:00"
    }
  }
  ```
- **Status Code**: `200 OK`
- **Additional Verification**: Image is uploaded to Cloudinary and saved in booking_media table with media_type = 'CHECK_OUT_IMAGE'

---

### Test Case 9: Check-out Without Check-in
- **Test Case ID**: TC_CHECKOUT_003
- **Description**: Verify that check-out fails when assignment has not been checked-in.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and is in ASSIGNED status (not IN_PROGRESS).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-out`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ có thể chấm công kết thúc khi công việc đang được thực hiện",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 10: Check-out Already Completed Assignment
- **Test Case ID**: TC_CHECKOUT_004
- **Description**: Verify that an assignment cannot be checked-out twice.
- **Preconditions**: 
  - Employee is authenticated with valid token.
  - Assignment exists and already has checkOutTime set.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-out`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Công việc đã được chấm công kết thúc",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

## GET /api/v1/booking-media/assignment/{assignmentId}

### Test Case 11: Successfully Get All Media for Assignment
- **Test Case ID**: TC_GET_MEDIA_001
- **Description**: Verify that all media for an assignment can be retrieved.
- **Preconditions**: 
  - User is authenticated (Employee, Customer, or Admin).
  - Assignment exists and has media uploaded.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/assignment/as000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "mediaId": "media001-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkin_job1.jpg",
        "publicId": "booking_images/checkin_job1",
        "mediaType": "CHECK_IN_IMAGE",
        "description": "Ảnh trước khi bắt đầu công việc",
        "uploadedAt": "2025-11-04T08:55:30"
      },
      {
        "mediaId": "media002-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkout_job1.jpg",
        "publicId": "booking_images/checkout_job1",
        "mediaType": "CHECK_OUT_IMAGE",
        "description": "Ảnh sau khi hoàn thành công việc",
        "uploadedAt": "2025-11-04T11:00:15"
      }
    ],
    "totalItems": 2
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 12: Get Media for Assignment With No Media
- **Test Case ID**: TC_GET_MEDIA_002
- **Description**: Verify that empty array is returned when assignment has no media.
- **Preconditions**: 
  - User is authenticated.
  - Assignment exists but has no media uploaded.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/assignment/as000002-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [],
    "totalItems": 0
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 13: Get Media Without Authentication
- **Test Case ID**: TC_GET_MEDIA_003
- **Description**: Verify that unauthenticated requests are rejected.
- **Preconditions**: None
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/assignment/as000001-0000-0000-0000-000000000001`
  - **Headers**: None
- **Expected Output**:
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **Status Code**: `401 Unauthorized`

---

## GET /api/v1/booking-media/assignment/{assignmentId}/type/{mediaType}

### Test Case 14: Successfully Get Media by Type (CHECK_IN_IMAGE)
- **Test Case ID**: TC_GET_MEDIA_BY_TYPE_001
- **Description**: Verify that check-in images can be retrieved specifically.
- **Preconditions**: 
  - User is authenticated.
  - Assignment exists and has CHECK_IN_IMAGE media.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/assignment/as000001-0000-0000-0000-000000000001/type/CHECK_IN_IMAGE`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "mediaId": "media001-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkin_job1.jpg",
        "publicId": "booking_images/checkin_job1",
        "mediaType": "CHECK_IN_IMAGE",
        "description": "Ảnh trước khi bắt đầu công việc",
        "uploadedAt": "2025-11-04T08:55:30"
      }
    ],
    "totalItems": 1
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 15: Successfully Get Media by Type (CHECK_OUT_IMAGE)
- **Test Case ID**: TC_GET_MEDIA_BY_TYPE_002
- **Description**: Verify that check-out images can be retrieved specifically.
- **Preconditions**: 
  - User is authenticated.
  - Assignment exists and has CHECK_OUT_IMAGE media.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/assignment/as000001-0000-0000-0000-000000000001/type/CHECK_OUT_IMAGE`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "mediaId": "media002-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkout_job1.jpg",
        "publicId": "booking_images/checkout_job1",
        "mediaType": "CHECK_OUT_IMAGE",
        "description": "Ảnh sau khi hoàn thành công việc",
        "uploadedAt": "2025-11-04T11:00:15"
      }
    ],
    "totalItems": 1
  }
  ```
- **Status Code**: `200 OK`

---

## GET /api/v1/booking-media/booking/{bookingId}

### Test Case 16: Successfully Get All Media for Booking
- **Test Case ID**: TC_GET_BOOKING_MEDIA_001
- **Description**: Verify that all media for a booking (across all assignments) can be retrieved.
- **Preconditions**: 
  - User is authenticated.
  - Booking exists and has assignments with media uploaded.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/booking/b0000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "mediaId": "media001-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkin_job1.jpg",
        "publicId": "booking_images/checkin_job1",
        "mediaType": "CHECK_IN_IMAGE",
        "description": "Ảnh trước khi bắt đầu công việc",
        "uploadedAt": "2025-11-04T08:55:30"
      },
      {
        "mediaId": "media002-0000-0000-0000-000000000001",
        "assignmentId": "as000001-0000-0000-0000-000000000001",
        "mediaUrl": "https://res.cloudinary.com/demo/image/upload/booking_images/checkout_job1.jpg",
        "publicId": "booking_images/checkout_job1",
        "mediaType": "CHECK_OUT_IMAGE",
        "description": "Ảnh sau khi hoàn thành công việc",
        "uploadedAt": "2025-11-04T11:00:15"
      }
    ],
    "totalItems": 2
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 17: Get Media for Booking With No Media
- **Test Case ID**: TC_GET_BOOKING_MEDIA_002
- **Description**: Verify that empty array is returned when booking has no media.
- **Preconditions**: 
  - User is authenticated.
  - Booking exists but has no media uploaded in any assignment.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/booking-media/booking/b0000002-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [],
    "totalItems": 0
  }
  ```
- **Status Code**: `200 OK`

---

## DELETE /api/v1/booking-media/{mediaId}

### Test Case 18: Successfully Delete Media (Admin)
- **Test Case ID**: TC_DELETE_MEDIA_001
- **Description**: Verify that an admin can delete media successfully.
- **Preconditions**: 
  - User is authenticated as Admin.
  - Media exists in the database.
- **Input**:
  - **Method**: `DELETE`
  - **URL**: `/api/v1/booking-media/media001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Xóa ảnh thành công"
  }
  ```
- **Status Code**: `200 OK`
- **Additional Verification**: 
  - Media is deleted from database
  - Image is deleted from Cloudinary

---

### Test Case 19: Delete Non-existent Media
- **Test Case ID**: TC_DELETE_MEDIA_002
- **Description**: Verify that deleting non-existent media returns appropriate error.
- **Preconditions**: 
  - User is authenticated as Admin.
  - Media ID does not exist.
- **Input**:
  - **Method**: `DELETE`
  - **URL**: `/api/v1/booking-media/invalid-media-id`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy media với ID: invalid-media-id"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 20: Delete Media Without Admin Role
- **Test Case ID**: TC_DELETE_MEDIA_003
- **Description**: Verify that non-admin users cannot delete media.
- **Preconditions**: 
  - User is authenticated as Employee or Customer.
  - Media exists in the database.
- **Input**:
  - **Method**: `DELETE`
  - **URL**: `/api/v1/booking-media/media001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    ```
- **Expected Output**:
  ```json
  {
    "error": "Forbidden"
  }
  ```
- **Status Code**: `403 Forbidden`

---

## Additional Test Scenarios

### Test Case 21: Check-in Image Upload Failure Doesn't Affect Check-in
- **Test Case ID**: TC_CHECKIN_RESILIENCE_001
- **Description**: Verify that if image upload fails, check-in still completes successfully.
- **Preconditions**: 
  - Employee is authenticated.
  - Assignment exists and is in ASSIGNED status.
  - Cloudinary service is temporarily unavailable.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/assignments/as000001-0000-0000-0000-000000000001/check-in`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Body** (multipart/form-data):
    ```
    request: {"employeeId":"e1000001-0000-0000-0000-000000000001"}
    image: <image_file.jpg>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Điểm danh bắt đầu công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000001",
      "status": "IN_PROGRESS",
      "checkInTime": "2025-11-04T08:55:00"
    }
  }
  ```
- **Status Code**: `200 OK`
- **Additional Verification**: 
  - Check-in is completed
  - No media record is created
  - Error is logged but not returned to user

---

### Test Case 22: Multiple Media for Single Assignment
- **Test Case ID**: TC_MULTIPLE_MEDIA_001
- **Description**: Verify that multiple images can be uploaded for a single assignment (check-in + check-out).
- **Preconditions**: 
  - Employee has checked-in with image.
  - Employee is now checking-out with another image.
- **Input**: Perform check-in with image, then check-out with image
- **Expected Output**: Both images are stored separately with correct media_type
- **Status Code**: `200 OK` for both operations
- **Additional Verification**: 
  - GET /api/v1/booking-media/assignment/{assignmentId} returns 2 media items
  - One with CHECK_IN_IMAGE type
  - One with CHECK_OUT_IMAGE type

---

## Summary

### Coverage Summary
- ✅ Check-in without image
- ✅ Check-in with valid image
- ✅ Check-in with invalid file type
- ✅ Check-in with oversized file
- ✅ Check-in outside time window
- ✅ Duplicate check-in prevention
- ✅ Check-out without image
- ✅ Check-out with valid image
- ✅ Check-out without prior check-in
- ✅ Duplicate check-out prevention
- ✅ Get all media for assignment
- ✅ Get media by type
- ✅ Get all media for booking
- ✅ Delete media (Admin only)
- ✅ Authorization and authentication checks
- ✅ Error handling and validation
- ✅ Resilience (image upload failure doesn't affect check-in/check-out)

### Total Test Cases: 22
