# Voice Booking WebSocket Guide

Endpoint: `/ws/voice-booking` (STOMP over SockJS)

Auth: Bearer JWT in `Authorization` header.

Topics:
- `/topic/voice-booking/{requestId}` for realtime events.
- `/user/queue/voice-booking/errors` for auth/permission errors.

Event payload (`VoiceBookingEventPayload`):
```
{
  "eventType": "RECEIVED|TRANSCRIBING|PARTIAL|AWAITING_CONFIRMATION|COMPLETED|FAILED|CANCELLED",
  "requestId": "uuid",
  "status": "PROCESSING|PARTIAL|AWAITING_CONFIRMATION|COMPLETED|FAILED|CANCELLED",
  "message": "UI message",
  "isFinal": true/false,
  "confidence": 0.0-1.0,
  "transcript": "raw transcript",
  "missingFields": ["service","bookingTime","address"],
  "clarificationMessage": "text to ask user",
  "bookingId": "BK123",
  "processingTimeMs": 1200,
  "errorMessage": "reason if FAILED",
  "failureHints": ["check mic","retry"],
  "retryAfterMs": 3000,
  "speech": {
    "message": { "text": "Đã dựng đơn nháp...", "audioUrl": "https://..." },
    "clarification": { "text": "Bạn vui lòng cung cấp thêm thông tin...", "audioUrl": "https://..." }
  },
  "preview": { /* VoiceBookingPreview JSON as stored in DB */ },
  "timestamp": "2025-11-20T17:00:00Z",
  "progress": 0.0-1.0
}
```

Typical flow:
1. Client uploads audio via REST `POST /api/v1/customer/bookings/voice`.
2. Subscribe to `/topic/voice-booking/{requestId}` after POST response returns `requestId`.
3. Listen for:
   - `RECEIVED`/`TRANSCRIBING`: show spinner/progress.
   - `PARTIAL` (`isFinal=false`): display `clarificationMessage`, `missingFields`, optional TTS audio.
   - `AWAITING_CONFIRMATION` (`isFinal=true`): show preview & TTS.
   - `COMPLETED`: bookingId available.
   - `FAILED`: show `errorMessage`, `failureHints`, wait `retryAfterMs` before retry.
4. Clients may send more audio via REST `/voice/continue` using same `requestId`.

Notes:
- Speech URLs are already uploaded (Cloudinary). Play directly.
- `isFinal=false` means more updates may come (e.g., PARTIAL). `isFinal=true` for terminal states.
- `confidence` mirrors STT/parsing confidence when available.
