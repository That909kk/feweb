import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../../layouts';
import { useAuth } from '../../contexts/AuthContext';
import { ChatContainer } from '../../components/chat';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();

  // Debug: Kiểm tra IDs
  React.useEffect(() => {
    if (user) {
      console.log('🔍 [ChatPage Debug]', {
        accountId: user.accountId,
        customerId: user.customerId,
        username: user.username,
        role: user.role,
        conversationId: conversationId
      });
    }
  }, [user, conversationId]);

  return (
    <DashboardLayout
      role="CUSTOMER"
      title="Tin nhắn"
      description="Trao đổi trực tiếp với nhân viên về các dịch vụ đã đặt"
    >
      <div className="h-[calc(100vh-200px)]">
        {user?.customerId && user?.accountId ? (
          <ChatContainer 
            senderId={user.customerId} 
            accountId={user.accountId}
            initialConversationId={conversationId}
          />
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
