# GET api/v1/customer/services/employee/suitable?serviceId=1&bookingTime=2025-11-15T09:00:00&ward=Phường Thủ Dầu Một&city=TP. Hồ Chí Minh&customerId={{customerId}}&bookingTimes=2025-11-15T09:00:00&bookingTimes=2025-11-16T09:00:00&bookingTimes=2025-11-17T09:00:00

## ROLE_ADMIN || ROLE_CUSTOMER
## Header: Bearer <token>

### OUTPUT
```json
{
    "success": true,
    "message": "Tìm thấy 2 nhân viên phù hợp cho dịch vụ Dọn dẹp theo giờ (1 đã từng phục vụ bạn, 1 nhân viên khác)",
    "data": [
        {
            "employeeId": "e1000001-0000-0000-0000-000000000033",
            "fullName": "Đặng Thị Bé",
            "avatar": "https://i.pravatar.cc/150?img=25",
            "skills": [
                "Nấu ăn",
                "Đi chợ"
            ],
            "rating": "4.10",
            "status": "AVAILABLE",
            "workingWards": [
                "Phường Thủ Dầu Một"
            ],
            "workingCity": "Thành phố Hồ Chí Minh",
            "completedJobs": 20,
            "hasWorkedWithCustomer": true,
            "recommendation": {
                "score": 0.706
            }
        },
        {
            "employeeId": "e1000001-0000-0000-0000-000000000017",
            "fullName": "Nguyễn Văn Ba",
            "avatar": "https://i.pravatar.cc/150?img=51",
            "skills": [
                "Vệ sinh nhà cửa",
                "Lau dọn"
            ],
            "rating": "4.10",
            "status": "AVAILABLE",
            "workingWards": [
                "Phường Thủ Dầu Một"
            ],
            "workingCity": "Thành phố Hồ Chí Minh",
            "completedJobs": 15,
            "hasWorkedWithCustomer": false,
            "recommendation": {
                "score": 0.702
            }
        }
    ]
}
```

## Note:
bookingTime và bookingTimes optional
- Khi truyền vào bookingTime thì bookingTimes có thể null
- Khi truyền vào bookingTimes thì bookingTime có thể không truyền
- customerId là customerId của người đăng nhập