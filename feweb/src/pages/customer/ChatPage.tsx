import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send,
  Phone,
  Info,
  Paperclip,
  Smile
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  
  // Mock chat data
  const mockChats = [
    {
      id: '1',
      employeeName: 'Trần Thị Bình',
      lastMessage: 'Tôi sẽ đến vào lúc 9h sáng ngày mai',
      time: '10:30',
      unread: 2,
      avatar: 'https://picsum.photos/40/40?random=2',
      status: 'online'
    },
    {
      id: '2',
      employeeName: 'Nguyễn Thị Cẩm',
      lastMessage: 'Cảm ơn bạn đã sử dụng dịch vụ',
      time: 'Hôm qua',
      unread: 0,
      avatar: 'https://picsum.photos/40/40?random=6',
      status: 'offline'
    }
  ];

  const mockMessages = [
    {
      id: '1',
      sender: 'employee',
      content: 'Xin chào! Tôi là nhân viên được phân công cho đơn hàng của bạn.',
      time: '09:00',
      avatar: 'https://picsum.photos/40/40?random=2'
    },
    {
      id: '2',
      sender: 'customer',
      content: 'Chào bạn! Tôi cần hỗ trợ một chút về thời gian.',
      time: '09:15',
      avatar: user?.avatar
    },
    {
      id: '3',
      sender: 'employee', 
      content: 'Dạ, bạn có thể cho tôi biết thời gian thuận tiện không?',
      time: '09:16',
      avatar: 'https://picsum.photos/40/40?random=2'
    },
    {
      id: '4',
      sender: 'customer',
      content: 'Tôi có thể vào lúc 10h sáng được không?',
      time: '09:17',
      avatar: user?.avatar
    },
    {
      id: '5',
      sender: 'employee',
      content: 'Được ạ, tôi sẽ đến đúng giờ. Cảm ơn bạn!',
      time: '09:18',
      avatar: 'https://picsum.photos/40/40?random=2'
    }
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, this would send the message via API
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userRole="CUSTOMER" />
      
      <div className="flex h-screen pt-16">
        {/* Chat List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Tin nhắn</h2>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {mockChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedChat === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={chat.avatar}
                      alt={chat.employeeName}
                      className="w-12 h-12 rounded-full"
                    />
                    {chat.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.employeeName}
                      </p>
                      <p className="text-xs text-gray-500">{chat.time}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage}
                      </p>
                      {chat.unread > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={mockChats.find(c => c.id === selectedChat)?.avatar}
                      alt="Employee"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {mockChats.find(c => c.id === selectedChat)?.employeeName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {mockChats.find(c => c.id === selectedChat)?.status === 'online' ? 'Đang online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-xs lg:max-w-md ${msg.sender === 'customer' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <img
                        src={msg.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                      <div className={`mx-2 ${msg.sender === 'customer' ? 'text-right' : ''}`}>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            msg.sender === 'customer'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{msg.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="px-6 py-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={1}
                    />
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chọn một cuộc trò chuyện</h3>
                <p className="text-gray-500">Chọn một nhân viên để bắt đầu trò chuyện</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;