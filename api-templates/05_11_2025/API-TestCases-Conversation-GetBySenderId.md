# API Test Cases - Get Conversations by SenderId

## Endpoint
```
GET /api/v1/conversations/sender/{senderId}
```

## Description
API để lấy danh sách conversations theo senderId. SenderId có thể là `customerId` hoặc `employeeId`. API sẽ tự động tìm các conversation mà sender là customer HOẶC employee.

## Authorization
- **Required:** Yes
- **Roles:** ROLE_CUSTOMER, ROLE_EMPLOYEE, ROLE_ADMIN
- **Header:** `Authorization: Bearer {token}`

## Parameters

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| senderId | String | Yes | ID của sender (có thể là customerId hoặc employeeId) |

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | Integer | No | 0 | Số trang (bắt đầu từ 0) |
| size | Integer | No | 20 | Số lượng conversations trên mỗi trang |

## Business Logic

### SenderId Matching:
API sẽ tìm conversations với điều kiện:
```sql
WHERE (c.customer.customerId = :senderId OR c.employee.employeeId = :senderId)
```

### Ordering:
Conversations được sắp xếp theo `lastMessageTime` giảm dần (mới nhất trước)

### Filtering:
- Trả về TẤT CẢ conversations (bao gồm cả `isActive = true` và `isActive = false`)
- Conversations đã bị soft delete (`isActive = false`) vẫn xuất hiện trong kết quả
- Dùng field `isActive` trong response để phân biệt conversations đang hoạt động và đã bị xóa

## Test Cases

### Test Case 1: Lấy conversations của Customer
**Customer:** John Doe (customerId: `c1000001-0000-0000-0000-000000000001`)

**Request:**
```http
GET /api/v1/conversations/sender/c1000001-0000-0000-0000-000000000001?page=0&size=20
Authorization: Bearer {customer_token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": [
        {
            "conversationId": "conv0002-0000-0000-0000-000000000002",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "customerAvatar": "https://picsum.photos/200",
            "employeeId": "e1000001-0000-0000-0000-000000000002",
            "employeeName": "Bob Wilson",
            "employeeAvatar": "https://picsum.photos/200",
            "bookingId": "b0000001-0000-0000-0000-000000000002",
            "lastMessage": "Tôi sẽ đến lúc 9h sáng",
            "lastMessageTime": "2025-11-02T15:30:00",
            "isActive": true,
            "canChat": true,
            "createdAt": "2025-11-02T14:00:00",
            "updatedAt": "2025-11-02T15:30:00"
        },
        {
            "conversationId": "conv0006-0000-0000-0000-000000000006",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "customerAvatar": "https://picsum.photos/200",
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "employeeName": "Jane Smith",
            "employeeAvatar": "https://picsum.photos/200",
            "bookingId": "b0000001-0000-0000-0000-000000000007",
            "lastMessage": "Tôi sẽ hoàn thành công việc đúng hạn",
            "lastMessageTime": "2025-08-28T16:00:00",
            "isActive": true,
            "canChat": true,
            "createdAt": "2025-08-28T14:30:00",
            "updatedAt": "2025-08-28T16:00:00"
        },
        {
            "conversationId": "conv0001-0000-0000-0000-000000000001",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "customerAvatar": "https://picsum.photos/200",
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "employeeName": "Jane Smith",
            "employeeAvatar": "https://picsum.photos/200",
            "bookingId": "b0000001-0000-0000-0000-000000000001",
            "lastMessage": "Cảm ơn bạn!",
            "lastMessageTime": "2025-11-03T11:00:00",
            "isActive": false,
            "canChat": false,
            "createdAt": "2025-11-03T10:00:00",
            "updatedAt": "2025-11-03T11:00:00"
        }
    ],
    "currentPage": 0,
    "totalItems": 3,
    "totalPages": 1
}
```

**Note:** Bây giờ conversation conv0001 xuất hiện trong kết quả dù `isActive = false`. Client cần check field `isActive` hoặc `canChat` để xử lý UI.

### Test Case 2: Lấy conversations của Employee
**Employee:** Trần Văn Long (employeeId: `e1000001-0000-0000-0000-000000000003`)

**Request:**
```http
GET /api/v1/conversations/sender/e1000001-0000-0000-0000-000000000003?page=0&size=20
Authorization: Bearer {employee_token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": [
        {
            "conversationId": "conv0007-0000-0000-0000-000000000007",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
            "customerAvatar": "https://i.pravatar.cc/150?img=11",
            "employeeId": "e1000001-0000-0000-0000-000000000003",
            "employeeName": "Trần Văn Long",
            "employeeAvatar": "https://i.pravatar.cc/150?img=33",
            "bookingId": "b0000001-0000-0000-0000-000000000010",
            "lastMessage": "Tôi sẽ đến đúng giờ nhé!",
            "lastMessageTime": "2025-11-01T07:45:00",
            "isActive": true,
            "canChat": true,
            "createdAt": "2025-11-01T07:30:00",
            "updatedAt": "2025-11-01T07:45:00"
        },
        {
            "conversationId": "conv0003-0000-0000-0000-000000000003",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
            "customerAvatar": "https://i.pravatar.cc/150?img=11",
            "employeeId": "e1000001-0000-0000-0000-000000000003",
            "employeeName": "Trần Văn Long",
            "employeeAvatar": "https://i.pravatar.cc/150?img=33",
            "bookingId": "b0000001-0000-0000-0000-000000000003",
            "lastMessage": "Tôi đã xem ảnh rồi, cảm ơn bạn!",
            "lastMessageTime": "2025-11-01T10:30:00",
            "isActive": true,
            "canChat": true,
            "createdAt": "2025-11-01T09:00:00",
            "updatedAt": "2025-11-01T10:30:00"
        }
    ],
    "currentPage": 0,
    "totalItems": 2,
    "totalPages": 1
}
```

### Test Case 3: Không có conversations
**SenderId không tồn tại hoặc chưa có conversation nào**

**Request:**
```http
GET /api/v1/conversations/sender/c9999999-0000-0000-0000-000000000999?page=0&size=20
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": [],
    "currentPage": 0,
    "totalItems": 0,
    "totalPages": 0
}
```

### Test Case 4: Pagination - Page 2
**Request:**
```http
GET /api/v1/conversations/sender/c1000001-0000-0000-0000-000000000001?page=1&size=1
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": [
        {
            "conversationId": "conv0006-0000-0000-0000-000000000006",
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "customerName": "John Doe",
            "customerAvatar": "https://picsum.photos/200",
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "employeeName": "Jane Smith",
            "employeeAvatar": "https://picsum.photos/200",
            "bookingId": "b0000001-0000-0000-0000-000000000007",
            "lastMessage": "Tôi sẽ hoàn thành công việc đúng hạn",
            "lastMessageTime": "2025-08-28T16:00:00",
            "isActive": true,
            "canChat": true,
            "createdAt": "2025-08-28T14:30:00",
            "updatedAt": "2025-08-28T16:00:00"
        }
    ],
    "currentPage": 1,
    "totalItems": 2,
    "totalPages": 2
}
```

### Test Case 5: Customer có cả conversation với canChat = true và false
**Request:**
```http
GET /api/v1/conversations/sender/c1000001-0000-0000-0000-000000000008
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": [
        {
            "conversationId": "conv0011-0000-0000-0000-000000000011",
            "customerId": "c1000001-0000-0000-0000-000000000008",
            "customerName": "Hoàng Văn Em",
            "customerAvatar": "https://i.pravatar.cc/150?img=13",
            "employeeId": "e1000001-0000-0000-0000-000000000007",
            "employeeName": "Hoàng Thị Phương",
            "employeeAvatar": "https://i.pravatar.cc/150?img=28",
            "bookingId": "b0000001-0000-0000-0000-000000000009",
            "lastMessage": "Hẹn gặp lại chị lần sau!",
            "lastMessageTime": "2025-11-05T10:00:00",
            "isActive": true,
            "canChat": true,
            "createdAt": "2025-10-15T08:30:00",
            "updatedAt": "2025-11-05T10:00:00"
        }
    ],
    "currentPage": 0,
    "totalItems": 1,
    "totalPages": 1
}
```

## Error Cases

### Error Case 1: Không có Authorization header
**Request:**
```http
GET /api/v1/conversations/sender/c1000001-0000-0000-0000-000000000001
```

**Expected Response:**
```json
{
    "success": false,
    "message": "Unauthorized"
}
```
**Status Code:** 401 Unauthorized

### Error Case 2: Token không hợp lệ
**Request:**
```http
GET /api/v1/conversations/sender/c1000001-0000-0000-0000-000000000001
Authorization: Bearer invalid_token
```

**Expected Response:**
```json
{
    "success": false,
    "message": "Invalid token"
}
```
**Status Code:** 401 Unauthorized

### Error Case 3: Lỗi server
**Internal server error xảy ra**

**Expected Response:**
```json
{
    "success": false,
    "message": "Failed to get conversations: [error details]"
}
```
**Status Code:** 500 Internal Server Error

## Use Cases

### Use Case 1: Customer xem danh sách conversations
Customer muốn xem tất cả các cuộc hội thoại của mình với các employees khác nhau.

### Use Case 2: Employee xem danh sách conversations
Employee muốn xem tất cả các cuộc hội thoại với customers để trả lời và hỗ trợ.

### Use Case 3: Admin kiểm tra conversations
Admin muốn xem conversations của một user cụ thể để kiểm tra hoặc hỗ trợ.

### Use Case 4: Chat UI - Load conversation list
Khi user mở ứng dụng chat, UI cần load danh sách conversations để hiển thị inbox.

## Comparison with Other Endpoints

### `/api/v1/conversations/account/{accountId}`
- **Input:** `accountId` (ID của account)
- **Logic:** Join qua `customer.account` và `employee.account`
- **Use case:** Khi có accountId từ authentication

### `/api/v1/conversations/sender/{senderId}` (NEW)
- **Input:** `senderId` (customerId hoặc employeeId)
- **Logic:** So sánh trực tiếp với `customer.customerId` hoặc `employee.employeeId`
- **Use case:** Khi có customerId/employeeId trực tiếp (không cần mapping qua account)
- **Returns:** TẤT CẢ conversations (bao gồm cả đã xóa), client dùng `isActive` hoặc `canChat` để filter

## Notes

1. **SenderId flexibility:** API này linh hoạt hơn, chấp nhận cả customerId và employeeId
2. **All conversations returned:** Trả về TẤT CẢ conversations, bao gồm cả đã bị soft delete (`isActive = false`)
3. **isActive field:** Client cần check field `isActive` để phân biệt conversations đang hoạt động và đã bị xóa
4. **canChat flag:** Được tính toán dựa trên `isActive` và `booking.status` - dùng để disable/enable chat UI
5. **Ordering:** Mới nhất trước (lastMessageTime DESC)
6. **Pagination:** Hỗ trợ phân trang với page và size parameters
7. **UI Handling:** 
   - `isActive = false`: Hiển thị conversation nhưng có thể làm mờ hoặc đánh dấu "Đã xóa"
   - `canChat = false`: Disable input box, không cho phép gửi tin nhắn mới

## Related Endpoints

- `GET /api/v1/conversations/account/{accountId}` - Lấy theo accountId
- `GET /api/v1/conversations/{conversationId}` - Lấy 1 conversation cụ thể
- `GET /api/v1/conversations/booking/{bookingId}` - Lấy theo bookingId
- `GET /api/v1/conversations/get-or-create` - Tạo hoặc lấy conversation giữa customer và employee
- `DELETE /api/v1/conversations/{conversationId}` - Soft delete conversation
