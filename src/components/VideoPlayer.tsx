import React from 'react';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoRef,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-900 ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || isMuted}
        className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''} ${isLocal ? 'scale-x-[-1]' : ''}`}
      />
      
      {/* Placeholder when video is off */}
      {isVideoOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center text-white">
            <div className="w-16 h-16 mx-auto mb-2 bg-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm">Camera is off</p>
          </div>
        </div>
      )}

      {/* Muted indicator */}
      {isMuted && (
        <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Local video indicator */}
      {isLocal && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          You
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;