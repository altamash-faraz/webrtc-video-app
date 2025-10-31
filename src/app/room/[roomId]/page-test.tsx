'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const VideoCallRoom: React.FC = () => {
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
              <span className="text-sm">Testing - Minimal UI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">UI Stability Test</h2>
          <p className="text-gray-300 mb-6">
            This is a minimal version without WebRTC hooks or complex state management.
          </p>
          <div className="space-y-2 text-left max-w-md mx-auto">
            <p>✅ Room ID: {roomId}</p>
            <p>✅ User: {username}</p>
            <p>✅ No useWebRTC hook</p>
            <p>✅ No useSignaling hook</p>
            <p>✅ No complex useEffect chains</p>
            <p className="text-green-400 mt-4">
              If this page is stable, the issue is in the WebRTC implementation.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Go Back to Home
          </button>
        </div>
      </main>
    </div>
  );
};

export default VideoCallRoom;