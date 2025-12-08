# API Documentation - Employee Working Hours & Available Slots

## Tổng quan

Tài liệu này mô tả các API mới được thêm vào hệ thống để:
1. Cho phép nhân viên cài đặt khung giờ làm việc của mình
2. Tính toán và trả về danh sách slot khả dụng theo ngày, vị trí và loại dịch vụ
3. Kiểm tra xung đột lịch và thời gian di chuyển giữa các assignment

---

## I. Employee Working Hours API

### Base URL: `/api/v1/employee-working-hours`

### 1. Lấy khung giờ làm việc của nhân viên

**GET** `/{employeeId}`

**Authorization:** `ROLE_ADMIN`, `ROLE_EMPLOYEE`

**Response Success (200 OK):**
```json
{
    "success": true,
    "message": "Lấy khung giờ làm việc thành công",
    "data": [
        {
            "workingHoursId": "0cebf574-e8f3-4d1f-9ecb-61b3b4223392",
            "dayOfWeek": "MONDAY",
            "dayOfWeekDisplay": "Thứ Hai",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "83dce962-a99f-4cdf-b749-9e73ac46b1e4",
            "dayOfWeek": "TUESDAY",
            "dayOfWeekDisplay": "Thứ Ba",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "d237b806-a7f0-4b15-acd8-ffb0b9907f9b",
            "dayOfWeek": "WEDNESDAY",
            "dayOfWeekDisplay": "Thứ Tư",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "c6b9dc47-b117-474d-8dda-8adf72178a88",
            "dayOfWeek": "THURSDAY",
            "dayOfWeekDisplay": "Thứ Năm",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "c92cc1a3-bf8f-4932-9224-4b48b57e365e",
            "dayOfWeek": "FRIDAY",
            "dayOfWeekDisplay": "Thứ Sáu",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "63d573ae-a902-478e-8f19-c14958d53b95",
            "dayOfWeek": "SATURDAY",
            "dayOfWeekDisplay": "Thứ Bảy",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "59de4512-007e-4306-bc4c-c1f0177ff030",
            "dayOfWeek": "SUNDAY",
            "dayOfWeekDisplay": "Chủ Nhật",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": false,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        }
    ]
}
```

---

### 2. Cài đặt khung giờ làm việc cho một ngày

**POST** `/`

**Authorization:** `ROLE_ADMIN`, `ROLE_EMPLOYEE`

**Request Body:**
```json
{
  "employeeId": "e1000001-0000-0000-0000-000000000001",
  "dayOfWeek": "MONDAY",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "isWorkingDay": true,
  "breakStartTime": "12:00:00",
  "breakEndTime": "13:00:00"
}
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Cập nhật khung giờ làm việc thành công",
  "data": {
    "workingHoursId": "uuid-new",
    "dayOfWeek": "MONDAY",
    "dayOfWeekDisplay": "Thứ Hai",
    "startTime": "09:00:00",
    "endTime": "17:00:00",
    "isWorkingDay": true,
    "breakStartTime": "12:00:00",
    "breakEndTime": "13:00:00"
  }
}
```

---

### 3. Cài đặt khung giờ làm việc cho cả tuần

**POST** `/weekly`

**Authorization:** `ROLE_ADMIN`, `ROLE_EMPLOYEE`

**Request Body:**
```json
{
  "employeeId": "e1000001-0000-0000-0000-000000000001",
  "weeklySchedule": [
    {
      "dayOfWeek": "MONDAY",
      "startTime": "08:00:00",
      "endTime": "18:00:00",
      "isWorkingDay": true,
      "breakStartTime": "12:00:00",
      "breakEndTime": "13:00:00"
    },
    {
      "dayOfWeek": "TUESDAY",
      "startTime": "08:00:00",
      "endTime": "18:00:00",
      "isWorkingDay": true,
      "breakStartTime": "12:00:00",
      "breakEndTime": "13:00:00"
    },
    {
      "dayOfWeek": "SUNDAY",
      "startTime": null,
      "endTime": null,
      "isWorkingDay": false,
      "breakStartTime": null,
      "breakEndTime": null
    }
  ]
}
```

---

### 4. Khởi tạo khung giờ làm việc mặc định

**POST** `/{employeeId}/initialize`

**Authorization:** `ROLE_ADMIN`, `ROLE_EMPLOYEE`

**Mô tả:** Tạo khung giờ làm việc mặc định cho nhân viên (Thứ 2 - Thứ 7: 8:00-18:00, nghỉ trưa 12:00-13:00, Chủ nhật nghỉ)

**Response Success (200 OK):**
```json
{
    "success": true,
    "message": "Khởi tạo khung giờ làm việc mặc định thành công",
    "data": [
        {
            "workingHoursId": "0cebf574-e8f3-4d1f-9ecb-61b3b4223392",
            "dayOfWeek": "MONDAY",
            "dayOfWeekDisplay": "Thứ Hai",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "83dce962-a99f-4cdf-b749-9e73ac46b1e4",
            "dayOfWeek": "TUESDAY",
            "dayOfWeekDisplay": "Thứ Ba",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "d237b806-a7f0-4b15-acd8-ffb0b9907f9b",
            "dayOfWeek": "WEDNESDAY",
            "dayOfWeekDisplay": "Thứ Tư",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "c6b9dc47-b117-474d-8dda-8adf72178a88",
            "dayOfWeek": "THURSDAY",
            "dayOfWeekDisplay": "Thứ Năm",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "c92cc1a3-bf8f-4932-9224-4b48b57e365e",
            "dayOfWeek": "FRIDAY",
            "dayOfWeekDisplay": "Thứ Sáu",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "63d573ae-a902-478e-8f19-c14958d53b95",
            "dayOfWeek": "SATURDAY",
            "dayOfWeekDisplay": "Thứ Bảy",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": true,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        },
        {
            "workingHoursId": "59de4512-007e-4306-bc4c-c1f0177ff030",
            "dayOfWeek": "SUNDAY",
            "dayOfWeekDisplay": "Chủ Nhật",
            "startTime": "08:00:00",
            "endTime": "18:00:00",
            "isWorkingDay": false,
            "breakStartTime": "12:00:00",
            "breakEndTime": "13:00:00"
        }
    ]
}
```

---

### 5. Sao chép khung giờ làm việc từ ngày này sang ngày khác

**POST** `/{employeeId}/copy?sourceDay=MONDAY&targetDay=TUESDAY`

**Authorization:** `ROLE_ADMIN`, `ROLE_EMPLOYEE`

---

## II. Available Slots API

### Base URL: `/api/v1/available-slots`

### 1. Lấy danh sách slot khả dụng theo ngày

**GET** `/`

**Authorization:** `ROLE_ADMIN`, `ROLE_CUSTOMER`, `ROLE_EMPLOYEE`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| date | LocalDate | Yes | - | Ngày cần tìm slot (format: YYYY-MM-DD) |
| ward | String | No | - | Tên phường/xã |
| city | String | No | - | Tên thành phố |
| serviceId | Integer | No | - | ID dịch vụ (để lấy thời lượng) |
| durationMinutes | Integer | No | - | Thời lượng slot (phút) - dùng nếu không có serviceId |
| slotIntervalMinutes | Integer | No | 30 | Khoảng cách giữa các slot (phút) |

**Example Request:**
```
GET /api/v1/available-slots?date=2025-12-01&city=Hồ Chí Minh&ward=Tây Thạnh&serviceId=1&slotIntervalMinutes=30
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Tìm thấy 15 slot khả dụng với 3 nhân viên",
  "data": {
    "date": "2025-12-01",
    "dayOfWeek": "Thứ Hai",
    "totalSlots": 15,
    "totalAvailableEmployees": 3,
    "slots": [
      {
        "startTime": "2025-12-01T08:00:00",
        "endTime": "2025-12-01T10:00:00",
        "durationMinutes": 120,
        "availableEmployeeCount": 2,
        "availableEmployees": [
          {
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "fullName": "Jane Smith",
            "avatar": "https://example.com/avatar.jpg",
            "rating": "4.50",
            "skills": ["Dọn dẹp", "Giặt ủi"]
          },
          {
            "employeeId": "e1000001-0000-0000-0000-000000000002",
            "fullName": "Bob Wilson",
            "avatar": null,
            "rating": "4.80",
            "skills": ["Dọn dẹp", "Nấu ăn"]
          }
        ]
      },
      {
        "startTime": "2025-12-01T08:30:00",
        "endTime": "2025-12-01T10:30:00",
        "durationMinutes": 120,
        "availableEmployeeCount": 2,
        "availableEmployees": [
          {
            "employeeId": "e1000001-0000-0000-0000-000000000003",
            "fullName": "Trần Văn Long",
            "avatar": "https://i.pravatar.cc/150?img=33",
            "rating": "4.06",
            "skills": [
                "Vệ sinh tổng quát",
                "Lau dọn"
            ]
          }
        ]
      }
    ]
  }
}
```

---

### 2. Lấy slot khả dụng cho khoảng thời gian (nhiều ngày)

**GET** `/range`

**Authorization:** `ROLE_ADMIN`, `ROLE_CUSTOMER`, `ROLE_EMPLOYEE`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | LocalDate | Yes | Ngày bắt đầu |
| endDate | LocalDate | Yes | Ngày kết thúc (tối đa 30 ngày) |
| ward | String | No | Tên phường/xã |
| city | String | No | Tên thành phố |
| serviceId | Integer | No | ID dịch vụ |
| durationMinutes | Integer | No | Thời lượng slot (phút) |
| slotIntervalMinutes | Integer | No | Khoảng cách giữa các slot |

**Example Request:**
```
GET /api/v1/available-slots/range?startDate=2025-12-01&endDate=2025-12-04&ward=Bình Dương&serviceId=1
```

**Response Success (200 OK):**
```json
{
    "success": true,
    "message": "Tìm thấy slot khả dụng cho 4 ngày",
    "data": [
        {
            "date": "2025-12-01",
            "dayOfWeek": "Thứ Hai",
            "totalSlots": 13,
            "totalAvailableEmployees": 1,
            "slots": [
                {
                    "startTime": "2025-12-01T22:00:00",
                    "endTime": "2025-12-01T00:00:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T22:30:00",
                    "endTime": "2025-12-01T00:30:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T23:00:00",
                    "endTime": "2025-12-01T01:00:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T23:30:00",
                    "endTime": "2025-12-01T01:30:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T07:00:00",
                    "endTime": "2025-12-01T09:00:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T07:30:00",
                    "endTime": "2025-12-01T09:30:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T08:00:00",
                    "endTime": "2025-12-01T10:00:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T08:30:00",
                    "endTime": "2025-12-01T10:30:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T09:00:00",
                    "endTime": "2025-12-01T11:00:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T09:30:00",
                    "endTime": "2025-12-01T11:30:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T12:00:00",
                    "endTime": "2025-12-01T14:00:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T12:30:00",
                    "endTime": "2025-12-01T14:30:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                },
                {
                    "startTime": "2025-12-01T13:00:00",
                    "endTime": "2025-12-01T15:00:00",
                    "durationMinutes": 120,
                    "availableEmployeeCount": 1,
                    "availableEmployees": [
                        {
                            "employeeId": "e1000001-0000-0000-0000-000000000003",
                            "fullName": "Trần Văn Long",
                            "avatar": "https://i.pravatar.cc/150?img=33",
                            "rating": "4.06",
                            "skills": [
                                "Vệ sinh tổng quát",
                                "Lau dọn"
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
```

---

### 3. Kiểm tra một slot cụ thể có khả dụng không

**GET** `/check`

**Authorization:** `ROLE_ADMIN`, `ROLE_CUSTOMER`, `ROLE_EMPLOYEE`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| startTime | LocalDateTime | Yes | - | Thời gian bắt đầu |
| endTime | LocalDateTime | Yes | - | Thời gian kết thúc |
| ward | String | No | - | Tên phường/xã |
| city | String | No | - | Tên thành phố |
| minEmployees | Integer | No | 1 | Số nhân viên tối thiểu cần có |

**Example Request:**
```
GET /api/v1/available-slots/check?startTime=2025-12-01T09:00:00&endTime=2025-12-01T11:00:00&city=Hồ Chí Minh&minEmployees=2
```

**Response Success (200 OK):**
```json
{
  "success": true,
  "message": "Slot khả dụng",
  "data": true
}
```

---

## III. Logic xử lý

### 1. Kiểm tra xung đột

Khi tính toán slot khả dụng, hệ thống kiểm tra:

1. **Unavailability**: Nhân viên đã đăng ký nghỉ
2. **Assignment Conflicts**: Nhân viên đã có đơn khác trong khung giờ
3. **Working Hours**: Slot phải nằm trong khung giờ làm việc của nhân viên
4. **Break Time**: Slot không được trùng với giờ nghỉ trưa

### 2. Thời gian di chuyển (Travel Time Buffer)

- Mỗi assignment được thêm buffer 30 phút trước và sau
- Nhân viên không thể nhận assignment mới nếu chỉ còn < 30 phút so với assignment trước/sau
- Điều này đảm bảo nhân viên có đủ thời gian di chuyển giữa các địa điểm

### 3. Ưu tiên nhân viên

Khi tìm nhân viên phù hợp (`findSuitableEmployees`):
1. Ưu tiên nhân viên đã từng phục vụ khách hàng
2. Kiểm tra đầy đủ: unavailability, assignment conflicts, working hours
3. Áp dụng ML recommendation để sắp xếp

---

### Default Values

Khi khởi tạo, mỗi nhân viên sẽ có:
- Thứ 2 - Thứ 7: Làm việc 08:00 - 18:00, nghỉ trưa 12:00 - 13:00
- Chủ nhật: Nghỉ

---

## IV. Error Responses

### Common Errors

```json
{
  "success": false,
  "message": "Không tìm thấy nhân viên",
  "data": null
}
```

```json
{
  "success": false,
  "message": "Ngày tìm kiếm không thể ở quá khứ",
  "data": null
}
```

```json
{
  "success": false,
  "message": "Thời lượng dịch vụ không hợp lệ",
  "data": null
}
```

```json
{
  "success": false,
  "message": "Giờ kết thúc phải sau giờ bắt đầu",
  "data": null
}
```
