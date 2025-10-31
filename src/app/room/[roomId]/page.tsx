"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";
import CallControls from "@/components/CallControls";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useRealtimeSignaling } from "@/hooks/useRealtimeSignaling";

const VideoCallRoom: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const username = searchParams.get("username") || "Anonymous";
  const initialCameraEnabled = searchParams.get("camera") === "true";
  const initialMicEnabled = searchParams.get("mic") === "true";

  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Generate shareable room URL
  const [roomUrl, setRoomUrl] = useState(`/room/${roomId}?username=`);

  useEffect(() => {
    // Set the full URL only on client side to avoid hydration mismatch
    if (typeof window !== "undefined") {
      setRoomUrl(`${window.location.origin}/room/${roomId}?username=`);
    }
  }, [roomId]);

  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl + "NewUser");
      alert("Room link copied to clipboard!");
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      console.warn("Clipboard API not supported:", error);
      const textArea = document.createElement("textarea");
      textArea.value = roomUrl + "NewUser";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Room link copied to clipboard!");
    }
  };

  const {
    localStream,
    remoteStream,
    isConnected,
    isConnecting,
    error,
    isMuted,
    isVideoOff,
    localVideoRef,
    remoteVideoRef,
    startLocalVideo,
    startDemoMode,
    createOffer,
    createAnswer,
    handleAnswer,
    addIceCandidate,
    toggleMute,
    toggleVideo,
    endCall,
    resetPeerConnection,
  } = useWebRTC();

  const {
    users,
    messages,
    sendMessage,
    joinRoom,
    leaveRoom,
  } = useRealtimeSignaling(roomId);

  // Initialize video when component mounts - only run once
  useEffect(() => {
    let mounted = true;

    const initializeCall = async () => {
      if (!mounted) return;

      try {
        // Try to start video with user preferences
        await startLocalVideo();
        if (!mounted) return;

        // Apply initial settings based on user preferences from join screen
        if (!initialMicEnabled) {
          toggleMute();
        }
        if (!initialCameraEnabled) {
          toggleVideo();
        }

        joinRoom(username);
        if (!mounted) return;

        setIsInitialized(true);
      } catch (error) {
        if (!mounted) return;

        console.warn("Camera access failed, trying demo mode:", error);

        // Only set error for actual camera access issues, not fallback mode
        if (error instanceof Error && error.name === "NotAllowedError") {
          setConnectionError(
            "Camera/microphone access denied. Please click the camera icon in your browser's address bar and allow permissions, then refresh the page.",
          );
          return;
        }

        // Try demo mode as fallback for other issues
        try {
          startDemoMode();
          joinRoom(username);
          setIsInitialized(true);
          // Don't set connectionError for demo mode - it's working as intended
        } catch {
          setConnectionError(
            error instanceof Error
              ? error.message
              : "Failed to initialize video call",
          );
        }
      }
    };

    initializeCall();

    return () => {
      mounted = false;
      leaveRoom(username);
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]); // Only depend on username since it's from URL params

  const processedMessageIds = useRef<Set<string>>(new Set());

  const lastProcessedIndex = useRef<number>(-1);

  // Handle signaling messages with minimal processing
  useEffect(() => {
    // Only process if we have new messages
    if (messages.length <= lastProcessedIndex.current + 1) return;

    // Process only the newest unprocessed message
    const newMessage = messages[messages.length - 1];

    if (
      !newMessage?.id ||
      newMessage.userId === username ||
      processedMessageIds.current.has(newMessage.id)
    ) {
      return;
    }

    lastProcessedIndex.current = messages.length - 1;
    console.log(
      "Processing signaling message:",
      newMessage.type,
      "from:",
      newMessage.userId,
    );
    processedMessageIds.current.add(newMessage.id);

    const processMessage = async () => {
      try {
        switch (newMessage.type) {
          case "offer":
            console.log("Received offer, creating answer...");
            const answer = await createAnswer(
              newMessage.data as RTCSessionDescriptionInit,
            );
            if (answer) {
              sendMessage({ type: "answer", data: answer, userId: username });
            }
            break;
          case "answer":
            console.log("Received answer, setting remote description...");
            await handleAnswer(newMessage.data as RTCSessionDescriptionInit);
            break;
          case "ice-candidate":
            console.log("Received ICE candidate...");
            await addIceCandidate(newMessage.data as RTCIceCandidateInit);
            break;
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };

    processMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, username]); // Remove function dependencies that cause re-renders

  // Handle user joining (initiate call) - simplified to prevent infinite loops
  useEffect(() => {
    if (users.length <= 1 || !isInitialized || isConnected || isConnecting)
      return;

    // Only the first user (alphabetically) should initiate to prevent both sides from calling
    const sortedUsers = [...users].sort();
    const shouldInitiate = sortedUsers[0] === username;

    if (!shouldInitiate) return;

    console.log("Initiating call as first user...");

    // Debounce the offer creation
    const timer = setTimeout(async () => {
      try {
        const offer = await createOffer();
        if (offer) {
          sendMessage({ type: "offer", data: offer, userId: username });
        }
      } catch (error) {
        console.error("Error creating offer:", error);
      }
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, isInitialized, isConnected, isConnecting, username]); // Remove function dependencies

  const handleEndCall = () => {
    endCall();
    leaveRoom(username);
    window.location.href = "/";
  };

  // Only show errors for actual camera permission issues, not signaling fallback
  const shouldShowError = connectionError && !connectionError.includes("signaling server");
  
  if (shouldShowError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-lg mx-auto">
          <div className="flex items-center mb-3">
            <svg
              className="w-6 h-6 text-red-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <strong className="font-bold">
              Camera/Microphone Access Required
            </strong>
          </div>

          <div className="mb-4">
            <p className="text-sm mb-2">{connectionError}</p>

            {connectionError && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded text-sm">
                <p className="font-semibold mb-2">To fix this issue:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Click the camera/lock icon in your browser&apos;s address
                    bar
                  </li>
                  <li>Allow camera and microphone permissions</li>
                  <li>Refresh this page</li>
                </ol>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Storage Usage Indicator - Temporarily disabled to test shaking */}
      {/* <StorageIndicator /> */}

      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Room: {roomId}</h1>
            <p className="text-sm text-gray-400">Welcome, {username}</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Real-time connection status */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected
                    ? "bg-green-500"
                    : isConnecting
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm">
                {isConnected
                  ? "Connected"
                  : isConnecting
                    ? "Connecting..."
                    : "Disconnected"}
              </span>
            </div>

            {/* Users count */}
            <div className="text-sm text-gray-400">Users: {users.length}</div>

            {/* Share room button */}
            <button
              onClick={() => setShowShareDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
              title="Share Room"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              <span>Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Video Grid */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Local Video */}
          <div className="relative">
            <VideoPlayer
              videoRef={localVideoRef}
              isLocal={true}
              isMuted={isMuted}
              isVideoOff={isVideoOff}
              className="aspect-video"
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              You ({username})
            </div>
          </div>

          {/* Remote Video */}
          <div className="relative">
            {remoteStream ? (
              <VideoPlayer
                videoRef={remoteVideoRef}
                isLocal={false}
                className="aspect-video"
              />
            ) : (
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400">
                    {users.length > 1
                      ? "Connecting to peer..."
                      : "Waiting for someone to join..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center">
          <CallControls
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onEndCall={handleEndCall}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isConnected={localStream !== null}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-500 text-white p-3 rounded-lg max-w-md mx-auto">
            <p className="text-sm mb-2">Error: {error}</p>
            <button
              onClick={resetPeerConnection}
              className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm"
            >
              Reset Connection
            </button>
          </div>
        )}

        {/* Room Info with real-time sharing */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Room Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Room ID:</span>
              <p className="font-mono">{roomId}</p>
            </div>
            <div>
              <span className="text-gray-400">Connected Users:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {users.map((user) => (
                  <span
                    key={user}
                    className={`px-2 py-1 rounded text-xs ${
                      user === username ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    {user === username ? `${user} (you)` : user}
                  </span>
                ))}
                {users.length === 0 && (
                  <span className="text-gray-500">No users connected</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={copyRoomLink}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
              <span>Copy Room Link</span>
            </button>

            <div className="flex-1 text-xs">
              <span className="text-gray-400">Share this link:</span>
              <div className="mt-1 p-2 bg-gray-700 rounded text-green-400 break-all font-mono">
                {roomUrl}[USERNAME]
              </div>
              <p className="text-gray-500 mt-1">
                Replace [USERNAME] with the person&apos;s name
              </p>
            </div>
          </div>
        </div>

        {/* Share Dialog */}
        {showShareDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Share Room</h3>
              <p className="text-gray-300 mb-4">
                Send this link to others so they can join your video call:
              </p>

              <div className="bg-gray-700 p-3 rounded mb-4">
                <p className="text-green-400 font-mono text-sm break-all">
                  {roomUrl}YourName
                </p>
              </div>

              <p className="text-sm text-gray-400 mb-4">
                Tell them to replace &quot;YourName&quot; with their actual name
                before joining.
              </p>

              <div className="flex space-x-2">
                <button
                  onClick={copyRoomLink}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowShareDialog(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoCallRoom;
