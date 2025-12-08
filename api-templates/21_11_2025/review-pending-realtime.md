# Review Pending - Realtime (21-11-2025)

Tài liệu cho FE về danh sách “chưa đánh giá” và realtime cập nhật qua WebSocket.

## API
- `GET /api/v1/reviews/pending`
  - Role: CUSTOMER (Bearer token)
  - Header: `Authorization: Bearer <token>`
  - Response 200:
    ```json
    {
      "success": true,
      "data": [
        {
          "bookingId": "bk000123-0000-0000-0000-000000000123",
          "bookingCode": "BK000123",
          "bookingTime": "2025-11-21T10:00:00",
          "assignmentId": "as000001-0000-0000-0000-000000000001",
          "serviceName": "Vệ sinh nhà cửa",
          "employeeId": "e1000001-0000-0000-0000-000000000003",
          "employeeName": "Trần Văn Long",
          "employeeAvatar": "https://.../avatar.png"
        }
      ],
      "total": 1
    }
    ```
  - Dữ liệu lấy từ assignments đã COMPLETED của customer, bỏ các cặp booking-employee đã có review.

## WebSocket
- Endpoint: `/ws/notifications` (SockJS + STOMP), broker `/topic`.
- Subscribe: `/topic/reviews/pending/{accountId}` (accountId của customer).

### Payload (PendingReviewWebSocketEvent)
```json
{
  "action": "ADD | REMOVE",
  "payload": {
    "bookingId": "bk000123-...",
    "bookingCode": "BK000123",
    "bookingTime": "2025-11-21T10:00:00",
    "assignmentId": "as000001-...",
    "serviceName": "Vệ sinh nhà cửa",
    "employeeId": "e1000001-0000-0000-0000-000000000003",
    "employeeName": "Trần Văn Long",
    "employeeAvatar": "https://.../avatar.png"
  },
  "bookingId": "bk000123-...",
  "employeeId": "e1000001-..."
}
```

### Khi nào đẩy?
- `ADD`: Sau khi thanh toán thành công (status đổi sang PAID), cho từng assignment hoàn tất của booking chưa bị cancel.
- `REMOVE`: Khi customer gửi review thành công cho cặp booking-employee.

## Luồng gợi ý FE
1) On load: gọi `GET /api/v1/reviews/pending` để lấy danh sách initial.
2) Subscribe WS `/topic/reviews/pending/{accountId}`.
   - `ADD`: append vào danh sách pending (tránh trùng `bookingId + employeeId`).
   - `REMOVE`: filter bỏ item trùng `bookingId + employeeId`.
3) CTA review: dùng `bookingId` + `employeeId` để mở form review.

## Data mẫu (init_sql)
- Account customer: `a1000001-0000-0000-0000-000000000001`
- Booking code: `BK000123`, bookingTime `2025-11-21T10:00:00`
- Employee: `Trần Văn Long` (`e1000001-0000-0000-0000-000000000003`)

## Liên quan BE
- API: `ReviewController.getPendingReviewsForCustomer`
- Service: `ReviewServiceImpl.getPendingReviewsForCustomer`
- WS push:
  - ADD: `PaymentServiceImpl` sau khi payment chuyển `PAID`.
  - REMOVE: `ReviewServiceImpl.createReview`.
