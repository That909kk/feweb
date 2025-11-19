# Enhancement: Find Suitable Employee with Customer History

**Date**: November 11, 2025  
**Feature**: Ưu tiên nhân viên đã từng phục vụ customer trong danh sách tìm kiếm nhân viên phù hợp

## Tổng quan

Cải tiến endpoint `findSuitableEmployee` để:
1. Phân loại nhân viên thành 2 nhóm: **đã từng phục vụ customer** và **chưa từng phục vụ**
2. Áp dụng **machine learning** để xếp hạng **cả hai nhóm riêng biệt**
3. Trả về danh sách với **nhóm đã từng phục vụ ở trên cùng**, sau đó mới đến nhóm mới

## API Response Example

### Case 1: Customer có nhân viên đã từng phục vụ

**Request:**
```http
GET /api/v1/customer/services/employee/suitable?serviceId=1&bookingTime=2025-11-20T14:00:00&ward=Phường Thủ Dầu Một&city=TP. Hồ Chí Minh
Authorization: Bearer <nguyenvana_token>
```

**Response:**
```json
{
    "success": true,
    "message": "Tìm thấy 3 nhân viên phù hợp cho dịch vụ Dọn dẹp theo giờ (2 đã từng phục vụ bạn, 1 nhân viên khác - áp dụng machine learning) | Sắp xếp theo mô hình ML employee-rec-v1",
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
            "hasWorkedWithCustomer": true,
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
            "hasWorkedWithCustomer": false,
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
            "hasWorkedWithCustomer": true,
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

## Notes

- Query chỉ tính các booking có status = `COMPLETED` (không tính CANCELLED, PENDING, etc.)
- Field `hasWorkedWithCustomer` là `Boolean` (có thể null nếu không có customer context)
- ML ranking vẫn áp dụng cho cả 2 nhóm, nhưng riêng biệt
- Thứ tự trong mỗi nhóm được quyết định bởi ML score