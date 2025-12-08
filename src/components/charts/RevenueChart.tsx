import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { RevenueStatistics } from '../../api/admin';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface RevenueChartProps {
  data: RevenueStatistics;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const chartData = {
    labels: ['Tổng doanh thu', 'TB/Booking', 'Booking cao nhất', 'Booking thấp nhất'],
    datasets: [
      {
        label: 'VND',
        data: [
          data.totalRevenue,
          data.averageRevenuePerBooking,
          data.maxBookingAmount,
          data.minBookingAmount,
        ],
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)',   // sky-500
          'rgba(34, 197, 94, 0.8)',    // green-500
          'rgba(249, 115, 22, 0.8)',   // orange-500
          'rgba(168, 85, 247, 0.8)',   // purple-500
        ],
        borderColor: [
          'rgb(14, 165, 233)',
          'rgb(34, 197, 94)',
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Thống kê doanh thu (${data.startDate} - ${data.endDate})`,
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
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('vi-VN', {
              notation: 'compact',
              compactDisplay: 'short',
            }).format(value) + ' ₫';
          },
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div className="h-[280px] sm:h-[350px] md:h-[400px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
};
