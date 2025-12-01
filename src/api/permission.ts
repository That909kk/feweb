import { api, type ApiResponse } from './client';

/**
 * Permission API Service
 * Base URL: /api/v1/admin/permissions
 */

export interface Role {
  roleId: number;
  roleName: string;
}

export interface Feature {
  featureId: number;
  featureName: string;
  description?: string;
  module: string;
}

export interface RolePermissions {
  roleId: number;
  roleName: string;
  features: Feature[];
}

// Get all manageable roles (non-admin)
export const getRolesApi = async (): Promise<ApiResponse<Role[]>> => {
  const response = await api.get<ApiResponse<Role[]>>('/admin/permissions/roles');
  return response.data;
};

// Get all features
export const getFeaturesApi = async (): Promise<ApiResponse<Feature[]>> => {
  const response = await api.get<ApiResponse<Feature[]>>('/admin/permissions/features');
  return response.data;
};

// Get permissions for a specific role
export const getRolePermissionsApi = async (roleId: number): Promise<ApiResponse<RolePermissions>> => {
  const response = await api.get<ApiResponse<RolePermissions>>(`/admin/permissions/roles/${roleId}`);
  return response.data;
};

// Update permissions for a role
export const updateRolePermissionsApi = async (
  roleId: number,
  featureIds: number[]
): Promise<ApiResponse<RolePermissions>> => {
  const response = await api.put<ApiResponse<RolePermissions>>(
    `/admin/permissions/roles/${roleId}`,
    { featureIds }
  );
  return response.data;
};
