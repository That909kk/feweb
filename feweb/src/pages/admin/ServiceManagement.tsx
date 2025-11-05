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
  ChevronRight
} from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
  getAdminServicesApi,
  createServiceApi,
  updateServiceApi,
  deleteServiceApi,
  getAdminServiceOptionsApi,
  getAdminServiceOptionChoicesApi,
  getAdminServicePricingRulesApi,
  type Service,
  type ServiceOption,
  type ServiceOptionChoice,
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
  const [serviceFormData, setServiceFormData] = useState<Partial<Service>>({});
  
  // Options, Choices, Pricing Rules
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [serviceChoices, setServiceChoices] = useState<Record<number, ServiceOptionChoice[]>>({});
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
        setServiceOptions(optionsRes.data);
        
        // Load choices for each option
        const choicesPromises = optionsRes.data.map(option =>
          getAdminServiceOptionChoicesApi(option.optionId)
        );
        const choicesResults = await Promise.all(choicesPromises);
        
        const choicesMap: Record<number, ServiceOptionChoice[]> = {};
        optionsRes.data.forEach((option, index) => {
          if (choicesResults[index].success && choicesResults[index].data) {
            choicesMap[option.optionId] = choicesResults[index].data!;
          }
        });
        setServiceChoices(choicesMap);
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

  // Filter services by search query
  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="ADMIN" title="Quản lý Dịch vụ" description="Quản lý danh sách dịch vụ, tùy chọn và quy tắc tính giá">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm dịch vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setIsEditMode(false);
                setSelectedService(null);
                setServiceFormData({});
                setIsServiceModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Thêm dịch vụ
            </button>
          </div>

          {/* Services List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500">Không tìm thấy dịch vụ nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredServices.map((service) => (
                <div key={service.serviceId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Service Header */}
                  <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => setExpandedServiceId(
                          expandedServiceId === service.serviceId ? null : service.serviceId
                        )}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        {expandedServiceId === service.serviceId ? (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      
                      {service.iconUrl && (
                        <img src={service.iconUrl} alt={service.name} className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{service.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{service.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-500">{service.categoryName}</span>
                          <span className="text-xs font-medium text-blue-600">
                            {service.basePrice.toLocaleString('vi-VN')}đ/{service.unit}
                          </span>
                          <span className="text-xs text-gray-500">
                            {service.optionsCount} tùy chọn • {service.pricingRulesCount} quy tắc
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {service.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                      
                      <button
                        onClick={() => {
                          setIsEditMode(true);
                          setSelectedService(service);
                          setServiceFormData(service);
                          setIsServiceModalOpen(true);
                        }}
                        className="p-2 hover:bg-blue-100 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteService(service.serviceId)}
                        className="p-2 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedServiceId === service.serviceId && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      {/* Tabs */}
                      <div className="flex gap-2 mb-4 border-b border-gray-200">
                        <button
                          onClick={() => setActiveTab('info')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === 'info'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Thông tin
                        </button>
                        <button
                          onClick={() => setActiveTab('options')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === 'options'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Tùy chọn ({serviceOptions.length})
                        </button>
                        <button
                          onClick={() => setActiveTab('pricing')}
                          className={`px-4 py-2 font-medium transition-colors ${
                            activeTab === 'pricing'
                              ? 'text-blue-600 border-b-2 border-blue-600'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          Quy tắc giá ({pricingRules.length})
                        </button>
                      </div>

                      {/* Tab Content */}
                      {activeTab === 'info' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Thời lượng ước tính</p>
                            <p className="font-medium">{service.estimatedDurationHours} giờ</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Nhân viên khuyến nghị</p>
                            <p className="font-medium">{service.recommendedStaff} người</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">Mô tả chi tiết</p>
                            <p className="text-sm">{service.description}</p>
                          </div>
                        </div>
                      )}

                      {activeTab === 'options' && (
                        <div className="space-y-3">
                          {serviceOptions.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                              Chưa có tùy chọn nào
                            </p>
                          ) : (
                            serviceOptions.map((option) => (
                              <div key={option.optionId} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-800">{option.optionName}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    option.isRequired 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {option.isRequired ? 'Bắt buộc' : 'Tùy chọn'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                                
                                {/* Choices */}
                                {serviceChoices[option.optionId]?.length > 0 && (
                                  <div className="pl-4 space-y-1">
                                    {serviceChoices[option.optionId].map((choice) => (
                                      <div key={choice.choiceId} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700">{choice.choiceName}</span>
                                        <span className="text-blue-600 font-medium">
                                          {choice.priceAdjustment >= 0 ? '+' : ''}{choice.priceAdjustment.toLocaleString('vi-VN')}đ
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
                            <p className="text-sm text-gray-500 text-center py-4">
                              Chưa có quy tắc giá nào
                            </p>
                          ) : (
                            pricingRules.map((rule) => (
                              <div key={rule.ruleId} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-gray-800">{rule.ruleName}</h4>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    rule.isActive 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {rule.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-500">Điều kiện:</span>
                                    <p className="font-medium">{rule.conditionType}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Khoảng:</span>
                                    <p className="font-medium">{rule.minValue} - {rule.maxValue || '∞'}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Điều chỉnh:</span>
                                    <p className="font-medium text-blue-600">
                                      {rule.adjustmentType === 'PERCENTAGE' ? `${rule.adjustmentValue}%` : `${rule.adjustmentValue.toLocaleString('vi-VN')}đ`}
                                    </p>
                                  </div>
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
        </div>

        {/* Service Modal */}
        {isServiceModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
                  </h2>
                  <button
                    onClick={() => setIsServiceModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên dịch vụ</label>
                    <input
                      type="text"
                      value={serviceFormData.name || ''}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="VD: Dọn dẹp theo giờ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                    <textarea
                      value={serviceFormData.description || ''}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mô tả chi tiết về dịch vụ"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Giá cơ bản (đ)</label>
                      <input
                        type="number"
                        value={serviceFormData.basePrice || ''}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, basePrice: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Đơn vị</label>
                      <input
                        type="text"
                        value={serviceFormData.unit || ''}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, unit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Giờ, Lần, Kg..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Thời lượng ước tính (giờ)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={serviceFormData.estimatedDurationHours || ''}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, estimatedDurationHours: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="2.0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nhân viên khuyến nghị</label>
                      <input
                        type="number"
                        value={serviceFormData.recommendedStaff || ''}
                        onChange={(e) => setServiceFormData({ ...serviceFormData, recommendedStaff: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                    <select
                      value={serviceFormData.categoryId || ''}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, categoryId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Icon</label>
                    <input
                      type="url"
                      value={serviceFormData.iconUrl || ''}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, iconUrl: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/icon.png"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={serviceFormData.isActive ?? true}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Kích hoạt dịch vụ
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsServiceModalOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveService}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {isEditMode ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminServiceManagement;
