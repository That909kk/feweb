import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { 
  Plus, 
  Edit2, 
  Search, 
  Loader2,
  Save,
  X,
  Percent,
  DollarSign,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getAdditionalFeesApi,
  createAdditionalFeeApi,
  updateAdditionalFeeApi,
  toggleAdditionalFeeActiveApi,
  setSystemSurchargeApi
} from '../../api/additionalFee';
import type { 
  AdditionalFee, 
  CreateAdditionalFeeRequest
} from '../../types/additionalFee';

// Toast notification type
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// Confirmation dialog type
interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  type?: 'warning' | 'danger' | 'info';
}

const AdminAdditionalFeeManagement: React.FC = () => {
  const [fees, setFees] = useState<AdditionalFee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFee, setSelectedFee] = useState<AdditionalFee | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Loading states cho từng action
  const [togglingFeeIds, setTogglingFeeIds] = useState<Set<string>>(new Set());
  const [settingSurchargeFeeId, setSettingSurchargeFeeId] = useState<string | null>(null);
  
  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  // Show toast notification
  const showToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };
  
  // Show confirmation dialog
  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string; type?: 'warning' | 'danger' | 'info' }
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: options?.confirmText || 'Xác nhận',
      cancelText: options?.cancelText || 'Hủy',
      type: options?.type || 'warning',
    });
  };
  
  // Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };
  
  // Form data
  const [formData, setFormData] = useState<CreateAdditionalFeeRequest>({
    name: '',
    description: '',
    feeType: 'PERCENT',
    value: 0,
    systemSurcharge: false,
    active: true,
    priority: 1
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  // Load fees
  const loadFees = async (page = 0) => {
    setIsLoading(true);
    try {
      const response = await getAdditionalFeesApi({ 
        page, 
        size: pageSize, 
        sort: 'priority,asc' 
      });
      setFees(response.content);
      setTotalPages(response.totalPages);
      setCurrentPage(response.number);
    } catch (error) {
      console.error('Error loading additional fees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      showToast('warning', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && selectedFee) {
        // Optimistic update - cập nhật UI ngay lập tức với formData
        const optimisticFee = {
          ...selectedFee,
          ...formData,
          updatedAt: new Date().toISOString()
        };
        setFees(prevFees => 
          prevFees.map(f => f.id === selectedFee.id ? optimisticFee : f)
        );
        
        // Đóng modal ngay để UX mượt hơn
        handleCloseModal();
        
        // Gọi API ở background
        await updateAdditionalFeeApi(selectedFee.id, formData);
        showToast('success', 'Cập nhật phụ phí thành công');
      } else {
        // Đóng modal trước
        handleCloseModal();
        
        await createAdditionalFeeApi(formData);
        showToast('success', 'Tạo phụ phí mới thành công');
        // Load lại danh sách cho trường hợp tạo mới
        loadFees(currentPage);
      }
    } catch (error) {
      console.error('Error saving fee:', error);
      showToast('error', 'Có lỗi xảy ra khi lưu phụ phí');
      // Reload để đảm bảo dữ liệu đúng nếu có lỗi
      loadFees(currentPage);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle toggle active - với optimistic update
  const handleToggleActive = async (fee: AdditionalFee) => {
    if (togglingFeeIds.has(fee.id)) return; // Prevent double click
    
    // Optimistic update - cập nhật UI trước
    const newActiveState = !fee.active;
    setFees(prevFees => 
      prevFees.map(f => f.id === fee.id ? { ...f, active: newActiveState } : f)
    );
    
    // Thêm vào loading set
    setTogglingFeeIds(prev => new Set(prev).add(fee.id));
    
    try {
      await toggleAdditionalFeeActiveApi(fee.id, newActiveState);
      showToast('success', newActiveState ? 'Đã bật phụ phí' : 'Đã tắt phụ phí');
    } catch (error) {
      console.error('Error toggling fee active status:', error);
      // Rollback nếu lỗi
      setFees(prevFees => 
        prevFees.map(f => f.id === fee.id ? { ...f, active: fee.active } : f)
      );
      showToast('error', 'Có lỗi xảy ra khi thay đổi trạng thái');
    } finally {
      setTogglingFeeIds(prev => {
        const next = new Set(prev);
        next.delete(fee.id);
        return next;
      });
    }
  };

  // Handle set system surcharge - với loading state
  const handleSetSystemSurcharge = async (fee: AdditionalFee) => {
    if (fee.systemSurcharge) {
      showToast('info', 'Phụ phí này đã là phí hệ thống');
      return;
    }

    if (settingSurchargeFeeId) return; // Đang xử lý

    showConfirm(
      'Đặt làm phí hệ thống',
      `Bạn có chắc muốn đặt "${fee.name}" làm phí hệ thống? Phí hệ thống hiện tại sẽ được thay thế.`,
      async () => {
        closeConfirmDialog();
        setSettingSurchargeFeeId(fee.id);
        
        try {
          await setSystemSurchargeApi(fee.id);
          // Cập nhật UI: tắt phí hệ thống cũ, bật phí mới
          setFees(prevFees => 
            prevFees.map(f => ({
              ...f,
              systemSurcharge: f.id === fee.id ? true : false,
              active: f.id === fee.id ? true : f.active
            }))
          );
          showToast('success', `Đã đặt "${fee.name}" làm phí hệ thống`);
        } catch (error) {
          console.error('Error setting system surcharge:', error);
          showToast('error', 'Có lỗi xảy ra khi đặt phí hệ thống');
        } finally {
          setSettingSurchargeFeeId(null);
        }
      },
      { confirmText: 'Đặt làm phí hệ thống', type: 'warning' }
    );
  };

  // Handle edit fee
  const handleEditFee = (fee: AdditionalFee) => {
    setSelectedFee(fee);
    setFormData({
      name: fee.name,
      description: fee.description,
      feeType: fee.feeType,
      value: fee.value,
      systemSurcharge: fee.systemSurcharge,
      active: fee.active,
      priority: fee.priority
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedFee(null);
    setFormData({
      name: '',
      description: '',
      feeType: 'PERCENT',
      value: 0,
      systemSurcharge: false,
      active: true,
      priority: 1
    });
  };

  // Filter fees by search query
  const filteredFees = fees.filter(fee =>
    fee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fee.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format value display
  const formatValue = (fee: AdditionalFee): string => {
    if (fee.feeType === 'PERCENT') {
      return `${(fee.value * 100).toFixed(0)}%`;
    }
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(fee.value);
  };

  return (
    <DashboardLayout 
      role="ADMIN" 
      title="Quản lý Phụ phí" 
      description="Quản lý danh sách phụ phí áp dụng cho booking"
    >
      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-outline/40 p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-brand-text/40" />
          <input
            type="text"
            placeholder="Tìm kiếm phụ phí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
          />
        </div>
        <button
          onClick={() => {
            setIsEditMode(false);
            setSelectedFee(null);
            setFormData({
              name: '',
              description: '',
              feeType: 'PERCENT',
              value: 0,
              systemSurcharge: false,
              active: true,
              priority: 1
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors shadow-sm text-sm sm:text-base flex-shrink-0"
        >
          <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
          <span className="hidden sm:inline">Thêm phụ phí</span>
          <span className="sm:hidden">Thêm</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Thông tin về phụ phí:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>Phí hệ thống</strong>: Tự động áp dụng cho tất cả booking (chỉ có 1 phí hệ thống active)</li>
            <li><strong>Phí theo %</strong>: Tính trên tổng tiền dịch vụ (sau khuyến mãi)</li>
            <li><strong>Phí cố định</strong>: Cộng thêm số tiền cố định vào đơn hàng</li>
            <li><strong>Priority</strong>: Số càng nhỏ thì được ưu tiên hiển thị trước</li>
          </ul>
        </div>
      </div>

      {/* Fees List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
        </div>
      ) : filteredFees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-outline/40 shadow-sm p-12 text-center">
          <p className="text-brand-text/60">Không tìm thấy phụ phí nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-outline/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-brand-background/50 border-b border-brand-outline/40">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-brand-navy">Tên phụ phí</th>
                <th className="text-left py-3 px-4 font-semibold text-brand-navy">Loại</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-navy">Giá trị</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-navy">Ưu tiên</th>
                <th className="text-center py-3 px-4 font-semibold text-brand-navy">Trạng thái</th>
                <th className="text-right py-3 px-4 font-semibold text-brand-navy">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-outline/30">
              {filteredFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-brand-background/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        fee.systemSurcharge 
                          ? 'bg-amber-100 text-amber-600' 
                          : fee.feeType === 'PERCENT' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {fee.feeType === 'PERCENT' ? (
                          <Percent className="w-5 h-5" />
                        ) : (
                          <DollarSign className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-brand-navy">{fee.name}</span>
                          {fee.systemSurcharge && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                              <Star className="w-3 h-3" />
                              Hệ thống
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-brand-text/60 line-clamp-1">{fee.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      fee.feeType === 'PERCENT' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {fee.feeType === 'PERCENT' ? 'Phần trăm' : 'Cố định'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-brand-navy">{formatValue(fee)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-background text-brand-navy font-medium">
                      {fee.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(fee)}
                      disabled={fee.systemSurcharge || togglingFeeIds.has(fee.id)}
                      className={`group relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ease-in-out ${
                        fee.active
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-gray-300 hover:bg-gray-400'
                      } ${fee.systemSurcharge || togglingFeeIds.has(fee.id) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      title={fee.systemSurcharge ? 'Phí hệ thống không thể tắt' : (fee.active ? 'Nhấn để tắt' : 'Nhấn để bật')}
                    >
                      {/* Toggle circle */}
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ease-in-out ${
                          fee.active ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      >
                        {togglingFeeIds.has(fee.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        ) : fee.active ? (
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-gray-300" />
                        )}
                      </span>
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {!fee.systemSurcharge && (
                        <button
                          onClick={() => handleSetSystemSurcharge(fee)}
                          disabled={settingSurchargeFeeId === fee.id}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            settingSurchargeFeeId === fee.id 
                              ? 'bg-amber-100 cursor-wait' 
                              : 'hover:bg-amber-100'
                          }`}
                          title="Đặt làm phí hệ thống"
                        >
                          {settingSurchargeFeeId === fee.id ? (
                            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                          ) : (
                            <Star className="w-4 h-4 text-amber-500" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleEditFee(fee)}
                        className="p-2 hover:bg-brand-teal/10 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4 text-brand-teal" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-brand-outline/40">
              <button
                onClick={() => loadFees(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded-lg border border-brand-outline/40 text-sm font-medium hover:bg-brand-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="text-sm text-brand-text/70">
                Trang {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => loadFees(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg border border-brand-outline/40 text-sm font-medium hover:bg-brand-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal - Render to body using Portal */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-outline/30 bg-gradient-to-r from-brand-teal/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-teal/10">
                  {isEditMode ? (
                    <Edit2 className="w-5 h-5 text-brand-teal" />
                  ) : (
                    <Plus className="w-5 h-5 text-brand-teal" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-navy">
                    {isEditMode ? 'Chỉnh sửa phụ phí' : 'Thêm phụ phí mới'}
                  </h2>
                  <p className="text-sm text-brand-text/60">
                    {isEditMode ? 'Cập nhật thông tin phụ phí' : 'Tạo phụ phí mới cho hệ thống'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-brand-outline/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-brand-text/60" />
              </button>
            </div>

            {/* Form - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {/* Row 1: Name và Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-navy mb-2">
                      Tên phụ phí <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="VD: Phí cao điểm, Phí di chuyển..."
                      className="w-full px-4 py-3 border border-brand-outline/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all text-base"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-navy mb-2">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả về phụ phí này..."
                      className="w-full px-4 py-3 border border-brand-outline/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all text-base"
                    />
                  </div>
                </div>

                {/* Row 2: Fee Type, Value, Priority - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Fee Type */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-navy mb-2">
                      Loại phí <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, feeType: 'PERCENT', value: formData.feeType === 'PERCENT' ? formData.value : 0 })}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all ${
                          formData.feeType === 'PERCENT'
                            ? 'border-brand-teal bg-brand-teal/10 text-brand-teal shadow-sm'
                            : 'border-brand-outline/40 text-brand-text/60 hover:border-brand-teal/40 hover:bg-brand-background/50'
                        }`}
                      >
                        <Percent className="w-4 h-4" />
                        <span className="font-medium text-sm">%</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, feeType: 'FLAT', value: formData.feeType === 'FLAT' ? formData.value : 0 })}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 transition-all ${
                          formData.feeType === 'FLAT'
                            ? 'border-brand-teal bg-brand-teal/10 text-brand-teal shadow-sm'
                            : 'border-brand-outline/40 text-brand-text/60 hover:border-brand-teal/40 hover:bg-brand-background/50'
                        }`}
                      >
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium text-sm">VND</span>
                      </button>
                    </div>
                  </div>

                  {/* Value */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-navy mb-2">
                      Giá trị <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.feeType === 'PERCENT' ? Math.round(formData.value * 100 * 100) / 100 : formData.value}
                        onChange={(e) => {
                          const inputValue = parseFloat(e.target.value) || 0;
                          setFormData({ 
                            ...formData, 
                            value: formData.feeType === 'PERCENT' ? Math.round(inputValue) / 100 : inputValue 
                          });
                        }}
                        min={0}
                        step={formData.feeType === 'PERCENT' ? 1 : 1000}
                        placeholder={formData.feeType === 'PERCENT' ? '20' : '50000'}
                        className="w-full px-4 py-3 pr-14 border border-brand-outline/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all text-base"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-brand-text/40">
                        {formData.feeType === 'PERCENT' ? '%' : 'đ'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-brand-text/50">
                      {formData.feeType === 'PERCENT' ? 'VD: 20 = 20%' : 'VD: 50,000đ'}
                    </p>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-brand-navy mb-2">
                      Độ ưu tiên
                    </label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={100}
                      className="w-full px-4 py-3 border border-brand-outline/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-all text-base"
                    />
                    <p className="mt-1.5 text-xs text-brand-text/50">
                      0 = cao nhất
                    </p>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-background to-brand-background/50 rounded-xl border border-brand-outline/30">
                  <div>
                    <div className="font-semibold text-brand-navy">Kích hoạt phụ phí</div>
                    <p className="text-sm text-brand-text/60 mt-0.5">Phụ phí sẽ được áp dụng khi đặt lịch</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                      formData.active ? 'bg-brand-teal shadow-md shadow-brand-teal/30' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                      formData.active ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions - Fixed at bottom */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brand-outline/30 bg-gray-50/80">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-brand-text/70 hover:text-brand-navy font-medium hover:bg-white rounded-xl transition-all border border-transparent hover:border-brand-outline/40"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white font-semibold rounded-xl hover:bg-brand-teal/90 transition-all shadow-md shadow-brand-teal/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isEditMode ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Dialog - Render to body using Portal */}
      {confirmDialog.isOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-6 ${
              confirmDialog.type === 'danger' ? 'bg-red-50' : 
              confirmDialog.type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-2 rounded-full ${
                  confirmDialog.type === 'danger' ? 'bg-red-100' : 
                  confirmDialog.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  {confirmDialog.type === 'danger' ? (
                    <XCircle className={`w-6 h-6 text-red-600`} />
                  ) : confirmDialog.type === 'warning' ? (
                    <AlertTriangle className={`w-6 h-6 text-amber-600`} />
                  ) : (
                    <AlertCircle className={`w-6 h-6 text-blue-600`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-brand-navy">{confirmDialog.title}</h3>
                  <p className="mt-2 text-sm text-brand-text/70">{confirmDialog.message}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={closeConfirmDialog}
                className="px-4 py-2 text-sm font-medium text-brand-text/70 hover:text-brand-navy hover:bg-white rounded-lg transition-colors"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  confirmDialog.type === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-5 duration-300 ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : toast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <XCircle className="w-5 h-5 flex-shrink-0" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-2 p-1 hover:bg-black/5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdminAdditionalFeeManagement;
