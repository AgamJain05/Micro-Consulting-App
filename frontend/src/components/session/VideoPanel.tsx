import { RefObject } from 'react';
import { Clock, PlusCircle, Mic, MicOff, PhoneOff } from 'lucide-react';

export interface VideoPanelProps {
  myVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
  hasRemoteStream: boolean;
  isMuted: boolean;
  elapsedSeconds: number;
  maxDuration: number;
  isClient?: boolean;
  isLowBalance: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  onAddTime: () => void;
  formatTime: (seconds: number) => string;
}

export function VideoPanel({
  myVideoRef,
  remoteVideoRef,
  hasRemoteStream,
  isMuted,
  elapsedSeconds,
  maxDuration,
  isClient = false,
  isLowBalance,
  onToggleMute,
  onEndCall,
  onAddTime,
  formatTime,
}: VideoPanelProps) {
  return (
    <div className="flex-1 bg-gray-900 relative flex flex-col">
      {/* Video Area */}
      <div className="flex-1 relative overflow-hidden">
        <video 
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!hasRemoteStream && (
          <div className="absolute inset-0 flex items-center justify-center text-white/50">
            Waiting for partner video...
          </div>
        )}
        
        {/* In-Call Timer Overlay */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <div className={`bg-black/50 backdrop-blur-sm text-white px-4 py-1 rounded-full flex items-center gap-2 text-sm font-mono border border-white/20 shadow-lg ${isLowBalance ? 'text-red-400 border-red-500/50' : ''}`}>
            <Clock size={14} className={`${isLowBalance ? 'animate-bounce' : 'animate-pulse'}`} />
            <span>{formatTime(elapsedSeconds)}</span>
            {isClient && (
              <span className="opacity-60 text-xs ml-1">
                / {formatTime(maxDuration)} left
              </span>
            )}
          </div>
          
          {isClient && (
            <button 
              onClick={onAddTime}
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
        <button 
          onClick={onToggleMute} 
          className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600'} text-white transition`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button 
          onClick={onEndCall} 
          className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition shadow-lg shadow-red-900/50" 
          title="End Call"
        >
          <PhoneOff />
        </button>
      </div>
    </div>
  );
}
