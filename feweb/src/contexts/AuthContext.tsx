import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  getRoleApi, 
  loginApi, 
  logoutApi,
  validateTokenApi,
  getActiveSessionsApi
} from '../api/auth';
import type { 
  UserRole, 
  DeviceType, 
  CustomerData, 
  EmployeeData, 
  AdminData,
  ActiveSessionsResponse
} from '../types/api';

interface AuthUser {
  id: string; // Role-specific ID (customerId/employeeId/adminId)
  accountId: string; // Account ID (dùng cho chat và các tính năng chung)
  customerId?: string; // For CUSTOMER role
  employeeId?: string; // For EMPLOYEE role
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  avatar?: string;
  role: UserRole; // Specific role user logged in with
  roles: UserRole[]; // All available roles for this user
  profileData?: CustomerData | EmployeeData | AdminData;
}

interface AuthContextType {
  user: AuthUser | null;
  selectedRole: UserRole | null;
  availableRoles: UserRole[] | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  activeSessions: ActiveSessionsResponse['data'] | null;
  
  // Step 1: Get roles
  getRoles: (username: string, password: string) => Promise<UserRole[]>;
  
  // Step 2: Login with role
  login: (username: string, password: string, role: UserRole) => Promise<boolean>;
  
  selectRole: (role: UserRole) => void;
  logout: (deviceType?: DeviceType) => Promise<boolean>;
  validateToken: () => Promise<boolean>;
  getActiveSessions: () => Promise<ActiveSessionsResponse['data'] | null>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<UserRole[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionsResponse['data'] | null>(null);

  // Load auth data from localStorage on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('selectedRole');
      const storedToken = localStorage.getItem('accessToken');
      
      if (storedUser && storedRole && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Validate token before restoring session
          if (mounted) setIsLoading(true);
          const isTokenValid = await validateTokenSilently();
          
          if (isTokenValid && mounted) {
            setUser(userData);
            setSelectedRole(storedRole as UserRole);
            console.log('✅ Session restored successfully');
          } else if (mounted) {
            console.log('❌ Token invalid, clearing stored data');
            // Clear invalid data
            localStorage.removeItem('user');
            localStorage.removeItem('selectedRole');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('expireIn');
            localStorage.removeItem('deviceType');
            localStorage.removeItem('customerId');
            localStorage.removeItem('employeeId');
            localStorage.removeItem('adminProfileId');
          }
        } catch (error) {
          console.error('Error loading stored auth data:', error);
          // Clear corrupted data
          if (mounted) {
            localStorage.removeItem('user');
            localStorage.removeItem('selectedRole');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('expireIn');
            localStorage.removeItem('deviceType');
            localStorage.removeItem('customerId');
            localStorage.removeItem('employeeId');
            localStorage.removeItem('adminProfileId');
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
      if (mounted) {
        setIsInitialized(true);
      }
    };

    initializeAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Step 1: Get available roles
  const getRoles = async (username: string, password: string): Promise<UserRole[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`📋 [DEBUG] Getting roles for username: ${username}`);
      const response = await getRoleApi({ username, password });
      
      if (response.success) {
        // Extract active roles
        const activeRoles: UserRole[] = [];
        Object.entries(response.data).forEach(([role, status]) => {
          console.log(`📋 [DEBUG] Role ${role} status: ${status}`);
          if (status === 'ACTIVE') {
            activeRoles.push(role as UserRole);
          }
        });
        
        console.log(`📋 [DEBUG] Active roles found:`, activeRoles, `(roleNumbers: ${response.roleNumbers})`);
        setAvailableRoles(activeRoles);
        
        // Store credentials temporarily for login step
        if (activeRoles.length > 0) {
          localStorage.setItem('temp_username', username);
          localStorage.setItem('temp_password', password);
        }
        
        return activeRoles;
      } else {
        throw new Error(response.message || 'Không thể lấy thông tin vai trò');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || 'Không thể lấy thông tin vai trò';
      console.error('❌ Get roles error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Login with selected role
  const login = async (username: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get stored credentials if not provided
      const storedUsername = localStorage.getItem('temp_username');
      const storedPassword = localStorage.getItem('temp_password');
      
      const finalUsername = username || storedUsername || '';
      const finalPassword = password || storedPassword || '';
      
      if (!finalUsername || !finalPassword) {
        throw new Error('Thông tin đăng nhập không hợp lệ');
      }
      
      console.log(`🔐 [API] Login attempt for username: ${finalUsername}, role: ${role}, device: WEB`);
      
      const loginResponse = await loginApi({
        username: finalUsername,
        password: finalPassword,
        role,
        deviceType: 'WEB' as DeviceType
      });
      
      // Clear temporary credentials
      localStorage.removeItem('temp_username');
      localStorage.removeItem('temp_password');
      
      if (loginResponse.success && loginResponse.data) {
        const { accessToken, refreshToken, expireIn, data: profileData, role: userRole, deviceType } = loginResponse.data;
        
        console.log(`✅ [API] Login successful, role: ${userRole}, deviceType: ${deviceType}`);
        
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('expireIn', expireIn.toString());
        localStorage.setItem('deviceType', deviceType);
        localStorage.setItem('selectedRole', userRole);
        
        // Lưu accountId (chung cho tất cả role)
        if (profileData.accountId) {
          localStorage.setItem('accountId', profileData.accountId);
        }
        
        // Lưu ID theo role (adminProfileId/customerId/employeeId)
        if (userRole === 'ADMIN') {
          const adminData = profileData as AdminData;
          if (adminData.adminProfileId) {
            localStorage.setItem('adminProfileId', adminData.adminProfileId);
          }
        } else if (userRole === 'CUSTOMER') {
          const customerData = profileData as CustomerData;
          if (customerData.customerId) {
            localStorage.setItem('customerId', customerData.customerId);
          }
        } else if (userRole === 'EMPLOYEE') {
          const employeeData = profileData as EmployeeData;
          if (employeeData.employeeId) {
            localStorage.setItem('employeeId', employeeData.employeeId);
          }
        }
        
        // Create user object based on profile data
        const authUser: AuthUser = {
          id: getIdFromProfileData(profileData, userRole),
          accountId: profileData.accountId, // Lưu accountId cho chat và các tính năng chung
          customerId: userRole === 'CUSTOMER' ? (profileData as CustomerData).customerId : undefined,
          employeeId: userRole === 'EMPLOYEE' ? (profileData as EmployeeData).employeeId : undefined,
          username: profileData.username || username,
          email: getEmailFromProfileData(profileData, userRole),
          fullName: profileData.fullName || '',
          phoneNumber: profileData.phoneNumber || '',
          avatar: profileData.avatar || undefined,
          role: userRole, // Specific role user logged in with
          roles: [userRole], // Current login role
          profileData
        };
        
        setUser(authUser);
        setSelectedRole(role);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(authUser));
        localStorage.setItem('selectedRole', role);
        
        return true;
      } else {
        throw new Error(loginResponse.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || 'Đăng nhập thất bại';
      console.error('❌ Login error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const selectRole = (role: UserRole) => {
    if (user && user.roles.includes(role)) {
      setSelectedRole(role);
      localStorage.setItem('selectedRole', role);
    }
  };

  // Validate current token
  const validateToken = async (): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await validateTokenApi();
      return response.valid;
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to validate token';
      console.error('❌ Token validation error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Silent token validation (without loading state) for initialization
  const validateTokenSilently = async (): Promise<boolean> => {
    try {
      const response = await validateTokenApi();
      return response.valid;
    } catch (err: any) {
      console.error('❌ Silent token validation error:', err?.message || 'Failed to validate token');
      return false;
    }
  };

  // Get active sessions
  const getActiveSessions = async (): Promise<ActiveSessionsResponse['data'] | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getActiveSessionsApi();
      if (response.success) {
        setActiveSessions(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get active sessions');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to get active sessions';
      console.error('❌ Get active sessions error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (deviceType: DeviceType = 'WEB'): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await logoutApi(deviceType);
      
      // Clear local state and localStorage
      setUser(null);
      setSelectedRole(null);
      setAvailableRoles(null);
      setActiveSessions(null);
      
      // Clear all stored data
      localStorage.removeItem('user');
      localStorage.removeItem('selectedRole');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expireIn');
      localStorage.removeItem('deviceType');
      localStorage.removeItem('customerId');
      localStorage.removeItem('employeeId');
      localStorage.removeItem('adminProfileId');
      localStorage.removeItem('temp_username');
      localStorage.removeItem('temp_password');
      
      setIsLoading(false);
      return response.success;
    } catch (error: any) {
      console.error('Logout API error:', error);
      
      // Clear local state and localStorage regardless of API result
      setUser(null);
      setSelectedRole(null);
      setAvailableRoles(null);
      setActiveSessions(null);
      setError(null);
      
      // Clear all stored data
      localStorage.removeItem('user');
      localStorage.removeItem('selectedRole');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expireIn');
      localStorage.removeItem('deviceType');
      localStorage.removeItem('accountId');
      localStorage.removeItem('customerId');
      localStorage.removeItem('employeeId');
      localStorage.removeItem('adminProfileId');
      localStorage.removeItem('temp_username');
      localStorage.removeItem('temp_password');
      
      setIsLoading(false);
      return false;
    }
  };

  const isAuthenticated = !!user && !!selectedRole;

  const value: AuthContextType = {
    user,
    selectedRole,
    availableRoles,
    isLoading,
    isInitialized,
    error,
    activeSessions,
    getRoles,
    login,
    selectRole,
    logout,
    validateToken,
    getActiveSessions,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to extract ID from profile data based on role
const getIdFromProfileData = (
  profileData: any, 
  role: UserRole
): string => {
  switch (role) {
    case 'CUSTOMER':
      return profileData.customerId || '';
    case 'EMPLOYEE':
      return profileData.employeeId || '';
    case 'ADMIN':
      return profileData.adminId || '';
    default:
      return profileData.username || '';
  }
};

// Helper function to extract email from profile data based on role
const getEmailFromProfileData = (
  profileData: any, 
  role: UserRole
): string => {
  // For admin, email is in contactInfo field according to API response
  if (role === 'ADMIN') {
    return profileData.contactInfo || '';
  }
  
  // For customer and employee, email is in email field
  return profileData.email || '';
};