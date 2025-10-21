import React from 'react';
import { CalendarCheck2, Clock8, MapPin, ShieldAlert } from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { SectionCard } from '../../shared/components';

const EmployeeSchedule: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout
      role="EMPLOYEE"
      title="Lịch làm việc"
      description="Lên kế hoạch chủ động cho tuần mới, cập nhật trạng thái ca làm và xem nhắc nhở quan trọng."
    >
      <SectionCard
        title="Hệ thống điều phối đang hoàn thiện"
        description="Trong khi chờ tính năng lịch chi tiết, bạn vẫn có thể nhận thêm ca mới và theo dõi công việc đã nhận."
      >
        <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-inner">
            <CalendarCheck2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div className="max-w-xl space-y-3 text-emerald-800">
            <h3 className="text-2xl font-semibold">Chúng tôi đang xây dựng trải nghiệm lịch thông minh</h3>
            <p className="text-sm leading-relaxed">
              Mọi lịch làm của bạn hiện vẫn hiển thị trong mục <strong>“Công việc được phân công”</strong>. Khi tính năng hoàn tất, bạn sẽ:
            </p>
            <ul className="space-y-2 text-left text-sm">
              <li className="flex items-center gap-2">
                <Clock8 className="h-4 w-4 text-emerald-500" />
                Nhận thông báo tự động trước giờ làm việc 1 giờ.
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-500" />
                Xem tuyến đường gợi ý tối ưu, hạn chế trễ giờ.
              </li>
              <li className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-500" />
                Cập nhật tình trạng sức khỏe để hệ thống phân công phù hợp.
              </li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Gợi ý hôm nay"
        description="Các bước giúp bạn duy trì lịch làm việc chủ động."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Kiểm tra ca sáng',
              description: 'Truy cập mục “Công việc được phân công” để xác nhận những ca diễn ra trong sáng nay.',
              icon: Clock8
            },
            {
              title: 'Nhận thêm ca trống',
              description: 'Xem mục “Nhận thêm công việc” để đăng ký ca phù hợp với thời gian rảnh.',
              icon: CalendarCheck2
            },
            {
              title: 'Cập nhật trạng thái',
              description: 'Nếu có thay đổi sức khỏe hoặc di chuyển, hãy thông báo cho điều phối viên sớm.',
              icon: ShieldAlert
            }
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
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

export default EmployeeSchedule;
