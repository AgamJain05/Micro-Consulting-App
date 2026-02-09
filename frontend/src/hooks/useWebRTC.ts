import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { WebRTCConfig } from '../types';

interface UseWebRTCOptions {
  sessionId: string;
  userId: string;
  rtcConfig?: WebRTCConfig;
  onRemoteStream: (stream: MediaStream) => void;
  onIceCandidate: (candidate: RTCIceCandidateInit) => void;
  onError: (error: string) => void;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  peerConnection: RTCPeerConnection | null;
  initializeMedia: () => Promise<MediaStream | null>;
  createOffer: () => Promise<RTCSessionDescriptionInit | null>;
  handleOffer: (sdp: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | null>;
  handleAnswer: (sdp: RTCSessionDescriptionInit) => Promise<void>;
  handleIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  cleanup: () => void;
}

export function useWebRTC(
  options: UseWebRTCOptions
): UseWebRTCReturn {
  const { rtcConfig, onRemoteStream, onIceCandidate, onError } = options;
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  
  // Store callbacks in refs to avoid stale closures
  const onIceCandidateRef = useRef(onIceCandidate);
  const onRemoteStreamRef = useRef(onRemoteStream);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onIceCandidateRef.current = onIceCandidate;
    onRemoteStreamRef.current = onRemoteStream;
    onErrorRef.current = onError;
  }, [onIceCandidate, onRemoteStream, onError]);
  
  // Memoize config to prevent unnecessary re-renders
  const config = useMemo<RTCConfiguration>(() => rtcConfig || {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
  }, [rtcConfig]);

  const initializeMedia = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      onError('Error accessing camera/mic. Please check permissions.');
      return null;
    }
  }, [onError]);

  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(config);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          pc.addTrack(track, localStreamRef.current);
        }
      });
    }

    // Handle ICE candidates - this is critical for WebRTC connection
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidateRef.current(event.candidate.toJSON());
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      onRemoteStreamRef.current(remoteStream);
    };

    // Handle ICE connection state
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        onErrorRef.current('Connection failed. Please try again.');
      }
    };
    
    // Handle connection state
    pc.onconnectionstatechange = () => {
      // Connection state monitoring
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [config]);

  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    try {
      const pc = initializePeerConnection();
      
      // Ensure local tracks are added
      if (localStreamRef.current) {
        const existingSenders = pc.getSenders();
        const existingTrackIds = existingSenders.map(s => s.track?.id).filter(Boolean);
        
        localStreamRef.current.getTracks().forEach(track => {
          if (!existingTrackIds.includes(track.id) && localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      return offer;
    } catch (err) {
      console.error('Failed to create offer:', err);
      onErrorRef.current('Failed to create offer');
      return null;
    }
  }, [initializePeerConnection]);

  const handleOffer = useCallback(async (sdp: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> => {
    try {
      // Close existing peer connection if any (to handle reconnection)
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      const pc = initializePeerConnection();
      
      // IMPORTANT: Add local tracks to peer connection
      // This must happen BEFORE setRemoteDescription for the answer to include our tracks
      if (localStreamRef.current) {
        const existingSenders = pc.getSenders();
        const existingTrackIds = existingSenders.map(s => s.track?.id).filter(Boolean);
        
        localStreamRef.current.getTracks().forEach(track => {
          if (!existingTrackIds.includes(track.id) && localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      
      // Process queued ICE candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    } catch (err) {
      console.error('Failed to handle offer:', err);
      onErrorRef.current('Failed to handle offer');
      return null;
    }
  }, [initializePeerConnection]);

  const handleAnswer = useCallback(async (sdp: RTCSessionDescriptionInit): Promise<void> => {
    try {
      const pc = peerConnectionRef.current;
      if (!pc) {
        return;
      }
      
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        
        // Process queued ICE candidates
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }
      }
    } catch (err) {
      console.error('Failed to handle answer:', err);
      onErrorRef.current('Failed to handle answer');
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit): Promise<void> => {
    try {
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Queue candidate for later
        iceCandidatesQueue.current.push(candidate);
      }
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    iceCandidatesQueue.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    localStream: localStreamRef.current,
    peerConnection: peerConnectionRef.current,
    initializeMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup,
  };
}
