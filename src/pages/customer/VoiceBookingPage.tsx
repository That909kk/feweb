import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  XCircle,
  MapPin,
  User,
  Loader2,
  Volume2,
  MessageCircle,
  Bot,
  Clock,
  ShoppingBag,
  X,
  PartyPopper,
  Send,
  Keyboard,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '../../layouts';
import { useVoiceBooking } from '../../hooks/useVoiceBooking';
import type { VoiceBookingPreview } from '../../api/voiceBooking';
import type { VoiceBookingEventPayload } from '../../hooks/useVoiceBooking';
import { getBookingByIdApi } from '../../api/booking';
import type { BookingResponse } from '../../types/api';

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isSendingText, setIsSendingText] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showMissingFieldsHint, setShowMissingFieldsHint] = useState(false);
  const [pendingManualSend, setPendingManualSend] = useState(false);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false); // Đang phát lại đoạn ghi âm
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState<BookingResponse['data'] | null>(null); // Chi tiết booking sau khi confirm
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);
  
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recordingPlayerRef = useRef<HTMLAudioElement | null>(null); // Player cho ghi âm của user
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const autoSendTimeoutRef = useRef<number | null>(null);
  const manualStopTimestampRef = useRef<number | null>(null); // Track khi nào bấm stop
  const lastBlobRef = useRef<Blob | null>(null); // Track blob đã gửi
  const recordingStartTimeRef = useRef<number | null>(null); // Track khi nào bắt đầu recording
  const MIN_RECORDING_TIME = 2000; // Ít nhất 2 giây trước khi cho phép stop (server cần đủ audio để transcribe)

  // Function để phát lại đoạn ghi âm
  const playRecording = useCallback(() => {
    if (!audioBlob) {
      console.log('[VoiceBooking] No audio blob to play');
      return;
    }
    
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log('[VoiceBooking] Playing recording, blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    if (recordingPlayerRef.current) {
      recordingPlayerRef.current.pause();
      URL.revokeObjectURL(recordingPlayerRef.current.src);
    }
    
    const audio = new Audio(audioUrl);
    recordingPlayerRef.current = audio;
    
    audio.onplay = () => {
      setIsPlayingRecording(true);
      console.log('[VoiceBooking] Recording playback started');
    };
    
    audio.onended = () => {
      setIsPlayingRecording(false);
      URL.revokeObjectURL(audioUrl);
      console.log('[VoiceBooking] Recording playback ended');
    };
    
    audio.onerror = (e) => {
      console.error('[VoiceBooking] Recording playback error:', e);
      setIsPlayingRecording(false);
      URL.revokeObjectURL(audioUrl);
    };
    
    audio.play().catch(err => {
      console.error('[VoiceBooking] Failed to play recording:', err);
      setIsPlayingRecording(false);
    });
  }, [audioBlob]);
  
  const stopPlayingRecording = useCallback(() => {
    if (recordingPlayerRef.current) {
      recordingPlayerRef.current.pause();
      recordingPlayerRef.current.currentTime = 0;
      setIsPlayingRecording(false);
    }
  }, []);

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
    
    // Xử lý speech - ưu tiên message trước, rồi mới đến clarification
    let textToShow = '';
    let audioToPlay = '';
    
    // Ưu tiên 1: speech.message (có cả text và audio)
    if (event.speech?.message?.audioUrl) {
      textToShow = event.speech.message.text || '';
      audioToPlay = event.speech.message.audioUrl;
    } 
    // Ưu tiên 2: speech.clarification (nếu không có message)
    else if (event.speech?.clarification?.audioUrl) {
      textToShow = event.speech.clarification.text || '';
      audioToPlay = event.speech.clarification.audioUrl;
    }
    // Ưu tiên 3: Fallback sang message/clarificationMessage text
    else {
      textToShow = event.message || event.clarificationMessage || '';
    }
    
    console.log('[VoiceBooking] WS Speech processing:', {
      textToShow,
      audioToPlay,
      speech: event.speech
    });
    
    // Add AI response message (không thêm cho COMPLETED vì sẽ xử lý riêng trong handleConfirm)
    if (textToShow && event.status !== 'COMPLETED') {
      const messageId = `ai-ws-${Date.now()}`;
      const aiMessage: Message = {
        id: messageId,
        role: 'assistant',
        content: textToShow,
        timestamp: new Date(),
        audioUrl: audioToPlay || undefined
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-play speech nếu có audio (không phát cho COMPLETED)
      if (audioToPlay) {
        setTimeout(() => {
          playAudio(audioToPlay, messageId);
        }, 100);
      }
    }
    
    // Update missing fields
    if (event.missingFields) {
      setMissingFields(event.missingFields);
      setShowMissingFieldsHint(event.missingFields.length > 0);
    } else {
      setMissingFields([]);
      setShowMissingFieldsHint(false);
    }
    
    // Update preview if available - hiển popup khi AWAITING_CONFIRMATION
    if (event.preview) {
      console.log('[VoiceBooking] Preview data:', JSON.stringify(event.preview, null, 2));
      setPreview(event.preview);
    }
    
    if (event.status === 'AWAITING_CONFIRMATION') {
      // Chờ audio phát xong rồi hiển popup xác nhận
      if (audioToPlay) {
        // Sẽ hiển popup sau khi audio kết thúc (xử lý trong playAudio)
        setShowPreview(false); // Tạm ẩn, sẽ hiện sau khi audio xong
      } else {
        setShowPreview(true);
      }
    }
    
    if (event.bookingId) {
      setBookingId(event.bookingId);
    }

    // Handle completion
    if (event.status === 'COMPLETED' && event.bookingId) {
      setShowPreview(false);
      setShowSuccessModal(true);
      setConfirmingBooking(false);
    }
  }, []);

  // Update state when response changes
  useEffect(() => {
    if (currentResponse) {
      console.log('[VoiceBooking] Response received:', currentResponse);
      
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

      // Xử lý speech - ưu tiên message trước, rồi mới đến clarification
      let textToShow = '';
      let audioToPlay = '';
      
      // Ưu tiên 1: speech.message (có cả text và audio)
      if (currentResponse.speech?.message?.audioUrl) {
        textToShow = currentResponse.speech.message.text || '';
        audioToPlay = currentResponse.speech.message.audioUrl;
      } 
      // Ưu tiên 2: speech.clarification (nếu không có message)
      else if (currentResponse.speech?.clarification?.audioUrl) {
        textToShow = currentResponse.speech.clarification.text || '';
        audioToPlay = currentResponse.speech.clarification.audioUrl;
      }
      // Ưu tiên 3: Fallback sang message/clarificationMessage text
      else {
        textToShow = currentResponse.message || currentResponse.clarificationMessage || '';
      }
      
      console.log('[VoiceBooking] Speech processing:', {
        textToShow,
        audioToPlay,
        speech: currentResponse.speech
      });
      
      // Add AI message (không thêm cho COMPLETED vì sẽ xử lý riêng trong handleConfirm)
      if (textToShow && currentResponse.status !== 'COMPLETED') {
        const messageId = `ai-${Date.now()}`;
        const aiMessage: Message = {
          id: messageId,
          role: 'assistant',
          content: textToShow,
          timestamp: new Date(),
          audioUrl: audioToPlay || undefined
        };
        
        setMessages(prev => [...prev, aiMessage]);

        // Auto-play speech nếu có audio (không phát cho COMPLETED)
        if (audioToPlay) {
          setTimeout(() => {
            playAudio(audioToPlay, messageId);
          }, 100);
        }
      }

      // Update preview
      if (currentResponse.preview) {
        setPreview(currentResponse.preview);
      }
      
      // Hiển popup xác nhận khi AWAITING_CONFIRMATION
      if (currentResponse.status === 'AWAITING_CONFIRMATION') {
        // Nếu có audio, chờ audio phát xong rồi hiển popup
        if (audioToPlay) {
          // Popup sẽ được hiển sau khi audio kết thúc (trong onended callback)
        } else {
          setShowPreview(true);
        }
      }

      // Update missing fields
      if (currentResponse.missingFields) {
        setMissingFields(currentResponse.missingFields);
        setShowMissingFieldsHint(currentResponse.missingFields.length > 0);
      } else {
        setMissingFields([]);
        setShowMissingFieldsHint(false);
      }

      if (currentResponse.bookingId) {
        setBookingId(currentResponse.bookingId);
      }
      
      // Handle COMPLETED status
      if (currentResponse.status === 'COMPLETED' && currentResponse.bookingId) {
        setShowPreview(false);
        setShowSuccessModal(true);
      }
    }
  }, [currentResponse, connectWebSocket, handleWebSocketEvent]);

  // Auto show preview popup when AWAITING_CONFIRMATION và không có audio đang phát
  useEffect(() => {
    // Không hiện preview nếu đang hiện success modal
    if (status === 'AWAITING_CONFIRMATION' && preview && !showPreview && !isPlayingAudio && !showSuccessModal) {
      // Delay một chút để đảm bảo audio đã xử lý xong
      const timer = setTimeout(() => {
        if (!isPlayingAudio && !showSuccessModal) {
          setShowPreview(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, preview, showPreview, isPlayingAudio, showSuccessModal]);

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
          console.log('[VoiceBooking] Auto-sending audio, blob size:', audioBlob?.size);
          
          if (currentRequestId && (status === 'PARTIAL' || status === 'AWAITING_CONFIRMATION')) {
            try {
              console.log('[VoiceBooking] Continuing with requestId:', currentRequestId);
              await continueVoiceBooking(currentRequestId, audioBlob);
            } catch (continueErr: any) {
              console.error('[VoiceBooking] Continue error:', continueErr);
              // Nếu continue thất bại với 400, reset và tạo request mới
              if (continueErr?.response?.status === 400) {
                console.warn('[VoiceBooking] Continue failed (400), creating new request...');
                setCurrentRequestId(null);
                setStatus('');
                await createVoiceBooking(audioBlob);
              } else {
                throw continueErr;
              }
            }
          } else {
            console.log('[VoiceBooking] Creating new voice booking');
            await createVoiceBooking(audioBlob);
          }
        } catch (err: any) {
          console.error('[VoiceBooking] Error sending audio:', err);
          setAiThinking(false);
          
          // Hiển thị lỗi cho user
          const errorMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xử lý giọng nói';
          const errorMessage: Message = {
            id: `ai-error-${Date.now()}`,
            role: 'assistant',
            content: `❌ ${errorMsg}. Vui lòng thử lại.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      }, 800);
    }
  }, [autoStopReason, audioBlob, currentRequestId, status, continueVoiceBooking, createVoiceBooking]);

  // Cleanup on unmount - hủy draft nếu có
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

  // Ref để track requestId cho cleanup (tránh stale closure)
  const requestIdRef = useRef<string | null>(null);
  const statusRef = useRef<string>('');
  
  useEffect(() => {
    requestIdRef.current = currentRequestId;
    statusRef.current = status;
  }, [currentRequestId, status]);

  // Hủy draft khi rời trang (nếu có requestId và chưa hoàn thành)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Gọi cancel khi user rời trang (đóng tab, refresh, navigate)
      if (requestIdRef.current && statusRef.current !== 'COMPLETED' && statusRef.current !== 'CANCELLED') {
        // Dùng sendBeacon để đảm bảo request được gửi trước khi trang đóng
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
        navigator.sendBeacon(
          `${apiUrl}/customer/bookings/voice/cancel`,
          new Blob([JSON.stringify({ requestId: requestIdRef.current })], {
            type: 'application/json'
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Chỉ chạy 1 lần khi mount/unmount

  // Xử lý quay lại với confirm nếu có draft
  const handleGoBack = async () => {
    if (currentRequestId && status !== 'COMPLETED' && status !== 'CANCELLED') {
      const confirmLeave = window.confirm('Bạn có đơn đặt lịch đang xử lý. Bạn có chắc muốn hủy và quay lại?');
      if (confirmLeave) {
        try {
          await cancelVoiceBooking(currentRequestId);
        } catch (err) {
          console.error('Error canceling on leave:', err);
        }
        navigate('/customer/dashboard');
      }
    } else {
      navigate('/customer/dashboard');
    }
  };

  const handleStartRecording = async () => {
    // Stop any playing audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }
    
    // Track thời điểm bắt đầu recording
    recordingStartTimeRef.current = Date.now();
    await startRecording();
  };

  const handleStopRecordingAndSend = async () => {
    // Kiểm tra đã ghi được đủ thời gian tối thiểu chưa
    const recordingDuration = recordingStartTimeRef.current 
      ? Date.now() - recordingStartTimeRef.current 
      : 0;
    
    if (recordingDuration < MIN_RECORDING_TIME) {
      console.log(`[VoiceBooking] Recording too short (${recordingDuration}ms), waiting...`);
      // Chờ cho đủ thời gian tối thiểu
      const waitTime = MIN_RECORDING_TIME - recordingDuration;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    console.log('[VoiceBooking] Manual stop initiated, setting pendingManualSend flag');
    manualStopTimestampRef.current = Date.now();
    setPendingManualSend(true);
    setAiThinking(true);
    stopRecording();
    // Việc gửi audio sẽ được xử lý trong useEffect khi audioBlob thay đổi
  };

  // Effect để xử lý manual send khi audioBlob đã sẵn sàng
  useEffect(() => {
    // Chỉ gửi khi:
    // 1. pendingManualSend = true
    // 2. audioBlob có data thật sự (size > 0)
    // 3. Đã dừng recording
    // 4. Blob này chưa được gửi (khác với lastBlobRef)
    if (pendingManualSend && audioBlob && audioBlob.size > 0 && !isRecording && audioBlob !== lastBlobRef.current) {
      console.log('[VoiceBooking] Manual send triggered, blob size:', audioBlob.size);
      setPendingManualSend(false);
      lastBlobRef.current = audioBlob; // Đánh dấu blob này đã được gửi
      manualStopTimestampRef.current = null;
      
      const sendAudio = async () => {
        try {
          if (currentRequestId && (status === 'PARTIAL' || status === 'AWAITING_CONFIRMATION')) {
            try {
              console.log('[VoiceBooking] Continuing with requestId:', currentRequestId);
              await continueVoiceBooking(currentRequestId, audioBlob);
            } catch (continueErr: any) {
              console.error('[VoiceBooking] Continue error:', continueErr);
              // Nếu continue thất bại với 400, reset và tạo request mới
              if (continueErr?.response?.status === 400) {
                console.warn('[VoiceBooking] Continue failed (400), creating new request...');
                setCurrentRequestId(null);
                setStatus('');
                await createVoiceBooking(audioBlob);
              } else {
                throw continueErr;
              }
            }
          } else {
            console.log('[VoiceBooking] Creating new voice booking');
            await createVoiceBooking(audioBlob);
          }
        } catch (err: any) {
          console.error('[VoiceBooking] Error sending audio:', err);
          setAiThinking(false);
          
          // Hiển thị lỗi cho user
          const errorMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi xử lý giọng nói';
          const errorMessage: Message = {
            id: `ai-error-${Date.now()}`,
            role: 'assistant',
            content: `❌ ${errorMsg}. Vui lòng thử lại.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      };
      
      sendAudio();
    } else if (pendingManualSend && audioBlob && audioBlob.size === 0 && !isRecording) {
      // Blob rỗng - hiển thị lỗi và reset
      console.warn('[VoiceBooking] Audio blob is empty, cannot send');
      setPendingManualSend(false);
      setAiThinking(false);
      manualStopTimestampRef.current = null;
      
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Không có dữ liệu âm thanh. Vui lòng thử ghi âm lại.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [pendingManualSend, audioBlob, isRecording, currentRequestId, status, continueVoiceBooking, createVoiceBooking]);

  const handleConfirm = async () => {
    if (!currentRequestId) return;

    setConfirmingBooking(true);
    try {
      const response = await confirmVoiceBooking(currentRequestId);
      // Nếu response trả về COMPLETED, hiển thị success modal
      if (response?.status === 'COMPLETED') {
        setShowPreview(false);
        setConfirmingBooking(false);
        setPreview(null); // Clear preview để không trigger auto-show
        setStatus('COMPLETED'); // Update status
        
        const confirmedBookingId = response.bookingId;
        console.log('[VoiceBooking] Confirmed bookingId:', confirmedBookingId);
        
        if (confirmedBookingId) {
          setBookingId(confirmedBookingId);
          
          // Fetch chi tiết booking từ API
          setLoadingBookingDetails(true);
          try {
            console.log('[VoiceBooking] Calling getBookingByIdApi with:', confirmedBookingId);
            const bookingDetails = await getBookingByIdApi(confirmedBookingId);
            console.log('[VoiceBooking] Fetched booking details:', bookingDetails);
            console.log('[VoiceBooking] bookingDetails.data:', bookingDetails?.data);
            if (bookingDetails?.data) {
              setConfirmedBookingDetails(bookingDetails.data);
              console.log('[VoiceBooking] Set confirmedBookingDetails successfully');
            } else {
              console.warn('[VoiceBooking] No data in bookingDetails response');
            }
          } catch (fetchError) {
            console.error('[VoiceBooking] Error fetching booking details:', fetchError);
            // Vẫn hiện success modal dù không lấy được chi tiết
          } finally {
            setLoadingBookingDetails(false);
          }
        } else {
          console.warn('[VoiceBooking] No bookingId in confirm response');
        }
        
        // Message tiếng Việt cho thành công (không phát audio vì API trả về tiếng Anh)
        const textToShow = 'Đặt lịch thành công! Cảm ơn bạn đã tin tưởng đặt dịch vụ tại Home Mate.';
        
        // Add success message to chat (không có audio)
        const messageId = `ai-success-${Date.now()}`;
        const successMessage: Message = {
          id: messageId,
          role: 'assistant',
          content: textToShow,
          timestamp: new Date()
          // Không thêm audioUrl để không phát audio tiếng Anh
        };
        setMessages(prev => [...prev, successMessage]);
        
        // Hiện success modal ngay
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Error confirming booking:', err);
      setConfirmingBooking(false);
      
      // Thêm error message
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: 'Có lỗi xảy ra khi xác nhận đặt lịch. Vui lòng thử lại.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleCancel = () => {
    // Chỉ đóng popup, không gọi API cancel
    // API cancel sẽ được gọi khi người dùng rời khỏi trang
    setShowPreview(false);
    setPreview(null);
    setConfirmingBooking(false);
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
    setShowSuccessModal(false);
    setConfirmingBooking(false);
    setTextInput('');
    setMissingFields([]);
    setShowMissingFieldsHint(false);
    setConfirmedBookingDetails(null);
    setLoadingBookingDetails(false);
  };

  // Handler gửi text bổ sung thông tin
  const handleSendText = async () => {
    if (!textInput.trim() || isSendingText) return;

    const userText = textInput.trim();
    setTextInput('');
    setIsSendingText(true);
    setAiThinking(true);
    setShowMissingFieldsHint(false);

    // Thêm message của user
    const userMessage: Message = {
      id: `user-text-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Nếu đã có requestId - sử dụng continue endpoint
      if (currentRequestId && (status === 'PARTIAL' || status === 'AWAITING_CONFIRMATION')) {
        try {
          const response = await continueVoiceBooking(currentRequestId, undefined, userText);
          // Update missing fields từ response mới
          if (response?.missingFields) {
            setMissingFields(response.missingFields);
          } else {
            setMissingFields([]);
          }
        } catch (continueErr: any) {
          if (continueErr?.response?.status === 400) {
            console.warn('[VoiceBooking] Continue failed (400), request may have expired');
            setCurrentRequestId(null);
            setStatus('');
            // Thông báo cho user nói lại
            const aiMessage: Message = {
              id: `ai-error-${Date.now()}`,
              role: 'assistant',
              content: 'Phiên đặt lịch đã hết hạn. Vui lòng nhấn microphone và nói lại yêu cầu của bạn.',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
          } else {
            throw continueErr;
          }
        }
      } else {
        // Chưa có requestId - thông báo cần nói trước
        const aiMessage: Message = {
          id: `ai-hint-${Date.now()}`,
          role: 'assistant',
          content: `Tôi hiểu bạn muốn: "${userText}". Vui lòng nhấn microphone và nói với tôi để bắt đầu đặt lịch. Bạn có thể nói như: "Tôi muốn ${userText}"`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error('Error sending text:', err);
      const aiMessage: Message = {
        id: `ai-error-${Date.now()}`,
        role: 'assistant',
        content: 'Có lỗi xảy ra. Vui lòng thử lại.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsSendingText(false);
      setAiThinking(false);
    }
  };

  // Handler nhấn Enter để gửi
  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Quay về trang chủ
  const handleGoHome = () => {
    navigate('/customer/dashboard');
  };

  // Đặt lịch mới
  const handleBookAgain = () => {
    setShowSuccessModal(false);
    handleReset();
  };

  const playAudio = useCallback(async (url: string, messageId?: string) => {
    if (!url) {
      console.warn('[VoiceBooking] No audio URL to play');
      // Nếu không có audio, kiểm tra hiển thị popup ngay
      if (status === 'AWAITING_CONFIRMATION' && preview) {
        setShowPreview(true);
      }
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      console.warn('[VoiceBooking] Invalid audio URL:', url);
      // Nếu URL không hợp lệ, vẫn hiển thị popup nếu cần
      if (status === 'AWAITING_CONFIRMATION' && preview) {
        setShowPreview(true);
      }
      return;
    }
    
    console.log('[VoiceBooking] Playing audio:', url);
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    const audio = new Audio(url);
    audioPlayerRef.current = audio;
    setIsPlayingAudio(true);

    if (messageId) {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isPlaying: true } : { ...msg, isPlaying: false }
      ));
    }

    audio.onloadeddata = () => {
      console.log('[VoiceBooking] Audio loaded, duration:', audio.duration);
    };

    audio.onended = () => {
      console.log('[VoiceBooking] Audio playback ended');
      setIsPlayingAudio(false);
      if (messageId) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isPlaying: false } : msg
        ));
      }
      // Sau khi audio kết thúc, kiểm tra hiển thị popup xác nhận
      // Dùng setTimeout để đảm bảo state đã cập nhật
      setTimeout(() => {
        // Kiểm tra status từ currentResponse hoặc state mới nhất
        if (status === 'AWAITING_CONFIRMATION' && preview && !showPreview) {
          setShowPreview(true);
        }
      }, 300);
    };

    audio.onerror = () => {
      setIsPlayingAudio(false);
      console.warn('[VoiceBooking] Audio playback failed, URL may be invalid:', url);
      // Graceful fallback - vẫn hiển thị popup nếu cần
      if (status === 'AWAITING_CONFIRMATION' && preview) {
        setShowPreview(true);
      }
    };

    try {
      await audio.play();
      console.log('[VoiceBooking] Audio started playing');
    } catch (err) {
      console.warn('[VoiceBooking] Could not play audio:', err);
      setIsPlayingAudio(false);
      // Graceful fallback - message text is still displayed, hiển thị popup
      if (status === 'AWAITING_CONFIRMATION' && preview) {
        setShowPreview(true);
      }
    }
  }, [status, preview, showPreview]);

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
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white px-3 sm:px-5 py-2 text-sm font-semibold text-brand-teal shadow-lg shadow-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Quay lại</span>
        </button>
      }
    >
      <div className="mx-auto max-w-6xl min-h-[400px] sm:min-h-[500px] flex flex-col">
        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto rounded-2xl sm:rounded-3xl bg-gradient-to-b from-white to-sky-50/30 p-3 sm:p-4 md:p-8 mb-3 sm:mb-4 shadow-inner min-h-[250px] sm:min-h-[300px] max-h-[45vh] sm:max-h-[50vh]">
          <div className="max-w-5xl mx-auto space-y-3 sm:space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex items-start gap-2 sm:gap-3 max-w-[95%] sm:max-w-[90%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-brand-teal to-sky-500' 
                      : 'bg-gradient-to-br from-violet-500 to-purple-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-full ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-brand-teal to-sky-500 text-white'
                          : 'bg-white border border-brand-outline/20 text-brand-navy shadow-sm'
                      }`}
                    >
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    
                    {/* Audio Indicator & Timestamp */}
                    <div className="flex items-center gap-2 mt-1.5 px-2">
                      {message.audioUrl && message.role === 'assistant' && (
                        <button
                          onClick={() => playAudio(message.audioUrl!, message.id)}
                          className="text-xs text-brand-text/60 hover:text-brand-teal transition flex items-center gap-1"
                        >
                          <Volume2 className={`h-3 w-3 ${message.isPlaying ? 'animate-pulse text-brand-teal' : ''}`} />
                          {message.isPlaying ? 'Đang phát...' : 'Nghe lại'}
                        </button>
                      )}
                      <span className="text-xs text-brand-text/40">
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

        {/* Siri-like Preview Card - Floating Overlay */}
        {showPreview && preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md animate-fade-in p-4">
            <div className="w-full max-w-2xl animate-scale-in">
              {/* Siri-style Card */}
              <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-200">
                
                {/* Header - Compact */}
                <div className="relative px-6 pt-5 pb-3 text-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                  <div className="relative mx-auto mb-2">
                    <div className="absolute inset-0 mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal via-sky-400 to-purple-500 blur-lg opacity-50"></div>
                    <div className="relative w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-brand-teal via-sky-400 to-purple-500 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-brand-navy">Xác nhận đặt lịch</h3>
                </div>

                {/* Content - Grid layout */}
                <div className="relative px-3 sm:px-4 py-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Time Card */}
                    {preview.bookingTime && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/80 border border-purple-100">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-brand-text/50 uppercase tracking-wider">Thời gian</p>
                          <p className="text-sm font-semibold text-brand-navy">
                            {new Date(preview.bookingTime).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} {new Date(preview.bookingTime).toLocaleDateString('vi-VN', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Services Card */}
                    {preview.services && preview.services.length > 0 && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-100">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-brand-text/50 uppercase tracking-wider">Dịch vụ ({preview.services.length})</p>
                          <div className="text-sm font-semibold text-brand-navy">
                            {preview.services.map((s, i) => (
                              <span key={i}>
                                {s.serviceName || `#${s.serviceId}`}
                                <span className="text-brand-text/50 font-normal"> x{s.quantity || 1}</span>
                                {i < preview.services.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Address Card - Full width */}
                    {(preview.address || preview.ward || preview.city) && (
                      <div className="col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-sky-50/80 border border-sky-100">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-teal to-sky-500 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-brand-text/50 uppercase tracking-wider">Địa chỉ</p>
                          <p className="text-sm font-semibold text-brand-navy break-words">
                            {(() => {
                              // Xử lý address có thể là string hoặc object
                              let addressStr = '';
                              if (typeof preview.address === 'string') {
                                addressStr = preview.address;
                              } else if (preview.address && typeof preview.address === 'object') {
                                const addr = preview.address as any;
                                addressStr = addr.fullAddress || addr.address || addr.street || '';
                              }
                              
                              // Nếu address đã chứa ward/city thì không cần thêm
                              if (addressStr && (addressStr.includes(preview.ward || '') || addressStr.includes(preview.city || ''))) {
                                return addressStr || 'Chưa có địa chỉ';
                              }
                              
                              return [addressStr, preview.ward, preview.city].filter(Boolean).join(', ') || 'Chưa có địa chỉ';
                            })()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Payment Method Card */}
                    {preview.paymentMethodId && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm">💳</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-brand-text/50 uppercase tracking-wider">Thanh toán</p>
                          <p className="text-sm font-semibold text-brand-navy">
                            {preview.paymentMethodId === 1 ? 'Tiền mặt' : 
                             preview.paymentMethodId === 2 ? 'Chuyển khoản' : 
                             preview.paymentMethodId === 3 ? 'Ví điện tử' : 
                             `Phương thức #${preview.paymentMethodId}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Employee Card */}
                    {preview.employees && preview.employees.length > 0 && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-green-50/80 border border-green-100">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-brand-text/50 uppercase tracking-wider">
                            Nhân viên {preview.autoAssignedEmployees && <span className="text-green-600">✨</span>}
                          </p>
                          <p className="text-sm font-semibold text-brand-navy break-words">
                            {preview.employees.map(e => e.fullName).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Note Card */}
                    {preview.note && (
                      <div className="col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/80 border border-blue-100">
                        <MessageCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-brand-navy break-words">{preview.note}</p>
                      </div>
                    )}

                    {/* Promo Code */}
                    {preview.promoCode && (
                      <div className="col-span-2 flex items-center gap-2 p-2 rounded-xl bg-pink-50/80 border border-pink-100">
                        <span className="text-pink-500 font-bold">%</span>
                        <p className="text-sm font-semibold text-pink-600">{preview.promoCode}</p>
                      </div>
                    )}
                  </div>

                  {/* Total Section */}
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-brand-teal to-sky-500">
                    <div className="flex justify-between items-center">
                      <span className="text-white/90 font-medium">Tổng cộng</span>
                      <span className="text-2xl font-bold text-white">{preview.totalAmountFormatted || `${preview.totalAmount?.toLocaleString('vi-VN')}đ`}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="relative px-3 sm:px-4 pb-5 pt-1 flex flex-col sm:flex-row gap-3 bg-white">
                  <button
                    onClick={handleCancel}
                    disabled={confirmingBooking}
                    className="flex-1 h-11 sm:h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2 font-semibold text-brand-navy transition-all active:scale-95 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={confirmingBooking}
                    className="flex-[2] h-11 sm:h-12 rounded-xl bg-gradient-to-r from-brand-teal to-sky-500 hover:from-brand-teal/90 hover:to-sky-500/90 flex items-center justify-center gap-2 font-bold text-white shadow-lg shadow-brand-teal/30 transition-all active:scale-95 disabled:opacity-70"
                  >
                    {confirmingBooking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Xác nhận đặt lịch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal - Siri Celebration Style */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl shadow-2xl border border-white/50">
                {/* Celebration Background */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-teal/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }}></div>
                </div>
                
                {/* Content */}
                <div className="relative px-6 py-8 text-center">
                  {/* Success Animation */}
                  <div className="relative mx-auto mb-4">
                    {/* Glow effect */}
                    <div className="absolute inset-0 mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 blur-2xl opacity-50 animate-pulse"></div>
                    {/* Ring animations */}
                    <div className="absolute inset-0 mx-auto w-20 h-20 rounded-full border-4 border-green-400/30 animate-ping"></div>
                    <div className="absolute inset-0 mx-auto w-20 h-20 rounded-full border-2 border-green-400/50 animate-pulse"></div>
                    {/* Main circle */}
                    <div className="relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl animate-bounce-slow">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  
                  {/* Party Icon */}
                  <div className="absolute top-6 right-6 animate-bounce">
                    <PartyPopper className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="absolute top-10 left-6 animate-bounce" style={{ animationDelay: '200ms' }}>
                    <Sparkles className="h-5 w-5 text-brand-teal" />
                  </div>

                  <h2 className="text-xl font-bold text-brand-navy mb-1">Đặt lịch thành công!</h2>
                  <p className="text-sm text-brand-text/70 mb-3">Cảm ơn bạn đã sử dụng dịch vụ Home Mate</p>
                  
                  {bookingId && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 mb-4">
                      <span className="text-xs text-green-700">Mã đơn:</span>
                      <span className="text-xs font-bold text-green-800">{bookingId}</span>
                    </div>
                  )}

                  {/* Booking Details Card */}
                  {loadingBookingDetails ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
                      <span className="ml-2 text-sm text-brand-text/70">Đang tải thông tin...</span>
                    </div>
                  ) : confirmedBookingDetails && (
                    <div className="mt-4 text-left space-y-3">
                      {/* Thời gian */}
                      <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100">
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-blue-800">Thời gian</p>
                            <p className="text-sm text-blue-700">
                              {confirmedBookingDetails.bookingTime 
                                ? new Date(confirmedBookingDetails.bookingTime).toLocaleString('vi-VN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : `${confirmedBookingDetails.scheduledDate} - ${confirmedBookingDetails.scheduledTime}`
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Địa chỉ */}
                      <div className="p-3 rounded-2xl bg-orange-50/80 border border-orange-100">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-orange-800">Địa chỉ</p>
                            <p className="text-sm text-orange-700 break-words">
                              {/* address có thể là string hoặc object */}
                              {typeof confirmedBookingDetails.address === 'string' 
                                ? confirmedBookingDetails.address 
                                : (confirmedBookingDetails.address as any)?.fullAddress || 
                                  [
                                    (confirmedBookingDetails.address as any)?.ward,
                                    (confirmedBookingDetails.address as any)?.city
                                  ].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dịch vụ - Hỗ trợ cả serviceDetails và bookingDetails */}
                      {(() => {
                        const details = confirmedBookingDetails.serviceDetails || (confirmedBookingDetails as any).bookingDetails;
                        if (!details || details.length === 0) return null;
                        
                        return (
                          <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-100">
                            <div className="flex items-start gap-2">
                              <ShoppingBag className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-purple-800 mb-1">Dịch vụ</p>
                                {details.map((item: any, idx: number) => {
                                  // Lấy tên và giá từ cả 2 cấu trúc
                                  const serviceName = item.serviceName || item.service?.name || 'Dịch vụ';
                                  const price = item.formattedPrice || item.formattedSubTotal || item.formattedPricePerUnit ||
                                    `${(item.price || item.subTotal || item.pricePerUnit || 0).toLocaleString('vi-VN')}đ`;
                                  const quantity = item.quantity || 1;
                                  
                                  return (
                                    <div key={idx} className="flex justify-between items-center text-sm text-purple-700">
                                      <span className="break-words">{serviceName} {quantity > 1 ? `x${quantity}` : ''}</span>
                                      <span className="font-medium ml-2 flex-shrink-0">{price}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Nhân viên - Hỗ trợ cả assignedEmployees và bookingDetails.assignments */}
                      {(() => {
                        // Lấy employees từ nhiều nguồn
                        let employees: any[] = [];
                        
                        if (confirmedBookingDetails.assignedEmployees && confirmedBookingDetails.assignedEmployees.length > 0) {
                          employees = confirmedBookingDetails.assignedEmployees;
                        } else if ((confirmedBookingDetails as any).bookingDetails) {
                          // Lấy từ bookingDetails.assignments
                          (confirmedBookingDetails as any).bookingDetails.forEach((detail: any) => {
                            if (detail.assignments) {
                              detail.assignments.forEach((assignment: any) => {
                                if (assignment.employee) {
                                  employees.push({
                                    employeeName: assignment.employee.fullName,
                                    phoneNumber: assignment.employee.phoneNumber,
                                    avatar: assignment.employee.avatar
                                  });
                                }
                              });
                            }
                          });
                        }
                        
                        if (employees.length === 0) return null;
                        
                        return (
                          <div className="p-3 rounded-2xl bg-cyan-50/80 border border-cyan-100">
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-xs font-medium text-cyan-800 mb-1">Nhân viên phục vụ</p>
                                {employees.map((emp: any, idx: number) => (
                                  <div key={idx} className="text-sm text-cyan-700">
                                    {emp.employeeName || emp.fullName}
                                    {emp.phoneNumber && <span className="text-cyan-600 ml-1">({emp.phoneNumber})</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Tổng tiền */}
                      <div className="p-3 rounded-2xl bg-green-50/80 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">Tổng thanh toán</span>
                          <span className="text-lg font-bold text-green-700">
                            {confirmedBookingDetails.formattedTotalAmount || 
                             `${(confirmedBookingDetails.totalAmount || confirmedBookingDetails.totalPrice || 0).toLocaleString('vi-VN')}đ`}
                          </span>
                        </div>
                        {/* Hỗ trợ cả paymentInfo và payment */}
                        {(confirmedBookingDetails.paymentInfo || (confirmedBookingDetails as any).payment) && (
                          <div className="mt-1 text-xs text-green-600">
                            {(() => {
                              const payment = confirmedBookingDetails.paymentInfo || (confirmedBookingDetails as any).payment;
                              const methodName = payment.methodName || payment.paymentMethod || '';
                              const status = payment.status || payment.paymentStatus || '';
                              return `Thanh toán: ${methodName} • ${status}`;
                            })()}
                          </div>
                        )}
                      </div>

                      {/* Ghi chú */}
                      {(confirmedBookingDetails.notes || confirmedBookingDetails.note) && (
                        <div className="p-3 rounded-2xl bg-gray-50/80 border border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">Ghi chú</p>
                          <p className="text-sm text-gray-700 break-words">
                            {confirmedBookingDetails.notes || confirmedBookingDetails.note}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-5">
                    <button
                      onClick={handleGoHome}
                      className="flex-1 h-11 rounded-2xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2 font-semibold text-brand-navy transition-all active:scale-95"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Về trang chủ</span>
                    </button>
                    <button
                      onClick={handleBookAgain}
                      className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-brand-teal to-sky-500 hover:from-brand-teal/90 hover:to-sky-500/90 flex items-center justify-center gap-2 font-bold text-white shadow-lg shadow-brand-teal/30 transition-all active:scale-95"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Đặt lịch mới</span>
                    </button>
                  </div>

                  {/* Optional: View booking button */}
                  <button
                    onClick={() => navigate('/customer/orders')}
                    className="mt-3 text-sm text-brand-teal hover:text-brand-teal/80 font-medium underline underline-offset-2 transition"
                  >
                    Xem tất cả đơn hàng →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Missing Fields Hint - Hiển thị khi có trường cần bổ sung */}
        {showMissingFieldsHint && missingFields.length > 0 && (
          <div className="mb-4 rounded-2xl bg-amber-50/80 p-4 md:p-5 border border-amber-200/50 animate-fade-in max-w-5xl mx-auto w-full">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 mb-2">Cần bổ sung thông tin:</h4>
                <div className="flex flex-wrap gap-2">
                  {missingFields.map((field, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-100 text-xs md:text-sm font-medium text-amber-800 border border-amber-200"
                    >
                      {field === 'service' && '🏠 Dịch vụ'}
                      {field === 'address' && '📍 Địa chỉ'}
                      {field === 'bookingTime' && '🕐 Thời gian'}
                      {field === 'quantity' && '🔢 Số lượng'}
                      {!['service', 'address', 'bookingTime', 'quantity'].includes(field) && field}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-amber-700/80 mt-2">
                  Hãy nói hoặc nhập thêm thông tin bên dưới
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Voice Control - Bottom Fixed */}
        <div className="bg-white rounded-3xl shadow-elevation-md p-5 md:p-8 border border-brand-outline/20 max-w-5xl mx-auto w-full">
          {/* Text Input Area - Cho phép nhập text bổ sung */}
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  ref={textInputRef}
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleTextKeyDown}
                  placeholder={
                    currentRequestId && (status === 'PARTIAL' || status === 'AWAITING_CONFIRMATION')
                      ? 'Nhập thêm thông tin cần bổ sung...' 
                      : 'Nhấn mic để nói trước, sau đó có thể nhập text bổ sung'
                  }
                  disabled={isRecording || isSendingText || status === 'COMPLETED'}
                  className="w-full h-12 md:h-14 pl-12 pr-4 rounded-2xl border border-brand-outline/30 bg-gray-50/50 text-sm md:text-base text-brand-navy placeholder:text-brand-text/40 focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal disabled:opacity-50 disabled:cursor-not-allowed transition"
                />
                <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text/40" />
              </div>
              <button
                onClick={handleSendText}
                disabled={!textInput.trim() || isSendingText || isRecording || status === 'COMPLETED'}
                className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-r from-brand-teal to-sky-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!currentRequestId ? 'Nhấn mic để nói trước' : 'Gửi tin nhắn'}
              >
                {isSendingText ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            {/* Hint text khi chưa có requestId */}
            {!currentRequestId && !status && (
              <p className="mt-2 text-xs text-brand-text/50 text-center">
                💡 Tip: Nhấn microphone và nói để bắt đầu đặt lịch. Sau đó bạn có thể nhập text để bổ sung thông tin.
              </p>
            )}
          </div>

          {/* Divider với text */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-outline/20"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-brand-text/50">hoặc</span>
            </div>
          </div>

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
              {status === 'PARTIAL' && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Cần bổ sung</span>
                </div>
              )}
              {status === 'AWAITING_CONFIRMATION' && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-brand-teal">
                  <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Sẵn sàng</span>
                </div>
              )}
            </div>

            {/* Voice Button */}
            <div className="flex-1 flex justify-center">
              {isRecording ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <span className={`absolute inline-flex h-20 w-20 md:h-24 md:w-24 animate-ping rounded-full ${
                      recordingTime >= 18 ? 'bg-orange-400' : 'bg-red-400'
                    } opacity-75`}></span>
                    <button
                      onClick={handleStopRecordingAndSend}
                      className={`relative flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-gradient-to-br ${
                        recordingTime >= 18 
                          ? 'from-orange-500 to-orange-600' 
                          : 'from-red-500 to-red-600'
                      } text-white shadow-2xl transition-transform hover:scale-105 active:scale-95`}
                    >
                      <MicOff className="h-8 w-8 md:h-10 md:w-10" />
                    </button>
                  </div>
                  <div className={`flex items-center gap-2 ${recordingTime >= 18 ? 'text-orange-600' : 'text-red-600'}`}>
                    <div className={`h-2.5 w-2.5 rounded-full ${recordingTime >= 18 ? 'bg-orange-600' : 'bg-red-600'} animate-pulse`}></div>
                    <span className="text-sm md:text-base font-bold">{formatTime(recordingTime)}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStartRecording}
                  disabled={isLoading || aiThinking || isPlayingAudio || status === 'COMPLETED' || isSendingText}
                  className="relative flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-sky-500 text-white shadow-2xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlayingAudio ? (
                    <Volume2 className="h-8 w-8 md:h-10 md:w-10 animate-pulse" />
                  ) : (
                    <>
                      <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-brand-teal/30 opacity-75"></span>
                      <Mic className="relative h-8 w-8 md:h-10 md:w-10" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Play Recording Button - chỉ hiện khi có audio đã ghi */}
            {audioBlob && audioBlob.size > 0 && !isRecording && (
              <button
                onClick={isPlayingRecording ? stopPlayingRecording : playRecording}
                disabled={isLoading || aiThinking}
                className={`inline-flex items-center gap-2 rounded-full px-4 md:px-5 py-3 text-xs md:text-sm font-semibold transition min-w-[70px] md:min-w-[90px] justify-center ${
                  isPlayingRecording 
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isPlayingRecording ? 'Dừng phát' : 'Nghe lại bản ghi'}
              >
                {isPlayingRecording ? (
                  <>
                    <Volume2 className="h-4 w-4 animate-pulse" />
                    <span className="hidden sm:inline">Đang phát</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Nghe lại</span>
                  </>
                )}
              </button>
            )}

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={isRecording || isLoading || isSendingText}
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 md:px-5 py-3 text-xs md:text-sm font-semibold text-brand-navy transition hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[70px] md:min-w-[90px] justify-center"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Mới</span>
            </button>
          </div>

          {/* Audio Info - hiển thị thông tin blob */}
          {audioBlob && audioBlob.size > 0 && !isRecording && (
            <div className="mt-2 text-center text-xs text-gray-500">
              Đã ghi: {(audioBlob.size / 1024).toFixed(1)} KB
            </div>
          )}

          {/* Status Text */}
          <div className="mt-4 text-center">
            {isRecording ? (
              <div className="flex flex-col gap-1">
                <p className="text-sm md:text-base text-red-600 font-medium">
                  Đang lắng nghe... {recordingTime >= 18 ? 'Sắp hết thời gian!' : 'Nhấn để gửi'}
                </p>
                <p className="text-xs text-brand-text/60">
                  {recordingTime >= 18 
                    ? `Sẽ tự động dừng sau ${20 - recordingTime}s` 
                    : 'Tự động dừng khi bạn im lặng 2s hoặc sau 20s'}
                </p>
              </div>
            ) : isPlayingAudio ? (
              <p className="text-sm text-brand-teal font-medium flex items-center justify-center gap-2">
                <Volume2 className="h-4 w-4 animate-pulse" />
                AI đang trả lời...
              </p>
            ) : aiThinking || isLoading || isSendingText ? (
              <p className="text-sm text-brand-text/60 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI đang xử lý...
              </p>
            ) : status === 'COMPLETED' ? (
              <p className="text-sm text-green-600 font-medium">✓ Đặt lịch thành công!</p>
            ) : status === 'AWAITING_CONFIRMATION' ? (
              <p className="text-sm text-brand-teal font-medium">✓ Thông tin đầy đủ - Nhấn xác nhận ở trên</p>
            ) : status === 'PARTIAL' ? (
              <p className="text-sm text-amber-600 font-medium">Vui lòng bổ sung thông tin còn thiếu</p>
            ) : (
              <p className="text-sm text-brand-text/60">Nhấn microphone để nói hoặc nhập tin nhắn</p>
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
