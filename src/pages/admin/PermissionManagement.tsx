import React, { useEffect, useState } from 'react';
import { Shield, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { MetricCard, SectionCard } from '../../shared/components';
import {
  getRolesApi,
  getFeaturesApi,
  getRolePermissionsApi,
  updateRolePermissionsApi,
  type Role,
  type Feature,
  type RolePermissions
} from '../../api/permission';

const PermissionManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRolesAndFeatures();
  }, []);

  const loadRolesAndFeatures = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rolesRes, featuresRes] = await Promise.all([
        getRolesApi(),
        getFeaturesApi()
      ]);

      if (rolesRes.success) {
        setRoles(rolesRes.data);
        if (rolesRes.data.length > 0) {
          // Auto-select first role
          setSelectedRole(rolesRes.data[0].roleId);
        }
      }

      if (featuresRes.success) {
        setFeatures(featuresRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load roles and features:', err);
      setError('Không thể tải dữ liệu phân quyền');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRole !== null) {
      loadRolePermissions(selectedRole);
    }
  }, [selectedRole]);

  const loadRolePermissions = async (roleId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getRolePermissionsApi(roleId);
      if (response.success) {
        setRolePermissions(response.data);
        setSelectedFeatures(new Set(response.data.features.map(f => f.featureId)));
      }
    } catch (err: any) {
      console.error('Failed to load role permissions:', err);
      setError('Không thể tải quyền của vai trò');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFeature = (featureId: number) => {
    const newSelected = new Set(selectedFeatures);
    if (newSelected.has(featureId)) {
      newSelected.delete(featureId);
    } else {
      newSelected.add(featureId);
    }
    setSelectedFeatures(newSelected);
  };

  const handleSavePermissions = async () => {
    if (selectedRole === null) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await updateRolePermissionsApi(
        selectedRole,
        Array.from(selectedFeatures)
      );

      if (response.success) {
        setSuccess('Cập nhật quyền thành công!');
        setRolePermissions(response.data);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to update permissions:', err);
      setError('Không thể cập nhật quyền. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  // Group features by module
  const featuresByModule = features.reduce((acc, feature) => {
    if (!acc[feature.module]) {
      acc[feature.module] = [];
    }
    acc[feature.module].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  const metrics = {
    totalRoles: roles.length,
    totalFeatures: features.length,
    selectedPermissions: selectedFeatures.size
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title="Quản lý phân quyền"
      description="Cấu hình quyền truy cập cho từng vai trò trong hệ thống"
    >
      {/* Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <MetricCard
          icon={Shield}
          label="Tổng vai trò"
          value={`${metrics.totalRoles}`}
          accent="navy"
          trendLabel="Vai trò có thể quản lý"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Tổng tính năng"
          value={`${metrics.totalFeatures}`}
          accent="teal"
          trendLabel="Tính năng trong hệ thống"
        />
        <MetricCard
          icon={Shield}
          label="Quyền đã chọn"
          value={`${metrics.selectedPermissions}`}
          accent="amber"
          trendLabel="Quyền được cấp cho vai trò"
        />
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          {success}
        </div>
      )}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Role Selection */}
          <div className="lg:col-span-3">
            <SectionCard
              title="Vai trò"
              description="Chọn vai trò để cấu hình"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {roles.map(role => (
                    <button
                      key={role.roleId}
                      onClick={() => setSelectedRole(role.roleId)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left font-semibold transition ${
                        selectedRole === role.roleId
                          ? 'border-brand-teal/60 bg-brand-teal/10 text-brand-teal'
                          : 'border-brand-outline/40 bg-white text-brand-text hover:border-brand-outline'
                      }`}
                    >
                      {role.roleName}
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Permissions */}
          <div className="lg:col-span-9">
            <SectionCard
              title={rolePermissions ? `Quyền của ${rolePermissions.roleName}` : 'Quyền của vai trò'}
              description="Chọn các tính năng mà vai trò này có thể truy cập"
              actions={
                <button
                  onClick={handleSavePermissions}
                  disabled={isSaving || selectedRole === null}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              }
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(featuresByModule).map(([module, moduleFeatures]) => (
                    <div key={module} className="rounded-2xl border border-brand-outline/40 bg-brand-background/50 p-5">
                      <h3 className="mb-4 text-base font-semibold text-brand-navy">
                        {module}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {moduleFeatures.map(feature => (
                          <label
                            key={feature.featureId}
                            className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-outline/40 bg-white p-4 transition hover:border-brand-teal/60 hover:shadow-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFeatures.has(feature.featureId)}
                              onChange={() => handleToggleFeature(feature.featureId)}
                              className="mt-1 h-4 w-4 rounded border-brand-outline text-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-brand-navy">
                                {feature.featureName}
                              </div>
                              {feature.description && (
                                <div className="mt-1 text-xs text-brand-text/70">
                                  {feature.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default PermissionManagement;
