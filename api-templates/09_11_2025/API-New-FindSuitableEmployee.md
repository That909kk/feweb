# GET api/v1/customer/services/employee/suitable?serviceId=1&bookingTime=2025-12-05T10:00:00&ward=Phường Thủ Dầu Một&city=TP. Hồ Chí Minh

## ROLE_ADMIN || ROLE_CUSTOMER
## Header: Bearer <token>

### OUTPUT:
```json
{
    "success": true,
    "message": "Tìm thấy 3 nhân viên phù hợp cho dịch vụ Dọn dẹp theo giờ | Sắp xếp theo mô hình ML employee-rec-v1",
    "data": [
        {
            "employeeId": "e1000001-0000-0000-0000-000000000033",
            "fullName": "Đặng Thị Bé",
            "avatar": "https://i.pravatar.cc/150?img=25",
            "skills": [
                "Nấu ăn",
                "Đi chợ"
            ],
            "rating": "4.10/5 · Tốt",
            "status": "AVAILABLE",
            "workingWards": [
                "Phường Thủ Dầu Một"
            ],
            "workingCity": "Thành phố Hồ Chí Minh",
            "completedJobs": 20,
            "recommendation": {
                "score": 0.707,
                "modelVersion": "employee-rec-v1",
                "featureSignals": {
                    "rating": 0.4,
                    "completedJobs": 0.46211715726000974,
                    "locationAffinity": 1.0,
                    "skillVersatility": 0.25,
                    "bookingTimeFit": 0.7
                }
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
            "rating": "4.10/5 · Tốt",
            "status": "AVAILABLE",
            "workingWards": [
                "Phường Thủ Dầu Một"
            ],
            "workingCity": "Thành phố Hồ Chí Minh",
            "completedJobs": 15,
            "recommendation": {
                "score": 0.703,
                "modelVersion": "employee-rec-v1",
                "featureSignals": {
                    "rating": 0.4,
                    "completedJobs": 0.35835739835078595,
                    "locationAffinity": 1.0,
                    "skillVersatility": 0.25,
                    "bookingTimeFit": 0.7
                }
            }
        },
        {
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "fullName": "Jane Smith",
            "avatar": "https://picsum.photos/200",
            "skills": [
                "Cleaning",
                "Organizing"
            ],
            "rating": "4.24/5 · Tốt",
            "status": "AVAILABLE",
            "workingWards": [
                "Phường Thủ Dầu Một"
            ],
            "workingCity": "Thành phố Hồ Chí Minh",
            "completedJobs": 14,
            "recommendation": {
                "score": 0.702,
                "modelVersion": "employee-rec-v1",
                "featureSignals": {
                    "rating": 0.4,
                    "completedJobs": 0.3363755443363322,
                    "locationAffinity": 1.0,
                    "skillVersatility": 0.25,
                    "bookingTimeFit": 0.7
                }
            }
        }
    ]
}
```