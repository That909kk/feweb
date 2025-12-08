# API Customer - Lấy Thống Kê Booking Theo Trạng Thái

## Endpoint
```
GET /api/v1/customer/{customerId}/bookings/statistics
```

## Mô tả
API này cho phép khách hàng lấy thống kê tổng số booking của mình theo từng trạng thái và theo đơn vị thời gian (ngày, tuần, tháng, năm).

## Authorization
- **Required**: Yes
- **Type**: Bearer Token
- **Roles**: `ROLE_CUSTOMER`, `ROLE_ADMIN`
- **Note**: Customer chỉ có thể truy cập thống kê của chính mình. Admin có thể truy cập thống kê của bất kỳ customer nào.

## Request

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| customerId | String | Yes | ID của khách hàng cần lấy thống kê |

### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| timeUnit | String | Yes | Đơn vị thời gian. Các giá trị hợp lệ: `DAY`, `WEEK`, `MONTH`, `YEAR` | `MONTH` |
| startDate | String (ISO DateTime) | No | Ngày bắt đầu của khoảng thời gian (nếu không có sẽ tự động tính dựa trên timeUnit) | `2025-10-19T00:00:00` |
| endDate | String (ISO DateTime) | No | Ngày kết thúc của khoảng thời gian (nếu không có sẽ mặc định là thời điểm hiện tại) | `2025-11-19T23:59:59` |

### Headers
```
Authorization: Bearer {access_token}
```

### Request Example
```http
GET /api/v1/customer/CUST001/bookings/statistics?timeUnit=MONTH HTTP/1.1
Host: localhost:8080
Authorization: Bearer <Token_CUST001>
```

### Request Example với startDate và endDate
```http
GET /api/v1/customer/CUST001/bookings/statistics?timeUnit=WEEK&startDate=2025-11-01T00:00:00&endDate=2025-11-19T23:59:59 HTTP/1.1
Host: localhost:8080
Authorization: Bearer <Token_CUST001>
```

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "timeUnit": "MONTH",
    "startDate": "2025-10-19T00:00:00",
    "endDate": "2025-11-19T23:59:59.999999999",
    "totalBookings": 25,
    "countByStatus": {
      "PENDING": 3,
      "AWAITING_EMPLOYEE": 2,
      "CONFIRMED": 5,
      "IN_PROGRESS": 4,
      "COMPLETED": 10,
      "CANCELLED": 1
    }
  }
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Trạng thái thành công của request |
| data | Object | Dữ liệu thống kê |
| data.timeUnit | String | Đơn vị thời gian được sử dụng |
| data.startDate | String | Ngày bắt đầu của khoảng thời gian thống kê |
| data.endDate | String | Ngày kết thúc của khoảng thời gian thống kê |
| data.totalBookings | Long | Tổng số booking trong khoảng thời gian |
| data.countByStatus | Object | Map chứa số lượng booking theo từng trạng thái |

### Booking Status Values
- `PENDING`: Đang chờ xử lý
- `AWAITING_EMPLOYEE`: Đang chờ nhân viên
- `CONFIRMED`: Đã xác nhận
- `IN_PROGRESS`: Đang thực hiện
- `COMPLETED`: Đã hoàn thành
- `CANCELLED`: Đã hủy

## Error Responses

### 400 Bad Request - Invalid Time Unit
```json
{
  "success": false,
  "message": "Đơn vị thời gian không hợp lệ. Chỉ chấp nhận: DAY, WEEK, MONTH, YEAR"
}
```

### 400 Bad Request - Customer Not Found
```json
{
  "success": false,
  "message": "Không tìm thấy khách hàng với ID: CUST999"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token không hợp lệ"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Không có quyền truy cập. Bạn chỉ có thể xem thống kê của chính mình."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi lấy thống kê booking"
}
```

## Business Rules

1. **Time Unit Calculation**: Nếu không cung cấp startDate và endDate, hệ thống sẽ tự động tính toán dựa trên timeUnit:
   - `DAY`: Lấy thống kê từ 24 giờ trước đến hiện tại
   - `WEEK`: Lấy thống kê từ 7 ngày trước đến hiện tại
   - `MONTH`: Lấy thống kê từ 30 ngày trước đến hiện tại
   - `YEAR`: Lấy thống kê từ 365 ngày trước đến hiện tại

2. **Date Range Filtering**: Thống kê dựa trên trường `bookingTime` của booking, không phải `createdAt`.

3. **Authorization**: Customer chỉ có thể truy cập thống kế của chính họ. Admin có thể truy cập thống kê của bất kỳ customer nào.

4. **All Statuses Included**: Response luôn bao gồm tất cả các trạng thái booking, kể cả những trạng thái có số lượng bằng 0.

## Use Cases

### 1. Xem thống kê booking trong tháng
```http
GET /api/v1/customer/CUST001/bookings/statistics?timeUnit=MONTH
```

### 2. Xem thống kê booking trong 1 tuần cụ thể
```http
GET /api/v1/customer/CUST001/bookings/statistics?timeUnit=WEEK&startDate=2025-11-01T00:00:00&endDate=2025-11-07T23:59:59
```

### 3. Xem thống kê booking trong 1 ngày cụ thể
```http
GET /api/v1/customer/CUST001/bookings/statistics?timeUnit=DAY&startDate=2025-11-19T00:00:00&endDate=2025-11-19T23:59:59
```

### 4. Xem thống kê booking trong năm
```http
GET /api/v1/customer/CUST001/bookings/statistics?timeUnit=YEAR
```