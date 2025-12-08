# API Employee - Lấy Thống Kê Booking và Assignment Theo Trạng Thái

## Tổng Quan
Tài liệu này mô tả hai API endpoints cho phép nhân viên lấy thống kê về:
1. **Booking Statistics**: Số lượng booking (đơn hàng) mà nhân viên được phân công theo trạng thái booking
2. **Assignment Statistics**: Số lượng công việc (assignments) được phân công cho nhân viên theo trạng thái công việc

---

## 1. API Lấy Thống Kê Booking

### Endpoint
```
GET /api/v1/employee/{employeeId}/bookings/statistics
```

### Mô tả
API này cho phép nhân viên lấy thống kê số lượng booking (đơn hàng) mà họ được phân công theo từng trạng thái booking và theo đơn vị thời gian (ngày, tuần, tháng, năm).

**Lưu ý**: API này đếm số lượng **booking riêng biệt** (distinct bookings) mà nhân viên có assignment, không phải tổng số assignment.

### Authorization
- **Required**: Yes
- **Type**: Bearer Token
- **Roles**: `ROLE_EMPLOYEE`, `ROLE_ADMIN`
- **Note**: Employee chỉ có thể truy cập thống kê của chính mình. Admin có thể truy cập thống kê của bất kỳ employee nào.

### Request

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | String | Yes | ID của nhân viên cần lấy thống kê |

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| timeUnit | String | Yes | Đơn vị thời gian. Các giá trị hợp lệ: `DAY`, `WEEK`, `MONTH`, `YEAR` | `MONTH` |
| startDate | String (ISO DateTime) | No | Ngày bắt đầu của khoảng thời gian (nếu không có sẽ tự động tính dựa trên timeUnit) | `2025-10-19T00:00:00` |
| endDate | String (ISO DateTime) | No | Ngày kết thúc của khoảng thời gian (nếu không có sẽ mặc định là thời điểm hiện tại) | `2025-11-19T23:59:59` |

#### Headers
```
Authorization: Bearer {access_token}
```

#### Request Example
```http
GET /api/v1/employee/EMP001/bookings/statistics?timeUnit=MONTH HTTP/1.1
Host: localhost:8080
Authorization: Bearer <Token_EMP001>
```

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "timeUnit": "MONTH",
    "startDate": "2025-10-19T00:00:00",
    "endDate": "2025-11-19T23:59:59.999999999",
    "totalBookings": 18,
    "countByStatus": {
      "PENDING": 2,
      "AWAITING_EMPLOYEE": 1,
      "CONFIRMED": 4,
      "IN_PROGRESS": 3,
      "COMPLETED": 8,
      "CANCELLED": 0
    }
  }
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Trạng thái thành công của request |
| data | Object | Dữ liệu thống kê |
| data.timeUnit | String | Đơn vị thời gian được sử dụng |
| data.startDate | String | Ngày bắt đầu của khoảng thời gian thống kê |
| data.endDate | String | Ngày kết thúc của khoảng thời gian thống kê |
| data.totalBookings | Long | Tổng số booking riêng biệt trong khoảng thời gian |
| data.countByStatus | Object | Map chứa số lượng booking theo từng trạng thái |

#### Booking Status Values
- `PENDING`: Đang chờ xử lý
- `AWAITING_EMPLOYEE`: Đang chờ nhân viên
- `CONFIRMED`: Đã xác nhận
- `IN_PROGRESS`: Đang thực hiện
- `COMPLETED`: Đã hoàn thành
- `CANCELLED`: Đã hủy

---

## 2. API Lấy Thống Kê Assignment (Công Việc)

### Endpoint
```
GET /api/v1/employee/{employeeId}/assignments/statistics
```

### Mô tả
API này cho phép nhân viên lấy thống kê số lượng công việc (assignments) được phân công cho họ theo từng trạng thái assignment và theo đơn vị thời gian (ngày, tuần, tháng, năm).

**Lưu ý**: API này đếm số lượng **assignment** (công việc), một booking có thể có nhiều assignment nếu có nhiều dịch vụ.

### Authorization
- **Required**: Yes
- **Type**: Bearer Token
- **Roles**: `ROLE_EMPLOYEE`, `ROLE_ADMIN`
- **Note**: Employee chỉ có thể truy cập thống kê của chính mình. Admin có thể truy cập thống kê của bất kỳ employee nào.

### Request

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | String | Yes | ID của nhân viên cần lấy thống kê |

#### Query Parameters
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| timeUnit | String | Yes | Đơn vị thời gian. Các giá trị hợp lệ: `DAY`, `WEEK`, `MONTH`, `YEAR` | `MONTH` |
| startDate | String (ISO DateTime) | No | Ngày bắt đầu của khoảng thời gian (nếu không có sẽ tự động tính dựa trên timeUnit) | `2025-10-19T00:00:00` |
| endDate | String (ISO DateTime) | No | Ngày kết thúc của khoảng thời gian (nếu không có sẽ mặc định là thời điểm hiện tại) | `2025-11-19T23:59:59` |

#### Headers
```
Authorization: Bearer {access_token}
```

#### Request Example
```http
GET /api/v1/employee/EMP001/assignments/statistics?timeUnit=WEEK HTTP/1.1
Host: localhost
Authorization: Bearer <Token_EMP001>
```

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "timeUnit": "WEEK",
    "startDate": "2025-11-12T00:00:00",
    "endDate": "2025-11-19T23:59:59.999999999",
    "totalAssignments": 25,
    "countByStatus": {
      "PENDING": 3,
      "ASSIGNED": 5,
      "IN_PROGRESS": 4,
      "COMPLETED": 12,
      "CANCELLED": 1,
      "NO_SHOW": 0
    }
  }
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Trạng thái thành công của request |
| data | Object | Dữ liệu thống kê |
| data.timeUnit | String | Đơn vị thời gian được sử dụng |
| data.startDate | String | Ngày bắt đầu của khoảng thời gian thống kê |
| data.endDate | String | Ngày kết thúc của khoảng thời gian thống kê |
| data.totalAssignments | Long | Tổng số assignment trong khoảng thời gian |
| data.countByStatus | Object | Map chứa số lượng assignment theo từng trạng thái |

#### Assignment Status Values
- `PENDING`: Đang chờ nhân viên chấp nhận
- `ASSIGNED`: Đã được phân công
- `IN_PROGRESS`: Đang thực hiện
- `COMPLETED`: Đã hoàn thành
- `CANCELLED`: Đã hủy
- `NO_SHOW`: Nhân viên không đến

---

## Error Responses (Áp dụng cho cả 2 API)

### 400 Bad Request - Invalid Time Unit
```json
{
  "success": false,
  "message": "Đơn vị thời gian không hợp lệ. Chỉ chấp nhận: DAY, WEEK, MONTH, YEAR"
}
```

### 400 Bad Request - Employee Not Found
```json
{
  "success": false,
  "message": "Không tìm thấy nhân viên với ID: EMP999"
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

### 500 Internal Server Error - Booking Statistics
```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi lấy thống kê booking"
}
```

### 500 Internal Server Error - Assignment Statistics
```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi lấy thống kê công việc"
}
```

---

## Business Rules

### Time Unit Calculation
Nếu không cung cấp startDate và endDate, hệ thống sẽ tự động tính toán dựa trên timeUnit:
- `DAY`: Lấy thống kê từ 24 giờ trước đến hiện tại
- `WEEK`: Lấy thống kê từ 7 ngày trước đến hiện tại
- `MONTH`: Lấy thống kê từ 30 ngày trước đến hiện tại
- `YEAR`: Lấy thống kê từ 365 ngày trước đến hiện tại

### Date Range Filtering
- **Booking Statistics**: Thống kê dựa trên trường `bookingTime` của booking
- **Assignment Statistics**: Thống kê dựa trên trường `bookingTime` của booking liên quan đến assignment

### Authorization
- Employee chỉ có thể truy cập thống kê của chính họ
- Admin có thể truy cập thống kê của bất kỳ employee nào

### All Statuses Included
Response luôn bao gồm tất cả các trạng thái, kể cả những trạng thái có số lượng bằng 0.

### Booking vs Assignment Counting
- **Booking Statistics**: Đếm số lượng booking **riêng biệt** (DISTINCT) mà employee có assignment
  - Một booking với nhiều dịch vụ chỉ được đếm 1 lần
- **Assignment Statistics**: Đếm tổng số assignment được phân công
  - Một booking với 3 dịch vụ sẽ có 3 assignment, được đếm là 3

---

## Use Cases

### Booking Statistics

#### 1. Xem thống kê booking trong tháng
```http
GET /api/v1/employee/EMP001/bookings/statistics?timeUnit=MONTH
```

#### 2. Xem thống kê booking trong 1 tuần cụ thể
```http
GET /api/v1/employee/EMP001/bookings/statistics?timeUnit=WEEK&startDate=2025-11-01T00:00:00&endDate=2025-11-07T23:59:59
```

#### 3. Xem thống kê booking trong 1 ngày cụ thể
```http
GET /api/v1/employee/EMP001/bookings/statistics?timeUnit=DAY&startDate=2025-11-19T00:00:00&endDate=2025-11-19T23:59:59
```

### Assignment Statistics

#### 1. Xem thống kê công việc trong tuần
```http
GET /api/v1/employee/EMP001/assignments/statistics?timeUnit=WEEK
```

#### 2. Xem thống kê công việc trong tháng cụ thể
```http
GET /api/v1/employee/EMP001/assignments/statistics?timeUnit=MONTH&startDate=2025-11-01T00:00:00&endDate=2025-11-30T23:59:59
```

#### 3. Xem thống kê công việc trong năm
```http
GET /api/v1/employee/EMP001/assignments/statistics?timeUnit=YEAR
```