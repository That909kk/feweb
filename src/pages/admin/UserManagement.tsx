import React from 'react';
import { Users, UserCog, Shield, Activity } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { MetricCard, SectionCard } from '../../shared/components';

const AdminUserManagement: React.FC = () => {
  return (
    <DashboardLayout
      role="ADMIN"
      title="Quản lý người dùng"
      description="Quản lý tài khoản và thông tin người dùng hệ thống"
    >
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={Users}
          label="Tổng người dùng"
          value="0"
          accent="navy"
          trendLabel="Tất cả tài khoản trong hệ thống"
        />
        <MetricCard
          icon={UserCog}
          label="Đang hoạt động"
          value="0"
          accent="teal"
          trendLabel="Người dùng đang online"
        />
        <MetricCard
          icon={Shield}
          label="Quản trị viên"
          value="0"
          accent="amber"
          trendLabel="Tài khoản admin"
        />
      </div>

      <SectionCard
        title="Tính năng đang được phát triển"
        description="Chức năng quản lý người dùng sẽ sớm có mặt"
      >
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="rounded-xl sm:rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-sky-50/60 p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-brand-teal/10">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-brand-teal" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-navy text-sm sm:text-base">Danh sách người dùng</h3>
                <p className="text-xs sm:text-sm text-brand-text/70">Xem và quản lý tất cả người dùng</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-indigo-50/60 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
                <UserCog className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-navy">Phân quyền người dùng</h3>
                <p className="text-sm text-brand-text/70">Cấu hình vai trò và quyền hạn</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-emerald-50/60 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-navy">Lịch sử hoạt động</h3>
                <p className="text-sm text-brand-text/70">Theo dõi hành động người dùng</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-purple-50/60 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-navy">Bảo mật</h3>
                <p className="text-sm text-brand-text/70">Quản lý mật khẩu và xác thực</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-brand-background/70 p-6 text-center">
          <p className="text-brand-text/70">
            Vui lòng quay lại sau khi tính năng được hoàn thiện
          </p>
        </div>
      </SectionCard>
    </DashboardLayout>
  );
};

export default AdminUserManagement;
