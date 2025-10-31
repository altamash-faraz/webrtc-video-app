'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

// Diagnostic hook to track re-renders (React 19 compatible)
const useRenderTracker = (componentName: string) => {
  const [renderCount, setRenderCount] = useState(0);
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setRenderCount(1);
      console.log(`🎬 ${componentName} initial render`);
    } else {
      setRenderCount(prev => {
        const newCount = prev + 1;
        console.log(`� ${componentName} re-rendered #${newCount}`);
        return newCount;
      });
    }
  });
  
  return renderCount;
};

const DiagnosticVideoCallRoom: React.FC = () => {
  const renderCount = useRenderTracker('VideoCallRoom');
  
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const username = searchParams.get('username') || 'Anonymous';
  
  console.log(`🎬 VideoCallRoom render #${renderCount}`, { roomId, username });

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
            <div className="text-sm text-gray-400">
              Render: #{renderCount}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Re-render Diagnostic</h2>
          <div className="space-y-2">
            <p>🎬 Total Renders: <span className="font-mono text-yellow-400">{renderCount}</span></p>
            <p>🏠 Room ID: <span className="font-mono">{roomId}</span></p>
            <p>👤 Username: <span className="font-mono">{username}</span></p>
            <p className="text-green-400 mt-4">
              Check the browser console for detailed re-render tracking.
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-700 rounded">
            <h3 className="font-bold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open browser Developer Tools (F12)</li>
              <li>Go to Console tab</li>
              <li>Watch for 🔄 re-render messages</li>
              <li>Each message shows what changed to cause the re-render</li>
            </ol>
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