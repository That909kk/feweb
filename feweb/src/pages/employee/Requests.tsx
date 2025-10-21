import React from 'react';
import { Inbox, Radar, Star } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { SectionCard } from '../../shared/components';

const EmployeeRequests: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout
      role="EMPLOYEE"
      title="Yêu cầu công việc"
      description="Tổng hợp các thông báo từ khách hàng và điều phối viên. Bạn sẽ sớm theo dõi, phản hồi ngay trên cùng một màn hình."
    >
      <SectionCard
        title="Hộp thư yêu cầu đang được chuẩn bị"
        description="Chúng tôi đang kết nối trực tiếp với API giao tiếp để mọi trao đổi được hiển thị tức thì."
      >
        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-sky-200 bg-sky-50/60 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-inner">
            <Inbox className="h-8 w-8 text-sky-500" />
          </div>
          <div className="max-w-xl space-y-3 text-sky-900">
            <h3 className="text-2xl font-semibold">Tính năng nhận yêu cầu trực tuyến sắp sẵn sàng</h3>
            <p className="text-sm leading-relaxed">
              Khi hoàn thành, bạn sẽ xem được yêu cầu khẩn, phản hồi bằng tin nhắn nhanh và xác nhận thời gian thực.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Sắp ra mắt" description="Một số điểm nổi bật sẽ có trong phiên bản chính thức.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Radar,
              title: 'Theo dõi trạng thái',
              description: 'Tự động cập nhật khi khách hàng chỉnh sửa yêu cầu hoặc thay đổi thời gian.'
            },
            {
              icon: Star,
              title: 'Đánh giá phản hồi',
              description: 'Gửi phản hồi chất lượng để nâng điểm xếp hạng nghề nghiệp của bạn.'
            },
            {
              icon: Inbox,
              title: 'Bộ lọc thông minh',
              description: 'Ưu tiên hiển thị các yêu cầu khẩn hoặc gần vị trí hiện tại của bạn.'
            }
          ].map(item => (
            <div key={item.title} className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                <item.icon className="h-5 w-5" />
              </div>
              <h4 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h4>
              <p className="mt-2 text-sm text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
};

export default EmployeeRequests;
