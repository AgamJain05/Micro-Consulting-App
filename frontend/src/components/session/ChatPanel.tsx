import { useState } from 'react';
import type { ChatMessage } from '../../types';

export interface ChatPanelProps {
  messages: ChatMessage[];
  otherPartyName: string;
  userCredits: number;
  isClient?: boolean;
  isConnected: boolean;
  isVideoMode: boolean;
  onSendMessage: (text: string) => void;
  onStartVideoCall: () => void;
  onEndSession: () => void;
}

export function ChatPanel({
  messages,
  otherPartyName,
  userCredits,
  isClient = false,
  isConnected,
  isVideoMode,
  onSendMessage,
  onStartVideoCall,
  onEndSession,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col bg-white shadow-xl z-10 transition-all duration-300 ${isVideoMode
        ? 'w-96 border-l border-gray-200'
        : 'flex-1 max-w-4xl mx-auto w-full border-x border-gray-200 my-4 rounded-3xl overflow-hidden h-[calc(100vh-120px)]'
      }`}>
      {/* Chat Header */}
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-[#FF5A5F] to-[#E04F54] text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shadow-md">
            {otherPartyName[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-extrabold text-lg">{otherPartyName}</h3>
            {isClient && (
              <p className="text-xs text-white/80 font-medium flex items-center gap-1">
                <span className="material-icons-round text-sm">account_balance_wallet</span>
                Balance: ${Math.floor(userCredits)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isVideoMode && (
            <button
              onClick={onStartVideoCall}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-md"
            >
              <span className="material-icons-round text-lg">videocam</span>
              <span>Call</span>
            </button>
          )}
          <button
            onClick={onEndSession}
            className="bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-white px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1 transition border border-white/20"
            title="End Session"
          >
            <span className="material-icons-round text-lg">call_end</span>
          </button>
          <div
            className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} shadow-md`}
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          msg.isSystem ? (
            <div key={i} className="text-center text-xs text-gray-500 my-2 italic bg-gray-100 rounded-full px-4 py-2 inline-block mx-auto">
              <span className="material-icons-round text-xs mr-1 align-middle">info</span>
              {msg.text}
            </div>
          ) : (
            <div key={i} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-soft leading-relaxed ${msg.isMe
                  ? 'bg-gradient-to-br from-[#FF5A5F] to-[#E04F54] text-white rounded-tr-none'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-1 font-medium">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent outline-none border-gray-200 border transition placeholder-gray-400"
          />
          <button
            onClick={handleSend}
            className="bg-[#FF5A5F] text-white p-3 rounded-xl hover:bg-[#E04F54] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            disabled={!inputText.trim()}
          >
            <span className="material-icons-round">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
