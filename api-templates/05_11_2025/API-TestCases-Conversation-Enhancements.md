# API Test Examples - Chat Conversation Enhancements

## Overview

API này cho phép lấy danh sách conversations với flag `canChat` để xác định xem có thể chat hay không.

**Logic `canChat`:**
- `canChat = false` nếu:
  - `conversation.isActive = false` (conversation đã bị soft delete)
  - `booking.status = COMPLETED` hoặc `CANCELLED`
- `canChat = true` trong các trường hợp còn lại

**Query Repository:**
```java
@Query("SELECT c FROM Conversation c " +
       "WHERE (c.customer.account.accountId = :accountId OR c.employee.account.accountId = :accountId) " +
       "AND c.isActive = true " +
       "ORDER BY c.lastMessageTime DESC")
Page<Conversation> findActiveConversationsByAccount(@Param("accountId") String accountId, Pageable pageable);
```

## 1. Test flag `canChat` trong danh sách conversations

### Scenario 1: Lấy danh sách conversations của account 'John Doe' (customer)
**Account ID:** `a1000001-0000-0000-0000-000000000001`

```http
GET /api/v1/conversations/account/a1000001-0000-0000-0000-000000000001?page=0&size=20
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
    "totalItems": 3,
    "data": [
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
        },
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
        }
    ],
    "success": true,
    "totalPages": 1,
    "currentPage": 0
}
```

**Note:** conv0001 KHÔNG xuất hiện vì `isActive = false` (đã bị soft delete)

### Scenario 2: Lấy conversation cụ thể có booking COMPLETED
**Conversation ID:** `conv0001-0000-0000-0000-000000000001`

```http
GET /api/v1/conversations/conv0001-0000-0000-0000-000000000001
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
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
}
```

**Lý do `canChat = false`:**
- `isActive = false` (conversation đã bị soft delete)
- `booking.status = COMPLETED`

### Scenario 3: Lấy danh sách conversations của account 'Hoàng Văn Em'
**Account ID:** `a1000001-0000-0000-0000-000000000010` (Customer)

```http
GET /api/v1/conversations/account/a1000001-0000-0000-0000-000000000010?page=0&size=20
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

**Lý do `canChat = true`:**
- `isActive = true`
- `booking.status = CONFIRMED` (chưa hoàn thành)

### Scenario 4: Lấy danh sách conversations của account 'Nguyễn Văn An'
**Account ID:** `a1000001-0000-0000-0000-000000000006` (Customer)

```http
GET /api/v1/conversations/account/a1000001-0000-0000-0000-000000000006?page=0&size=20
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
    "totalItems": 2,
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
    "success": true,
    "totalPages": 1,
    "currentPage": 0
}
```

## 2. Test API Soft Delete Conversation

### Request - Xóa conversation
```http
DELETE /api/v1/conversations/conv0007-0000-0000-0000-000000000007
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
    "success": true,
    "message": "Conversation deleted successfully"
}
```

### Verify soft delete - Conversation không còn trong danh sách active
```http
GET /api/v1/conversations/account/a1000001-0000-0000-0000-000000000006?page=0&size=20
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
    "totalItems": 2,
    "data": [
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
        },
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
            "isActive": false,
            "canChat": false,
            "createdAt": "2025-11-01T07:30:00",
            "updatedAt": "2025-11-05T12:36:25.331157"
        }
    ],
    "success": true,
    "totalPages": 1,
    "currentPage": 0
}
```