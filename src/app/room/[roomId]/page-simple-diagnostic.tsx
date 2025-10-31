'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const DiagnosticVideoCallRoom: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const username = searchParams.get('username') || 'Anonymous';
  
  // Simple render tracking without useEffect
  console.log('🎬 VideoCallRoom rendered at:', new Date().toISOString());

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
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Diagnostic Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Re-render Diagnostic</h2>
          <div className="space-y-2">
            <p>🏠 Room ID: <span className="font-mono">{roomId}</span></p>
            <p>👤 Username: <span className="font-mono">{username}</span></p>
            <p className="text-green-400 mt-4">
              Check the browser console for render timestamps.
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-700 rounded">
            <h3 className="font-bold mb-2">What we learned:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>React 19 has stricter rules about refs and effects during render</li>
              <li>useEffect without dependencies can cause infinite renders</li>
              <li>setState within effects triggers cascading renders</li>
              <li>Accessing refs during render is now prohibited</li>
            </ul>
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

export default DiagnosticVideoCallRoom;