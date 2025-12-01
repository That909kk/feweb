import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Loader2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getAdminServicesApi,
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
  activateServiceApi,
  getAdminServiceOptionsApi,
  getAdminServicePricingRulesApi,
  type Service,
  type ServiceOption,
  type PricingRule
} from '../../api/admin';
import { useCategories } from '../../hooks/useCategories';

const AdminServiceManagement: React.FC = () => {
  const { categories } = useCategories();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);
  
  // Modal states
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [serviceFormData, setServiceFormData] = useState<Partial<Service & { icon?: File }>>({});
  
  // Options, Pricing Rules
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'options' | 'pricing'>('info');

  // Load services
  const loadServices = async () => {
    setIsLoading(true);
    try {
      const response = await getAdminServicesApi({ page: 0, size: 100, sortBy: 'name', sortDir: 'asc' });
      if (response.success && response.data) {
        setServices(response.data);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load service details
  const loadServiceDetails = async (serviceId: number) => {
    try {
      const [optionsRes, rulesRes] = await Promise.all([
        getAdminServiceOptionsApi(serviceId),
        getAdminServicePricingRulesApi(serviceId)
      ]);

      if (optionsRes.success && optionsRes.data) {
        // Options already include choices from the API response
        setServiceOptions(optionsRes.data);
      }

      if (rulesRes.success && rulesRes.data) {
        setPricingRules(rulesRes.data);
      }
    } catch (error) {
      console.error('Error loading service details:', error);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (expandedServiceId) {
      loadServiceDetails(expandedServiceId);
    }
  }, [expandedServiceId]);

  // Handle service creation/update
  const handleSaveService = async () => {
    try {
      if (isEditMode && selectedService) {
        const response = await updateServiceApi(selectedService.serviceId, serviceFormData);
        if (response.success) {
          loadServices();
          setIsServiceModalOpen(false);
          setServiceFormData({});
        }
      } else {
        const response = await createServiceApi(serviceFormData as any);
        if (response.success) {
          loadServices();
          setIsServiceModalOpen(false);
          setServiceFormData({});
        }
      }
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Có lỗi xảy ra khi lưu dịch vụ');
    }
  };

  // Handle service deletion
  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) return;
    
    try {
      const response = await deleteServiceApi(serviceId);
      if (response.success) {
        loadServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Có lỗi xảy ra khi xóa dịch vụ');
    }
  };

  // Handle service activation
  const handleActivateService = async (serviceId: number) => {
    try {
      const response = await activateServiceApi(serviceId);
      if (response.success) {
        loadServices();
      }
    } catch (error) {
      console.error('Error activating service:', error);
      alert('Có lỗi xảy ra khi kích hoạt dịch vụ');
    }
  };

  // Filter services by search query
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="ADMIN" title="Quản lý Dịch vụ" description="Quản lý danh sách dịch vụ, tùy chọn và quy tắc tính giá">
      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-outline/40 p-4 mb-6 flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/40" />
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
          />
        </div>
        <button
          onClick={() => {
            setIsEditMode(false);
            setSelectedService(null);
            setServiceFormData({});
            setIsServiceModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Thêm dịch vụ
        </button>
      </div>

          {/* Services List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-brand-outline/40 shadow-sm p-12 text-center">
              <p className="text-brand-text/60">Không tìm thấy dịch vụ nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <div key={service.serviceId} className="bg-white rounded-2xl border border-brand-outline/40 shadow-sm overflow-hidden">
                  {/* Service Header */}
                  <div className="p-4 flex items-center justify-between hover:bg-brand-background/30 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => setExpandedServiceId(
                          expandedServiceId === service.serviceId ? null : service.serviceId
                        )}
                        className="p-1 hover:bg-brand-teal/10 rounded transition-colors"
                      >
                        {expandedServiceId === service.serviceId ? (
                          <ChevronDown className="w-5 h-5 text-brand-navy" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-brand-navy" />
                        )}
                      </button>
                      
                      {service.iconUrl && (
                        <img src={service.iconUrl} alt={service.name} className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-brand-navy">{service.name}</h3>
                        <p className="text-sm text-brand-text/60 line-clamp-1">{service.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-brand-text/60">{service.categoryName}</span>
                          <span className="text-xs font-medium text-brand-teal">
                            {service.basePrice.toLocaleString('vi-VN')}đ/{service.unit}
                          </span>
                          <span className="text-xs text-brand-text/60">
                            {service.optionsCount} tùy chọn • {service.pricingRulesCount} quy tắc
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.isActive 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-brand-outline/20 text-brand-text/60'
                      }`}>
                        {service.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                      
                      {!service.isActive && (
                        <button
                          onClick={() => handleActivateService(service.serviceId)}
                          className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Kích hoạt lại dịch vụ"
                        >
                          <RotateCcw className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setIsEditMode(true);
                          setSelectedService(service);
                          setServiceFormData(service);
                          setIsServiceModalOpen(true);
                        }}
                        className="p-2 hover:bg-brand-teal/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-brand-teal" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteService(service.serviceId)}
                        className="p-2 hover:bg-status-error/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-status-error" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedServiceId === service.serviceId && (
                    <div className="border-t border-brand-outline/40 p-4 bg-brand-background/30">
                      {/* Tabs */}
                      <div className="flex gap-2 mb-4 border-b border-brand-outline/40">
                        <button
                          onClick={() => setActiveTab('info')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === 'info'
                              ? 'text-brand-teal border-b-2 border-brand-teal'
                              : 'text-brand-text/60 hover:text-brand-navy'
                          }`}
                        >
                          Thông tin
                        </button>
                        <button
                          onClick={() => setActiveTab('options')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === 'options'
                              ? 'text-brand-teal border-b-2 border-brand-teal'
                              : 'text-brand-text/60 hover:text-brand-navy'
                          }`}
                        >
                          Tùy chọn ({serviceOptions.length})
                        </button>
                        <button
                          onClick={() => setActiveTab('pricing')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === 'pricing'
                              ? 'text-brand-teal border-b-2 border-brand-teal'
                              : 'text-brand-text/60 hover:text-brand-navy'
                          }`}
                        >
                          Quy tắc giá ({pricingRules.length})
                        </button>
                      </div>

                      {/* Tab Content */}
                      {activeTab === 'info' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-brand-text/60">Thời lượng ước tính</p>
                            <p className="font-medium text-brand-navy">{service.estimatedDurationHours} giờ</p>
                          </div>
                          <div>
                            <p className="text-sm text-brand-text/60">Nhân viên khuyến nghị</p>
                            <p className="font-medium text-brand-navy">{service.recommendedStaff} người</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-brand-text/60">Mô tả chi tiết</p>
                            <p className="text-sm text-brand-text/80">{service.description}</p>
                          </div>
                        </div>
                      )}

                      {activeTab === 'options' && (
                        <div className="space-y-3">
                          {serviceOptions.length === 0 ? (
                            <p className="text-sm text-brand-text/60 text-center py-4">
                              Chưa có tùy chọn nào
                            </p>
                          ) : (
                            serviceOptions.map((option) => (
                              <div key={option.optionId} className="bg-white rounded-lg p-3 border border-brand-outline/40">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-brand-navy">{option.label}</h4>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      option.isRequired 
                                        ? 'bg-status-error/10 text-status-error' 
                                        : 'bg-brand-outline/20 text-brand-text/60'
                                    }`}>
                                      {option.isRequired ? 'Bắt buộc' : 'Tùy chọn'}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-brand-teal/10 text-brand-teal">
                                      {option.optionType}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Choices */}
                                {option.choices && option.choices.length > 0 && (
                                  <div className="pl-4 space-y-1">
                                    {option.choices.map((choice) => (
                                      <div key={choice.choiceId} className="flex items-center justify-between text-sm">
                                        <span className="text-brand-text/80">
                                          {choice.label}
                                          {choice.isDefault && <span className="ml-2 text-xs text-brand-teal">(Mặc định)</span>}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === 'pricing' && (
                        <div className="space-y-3">
                          {pricingRules.length === 0 ? (
                            <p className="text-sm text-brand-text/60 text-center py-4">
                              Chưa có quy tắc giá nào
                            </p>
                          ) : (
                            pricingRules.map((rule) => (
                              <div key={rule.ruleId} className="bg-white rounded-lg p-3 border border-brand-outline/40">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-brand-navy">{rule.ruleName}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    rule.isActive 
                                      ? 'bg-emerald-100 text-emerald-700' 
                                      : 'bg-brand-outline/20 text-brand-text/60'
                                  }`}>
                                    {rule.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                                  <div>
                                    <span className="text-brand-text/60">Logic:</span>
                                    <p className="font-medium text-brand-navy">{rule.conditionLogic}</p>
                                  </div>
                                  <div>
                                    <span className="text-brand-text/60">Ưu tiên:</span>
                                    <p className="font-medium text-brand-navy">{rule.priority}</p>
                                  </div>
                                  <div>
                                    <span className="text-brand-text/60">Điều chỉnh giá:</span>
                                    <p className="font-medium text-brand-teal">
                                      {rule.priceAdjustment >= 0 ? '+' : ''}{rule.priceAdjustment.toLocaleString('vi-VN')}đ
                                    </p>
                                  </div>
                                  {rule.staffAdjustment !== 0 && (
                                    <div>
                                      <span className="text-brand-text/60">Điều chỉnh nhân viên:</span>
                                      <p className="font-medium text-brand-navy">{rule.staffAdjustment >= 0 ? '+' : ''}{rule.staffAdjustment}</p>
                                    </div>
                                  )}
                                  {rule.durationAdjustmentHours !== 0 && (
                                    <div>
                                      <span className="text-brand-text/60">Điều chỉnh thời gian:</span>
                                      <p className="font-medium text-brand-navy">{rule.durationAdjustmentHours >= 0 ? '+' : ''}{rule.durationAdjustmentHours}h</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Service Modal */}
          {isServiceModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl border border-brand-outline/40 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-elevation-md">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-brand-navy">
                      {isEditMode ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
                    </h2>
                    <button
                      onClick={() => setIsServiceModalOpen(false)}
                      className="p-2 hover:bg-brand-background rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-brand-text/60" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-navy mb-2">Tên dịch vụ</label>
                      <input
                        type="text"
                        value={serviceFormData.name || ''}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                        placeholder="VD: Dọn dẹp theo giờ"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-navy mb-2">Mô tả</label>
                      <textarea
                        value={serviceFormData.description || ''}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                        placeholder="Mô tả chi tiết về dịch vụ"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-navy mb-2">Giá cơ bản (đ)</label>
                        <input
                          type="number"
                          value={serviceFormData.basePrice || ''}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, basePrice: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                          placeholder="50000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-brand-navy mb-2">Đơn vị</label>
                        <input
                          type="text"
                          value={serviceFormData.unit || ''}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, unit: e.target.value })}
                          className="w-full px-4 py-2 border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                          placeholder="Giờ, Lần, Kg..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-brand-navy mb-2">Thời lượng ước tính (giờ)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={serviceFormData.estimatedDurationHours || ''}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, estimatedDurationHours: parseFloat(e.target.value) })}
                          className="w-full px-4 py-2 border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                          placeholder="2.0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-brand-navy mb-2">Nhân viên khuyến nghị</label>
                        <input
                          type="number"
                          value={serviceFormData.recommendedStaff || ''}
                          onChange={(e) => setServiceFormData({ ...serviceFormData, recommendedStaff: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                          placeholder="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-navy mb-2">Danh mục</label>
                      <select
                        value={serviceFormData.categoryId || ''}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, categoryId: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat.categoryId} value={cat.categoryId}>
                            {cat.categoryName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-navy mb-2">Icon (Upload file)</label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setServiceFormData({ ...serviceFormData, icon: file });
                            }
                          }}
                          className="w-full px-4 py-2 border border-brand-outline/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20"
                        />
                        {serviceFormData.icon && (
                          <div className="flex items-center gap-2 text-sm text-brand-text/70">
                            <span>File đã chọn: {serviceFormData.icon.name}</span>
                          </div>
                        )}
                        {(serviceFormData.iconUrl && !serviceFormData.icon) && (
                          <div className="flex items-center gap-2">
                            <img src={serviceFormData.iconUrl} alt="Current icon" className="w-12 h-12 rounded-lg object-cover" />
                            <span className="text-sm text-brand-text/70">Icon hiện tại</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-brand-text/60 mt-1">
                        Chấp nhận: JPG, PNG, GIF, WEBP
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={serviceFormData.isActive ?? true}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, isActive: e.target.checked })}
                        className="w-4 h-4 text-brand-teal rounded focus:ring-2 focus:ring-brand-teal"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-brand-navy">
                        Kích hoạt dịch vụ
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-brand-outline/40">
                    <button
                      onClick={() => setIsServiceModalOpen(false)}
                      className="px-4 py-2 text-brand-text/70 hover:bg-brand-background rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveService}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      {isEditMode ? 'Cập nhật' : 'Tạo mới'}
                    </button>
                  </div>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
};

export default AdminServiceManagement;
