import { useRef, useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import type { WebSocketMessage, ChatMessage } from '../types';

interface UseSessionSocketOptions {
  sessionId: string;
  userId: string;
  onWebRTCMessage: (msg: WebSocketMessage) => void;
  onChatMessage: (msg: ChatMessage) => void;
  onSystemMessage: (text: string) => void;
  onSessionEnded: () => void;
}

interface UseSessionSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  sendChatMessage: (text: string) => void;
  sendEndSession: () => void;
}

export function useSessionSocket(options: UseSessionSocketOptions): UseSessionSocketReturn {
  const { sessionId, userId } = options;
  const { token } = useAuthStore();

  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Store callbacks in refs to avoid reconnecting when they change
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  useEffect(() => {
    // Don't connect if we don't have required params
    if (!sessionId || !userId || sessionId === '' || userId === '') {
      return;
    }

    // Build WebSocket URL with token for authentication
    // Force WSS (secure WebSocket) in production
    const wsProtocol = import.meta.env.PROD
      ? 'wss:'
      : (window.location.protocol === 'https:' ? 'wss:' : 'ws:');

    // Use production domain in production, localhost in dev
    const wsHost = import.meta.env.PROD
      ? 'api.yourdomain.com' // Replace with your production domain
      : (window.location.hostname === 'localhost'
        ? 'localhost:8000'
        : window.location.host);

    let wsUrl = `${wsProtocol}//${wsHost}/api/v1/ws/session/${sessionId}/${userId}`;

    // Append token for authentication if available
    if (token) {
      wsUrl += `?token=${encodeURIComponent(token)}`;
    }

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      // Only log in development to prevent information disclosure
      if (import.meta.env.DEV) {
        console.error('[WS] Error:', error);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WebSocketMessage;

        const { onWebRTCMessage, onChatMessage, onSystemMessage, onSessionEnded } = callbacksRef.current;

        switch (msg.type) {
          case 'offer':
          case 'answer':
          case 'ice-candidate':
            onWebRTCMessage(msg);
            break;

          case 'chat':
            if (msg.userId !== userId) {
              onChatMessage({
                userId: msg.userId || '',
                text: msg.text || '',
                timestamp: msg.timestamp || Date.now(),
                isMe: false,
              });
            }
            break;

          case 'system':
            onSystemMessage(msg.text || '');
            break;

          case 'session-ended':
            onSessionEnded();
            break;

          case 'user-joined':
          case 'user-left':
            break;

          default:
            break;
        }
      } catch (err) {
        // Only log in development to prevent information disclosure
        if (import.meta.env.DEV) {
          console.error('[WS] Failed to parse message:', err);
        }
      }
    };

    socketRef.current = ws;

    return () => {
      ws.close();
      socketRef.current = null;
    };
  }, [sessionId, userId, token]); // Only reconnect when these change

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendChatMessage = useCallback((text: string) => {
    sendMessage({
      type: 'chat',
      userId,
      text,
      timestamp: Date.now(),
    });
  }, [sendMessage, userId]);

  const sendEndSession = useCallback(() => {
    sendMessage({ type: 'end-session' });
  }, [sendMessage]);

  return {
    socket: socketRef.current,
    isConnected,
    sendMessage,
    sendChatMessage,
    sendEndSession,
  };
}
