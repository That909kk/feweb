# API Test Cases - Create Booking with Image Upload

## Overview
This document describes comprehensive test cases for the **Create Booking with Image Upload** endpoint using realistic data from the housekeeping service database.  
**Base URL**: `/api/v1/customer/bookings`  
**Test Date Context**: November 1, 2025

---

## Test Data Reference
All test cases use real data from `postgres_data/init_sql/99_seed_datas.sql`:
- **Customer**: John Doe (john_doe / c1000001-0000-0000-0000-000000000001)
- **Address**: 123 Lê Trọng Tấn, Phường Tây Thạnh (adrs0001-0000-0000-0000-000000000001)
- **Employee**: Jane Smith (e1000001-0000-0000-0000-000000000001)
- **Services**: Service ID 1 (Dọn dẹp theo giờ - 50,000 VND), Service ID 2 (Tổng vệ sinh - 100,000 VND)
- **Promotions**: GIAM20K (20,000 VND fixed), KHAITRUONG10 (10% discount, max 50,000 VND)
- **Password**: `password` for all test accounts

---

## Test Case Structure
Each test case includes:
- **Test Case ID**: Unique identifier for the test case.
- **Description**: Purpose of the test.
- **Preconditions**: Requirements before executing the test.
- **Input**: Request data or headers.
- **Expected Output**: Expected response based on the API specification.
- **Status Code**: HTTP status code expected.

---

## Authentication Requirements
- **POST /**: CUSTOMER or ADMIN role required
- **Authorization Header**: `Bearer <valid_token>`
- **Content-Type**: `multipart/form-data`

---

## API Endpoint Covered
**POST /api/v1/customer/bookings** - Create New Booking with Optional Image Upload

---

## POST / - Create Booking

### Test Case 1: Successful Booking Creation Without Image and Without Assignments (Booking Post)
- **Test Case ID**: TC_BOOKING_CREATE_001
- **Description**: Verify that customer can create a booking post (no employee assignment) which requires admin verification
- **Preconditions**:
  - Customer: **john_doe** (customer_id: c1000001-0000-0000-0000-000000000001)
  - Address: **123 Lê Trọng Tấn, Phường Tây Thạnh** (adrs0001-0000-0000-0000-000000000001)
  - Service: **Dọn dẹp theo giờ** (service_id: 1, base_price: 50,000 VND)
  - Valid JWT token with CUSTOMER role
  - Booking time is in the future (Nov 5, 2025)
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (Text - JSON string):
      ```json
      {
        "addressId": "adrs0001-0000-0000-0000-000000000001",
        "bookingTime": "2025-11-05T09:00:00",
        "note": "Nhà có trẻ nhỏ, vui lòng chú ý",
        "title": "Cần dọn dẹp nhà cấp tốc",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1
          }
        ],
        "paymentMethodId": 1
      }
      ```
    - **image**: (not provided)
- **Expected Output**:
  ```json
  {
    "data": {
        "bookingId": "825344a5-6cfb-43d9-8bb5-cac2f3624cd1",
        "bookingCode": "BK39914698",
        "status": "AWAITING_EMPLOYEE",
        "totalAmount": 50000.00,
        "formattedTotalAmount": "50,000đ",
        "bookingTime": "2025-11-05T09:00:00",
        "createdAt": "2025-11-01T09:07:19.924613",
        "title": "Cần dọn dẹp nhà cấp tốc",
        "imageUrl": null,
        "isVerified": false,
        "adminComment": null,
        "customerInfo": {
            "addressId": "adrs0001-0000-0000-0000-000000000001",
            "fullAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
            "ward": "Phường Tây Thạnh",
            "city": "Thành phố Hồ Chí Minh",
            "latitude": 10.7943,
            "longitude": 106.6256,
            "isDefault": true
        },
        "serviceDetails": [
            {
                "bookingDetailId": "f32b1ef7-38ae-47d3-b122-9664b2506867",
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
            "paymentId": "bfdcb383-2161-4afc-b082-6c704bb80c94",
            "amount": 50000.00,
            "paymentMethod": "Thanh toán tiền mặt",
            "paymentStatus": "PENDING",
            "transactionCode": "TXN_1761962839914",
            "createdAt": "2025-11-01 09:07:19",
            "paidAt": null
        },
        "promotionApplied": null,
        "assignedEmployees": [],
        "totalServices": 1,
        "totalEmployees": 0,
        "estimatedDuration": "2 giờ 0 phút",
        "hasPromotion": false
    },
    "success": true
  }
  ```
- **Status Code**: 201 Created
- **Validation**: 
  - `isVerified = false` (requires admin approval)
  - `status = AWAITING_EMPLOYEE` (no assignments provided)
  - `title` is present (booking post feature)

### Test Case 2: Successful Booking Creation With Image Upload
- **Test Case ID**: TC_BOOKING_CREATE_002
- **Description**: Verify that customer can upload an image when creating booking post
- **Preconditions**:
  - Customer: **john_doe** 
  - Valid image file (JPEG/PNG, < 5MB)
  - Cloudinary service is available
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (Text - JSON string):
      ```json
      {
        "addressId": "adrs0001-0000-0000-0000-000000000001",
        "bookingTime": "2025-11-05T14:00:00",
        "note": "Xem ảnh để biết khu vực cần dọn",
        "title": "Dọn dẹp phòng khách và bếp",
        "bookingDetails": [
          {
            "serviceId": 2,
            "quantity": 1
          }
        ],
        "paymentMethodId": 1
      }
      ```
    - **image**: room_photo.jpg (valid image file)
- **Expected Output**:
  ```json
  {
    "data": {
        "bookingId": "f5a4f023-9920-44d3-a068-c03a76493aa3",
        "bookingCode": "BK27620656",
        "status": "AWAITING_EMPLOYEE",
        "totalAmount": 100000.00,
        "formattedTotalAmount": "100,000đ",
        "bookingTime": "2025-11-05T14:00:00",
        "createdAt": "2025-11-01T09:08:47.626905",
        "title": "Dọn dẹp phòng khách và bếp",
        "imageUrl": "https://res.cloudinary.com/dhhntolb5/image/upload/v1761962927/booking_images/o4gwqqx12qwsht6fjxvf.jpg",
        "isVerified": false,
        "adminComment": null,
        "customerInfo": {
            "addressId": "adrs0001-0000-0000-0000-000000000001",
            "fullAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
            "ward": "Phường Tây Thạnh",
            "city": "Thành phố Hồ Chí Minh",
            "latitude": 10.7943,
            "longitude": 106.6256,
            "isDefault": true
        },
        "serviceDetails": [
            {
                "bookingDetailId": "1e941894-f705-4845-83d2-be0f95bd9569",
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
                "pricePerUnit": 100000.00,
                "formattedPricePerUnit": "100,000đ",
                "subTotal": 100000.00,
                "formattedSubTotal": "100,000đ",
                "selectedChoices": [],
                "assignments": [],
                "duration": "2 giờ",
                "formattedDuration": "2 giờ"
            }
        ],
        "paymentInfo": {
            "paymentId": "c57f0795-56ab-492a-b302-95785fc2d23d",
            "amount": 100000.00,
            "paymentMethod": "Thanh toán tiền mặt",
            "paymentStatus": "PENDING",
            "transactionCode": "TXN_1761962927620",
            "createdAt": "2025-11-01 09:08:47",
            "paidAt": null
        },
        "promotionApplied": null,
        "assignedEmployees": [],
        "totalServices": 1,
        "totalEmployees": 0,
        "estimatedDuration": "2 giờ 0 phút",
        "hasPromotion": false
    },
    "success": true
  }
  ```
- **Status Code**: 201 Created
- **Validation**: 
  - `imageUrl` contains Cloudinary URL
  - Image successfully uploaded before booking creation

### Test Case 3: Successful Booking With Employee Assignment (Auto-Verified)
- **Test Case ID**: TC_BOOKING_CREATE_003
- **Description**: Verify that booking with employee assignment is auto-verified (isVerified = true)
- **Preconditions**:
  - Customer: **john_doe**
  - Employee: **Jane Smith** (e1000001-0000-0000-0000-000000000001)
  - Employee is available at booking time
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (Text - JSON string):
      ```json
      {
        "addressId": "adrs0001-0000-0000-0000-000000000001",
        "bookingTime": "2025-11-27T10:00:00",
        "note": "Đã tìm được nhân viên phù hợp",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 3
          }
        ],
        "assignments": [
          {
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "bookingDetailIndex": 0
          }
        ],
        "paymentMethodId": 1
      }
      ```
    - **image**: (not provided)
- **Expected Output**:
  ```json
  {
    "data": {
        "bookingId": "bc260995-5d7d-40fe-94db-b4d8695d3ad5",
        "bookingCode": "BK64923095",
        "status": "PENDING",
        "totalAmount": 100000.00,
        "formattedTotalAmount": "100,000đ",
        "bookingTime": "2025-11-27T10:00:00",
        "createdAt": "2025-11-01T09:52:45.002846",
        "title": null,
        "imageUrl": null,
        "isVerified": true,
        "adminComment": null,
        "customerInfo": {
            "addressId": "adrs0001-0000-0000-0000-000000000001",
            "fullAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
            "ward": "Phường Tây Thạnh",
            "city": "Thành phố Hồ Chí Minh",
            "latitude": 10.7943,
            "longitude": 106.6256,
            "isDefault": true
        },
        "serviceDetails": [
            {
                "bookingDetailId": "03220c5f-4ad6-4645-9ba9-d875dd3dbc48",
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
                "pricePerUnit": 100000.00,
                "formattedPricePerUnit": "100,000đ",
                "subTotal": 100000.00,
                "formattedSubTotal": "100,000đ",
                "selectedChoices": [],
                "assignments": [
                    {
                        "assignmentId": "60763d01-3828-47ec-b1df-ab87e1c1f2d3",
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
        "paymentInfo": {
            "paymentId": "a0af1189-562e-4d33-a7a0-3a89f9e736b8",
            "amount": 100000.00,
            "paymentMethod": "Thanh toán tiền mặt",
            "paymentStatus": "PENDING",
            "transactionCode": "TXN_1761965564920",
            "createdAt": "2025-11-01 09:52:45",
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
                "rating": null,
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
        "hasPromotion": false
    },
    "success": true
  }
  ```
- **Status Code**: 201 Created
- **Validation**: 
  - `isVerified = true` (has assignments - no admin approval needed)
  - `status = PENDING` (not AWAITING_EMPLOYEE)
  - `assignments` array is populated

### Test Case 6: Image Validation - Invalid File Type
- **Test Case ID**: TC_BOOKING_CREATE_006
- **Description**: Verify that non-image files are rejected
- **Preconditions**:
  - Customer: **john_doe**
  - PDF file provided instead of image
- **Input**:
  - **Form Data**:
    - **booking**: Valid JSON
    - **image**: document.pdf (PDF file)
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File phải là định dạng ảnh"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 7: Image Validation - File Too Large
- **Test Case ID**: TC_BOOKING_CREATE_007
- **Description**: Verify that images exceeding 5MB are rejected
- **Preconditions**:
  - Customer: **john_doe**
  - Image file > 5MB
- **Input**:
  - **Form Data**:
    - **booking**: Valid JSON
    - **image**: large_photo.jpg (8MB)
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Kích thước file không được vượt quá 5MB"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 8: Validation - Missing Required Fields
- **Test Case ID**: TC_BOOKING_CREATE_008
- **Description**: Verify that booking fails when required fields are missing
- **Preconditions**:
  - Customer: **john_doe**
- **Input**:
  - **Form Data**:
    - **booking**:
      ```json
      {
        "addressId": "adrs0001-0000-0000-0000-000000000001",
        "note": "Missing bookingTime and bookingDetails"
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Invalid booking data format: bookingTime is required"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 9: Validation - Past Booking Time
- **Test Case ID**: TC_BOOKING_CREATE_009
- **Description**: Verify that booking time must be in the future
- **Preconditions**:
  - Customer: **john_doe**
  - Current date: November 1, 2025
- **Input**:
  - **Form Data**:
    - **booking**:
      ```json
      {
        "addressId": "adrs0001-0000-0000-0000-000000000001",
        "bookingTime": "2025-10-15T14:00:00",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1
          }
        ],
        "paymentMethodId": 1
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking time must be in the future"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 10: Validation - Both AddressId and NewAddress Provided
- **Test Case ID**: TC_BOOKING_CREATE_010
- **Description**: Verify that only one address method can be used
- **Preconditions**:
  - Customer: **john_doe**
- **Input**:
  - **Form Data**:
    - **booking**:
      ```json
      {
        "addressId": "adrs0001-0000-0000-0000-000000000001",
        "newAddress": {
          "fullAddress": "123 Test Street",
          "ward": "Test Ward",
          "city": "Ho Chi Minh City"
        },
        "bookingTime": "2025-11-05T14:00:00",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1
          }
        ],
        "paymentMethodId": 1
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ được cung cấp addressId HOẶC newAddress, không được cả hai"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 11: Authorization - Missing Token
- **Test Case ID**: TC_BOOKING_CREATE_011
- **Description**: Verify that requests without token are rejected
- **Preconditions**:
  - No authorization header
- **Input**:
  - **Headers**: 
    ```
    Content-Type: multipart/form-data
    ```
  - **Form Data**: Valid booking data
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Unauthorized access"
  }
  ```
- **Status Code**: 401 Unauthorized

### Test Case 12: Authorization - Employee Role Cannot Create Booking
- **Test Case ID**: TC_BOOKING_CREATE_012
- **Description**: Verify that employee users cannot create bookings (customer-only feature)
- **Preconditions**:
  - Employee user: **jane_smith** with ROLE_EMPLOYEE only
  - Valid JWT token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <jane_smith_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**: Valid booking data
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Access denied"
  }
  ```
- **Status Code**: 403 Forbidden

---

## Summary

### Total Test Cases: 12
- **Happy Path (Success)**: 5 cases
  - TC_001: Booking post without image (isVerified=false)
  - TC_002: Booking post with image upload
  - TC_003: Booking with assignment (isVerified=true)
  - TC_004: Booking with promotion code
  - TC_005: Booking with new address

- **Validation (Error)**: 5 cases
  - TC_006: Invalid file type
  - TC_007: File too large
  - TC_008: Missing required fields
  - TC_009: Past booking time
  - TC_010: Both addressId and newAddress

- **Authorization (Security)**: 2 cases
  - TC_011: Missing token
  - TC_012: Employee role cannot create

---

## Key Business Logic Covered

### 1. **isVerified Logic**:
- **No assignments** → `isVerified = false` (booking post, needs admin approval)
- **Has assignments** → `isVerified = true` (normal booking, auto-approved)

### 2. **Status Logic**:
- **No assignments** → `status = AWAITING_EMPLOYEE`
- **Has assignments** → `status = PENDING`

### 3. **Image Upload**:
- Optional field
- Uploaded to Cloudinary before booking creation
- Max size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP

### 4. **Address Handling**:
- Use existing: `addressId`
- Create new: `newAddress`
- Cannot provide both

### 5. **Promotion Codes**:
- GIAM20K: 20,000 VND fixed discount
- KHAITRUONG10: 10% discount (max 50,000 VND)

---

## Notes
- **Test Date**: November 1, 2025
- **Data Source**: `postgres_data/init_sql/99_seed_datas.sql`
- **Request Format**: `multipart/form-data` with two parts:
  - `booking` (Text - JSON string)
  - `image` (File - optional)
- **No need to set Content-Type** for booking part when sending as Text in Postman
- **Test Case ID**: TC_BOOKING_CREATE_001
- **Description**: Verify that a customer can successfully create a booking without uploading an image
- **Preconditions**:
  - Customer John Doe exists with ID 'c1000001-0000-0000-0000-000000000001'
  - Valid address exists or new address data provided
  - Service exists and is active
  - Valid JWT token with CUSTOMER role
  - Booking time is in the future
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "addressId": "a1000001-0000-0000-0000-000000000001",
        "bookingTime": "2025-11-05T14:00:00",
        "note": "Please bring cleaning supplies",
        "title": "House Cleaning Service",
        "promoCode": "SUMMER2025",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1,
            "selectedChoiceIds": [1, 2, 3]
          }
        ],
        "assignments": [
          {
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "bookingDetailIndex": 0
          }
        ],
        "paymentMethodId": 1
      }
      ```
    - **image**: (not provided)
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "BK000001",
      "bookingCode": "BK001",
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "totalAmount": "500000",
      "status": "PENDING",
      "bookingTime": "2025-11-05T14:00:00+07:00",
      "createdAt": "2025-11-01T10:00:00+07:00",
      "message": "Booking created successfully"
    }
  }
  ```
- **Status Code**: 201 Created

### Test Case 2: Successful Booking Creation With Image
- **Test Case ID**: TC_BOOKING_CREATE_002
- **Description**: Verify that a customer can successfully create a booking with an uploaded image
- **Preconditions**:
  - Customer John Doe exists
  - Valid image file (JPEG/PNG, < 5MB)
  - Valid JWT token with CUSTOMER role
  - Cloudinary service is available
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "addressId": "a1000001-0000-0000-0000-000000000001",
        "bookingTime": "2025-11-05T14:00:00",
        "note": "See attached photo for reference",
        "title": "House Cleaning - Special Areas",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1,
            "selectedChoiceIds": [1, 2]
          }
        ],
        "paymentMethodId": 1
      }
      ```
    - **image**: house_area.jpg (valid image file)
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "BK000002",
      "bookingCode": "BK002",
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1234567890/bookings/house_area.jpg",
      "totalAmount": "500000",
      "status": "PENDING",
      "bookingTime": "2025-11-05T14:00:00+07:00",
      "createdAt": "2025-11-01T10:15:00+07:00",
      "message": "Booking created successfully"
    }
  }
  ```
- **Status Code**: 201 Created

### Test Case 3: Image Validation - Invalid File Type
- **Test Case ID**: TC_BOOKING_CREATE_003
- **Description**: Verify that non-image files are rejected during booking creation
- **Preconditions**:
  - Customer John Doe exists
  - PDF file provided instead of image
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json): Valid booking data
    - **image**: document.pdf (PDF file)
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File phải là định dạng ảnh"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 4: Image Validation - File Too Large
- **Test Case ID**: TC_BOOKING_CREATE_004
- **Description**: Verify that images exceeding 5MB size limit are rejected
- **Preconditions**:
  - Customer John Doe exists
  - Image file larger than 5MB
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json): Valid booking data
    - **image**: large_image.jpg (8MB file)
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Kích thước file không được vượt quá 5MB"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 5: Booking Validation - Missing Required Fields
- **Test Case ID**: TC_BOOKING_CREATE_005
- **Description**: Verify that booking creation fails when required fields are missing
- **Preconditions**:
  - Customer John Doe exists
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "addressId": "a1000001-0000-0000-0000-000000000001",
        "note": "Missing booking time and details"
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking time is required"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 6: Booking Validation - Past Booking Time
- **Test Case ID**: TC_BOOKING_CREATE_006
- **Description**: Verify that booking time must be in the future
- **Preconditions**:
  - Customer John Doe exists
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "addressId": "a1000001-0000-0000-0000-000000000001",
        "bookingTime": "2025-10-01T14:00:00",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1
          }
        ],
        "paymentMethodId": 1
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking time must be in the future"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 7: Booking Validation - Empty Booking Details
- **Test Case ID**: TC_BOOKING_CREATE_007
- **Description**: Verify that at least one booking detail (service) is required
- **Preconditions**:
  - Customer John Doe exists
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "addressId": "a1000001-0000-0000-0000-000000000001",
        "bookingTime": "2025-11-05T14:00:00",
        "bookingDetails": [],
        "paymentMethodId": 1
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking details cannot be empty"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 8: Address Validation - Both AddressId and NewAddress Provided
- **Test Case ID**: TC_BOOKING_CREATE_008
- **Description**: Verify that only one address method can be used
- **Preconditions**:
  - Customer John Doe exists
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "addressId": "a1000001-0000-0000-0000-000000000001",
        "newAddress": {
          "street": "123 New Street",
          "ward": "Ward 1",
          "district": "District 1",
          "city": "Ho Chi Minh City"
        },
        "bookingTime": "2025-11-05T14:00:00",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1
          }
        ],
        "paymentMethodId": 1
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Either addressId or newAddress must be provided"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 9: Address Validation - Neither AddressId nor NewAddress Provided
- **Test Case ID**: TC_BOOKING_CREATE_009
- **Description**: Verify that at least one address method must be provided
- **Preconditions**:
  - Customer John Doe exists
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "bookingTime": "2025-11-05T14:00:00",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1
          }
        ],
        "paymentMethodId": 1
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Either addressId or newAddress must be provided"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 10: Booking with New Address
- **Test Case ID**: TC_BOOKING_CREATE_010
- **Description**: Verify that booking can be created with a new address
- **Preconditions**:
  - Customer John Doe exists
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "newAddress": {
          "street": "456 New Avenue",
          "ward": "Ben Nghe",
          "district": "District 1",
          "city": "Ho Chi Minh City",
          "isDefault": false
        },
        "bookingTime": "2025-11-05T14:00:00",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1,
            "selectedChoiceIds": [1, 2]
          }
        ],
        "paymentMethodId": 1
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "BK000003",
      "bookingCode": "BK003",
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "address": {
        "street": "456 New Avenue",
        "ward": "Ben Nghe",
        "district": "District 1",
        "city": "Ho Chi Minh City"
      },
      "totalAmount": "500000",
      "status": "PENDING",
      "createdAt": "2025-11-01T10:30:00+07:00"
    }
  }
  ```
- **Status Code**: 201 Created

### Test Case 11: Booking with Promotion Code
- **Test Case ID**: TC_BOOKING_CREATE_011
- **Description**: Verify that valid promotion codes are applied correctly
- **Preconditions**:
  - Customer John Doe exists
  - Promotion code "SUMMER2025" exists and is active
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "addressId": "a1000001-0000-0000-0000-000000000001",
        "bookingTime": "2025-11-05T14:00:00",
        "promoCode": "SUMMER2025",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1
          }
        ],
        "paymentMethodId": 1
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "BK000004",
      "bookingCode": "BK004",
      "totalAmount": "425000",
      "discountAmount": "75000",
      "promotionApplied": {
        "code": "SUMMER2025",
        "discountPercent": 15
      },
      "status": "PENDING"
    }
  }
  ```
- **Status Code**: 201 Created

### Test Case 12: Booking with Employee Assignments
- **Test Case ID**: TC_BOOKING_CREATE_012
- **Description**: Verify that bookings can be created with employee assignments
- **Preconditions**:
  - Customer John Doe exists
  - Employee Jane Smith exists and is available
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json):
      ```json
      {
        "addressId": "a1000001-0000-0000-0000-000000000001",
        "bookingTime": "2025-11-05T14:00:00",
        "bookingDetails": [
          {
            "serviceId": 1,
            "quantity": 1
          }
        ],
        "assignments": [
          {
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "bookingDetailIndex": 0
          }
        ],
        "paymentMethodId": 1
      }
      ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "BK000005",
      "status": "CONFIRMED",
      "assignments": [
        {
          "employeeId": "e1000001-0000-0000-0000-000000000001",
          "employeeName": "Jane Smith",
          "serviceId": 1
        }
      ]
    }
  }
  ```
- **Status Code**: 201 Created

### Test Case 13: Unauthorized Access - Missing Token
- **Test Case ID**: TC_BOOKING_CREATE_013
- **Description**: Verify that requests without authorization token are rejected
- **Preconditions**:
  - No authorization header provided
- **Input**:
  - **Headers**: 
    ```
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json): Valid booking data
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Unauthorized access"
  }
  ```
- **Status Code**: 401 Unauthorized

### Test Case 14: Unauthorized Access - Invalid Token
- **Test Case ID**: TC_BOOKING_CREATE_014
- **Description**: Verify that requests with invalid authorization token are rejected
- **Preconditions**:
  - Invalid authorization token provided
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token_12345
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json): Valid booking data
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Invalid or expired token"
  }
  ```
- **Status Code**: 401 Unauthorized

### Test Case 15: Forbidden Access - Employee Role
- **Test Case ID**: TC_BOOKING_CREATE_015
- **Description**: Verify that employee users cannot create bookings (customer-only feature)
- **Preconditions**:
  - Employee user exists with valid JWT token
  - User has ROLE_EMPLOYEE authority only
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    - **booking** (application/json): Valid booking data
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Access denied"
  }
  ```
- **Status Code**: 403 Forbidden

---

## Summary

### Total Test Cases: 12
- **Happy Path (Success)**: 5 cases
  - TC_001: Booking post without image (isVerified=false)
  - TC_002: Booking post with image upload
  - TC_003: Booking with assignment (isVerified=true)
  - TC_004: Booking with promotion code
  - TC_005: Booking with new address

- **Validation (Error)**: 5 cases
  - TC_006: Invalid file type
  - TC_007: File too large
  - TC_008: Missing required fields
  - TC_009: Past booking time
  - TC_010: Both addressId and newAddress

- **Authorization (Security)**: 2 cases
  - TC_011: Missing token
  - TC_012: Employee role cannot create

---

## Key Business Logic Covered

### 1. **isVerified Logic**:
- **No assignments** → `isVerified = false` (booking post, needs admin approval)
- **Has assignments** → `isVerified = true` (normal booking, auto-approved)

### 2. **Status Logic**:
- **No assignments** → `status = AWAITING_EMPLOYEE`
- **Has assignments** → `status = PENDING`

### 3. **Image Upload**:
- Optional field
- Uploaded to Cloudinary before booking creation
- Max size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP

### 4. **Address Handling**:
- Use existing: `addressId`
- Create new: `newAddress`
- Cannot provide both

### 5. **Promotion Codes**:
- GIAM20K: 20,000 VND fixed discount
- KHAITRUONG10: 10% discount (max 50,000 VND)

---

## Notes
- **Test Date**: November 1, 2025
- **Data Source**: `postgres_data/init_sql/99_seed_datas.sql`
- **Request Format**: `multipart/form-data` with two parts:
  - `booking` (Text - JSON string)
  - `image` (File - optional)
- **No need to set Content-Type** for booking part when sending as Text in Postman
