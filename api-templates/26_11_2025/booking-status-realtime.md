# Realtime booking status, assignment progress & notification badge (26-11-2025)

Tài liệu này ghép các REST API hiện có với luồng WebSocket để FE không phải polling khi trạng thái booking đổi hoặc khi có thông báo mới.

- Gateway STOMP: `/ws/notifications` (SockJS, heartbeat 25s). Nên gửi header `Authorization: Bearer <token>` ngay từ frame CONNECT để gán đúng `accountId`.
- Đăng ký hàng đợi cá nhân:  
  - Customer: `/user/{accountId}/CUSTOMER/queue/notifications`  
  - Employee: `/user/{accountId}/EMPLOYEE/queue/notifications`  
  - Fallback chung: `/user/{accountId}/queue/notifications`  
- Payload mặc định gửi qua queue ở trên là `NotificationWebSocketDTO`.

## 1) REST endpoints liên quan đến trạng thái

- **PUT** `/api/v1/admin/bookings/{bookingId}/status`  
  - Body: `{ "status": "CONFIRMED|CANCELLED|COMPLETED|IN_PROGRESS|AWAITING_EMPLOYEE|PENDING", "adminComment": "optional" }`  
  - Bảo vệ bởi `ROLE_ADMIN`.  
  - Response: `{ success, message, data: BookingResponse }` (booking được set `isVerified=true`).

- **POST** `/api/v1/employee/assignments/{assignmentId}/check-in`  
  - `multipart/form-data` với 2 part:  
    - `request`: JSON string `{"employeeId":"...","imageDescription":"optional"}`  
    - `images`: 0..10 ảnh (<=10MB, content-type `image/*`).  
  - Trả về `AssignmentActionResponse { success, message, assignment: AssignmentDetailResponse }` với `checkInTime` đã set.

- **POST** `/api/v1/employee/assignments/{assignmentId}/check-out`  
  - Payload tương tự check-in.  
  - Khi tất cả assignments cùng booking xong, `BookingStatus` được đẩy sang `COMPLETED` và tạo notification cho customer.

- **GET** `/api/v1/notifications/unread-count`  
  - Trả `{ success, count }` để FE fallback khi mất WS.

## 2) Notification WebSocket payload

`NotificationWebSocketDTO` (được build trong `WebSocketNotificationService.sendNotificationToUser`):

| Trường | Kiểu | Mô tả |
| --- | --- | --- |
| `notificationId` | string | Khóa chính bảng `notifications` |
| `accountId` | string | Chủ sở hữu thông báo |
| `targetRole` | string | `CUSTOMER|EMPLOYEE|ADMIN` (dùng để định tuyến queue) |
| `type` | string | `Notification.NotificationType` |
| `title` | string | Tiêu đề ngắn |
| `message` | string | Nội dung |
| `relatedId` | string | bookingId/assignmentId/paymentId... |
| `relatedType` | string | `BOOKING|ASSIGNMENT|PAYMENT|REVIEW|PROMOTION|SYSTEM` |
| `priority` | string | `LOW|NORMAL|HIGH|URGENT` |
| `actionUrl` | string | Deep-link FE |
| `createdAt` | string ISO-8601 | Thời gian tạo |
| `unreadCount` | number | Tổng thông báo chưa đọc của `accountId` (đã được backend tính qua `countUnreadByAccountId`). |

### Mapping sự kiện -> Notification (đang phát WS)

| Hành động backend | NotificationType | Người nhận (queue) | Ghi chú |
| --- | --- | --- | --- |
| Booking đủ nhân viên / chuyển `CONFIRMED` (AssignmentServiceImpl.acceptBookingDetail) | `BOOKING_CONFIRMED` | `/user/{customerAccountId}/CUSTOMER/queue/notifications` | Nội dung: "Booking {code} đã được xác nhận..." |
| Khách hủy booking (BookingServiceImpl.cancelBooking) | `BOOKING_CANCELLED` | Customer queue | Message chứa lý do hủy. |
| Nhân viên hủy assignment (AssignmentServiceImpl.cancelAssignment) | `ASSIGNMENT_CRISIS` | Customer queue | Báo khẩn để khách xử lý. |
| Hệ thống hủy assignment cho employee (cancelBooking cascade) | `ASSIGNMENT_CANCELLED` | Employee queue | Mỗi employee 1 notification. |
| Booking hoàn tất (tất cả check-out xong) | `BOOKING_COMPLETED` | Customer queue | Bắn trong `AssignmentServiceImpl.checkOut`. |
| Nhân viên được gán / auto-assign | `ASSIGNMENT_CREATED` | Employee queue | Gửi ngay sau khi save assignment. |

**Ví dụ payload (data seed 91 & 96):**

```json
{
  "notificationId": "ntf00002-0000-0000-0000-000000000001",
  "accountId": "a1000001-0000-0000-0000-000000000001",
  "targetRole": "CUSTOMER",
  "type": "BOOKING_CONFIRMED",
  "title": "Booking đã được xác nhận",
  "message": "Booking BK000054 của bạn đã được xác nhận. Nhân viên sẽ đến đúng giờ đã hẹn.",
  "relatedId": "b0000001-0000-0000-0000-000000000054",
  "relatedType": "BOOKING",
  "priority": "HIGH",
  "actionUrl": "/bookings/b0000001-0000-0000-0000-000000000054",
  "createdAt": "2025-11-01T09:00:00+07:00",
  "unreadCount": 3
}
```

Badge count: backend đã chèn `unreadCount` trước khi `convertAndSendToUser(...)`, vì vậy FE chỉ cần đọc trường này để cập nhật icon chuông.

## 3) Realtime booking status timeline (đã publish)

Backend đã bắn 2 topic qua `BookingRealtimeEventPublisher`:

- **Status topic**: `/topic/bookings/{bookingId}/status`  
  Payload `BookingStatusWebSocketEvent`:
  ```json
  {
    "bookingId": "b0000001-0000-0000-0000-000000000054",
    "bookingCode": "BK000054",
    "status": "COMPLETED",
    "trigger": "CHECK_OUT_ALL",
    "triggeredBy": null,
    "note": "Nhân viên đã checkout đủ",
    "at": "2025-11-01T13:05:00+07:00"
  }
  ```

- **Assignment progress topic**: `/topic/bookings/{bookingId}/assignments` (cả customer & nhân viên cùng subscribe)  
  Payload `AssignmentProgressWebSocketEvent`:
  ```json
  {
    "bookingId": "b0000001-0000-0000-0000-000000000012",
    "bookingCode": "BK000012",
    "assignmentId": "as000001-0000-0000-0000-000000000009",
    "employeeId": "e1000001-0000-0000-0000-000000000001",
    "employeeName": "Jane Smith",
    "status": "IN_PROGRESS",
    "checkInTime": "2025-11-07T08:02:00+07:00",
    "checkOutTime": null,
    "bookingStatusAfterUpdate": "IN_PROGRESS",
    "at": "2025-11-07T08:02:05+07:00",
    "action": "CHECK_IN"
  }
  ```

Ánh xạ trigger/payload thực tế:
- `AssignmentServiceImpl.checkIn`: publish progress `action=CHECK_IN`; nếu booking chuyển `IN_PROGRESS` thì emit status `trigger=CHECK_IN`.
- `AssignmentServiceImpl.checkOut`: publish progress `action=CHECK_OUT`; nếu tất cả assignment xong → status `trigger=CHECK_OUT_ALL`, otherwise `trigger=CHECK_OUT`.
- `AssignmentServiceImpl.acceptBookingDetail`: khi đủ nhân viên chuyển `CONFIRMED` → status `trigger=EMPLOYEE_ACCEPT`.
- `AssignmentServiceImpl.cancelAssignment`: nếu tất cả assignment bị hủy khiến booking hủy → status `trigger=ASSIGNMENT_CANCELLED`.
- `BookingServiceImpl.updateBookingStatus` (admin) → status `trigger=ADMIN_UPDATE`, `note=adminComment`.
- `BookingServiceImpl.cancelBooking` (customer) → status `trigger=CUSTOMER_CANCEL`, `note=reason`.

## 4) REST/WS phối hợp hiển thị badge & tiến độ

- Khi nhận 1 `NotificationWebSocketDTO`, FE:
  1) Cập nhật badge = `unreadCount` (nếu backend đã gửi). Nếu thiếu, gọi `GET /api/v1/notifications/unread-count`.
  2) Dùng `type` để hiển thị toast hoặc refresh màn hình booking.
- Khi nhận `AssignmentProgressEvent`, FE cập nhật timeline công việc, bật cảnh báo trễ nếu `checkInTime` > slot cho phép (window check-in: -10 phút đến +5 phút so với `bookingTime`, logic trong service).
- Nếu mất WS: refetch danh sách thông báo và trạng thái booking qua REST (admin booking list, employee assignments).

## 5) Mẫu request nhanh

- Check-in assignment với ảnh:
```bash
curl -X POST "https://api.example.com/api/v1/employee/assignments/as000001-0000-0000-0000-000000000009/check-in" ^
  -H "Authorization: Bearer <token>" ^
  -F "request={\"employeeId\":\"e1000001-0000-0000-0000-000000000001\",\"imageDescription\":\"Bắt đầu lúc 8h02\"}" ^
  -F "images=@C:/tmp/checkin1.jpg"
```

- Subscribe JS:
```js
client.subscribe(`/user/${accountId}/${role}/queue/notifications`, (frame) => {
  const payload = JSON.parse(frame.body);
  updateBadge(payload.unreadCount);
  showToast(payload.title, payload.message);
});
client.subscribe(`/topic/bookings/${bookingId}/assignments`, handleAssignmentProgress);
```
