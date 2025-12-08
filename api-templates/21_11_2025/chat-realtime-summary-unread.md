# Chat - Realtime Unread Count & Conversation Summary (21-11-2025)

Tài liệu tóm tắt cho FE về phần vừa bổ sung: lưu message khi gửi qua WebSocket và đẩy realtime lastMessage/lastMessageTime + unreadCount cho từng participant.

## API endpoints
- `POST /api/v1/messages/send/text`
  - Form-data: `conversationId` (string), `senderId` (accountId), `content` (string)
  - Response 201:
    ```json
    {
      "success": true,
      "message": "Message sent successfully",
      "data": {
        "messageId": "uuid",
        "conversationId": "conv-uuid",
        "senderId": "account-uuid",
        "senderName": "John Doe",
        "senderAvatar": "https://...",
        "messageType": "TEXT",
        "content": "Hello",
        "imageUrl": null,
        "isRead": false,
        "createdAt": "2025-11-21T10:00:00"
      }
    }
    ```

- `POST /api/v1/messages/send/image`
  - Form-data: `conversationId` (string), `senderId` (accountId), `imageFile` (file), `caption` (optional)
  - Response 201 giống trên, `messageType: IMAGE`, `imageUrl` trả về URL, `content` có caption nếu gửi.

- `GET /api/v1/messages/unread-count?receiverId={participantId}`
  - Trả tổng unread của participant trên tất cả conversations:
    ```json
    { "success": true, "data": { "receiverId": "...", "unreadCount": 5 } }
    ```

- `GET /api/v1/messages/conversation/{conversationId}/unread-count?receiverId={participantId}`
  - Trả unread của participant trong 1 conversation:
    ```json
    { "success": true, "data": { "receiverId": "...", "conversationId": "...", "unreadCount": 2 } }
    ```

- `PUT /api/v1/messages/conversation/{conversationId}/mark-read?receiverId={participantId}`
  - Đánh dấu unread -> read trong 1 conversation, trả `markedCount`.

- `PUT /api/v1/messages/mark-all-read?receiverId={participantId}`
  - Đánh dấu tất cả messages của participant là read, trả `markedCount`.

## WebSocket
- Endpoint: `/ws/chat` (SockJS + STOMP), prefix `/app`, broker `/topic`.

### Gửi tin nhắn qua WS
- Send destination: `/app/chat.send`
- Payload client gửi:
  ```json
  {
    "conversationId": "conv-uuid",
    "senderId": "account-uuid",
    "senderName": "John Doe",
    "senderAvatar": "https://...",
    "messageType": "TEXT",
    "content": "Hello via ws",
    "imageUrl": null
  }
  ```
- Server sẽ:
  1) Lưu message vào DB.
  2) Broadcast message tới topic conversation.
  3) Broadcast conversation summary (lastMessage, lastMessageTime, unreadCount) tới từng participant.

### Nhận tin nhắn realtime
- Subscribe: `/topic/conversation/{conversationId}`
- Payload nhận (ChatMessageWebSocketDTO):
  ```json
  {
    "messageId": "uuid",
    "conversationId": "conv-uuid",
    "senderId": "account-uuid",
    "senderName": "John Doe",
    "senderAvatar": "https://...",
    "messageType": "TEXT",
    "content": "Hello via ws",
    "imageUrl": null,
    "timestamp": "2025-11-21T10:00:00"
  }
  ```

### Nhận summary (last message + unread)
- Subscribe: `/topic/conversation/summary/{participantId}`
  - `participantId` là `customerId` hoặc `employeeId` (bên conversation).
- Payload nhận (ConversationWebSocketDTO):
  ```json
  {
    "conversationId": "conv-uuid",
    "participantId": "c1000001-...",
    "senderId": "account-uuid",
    "lastMessage": "[Image] or text preview",
    "lastMessageTime": "2025-11-21T10:00:00",
    "unreadCount": 5
  }
  ```
- Thời điểm đẩy:
  - Khi gửi message qua REST `send/text`, `send/image`.
  - Khi gửi message qua WS `/app/chat.send`.

### Lưu ý cho FE
- Unread count tính trên messages có `isRead=false` và sender khác participant.
- Khi mở conversation, call `PUT /api/v1/messages/conversation/{conversationId}/mark-read` rồi cập nhật badge local; server sẽ phản ánh unreadCount đúng cho các push tiếp theo.
- Caption khi gửi ảnh qua REST: dùng field `caption`; WS payload khi nhận sẽ có `content` chứa caption (nếu có).
