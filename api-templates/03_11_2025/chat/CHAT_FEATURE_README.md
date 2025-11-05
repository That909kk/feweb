# Chat Real-time Feature - API Test Cases

## Mô tả

Chức năng chat real-time cho phép khách hàng và nhân viên giao tiếp với nhau trong thời gian thực. Hỗ trợ gửi tin nhắn dạng text và hình ảnh qua REST API và nhận tin nhắn real-time qua WebSocket.

## API Endpoints Covered

### Conversations
- **POST /api/v1/conversations** - Create New Conversation
- **GET /api/v1/conversations/{conversationId}** - Get Conversation Details
- **GET /api/v1/conversations/account/{accountId}** - Get User's Conversations (Paginated)
- **GET /api/v1/conversations/get-or-create** - Find or Create Conversation
- **GET /api/v1/conversations/booking/{bookingId}** - Get Conversation by Booking
- **DELETE /api/v1/conversations/{conversationId}** - Delete Conversation (Soft Delete)

### Chat Messages
- **POST /api/v1/messages/send/text** - Send Text Message
- **POST /api/v1/messages/send/image** - Send Image Message
- **GET /api/v1/messages/conversation/{conversationId}** - Get Messages (Paginated)
- **GET /api/v1/messages/conversation/{conversationId}/all** - Get All Messages
- **GET /api/v1/messages/conversation/{conversationId}/unread-count** - Count Unread Messages
- **PUT /api/v1/messages/conversation/{conversationId}/mark-read** - Mark Messages as Read

### WebSocket
- **WS /ws/chat** - WebSocket Connection Endpoint
- **STOMP /topic/conversation/{conversationId}** - Subscribe to Real-time Messages

---

## Test Data

### Test Accounts (Password: 123456)
- **john_doe** (CUSTOMER) - Account ID: `a1000001-0000-0000-0000-000000000001` | Customer ID: `c1000001-0000-0000-0000-000000000001`
- **jane_smith** (EMPLOYEE + CUSTOMER) - Account ID: `a1000001-0000-0000-0000-000000000002` | Employee ID: `e1000001-0000-0000-0000-000000000001` | Customer ID: `c1000001-0000-0000-0000-000000000003`
- **admin_1** (ADMIN) - Account ID: `a1000001-0000-0000-0000-000000000003`
- **nguyenvana** (CUSTOMER) - Account ID: `a1000001-0000-0000-0000-000000000006` | Customer ID: `c1000001-0000-0000-0000-000000000004`
- **tranvanl** (EMPLOYEE) - Account ID: `a1000001-0000-0000-0000-000000000016` | Employee ID: `e1000001-0000-0000-0000-000000000003`

### Sample User Details
**John Doe (Customer)**
- Full Name: `John Doe`
- Avatar: `https://picsum.photos/200`
- Email: `john.doe@example.com`

**Jane Smith (Employee)**
- Full Name: `Jane Smith`
- Avatar: `https://picsum.photos/200`
- Email: `jane.smith@example.com`

**Nguyễn Văn An (Customer)**
- Full Name: `Nguyễn Văn An`
- Avatar: `https://i.pravatar.cc/150?img=11`
- Email: `nguyenvanan@gmail.com`

**Trần Văn Long (Employee)**
- Full Name: `Trần Văn Long`
- Avatar: `https://i.pravatar.cc/150?img=33`
- Email: `tranvanlong@gmail.com`

### Sample Conversation IDs
- `conv0001-0000-0000-0000-000000000001` - john_doe ↔ jane_smith
- `conv0002-0000-0000-0000-000000000002` - nguyenvana ↔ tranvanl

---

## API Test Cases

### 1. Conversations API

#### Test Case 1.1: Create New Conversation Successfully
- **Test Case ID**: TC_CONVERSATION_CREATE_001
- **Description**: Verify that a customer can create a new conversation with an employee.
- **Preconditions**: 
  - Customer is authenticated with valid token.
  - Employee exists in the system.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/conversations`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Conversation created successfully",
    "data": {
      "conversationId": "conv0001-0000-0000-0000-000000000001",
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "customerName": "John Doe",
      "customerAvatar": "https://picsum.photos/200",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "employeeName": "Jane Smith",
      "employeeAvatar": "https://picsum.photos/200",
      "bookingId": null,
      "lastMessage": null,
      "lastMessageTime": null,
      "isActive": true,
      "createdAt": "2025-11-03T10:00:00",
      "updatedAt": "2025-11-03T10:00:00"
    }
  }
  ```
- **Status Code**: `201 CREATED`

---

#### Test Case 1.2: Create Conversation with Booking
- **Test Case ID**: TC_CONVERSATION_CREATE_002
- **Description**: Verify that a conversation can be created linked to a specific booking.
- **Preconditions**: 
  - Customer is authenticated.
  - Booking exists and belongs to the customer.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/conversations`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "bookingId": "b0000001-0000-0000-0000-000000000001"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Conversation created successfully",
    "data": {
      "conversationId": "conv0001-0000-0000-0000-000000000001",
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "customerName": "John Doe",
      "customerAvatar": "https://picsum.photos/200",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "employeeName": "Jane Smith",
      "employeeAvatar": "https://picsum.photos/200",
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "lastMessage": null,
      "lastMessageTime": null,
      "isActive": true,
      "createdAt": "2025-11-03T10:05:00",
      "updatedAt": "2025-11-03T10:05:00"
    }
  }
  ```
- **Status Code**: `201 CREATED`

---

#### Test Case 1.3: Get Conversation Details
- **Test Case ID**: TC_CONVERSATION_GET_001
- **Description**: Verify that a user can retrieve conversation details by conversation ID.
- **Preconditions**: 
  - User is authenticated.
  - Conversation exists.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/conversations/conv0001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
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
      "lastMessage": "Cảm ơn chị nhé!",
      "lastMessageTime": "2025-11-03T10:19:00",
      "isActive": true,
      "createdAt": "2025-11-03T10:00:00",
      "updatedAt": "2025-11-03T10:19:00"
    }
  }
  ```
- **Status Code**: `200 OK`

---

#### Test Case 1.4: Get User's Conversations (Paginated)
- **Test Case ID**: TC_CONVERSATION_LIST_001
- **Description**: Verify that a user can retrieve all their conversations with pagination.
- **Preconditions**: 
  - User is authenticated.
  - User has existing conversations.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/conversations/account/a1000001-0000-0000-0000-000000000001?page=0&size=10`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
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
        "lastMessage": "Cảm ơn chị nhé!",
        "lastMessageTime": "2025-11-03T10:19:00",
        "isActive": true,
        "createdAt": "2025-11-03T10:00:00",
        "updatedAt": "2025-11-03T10:19:00"
      }
    ],
    "currentPage": 0,
    "totalItems": 1,
    "totalPages": 1
  }
  ```
- **Status Code**: `200 OK`

---

#### Test Case 1.5: Find or Create Conversation
- **Test Case ID**: TC_CONVERSATION_GET_OR_CREATE_001
- **Description**: Verify that system returns existing conversation or creates new one between customer and employee.
- **Preconditions**: 
  - User is authenticated.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/conversations/get-or-create?customerId=c1000001-0000-0000-0000-000000000001&employeeId=e1000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output** (Existing):
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
      "bookingId": null,
      "lastMessage": "Cảm ơn chị nhé!",
      "lastMessageTime": "2025-11-03T10:19:00",
      "isActive": true,
      "createdAt": "2025-11-03T10:00:00",
      "updatedAt": "2025-11-03T10:19:00"
    }
  }
  ```
- **Status Code**: `200 OK`

---

#### Test Case 1.6: Get Conversation by Booking
- **Test Case ID**: TC_CONVERSATION_BY_BOOKING_001
- **Description**: Verify that conversation can be retrieved by booking ID.
- **Preconditions**: 
  - User is authenticated.
  - Booking has an associated conversation.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/conversations/booking/b0000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
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
      "lastMessage": "Cảm ơn chị nhé!",
      "lastMessageTime": "2025-11-03T10:19:00",
      "isActive": true,
      "createdAt": "2025-11-03T10:00:00",
      "updatedAt": "2025-11-03T10:19:00"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### 2. Chat Messages API

#### Test Case 2.1: Send Text Message Successfully
- **Test Case ID**: TC_MESSAGE_SEND_TEXT_001
- **Description**: Verify that a user can send a text message successfully.
- **Preconditions**: 
  - User is authenticated.
  - Conversation exists.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/messages/send/text`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/x-www-form-urlencoded
    ```
  - **Body** (form-data):
    ```
    conversationId=conv0001-0000-0000-0000-000000000001
    senderId=a1000001-0000-0000-0000-000000000001
    content=Xin chào, tôi cần hỗ trợ về dịch vụ dọn dẹp
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Message sent successfully",
    "data": {
      "messageId": "msg0001-0000-0000-0000-000000000001",
      "conversationId": "conv0001-0000-0000-0000-000000000001",
      "senderId": "a1000001-0000-0000-0000-000000000001",
      "senderName": "john_doe",
      "senderAvatar": "https://picsum.photos/200",
      "messageType": "TEXT",
      "content": "Xin chào, tôi cần hỗ trợ về dịch vụ dọn dẹp",
      "imageUrl": null,
      "isRead": false,
      "createdAt": "2025-11-03T10:15:00"
    }
  }
  ```
- **Status Code**: `201 CREATED`
- **Additional Behavior**: Message is automatically broadcast to WebSocket subscribers on `/topic/conversation/conv0001-0000-0000-0000-000000000001`

---

#### Test Case 2.2: Send Image Message Successfully
- **Test Case ID**: TC_MESSAGE_SEND_IMAGE_001
- **Description**: Verify that a user can send an image message with caption.
- **Preconditions**: 
  - User is authenticated.
  - Conversation exists.
  - Image file is valid (JPG, PNG, max 5MB).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/messages/send/image`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: multipart/form-data
    ```
  - **Body** (form-data):
    ```
    conversationId=conv0001-0000-0000-0000-000000000001
    senderId=a1000001-0000-0000-0000-000000000001
    imageFile=[Binary file data - image.jpg]
    caption=Đây là phòng khách cần dọn dẹp ạ (optional)
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Image sent successfully",
    "data": {
      "messageId": "msg00003-0000-0000-0000-000000000003",
      "conversationId": "conv0001-0000-0000-0000-000000000001",
      "senderId": "a1000001-0000-0000-0000-000000000001",
      "senderName": "john_doe",
      "senderAvatar": "https://picsum.photos/200",
      "messageType": "IMAGE",
      "content": null,
      "imageUrl": "https://res.cloudinary.com/example/image/upload/v1730620800/chat_images/abc123def.jpg",
      "isRead": false,
      "createdAt": "2025-11-03T10:17:00"
    }
  }
  ```
- **Status Code**: `201 CREATED`
- **Additional Behavior**: 
  - Image uploaded to Cloudinary
  - Message broadcast to WebSocket subscribers

---

#### Test Case 2.3: Send Image Without Caption
- **Test Case ID**: TC_MESSAGE_SEND_IMAGE_002
- **Description**: Verify that image can be sent without caption.
- **Preconditions**: Same as Test Case 2.2
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/messages/send/image`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token_jane_smith>
    Content-Type: multipart/form-data
    ```
  - **Body** (form-data):
    ```
    conversationId=conv0002-0000-0000-0000-000000000002
    senderId=a1000001-0000-0000-0000-000000000016
    imageFile=[Binary file data - image.jpg]
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Image sent successfully",
    "data": {
      "messageId": "msg00010-0000-0000-0000-000000000010",
      "conversationId": "conv0002-0000-0000-0000-000000000002",
      "senderId": "a1000001-0000-0000-0000-000000000016",
      "senderName": "tranvanl",
      "senderAvatar": "https://i.pravatar.cc/150?img=33",
      "messageType": "IMAGE",
      "content": null,
      "imageUrl": "https://res.cloudinary.com/example/image/upload/v1730620900/chat_images/xyz789ghi.jpg",
      "isRead": false,
      "createdAt": "2025-11-03T11:25:00"
    }
  }
  ```
- **Status Code**: `201 CREATED`

---

#### Test Case 2.4: Get Messages with Pagination
- **Test Case ID**: TC_MESSAGE_GET_PAGINATED_001
- **Description**: Verify that messages can be retrieved with pagination.
- **Preconditions**: 
  - User is authenticated.
  - Conversation has existing messages.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/messages/conversation/conv0001-0000-0000-0000-000000000001?page=0&size=20`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
        {
            "messageId": "msg00022-0000-0000-0000-000000000022",
            "conversationId": "conv0001-0000-0000-0000-000000000001",
            "senderId": "a1000001-0000-0000-0000-000000000002",
            "senderName": "jane_smith",
            "senderAvatar": "https://picsum.photos/200",
            "messageType": "TEXT",
            "content": "Và nếu có vật dụng quý giá, anh nên cất đi để tránh va chạm",
            "imageUrl": null,
            "isRead": false,
            "createdAt": "2025-11-03T16:02:00"
        },
        {
            "messageId": "msg00021-0000-0000-0000-000000000021",
            "conversationId": "conv0001-0000-0000-0000-000000000001",
            "senderId": "a1000001-0000-0000-0000-000000000002",
            "senderName": "jane_smith",
            "senderAvatar": "https://picsum.photos/200",
            "messageType": "TEXT",
            "content": "Anh nhớ chuẩn bị chỗ để đồ nhé, tôi sẽ dọn dẹp kỹ lưỡng",
            "imageUrl": null,
            "isRead": false,
            "createdAt": "2025-11-03T16:00:00"
        },
        {
            "messageId": "msg00006-0000-0000-0000-000000000006",
            "conversationId": "conv0001-0000-0000-0000-000000000001",
            "senderId": "a1000001-0000-0000-0000-000000000002",
            "senderName": "jane_smith",
            "senderAvatar": "https://picsum.photos/200",
            "messageType": "TEXT",
            "content": "Cảm ơn bạn!",
            "imageUrl": null,
            "isRead": true,
            "createdAt": "2025-11-03T11:00:00"
        },
        {
            "messageId": "msg00005-0000-0000-0000-000000000005",
            "conversationId": "conv0001-0000-0000-0000-000000000001",
            "senderId": "a1000001-0000-0000-0000-000000000001",
            "senderName": "john_doe",
            "senderAvatar": "https://picsum.photos/200",
            "messageType": "TEXT",
            "content": "Được rồi, vậy tôi đặt lịch cho chiều nay nhé",
            "imageUrl": null,
            "isRead": true,
            "createdAt": "2025-11-03T10:30:00"
        },
        {
            "messageId": "msg00004-0000-0000-0000-000000000004",
            "conversationId": "conv0001-0000-0000-0000-000000000001",
            "senderId": "a1000001-0000-0000-0000-000000000002",
            "senderName": "jane_smith",
            "senderAvatar": "https://picsum.photos/200",
            "messageType": "TEXT",
            "content": "Tôi đã xem ảnh rồi. Khu vực này tôi ước tính mất khoảng 3-4 giờ để dọn dẹp hoàn toàn.",
            "imageUrl": null,
            "isRead": true,
            "createdAt": "2025-11-03T10:25:00"
        },
        {
            "messageId": "msg00003-0000-0000-0000-000000000003",
            "conversationId": "conv0001-0000-0000-0000-000000000001",
            "senderId": "a1000001-0000-0000-0000-000000000001",
            "senderName": "john_doe",
            "senderAvatar": "https://picsum.photos/200",
            "messageType": "IMAGE",
            "content": "Đây là khu vực cần dọn dẹp",
            "imageUrl": "https://res.cloudinary.com/dhhntolb5/image/upload/v1730620800/chat_images/living_room_messy.jpg",
            "isRead": true,
            "createdAt": "2025-11-03T10:20:00"
        },
        {
            "messageId": "msg00002-0000-0000-0000-000000000002",
            "conversationId": "conv0001-0000-0000-0000-000000000001",
            "senderId": "a1000001-0000-0000-0000-000000000002",
            "senderName": "jane_smith",
            "senderAvatar": "https://picsum.photos/200",
            "messageType": "TEXT",
            "content": "Chào anh! Tôi là Jane, tôi sẽ hỗ trợ anh. Anh cần dọn dẹp khu vực nào ạ?",
            "imageUrl": null,
            "isRead": true,
            "createdAt": "2025-11-03T10:16:00"
        },
        {
            "messageId": "msg00001-0000-0000-0000-000000000001",
            "conversationId": "conv0001-0000-0000-0000-000000000001",
            "senderId": "a1000001-0000-0000-0000-000000000001",
            "senderName": "john_doe",
            "senderAvatar": "https://picsum.photos/200",
            "messageType": "TEXT",
            "content": "Xin chào, tôi cần hỗ trợ về dịch vụ dọn dẹp",
            "imageUrl": null,
            "isRead": true,
            "createdAt": "2025-11-03T10:15:00"
        }
    ],
    "currentPage": 0,
    "totalItems": 8,
    "totalPages": 1
  }
  ```
- **Status Code**: `200 OK`

---

#### Test Case 2.6: Count Unread Messages
- **Test Case ID**: TC_MESSAGE_UNREAD_COUNT_001
- **Description**: Verify that unread message count can be retrieved for a specific user.
- **Preconditions**: 
  - User is authenticated.
  - Conversation has unread messages from other participants.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/messages/conversation/conv0001-0000-0000-0000-000000000001/unread-count?accountId=a1000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "unreadCount": 2
  }
  ```
- **Status Code**: `200 OK`
- **Note**: Unread count is for messages sent by other users (not by the requesting user)

---

#### Test Case 2.7: Mark Messages as Read
- **Test Case ID**: TC_MESSAGE_MARK_READ_001
- **Description**: Verify that all messages in a conversation can be marked as read for a specific user.
- **Preconditions**: 
  - User is authenticated.
  - Conversation has unread messages from other participants.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/messages/conversation/conv0001-0000-0000-0000-000000000001/mark-read?accountId=a1000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Messages marked as read"
  }
  ```
- **Status Code**: `200 OK`
- **Note**: Only marks messages sent by other users as read (where senderId != accountId)

---

### 3. WebSocket Real-time Testing

#### Test Case 3.1: WebSocket Connection
- **Test Case ID**: TC_WEBSOCKET_CONNECT_001
- **Description**: Verify that client can establish WebSocket connection.
- **Preconditions**: 
  - Server is running.
  - SockJS and STOMP libraries loaded.
- **Input**:
  ```javascript
  const socket = new SockJS('http://localhost:8080/ws/chat');
  const stompClient = Stomp.over(socket);
  stompClient.connect({}, onConnected, onError);
  ```
- **Expected Output**:
  - Connection established successfully
  - `onConnected` callback triggered
  - Console log: "Connected to WebSocket"
- **Status**: Connection OPEN (ReadyState = 1)

---

#### Test Case 3.2: Subscribe to Conversation Topic
- **Test Case ID**: TC_WEBSOCKET_SUBSCRIBE_001
- **Description**: Verify that client can subscribe to conversation topic to receive real-time messages.
- **Preconditions**: 
  - WebSocket connection established.
  - User has access to conversation.
- **Input**:
  ```javascript
  stompClient.subscribe('/topic/conversation/conv0001-0000-0000-0000-000000000001', 
    function(message) {
      const chatMessage = JSON.parse(message.body);
      console.log('Received:', chatMessage);
    }
  );
  ```
- **Expected Output**:
  - Subscription successful
  - Returns subscription object
  - Ready to receive messages
- **Status**: Subscribed

---

#### Test Case 3.3: Receive Real-time Text Message
- **Test Case ID**: TC_WEBSOCKET_RECEIVE_TEXT_001
- **Description**: Verify that subscribed client receives text message in real-time when another user sends message via REST API.
- **Preconditions**: 
  - Client subscribed to conversation topic.
  - Another user sends message via POST /api/v1/messages/send/text.
- **Input**: (Another user sends via API)
  ```
  POST /api/v1/messages/send/text
  Authorization: Bearer <jane_smith_token>
  Content-Type: application/x-www-form-urlencoded
  
  conversationId=conv0001-0000-0000-0000-000000000001
  senderId=a1000001-0000-0000-0000-000000000002
  content=Chào anh! Tôi là Jane, tôi sẽ hỗ trợ anh.
  ```
- **Expected Output** (WebSocket receives):
  ```json
  {
    "messageId": "msg00002-0000-0000-0000-000000000002",
    "conversationId": "conv0001-0000-0000-0000-000000000001",
    "senderId": "a1000001-0000-0000-0000-000000000002",
    "senderName": "jane_smith",
    "senderAvatar": "https://picsum.photos/200",
    "messageType": "TEXT",
    "content": "Chào anh! Tôi là Jane, tôi sẽ hỗ trợ anh.",
    "imageUrl": null,
    "timestamp": "2025-11-03T10:16:00"
  }
  ```
- **Timing**: Message received within **< 100ms** after API call

---

#### Test Case 3.4: Receive Real-time Image Message
- **Test Case ID**: TC_WEBSOCKET_RECEIVE_IMAGE_001
- **Description**: Verify that subscribed client receives image message in real-time.
- **Preconditions**: 
  - Client subscribed to conversation topic.
  - Another user sends image via POST /api/v1/messages/send/image.
- **Input**: (Another user sends via API)
  ```
  POST /api/v1/messages/send/image
  Authorization: Bearer <jane_smith_token>
  Content-Type: multipart/form-data
  
  conversationId=conv0001-0000-0000-0000-000000000001
  senderId=a1000001-0000-0000-0000-000000000002
  imageFile=[image.jpg]
  caption=Đây là khu vực bếp, em sẽ dọn dẹp kỹ lưỡng
  ```
- **Expected Output** (WebSocket receives):
  ```json
  {
    "messageId": "msg00005-0000-0000-0000-000000000005",
    "conversationId": "conv0001-0000-0000-0000-000000000001",
    "senderId": "a1000001-0000-0000-0000-000000000002",
    "senderName": "jane_smith",
    "senderAvatar": "https://picsum.photos/200",
    "messageType": "IMAGE",
    "content": null,
    "imageUrl": "https://res.cloudinary.com/example/image/upload/v1730621000/chat_images/kitchen.jpg",
    "timestamp": "2025-11-03T10:20:00"
  }
  ```
- **Timing**: Message received within **< 500ms** after upload completes

---

#### Test Case 3.5: WebSocket Heartbeat (Disconnect Fix)
- **Test Case ID**: TC_WEBSOCKET_HEARTBEAT_001
- **Description**: Verify that WebSocket connection remains alive with heartbeat configuration and does NOT auto-disconnect after idle period.
- **Preconditions**: 
  - WebSocket connected and subscribed.
  - No messages sent for 15+ minutes.
- **Test Steps**:
  1. Establish WebSocket connection
  2. Wait 15 minutes without sending/receiving messages
  3. Send a test message via API
  4. Check if WebSocket client receives the message
- **Expected Output**:
  - Connection stays OPEN (ReadyState = 1)
  - Heartbeat PING/PONG frames visible in network tab
  - Test message received successfully after 15min idle
  - Console shows: "Heartbeat check - State: OPEN | Uptime: 900s"
- **Configuration**:
  - Simple Broker heartbeat: 10 seconds
  - SockJS heartbeat: 25 seconds
  - Auto-monitoring: Every 30 seconds
- **Status**: ✅ **FIXED** (03/11/2025)

---

### 4. Error Cases

#### Test Case 4.1: Send Message to Non-existent Conversation
- **Test Case ID**: TC_MESSAGE_ERROR_001
- **Description**: Verify proper error handling when sending message to non-existent conversation.
- **Input**:
  ```
  POST /api/v1/messages/send/text
  conversationId=invalid-conversation-id
  senderId=a1000001-0000-0000-0000-000000000001
  content=Test message
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Failed to send message: [error details]"
  }
  ```
- **Status Code**: `500 INTERNAL_SERVER_ERROR`

---

#### Test Case 4.2: Send Image Exceeding Size Limit
- **Test Case ID**: TC_MESSAGE_ERROR_002
- **Description**: Verify that images larger than 5MB are rejected.
- **Input**:
  ```
  POST /api/v1/messages/send/image
  conversationId=conv0001-0000-0000-0000-000000000001
  senderId=a1000001-0000-0000-0000-000000000001
  imageFile=[6MB file]
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Failed to send image: File size exceeds maximum limit"
  }
  ```
- **Status Code**: `500 INTERNAL_SERVER_ERROR`

---

#### Test Case 4.3: Unauthorized Access
- **Test Case ID**: TC_MESSAGE_ERROR_003
- **Description**: Verify that requests without valid token are rejected.
- **Input**:
  ```
  GET /api/v1/messages/conversation/conv0001-0000-0000-0000-000000000001/all
  Headers: (No Authorization header)
  ```
- **Expected Output**:
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **Status Code**: `401 UNAUTHORIZED`

---

## Technical Configuration

### Backend Configuration

#### WebSocket Config
- **Endpoint**: `/ws/chat`
- **Message Broker**: In-memory Simple Broker
- **Heartbeat**: 10s (Simple Broker) + 25s (SockJS)
- **Max Message Size**: 128 KB
- **Buffer Size**: 512 KB
- **Timeouts**: 20s send, 30s first message

#### Security
- All REST endpoints require JWT authentication
- WebSocket endpoint `/ws/**` allows public access
- Required roles: CUSTOMER, EMPLOYEE, or ADMIN

---

## Test Tools

### 1. HTML Test Tool
**File**: `docs/websocket_realtime_test.html`

**Features**:
- WebSocket connection management
- Send text messages
- Send image messages (max 5MB)
- Receive real-time messages
- Load conversation history
- Heartbeat monitoring
- Response logging

**Usage**:
1. Open file in browser
2. Enter Conversation ID
3. Click "Connect WebSocket"
4. Enter JWT token for sending messages
5. Send/receive messages in real-time

### 2. Disconnect Monitoring Tool
**File**: `docs/websocket_disconnect_test.html`

**Features**:
- Connection uptime tracking
- Disconnect event detection
- Heartbeat verification (every 5s)
- Message count tracking
- Detailed event logging

**Usage**:
- Use for testing idle disconnect issues
- Monitor connection stability
- Verify heartbeat configuration

---

## Notes

1. ✅ Messages sent via REST API are **automatically broadcast** to WebSocket subscribers
2. ✅ Images are **uploaded to Cloudinary** and URL stored in database
3. ✅ Conversations can be **linked to Bookings** for booking-specific chat
4. ✅ **Pagination supported** for message history retrieval
5. ✅ **Unread count** and **mark as read** functionality available
6. ✅ **Heartbeat configuration prevents idle disconnect** (10s interval)
7. ⚠️ WebSocket does NOT require JWT for subscription (only REST API requires it)
8. ⚠️ Image max size: **5MB** (enforced by backend validation)
9. 📊 Default page size: **20 for conversations**, **50 for messages**
10. 📝 **senderName** returns account username (e.g., "john_doe", "jane_smith") not full name
