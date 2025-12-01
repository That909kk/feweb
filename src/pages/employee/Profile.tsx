import React, { Suspense } from 'react';

// Lazy load the EmployeeProfile component
const EmployeeProfile = React.lazy(() => import('../../features/employees/components/EmployeeProfile'));

const EmployeeProfilePage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải trang hồ sơ...</p>
        </div>
      </div>
    }>
      <EmployeeProfile />
    </Suspense>
  );
};

export default EmployeeProfilePage;