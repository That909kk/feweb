# API Test Cases - Service Management

## Overview
This document describes the test cases for the **Service** endpoints of the Customer API.  
The endpoints allow authenticated customers to view and search for available housekeeping services.  
**Base URL**: `/api/v1/customer/services`

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
All endpoints require:
- **Authorization Header**: `Bearer <valid_customer_token>`
- **Permission**: User must have "service.view" permission
- **Role**: Accessible by CUSTOMER, EMPLOYEE, and ADMIN roles

---

## Database Test Data
Based on housekeeping_service_v5.sql:
- **Services**: 
  - Service ID 1: "Dọn dẹp theo giờ" (50,000đ/hour, 2.0 hours, recommended 1 staff)
  - Service ID 2: "Tổng vệ sinh" (400,000đ/package, 4.0 hours, recommended 3 staff)
- **Units**: hour, m2, package
- **Status**: Only active services are returned
- **Permissions**: "service.view" permission required for all endpoints

---

## GET /services - Get All Active Services

### Test Case 1: Successfully Get All Active Services
- **Test Case ID**: TC_SERVICE_001
- **Description**: Verify that a customer can retrieve all active services.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Customer has "service.view" permission.
  - Database contains active services.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách dịch vụ thành công",
    "data": [
        {
            "serviceId": 8,
            "name": "Đi chợ hộ",
            "description": "Mua sắm và giao hàng tận nơi theo danh sách của bạn.",
            "basePrice": 40000.00,
            "unit": "Lần",
            "estimatedDurationHours": 1.00,
            "recommendedStaff": 1,
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601712/shopping_etf5iz.png",
            "isActive": true
        },
        {
            "serviceId": 1,
            "name": "Dọn dẹp theo giờ",
            "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
            "basePrice": 50000.00,
            "unit": "Giờ",
            "estimatedDurationHours": 2.00,
            "recommendedStaff": 1,
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
            "isActive": true
        },
        {
            "serviceId": 6,
            "name": "Giặt hấp cao cấp",
            "description": "Giặt khô cho các loại vải cao cấp như vest, áo dài, lụa.",
            "basePrice": 120000.00,
            "unit": "Bộ",
            "estimatedDurationHours": 48.00,
            "recommendedStaff": 1,
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601414/vest_2_kfigzg.png",
            "isActive": true
        },
        {
            "serviceId": 5,
            "name": "Giặt sấy theo kg",
            "description": "Giặt và sấy khô quần áo thông thường, giao nhận tận nơi.",
            "basePrice": 30000.00,
            "unit": "Kg",
            "estimatedDurationHours": 24.00,
            "recommendedStaff": 1,
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601210/shirt_nmee0d.png",
            "isActive": true
        },
        {
            "serviceId": 7,
            "name": "Nấu ăn gia đình",
            "description": "Đi chợ (chi phí thực phẩm tính riêng) và chuẩn bị bữa ăn cho gia đình theo thực đơn yêu cầu.",
            "basePrice": 60000.00,
            "unit": "Giờ",
            "estimatedDurationHours": 2.50,
            "recommendedStaff": 2,
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601546/pan_ysmoql.png",
            "isActive": true
        },
        {
            "serviceId": 2,
            "name": "Tổng vệ sinh",
            "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
            "basePrice": 100000.00,
            "unit": "Gói",
            "estimatedDurationHours": 2.00,
            "recommendedStaff": 3,
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
            "isActive": true
        },
        {
            "serviceId": 4,
            "name": "Vệ sinh máy lạnh",
            "description": "Bảo trì, làm sạch dàn nóng và dàn lạnh, bơm gas nếu cần.",
            "basePrice": 150000.00,
            "unit": "Máy",
            "estimatedDurationHours": 1.00,
            "recommendedStaff": 1,
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600733/cooler_rnyppn.png",
            "isActive": true
        },
        {
            "serviceId": 3,
            "name": "Vệ sinh Sofa - Nệm - Rèm",
            "description": "Giặt sạch và khử khuẩn Sofa, Nệm, Rèm cửa bằng máy móc chuyên dụng.",
            "basePrice": 300000.00,
            "unit": "Gói",
            "estimatedDurationHours": 3.00,
            "recommendedStaff": 2,
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600057/sofa_bed_vkkjz8.png",
            "isActive": true
        }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Access Denied - No Service View Permission
- **Test Case ID**: TC_SERVICE_002
- **Description**: Verify that users without "service.view" permission cannot access services.
- **Preconditions**: 
  - User has valid token but lacks "service.view" permission
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services`
  - **Headers**: 
    ```
    Authorization: Bearer <token_without_service_permission>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không có quyền xem danh sách dịch vụ",
    "data": null
  }
  ```
- **Status Code**: `403 Forbidden`

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Không có quyền xem danh sách dịch vụ",
    "data": null
  }
  ```
- **Status Code**: `403 Forbidden`

---

## GET /services/{serviceId} - Get Service Detail

### Test Case 3: Successfully Get Service Detail
- **Test Case ID**: TC_SERVICE_003
- **Description**: Verify that a customer can retrieve detailed information for a specific service.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Customer has "service.view" permission.
  - Service with ID 1 exists and is active.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/1`
  - **Path Parameter**: `serviceId = 1`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin dịch vụ thành công",
    "data": {
        "serviceId": 1,
        "name": "Dọn dẹp theo giờ",
        "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
        "basePrice": 50000.00,
        "unit": "Giờ",
        "estimatedDurationHours": 2.00,
        "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
        "isActive": true,
        "formattedPrice": "50,000đ/Giờ",
        "formattedDuration": "2 giờ 0 phút"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 4: Service Not Found
- **Test Case ID**: TC_SERVICE_004
- **Description**: Verify that request fails when serviceId does not exist or service is inactive.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Customer has "service.view" permission.
  - Service with ID 999 does not exist.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/999`
  - **Path Parameter**: `serviceId = 999`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy dịch vụ hoặc dịch vụ đã ngừng hoạt động",
    "data": null
  }
  ```
- **Status Code**: `404 Not Found`

---

## GET /services/search - Search Services

### Test Case 5: Successfully Search Services by Keyword
- **Test Case ID**: TC_SERVICE_005
- **Description**: Verify that a customer can search for services using keywords.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Customer has "service.view" permission.
  - Services containing "dọn" keyword exist.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/search?keyword=dọn`
  - **Query Parameter**: `keyword = dọn`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Tìm thấy 1 dịch vụ phù hợp",
    "data": [
        {
            "serviceId": 1,
            "name": "Dọn dẹp theo giờ",
            "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
            "basePrice": 50000.00,
            "unit": "Giờ",
            "estimatedDurationHours": 2.00,
            "recommendedStaff": 1,
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
            "isActive": true
        }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 6: Search with No Results
- **Test Case ID**: TC_SERVICE_006
- **Description**: Verify that search returns appropriate message when no services match the keyword.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Customer has "service.view" permission.
  - No services contain "nonexistent" keyword.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/search?keyword=nonexistent`
  - **Query Parameter**: `keyword = nonexistent`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Không tìm thấy dịch vụ nào phù hợp với từ khóa: nonexistent",
    "data": []
  }
  ```
- **Status Code**: `200 OK`

---

## GET /services/count - Get Service Count

### Test Case 7: Successfully Get Service Count
- **Test Case ID**: TC_SERVICE_007
- **Description**: Verify that a customer can retrieve the total count of active services.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Customer has "service.view" permission.
  - Database contains active services.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/count`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "data": {
        "totalServices": 8
    },
    "success": true,
    "message": "Lấy số lượng dịch vụ thành công"
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 8: Invalid Token Test
- **Test Case ID**: TC_SERVICE_008
- **Description**: Verify that request fails when Authorization header is missing or invalid.
- **Preconditions**: None
- **Input**: 
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services`
  - No Authorization header
- **Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

## Notes
- **Test Environment**: Database should be configured with test data including services from housekeeping_service_v8.sql.
- **Authentication**: All endpoints require valid JWT tokens.
- **Permission**: Users must have "service.view" permission to access these endpoints.
- **Service Status**: Only active services (isActive = true) are returned.
- **Price Formatting**: ServiceDetailData includes formatted price and duration for better UX.
- **Search Functionality**: Search is case-insensitive and matches service names.
- **Error Handling**: Service layer catches exceptions and returns appropriate error responses.
- **Security**: JWT tokens are validated and permissions are checked for each request.
