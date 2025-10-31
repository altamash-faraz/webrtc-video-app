import { useState, useEffect, useCallback, useRef } from "react";

export interface SignalingMessage {
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "join-room"
    | "leave-room"
    | "user-joined"
    | "user-left";
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit | string | unknown;
  roomId?: string;
  userId?: string;
  timestamp?: number;
  id?: string;
}

// Real-time WebRTC signaling using BroadcastChannel for local testing
export const useRealtimeSignaling = (roomId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<SignalingMessage[]>([]);
  const [connectionError] = useState<string | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);

  const sendMessage = useCallback(
    (message: SignalingMessage) => {
      const messageWithRoom = {
        ...message,
        roomId,
        timestamp: Date.now(),
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Send via BroadcastChannel for local cross-tab communication
      if (channelRef.current) {
        channelRef.current.postMessage(messageWithRoom);
        console.log("Sent message via BroadcastChannel:", messageWithRoom.type);
      }

      // Also store in localStorage as backup
      try {
        const storageKey = `room_${roomId}`;
        const existingData = localStorage.getItem(storageKey);
        const existingMessages = existingData ? JSON.parse(existingData) : [];
        const updatedMessages = [
          ...existingMessages.slice(-50),
          messageWithRoom,
        ]; // Keep last 50 messages
        localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
        
        // Add to local messages immediately for sender
        setMessages((prev) => [...prev.slice(-49), messageWithRoom]);
      } catch (error) {
        console.error("Fallback localStorage failed:", error);
      }
    },
    [roomId],
  );

  const joinRoom = useCallback(
    (userId: string) => {
      // Announce joining via BroadcastChannel
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: "user-joined",
          userId,
          roomId,
          timestamp: Date.now(),
        });
      }

      setUsers((prev) => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    },
    [roomId],
  );

  const leaveRoom = useCallback(
    (userId: string) => {
      // Announce leaving via BroadcastChannel
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: "user-left",
          userId,
          roomId,
          timestamp: Date.now(),
        });
      }

      setUsers((prev) => prev.filter((id) => id !== userId));
      setMessages([]);
    },
    [roomId],
  );

  // Initialize BroadcastChannel for cross-tab communication
  useEffect(() => {
    const channelName = `webrtc-room-${roomId}`;
    
    // Create BroadcastChannel for this room
    channelRef.current = new BroadcastChannel(channelName);
    
    console.log(`Connected to room: ${roomId} via BroadcastChannel`);

    // Listen for messages from other tabs/windows
    channelRef.current.onmessage = (event) => {
      const message: SignalingMessage = event.data;
      console.log("Received message via BroadcastChannel:", message.type);

      if (message.type === "user-joined") {
        setUsers((prev) => {
          if (!prev.includes(message.userId!)) {
            return [...prev, message.userId!];
          }
          return prev;
        });
      } else if (message.type === "user-left") {
        setUsers((prev) => prev.filter((id) => id !== message.userId));
      } else {
        // Handle WebRTC signaling messages
        setMessages((prev) => [...prev.slice(-49), message]);
      }
    };

    // Load existing messages from localStorage
    const loadMessages = () => {
      try {
        const existingData = localStorage.getItem(`room_${roomId}`);
        if (existingData) {
          const existingMessages = JSON.parse(existingData);
          setMessages(existingMessages.slice(-10)); // Load last 10 messages
        }
      } catch (error) {
        console.error("Error loading existing messages:", error);
      }
    };

    // Set connected state and load messages after setup
    const timer = setTimeout(() => {
      setIsConnected(true);
      loadMessages();
    }, 0);

    return () => {
      clearTimeout(timer);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
    };
  }, [roomId]);

  return {
    isConnected,
    users,
    messages,
    connectionError,
    sendMessage,
    joinRoom,
    leaveRoom,
  };
};
