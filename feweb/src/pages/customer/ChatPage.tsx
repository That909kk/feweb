import React from 'react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { ChatContainer } from '../../components/chat';

const ChatPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout
      role="CUSTOMER"
      title="Tin nhắn"
      description="Trao đổi trực tiếp với nhân viên về các dịch vụ đã đặt"
    >
      <div className="h-[calc(100vh-200px)]">
        {user?.id ? (
          <ChatContainer accountId={user.id} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Vui lòng đăng nhập để sử dụng tính năng chat</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
