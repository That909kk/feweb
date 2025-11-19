# API Test Cases - Chat Message Unread Count & Mark Read

## Endpoints

```
GET  /api/v1/messages/conversation/{conversationId}/unread-count?receiverId={receiverId}
GET  /api/v1/messages/unread-count?receiverId={receiverId}
PUT  /api/v1/messages/conversation/{conversationId}/mark-read?receiverId={receiverId}
PUT  /api/v1/messages/mark-all-read?receiverId={receiverId}
```

**Authorization:** Bearer Token (ROLE_CUSTOMER, ROLE_EMPLOYEE, ROLE_ADMIN)

---

## Test Case 1: Get Unread Count by Conversation

### Endpoint
```
GET /api/v1/messages/conversation/{conversationId}/unread-count?receiverId={receiverId}
```

### TC 1.1: Customer có tin nhắn chưa đọc trong conversation
**Request:**
```http
GET /api/v1/messages/conversation/conv0012-0000-0000-0000-000000000012/unread-count?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000001",
        "conversationId": "conv0012-0000-0000-0000-000000000012",
        "unreadCount": 3
    }
}
```

### TC 1.2: Employee kiểm tra unread count
**Request:**
```http
GET /api/v1/messages/conversation/conv0013-0000-0000-0000-000000000013/unread-count?receiverId=e1000001-0000-0000-0000-000000000003
Authorization: Bearer {employee_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "data": {
        "conversationId": "conv0013-0000-0000-0000-000000000013",
        "receiverId": "e1000001-0000-0000-0000-000000000003",
        "unreadCount": 7
    }
}
```

### TC 1.3: Không có tin nhắn chưa đọc
**Request:**
```http
GET /api/v1/messages/conversation/conv0014-0000-0000-0000-000000000014/unread-count?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000001",
        "conversationId": "conv0014-0000-0000-0000-000000000014",
        "unreadCount": 0
    }
}
```

### TC 1.4: Conversation không tồn tại
**Request:**
```http
GET /api/v1/messages/conversation/invalid-conv-id/unread-count?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000001",
        "conversationId": "invalid-conv-id",
        "unreadCount": 0
    }
}
```

### TC 1.5: Không có Authorization
**Request:**
```http
GET /api/v1/messages/conversation/conv0002-0000-0000-0000-000000000002/unread-count?receiverId=c1000001-0000-0000-0000-000000000001
```

**Expected Response:** `401 Unauthorized`

```json
{
    "success": false,
    "message": "Unauthorized"
}
```

---

## Test Case 2: Get Total Unread Count Across All Conversations

### Endpoint
```
GET /api/v1/messages/unread-count?receiverId={receiverId}
```

### TC 2.1: Customer có tin nhắn chưa đọc từ nhiều conversations
**Request:**
```http
GET /api/v1/messages/unread-count?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "data": {
        "unreadCount": 5,
        "receiverId": "c1000001-0000-0000-0000-000000000001"
    }
}
```

### TC 2.2: Employee có tin nhắn chưa đọc
**Request:**
```http
GET /api/v1/messages/unread-count?receiverId=e1000001-0000-0000-0000-000000000003
Authorization: Bearer {employee_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "data": {
        "receiverId": "e1000001-0000-0000-0000-000000000003",
        "unreadCount": 7
    }
}
```

### TC 2.3: Không có tin nhắn chưa đọc
**Request:**
```http
GET /api/v1/messages/unread-count?receiverId=c1000001-0000-0000-0000-000000000008
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000008",
        "unreadCount": 0
    }
}
```

### TC 2.4: ReceiverId không tồn tại
**Request:**
```http
GET /api/v1/messages/unread-count?receiverId=invalid-receiver-id
Authorization: Bearer {token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "data": {
        "receiverId": "invalid-receiver-id",
        "unreadCount": 0
    }
}
```

### TC 2.5: Token không hợp lệ
**Request:**
```http
GET /api/v1/messages/unread-count?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer invalid_token
```


**Expected Response:** `401 Unauthorized`
```json
{
    "success": false,
    "message": "Invalid token"
}
```

---

## Test Case 3: Mark Messages as Read in Specific Conversation

### Endpoint
```
PUT /api/v1/messages/conversation/{conversationId}/mark-read?receiverId={receiverId}
```

### TC 3.1: Customer mark read - có tin nhắn chưa đọc
**Request:**
```http
PUT /api/v1/messages/conversation/conv0012-0000-0000-0000-000000000012/mark-read?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "message": "Messages marked as read",
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000001",
        "conversationId": "conv0012-0000-0000-0000-000000000012",
        "markedCount": 3
    }
}
```

### TC 3.2: Employee mark read
**Request:**
```http
PUT /api/v1/messages/conversation/conv0013-0000-0000-0000-000000000013/mark-read?receiverId=e1000001-0000-0000-0000-000000000003
Authorization: Bearer {employee_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "message": "Messages marked as read",
    "data": {
        "receiverId": "e1000001-0000-0000-0000-000000000003",
        "conversationId": "conv0013-0000-0000-0000-000000000013",
        "markedCount": 7
    }
}
```

### TC 3.3: Không có tin nhắn chưa đọc (Idempotent)
**Request:**
```http
PUT /api/v1/messages/conversation/conv0014-0000-0000-0000-000000000014/mark-read?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "message": "Messages marked as read",
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000001",
        "conversationId": "conv0014-0000-0000-0000-000000000014",
        "markedCount": 0
    }
}
```

### TC 3.4: Conversation không tồn tại
**Request:**
```http
PUT /api/v1/messages/conversation/invalid-conv-id/mark-read?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "message": "Messages marked as read",
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000001",
        "conversationId": "invalid-conv-id",
        "markedCount": 0
    }
}
```

---

## Test Case 4: Mark All Messages as Read

### Endpoint
```
PUT /api/v1/messages/mark-all-read?receiverId={receiverId}
```

### TC 4.1: Customer mark all read - có nhiều tin nhắn chưa đọc
**Request:**
```http
PUT /api/v1/messages/mark-all-read?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "message": "All messages marked as read",
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000001",
        "markedCount": 3
    }
}
```

### TC 4.2: Employee mark all read
**Request:**
```http
PUT /api/v1/messages/mark-all-read?receiverId=e1000001-0000-0000-0000-000000000003
Authorization: Bearer {employee_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "message": "All messages marked as read",
    "data": {
        "receiverId": "e1000001-0000-0000-0000-000000000003",
        "markedCount": 7
    }
}
```

### TC 4.3: Không có tin nhắn chưa đọc (Idempotent)
**Request:**
```http
PUT /api/v1/messages/mark-all-read?receiverId=c1000001-0000-0000-0000-000000000008
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "message": "All messages marked as read",
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000008",
        "markedCount": 0
    }
}
```

### TC 4.4: Gọi nhiều lần (Verify Idempotent)
**Request (lần 1):**
```http
PUT /api/v1/messages/mark-all-read?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "message": "All messages marked as read",
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000001",
        "markedCount": 3
    }
}
```

**Request (lần 2 - ngay sau đó):**
```http
PUT /api/v1/messages/mark-all-read?receiverId=c1000001-0000-0000-0000-000000000001
Authorization: Bearer {customer_token}
```

**Expected Response:** `200 OK`
```json
{
    "success": true,
    "message": "All messages marked as read",
    "data": {
        "receiverId": "c1000001-0000-0000-0000-000000000001",
        "markedCount": 0
    }
}
```

---

## Notes

- **receiverId:** Có thể là `customerId` hoặc `employeeId`
- **Idempotent:** Các PUT endpoints có thể gọi nhiều lần mà không gây lỗi
- **Own Messages:** Không đếm/mark messages do chính receiver gửi
- **Error Handling:** Invalid IDs trả về count/markedCount = 0 thay vì lỗi

---

## Test Data Reference

### Conversations cho Testing

**Conversation 12** (TC 1.1 - Customer có 3 unread):
- Conversation ID: `conv0012-0000-0000-0000-000000000012`
- Customer (receiver): `c1000001-0000-0000-0000-000000000001` (John Doe)
- Employee (sender): `e1000001-0000-0000-0000-000000000003` (Trần Văn Long)
- Unread messages: 3

**Conversation 13** (TC 1.2 - Employee có 7 unread):
- Conversation ID: `conv0013-0000-0000-0000-000000000013`
- Customer (sender): `c1000001-0000-0000-0000-000000000002` (Jane Smith)
- Employee (receiver): `e1000001-0000-0000-0000-000000000003` (Trần Văn Long)
- Unread messages: 7

**Conversation 14** (TC 1.3 - Không có unread):
- Conversation ID: `conv0014-0000-0000-0000-000000000014`
- Customer: `c1000001-0000-0000-0000-000000000001` (John Doe)
- Employee: `e1000001-0000-0000-0000-000000000004` (Nguyễn Thị Mai)
- Unread messages: 0

### Total Unread Count

**Customer John Doe** (`c1000001-0000-0000-0000-000000000001`):
- Conv 12: 3 unread messages
- **Total: 3 unread messages**

**Employee Trần Văn Long** (`e1000001-0000-0000-0000-000000000003`):
- Conv 13: 7 unread messages
- **Total: 7 unread messages**

### Test Accounts

Để test các endpoint này, bạn cần đăng nhập với:

**Customer Account (John Doe)**:
- Email: Xem trong seed data
- Account ID: `a1000001-0000-0000-0000-000000000001`
- Customer ID: `c1000001-0000-0000-0000-000000000001`

**Employee Account (Trần Văn Long)**:
- Email: Xem trong seed data
- Account ID: `a1000001-0000-0000-0000-000000000016`
- Employee ID: `e1000001-0000-0000-0000-000000000003`
