import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createVoiceBookingApi,
  continueVoiceBookingApi,
  confirmVoiceBookingApi,
  cancelVoiceBookingApi,
  getVoiceBookingApi,
  getVoiceBookingStatusApi,
  type VoiceBookingResponse
} from '../api/voiceBooking';
import SockJS from 'sockjs-client';
import { Client, type IMessage } from '@stomp/stompjs';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080';

export interface VoiceBookingEventPayload {
  requestId: string;
  status: 'PROCESSING' | 'PARTIAL' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  event: 'RECEIVED' | 'TRANSCRIBING' | 'PARTIAL' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  transcript?: string | null;
  processingTimeMs?: number | null;
  confidenceScore?: number | null;
  missingFields?: string[] | null;
  clarificationMessage?: string | null;
  preview?: any;
  bookingId?: string | null;
  message: string;
  speech?: any;
  hints?: string[] | null;
  aiPrompt?: string | null;
  errorDetails?: string | null;
}

export const useVoiceBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<VoiceBookingResponse | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [autoStopReason, setAutoStopReason] = useState<'silence' | 'max-duration' | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const wsClientRef = useRef<Client | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const maxDurationTimeoutRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Silence detection config
  const SILENCE_THRESHOLD = 0.01; // Độ nhạy phát hiện im lặng (0-1)
  const SILENCE_DURATION = 2000; // 2 giây im lặng thì auto-stop
  const MAX_RECORDING_DURATION = 20000; // Tối đa 20 giây mỗi lượt

  /**
   * Kết nối WebSocket để nhận realtime updates
   */
  const connectWebSocket = useCallback((requestId: string, onEvent: (event: VoiceBookingEventPayload) => void) => {
    if (wsClientRef.current?.connected) {
      wsClientRef.current.deactivate();
    }

    const socket = new SockJS(`${WS_BASE_URL}/ws/voice-booking`);
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('[VoiceBooking WS]', str);
      },
      onConnect: () => {
        console.log('[VoiceBooking WS] Connected');
        setWsConnected(true);

        // Subscribe to voice booking topic
        client.subscribe(`/topic/voice-booking/${requestId}`, (message: IMessage) => {
          const payload: VoiceBookingEventPayload = JSON.parse(message.body);
          console.log('[VoiceBooking WS] Event received:', payload);
          onEvent(payload);
        });
      },
      onDisconnect: () => {
        console.log('[VoiceBooking WS] Disconnected');
        setWsConnected(false);
      },
      onStompError: (frame) => {
        console.error('[VoiceBooking WS] Error:', frame);
        setWsConnected(false);
      }
    });

    client.activate();
    wsClientRef.current = client;

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.deactivate();
        wsClientRef.current = null;
      }
    };
  }, []);

  /**
   * Disconnect WebSocket
   */
  const disconnectWebSocket = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.deactivate();
      wsClientRef.current = null;
      setWsConnected(false);
    }
  }, []);

  /**
   * Phát hiện im lặng trong audio stream
   */
  const detectSilence = useCallback((stream: MediaStream, onSilence: () => void) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    microphone.connect(analyser);
    analyser.fftSize = 2048;

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    let silenceStart = Date.now();
    let isSpeaking = false;

    const checkAudioLevel = () => {
      if (!analyserRef.current || !isRecording) return;

      analyser.getByteTimeDomainData(dataArray);

      // Tính volume trung bình
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const volume = Math.sqrt(sum / dataArray.length);

      // Phát hiện có tiếng nói
      if (volume > SILENCE_THRESHOLD) {
        isSpeaking = true;
        silenceStart = Date.now();
        
        // Clear timeout nếu đang có
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      } else if (isSpeaking) {
        // Đã nói rồi, giờ im lặng
        const silenceDuration = Date.now() - silenceStart;
        
        if (silenceDuration >= SILENCE_DURATION) {
          // Im lặng đủ lâu → auto-stop
          console.log('[VoiceBooking] Silence detected, auto-stopping...');
          setAutoStopReason('silence');
          onSilence();
          return;
        }
      }

      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }, [isRecording, SILENCE_THRESHOLD, SILENCE_DURATION]);

  /**
   * Bắt đầu ghi âm với auto-stop
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        if (maxDurationTimeoutRef.current) {
          clearTimeout(maxDurationTimeoutRef.current);
          maxDurationTimeoutRef.current = null;
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setError(null);

      // Auto-stop khi phát hiện im lặng
      detectSilence(stream, () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      });

      // Auto-stop sau max duration
      maxDurationTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('[VoiceBooking] Max duration reached, auto-stopping...');
          setAutoStopReason('max-duration');
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, MAX_RECORDING_DURATION);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm.');
    }
  }, [detectSilence, MAX_RECORDING_DURATION]);

  /**
   * Dừng ghi âm
   */
  const stopRecording = useCallback(() => {
    setAutoStopReason(null); // Reset auto-stop reason
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Cleanup timers
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
        maxDurationTimeoutRef.current = null;
      }
    }
  }, [isRecording]);

  /**
   * Tạo voice booking mới
   */
  const createVoiceBooking = useCallback(async (
    audio: File | Blob,
    hints?: Record<string, any>
  ): Promise<VoiceBookingResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const audioFile = audio instanceof File ? audio : new File([audio], 'recording.webm', { type: 'audio/webm' });
      const response = await createVoiceBookingApi(audioFile, hints);
      setCurrentResponse(response);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tạo yêu cầu đặt lịch';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Bổ sung thông tin
   */
  const continueVoiceBooking = useCallback(async (
    requestId: string,
    audio?: File | Blob,
    additionalText?: string,
    explicitFields?: Record<string, any>
  ): Promise<VoiceBookingResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const audioFile = audio 
        ? (audio instanceof File ? audio : new File([audio], 'recording.webm', { type: 'audio/webm' }))
        : undefined;
      
      const response = await continueVoiceBookingApi(requestId, audioFile, additionalText, explicitFields);
      setCurrentResponse(response);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể bổ sung thông tin';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Xác nhận booking
   */
  const confirmVoiceBooking = useCallback(async (requestId: string): Promise<VoiceBookingResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await confirmVoiceBookingApi(requestId);
      setCurrentResponse(response);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xác nhận đặt lịch';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Hủy booking
   */
  const cancelVoiceBooking = useCallback(async (requestId: string): Promise<VoiceBookingResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await cancelVoiceBookingApi(requestId);
      setCurrentResponse(response);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể hủy đặt lịch';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Lấy chi tiết voice booking
   */
  const getVoiceBooking = useCallback(async (requestId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getVoiceBookingApi(requestId);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thông tin';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Kiểm tra trạng thái dịch vụ
   */
  const checkVoiceBookingStatus = useCallback(async () => {
    try {
      const response = await getVoiceBookingStatusApi();
      return response;
    } catch (err: any) {
      console.error('Error checking voice booking status:', err);
      return { enabled: false };
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setCurrentResponse(null);
    setError(null);
    setAudioBlob(null);
    setIsRecording(false);
    disconnectWebSocket();
  }, [disconnectWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
    };
  }, [disconnectWebSocket, isRecording]);

  return {
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
    getVoiceBooking,
    checkVoiceBookingStatus,
    connectWebSocket,
    disconnectWebSocket,
    reset
  };
};
