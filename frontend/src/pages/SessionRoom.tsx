import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Video, Mic, MicOff, PhoneOff, MessageSquare, Send, Clock, PlusCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ChatMessage {
  userId: string;
  text: string;
  timestamp: number;
  isMe: boolean;
  isSystem?: boolean;
}

export const SessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const queryClient = useQueryClient();
  
  // Modes: 'chat' or 'video'
  const [mode, setMode] = useState<'chat' | 'video'>('chat');
  
  // Media State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  
  // Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");

  // Session Details
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  // 1. Initialize Session & WebSocket (Run Once)
  useEffect(() => {
    if (!user || !sessionId) return;

    const fetchSession = async () => {
      try {
        const res = await api.get(`/api/v1/sessions/${sessionId}`);
        setSessionDetails(res.data);
        
        if (res.data.status !== 'accepted' && res.data.status !== 'active') {
            alert("Session is not active or accepted.");
            navigate('/');
            return;
        }

        // Calculate Max Duration
        if (user.role === 'client') {
            const rate = res.data.consultant?.price_per_minute || 0;
            const credits = user.credits || 0;
            if (rate > 0) {
                setMaxDuration(Math.floor((credits / rate) * 60));
            } else {
                setMaxDuration(999999); // Free
            }
        } else {
            setMaxDuration(999999); // Consultant has no limit
        }

        if (res.data.status === 'active') {
          setMode('video'); 
          if (res.data.actual_start_time) {
            const start = new Date(res.data.actual_start_time).getTime();
            const now = Date.now();
            setElapsedSeconds(Math.floor((now - start) / 1000));
          }
        }
        
        // Fetch Chat History
        try {
            const historyRes = await api.get(`/api/v1/sessions/${sessionId}/messages`);
            const history = historyRes.data.map((m: any) => ({
                userId: m.sender_id,
                text: m.content,
                timestamp: new Date(m.timestamp).getTime(),
                isMe: m.sender_id === user.id
            }));
            setMessages(history);
        } catch (e) {
            console.error("Failed to load chat history", e);
        }

      } catch (e) {
        console.error("Failed to load session", e);
        navigate('/');
      }
    };

    fetchSession();

    // WebSocket Setup
    const wsUrl = `ws://localhost:8000/api/v1/ws/session/${sessionId}/${user.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to signaling server");
    };

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      handleSignalingMessage(msg);
    };

    setSocket(ws);

    return () => {
      ws.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (peerConnection.current) peerConnection.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, user]);

  // Timer Logic & Auto-End
  useEffect(() => {
    if (mode === 'video') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setElapsedSeconds(prev => {
            const next = prev + 1;
            // Auto-end check for client
            if (user?.role === 'client' && next >= maxDuration) {
                endCall(true); // Force end
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
  }, [mode, maxDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add Time Mutation
  const addTimeMutation = useMutation({
    mutationFn: async () => {
        // Add $20 credits
        await api.post('/api/v1/users/topup', { amount: 20 });
    },
    onSuccess: () => {
        // Recalculate max duration
        const rate = sessionDetails.consultant.price_per_minute;
        setMaxDuration(prev => prev + Math.floor((20 / rate) * 60));
        alert("Added $20 credits! Time extended.");
        queryClient.invalidateQueries({ queryKey: ['me'] }); // Refresh user store if needed
    }
  });

  // 2. WebRTC Logic (Triggered when mode becomes 'video')
  useEffect(() => {
    if (mode !== 'video') return;

    const initWebRTC = async () => {
      try {
        console.log("Initializing WebRTC...");
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(localStream);
        // Attach to local video element (might need to wait for ref)
        if (myVideoRef.current) myVideoRef.current.srcObject = localStream;

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = (event) => {
          console.log("Received remote track");
          const [remote] = event.streams;
          setRemoteStream(remote);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'ice-candidate',
              candidate: event.candidate,
              target: 'peer'
            }));
          }
        };

        peerConnection.current = pc;
        
      } catch (err) {
        console.error("Error accessing media:", err);
        setMessages(prev => [...prev, {
          userId: 'system',
          text: 'Error accessing camera/mic. Please check permissions.',
          timestamp: Date.now(),
          isMe: false,
          isSystem: true
        }]);
      }
    };

    initWebRTC();
  }, [mode]); // Re-run when switching to video mode

  // Attach video ref when stream changes (sometimes refs are null initially)
  useEffect(() => {
    if (stream && myVideoRef.current) myVideoRef.current.srcObject = stream;
    if (remoteStream && remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [stream, remoteStream, mode]);


  // 3. Signaling Logic
  const handleSignalingMessage = async (msg: any) => {
    if (msg.type === 'chat') {
      setMessages(prev => [...prev, {
        userId: msg.userId,
        text: msg.text,
        timestamp: msg.timestamp,
        isMe: msg.userId === user?.id
      }]);
      return;
    }
    
    if (msg.type === 'system') {
       setMessages(prev => [...prev, {
        userId: 'system',
        text: msg.text,
        timestamp: Date.now(),
        isMe: false,
        isSystem: true
      }]);
      return;
    }

    if (msg.type === 'session-ended') {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (peerConnection.current) peerConnection.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
      alert("Session ended by partner.");
      navigate('/');
      return;
    }

    // WebRTC Signaling
    if (!peerConnection.current && mode !== 'video') {
      return;
    }
    
    const pc = peerConnection.current;
    if (!pc) return; 

    switch (msg.type) {
      case 'offer':
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket?.send(JSON.stringify({ type: 'answer', sdp: answer }));
        break;

      case 'answer':
        await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        break;

      case 'ice-candidate':
        if (msg.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
        break;
    }
  };

  const endCall = async (force = false) => {
    // 1. Stop Media
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (peerConnection.current) peerConnection.current.close();
    if (timerRef.current) clearInterval(timerRef.current);

    // 2. Send WS message
    socket?.send(JSON.stringify({ type: 'end-session' }));

    // 3. API Call to complete session
    try {
      const res = await api.patch(`/api/v1/sessions/${sessionId}/status`, {
        status: 'completed'
      });
      const cost = res.data.total_cost;
      
      if (force) alert("Session Ended: Credits exhausted.");
      else alert(`Session Ended. Total Cost: $${cost?.toFixed(2)}`);
      
    } catch (e) {
      console.error("Error ending session:", e);
      if (!force) alert("Session ended.");
    }

    // 4. Navigate away
    navigate('/');
  };

  // 4. Actions
  const startVideoCall = async () => {
    try {
      await api.post(`/api/v1/sessions/${sessionId}/start_video`);
      
      setMode('video');
      setElapsedSeconds(0); // Reset timer
      
      socket?.send(JSON.stringify({
        type: 'system',
        text: 'Video call started.'
      }));
      
      setTimeout(async () => {
        if (peerConnection.current) {
          const pc = peerConnection.current;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket?.send(JSON.stringify({ type: 'offer', sdp: offer }));
        }
      }, 1000); 
      
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to start video call");
    }
  };

  const sendChat = () => {
    if (!inputText.trim() || !socket) return;
    
    const msg = {
      type: 'chat',
      text: inputText,
      timestamp: Date.now()
    };
    
    socket.send(JSON.stringify(msg));
    setMessages(prev => [...prev, {
      userId: user?.id || '',
      text: inputText,
      timestamp: Date.now(),
      isMe: true
    }]);
    setInputText("");
  };

  const timeRemaining = Math.max(0, maxDuration - elapsedSeconds);
  const isLowBalance = timeRemaining < 60; // Less than 1 minute

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50">
      {/* Left Side: Video Area (Only visible in video mode) */}
      {mode === 'video' && (
        <div className="flex-1 bg-gray-900 relative flex flex-col">
          {/* Video Area */}
          <div className="flex-1 relative overflow-hidden">
            <video 
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center text-white/50">
                Waiting for partner video...
              </div>
            )}
            
            {/* In-Call Timer Overlay */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                <div className={`bg-black/50 backdrop-blur-sm text-white px-4 py-1 rounded-full flex items-center gap-2 text-sm font-mono border border-white/20 shadow-lg ${isLowBalance ? 'text-red-400 border-red-500/50' : ''}`}>
                    <Clock size={14} className={`${isLowBalance ? 'animate-bounce' : 'animate-pulse'}`} />
                    <span>{formatTime(elapsedSeconds)}</span>
                    {user?.role === 'client' && (
                        <span className="opacity-60 text-xs ml-1">
                            / {formatTime(maxDuration)} left
                        </span>
                    )}
                </div>
                
                {user?.role === 'client' && (
                    <button 
                        onClick={() => addTimeMutation.mutate()}
                        className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded-full shadow-lg transition"
                        title="Add $20 Credits (Extend Time)"
                    >
                        <PlusCircle size={16} />
                    </button>
                )}
            </div>

            {/* Local PiP */}
            <div className="absolute bottom-4 right-4 w-48 aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 shadow-xl">
              <video 
                ref={myVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Controls */}
          <div className="h-20 bg-gray-800 flex items-center justify-center gap-6">
              <button onClick={() => {
                if(stream) stream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
                setIsMuted(!isMuted);
              }} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'} text-white`}>
                {isMuted ? <MicOff /> : <Mic />}
              </button>
              <button onClick={() => endCall(false)} className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition shadow-lg shadow-red-900/50" title="End Call">
                <PhoneOff />
              </button>
          </div>
        </div>
      )}

      {/* Right Side: Chat */}
      <div className={`flex flex-col bg-white shadow-xl z-10 transition-all duration-300 ${
        mode === 'video' ? 'w-96 border-l border-gray-200' : 'flex-1 max-w-4xl mx-auto w-full border-x border-gray-200 my-4 rounded-2xl overflow-hidden h-[calc(100vh-120px)]'
      }`}>
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">
                {sessionDetails?.consultant?.first_name || 'Consultant'}
              </h3>
              {user?.role === 'client' && (
                <p className="text-xs text-gray-500">
                  Balance: ${Math.floor(user.credits || 0)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {mode === 'chat' && (
              <button 
                onClick={startVideoCall}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition shadow-sm"
              >
                <Video size={18} />
                <span>Call</span>
              </button>
            )}
            <button 
              onClick={() => endCall(false)}
              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition border border-red-200"
              title="End Session"
            >
              <PhoneOff size={16} />
            </button>
            <div className="w-2 h-2 rounded-full bg-green-500" title="Connected"></div>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((msg, i) => (
            msg.isSystem ? (
              <div key={i} className="text-center text-xs text-gray-400 my-2 italic">
                {msg.text}
              </div>
            ) : (
              <div key={i} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                  msg.isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            )
          ))}
        </div>
        
        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none border-transparent border transition"
            />
            <button 
              onClick={sendChat}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
              disabled={!inputText.trim()}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
