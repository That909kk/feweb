import React from 'react';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { ChatContainer } from '../../components/chat';

const ChatPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout
      role="EMPLOYEE"
      title="Tin nhắn"
      description="Trao đổi trực tiếp với khách hàng về các booking"
    >
      <div className="h-[calc(100vh-200px)]">
        {user?.employeeId ? (
          <ChatContainer senderId={user.employeeId} />
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
