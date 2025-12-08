import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { ServiceBookingStatistics } from '../../api/admin';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ServiceBookingChartProps {
  data: ServiceBookingStatistics;
}

export const ServiceBookingChart: React.FC<ServiceBookingChartProps> = ({ data }) => {
  const colors = [
    'rgba(14, 165, 233, 0.8)',   // sky-500
    'rgba(34, 197, 94, 0.8)',    // green-500
    'rgba(249, 115, 22, 0.8)',   // orange-500
    'rgba(168, 85, 247, 0.8)',   // purple-500
    'rgba(236, 72, 153, 0.8)',   // pink-500
    'rgba(234, 179, 8, 0.8)',    // yellow-500
    'rgba(59, 130, 246, 0.8)',   // blue-500
    'rgba(239, 68, 68, 0.8)',    // red-500
  ];

  const borderColors = [
    'rgb(14, 165, 233)',
    'rgb(34, 197, 94)',
    'rgb(249, 115, 22)',
    'rgb(168, 85, 247)',
    'rgb(236, 72, 153)',
    'rgb(234, 179, 8)',
    'rgb(59, 130, 246)',
    'rgb(239, 68, 68)',
  ];

  const chartData = {
    labels: data.serviceStatistics.map(s => s.serviceName),
    datasets: [
      {
        label: 'Số lượng booking',
        data: data.serviceStatistics.map(s => s.bookingCount),
        backgroundColor: colors.slice(0, data.serviceStatistics.length),
        borderColor: borderColors.slice(0, data.serviceStatistics.length),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          generateLabels: function(chart: any) {
            const datasets = chart.data.datasets;
            return chart.data.labels.map((label: string, i: number) => {
              const stat = data.serviceStatistics[i];
              return {
                text: `${label} (${stat.percentage.toFixed(1)}%)`,
                fillStyle: datasets[0].backgroundColor[i],
                strokeStyle: datasets[0].borderColor[i],
                lineWidth: 2,
                hidden: false,
                index: i,
              };
            });
          },
        },
      },
      title: {
        display: true,
        text: `Thống kê dịch vụ (${data.startDate} - ${data.endDate})`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#1e293b',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            const stat = data.serviceStatistics[context.dataIndex];
            return [
              `Số lượng: ${stat.bookingCount} booking`,
              `Tỷ lệ: ${stat.percentage.toFixed(2)}%`,
              `Xếp hạng: #${stat.rank}`,
            ];
          },
        },
      },
    },
  };

  return (
    <div className="h-[280px] sm:h-[350px] md:h-[400px] w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};
