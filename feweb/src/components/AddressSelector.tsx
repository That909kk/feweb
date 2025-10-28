/**
 * AddressSelector Component
 * Component for selecting Vietnam 2-level address (Province and Commune)
 * with option for manual input
 */

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useAddress } from '../hooks';
import type { Province, Commune } from '../types/address';

interface AddressSelectorProps {
  onAddressChange: (address: {
    provinceCode: string;
    provinceName: string;
    communeCode: string;
    communeName: string;
    streetAddress: string;
    fullAddress: string;
  }) => void;
  initialProvinceCode?: string;
  initialCommuneCode?: string;
  initialStreetAddress?: string;
  className?: string;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  onAddressChange,
  initialProvinceCode = '',
  initialCommuneCode = '',
  initialStreetAddress = '',
  className = ''
}) => {
  const {
    provinces,
    communes,
    isLoadingProvinces,
    isLoadingCommunes,
    loadCommunes,
    resetCommunes,
    getFullAddress
  } = useAddress();

  const [selectedProvinceCode, setSelectedProvinceCode] = useState(initialProvinceCode);
  const [selectedProvinceName, setSelectedProvinceName] = useState('');
  const [selectedCommuneCode, setSelectedCommuneCode] = useState(initialCommuneCode);
  const [selectedCommuneName, setSelectedCommuneName] = useState('');
  const [streetAddress, setStreetAddress] = useState(initialStreetAddress);
  const [manualAddress, setManualAddress] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = e.target.value;
    const province = provinces.find(p => p.code === provinceCode);

    setSelectedProvinceCode(provinceCode);
    setSelectedProvinceName(province?.name || '');

    // Reset commune
    setSelectedCommuneCode('');
    setSelectedCommuneName('');

    if (provinceCode) {
      await loadCommunes(provinceCode);
    } else {
      resetCommunes();
    }

    updateAddress(streetAddress, '', province?.name || '');
  };

  const handleCommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const communeCode = e.target.value;
    const commune = communes.find(c => c.code === communeCode);

    setSelectedCommuneCode(communeCode);
    setSelectedCommuneName(commune?.name || '');

    updateAddress(streetAddress, commune?.name || '', selectedProvinceName);
  };

  const handleStreetAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStreetAddress(value);
    updateAddress(value, selectedCommuneName, selectedProvinceName);
  };

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setManualAddress(value);
    
    onAddressChange({
      provinceCode: '',
      provinceName: '',
      communeCode: '',
      communeName: '',
      streetAddress: '',
      fullAddress: value
    });
  };

  const updateAddress = (street: string, commune: string, province: string) => {
    const fullAddr = getFullAddress({
      provinceCode: selectedProvinceCode,
      provinceName: province,
      communeCode: selectedCommuneCode,
      communeName: commune,
      streetAddress: street,
      fullAddress: ''
    });

    onAddressChange({
      provinceCode: selectedProvinceCode,
      provinceName: province,
      communeCode: selectedCommuneCode,
      communeName: commune,
      streetAddress: street,
      fullAddress: fullAddr
    });
  };

  const toggleMode = () => {
    setIsManualMode(!isManualMode);
    
    if (!isManualMode) {
      // Switching to manual - preserve current address
      const currentFullAddress = getFullAddress({
        provinceCode: selectedProvinceCode,
        provinceName: selectedProvinceName,
        communeCode: selectedCommuneCode,
        communeName: selectedCommuneName,
        streetAddress: streetAddress,
        fullAddress: ''
      });
      setManualAddress(currentFullAddress);
    } else {
      // Switching back to assisted
      setManualAddress('');
      updateAddress(streetAddress, selectedCommuneName, selectedProvinceName);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h5 className="font-semibold text-gray-900 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-purple-600" />
          Nhập địa chỉ
        </h5>

        <button
          type="button"
          onClick={toggleMode}
          className="px-3 py-1.5 text-sm bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
        >
          {isManualMode ? '✏️ Nhập có hỗ trợ' : '⌨️ Nhập thủ công'}
        </button>
      </div>

      {!isManualMode ? (
        <div className="space-y-4">
          {/* Assisted input mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Province */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Tỉnh/Thành phố <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProvinceCode}
                onChange={handleProvinceChange}
                disabled={isLoadingProvinces}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn tỉnh/thành phố --</option>
                {provinces.map((province: Province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Commune */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Phường/Xã <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCommuneCode}
                onChange={handleCommuneChange}
                disabled={!selectedProvinceCode || isLoadingCommunes}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Chọn phường/xã --</option>
                {communes.map((commune: Commune) => (
                  <option key={commune.code} value={commune.code}>
                    {commune.name}
                  </option>
                ))}
              </select>
              {!selectedProvinceCode && (
                <p className="text-xs text-gray-500 mt-1">
                  Vui lòng chọn tỉnh/thành phố trước
                </p>
              )}
            </div>
          </div>

          {/* Street address */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Số nhà, tên đường <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={streetAddress}
              onChange={handleStreetAddressChange}
              placeholder="Ví dụ: 123 Nguyễn Văn Linh"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>

          {/* Full address display */}
          {(streetAddress || selectedCommuneName || selectedProvinceName) && (
            <div className="p-4 bg-white border border-purple-200 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">Địa chỉ đầy đủ:</p>
              <p className="text-gray-900">
                {getFullAddress({
                  provinceCode: selectedProvinceCode,
                  provinceName: selectedProvinceName,
                  communeCode: selectedCommuneCode,
                  communeName: selectedCommuneName,
                  streetAddress: streetAddress,
                  fullAddress: ''
                })}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Manual input mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Địa chỉ đầy đủ <span className="text-red-500">*</span>
            </label>
            <textarea
              value={manualAddress}
              onChange={handleManualAddressChange}
              placeholder="Ví dụ: 123 Nguyễn Văn Linh, Phường An Phú, Thành phố Hồ Chí Minh"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="mt-4 bg-white rounded-lg p-3 border border-purple-200">
        <p className="text-sm text-gray-600">
          💡 <strong>Hướng dẫn:</strong>{' '}
          {isManualMode
            ? 'Nhập địa chỉ đầy đủ theo định dạng: Số nhà Tên đường, Phường/Xã, Tỉnh/Thành phố'
            : 'Vui lòng chọn tỉnh/thành phố, phường/xã và nhập số nhà, tên đường. Hệ thống sẽ tự động tạo địa chỉ đầy đủ.'}
        </p>
      </div>
    </div>
  );
};

export default AddressSelector;
