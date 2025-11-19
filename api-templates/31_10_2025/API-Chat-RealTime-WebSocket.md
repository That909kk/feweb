# API Test Cases - Chat Real-Time & WebSocket

## Overview
This document describes essential test cases for the **Chat Real-Time** feature using WebSocket (STOMP over SockJS) and REST API endpoints. This feature enables real-time messaging between customers and employees.

**Documentation Date**: October 31, 2025  
**Base URL**: `http://localhost:8080`  
**WebSocket Endpoint**: `/ws/chat`  
**API Base Path**: `/api/v1`

### Test Data Available
**Test Accounts** (Password: `123456` hashed with BCrypt):
- **john_doe** (CUSTOMER) - Account ID: `a1000001-0000-0000-0000-000000000001`
  - Customer ID: `c1000001-0000-0000-0000-000000000001`
  - Full Name: John Doe
  - Email: john.doe@example.com

- **jane_smith** (EMPLOYEE + CUSTOMER) - Account ID: `a1000001-0000-0000-0000-000000000002`
  - Employee ID: `e1000001-0000-0000-0000-000000000001`
  - Customer ID: `c1000001-0000-0000-0000-000000000003`
  - Full Name: Jane Smith
  - Email: jane.smith@example.com

- **admin_1** (ADMIN) - Account ID: `a1000001-0000-0000-0000-000000000003`
  - Admin ID: `ad100001-0000-0000-0000-000000000001`

- **nguyenvana** (CUSTOMER) - Account ID: `a1000001-0000-0000-0000-000000000006`
  - Customer ID: `c1000001-0000-0000-0000-000000000004`
  - Full Name: Nguyễn Văn An
  - Email: nguyenvanan@gmail.com

- **tranvanl** (EMPLOYEE) - Account ID: `a1000001-0000-0000-0000-000000000016`
  - Employee ID: `e1000001-0000-0000-0000-000000000003`
  - Full Name: Trần Văn Long
  - Email: tranvanlong@gmail.com

**Note**: All IDs are UUIDs in format: `{prefix}-0000-0000-0000-{suffix}`

---

## Test Case Structure
Each test case includes:
- **Test Case ID**: Unique identifier for the test case.
- **Description**: Purpose of the test.
- **Preconditions**: Requirements before executing the test.
- **Input**: Request data or headers.
- **Expected Output**: Expected response based on the API specification.
- **Status Code**: HTTP status code expected.

---

## Authentication Requirements
All endpoints require:
- **Authorization Header**: `Bearer <valid_token>`
- **Role Requirements**: CUSTOMER, EMPLOYEE, or ADMIN role

---

## API Endpoints Covered
1. **POST /api/v1/conversations** - Create Conversation
2. **GET /api/v1/conversations/user/{accountId}** - Get User's Conversations
3. **GET /api/v1/conversations/{conversationId}** - Get Conversation by ID
4. **POST /api/v1/messages/send/text** - Send Text Message
5. **POST /api/v1/messages/send/image** - Send Image Message
6. **GET /api/v1/messages/conversation/{conversationId}/all** - Get All Messages
7. **GET /api/v1/messages/conversation/{conversationId}/unread** - Get Unread Messages
8. **PUT /api/v1/messages/conversation/{conversationId}/mark-read** - Mark as Read
9. **WebSocket /ws/chat** - Real-time Communication

---

## WebSocket Configuration

### Connection Endpoint
**URL**: `/ws/chat`  
**Protocol**: SockJS + STOMP  
**Allowed Origins**: `*`

### STOMP Configuration
- **Application Destination Prefix**: `/app`
- **Topic Prefix**: `/topic`
- **Queue Prefix**: `/queue`

### Connection Setup Example
```javascript
// 1. Import libraries (CDN or npm)
<script src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>

// 2. Create connection
const socket = new SockJS('http://localhost:8080/ws/chat');
const stompClient = Stomp.over(socket);

// 3. Disable debug (optional)
stompClient.debug = null;

// 4. Connect
stompClient.connect({}, function(frame) {
    console.log('✅ Connected to WebSocket');
    
    // 5. Subscribe to conversation topic (use actual UUID)
    const conversationId = 'conv0001-0000-0000-0000-000000000001';
    stompClient.subscribe(`/topic/conversation/${conversationId}`, function(message) {
        const chatMessage = JSON.parse(message.body);
        console.log('📨 Received:', chatMessage);
        displayMessage(chatMessage);
    });
}, function(error) {
    console.error('❌ Connection error:', error);
});
```

### Send Message via WebSocket
```javascript
// Message format
const message = {
    conversationId: "conv0001-0000-0000-0000-000000000001",
    senderId: "a1000001-0000-0000-0000-000000000001",
    senderName: "John Doe",
    messageType: "TEXT",
    content: "Hello from WebSocket",
    timestamp: new Date().toISOString()
};

// Send to destination
stompClient.send("/app/chat.send", {}, JSON.stringify(message));
```

### Subscribe to Conversation
```javascript
// Subscribe pattern: /topic/conversation/{conversationId}
const conversationId = 'conv0001-0000-0000-0000-000000000001';

const subscription = stompClient.subscribe(
    `/topic/conversation/${conversationId}`, 
    function(message) {
        const data = JSON.parse(message.body);
        
        // Handle different message types
        if (data.messageType === 'TEXT') {
            displayTextMessage(data);
        } else if (data.messageType === 'IMAGE') {
            displayImageMessage(data);
        }
    }
);
```

### Disconnect
```javascript
// Graceful disconnect
if (stompClient && stompClient.connected) {
    stompClient.disconnect(function() {
        console.log('Disconnected from WebSocket');
    });
}
```

---

## REST API Test Cases

### Test Case 1: Create Conversation - Success
- **Test Case ID**: TC_CHAT_CONV_001
- **Description**: Customer successfully creates conversation with employee
- **Preconditions**:
  - Valid JWT token for customer (john_doe)
  - Customer ID: `c1000001-0000-0000-0000-000000000001` exists (John Doe)
  - Employee ID: `e1000001-0000-0000-0000-000000000001` exists (Jane Smith)
- **Input**:
  - **Endpoint**: POST /api/v1/conversations
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_jwt_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "bookingId": null
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
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "employeeName": "Jane Smith",
      "bookingId": null,
      "lastMessage": null,
      "lastMessageTime": null,
      "isActive": true,
      "createdAt": "2025-10-31T10:00:00"
    }
  }
  ```
- **Status Code**: 201 Created

---

### Test Case 2: Create Conversation - Missing Customer ID
- **Test Case ID**: TC_CHAT_CONV_002
- **Description**: Verify validation error when customerId is missing
- **Preconditions**:
  - Valid JWT token
- **Input**:
  - **Endpoint**: POST /api/v1/conversations
  - **Headers**: 
    ```
    Authorization: Bearer <jwt_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "employeeId": 2,
      "bookingId": null
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Customer ID là bắt buộc"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 3: Create Conversation - Customer Not Found
- **Test Case ID**: TC_CHAT_CONV_003
- **Description**: Verify error when customer does not exist
- **Preconditions**:
  - Valid JWT token
  - Customer ID: 99999 does not exist
- **Input**:
  - **Endpoint**: POST /api/v1/conversations
  - **Body**:
    ```json
    {
      "customerId": 99999,
      "employeeId": 2
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy khách hàng"
  }
  ```
- **Status Code**: 404 Not Found

---

### Test Case 4: Send Text Message - Success
- **Test Case ID**: TC_CHAT_MSG_001
- **Description**: Customer successfully sends text message
- **Preconditions**:
  - Valid conversation ID exists (created from Test Case 1)
  - Valid JWT token
  - Sender is participant in conversation
  - WebSocket subscribers receive message in real-time
- **Input**:
  - **Endpoint**: POST /api/v1/messages/send/text
  - **Headers**: 
    ```
    Authorization: Bearer <jwt_token>
    Content-Type: application/x-www-form-urlencoded
    ```
  - **Form Data**:
    ```
    conversationId=conv0001-0000-0000-0000-000000000001
    senderId=a1000001-0000-0000-0000-000000000001
    content=Xin chào, tôi cần hỗ trợ dọn dẹp nhà
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Message sent successfully",
    "data": {
      "messageId": "msg00001-0000-0000-0000-000000000001",
      "conversationId": "conv0001-0000-0000-0000-000000000001",
      "senderId": "a1000001-0000-0000-0000-000000000001",
      "senderName": "John Doe",
      "messageType": "TEXT",
      "content": "Xin chào, tôi cần hỗ trợ dọn dẹp nhà",
      "imageUrl": null,
      "isRead": false,
      "createdAt": "2025-10-31T10:30:00"
    }
  }
  ```
- **Status Code**: 200 OK
- **WebSocket Broadcast**: Message sent to `/topic/conversation/conv0001-0000-0000-0000-000000000001`

---

### Test Case 5: Send Text Message - Empty Content
- **Test Case ID**: TC_CHAT_MSG_002
- **Description**: Verify validation error for empty message content
- **Preconditions**:
  - Valid conversation exists
  - Valid JWT token
- **Input**:
  - **Endpoint**: POST /api/v1/messages/send/text
  - **Form Data**:
    ```
    conversationId=1
    senderId=1
    content=
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Nội dung tin nhắn không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 6: Send Text Message - Unauthorized Sender
- **Test Case ID**: TC_CHAT_MSG_003
- **Description**: Verify error when sender is not part of conversation
- **Preconditions**:
  - Conversation ID: 1 exists between customer 1 and employee 2
  - Sender ID: 3 is not participant in this conversation
- **Input**:
  - **Endpoint**: POST /api/v1/messages/send/text
  - **Form Data**:
    ```
    conversationId=1
    senderId=3
    content=Hello
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này"
  }
  ```
- **Status Code**: 403 Forbidden

---

### Test Case 7: Send Image Message - Success (JPEG)
- **Test Case ID**: TC_CHAT_IMG_001
- **Description**: Customer successfully uploads and sends JPEG image
- **Preconditions**:
  - Valid conversation exists
  - Valid JWT token
  - JPEG image file < 5MB
  - Cloudinary configured and accessible
- **Input**:
  - **Endpoint**: POST /api/v1/messages/send/image
  - **Headers**: 
    ```
    Authorization: Bearer <jwt_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    ```
    conversationId=conv0001-0000-0000-0000-000000000001
    senderId=a1000001-0000-0000-0000-000000000001
    imageFile=<room_photo.jpg> (2.5MB, image/jpeg)
    caption=Phòng cần dọn dẹp
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Image sent successfully",
    "data": {
      "messageId": "msg00002-0000-0000-0000-000000000002",
      "conversationId": "conv0001-0000-0000-0000-000000000001",
      "senderId": "a1000001-0000-0000-0000-000000000001",
      "senderName": "John Doe",
      "messageType": "IMAGE",
      "content": null,
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698653800/chat_images/abc123def456.jpg",
      "isRead": false,
      "createdAt": "2025-10-31T10:35:00"
    }
  }
  ```
- **Status Code**: 200 OK
- **WebSocket Broadcast**: Image message sent to `/topic/conversation/conv0001-0000-0000-0000-000000000001`
- **Note**: Caption is stored separately in ChatMessageWebSocketDTO but not in response data

---

### Test Case 8: Send Image Message - PNG Format
- **Test Case ID**: TC_CHAT_IMG_002
- **Description**: Verify system accepts PNG format images
- **Preconditions**:
  - Valid conversation exists
  - PNG image file < 5MB
- **Input**:
  - **Form Data**:
    ```
    conversationId=1
    senderId=1
    imageFile=<screenshot.png> (1.8MB, image/png)
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Gửi ảnh thành công",
    "data": {
      "messageType": "IMAGE",
      "imageUrl": "https://res.cloudinary.com/.../chat_images/xyz789.png"
    }
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 9: Send Image Message - File Too Large
- **Test Case ID**: TC_CHAT_IMG_003
- **Description**: Verify error when image exceeds 5MB limit
- **Preconditions**:
  - Valid conversation exists
  - Image file > 5MB
- **Input**:
  - **Form Data**:
    ```
    conversationId=1
    senderId=1
    imageFile=<large_photo.jpg> (7.2MB, image/jpeg)
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Kích thước file không được vượt quá 5MB"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 10: Send Image Message - Invalid File Type
- **Test Case ID**: TC_CHAT_IMG_004
- **Description**: Verify error when uploading non-image file (e.g., PDF)
- **Preconditions**:
  - Valid conversation exists
  - PDF file instead of image
- **Input**:
  - **Form Data**:
    ```
    conversationId=1
    senderId=1
    imageFile=<document.pdf> (1MB, application/pdf)
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File phải là định dạng ảnh"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 11: Send Image Message - No File Provided
- **Test Case ID**: TC_CHAT_IMG_005
- **Description**: Verify error when imageFile is missing
- **Preconditions**:
  - Valid conversation exists
- **Input**:
  - **Form Data**:
    ```
    conversationId=1
    senderId=1
    imageFile=<empty>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 12: Get Conversation Messages - Success
- **Test Case ID**: TC_CHAT_MSG_004
- **Description**: Retrieve all messages in a conversation
- **Preconditions**:
  - Conversation ID: 1 exists
  - Multiple messages in conversation
  - Valid JWT token
- **Input**:
  - **Endpoint**: GET /api/v1/messages/conversation/1/all
  - **Headers**: 
    ```
    Authorization: Bearer <jwt_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy tin nhắn thành công",
    "data": [
      {
        "messageId": 1,
        "senderId": 1,
        "senderName": "John Doe",
        "messageType": "TEXT",
        "content": "Xin chào",
        "isRead": true,
        "createdAt": "2025-10-31T10:30:00"
      },
      {
        "messageId": 2,
        "senderId": 2,
        "senderName": "Michael Brown",
        "messageType": "TEXT",
        "content": "Xin chào, tôi có thể giúp gì?",
        "isRead": true,
        "createdAt": "2025-10-31T10:31:00"
      },
      {
        "messageId": 3,
        "senderId": 1,
        "messageType": "IMAGE",
        "imageUrl": "https://res.cloudinary.com/.../chat_images/abc.jpg",
        "isRead": false,
        "createdAt": "2025-10-31T10:35:00"
      }
    ]
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 13: Get Unread Messages - Success
- **Test Case ID**: TC_CHAT_MSG_005
- **Description**: Retrieve only unread messages in conversation
- **Preconditions**:
  - Conversation has both read and unread messages
  - Valid JWT token
- **Input**:
  - **Endpoint**: GET /api/v1/messages/conversation/1/unread
  - **Headers**: 
    ```
    Authorization: Bearer <jwt_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy tin nhắn chưa đọc thành công",
    "data": [
      {
        "messageId": 5,
        "senderId": 2,
        "messageType": "TEXT",
        "content": "Tôi sẽ đến vào 14h",
        "isRead": false,
        "createdAt": "2025-10-31T11:00:00"
      }
    ]
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 14: Mark Messages as Read - Success
- **Test Case ID**: TC_CHAT_MSG_006
- **Description**: Mark all messages in conversation as read
- **Preconditions**:
  - Conversation has unread messages
  - Valid JWT token
- **Input**:
  - **Endpoint**: PUT /api/v1/messages/conversation/1/mark-read
  - **Headers**: 
    ```
    Authorization: Bearer <jwt_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đánh dấu tin nhắn đã đọc thành công"
  }
  ```
- **Status Code**: 200 OK
- **Side Effect**: All messages with `isRead=false` are updated to `isRead=true`

---

### Test Case 15: Get User Conversations - Success
- **Test Case ID**: TC_CHAT_CONV_004
- **Description**: Retrieve all conversations for a user
- **Preconditions**:
  - User (account ID: a1000001-0000-0000-0000-000000000001) has multiple conversations
  - Valid JWT token
- **Input**:
  - **Endpoint**: GET /api/v1/conversations/account/a1000001-0000-0000-0000-000000000001
  - **Headers**: 
    ```
    Authorization: Bearer <jwt_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách cuộc hội thoại thành công",
    "data": [
      {
        "conversationId": "conv0001-0000-0000-0000-000000000001",
        "customerId": "c1000001-0000-0000-0000-000000000001",
        "customerName": "John Doe",
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "employeeName": "Jane Smith",
        "lastMessage": "Tôi sẽ đến vào 14h",
        "lastMessageTime": "2025-10-31T11:00:00",
        "isActive": true
      }
    ],
    "currentPage": 0,
    "totalItems": 1,
    "totalPages": 1
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 16: Get User Conversations - Active Only
- **Test Case ID**: TC_CHAT_CONV_005
- **Description**: Filter to show only active conversations
- **Preconditions**:
  - User has both active and inactive conversations
- **Input**:
  - **Endpoint**: GET /api/v1/conversations/user/1?activeOnly=true
  - **Headers**: 
    ```
    Authorization: Bearer <jwt_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "conversationId": 1,
        "isActive": true
      }
    ]
  }
  ```
- **Status Code**: 200 OK
- **Note**: Only conversations with `isActive=true` are returned

---

## WebSocket Test Cases

### Test Case WS-1: WebSocket Connection - Success
- **Test Case ID**: TC_WEBSOCKET_001
- **Description**: Client successfully establishes WebSocket connection
- **Preconditions**:
  - Server is running on localhost:8080
  - SockJS and STOMP libraries loaded
- **Input**:
  ```javascript
  const socket = new SockJS('http://localhost:8080/ws/chat');
  const stompClient = Stomp.over(socket);
  
  stompClient.connect({}, 
    function(frame) {
      console.log('Connected:', frame);
    },
    function(error) {
      console.error('Error:', error);
    }
  );
  ```
- **Expected Output**:
  - Connection callback executed
  - `frame` object contains connection details
  - Console log: "Connected: CONNECTED..."
  - `stompClient.connected === true`
- **Status**: Connection established

---

### Test Case WS-2: Subscribe to Conversation Topic - Success
- **Test Case ID**: TC_WEBSOCKET_002
- **Description**: Client subscribes to conversation topic and receives messages
- **Preconditions**:
  - WebSocket connected successfully
  - Conversation ID: 1 exists
- **Input**:
  ```javascript
  const subscription = stompClient.subscribe(
    '/topic/conversation/1',
    function(message) {
      const data = JSON.parse(message.body);
      console.log('Received:', data);
    }
  );
  ```
- **Expected Output**:
  - Subscription successful
  - `subscription.id` is defined
  - Ready to receive messages on topic
- **Status**: Subscribed

---

### Test Case WS-3: Receive Real-Time Text Message
- **Test Case ID**: TC_WEBSOCKET_003
- **Description**: Subscribed client receives text message in real-time
- **Preconditions**:
  - Client subscribed to `/topic/conversation/1`
  - Another user sends message via REST API
- **Input (from another user)**:
  ```bash
  POST /api/v1/messages/send/text
  conversationId=1&senderId=2&content=Hello
  ```
- **Expected Output (WebSocket callback)**:
  ```json
  {
    "messageId": 10,
    "conversationId": 1,
    "senderId": 2,
    "senderName": "Michael Brown",
    "messageType": "TEXT",
    "content": "Hello",
    "timestamp": "2025-10-31T12:00:00"
  }
  ```
- **Status**: Message received instantly
- **Timing**: < 100ms after message sent

---

### Test Case WS-4: Receive Real-Time Image Message
- **Test Case ID**: TC_WEBSOCKET_004
- **Description**: Client receives image message via WebSocket
- **Preconditions**:
  - Client subscribed to conversation topic
  - Image uploaded via REST API
- **Input (from another user)**:
  ```bash
  POST /api/v1/messages/send/image
  conversationId=1&senderId=2&imageFile=<photo.jpg>
  ```
- **Expected Output (WebSocket callback)**:
  ```json
  {
    "messageId": 11,
    "conversationId": 1,
    "senderId": 2,
    "messageType": "IMAGE",
    "imageUrl": "https://res.cloudinary.com/.../chat_images/abc.jpg",
    "content": null,
    "timestamp": "2025-10-31T12:05:00"
  }
  ```
- **Status**: Image message received with Cloudinary URL
- **Timing**: < 200ms after upload

---

### Test Case WS-5: Send Message via WebSocket
- **Test Case ID**: TC_WEBSOCKET_005
- **Description**: Client sends message through WebSocket directly
- **Preconditions**:
  - WebSocket connected
  - User authenticated
- **Input**:
  ```javascript
  const message = {
    conversationId: 1,
    senderId: 1,
    senderName: "John Doe",
    messageType: "TEXT",
    content: "Message via WebSocket",
    timestamp: new Date().toISOString()
  };
  
  stompClient.send("/app/chat.send", {}, JSON.stringify(message));
  ```
- **Expected Output**:
  - Message sent successfully
  - All subscribers to `/topic/conversation/1` receive the message
  - Database updated with new message
- **Status**: Sent and broadcast

---

### Test Case WS-6: Multiple Subscribers Receive Same Message
- **Test Case ID**: TC_WEBSOCKET_006
- **Description**: Verify all subscribers receive broadcast messages
- **Preconditions**:
  - 3 clients subscribed to `/topic/conversation/1`
  - Clients: Customer (web), Employee (web), Admin (dashboard)
- **Input (Client 1 sends)**:
  ```javascript
  stompClient.send("/app/chat.send", {}, JSON.stringify({
    conversationId: 1,
    senderId: 1,
    content: "Broadcast test"
  }));
  ```
- **Expected Output**:
  - **Client 1**: Message sent confirmation
  - **Client 2**: Receives message via subscription callback
  - **Client 3**: Receives message via subscription callback
  - All receive identical message data
- **Status**: Broadcast successful to all 3 clients

---

### Test Case WS-7: Unsubscribe from Topic
- **Test Case ID**: TC_WEBSOCKET_007
- **Description**: Client unsubscribes and stops receiving messages
- **Preconditions**:
  - Client subscribed to conversation topic
  - Subscription object available
- **Input**:
  ```javascript
  subscription.unsubscribe();
  
  // Send message after unsubscribe
  // (another user sends via API)
  ```
- **Expected Output**:
  - Unsubscribe successful
  - Client no longer receives messages on that topic
  - Callback not triggered for new messages
- **Status**: Unsubscribed

---

### Test Case WS-8: WebSocket Disconnect and Reconnect
- **Test Case ID**: TC_WEBSOCKET_008
- **Description**: Client disconnects and reconnects successfully
- **Preconditions**:
  - WebSocket initially connected
- **Input**:
  ```javascript
  // Disconnect
  stompClient.disconnect(function() {
    console.log('Disconnected');
  });
  
  // Reconnect after 2 seconds
  setTimeout(() => {
    const newSocket = new SockJS('http://localhost:8080/ws/chat');
    const newClient = Stomp.over(newSocket);
    newClient.connect({}, function() {
      console.log('Reconnected');
    });
  }, 2000);
  ```
- **Expected Output**:
  - Disconnect callback executed
  - `stompClient.connected === false`
  - After 2 seconds: new connection established
  - Can subscribe and receive messages again
- **Status**: Disconnect and reconnect successful

---

### Test Case WS-9: Connection Error Handling
- **Test Case ID**: TC_WEBSOCKET_009
- **Description**: Verify error handling when server is unavailable
- **Preconditions**:
  - Server stopped or unreachable
- **Input**:
  ```javascript
  const socket = new SockJS('http://localhost:8080/ws/chat');
  const stompClient = Stomp.over(socket);
  
  stompClient.connect({}, 
    function(frame) {
      console.log('Connected');
    },
    function(error) {
      console.error('Connection failed:', error);
    }
  );
  ```
- **Expected Output**:
  - Connection callback NOT executed
  - Error callback executed
  - Error message contains connection failure details
  - `stompClient.connected === false`
- **Status**: Error handled gracefully

---

### Test Case WS-10: CORS - Cross-Origin Connection
- **Test Case ID**: TC_WEBSOCKET_010
- **Description**: Verify WebSocket accepts connections from allowed origins
- **Preconditions**:
  - Client running on http://127.0.0.1:5500 (Live Server)
  - Server allows this origin
- **Input**:
  ```javascript
  // From http://127.0.0.1:5500/simple_chat.html
  const socket = new SockJS('http://localhost:8080/ws/chat');
  const stompClient = Stomp.over(socket);
  stompClient.connect({}, onConnect, onError);
  ```
- **Expected Output**:
  - Connection successful (no CORS error)
  - Can subscribe and send messages
  - Browser console shows no CORS warnings
- **Status**: CORS configured correctly

---

### Test Case WS-11: Subscribe to Wrong Topic Format
- **Test Case ID**: TC_WEBSOCKET_011
- **Description**: Verify behavior when subscribing to invalid topic
- **Preconditions**:
  - WebSocket connected
- **Input**:
  ```javascript
  // Wrong format (missing conversation ID)
  stompClient.subscribe('/topic/conversation/', function(message) {
    console.log(message);
  });
  ```
- **Expected Output**:
  - Subscription may succeed but won't receive messages
  - Or subscription fails with error
  - No messages received
- **Status**: Invalid subscription

---

### Test Case WS-12: Large Message Handling
- **Test Case ID**: TC_WEBSOCKET_012
- **Description**: Test WebSocket with large text messages
- **Preconditions**:
  - WebSocket connected
  - Subscribed to topic
- **Input**:
  ```javascript
  const largeContent = "A".repeat(10000); // 10KB text
  
  const message = {
    conversationId: 1,
    senderId: 1,
    messageType: "TEXT",
    content: largeContent
  };
  
  stompClient.send("/app/chat.send", {}, JSON.stringify(message));
  ```
- **Expected Output**:
  - Message sent successfully
  - Subscribers receive full message content
  - No truncation or data loss
- **Status**: Large message handled

---

## Authentication Test Cases

### Test Case AUTH-1: Missing JWT Token
- **Test Case ID**: TC_CHAT_AUTH_001
- **Description**: Verify API rejects requests without authorization token
- **Preconditions**:
  - No Authorization header provided
- **Input**:
  - **Endpoint**: POST /api/v1/messages/send/text
  - **Headers**: (none)
  - **Body**: Valid form data
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-10-31T12:00:00.000+00:00",
    "status": 401,
    "error": "Unauthorized",
    "message": "Full authentication is required",
    "path": "/api/v1/messages/send/text"
  }
  ```
- **Status Code**: 401 Unauthorized

---

### Test Case AUTH-2: Invalid/Expired JWT Token
- **Test Case ID**: TC_CHAT_AUTH_002
- **Description**: Verify API rejects expired or malformed tokens
- **Preconditions**:
  - Expired or invalid JWT token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer invalid_or_expired_token
    ```
- **Expected Output**:
  ```json
  {
    "status": 401,
    "error": "Unauthorized",
    "message": "Invalid or expired token"
  }
  ```
- **Status Code**: 401 Unauthorized

---

### Test Case AUTH-3: Unauthorized Role Access
- **Test Case ID**: TC_CHAT_AUTH_003
- **Description**: Verify EMPLOYEE role cannot access customer-specific endpoints
- **Preconditions**:
  - Valid JWT token with EMPLOYEE role
  - Endpoint requires CUSTOMER role
- **Input**:
  - **Endpoint**: POST /api/v1/conversations
  - **Headers**: 
    ```
    Authorization: Bearer <employee_jwt_token>
    ```
  - **Body**: Valid data
- **Expected Output**:
  ```json
  {
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied"
  }
  ```
- **Status Code**: 403 Forbidden

---

## Error Handling Test Cases

### Test Case ERR-1: Conversation Not Found
- **Test Case ID**: TC_CHAT_ERR_001
- **Description**: Verify error when accessing non-existent conversation
- **Preconditions**:
  - Conversation ID: 99999 does not exist
  - Valid JWT token
- **Input**:
  - **Endpoint**: GET /api/v1/messages/conversation/99999/all
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy cuộc hội thoại"
  }
  ```
- **Status Code**: 404 Not Found

---

### Test Case ERR-2: Cloudinary Upload Failure
- **Test Case ID**: TC_CHAT_ERR_002
- **Description**: Verify graceful handling of Cloudinary service errors
- **Preconditions**:
  - Cloudinary service unavailable or credentials invalid
  - Valid image file
- **Input**:
  - **Endpoint**: POST /api/v1/messages/send/image
  - **Form Data**: Valid image file
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã xảy ra lỗi khi tải ảnh lên"
  }
  ```
- **Status Code**: 500 Internal Server Error

---

### Test Case ERR-3: Database Connection Error
- **Test Case ID**: TC_CHAT_ERR_003
- **Description**: Verify error handling when database is unavailable
- **Preconditions**:
  - Database connection lost or timed out
- **Input**:
  - **Endpoint**: GET /api/v1/conversations/user/1
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Lỗi hệ thống, vui lòng thử lại sau"
  }
  ```
- **Status Code**: 500 Internal Server Error

---

## Notes
- **Test Environment**: Development environment (localhost:8080)
- **Database**: PostgreSQL with seed data (see 99_seed_datas.sql)
- **Image Storage**: Cloudinary (folder: chat_images)
- **Supported Image Formats**: JPEG, PNG, GIF, BMP, WebP
- **Max Image Size**: 5MB (5,242,880 bytes)
- **WebSocket Protocol**: STOMP over SockJS
- **Real-time Delivery**: < 100ms for text, < 200ms for images
- **Browser Compatibility**: Chrome, Firefox, Edge, Safari (with SockJS fallback)
- **ID Format**: All IDs use UUID format (e.g., `a1000001-0000-0000-0000-000000000001`)
- **Password Hash**: BCrypt with salt rounds = 12
- **Test Password**: All test accounts use password `123456`

### Available Test Accounts Summary
| Username | Role(s) | Account ID | Customer/Employee ID |
|----------|---------|------------|---------------------|
| john_doe | CUSTOMER | a1000001-...-000000000001 | c1000001-...-000000000001 |
| jane_smith | EMPLOYEE, CUSTOMER | a1000001-...-000000000002 | e1000001-...-000000000001, c1000001-...-000000000003 |
| admin_1 | ADMIN | a1000001-...-000000000003 | ad100001-...-000000000001 |
| nguyenvana | CUSTOMER | a1000001-...-000000000006 | c1000001-...-000000000004 |
| tranvanl | EMPLOYEE | a1000001-...-000000000016 | e1000001-...-000000000003 |

### Testing Steps
1. **Login** to get JWT token:
   ```bash
   POST /api/v1/auth/login
   Body: { "username": "john_doe", "password": "123456" }
   ```

2. **Create Conversation**:
   ```bash
   POST /api/v1/conversations
   Body: {
     "customerId": "c1000001-0000-0000-0000-000000000001",
     "employeeId": "e1000001-0000-0000-0000-000000000001"
   }
   ```

3. **Connect WebSocket** using the conversationId from step 2

4. **Send Messages** via REST API or WebSocket

5. **Verify Real-time** delivery in WebSocket client

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-31 | Initial test case documentation | HKThanh |

---

**End of Test Cases**

