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
import { getAccessToken } from '../shared/utils/authUtils';
import SockJS from 'sockjs-client';
import { Client, type IMessage } from '@stomp/stompjs';

// WS_BASE_URL đã bao gồm /ws nên chỉ cần thêm path sau
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080/ws';

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
  // Analyser ref - kept for future use with auto-stop feature
  const analyserRef = useRef<AnalyserNode | null>(null); void analyserRef; // Suppress unused warning
  const silenceTimeoutRef = useRef<number | null>(null);
  const maxDurationTimeoutRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // TẮT auto-stop - Silence detection config (không sử dụng)
  // const SILENCE_THRESHOLD = 0.005; // Giảm ngưỡng để dễ detect tiếng nói hơn (0-1)
  // const SILENCE_DURATION = 2500; // 2.5 giây im lặng thì auto-stop (sau khi đã nói)
  // const MIN_RECORDING_BEFORE_SILENCE = 1500; // Phải ghi ít nhất 1.5s trước khi check silence
  // const MAX_RECORDING_DURATION = 60000; // Tối đa 60 giây mỗi lượt

  /**
   * Kết nối WebSocket để nhận realtime updates
   */
  const connectWebSocket = useCallback((requestId: string, onEvent: (event: VoiceBookingEventPayload) => void) => {
    if (wsClientRef.current?.connected) {
      wsClientRef.current.deactivate();
    }

    // Lấy access token để authenticate WebSocket
    const token = getAccessToken();
    
    // WS_BASE_URL đã có /ws, chỉ cần thêm /voice-booking
    // Thêm token vào query params để authenticate
    const wsUrl = token 
      ? `${WS_BASE_URL}/voice-booking?token=${encodeURIComponent(token)}`
      : `${WS_BASE_URL}/voice-booking`;
    
    console.log('[VoiceBooking WS] Connecting to:', wsUrl.replace(/token=.*/, 'token=***'));
    
    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // Thêm token vào STOMP connect headers
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
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

  // TẮT AUTO-STOP - Hàm detectSilence đã được comment out
  // Giờ user tự kiểm soát khi nào dừng ghi âm
  /*
  const detectSilence = useCallback((stream: MediaStream, onSilence: () => void) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    microphone.connect(analyser);
    analyser.fftSize = 2048;

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const recordingStartTime = Date.now();
    let silenceStart: number | null = null;
    let hasDetectedSpeech = false;
    let peakVolume = 0;

    const checkAudioLevel = () => {
      if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        return;
      }

      analyser.getByteTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const volume = Math.sqrt(sum / dataArray.length);
      
      if (volume > peakVolume) {
        peakVolume = volume;
      }

      const timeSinceStart = Date.now() - recordingStartTime;

      if (volume > SILENCE_THRESHOLD) {
        hasDetectedSpeech = true;
        silenceStart = null;
        
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      } else if (hasDetectedSpeech && timeSinceStart > MIN_RECORDING_BEFORE_SILENCE) {
        if (silenceStart === null) {
          silenceStart = Date.now();
        }
        
        const silenceDuration = Date.now() - silenceStart;
        
        if (silenceDuration >= SILENCE_DURATION) {
          console.log('[VoiceBooking] Silence detected after speech, auto-stopping...', {
            peakVolume,
            totalRecordingTime: timeSinceStart,
            silenceDuration
          });
          setAutoStopReason('silence');
          onSilence();
          return;
        }
      }

      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }, [SILENCE_THRESHOLD, SILENCE_DURATION, MIN_RECORDING_BEFORE_SILENCE]);
  */

  /**
   * Bắt đầu ghi âm - User tự kiểm soát khi nào dừng
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Thêm constraints để giữ stream ổn định
          channelCount: 1,
          sampleRate: 48000
        } 
      });
      streamRef.current = stream;
      
      // Lắng nghe sự kiện track ended để debug
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('[VoiceBooking] Audio track settings:', audioTrack.getSettings());
        console.log('[VoiceBooking] Audio track state:', audioTrack.readyState);
        
        audioTrack.onended = () => {
          console.warn('[VoiceBooking] ⚠️ Audio track ended unexpectedly!');
          // Nếu track bị tắt bất ngờ, dừng recording và thông báo
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('[VoiceBooking] Stopping recorder due to track ended');
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        };
        
        audioTrack.onmute = () => {
          console.warn('[VoiceBooking] ⚠️ Audio track muted!');
        };
        
        audioTrack.onunmute = () => {
          console.log('[VoiceBooking] Audio track unmuted');
        };
      }
      
      // TẠO AudioContext để giữ cho microphone stream ACTIVE
      // Điều này ngăn trình duyệt tự động tắt mic khi không có hoạt động
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume AudioContext nếu bị suspended (browser policy)
      if (audioContext.state === 'suspended') {
        console.log('[VoiceBooking] AudioContext suspended, resuming...');
        await audioContext.resume();
      }
      
      const source = audioContext.createMediaStreamSource(stream);
      
      // Tạo một ScriptProcessor để keep stream alive (thay vì chỉ GainNode)
      // ScriptProcessor buộc browser phải xử lý audio data liên tục
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessor.onaudioprocess = () => {
        // Không làm gì, chỉ để giữ stream active
      };
      
      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      
      console.log('[VoiceBooking] AudioContext created and active, state:', audioContext.state);
      
      // Kiểm tra các codec được hỗ trợ
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      
      console.log('[VoiceBooking] Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      // Reset chunks và audioBlob trước khi bắt đầu recording mới
      audioChunksRef.current = [];
      setAudioBlob(null);
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('[VoiceBooking] Data available:', event.data.size, 'bytes, chunks so far:', audioChunksRef.current.length + 1);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Lắng nghe lỗi của MediaRecorder
      mediaRecorder.onerror = (event) => {
        console.error('[VoiceBooking] MediaRecorder error:', event);
      };

      mediaRecorder.onstop = () => {
        console.log('[VoiceBooking] Recording stopped, chunks:', audioChunksRef.current.length);
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('[VoiceBooking] Final blob size:', blob.size, 'bytes');
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

      // Start với timeslice 500ms để ghi dữ liệu theo chunks thường xuyên
      // Điều này đảm bảo không mất data nếu recording bị dừng đột ngột
      mediaRecorder.start(500);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setError(null);
      
      console.log('[VoiceBooking] Recording started with timeslice 500ms');

      // TẮT auto-stop - để user tự kiểm soát khi nào dừng ghi âm
      // detectSilence(stream, () => {
      //   if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      //     mediaRecorderRef.current.stop();
      //     setIsRecording(false);
      //   }
      // });

      // TẮT auto-stop sau max duration
      // maxDurationTimeoutRef.current = window.setTimeout(() => {
      //   if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      //     console.log('[VoiceBooking] Max duration reached, auto-stopping...');
      //     setAutoStopReason('max-duration');
      //     mediaRecorderRef.current.stop();
      //     setIsRecording(false);
      //   }
      // }, MAX_RECORDING_DURATION);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Không thể truy cập microphone. Vui lòng cho phép quyền ghi âm.');
    }
  }, []);

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
      // Log chi tiết audio để debug
      console.log('[VoiceBooking] Creating voice booking with audio:', {
        type: audio.type,
        size: audio.size,
        isFile: audio instanceof File,
        name: audio instanceof File ? audio.name : 'blob'
      });
      
      const audioFile = audio instanceof File ? audio : new File([audio], 'recording.webm', { type: audio.type || 'audio/webm' });
      
      console.log('[VoiceBooking] Audio file to send:', {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      });
      
      const response = await createVoiceBookingApi(audioFile, hints);
      setCurrentResponse(response);
      return response;
    } catch (err: any) {
      // Log chi tiết lỗi
      console.error('[VoiceBooking] Create error details:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message
      });
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

  // Cleanup on unmount - CHỈ chạy khi component unmount, KHÔNG phụ thuộc vào isRecording
  useEffect(() => {
    return () => {
      console.log('[VoiceBooking] Cleanup on unmount');
      disconnectWebSocket();
      // Sử dụng ref thay vì state để tránh closure stale
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('[VoiceBooking] Stopping recorder on unmount');
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
  }, []); // Chỉ chạy một lần khi mount/unmount

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
