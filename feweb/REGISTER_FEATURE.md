# Chức năng Đăng ký Tài khoản

## Tổng quan
Chức năng đăng ký tài khoản cho phép người dùng tạo tài khoản mới trong hệ thống dịch vụ giúp việc gia đình với đầy đủ validation và xử lý lỗi.

## API đã sử dụng
- **POST /api/v1/auth/register** - Tạo tài khoản mới

## Cấu trúc Files

### 1. API Types (`src/types/api.ts`)
```typescript
// Request interface cho đăng ký
export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
}

// Response interface từ API
export interface RegisterResponse extends ApiResponse {
  data: {
    username: string;
    email: string;
    role: UserRole;
  };
}
```

### 2. API Service (`src/api/auth.ts`)
```typescript
// Hàm gọi API đăng ký
export const registerApi = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register', data);
  return response.data;
};
```

### 3. Custom Hook (`src/hooks/useRegister.ts`)
Hook tùy chỉnh để xử lý logic đăng ký:
- Loading state management
- Error handling  
- API call wrapper

### 4. Static Data (`src/static-data/pages/register.json`)
Chứa tất cả text, labels, messages để tránh hard-code:
- Form labels và placeholders
- Validation error messages
- Success/Error messages
- Hỗ trợ đa ngôn ngữ (VI/EN)

### 5. Main Component (`src/pages/RegisterPage.tsx`)
Component chính với các tính năng:
- Form validation real-time
- Password confirmation
- Field-level validation
- API error handling
- Success notification
- Navigation sau khi đăng ký thành công

### 6. Notification Component (`src/shared/components/Notification.tsx`)
Component tái sử dụng để hiển thị thông báo với các loại:
- Success
- Error
- Warning  
- Info

## Tính năng chính

### 1. Form Validation
- **Username**: 3-50 ký tự, chỉ chữ cái, số và dấu gạch dưới
- **Password**: Tối thiểu 6 ký tự
- **Confirm Password**: Phải khớp với password
- **Full Name**: Chỉ chữ cái và khoảng trắng, tối đa 100 ký tự
- **Email**: Định dạng email hợp lệ, tối đa 255 ký tự
- **Phone**: Định dạng +84xxxxxxxxx hoặc 0xxxxxxxxx
- **Role**: CUSTOMER, EMPLOYEE, ADMIN

### 2. Real-time Validation
- Validation khi user blur khỏi field
- Real-time validation cho password confirmation
- Clear error khi user bắt đầu nhập lại

### 3. API Error Handling
- Xử lý lỗi validation từ server
- Hiển thị lỗi specific cho từng field
- Hiển thị lỗi chung từ API

### 4. Success Flow
- Hiển thị thông báo thành công
- Tự động chuyển về trang đăng nhập sau 2 giây
- Truyền state để highlight login tab

## Routing
- **Public route**: `/register`
- **Navigation links**:
  - LandingPage → Register button
  - AuthPage → "Đăng ký" link
  - RegisterPage → "Đã có tài khoản? Đăng nhập" link

## Usage Examples

### 1. Truy cập từ Landing Page
```typescript
<Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
  Đăng ký
</Link>
```

### 2. Sử dụng useRegister hook
```typescript
const { register, loading, error, clearError } = useRegister();

const handleSubmit = async (formData: RegisterRequest) => {
  try {
    const response = await register(formData);
    if (response.success) {
      // Handle success
      navigate('/auth');
    }
  } catch (error) {
    // Error handled by hook
  }
};
```

### 3. Validation example
```typescript
const validateField = (name: string, value: string): string => {
  switch (name) {
    case 'username':
      if (!value) return 'Tên đăng nhập không được để trống';
      if (value.length < 3) return 'Tên đăng nhập phải có từ 3 đến 50 ký tự';
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
      break;
    // ... other validations
  }
  return '';
};
```

## Error Handling

### 1. Validation Errors (Client-side)
- Real-time validation với regex patterns
- Custom error messages từ static data
- Visual feedback với border colors

### 2. API Errors (Server-side)  
```typescript
// Field-specific error từ server
if (error.response?.data?.field && error.response?.data?.message) {
  setErrors({ [error.response.data.field]: error.response.data.message });
}

// General API error
else {
  setApiError(error.response?.data?.message || 'Đăng ký thất bại');
}
```

### 3. Network Errors
- Hook tự động xử lý network errors
- Fallback message khi không có response từ server

## Testing

### Manual Testing Checklist
- [ ] Tất cả validation rules hoạt động
- [ ] Real-time validation cho password confirmation  
- [ ] API call thành công với data hợp lệ
- [ ] Error handling cho các trường hợp API lỗi
- [ ] Navigation flow hoạt động đúng
- [ ] Loading states hiển thị chính xác
- [ ] Success/Error notifications hiển thị
- [ ] Responsive design trên mobile

### Test Cases từ API Documentation
Tham khảo file `api-templates/Authentication/API-TestCases-Register.md` để có đầy đủ test cases:
- Successful registration cho từng role
- Validation failures
- Duplicate username/email errors  
- Invalid input format errors

## Notes
- Component tuân thủ design system với Tailwind CSS
- Hỗ trợ responsive design
- Accessibility với proper labels và ARIA attributes
- Security: Password không được expose trong logs
- Internationalization ready với static data structure