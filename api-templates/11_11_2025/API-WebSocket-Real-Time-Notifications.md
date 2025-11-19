# WebSocket Real-Time Notifications

## Overview
Hệ thống notification real-time sử dụng WebSocket (STOMP protocol) để gửi thông báo tức thời đến người dùng.

## WebSocket Endpoints

### Connection Endpoint
```
ws://localhost:8080/ws/notifications
```

**With SockJS fallback:**
```
http://localhost:8080/ws/notifications
```

### Subscribe Destinations (Role-Based Routing)

⚠️ **Important:** Một account có thể có nhiều roles (ví dụ: vừa là CUSTOMER vừa là EMPLOYEE), hệ thống sử dụng **role-based routing** để tránh nhầm lẫn notification.

#### 1. Customer Notifications
```
/user/{accountId}/CUSTOMER/queue/notifications
```
Nhận notifications dành cho role CUSTOMER (booking updates, payment, etc.)

#### 2. Employee Notifications
```
/user/{accountId}/EMPLOYEE/queue/notifications
```
Nhận notifications dành cho role EMPLOYEE (assignments, reviews, etc.)

#### 3. Admin Notifications
```
/user/{accountId}/ADMIN/queue/notifications
```
Nhận notifications dành cho role ADMIN (urgent bookings, system alerts, etc.)

#### 4. General Notifications (Fallback)
```
/user/{accountId}/queue/notifications
```
Nhận notifications không có targetRole cụ thể (nếu có)

#### 5. Broadcast Notifications (Optional)
```
/topic/notifications
```
Nhận notifications broadcast cho tất cả users

## Client Implementation

### JavaScript (with SockJS + STOMP)

```javascript
// 1. Install dependencies
// npm install sockjs-client stompjs

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

// 2. Connect to WebSocket
const accountId = 'current-user-account-id'; // From authentication
const currentRole = 'CUSTOMER'; // Get from current user context (CUSTOMER, EMPLOYEE, ADMIN)

const socket = new SockJS('http://localhost:8080/ws/notifications');
const stompClient = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    
    onConnect: (frame) => {
        console.log('Connected to WebSocket:', frame);
        
        // Subscribe to role-specific notifications
        const destination = `/user/${accountId}/${currentRole}/queue/notifications`;
        stompClient.subscribe(destination, (message) => {
            const notification = JSON.parse(message.body);
            handleNotification(notification);
        });
        
        console.log(`Subscribed to ${destination}`);
    },
    
    onStompError: (frame) => {
        console.error('STOMP error:', frame);
    },
    
    onWebSocketClose: (event) => {
        console.log('WebSocket closed:', event);
    }
});

stompClient.activate();

// 3. Handle incoming notifications
function handleNotification(notification) {
    console.log('New notification:', notification);
    
    // Display notification in UI
    showToast({
        title: notification.title,
        message: notification.message,
        type: notification.priority, // NORMAL, URGENT
        actionUrl: notification.actionUrl
    });
    
    // Update notification badge count
    updateNotificationBadge();
    
    // Play sound for urgent notifications
    if (notification.priority === 'URGENT') {
        playNotificationSound();
    }
}

// 4. Disconnect when done
function disconnect() {
    if (stompClient) {
        stompClient.deactivate();
    }
}
```

### React Hook Example

```javascript
import { useEffect, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

export const useWebSocketNotifications = (accountId, role) => {
    const [notifications, setNotifications] = useState([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!accountId || !role) return;

        const socket = new SockJS('http://localhost:8080/ws/notifications');
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            
            onConnect: () => {
                setConnected(true);
                
                // Subscribe to role-specific destination
                const destination = `/user/${accountId}/${role}/queue/notifications`;
                client.subscribe(destination, (message) => {
                    const notification = JSON.parse(message.body);
                    setNotifications(prev => [notification, ...prev]);
                });
                
                console.log(`Subscribed to ${destination}`);
            },
            
            onDisconnect: () => {
                setConnected(false);
            }
        });

        client.activate();

        return () => {
            client.deactivate();
        };
    }, [accountId, role]);

    return { notifications, connected };
};

// Usage in component
function NotificationComponent() {
    const user = useAuth().user;
    const accountId = user?.accountId;
    const currentRole = user?.currentRole; // CUSTOMER, EMPLOYEE, or ADMIN
    
    const { notifications, connected } = useWebSocketNotifications(accountId, currentRole);

    return (
        <div>
            <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
            {notifications.map(notif => (
                <NotificationItem key={notif.notificationId} {...notif} />
            ))}
        </div>
    );
}
```

## Notification Payload Structure

```typescript
interface NotificationWebSocketDTO {
    notificationId: string;
    accountId: string;
    targetRole: string;  // CUSTOMER, EMPLOYEE, ADMIN - Role this notification is intended for
    type: string;  // BOOKING_CREATED, BOOKING_CONFIRMED, ASSIGNMENT_CREATED, etc.
    title: string;
    message: string;
    relatedId: string;  // bookingId, assignmentId, etc.
    relatedType: string;  // BOOKING, ASSIGNMENT, PAYMENT, etc.
    priority: string;  // NORMAL, HIGH, URGENT
    actionUrl: string;  // Deep link to relevant page
    createdAt: string;  // ISO 8601 timestamp
}
```

## Notification Scenarios

### 1. Employee Accepts Booking (Customer Notification)

**Trigger:** Khi employee chấp nhận booking detail

**Recipient:** Customer của booking

**Notification:**
- **Title:** "Nhân viên đã tham gia"
- **Message:** "Nhân viên [Tên] đã tham gia vào booking [Code] của bạn"
- **Type:** ASSIGNMENT_CREATED
- **Priority:** NORMAL

```json
{
    "notificationId": "notif-123",
    "accountId": "customer-account-id",
    "targetRole": "CUSTOMER",
    "type": "ASSIGNMENT_CREATED",
    "title": "Nhân viên đã tham gia",
    "message": "Nhân viên Nguyễn Văn A đã tham gia vào booking BK001 của bạn",
    "relatedId": "booking-123",
    "relatedType": "BOOKING",
    "priority": "NORMAL",
    "actionUrl": "/bookings/booking-123",
    "createdAt": "2025-11-11T10:30:00"
}
```

### 2. All Employees Assigned (Customer Notification)

**Trigger:** Khi tất cả booking details đã có đủ nhân viên

**Recipient:** Customer của booking

**Notification:**
- **Title:** "Đặt lịch được xác nhận"
- **Message:** "Booking [Code] của bạn đã được xác nhận với đầy đủ nhân viên"
- **Type:** BOOKING_CONFIRMED
- **Priority:** NORMAL

### 3. Urgent Booking Approval (Admin Notification)

**Trigger:** Scheduled job chạy mỗi 10 phút, kiểm tra booking cần duyệt trong vòng 1 tiếng

**Recipient:** Tất cả admin accounts

**Notification:**
- **Title:** "⚠️ Booking cần duyệt gấp"
- **Message:** "Booking [Code] (trạng thái: [Status]) cần được xử lý, sẽ bắt đầu trong [X] phút"
- **Type:** BOOKING_VERIFIED
- **Priority:** URGENT

```json
{
    "notificationId": "notif-456",
    "accountId": "admin-account-id",
    "targetRole": "ADMIN",
    "type": "BOOKING_VERIFIED",
    "title": "⚠️ Booking cần duyệt gấp",
    "message": "Booking BK002 (trạng thái: chờ duyệt) cần được xử lý, sẽ bắt đầu trong 45 phút",
    "relatedId": "booking-456",
    "relatedType": "BOOKING",
    "priority": "URGENT",
    "actionUrl": "/admin/bookings/booking-456",
    "createdAt": "2025-11-11T11:15:00"
}
```

## Email Notification Integration

⚠️ **Dual Delivery System:** Hệ thống tự động gửi notification qua **2 kênh song song**:

1. **Email** - Nếu account có email hợp lệ
2. **WebSocket** - Real-time notification (luôn gửi)

### Email Logic
- Email được resolve từ `EmailRecipientResolver.resolveEmailByAccountId()`
- Nếu **không tìm thấy email**, hệ thống **bỏ qua email** và chỉ gửi qua WebSocket
- Nếu **có email**, gửi qua cả 2 kênh

### Benefits
- Users nhận notification ngay lập tức qua WebSocket
- Có bản backup qua email cho notifications quan trọng
- Không bị fail nếu email không available

## Testing

### Manual Testing with WebSocket Client
1. **Connect:**
```bash
wscat -c ws://localhost:8080/ws/notifications
```

2. **Send STOMP CONNECT:**
```
CONNECT
accept-version:1.2
heart-beat:10000,10000

```

3. **Subscribe (Role-specific):**
```
SUBSCRIBE
id:sub-0
destination:/user/account-123/CUSTOMER/queue/notifications

```

**For Employee:**
```
SUBSCRIBE
id:sub-1
destination:/user/account-123/EMPLOYEE/queue/notifications

```

**For Admin:**
```
SUBSCRIBE
id:sub-2
destination:/user/account-123/ADMIN/queue/notifications

```

4. **Trigger notification via API and observe message**

### Integration Test
Create a booking and have employee accept it, then monitor WebSocket messages in browser console.

## Troubleshooting

### Connection Issues
- Verify Spring Boot app is running on port 8080
- Check CORS configuration allows your frontend origin
- Ensure WebSocket is not blocked by proxy/firewall

### Not Receiving Notifications
- **Verify accountId** matches authenticated user
- **Verify targetRole** matches current user's role (CUSTOMER, EMPLOYEE, ADMIN)
- **Check subscription destination** is correct: `/user/{accountId}/{ROLE}/queue/notifications`
- Enable DEBUG logging: `logging.level.org.springframework.messaging=DEBUG`

### Receiving Wrong Notifications (Multi-Role Accounts)
- ⚠️ **Solution:** Always subscribe với role cụ thể của session hiện tại
- Nếu user vừa là CUSTOMER vừa là EMPLOYEE:
  - Khi login as CUSTOMER → Subscribe `/user/{id}/CUSTOMER/queue/notifications`
  - Khi login as EMPLOYEE → Subscribe `/user/{id}/EMPLOYEE/queue/notifications`
- Backend tự động route notification đúng role dựa vào `targetRole` field

### Duplicate Notifications
- Scheduler tracks notified bookings to prevent duplicates
- If server restarts, tracking is reset (this is acceptable)

## Future Enhancements
- [ ] Add notification preferences (enable/disable types)
- [ ] Support notification delivery acknowledgment
- [ ] Add notification history pagination via WebSocket
- [ ] Implement notification grouping for multiple updates
- [ ] Add typing indicators for admin chat responses
