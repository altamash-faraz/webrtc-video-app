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

// Simple room-based WebRTC signaling using localStorage with polling
export const useRoomSignaling = (roomId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<SignalingMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const currentUserRef = useRef<string>("");
  const lastMessageIndex = useRef<number>(-1);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = useCallback(
    (message: SignalingMessage) => {
      const messageWithRoom = {
        ...message,
        roomId,
        userId: currentUserRef.current,
        timestamp: Date.now(),
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      try {
        // Store message in localStorage
        const roomKey = `webrtc_room_${roomId}`;
        const existingData = localStorage.getItem(roomKey);
        const roomData = existingData ? JSON.parse(existingData) : { messages: [], users: [] };
        
        roomData.messages = [...(roomData.messages || []).slice(-50), messageWithRoom];
        localStorage.setItem(roomKey, JSON.stringify(roomData));
        
        console.log(`Sent message to room ${roomId}:`, messageWithRoom.type);
      } catch (error) {
        console.error('Failed to send message:', error);
      }

      // Also add to local messages for immediate feedback
      setMessages((prev) => [...prev.slice(-49), messageWithRoom]);
    },
    [roomId],
  );

  const joinRoom = useCallback(
    (userId: string) => {
      console.log(`Joining room ${roomId} as ${userId}`);
      currentUserRef.current = userId;
      
      try {
        // Add user to room in localStorage
        const roomKey = `webrtc_room_${roomId}`;
        const existingData = localStorage.getItem(roomKey);
        const roomData = existingData ? JSON.parse(existingData) : { messages: [], users: [] };
        
        if (!roomData.users.includes(userId)) {
          roomData.users.push(userId);
          localStorage.setItem(roomKey, JSON.stringify(roomData));
        }
        
        // Update local users list
        setUsers(roomData.users);
        
        console.log(`Successfully joined room ${roomId}. Users in room:`, roomData.users);
      } catch (error) {
        console.error('Failed to join room:', error);
      }
    },
    [roomId],
  );

  const leaveRoom = useCallback(
    (userId: string) => {
      console.log(`Leaving room ${roomId} as ${userId}`);
      
      try {
        // Remove user from room in localStorage
        const roomKey = `webrtc_room_${roomId}`;
        const existingData = localStorage.getItem(roomKey);
        if (existingData) {
          const roomData = JSON.parse(existingData);
          roomData.users = (roomData.users || []).filter((id: string) => id !== userId);
          localStorage.setItem(roomKey, JSON.stringify(roomData));
        }
      } catch (error) {
        console.error('Failed to leave room:', error);
      }

      setUsers([]);
      setMessages([]);
    },
    [roomId],
  );

  // Poll for room updates
  const pollRoomUpdates = useCallback(() => {
    try {
      const roomKey = `webrtc_room_${roomId}`;
      const roomData = localStorage.getItem(roomKey);
      
      if (roomData) {
        const data = JSON.parse(roomData);
        
        // Update users
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        }
        
        // Update messages - only add new ones
        if (data.messages && Array.isArray(data.messages)) {
          const newMessages = data.messages.slice(lastMessageIndex.current + 1);
          if (newMessages.length > 0) {
            // Filter out our own messages
            const otherMessages = newMessages.filter(
              (msg: SignalingMessage) => msg.userId !== currentUserRef.current
            );
            
            if (otherMessages.length > 0) {
              setMessages((prev) => [...prev.slice(-49), ...otherMessages]);
              console.log(`Received ${otherMessages.length} new messages`);
            }
            
            lastMessageIndex.current = data.messages.length - 1;
          }
        }
      }
    } catch (error) {
      console.error('Error polling room updates:', error);
    }
  }, [roomId]);

  // Initialize room signaling
  useEffect(() => {
    console.log(`Initializing room signaling for room: ${roomId}`);
    
    // Start polling for updates every 1 second
    pollingInterval.current = setInterval(pollRoomUpdates, 1000);
    
    // Set connected state after initialization
    setTimeout(() => {
      setIsConnected(true);
      setConnectionError(null);
    }, 100);
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [roomId, pollRoomUpdates]);

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