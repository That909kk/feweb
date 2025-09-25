import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import { Calendar, Clock, MapPin, User, ClipboardList, CheckCircle, AlertCircle, X } from 'lucide-react';
import type { EmployeeData } from '../../types/api';
import { useEmployeeAssignments } from '../../hooks/useEmployee';
import { cancelAssignmentApi } from '../../api/employee';
import AvailableBookings from '../../components/AvailableBookings';
import EmployeeBookings from '../../components/EmployeeBookings';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'assignments'|'available'|'myBookings'>('assignments');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);
  const { 
    assignments, 
    stats: statistics, 
    isLoading, 
    isInitialized,
    error,
    getAssignments,
    getStatistics
  } = useEmployeeAssignments();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (user) {
        try {
          // Lấy ID nhân viên từ thông tin người dùng
          let employeeId = user.id;
          
          // Kiểm tra nếu có profileData và là kiểu EmployeeData
          if (user.profileData && 'employeeId' in user.profileData) {
            employeeId = (user.profileData as EmployeeData).employeeId || user.id;
          }
          
          // Chỉ fetch assignments khi statusFilter thay đổi
          if (employeeId) {
            await getAssignments(employeeId, statusFilter || undefined);
          } else {
            console.error('No valid employeeId found');
          }
        } catch (err) {
          console.error('Error fetching employee data:', err);
        }
      }
    };

    fetchEmployeeData();
  }, [user, getAssignments, getStatistics, statusFilter]);

  // Separate useEffect for initial data load (statistics)
  useEffect(() => {
    const fetchStatistics = async () => {
      if (user) {
        try {
          let employeeId = user.id;
          if (user.profileData && 'employeeId' in user.profileData) {
            employeeId = (user.profileData as EmployeeData).employeeId || user.id;
          }
          
          if (employeeId) {
            await getStatistics(employeeId);
          }
        } catch (err) {
          console.error('Error fetching statistics:', err);
        }
      }
    };

    // Only fetch statistics on first load, not when status filter changes
    if (user && !isInitialized) {
      fetchStatistics();
    }
  }, [user, getStatistics, isInitialized]);

  const handleCancelAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
    setShowCancelModal(true);
  };

  const confirmCancelAssignment = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy công việc');
      return;
    }

    setIsCancelling(true);
    try {
      const employeeId = user?.profileData && 'employeeId' in user.profileData 
        ? (user.profileData as EmployeeData).employeeId || user?.id 
        : user?.id;

      if (!employeeId) {
        throw new Error('Không tìm thấy thông tin nhân viên');
      }

      console.log('[Dashboard] Cancelling assignment:', {
        assignmentId: selectedAssignmentId,
        employeeId,
        reason: cancelReason
      });

      await cancelAssignmentApi(selectedAssignmentId, {
        reason: cancelReason.trim(),
        employeeId: employeeId
      });

      console.log('[Dashboard] Assignment cancelled successfully');

      // Refresh assignments
      await getAssignments(employeeId, statusFilter || undefined);

      // Reset modal state
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedAssignmentId('');
      
      alert('Hủy công việc thành công!');
    } catch (error: any) {
      console.error('[Dashboard] Error cancelling assignment:', error);
      
      // Show more specific error messages
      let errorMessage = 'Có lỗi xảy ra khi hủy công việc';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Lỗi server - vui lòng liên hệ quản trị viên';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy công việc này';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền hủy công việc này';
      }
      
      alert(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'CONFIRMED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'ASSIGNED':
        return 'Đã nhận';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'PENDING':
        return 'Đang chờ';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      default:
        return status;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Xin chào, {user?.fullName}!
          </h2>
          <p className="text-gray-600">
            Chào mừng đến với bảng điều khiển nhân viên
          </p>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Công việc hoàn thành</h3>
                <p className="text-2xl font-bold text-gray-900">{statistics.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Công việc sắp tới</h3>
                <p className="text-2xl font-bold text-gray-900">{statistics.upcoming}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <div className="w-6 h-6 flex items-center justify-center text-purple-500 font-bold">₫</div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Doanh thu</h3>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalEarnings.toLocaleString('vi-VN')}đ</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`${
                  activeTab === 'assignments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Danh sách công việc
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`${
                  activeTab === 'available'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Dịch vụ đang tìm nhân viên
              </button>
              <button
                onClick={() => setActiveTab('myBookings')}
                className={`${
                  activeTab === 'myBookings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Công việc của tôi
              </button>
            </nav>
          </div>
        </div>
        
        {/* Content based on active tab */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'assignments' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Danh sách công việc</h3>
                <div className="flex items-center space-x-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      console.log(`[Dashboard] Status filter changed to: "${e.target.value}"`);
                      setStatusFilter(e.target.value);
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="ASSIGNED">Đã nhận</option>
                    <option value="IN_PROGRESS">Đang thực hiện</option>
                    <option value="COMPLETED">Đã hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
              </div>
              
              {!isInitialized && isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg">{error}</p>
                  <button 
                    onClick={() => {
                      if (user) {
                        const employeeId = user.profileData && 'employeeId' in user.profileData 
                          ? (user.profileData as EmployeeData).employeeId || user.id 
                          : user.id;
                        if (employeeId) {
                          getAssignments(employeeId, statusFilter || undefined);
                        }
                      }
                    }}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Thử lại
                  </button>
                </div>
              ) : assignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian làm việc</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ dịch vụ</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái & Tổng tiền</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignments.map((assignment) => (
                        <tr key={assignment.assignmentId} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div>
                              <div className="font-medium">{assignment.serviceName}</div>
                              <div className="text-xs text-gray-500">Mã: {assignment.bookingCode}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                {assignment.customerName}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {assignment.customerPhone}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date(assignment.bookingTime).toLocaleDateString('vi-VN')}
                              </div>
                              <div className="flex items-center mt-1">
                                <Clock className="w-4 h-4 mr-2" />
                                {new Date(assignment.bookingTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ({assignment.estimatedDurationHours}h)
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="truncate max-w-xs">{assignment.serviceAddress}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                                {getStatusText(assignment.status)}
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {assignment.totalAmount.toLocaleString('vi-VN')}đ
                                {assignment.note && (
                                  <div className="text-xs text-blue-600 mt-1 italic">
                                    {assignment.note}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(assignment.status === 'ASSIGNED' || assignment.status === 'CONFIRMED') && (
                              <button
                                onClick={() => handleCancelAssignment(assignment.assignmentId)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs font-medium transition-colors"
                              >
                                Hủy việc
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">Không có công việc nào</p>
                  <p className="text-sm mt-2">Công việc mới sẽ xuất hiện ở đây</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'available' && (
            <AvailableBookings 
              onAcceptSuccess={() => {
                // Optionally switch to assignments tab to show the new assignment
                // setActiveTab('assignments');
                
                // Refresh assignments to show the newly accepted booking
                if (user) {
                  let employeeId = user.id;
                  if (user.profileData && 'employeeId' in user.profileData) {
                    employeeId = (user.profileData as EmployeeData).employeeId || user.id;
                  }
                  if (employeeId) {
                    getAssignments(employeeId, statusFilter || undefined);
                  }
                }
              }}
            />
          )}
          
          {activeTab === 'myBookings' && <EmployeeBookings />}
        </div>
      </main>

      {/* Cancel Assignment Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hủy công việc</h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setSelectedAssignmentId('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy công việc *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Nhập lý do hủy công việc (ví dụ: Bị ốm đột xuất không thể thực hiện công việc)"
                disabled={isCancelling}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setSelectedAssignmentId('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={isCancelling}
              >
                Đóng
              </button>
              <button
                onClick={confirmCancelAssignment}
                disabled={isCancelling || !cancelReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isCancelling ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang hủy...
                  </div>
                ) : (
                  'Xác nhận hủy'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;