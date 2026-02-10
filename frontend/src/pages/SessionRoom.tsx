import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../lib/api/index';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSessionSocket } from '../hooks/useSessionSocket';
import { VideoPanel } from '../components/session/VideoPanel';
import { ChatPanel } from '../components/session/ChatPanel';
import { toast } from '../store/toastStore';
import type { ChatMessage, WebSocketMessage, Session } from '../types';

export const SessionRoom = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // State
  const [mode, setMode] = useState<'chat' | 'video'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionDetails, setSessionDetails] = useState<Session | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null); // 🔥 NEW: Track local stream
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [maxDuration, setMaxDuration] = useState(999999);
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const sendMessageRef = useRef<(msg: WebSocketMessage) => void>(() => { });

  // WebRTC Hook
  const {
    initializeMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup: cleanupWebRTC,
  } = useWebRTC({
    sessionId: sessionId || '',
    userId: user?.id || '',
    onRemoteStream: (stream) => {
      console.log('🎥 Remote stream received:', stream.id);
      setRemoteStream(stream);
    },
    onIceCandidate: (candidate) => {
      sendMessageRef.current({ type: 'ice-candidate', candidate });
    },
    onError: (error) => {
      toast.error(error);
      addSystemMessage(error);
    },
  });

  const handleChatMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      userId: 'system',
      text,
      timestamp: Date.now(),
      isMe: false,
      isSystem: true,
    }]);
  }, []);

  // WebSocket message handlers
  const handleWebRTCMessage = useCallback(async (msg: WebSocketMessage) => {
    if (msg.type === 'offer' && msg.sdp) {
      console.log('📞 Received offer, initializing media...');

      // Initialize media first (receiver side)
      const stream = await initializeMedia();
      if (!stream) {
        console.error('❌ Failed to initialize media');
        toast.error('Failed to access camera/microphone');
        return;
      }

      console.log('✅ Local stream initialized:', stream.id);
      setLocalStream(stream); // 🔥 Set state instead of ref
      setMode('video');
      addSystemMessage('Video call started');

      const answer = await handleOffer(msg.sdp);
      if (answer) {
        sendMessageRef.current({ type: 'answer', sdp: answer });
      }
    } else if (msg.type === 'answer' && msg.sdp) {
      console.log('📞 Received answer');
      await handleAnswer(msg.sdp);
    } else if (msg.type === 'ice-candidate' && msg.candidate) {
      await handleIceCandidate(msg.candidate);
    }
  }, [handleOffer, handleAnswer, handleIceCandidate, initializeMedia, addSystemMessage]);

  const handleSessionEnded = useCallback(() => {
    // Stop local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);

    cleanupWebRTC();
    if (timerRef.current) clearInterval(timerRef.current);
    toast.info('Session ended by partner');
    navigate('/my-sessions');
  }, [cleanupWebRTC, navigate, localStream]);

  // WebSocket Hook
  const {
    isConnected,
    sendMessage,
    sendChatMessage,
    sendEndSession,
  } = useSessionSocket({
    sessionId: sessionId || '',
    userId: user?.id || '',
    onWebRTCMessage: handleWebRTCMessage,
    onChatMessage: handleChatMessage,
    onSystemMessage: addSystemMessage,
    onSessionEnded: handleSessionEnded,
  });

  // Update sendMessage ref
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // 🔥 Attach local stream to video element when state changes
  useEffect(() => {
    if (localStream && myVideoRef.current) {
      console.log('🎥 Attaching local stream to video element:', localStream.id);
      myVideoRef.current.srcObject = localStream;

      // Ensure video plays
      myVideoRef.current.play().catch(e => {
        console.error('Error playing local video:', e);
        // Retry after delay
        setTimeout(() => {
          myVideoRef.current?.play().catch(err =>
            console.error('Retry failed:', err)
          );
        }, 100);
      });
    }
  }, [localStream]);

  // 🔥 Attach remote stream to video element when state changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('🎥 Attaching remote stream to video element:', remoteStream.id);
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(e => {
        console.error('Error playing remote video:', e);
      });
    }
  }, [remoteStream]);

  // Load session on mount
  useEffect(() => {
    if (!user || !sessionId) return;

    const loadSession = async () => {
      try {
        const session = await sessionsApi.getById(sessionId);
        setSessionDetails(session);

        if (session.status !== 'accepted' && session.status !== 'active') {
          toast.error('Session is not active');
          navigate('/my-sessions');
          return;
        }

        // Calculate max duration for client
        if (user.role === 'client') {
          const rate = session.consultant?.price_per_minute || 0;
          const credits = user.credits || 0;
          if (rate > 0) {
            setMaxDuration(Math.floor((credits / rate) * 60));
          }
        }

        // Resume active session
        if (session.status === 'active') {
          setMode('video');
          if (session.actual_start_time) {
            const start = new Date(session.actual_start_time).getTime();
            setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
          }
        }

        // Load chat history
        try {
          const history = await sessionsApi.getMessages(sessionId);
          const formattedHistory: ChatMessage[] = history.map((m: any) => ({
            userId: m.sender_id,
            text: m.content,
            timestamp: new Date(m.timestamp).getTime(),
            isMe: m.sender_id === user.id,
          }));
          setMessages(formattedHistory);
        } catch (e) {
          console.error('Failed to load chat history', e);
        }

      } catch (e) {
        console.error('Failed to load session', e);
        toast.error('Failed to load session');
        navigate('/my-sessions');
      }
    };

    loadSession();

    return () => {
      // Cleanup on unmount
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      cleanupWebRTC();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, user, navigate, cleanupWebRTC]);

  // Timer for video mode
  useEffect(() => {
    if (mode === 'video') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setElapsedSeconds(prev => {
            const next = prev + 1;
            if (user?.role === 'client' && next >= maxDuration) {
              endCall(true);
            }
            return next;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [mode, maxDuration, user?.role]);

  // Add time mutation
  const addTimeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/users/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 20 }),
      });
      return res.json();
    },
    onSuccess: () => {
      const rate = sessionDetails?.consultant?.price_per_minute || 1;
      setMaxDuration(prev => prev + Math.floor((20 / rate) * 60));
      toast.success('Added $20 credits! Time extended.');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: () => {
      toast.error('Failed to add credits');
    },
  });

  // Actions
  const startVideoCall = async () => {
    try {
      console.log('🎬 Starting video call...');
      await sessionsApi.startVideo(sessionId!);

      // Initialize media first
      const stream = await initializeMedia();
      if (!stream) {
        toast.error('Failed to access camera/microphone');
        return;
      }

      console.log('✅ Local stream initialized:', stream.id);
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      console.log('🎤 Audio tracks:', stream.getAudioTracks().length);

      setLocalStream(stream); // 🔥 Set state, not ref
      setMode('video');
      setElapsedSeconds(0);

      addSystemMessage('Video call started');

      // Create and send offer after a brief delay
      setTimeout(async () => {
        const offer = await createOffer();
        if (offer) {
          console.log('📤 Sending offer');
          sendMessage({ type: 'offer', sdp: offer });
        }
      }, 500);

    } catch (err: any) {
      console.error('❌ Failed to start video call:', err);
      toast.error(err.response?.data?.detail || 'Failed to start video call');
    }
  };

  const endCall = async (force = false) => {
    console.log('🛑 Ending call...');

    // Stop all local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      setLocalStream(null);
    }

    cleanupWebRTC();
    setRemoteStream(null);

    if (timerRef.current) clearInterval(timerRef.current);

    sendEndSession();

    try {
      const res = await sessionsApi.updateStatus(sessionId!, { status: 'completed' });
      const cost = res.total_cost;

      if (force) {
        toast.warning('Session ended: Credits exhausted');
      } else {
        toast.success(`Session ended. Total: $${cost?.toFixed(2) || '0.00'}`);
      }
    } catch (e) {
      if (!force) toast.info('Session ended');
    }

    navigate('/my-sessions');
  };

  const handleSendChat = (text: string) => {
    sendChatMessage(text);
    setMessages(prev => {
      const newMsg = {
        userId: user?.id || '',
        text,
        timestamp: Date.now(),
        isMe: true,
      };
      return [...prev, newMsg];
    });
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      console.log('🔇 Mute toggled:', !isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeRemaining = Math.max(0, maxDuration - elapsedSeconds);
  const isLowBalance = timeRemaining < 60;

  const otherPartyName = user?.role === 'client'
    ? sessionDetails?.consultant?.first_name
    : sessionDetails?.client?.first_name;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] bg-gray-100">
      {/* Video Panel (only in video mode) */}
      {mode === 'video' && (
        <VideoPanel
          myVideoRef={myVideoRef}
          remoteVideoRef={remoteVideoRef}
          hasRemoteStream={!!remoteStream}
          hasLocalStream={!!localStream} // 🔥 Pass local stream status
          isMuted={isMuted}
          elapsedSeconds={elapsedSeconds}
          maxDuration={maxDuration}
          isClient={user?.role === 'client'}
          isLowBalance={isLowBalance}
          onToggleMute={toggleMute}
          onEndCall={() => endCall(false)}
          onAddTime={() => addTimeMutation.mutate()}
          formatTime={formatTime}
        />
      )}

      {/* Chat Panel */}
      <ChatPanel
        messages={messages}
        otherPartyName={otherPartyName || 'Partner'}
        userCredits={user?.credits || 0}
        isClient={user?.role === 'client'}
        isConnected={isConnected}
        isVideoMode={mode === 'video'}
        onSendMessage={handleSendChat}
        onStartVideoCall={startVideoCall}
        onEndSession={() => endCall(false)}
      />
    </div>
  );
};