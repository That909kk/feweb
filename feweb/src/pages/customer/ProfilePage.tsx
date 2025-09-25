import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3,
  Save,
  X,
  Plus,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import SessionManager from '../../components/SessionManager';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  
  // Mock profile data
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || 'Nguyễn Văn An',
    email: user?.email || 'customer@example.com',
    phone: user?.phone || '0987654321',
    avatar: user?.avatar || 'https://picsum.photos/200/200?random=1',
    gender: 'male',
    birthDate: '1990-05-15'
  });

  const [addresses, setAddresses] = useState([
    {
      id: '1',
      label: 'Nhà riêng',
      street: '123 Nguyễn Huệ',
      city: 'TP.HCM',
      district: 'Quận 1',
      isDefault: true
    },
    {
      id: '2',
      label: 'Văn phòng',
      street: '456 Lê Lợi',
      city: 'TP.HCM',
      district: 'Quận 3',
      isDefault: false
    }
  ]);

  const [newAddress, setNewAddress] = useState({
    label: '',
    street: '',
    city: '',
    district: ''
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const handleProfileUpdate = () => {
    // Simulate profile update
    alert('Thông tin đã được cập nhật thành công!');
    setIsEditing(false);
  };

  const handleAddAddress = () => {
    if (!newAddress.label || !newAddress.street || !newAddress.city || !newAddress.district) {
      alert('Vui lòng điền đầy đủ thông tin địa chỉ');
      return;
    }

    const newAddr = {
      id: Date.now().toString(),
      ...newAddress,
      isDefault: addresses.length === 0
    };

    setAddresses([...addresses, newAddr]);
    setNewAddress({ label: '', street: '', city: '', district: '' });
    setShowAddAddress(false);
    alert('Địa chỉ đã được thêm thành công!');
  };

  const handleDeleteAddress = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      setAddresses(addresses.filter(addr => addr.id !== id));
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const handlePasswordChange = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      alert('Mật khẩu mới và xác nhận không khớp');
      return;
    }

    if (passwords.new.length < 8) {
      alert('Mật khẩu mới phải ít nhất 8 ký tự');
      return;
    }

    // Simulate password change
    alert('Mật khẩu đã được thay đổi thành công!');
    setPasswords({ current: '', new: '', confirm: '' });
    setShowPasswordChange(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole="CUSTOMER" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={profileData.avatar}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {profileData.fullName}
                  </h2>
                  <p className="text-gray-600 mb-1">{profileData.email}</p>
                  <p className="text-gray-600">{profileData.phone}</p>
                </div>
              </div>
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
              </button>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giới tính
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={profileData.birthDate}
                  onChange={(e) => setProfileData(prev => ({ ...prev, birthDate: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end mt-6 pt-6 border-t">
                <button
                  onClick={handleProfileUpdate}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </button>
              </div>
            )}
          </div>

          {/* Saved Addresses */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Địa chỉ đã lưu</h3>
              <button
                onClick={() => setShowAddAddress(true)}
                className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm địa chỉ
              </button>
            </div>

            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-medium text-gray-900">{address.label}</h4>
                        {address.isDefault && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">
                        {address.street}, {address.district}, {address.city}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(address.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Đặt mặc định
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Address Modal */}
            {showAddAddress && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-gray-900">Thêm địa chỉ mới</h4>
                    <button
                      onClick={() => setShowAddAddress(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nhãn địa chỉ
                      </label>
                      <input
                        type="text"
                        value={newAddress.label}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ví dụ: Nhà riêng, Văn phòng"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Địa chỉ
                      </label>
                      <input
                        type="text"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Số nhà, tên đường"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quận/Huyện
                      </label>
                      <input
                        type="text"
                        value={newAddress.district}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, district: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Quận/Huyện"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thành phố
                      </label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Thành phố"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowAddAddress(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAddAddress}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Thêm địa chỉ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Bảo mật & Đăng nhập</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Mật khẩu</h4>
                  <p className="text-sm text-gray-600">Thay đổi mật khẩu đăng nhập</p>
                </div>
                
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800"
                >
                  {showPasswordChange ? 'Hủy' : 'Thay đổi'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Quản lý phiên đăng nhập</h4>
                  <p className="text-sm text-gray-600">Kiểm tra và đăng xuất khỏi các thiết bị</p>
                </div>
                
                <button
                  onClick={() => setShowSessionManager(!showSessionManager)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Shield className="w-4 h-4 mr-1" />
                  Quản lý
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Xóa tài khoản</h4>
                  <p className="text-sm text-gray-600">Vô hiệu hóa vĩnh viễn tài khoản của bạn</p>
                </div>
                <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                  Yêu cầu xóa
                </button>
              </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordChange && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h4>
                    <button
                      onClick={() => setShowPasswordChange(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu hiện tại
                      </label>
                      <input
                        type="password"
                        value={passwords.current}
                        onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowPasswordChange(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handlePasswordChange}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Đổi mật khẩu
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Session Manager Modal */}
            {showSessionManager && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
                <div className="relative w-full max-w-md">
                  <SessionManager onClose={() => setShowSessionManager(false)} />
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <button
              onClick={() => logout()}
              className="w-full py-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;