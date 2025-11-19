# API Conversation - Enhanced Booking Flow

## Ngày cập nhật: 09/11/2025

## Tổng quan
Cập nhật luồng tạo hội thoại và quản lý trạng thái conversation dựa trên booking status.

## Các thay đổi chính

### 1. Tạo Conversation với Booking ID bắt buộc

#### Endpoint: `POST /api/v1/conversations`

**Thay đổi:**
- Bây giờ yêu cầu đầy đủ 3 fields: `employeeId`, `customerId`, và `bookingId`
- Mỗi booking sẽ tạo một conversation mới hoàn toàn
- Hệ thống tự động tạo tin nhắn chào mừng từ employee khi conversation được tạo

**Request Body:**
```json
{
  "customerId": "uuid",
  "employeeId": "uuid",
  "bookingId": "uuid"
}
```

**Validation:**
- Tất cả 3 fields đều bắt buộc
- Nếu thiếu bất kỳ field nào sẽ trả về lỗi `IllegalArgumentException`

**Response Example:**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "conversationId": "uuid",
    "customerId": "uuid",
    "customerName": "Nguyễn Văn A",
    "customerAvatar": "avatar_url",
    "employeeId": "uuid",
    "employeeName": "Trần Thị B",
    "employeeAvatar": "avatar_url",
    "bookingId": "uuid",
    "lastMessage": "Cảm ơn bạn đã chọn tôi thực hiện dịch vụ cho bạn",
    "lastMessageTime": "2025-11-09T10:30:00",
    "isActive": true,
    "canChat": true,
    "createdAt": "2025-11-09T10:30:00",
    "updatedAt": "2025-11-09T10:30:00"
  }
}
```

**Automatic Welcome Message:**
- Tin nhắn: "Cảm ơn bạn đã chọn tôi thực hiện dịch vụ cho bạn"
- Người gửi: Employee
- Type: TEXT
- isRead: false
- Được tạo tự động ngay sau khi conversation được khởi tạo

### 2. Get Conversation By ID với kiểm tra trạng thái

#### Endpoint: `GET /api/v1/conversations/{conversationId}`

**Thay đổi:**
- Tự động kiểm tra trạng thái của booking
- Nếu booking có status là `COMPLETED` hoặc `CANCELLED`, conversation sẽ bị vô hiệu hóa
- Field `isActive` sẽ được set thành `false`
- Field `canChat` trong response sẽ là `false`

**Response Example (Booking đang active):**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "customerId": "uuid",
    "customerName": "Nguyễn Văn A",
    "employeeId": "uuid",
    "employeeName": "Trần Thị B",
    "bookingId": "uuid",
    "lastMessage": "Xin chào",
    "lastMessageTime": "2025-11-09T10:30:00",
    "isActive": true,
    "canChat": true,
    "createdAt": "2025-11-09T10:00:00",
    "updatedAt": "2025-11-09T10:30:00"
  }
}
```

**Response Example (Booking đã COMPLETED/CANCELLED):**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid",
    "customerId": "uuid",
    "customerName": "Nguyễn Văn A",
    "employeeId": "uuid",
    "employeeName": "Trần Thị B",
    "bookingId": "uuid",
    "lastMessage": "Xin chào",
    "lastMessageTime": "2025-11-09T10:30:00",
    "isActive": false,
    "canChat": false,
    "createdAt": "2025-11-09T10:00:00",
    "updatedAt": "2025-11-09T11:00:00"
  }
}
```

## Field `canChat` trong Response

Field `canChat` được tính toán dựa trên:

1. **isActive**: Nếu conversation có `isActive = false` → `canChat = false`
2. **Booking Status**: Nếu booking có status là `COMPLETED` hoặc `CANCELLED` → `canChat = false`
3. **Default**: Nếu không vi phạm 2 điều kiện trên → `canChat = true`

## Lưu ý quan trọng

### ⚠️ Endpoint GET-OR-CREATE bị ảnh hưởng
Endpoint `GET /api/v1/conversations/get-or-create` hiện tại chỉ yêu cầu `customerId` và `employeeId`, không có `bookingId`.

**Hành vi mới:**
- Nếu conversation đã tồn tại → trả về conversation đó
- Nếu chưa tồn tại → sẽ gây lỗi vì thiếu `bookingId` (bắt buộc)

**Khuyến nghị:**
- Nên sử dụng endpoint `POST /api/v1/conversations` với đầy đủ thông tin

### Business Rules
1. Mỗi booking chỉ có một conversation
2. Conversation tự động vô hiệu hóa khi booking COMPLETED/CANCELLED
3. Tin nhắn chào mừng luôn được gửi từ employee
4. Tin nhắn chào mừng mặc định là chưa đọc (isRead = false)
