import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { DeviceType } from '../types/api';
import { Shield, ShieldCheck, LogOut, Smartphone, Monitor, RefreshCw } from 'lucide-react';

interface SessionManagerProps {
  onClose?: () => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({ onClose }) => {
  const { 
    activeSessions, 
    getActiveSessions, 
    validateToken, 
    logout, 
    isLoading 
  } = useAuth();
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await getActiveSessions();
      const isValid = await validateToken();
      setIsTokenValid(isValid);
    };
    
    loadData();
  }, [getActiveSessions, validateToken]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await getActiveSessions();
    const isValid = await validateToken();
    setIsTokenValid(isValid);
    setIsRefreshing(false);
  };

  const handleLogout = async (deviceType: DeviceType) => {
    const success = await logout(deviceType);
    if (success && deviceType === 'WEB') {
      window.location.href = '/auth';
    } else if (success) {
      await getActiveSessions();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-500" />
          Quản lý phiên đăng nhập
        </h2>
        <button 
          onClick={handleRefresh} 
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mb-6 p-3 rounded border border-gray-200 bg-gray-50">
        <div className="flex items-center mb-2">
          <ShieldCheck className={`w-5 h-5 mr-2 ${isTokenValid ? 'text-green-500' : 'text-red-500'}`} />
          <h3 className="font-medium">Trạng thái token</h3>
        </div>
        <p className="text-sm ml-7 mb-2">
          {isTokenValid === null && 'Đang kiểm tra...'}
          {isTokenValid === true && 'Token hợp lệ và đang hoạt động'}
          {isTokenValid === false && 'Token không hợp lệ hoặc đã hết hạn'}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center mb-3">
          <h3 className="font-medium">Phiên đăng nhập hoạt động</h3>
        </div>
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">
            <p>Đang tải...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSessions && (
              <>
                <div className="flex justify-between items-center p-3 border rounded border-gray-200">
                  <div className="flex items-center">
                    <Monitor className="w-5 h-5 mr-3 text-blue-500" />
                    <div>
                      <p className="font-medium">Web</p>
                      <p className="text-sm text-gray-500">{activeSessions.webSessions} phiên</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleLogout('WEB')}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 border rounded border-gray-200">
                  <div className="flex items-center">
                    <Smartphone className="w-5 h-5 mr-3 text-green-500" />
                    <div>
                      <p className="font-medium">Mobile</p>
                      <p className="text-sm text-gray-500">{activeSessions.mobileSessions} phiên</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleLogout('MOBILE')}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    disabled={activeSessions.mobileSessions === 0}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            <button
              onClick={() => handleLogout('ALL')}
              className="w-full mt-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất khỏi tất cả thiết bị
            </button>
          </div>
        )}
      </div>

      {onClose && (
        <div className="text-right mt-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionManager;