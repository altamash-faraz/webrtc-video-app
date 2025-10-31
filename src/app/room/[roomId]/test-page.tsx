'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const TestVideoCallRoom: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const username = searchParams.get('username') || 'Anonymous';

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
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Testing - No Shaking</span>
            </div>
          </div>
        </div>
      </header>

      {/* Video Grid Placeholder */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Local Video Placeholder */}
          <div className="relative">
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-400">Local Video (You)</p>
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
                <p className="text-gray-400">Remote Video</p>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Controls */}
        <div className="flex justify-center">
          <div className="flex space-x-4 p-4 bg-gray-800 rounded-lg">
            <button 
              title="Mute/Unmute"
              className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white"
            >
              🎤
            </button>
            <button 
              title="Video On/Off"
              className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white"
            >
              📹
            </button>
            <button 
              title="End Call"
              onClick={() => window.location.href = '/'}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              📞
            </button>
          </div>
        </div>

        {/* Room Info */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Testing Mode - Simple UI</h3>
          <div className="text-sm text-gray-300">
            <p>✅ Room ID: {roomId}</p>
            <p>✅ User: {username}</p>
            <p>✅ UI should be stable without shaking</p>
            <p className="mt-2 text-green-400">
              If this version doesn't shake, the issue was in the WebRTC hooks or signaling logic.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestVideoCallRoom;