'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const SimpleVideoRoom: React.FC = (): React.JSX.Element => {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const username = searchParams.get('username') || 'Anonymous';
  
  const [isConnected] = useState(true); // Always connected in simple mode
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  useEffect(() => {
    // Simple initialization without complex hooks
    console.log('Room initialized:', roomId, 'User:', username);
  }, [roomId, username]);

  // Button handlers
  const toggleMute = () => {
    setIsMuted(!isMuted);
    console.log(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    console.log(isVideoOff ? 'Video turned on' : 'Video turned off');
  };

  const endCall = () => {
    console.log('Ending call and leaving room');
    window.location.href = '/';
  };

  const copyRoomLink = async () => {
    const roomUrl = `${window.location.origin}/room/${roomId}?username=NewUser`;
    try {
      await navigator.clipboard.writeText(roomUrl);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      console.warn('Clipboard API not supported:', error);
      const textArea = document.createElement('textarea');
      textArea.value = roomUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Room: {roomId}</h1>
            <p className="text-sm text-gray-400">Welcome, {username}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={copyRoomLink}
              title="Copy Room Link"
              aria-label="Copy Room Link to Share"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              Share Room
            </button>
            {showCopiedMessage && (
              <span className="text-green-400 text-sm">Link copied!</span>
            )}
          </div>
        </div>
      </header>

      {/* Video Grid Placeholder */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Local Video Placeholder */}
          <div className="relative">
            <div className={`aspect-video rounded-lg flex items-center justify-center ${
              isVideoOff ? 'bg-gray-900' : 'bg-gray-800'
            }`}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                  {isVideoOff ? (
                    <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894L14 7.382V6a2 2 0 00-2-2H9.382l-2-2H3.707zM4 8V6a2 2 0 012-2h.382L4 6.382V8zm8.553 5.106A1 1 0 0014 12V8a1 1 0 00-.553-.894L11 8.382v4.724l1.553.894z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-gray-400">
                  {isVideoOff ? 'Video Off' : 'Local Video (You)'}
                </p>
                {isMuted && (
                  <p className="text-red-400 text-sm mt-1">🔇 Muted</p>
                )}
              </div>
            </div>
          </div>

          {/* Remote Video Placeholder */}
          <div className="relative">
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-400">Waiting for remote user...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Controls */}
        <div className="flex justify-center">
          <div className="flex space-x-4 p-4 bg-gray-800 rounded-lg">
            <button 
              onClick={toggleMute}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              className={`p-3 rounded-full text-white transition-colors ${
                isMuted 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isMuted ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0 8 8 0 010 11.314 1 1 0 01-1.414-1.414 6 6 0 000-8.486 1 1 0 010-1.414z" clipRule="evenodd" />
                  <path d="M13.828 8.172a1 1 0 011.414 0 4 4 0 010 5.656 1 1 0 01-1.414-1.414 2 2 0 000-2.828 1 1 0 010-1.414z" />
                  <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0 8 8 0 010 11.314 1 1 0 01-1.414-1.414 6 6 0 000-8.486 1 1 0 010-1.414z" clipRule="evenodd" />
                  <path d="M13.828 8.172a1 1 0 011.414 0 4 4 0 010 5.656 1 1 0 01-1.414-1.414 2 2 0 000-2.828 1 1 0 010-1.414z" />
                </svg>
              )}
            </button>
            <button 
              onClick={toggleVideo}
              title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
              aria-label={isVideoOff ? "Turn Video On" : "Turn Video Off"}
              className={`p-3 rounded-full text-white transition-colors ${
                isVideoOff 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isVideoOff ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0018 13V7a1 1 0 00-1.447-.894L14 7.382V6a2 2 0 00-2-2H9.382l-2-2H3.707zM4 8V6a2 2 0 012-2h.382L4 6.382V8zm8.553 5.106A1 1 0 0014 12V8a1 1 0 00-.553-.894L11 8.382v4.724l1.553.894z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              )}
            </button>
            <button 
              onClick={endCall}
              title="End Call"
              aria-label="End Call and Leave Room"
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Room Info */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Room Information (Simplified Mode)</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Room ID:</span>
              <p className="font-mono">{roomId}</p>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <p className="text-green-400">UI Stable - No Shaking</p>
            </div>
            <div>
              <span className="text-gray-400">Microphone:</span>
              <p className={isMuted ? 'text-red-400' : 'text-green-400'}>
                {isMuted ? '🔇 Muted' : '🎤 Active'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Video:</span>
              <p className={isVideoOff ? 'text-red-400' : 'text-green-400'}>
                {isVideoOff ? '📹 Off' : '📹 On'}
              </p>
            </div>
          </div>
          
          {/* Additional UI Test Features */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-md font-medium mb-2">Interactive Features</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => alert(`Hello from ${username}!`)}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs transition-colors"
              >
                Test Alert
              </button>
              <button
                onClick={() => console.log('Console test from', username)}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs transition-colors"
              >
                Console Log
              </button>
              <button
                onClick={copyRoomLink}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
              >
                Copy Room Link
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SimpleVideoRoom;