import { RefObject } from 'react';
import { Clock, PlusCircle, Mic, MicOff, PhoneOff, VideoOff, AlertCircle } from 'lucide-react';

export interface VideoPanelProps {
  myVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
  hasRemoteStream: boolean;
  hasLocalStream?: boolean; // 🔥 NEW: Track if local stream is ready
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
  hasLocalStream = true,
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
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Remote Stream Placeholder */}
        {!hasRemoteStream && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900">
            <div className="text-center px-4">
              <div className="mb-4 inline-block p-4 bg-white/10 rounded-full">
                <VideoOff size={48} className="animate-pulse" />
              </div>
              <p className="text-lg font-medium">Waiting for partner's video...</p>
              <p className="text-sm text-gray-400 mt-2">Connection in progress</p>
            </div>
          </div>
        )}

        {/* In-Call Timer Overlay - Responsive */}
        <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1 md:gap-2 z-10 px-2">
          <div className={`bg-black/70 backdrop-blur-sm text-white px-2 md:px-4 py-1 rounded-full flex items-center gap-1 md:gap-2 text-xs md:text-sm font-mono border border-white/20 shadow-lg ${isLowBalance ? 'text-red-400 border-red-500/50 animate-pulse' : ''}`}>
            <Clock size={12} className="md:w-4 md:h-4" />
            <span className="font-bold">{formatTime(elapsedSeconds)}</span>
            {isClient && (
              <span className="hidden sm:inline opacity-60 text-xs ml-1">
                / {formatTime(maxDuration)}
              </span>
            )}
          </div>

          {isClient && (
            <button
              onClick={onAddTime}
              className="bg-green-600 hover:bg-green-700 active:scale-95 text-white p-1 md:p-1.5 rounded-full shadow-lg transition"
              title="Add $20 Credits"
            >
              <PlusCircle size={14} className="md:w-4 md:h-4" />
            </button>
          )}
        </div>

        {/* Low Balance Warning - Responsive */}
        {isClient && isLowBalance && (
          <div className="absolute top-12 md:top-16 left-2 right-2 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:max-w-md bg-yellow-500/95 text-black px-3 md:px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-10 text-xs md:text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="font-bold">Low balance! Less than 1 min left</span>
            <button
              onClick={onAddTime}
              className="ml-auto bg-black/20 hover:bg-black/30 px-2 py-1 rounded text-xs font-bold whitespace-nowrap"
            >
              Add $20
            </button>
          </div>
        )}

        {/* Local PiP (Picture-in-Picture) - Responsive */}
        <div className="absolute bottom-16 md:bottom-4 right-2 md:right-4 w-28 md:w-40 lg:w-48 aspect-video bg-black rounded-lg overflow-hidden border-2 border-white/30 shadow-xl z-10">
          {hasLocalStream ? (
            <video
              ref={myVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50 bg-gray-800">
              <VideoOff size={24} className="md:w-8 md:h-8 animate-pulse" />
            </div>
          )}

          {/* Local Video Label */}
          <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px] md:text-xs font-medium">
            You
          </div>

          {/* Muted Indicator */}
          {isMuted && (
            <div className="absolute top-1 right-1 bg-red-500 text-white p-0.5 md:p-1 rounded-full">
              <MicOff size={10} className="md:w-3 md:h-3" />
            </div>
          )}
        </div>
      </div>

      {/* Controls - Responsive */}
      <div className="h-16 md:h-20 bg-gray-800 flex items-center justify-center gap-3 md:gap-6 px-4">
        {/* Mute/Unmute Button */}
        <button
          onClick={onToggleMute}
          className={`p-2.5 md:p-3 rounded-full transition-all active:scale-95 ${isMuted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-600 hover:bg-gray-700'
            } text-white shadow-lg`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={18} className="md:w-5 md:h-5" /> : <Mic size={18} className="md:w-5 md:h-5" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="p-3 md:p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-900/50"
          title="End Call"
        >
          <PhoneOff size={20} className="md:w-6 md:h-6" />
        </button>

        {/* Add Time Button (Client Only) - Hidden on very small screens */}
        {isClient && (
          <button
            onClick={onAddTime}
            className="hidden sm:flex p-2.5 md:p-3 rounded-full bg-green-600 hover:bg-green-700 text-white transition-all active:scale-95 shadow-lg items-center justify-center"
            title="Add $20 Credits"
          >
            <PlusCircle size={18} className="md:w-5 md:h-5" />
          </button>
        )}
      </div>

      {/* CSS for mirror effect */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}