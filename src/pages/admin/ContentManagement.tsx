import React from 'react';
import { FileText, Image, Video, FileCode } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { SectionCard } from '../../shared/components';

const AdminContentManagement: React.FC = () => {
  return (
    <DashboardLayout
      role="ADMIN"
      title="Quản lý nội dung"
      description="Quản lý các nội dung, media và tài nguyên của hệ thống"
    >
      <SectionCard
        title="Tính năng đang được phát triển"
        description="Chức năng quản lý nội dung sẽ sớm có mặt"
      >
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-sky-50/60 p-6 sm:p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal/10 mb-4">
              <FileText className="h-6 w-6 text-brand-teal" />
            </div>
            <h3 className="font-semibold text-brand-navy">Bài viết</h3>
            <p className="text-sm text-brand-text/70 mt-2">Quản lý blog và tin tức</p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-indigo-50/60 p-6 sm:p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 mb-4">
              <Image className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-brand-navy">Hình ảnh</h3>
            <p className="text-sm text-brand-text/70 mt-2">Thư viện ảnh</p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-purple-50/60 p-6 sm:p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 mb-4">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-brand-navy">Video</h3>
            <p className="text-sm text-brand-text/70 mt-2">Quản lý video</p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-brand-outline/40 bg-gradient-to-br from-white to-emerald-50/60 p-6 sm:p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 mb-4">
              <FileCode className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-brand-navy">Templates</h3>
            <p className="text-sm text-brand-text/70 mt-2">Mẫu nội dung</p>
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

export default AdminContentManagement;
