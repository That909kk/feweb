import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Sparkles,
  Wand2,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  DollarSign,
  User,
  AlertCircle,
  Loader2,
  Volume2,
  MessageCircle,
  Bot
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useVoiceBooking } from '../../hooks/useVoiceBooking';
import type { VoiceBookingResponse, VoiceBookingPreview } from '../../api/voiceBooking';
import type { VoiceBookingEventPayload } from '../../hooks/useVoiceBooking';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
}

const VoiceBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    error,
    currentResponse,
    isRecording,
    audioBlob,
    wsConnected,
    autoStopReason,
    startRecording,
    stopRecording,
    createVoiceBooking,
    continueVoiceBooking,
    confirmVoiceBooking,
    cancelVoiceBooking,
    connectWebSocket,
    disconnectWebSocket,
    reset
  } = useVoiceBooking();

  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>('');
  const [preview, setPreview] = useState<VoiceBookingPreview | null>(null);
  const [bookingId, setBookingId] = useState<string>('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoStoppedBysilence, setAutoStoppedBySilence] = useState(false);
  
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const autoSendTimeoutRef = useRef<number | null>(null);

  // Auto scroll to bottom when new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add initial greeting message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý AI của Home Mate. Bạn muốn đặt dịch vụ gì hôm nay? Hãy nói với tôi nhé!',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Handle WebSocket events
  const handleWebSocketEvent = useCallback((event: VoiceBookingEventPayload) => {
    console.log('[VoiceBooking] WebSocket event:', event);
    
    setStatus(event.status);
    setAiThinking(false);
    
    // Add AI response message
    if (event.message || event.clarificationMessage) {
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: event.clarificationMessage || event.message,
        timestamp: new Date(),
        audioUrl: event.speech?.message?.audioUrl || event.speech?.clarification?.audioUrl
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-play speech
      if (aiMessage.audioUrl) {
        playAudio(aiMessage.audioUrl, aiMessage.id);
      }
    }
    
    // Update preview if available
    if (event.preview) {
      setPreview(event.preview);
      if (event.status === 'AWAITING_CONFIRMATION') {
        setShowPreview(true);
      }
    }
    
    if (event.bookingId) {
      setBookingId(event.bookingId);
    }

    // Handle completion
    if (event.status === 'COMPLETED' && event.bookingId) {
      setTimeout(() => {
        navigate('/customer/orders');
      }, 3000);
    }
  }, [navigate]);

  // Update state when response changes
  useEffect(() => {
    if (currentResponse) {
      setCurrentRequestId(currentResponse.requestId);
      setStatus(currentResponse.status);
      setAiThinking(false);

      // Add user transcript if available
      if (currentResponse.transcript) {
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: currentResponse.transcript,
          timestamp: new Date()
        };
        setMessages(prev => {
          // Avoid duplicate
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.content === userMessage.content && lastMsg?.role === 'user') {
            return prev;
          }
          return [...prev, userMessage];
        });
      }

      // Add AI message
      if (currentResponse.message || currentResponse.clarificationMessage) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: currentResponse.clarificationMessage || currentResponse.message,
          timestamp: new Date(),
          audioUrl: currentResponse.speech?.message?.audioUrl || currentResponse.speech?.clarification?.audioUrl
        };
        
        setMessages(prev => [...prev, aiMessage]);

        // Auto-play speech
        if (aiMessage.audioUrl) {
          playAudio(aiMessage.audioUrl, aiMessage.id);
        }
      }

      // Connect WebSocket for real-time updates
      if (currentResponse.requestId && !currentResponse.isFinal) {
        connectWebSocket(currentResponse.requestId, handleWebSocketEvent);
      }

      // Update preview
      if (currentResponse.preview) {
        setPreview(currentResponse.preview);
        if (currentResponse.status === 'AWAITING_CONFIRMATION') {
          setShowPreview(true);
        }
      }

      if (currentResponse.bookingId) {
        setBookingId(currentResponse.bookingId);
      }
    }
  }, [currentResponse, connectWebSocket, handleWebSocketEvent]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      setAutoStoppedBySilence(false);
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Handle auto-stop and auto-send
  useEffect(() => {
    if (autoStopReason && audioBlob) {
      setAutoStoppedBySilence(autoStopReason === 'silence');
      
      // Add notification message
      const notificationMsg = autoStopReason === 'silence' 
        ? '🎙️ Đã tự động dừng ghi âm do phát hiện im lặng. Đang gửi...'
        : '⏱️ Đã tự động dừng ghi âm do đạt thời gian tối đa. Đang gửi...';
      
      console.log(notificationMsg);
      
      // Auto-send after brief delay
      setAiThinking(true);
      autoSendTimeoutRef.current = window.setTimeout(async () => {
        try {
          if (currentRequestId && (status === 'PARTIAL' || status === 'AWAITING_CONFIRMATION')) {
            await continueVoiceBooking(currentRequestId, audioBlob);
          } else {
            await createVoiceBooking(audioBlob);
          }
        } catch (err) {
          console.error('Error sending audio:', err);
          setAiThinking(false);
        }
      }, 800);
    }
  }, [autoStopReason, audioBlob, currentRequestId, status, continueVoiceBooking, createVoiceBooking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, [disconnectWebSocket]);

  const handleStartRecording = async () => {
    // Stop any playing audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }
    
    await startRecording();
  };

  const handleStopRecordingAndSend = async () => {
    stopRecording();
    setAiThinking(true);
    
    // Wait for blob to be ready
    setTimeout(async () => {
      if (audioBlob) {
        try {
          if (currentRequestId && (status === 'PARTIAL' || status === 'AWAITING_CONFIRMATION')) {
            await continueVoiceBooking(currentRequestId, audioBlob);
          } else {
            await createVoiceBooking(audioBlob);
          }
        } catch (err) {
          console.error('Error sending audio:', err);
          setAiThinking(false);
        }
      }
    }, 500);
  };

  const handleConfirm = async () => {
    if (!currentRequestId) return;

    setAiThinking(true);
    try {
      await confirmVoiceBooking(currentRequestId);
      setShowPreview(false);
    } catch (err) {
      console.error('Error confirming booking:', err);
      setAiThinking(false);
    }
  };

  const handleCancel = async () => {
    if (!currentRequestId) return;

    try {
      await cancelVoiceBooking(currentRequestId);
      handleReset();
    } catch (err) {
      console.error('Error canceling booking:', err);
    }
  };

  const handleReset = () => {
    reset();
    setCurrentRequestId(null);
    setMessages([{
      id: 'greeting-reset',
      role: 'assistant',
      content: 'Được rồi! Bạn muốn đặt dịch vụ gì? Hãy nói với tôi nhé!',
      timestamp: new Date()
    }]);
    setStatus('');
    setPreview(null);
    setBookingId('');
    setRecordingTime(0);
    setShowPreview(false);
    setAiThinking(false);
  };

  const playAudio = (url: string, messageId?: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setIsPlayingAudio(true);

    if (messageId) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isPlaying: true } : { ...msg, isPlaying: false }
      ));
    }

    audio.onended = () => {
      setIsPlayingAudio(false);
      if (messageId) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isPlaying: false } : msg
        ));
      }
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      console.error('Error playing audio');
    };

    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      setIsPlayingAudio(false);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout
      role="CUSTOMER"
      title="Trợ lý AI đặt lịch"
      description="Trò chuyện bằng giọng nói để đặt lịch nhanh chóng"
      actions={
        <Link
          to="/customer/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-teal shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>
      }
    >
      <div className="mx-auto max-w-6xl h-[calc(100vh-180px)] flex flex-col">
        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto rounded-3xl bg-gradient-to-b from-white to-sky-50/30 p-4 md:p-8 mb-4 shadow-inner">
          <div className="max-w-5xl mx-auto space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex items-start gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-brand-teal to-sky-500' 
                      : 'bg-gradient-to-br from-violet-500 to-purple-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-6 w-6 text-white" />
                    ) : (
                      <Bot className="h-6 w-6 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-5 py-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-brand-teal to-sky-500 text-white'
                          : 'bg-white border border-brand-outline/20 text-brand-navy shadow-sm'
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    
                    {/* Audio Indicator & Timestamp */}
                    <div className="flex items-center gap-2 mt-2 px-2">
                      {message.audioUrl && message.role === 'assistant' && (
                        <button
                          onClick={() => playAudio(message.audioUrl!, message.id)}
                          className="text-xs md:text-sm text-brand-text/60 hover:text-brand-teal transition flex items-center gap-1"
                        >
                          <Volume2 className={`h-3.5 w-3.5 ${message.isPlaying ? 'animate-pulse text-brand-teal' : ''}`} />
                          {message.isPlaying ? 'Đang phát...' : 'Nghe lại'}
                        </button>
                      )}
                      <span className="text-xs md:text-sm text-brand-text/40">
                        {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* AI Thinking Indicator */}
            {aiThinking && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div className="rounded-2xl bg-white border border-brand-outline/20 px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-teal animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-xs md:text-sm text-brand-text/60">
                        {autoStoppedBysilence 
                          ? 'Đã tự động gửi, AI đang phân tích...' 
                          : 'AI đang suy nghĩ...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex justify-center animate-fade-in">
                <div className="rounded-2xl bg-red-50 border border-red-200 px-6 py-4 flex items-center gap-3 max-w-2xl">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm md:text-base text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Preview Card - Floating */}
        {showPreview && preview && (
          <div className="mb-4 rounded-3xl bg-white border-2 border-brand-teal/30 shadow-elevation-md overflow-hidden animate-fade-in max-w-5xl mx-auto w-full">
            <div className="bg-gradient-to-r from-brand-teal to-sky-500 px-6 py-4">
              <h3 className="flex items-center gap-2 text-lg md:text-xl font-bold text-white">
                <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                Xác nhận thông tin đặt lịch
              </h3>
            </div>

            <div className="p-6 md:p-8 max-h-[350px] overflow-y-auto">
              <div className="grid gap-4">
                {/* Address */}
                {preview.address && (
                  <div className="flex items-start gap-3 text-sm md:text-base">
                    <MapPin className="h-5 w-5 md:h-6 md:w-6 text-brand-teal flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-brand-navy">Địa chỉ: </span>
                      <span className="text-brand-text">
                        {preview.address}{preview.ward && `, ${preview.ward}`}{preview.city && `, ${preview.city}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Time */}
                {preview.bookingTime && (
                  <div className="flex items-start gap-3 text-sm md:text-base">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-brand-teal flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-brand-navy">Thời gian: </span>
                      <span className="text-brand-text">
                        {new Date(preview.bookingTime).toLocaleString('vi-VN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Services */}
                {preview.services && preview.services.length > 0 && (
                  <div className="border-t border-brand-outline/20 pt-4">
                    {preview.services.map((service, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm md:text-base mb-3 pb-3 border-b border-brand-outline/10 last:border-b-0">
                        <span className="text-brand-navy">
                          {service.serviceName} <span className="text-brand-text/60">x{service.quantity}</span>
                        </span>
                        <span className="font-semibold text-brand-teal">{service.subtotalFormatted}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center border-t-2 border-brand-teal/30 pt-4 mt-2">
                  <span className="text-base md:text-lg font-bold text-brand-navy flex items-center gap-2">
                    <DollarSign className="h-6 w-6 md:h-7 md:w-7 text-brand-teal" />
                    Tổng cộng
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-brand-teal">{preview.totalAmountFormatted}</span>
                </div>
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="border-t border-brand-outline/20 p-5 md:p-6 bg-gray-50 flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={isLoading || aiThinking}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-teal to-sky-500 px-8 py-4 text-sm md:text-base font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || aiThinking ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                Xác nhận
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading || aiThinking}
                className="inline-flex items-center gap-2 rounded-full border-2 border-brand-outline/40 bg-white px-6 md:px-8 py-4 text-sm md:text-base font-semibold text-brand-navy transition hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="h-5 w-5" />
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Voice Control - Bottom Fixed */}
        <div className="bg-white rounded-3xl shadow-elevation-md p-5 md:p-8 border border-brand-outline/20 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 min-w-[80px]">
              {wsConnected && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-green-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="hidden sm:inline">Realtime</span>
                </div>
              )}
              {status === 'COMPLETED' && bookingId && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline text-xs">Mã: {bookingId}</span>
                </div>
              )}
            </div>

            {/* Voice Button */}
            <div className="flex-1 flex justify-center">
              {isRecording ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <span className={`absolute inline-flex h-24 w-24 md:h-28 md:w-28 animate-ping rounded-full ${
                      recordingTime >= 18 ? 'bg-orange-400' : 'bg-red-400'
                    } opacity-75`}></span>
                    <button
                      onClick={handleStopRecordingAndSend}
                      className={`relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full bg-gradient-to-br ${
                        recordingTime >= 18 
                          ? 'from-orange-500 to-orange-600' 
                          : 'from-red-500 to-red-600'
                      } text-white shadow-2xl transition-transform hover:scale-105 active:scale-95`}
                    >
                      <MicOff className="h-10 w-10 md:h-12 md:w-12" />
                    </button>
                  </div>
                  <div className={`flex items-center gap-2 ${recordingTime >= 18 ? 'text-orange-600' : 'text-red-600'}`}>
                    <div className={`h-2.5 w-2.5 rounded-full ${recordingTime >= 18 ? 'bg-orange-600' : 'bg-red-600'} animate-pulse`}></div>
                    <span className="text-base md:text-lg font-bold">{formatTime(recordingTime)}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStartRecording}
                  disabled={isLoading || aiThinking || isPlayingAudio || status === 'COMPLETED'}
                  className="relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-sky-500 text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlayingAudio ? (
                    <Volume2 className="h-10 w-10 md:h-12 md:w-12 animate-pulse" />
                  ) : (
                    <>
                      <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-brand-teal/30 opacity-75"></span>
                      <Mic className="relative h-10 w-10 md:h-12 md:w-12" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={isRecording || isLoading}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 md:px-5 py-3 text-xs md:text-sm font-semibold text-brand-navy transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[70px] md:min-w-[90px] justify-center"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Mới</span>
            </button>
          </div>

          {/* Status Text */}
          <div className="mt-5 text-center">
            {isRecording ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm md:text-base text-red-600 font-medium">
                  Đang lắng nghe... {recordingTime >= 18 ? 'Sắp hết thời gian!' : 'Nhấn để gửi'}
                </p>
                <p className="text-xs md:text-sm text-brand-text/60">
                  {recordingTime >= 18 
                    ? `Sẽ tự động dừng sau ${20 - recordingTime}s` 
                    : 'Tự động dừng khi bạn im lặng 2s hoặc sau 20s'}
                </p>
              </div>
            ) : isPlayingAudio ? (
              <p className="text-sm md:text-base text-brand-teal font-medium flex items-center justify-center gap-2">
                <Volume2 className="h-5 w-5 animate-pulse" />
                AI đang trả lời...
              </p>
            ) : aiThinking || isLoading ? (
              <p className="text-sm md:text-base text-brand-text/60">AI đang xử lý...</p>
            ) : status === 'COMPLETED' ? (
              <p className="text-sm md:text-base text-green-600 font-medium">✓ Đặt lịch thành công! Đang chuyển trang...</p>
            ) : (
              <p className="text-sm md:text-base text-brand-text/60">Nhấn microphone và nói với AI</p>
            )}
          </div>
        </div>

        {/* Quick Tips - Collapsible */}
        {messages.length <= 2 && (
          <div className="mt-4 rounded-2xl bg-sky-50/50 p-5 md:p-6 border border-sky-200/50 animate-fade-in max-w-5xl mx-auto w-full">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-6 w-6 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm md:text-base font-semibold text-sky-900 mb-3">Gợi ý để bắt đầu:</h4>
                <ul className="text-xs md:text-sm text-sky-800 space-y-2">
                  <li className="leading-relaxed">• "Tôi muốn đặt dịch vụ dọn dẹp nhà vào 3 giờ chiều mai"</li>
                  <li className="leading-relaxed">• "Tìm giúp việc làm bữa tối cho 4 người tại quận 1"</li>
                  <li className="leading-relaxed">• "Cần giặt ủi quần áo tại địa chỉ 123 Nguyễn Huệ"</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VoiceBookingPage;
