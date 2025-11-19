# Employee Assignment Controller API Documentation


## Luồng xử lý:
- Khi tạo booking mà có chọn employee -> tạo assigment với status=PENDING
- Employee gọi /api/v1/employee/{employeeId}/assignments để lấy assignment có status PENDING
- Employee gọi /api/v1/employee/assignments/{assignmentId}/accept để nhận đơn
- Employee gọi /api/v1/employee/assignments/{assignmentId}/cancel để huỷ đơn

## Base URL
```
/api/v1/employee
```

---

## 1. Get Employee Assignments

### Endpoint
```http
GET /api/v1/employee/{employeeId}/assignments
```

### Description
Lấy danh sách công việc được phân công cho nhân viên, có thể lọc theo trạng thái.

### Authorization
- Required: Yes
- Roles: `ROLE_EMPLOYEE`, `ROLE_ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | String | Yes | ID của nhân viên |

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | String | No | - | Lọc theo trạng thái assignment (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED) |
| page | int | No | 0 | Số trang (bắt đầu từ 0) |
| size | int | No | 10 | Số lượng items trên mỗi trang |

### Request Example
```http
GET /api/v1/employee/e1000001-0000-0000-0000-000000000001/assignments?status=PENDING&page=0&size=10
Authorization: Bearer {token}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "message": "Lấy danh sách công việc thành công",
  "data": [
    {
      "assignmentId": "as000001-0000-0000-0000-000000000003",
      "bookingCode": "BK000008",
      "serviceName": "Dọn dẹp theo giờ",
      "customerName": "John Doe",
      "customerPhone": "0901234567",
      "address": "123 Nguyen Hue, Ben Nghe Ward, District 1, Ho Chi Minh City",
      "bookingTime": "2025-11-15T09:00:00",
      "estimatedDuration": 2.0,
      "pricePerUnit": 50000,
      "quantity": 4,
      "subTotal": 200000,
      "status": "PENDING",
      "assignedAt": null,
      "checkInTime": null,
      "checkOutTime": null,
      "note": "Test assignment PENDING - Dọn dẹp căn hộ"
    },
    {
      "assignmentId": "as000001-0000-0000-0000-000000000006",
      "bookingCode": "BK000011",
      "serviceName": "Tổng vệ sinh",
      "customerName": "Emily Customer",
      "customerPhone": "0905555555",
      "address": "789 Le Duan, Ben Thanh Ward, District 1, Ho Chi Minh City",
      "bookingTime": "2025-11-25T08:00:00",
      "estimatedDuration": 2.0,
      "pricePerUnit": 100000,
      "quantity": 2,
      "subTotal": 200000,
      "status": "PENDING",
      "assignedAt": null,
      "checkInTime": null,
      "checkOutTime": null,
      "note": "Test nhiều assignments - Tổng vệ sinh căn hộ lớn"
    }
  ],
  "totalItems": 2
}
```

### Response Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Lỗi khi lấy danh sách công việc: {error details}"
}
```

---

## 2. Cancel Assignment

### Endpoint
```http
POST /api/v1/employee/assignments/{assignmentId}/cancel
```

### Description
Hủy công việc đã được phân công. Chỉ có thể hủy khi assignment ở trạng thái PENDING hoặc ASSIGNED và phải hủy trước 30 phút so với thời gian bắt đầu.

### Authorization
- Required: Yes
- Roles: `ROLE_EMPLOYEE`, `ROLE_ADMIN`

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| assignmentId | String | Yes | ID của assignment cần hủy |

### Request Body
```json
{
  "reason": "Có việc đột xuất, không thể tham gia"
}
```

### Request Body Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | String | Yes | Lý do hủy công việc |

### Request Example
```http
POST /api/v1/employee/assignments/as000001-0000-0000-0000-000000000004/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Có việc đột xuất, không thể tham gia"
}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "message": "Hủy công việc thành công. Hệ thống sẽ thông báo cho khách hàng."
}
```

### Response Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Không thể hủy công việc trong vòng 30 phút trước giờ bắt đầu"
}
```

```json
{
  "success": false,
  "message": "Chỉ có thể hủy công việc đang ở trạng thái 'Chờ xác nhận' hoặc 'Đã nhận'"
}
```

### Response Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Lỗi khi hủy công việc: {error details}"
}
```

---

## 3. Accept Assignment

### Endpoint
```http
POST /api/v1/employee/assignments/{assignmentId}/accept
```

### Description
Nhân viên chấp nhận assignment đang ở trạng thái PENDING. Sau khi chấp nhận, assignment sẽ chuyển sang trạng thái ASSIGNED.

### Authorization
- Required: Yes
- Roles: `ROLE_EMPLOYEE`

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| assignmentId | String | Yes | ID của assignment cần chấp nhận |

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| employeeId | String | Yes | ID của nhân viên chấp nhận |

### Request Example
```http
POST /api/v1/employee/assignments/as000001-0000-0000-0000-000000000003/accept?employeeId=e1000001-0000-0000-0000-000000000001
Authorization: Bearer {token}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "message": "Nhận công việc thành công",
  "data": {
    "assignmentId": "as000001-0000-0000-0000-000000000003",
    "bookingCode": "BK000008",
    "serviceName": "Dọn dẹp theo giờ",
    "customerName": "John Doe",
    "customerPhone": "0901234567",
    "address": "123 Nguyen Hue, Ben Nghe Ward, District 1, Ho Chi Minh City",
    "bookingTime": "2025-11-15T09:00:00",
    "estimatedDuration": 2.0,
    "pricePerUnit": 50000,
    "quantity": 4,
    "subTotal": 200000,
    "status": "ASSIGNED",
    "assignedAt": null,
    "checkInTime": null,
    "checkOutTime": null,
    "note": "Test assignment PENDING - Dọn dẹp căn hộ"
  }
}
```

### Response Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Không thể nhận công việc đang ở trạng thái ASSIGNED. Chỉ có thể nhận công việc đang ở trạng thái PENDING."
}
```

```json
{
  "success": false,
  "message": "Nhân viên đã được phân công công việc khác trong khung giờ này"
}
```

```json
{
  "success": false,
  "message": "Nhân viên đang có lịch nghỉ được phê duyệt trong khung giờ này"
}
```

```json
{
  "success": false,
  "message": "Không tìm thấy công việc"
}
```

### Response Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Lỗi khi nhận công việc: {error details}"
}
```

---

## 4. Get Available Bookings

### Endpoint
```http
GET /api/v1/employee/available-bookings
```

### Description
Lấy danh sách các booking đang chờ nhân viên nhận việc. Ưu tiên hiển thị các booking trong khu vực làm việc của nhân viên.

### Authorization
- Required: Yes
- Roles: `ROLE_EMPLOYEE`, `ROLE_ADMIN`

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| employeeId | String | Yes | - | ID của nhân viên |
| page | int | No | 0 | Số trang (bắt đầu từ 0) |
| size | int | No | 10 | Số lượng items trên mỗi trang |

### Request Example
```http
GET /api/v1/employee/available-bookings?employeeId=e1000001-0000-0000-0000-000000000001&page=0&size=10
Authorization: Bearer {token}
```

### Response Success (200 OK)
```json
{
  "success": true,
  "message": "Lấy danh sách booking chờ thành công",
  "data": [
    {
      "detailId": "bd000001-0000-0000-0000-000000000003",
      "bookingCode": "BK000003",
      "serviceName": "Tổng vệ sinh",
      "address": "321 Pasteur, Vo Thi Sau Ward, District 3, Ho Chi Minh City",
      "bookingTime": "2025-11-01T08:00:00",
      "estimatedDuration": 2.0,
      "quantity": 1
    },
    {
      "detailId": "bd000001-0000-0000-0000-000000000004",
      "bookingCode": "BK000004",
      "serviceName": "Giặt sấy theo kg",
      "address": "654 Hai Ba Trung, Tan Dinh Ward, District 1, Ho Chi Minh City",
      "bookingTime": "2025-11-02T10:00:00",
      "estimatedDuration": 24.0,
      "quantity": 10
    }
  ],
  "totalItems": 2
}
```

### Response Success - Empty (200 OK)
```json
{
  "success": true,
  "message": "Không có booking chờ",
  "data": [],
  "totalItems": 0
}
```

### Response Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Lỗi khi lấy danh sách booking chờ: {error details}"
}
```

---

## Common Response Models

### AssignmentDetailResponse
```typescript
{
  assignmentId: string;          // ID của assignment
  bookingCode: string;           // Mã booking
  serviceName: string;           // Tên dịch vụ
  customerName: string;          // Tên khách hàng
  customerPhone: string;         // SĐT khách hàng
  address: string;               // Địa chỉ làm việc
  bookingTime: DateTime;         // Thời gian bắt đầu
  estimatedDuration: number;     // Thời lượng ước tính (giờ)
  pricePerUnit: number;          // Giá mỗi đơn vị
  quantity: number;              // Số lượng
  subTotal: number;              // Tổng tiền
  status: AssignmentStatus;      // Trạng thái assignment
  assignedAt: DateTime | null;  // Thời gian được phân công (deprecated)
  checkInTime: DateTime | null;  // Thời gian check-in
  checkOutTime: DateTime | null; // Thời gian check-out
  note: string | null;           // Ghi chú
}
```

### BookingSummary
```typescript
{
  detailId: string;              // ID của booking detail
  bookingCode: string;           // Mã booking
  serviceName: string;           // Tên dịch vụ
  address: string;               // Địa chỉ làm việc
  bookingTime: DateTime;         // Thời gian bắt đầu
  estimatedDuration: number;     // Thời lượng ước tính (giờ)
  quantity: number;              // Số lượng nhân viên cần
}
```

### AssignmentStatus Enum
```
PENDING       - Chờ nhân viên xác nhận
ASSIGNED      - Đã nhận việc
IN_PROGRESS   - Đang thực hiện
COMPLETED     - Hoàn thành
CANCELLED     - Đã hủy
NO_SHOW       - Nhân viên không đến
```
---

## Notes

1. **Authentication**: Tất cả endpoints đều yêu cầu Bearer token trong header `Authorization`

2. **Check-in Time Window**: Chỉ được check-in trong khoảng từ **10 phút trước** đến **5 phút sau** thời gian bắt đầu booking

3. **Cancel Time Constraint**: Chỉ có thể hủy assignment trước **30 phút** so với thời gian bắt đầu

4. **Image Upload Limits**:
   - Tối đa: 10 ảnh
   - Kích thước mỗi ảnh: <= 10MB
   - Format: Chỉ chấp nhận file ảnh (image/*)

5. **Assignment Status Flow**:
   ```
   PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
                ↓
            CANCELLED
   ```

6. **Working Zone Priority**: API `available-bookings` ưu tiên hiển thị các booking trong khu vực làm việc của nhân viên, sau đó mới hiển thị các booking khác gần nhất.

---

## Test Data & Examples

### Available Test Accounts

**Employee Account:**
- Employee ID: `e1000001-0000-0000-0000-000000000001` (Alice Employee)
- Employee ID: `e1000001-0000-0000-0000-000000000002` (Bob Employee)
- Employee ID: `e1000001-0000-0000-0000-000000000003` (Charlie Employee)

### Test Scenarios with Real Data

#### Scenario 1: Get All Assignments (Employee 1)
```bash
GET /api/v1/employee/e1000001-0000-0000-0000-000000000001/assignments
```
**Expected Result:** 6 assignments
- 2 PENDING
- 2 ASSIGNED
- 1 IN_PROGRESS
- 1 COMPLETED

#### Scenario 2: Filter by Status - PENDING
```bash
GET /api/v1/employee/e1000001-0000-0000-0000-000000000001/assignments?status=PENDING
```
**Expected Assignments:**
| Assignment ID | Booking | Service | Time | Note |
|---------------|---------|---------|------|------|
| as...003 | BK000008 | Dọn dẹp theo giờ | 2025-11-15 09:00 | Test accept |
| as...006 | BK000011 | Tổng vệ sinh | 2025-11-25 08:00 | Multi-assign |

#### Scenario 3: Accept Assignment - Success ✅
```bash
POST /api/v1/employee/assignments/as000001-0000-0000-0000-000000000003/accept?employeeId=e1000001-0000-0000-0000-000000000001
```
**Initial State:**
- Assignment: `as000001-0000-0000-0000-000000000003`
- Status: `PENDING`
- Booking: `BK000008` at `2025-11-15 09:00:00`
- Service: Dọn dẹp theo giờ (4 giờ)

**Expected Result:**
- Status changes: `PENDING` → `ASSIGNED`
- HTTP 200 OK
- Response contains full assignment details

#### Scenario 4: Accept Assignment - Fail (Already Assigned) ❌
```bash
POST /api/v1/employee/assignments/as000001-0000-0000-0000-000000000005/accept?employeeId=e1000001-0000-0000-0000-000000000001
```
**Initial State:**
- Assignment: `as000001-0000-0000-0000-000000000005`
- Status: `ASSIGNED` (already accepted)

**Expected Result:**
- HTTP 400 Bad Request
- Error: "Không thể nhận công việc đang ở trạng thái ASSIGNED..."

#### Scenario 5: Cancel Assignment - Success (PENDING, Far Future) ✅
```bash
POST /api/v1/employee/assignments/as000001-0000-0000-0000-000000000004/cancel
Content-Type: application/json

{
  "reason": "Có việc đột xuất, không thể tham gia"
}
```
**Initial State:**
- Assignment: `as000001-0000-0000-0000-000000000004`
- Status: `PENDING`
- Booking: `BK000009` at `2025-11-20 14:00:00` (far in future)

**Expected Result:**
- Status changes: `PENDING` → `CANCELLED`
- HTTP 200 OK
- Customer receives crisis notification

#### Scenario 6: Cancel Assignment - Success (ASSIGNED, Far Future) ✅
```bash
POST /api/v1/employee/assignments/as000001-0000-0000-0000-000000000005/cancel
Content-Type: application/json

{
  "reason": "Lịch trình bị đổi đột ngột"
}
```
**Initial State:**
- Assignment: `as000001-0000-0000-0000-000000000005`
- Status: `ASSIGNED`
- Booking: `BK000010` at `2025-11-18 10:00:00`

**Expected Result:**
- Status changes: `ASSIGNED` → `CANCELLED`
- HTTP 200 OK

#### Scenario 7: Cancel Assignment - Fail (Too Close to Start Time) ❌
```bash
POST /api/v1/employee/assignments/as000001-0000-0000-0000-000000000010/cancel
Content-Type: application/json

{
  "reason": "Muốn hủy gấp"
}
```
**Initial State:**
- Assignment: `as000001-0000-0000-0000-000000000010`
- Status: `PENDING`
- Booking: `BK000013` at `2025-11-07 14:30:00` (< 30 minutes from now)

**Expected Result:**
- HTTP 400 Bad Request
- Error: "Không thể hủy công việc trong vòng 30 phút trước giờ bắt đầu"

#### Scenario 8: Cancel Assignment - Fail (IN_PROGRESS) ❌
```bash
POST /api/v1/employee/assignments/as000001-0000-0000-0000-000000000009/cancel
Content-Type: application/json

{
  "reason": "Không muốn làm nữa"
}
```
**Initial State:**
- Assignment: `as000001-0000-0000-0000-000000000009`
- Status: `IN_PROGRESS` (already checked in)
- Check-in time: `2025-11-07 08:00:00`

**Expected Result:**
- HTTP 400 Bad Request
- Error: "Chỉ có thể hủy công việc đang ở trạng thái 'Chờ xác nhận' hoặc 'Đã nhận'"

#### Scenario 9: Get Available Bookings
```bash
GET /api/v1/employee/available-bookings?employeeId=e1000001-0000-0000-0000-000000000001&page=0&size=10
```
**Expected Result:**
- List of PENDING bookings without assignments
- Bookings: BK000003, BK000004, BK000005, BK000006, BK000007
- Prioritized by working zones (if employee has working zones)

#### Scenario 10: Accept Booking Detail (Self-assign)
```bash
POST /api/v1/employee/booking-details/bd000001-0000-0000-0000-000000000003/accept?employeeId=e1000001-0000-0000-0000-000000000001
```
**Initial State:**
- Booking Detail: `bd000001-0000-0000-0000-000000000003`
- Booking: `BK000003` (PENDING, not verified)
- Service: Tổng vệ sinh
- No assignments yet

**Expected Result:**
- New assignment created with status `ASSIGNED`
- HTTP 200 OK
- Assignment details returned