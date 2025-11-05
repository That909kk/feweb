import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// API Base Configuration - Load from .env
console.log('[DEBUG] import.meta.env:', import.meta.env);
console.log('[DEBUG] VITE_API_BASE_URL value:', import.meta.env.VITE_API_BASE_URL);
console.log('[DEBUG] VITE_API_BASE_URL type:', typeof import.meta.env.VITE_API_BASE_URL);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.80.113:8080/api/v1';
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://192.168.80.113:8080/ws';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('[API Config] ⚠️ VITE_API_BASE_URL not found in .env, using fallback:', API_BASE_URL);
  console.warn('[API Config] ℹ️ Make sure .env file exists at:', window.location.origin);
}

console.log(`[API Config] ✅ Using API URL: ${API_BASE_URL}`);
console.log(`[API Config] ✅ Using WS URL: ${WS_BASE_URL}`);

// Export base URLs for use in other modules
export { API_BASE_URL, WS_BASE_URL };

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Standard API Response Type
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// Request interceptor to add auth header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log API requests in development
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`[API] Full request URL: ${fullUrl}`);
    console.log(`[API] Method: ${config.method?.toUpperCase()}`);
    if (config.params) {
      console.log(`[API] Request params:`, config.params);
    }
    if (config.data) {
      console.log(`[API] Request data:`, config.data);
    }
    
    // Public endpoints that don't need authentication
    const publicEndpoints = ['/auth/register', '/auth/login', '/auth/get-role'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn(`[API] No access token found for request to ${config.url}`);
      }
    } else {
      console.log(`[API] Public endpoint, no token required: ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common error cases
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config;
    
    // Xử lý lỗi 401 (Unauthorized) - Token expired
    if (error.response?.status === 401 && originalRequest) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Nếu có refresh token, thử refresh
      if (refreshToken && !originalRequest.url?.includes('auth/refresh-token')) {
        try {
          const response = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token', {
            refreshToken
          });
          
          if (response.data.success) {
            // Cập nhật token mới
            const newToken = response.data.data.accessToken;
            localStorage.setItem('accessToken', newToken);
            
            // Gắn token mới vào request và thử lại
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return axios(originalRequest);
          }
        } catch (refreshError) {
          // Nếu refresh token cũng hết hạn, logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('selectedRole');
          localStorage.removeItem('expireIn');
          localStorage.removeItem('deviceType');
          localStorage.removeItem('adminProfileId');
          localStorage.removeItem('customerId');
          localStorage.removeItem('employeeId');
          window.location.href = '/auth?session=expired';
          return Promise.reject(refreshError);
        }
      }
      
      // Không thể refresh, chuyển về trang login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedRole');
      localStorage.removeItem('expireIn');
      localStorage.removeItem('deviceType');
      localStorage.removeItem('adminProfileId');
      localStorage.removeItem('customerId');
      localStorage.removeItem('employeeId');
      window.location.href = '/auth?reason=session-expired';
    }
    
    // Handle other error cases
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 400:
          // Bad Request - validation errors, missing Authorization header
          if (data?.message?.includes('Authorization header is required')) {
            // Token missing or invalid - logout user
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('selectedRole');
            window.location.href = '/auth';
          }
          console.error('Validation error:', error.response.data.message);
          break;
          
        case 403:
          // Forbidden - access denied, wrong role
          console.error('Access denied:', data?.message || 'You can only access your own data.');
          break;
          
        case 500:
          // Server error
          console.error('Server error:', data?.message || 'Something went wrong.');
          break;
          
        default:
          console.error('API Error:', error.message);
      }
    } else if (error.request) {
      console.error('Network error:', error.message);
    } else {
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;