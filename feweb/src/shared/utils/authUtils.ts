/**
 * Auth Utility Functions
 * Helper functions for authentication and user data
 */

/**
 * Get current user's accountId from localStorage
 * Used for chat feature as senderId
 * @returns accountId string or null if not logged in
 */
export const getAccountId = (): string | null => {
  return localStorage.getItem('accountId');
};

/**
 * Get current user's customerId from localStorage
 * @returns customerId string or null if not a customer or not logged in
 */
export const getCustomerId = (): string | null => {
  return localStorage.getItem('customerId');
};

/**
 * Get current user's employeeId from localStorage
 * @returns employeeId string or null if not an employee or not logged in
 */
export const getEmployeeId = (): string | null => {
  return localStorage.getItem('employeeId');
};

/**
 * Get current user's adminProfileId from localStorage
 * @returns adminProfileId string or null if not an admin or not logged in
 */
export const getAdminProfileId = (): string | null => {
  return localStorage.getItem('adminProfileId');
};

/**
 * Get current user's selected role from localStorage
 * @returns role string or null if not logged in
 */
export const getSelectedRole = (): string | null => {
  return localStorage.getItem('selectedRole');
};

/**
 * Get current user's access token from localStorage
 * @returns access token string or null if not logged in
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Check if user is currently logged in
 * @returns true if user has valid access token
 */
export const isUserLoggedIn = (): boolean => {
  return !!getAccessToken();
};

/**
 * Get current user info from localStorage
 * @returns parsed user object or null if not logged in
 */
export const getCurrentUser = (): any | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};
