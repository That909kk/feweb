import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';

const AdminBookingManagement: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole="ADMIN" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Quản lý đặt lịch
          </h2>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Tính năng đang được phát triển</p>
            <p className="text-sm mt-2">Vui lòng quay lại sau</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminBookingManagement;