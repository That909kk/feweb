import React from 'react';
import { Calendar } from 'lucide-react';

export type PeriodType = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';

interface PeriodSelectorProps {
  period: PeriodType;
  startDate: string;
  endDate: string;
  onPeriodChange: (period: PeriodType) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  period,
  startDate,
  endDate,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
}) => {
  const periods: { value: PeriodType; label: string }[] = [
    { value: 'DAY', label: 'Hôm nay' },
    { value: 'WEEK', label: 'Tuần này' },
    { value: 'MONTH', label: 'Tháng này' },
    { value: 'QUARTER', label: 'Quý này' },
    { value: 'YEAR', label: 'Năm này' },
    { value: 'CUSTOM', label: 'Tùy chỉnh' },
  ];

  return (
    <div className="space-y-4">
      {/* Period buttons */}
      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${
                period === p.value
                  ? 'bg-brand-teal text-white shadow-md'
                  : 'bg-white text-brand-text border border-brand-outline/40 hover:border-brand-teal/60 hover:bg-brand-teal/5'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {period === 'CUSTOM' && (
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-br from-white to-sky-50/30 border border-brand-outline/40 rounded-xl">
          <div className="flex-1">
            <label className="block text-sm font-medium text-brand-navy mb-2">
              <Calendar className="inline-block w-4 h-4 mr-1" />
              Ngày bắt đầu
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-brand-outline/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-brand-navy mb-2">
              <Calendar className="inline-block w-4 h-4 mr-1" />
              Ngày kết thúc
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-brand-outline/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal"
            />
          </div>
        </div>
      )}
    </div>
  );
};
