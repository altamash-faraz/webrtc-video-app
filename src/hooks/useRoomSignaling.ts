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

// Cross-device room-based WebRTC signaling using a simple HTTP API
export const useRoomSignaling = (roomId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<SignalingMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const currentUserRef = useRef<string>("");
  const lastPolledTime = useRef<number>(Date.now());
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = useCallback(
    async (message: SignalingMessage) => {
      const messageWithRoom = {
        ...message,
        roomId,
        userId: currentUserRef.current,
        timestamp: Date.now(),
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      try {
        // Use JSONStore.io for cross-device messaging (free, no auth required)
        const response = await fetch(`https://api.jsonstore.io/b2ae761a65e8c93dbfd5d8b3ffa4c0b1e0e4c5a0a8e95c3d2e1b9e8d7c6b5a4/${roomId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'message',
            data: messageWithRoom,
            timestamp: Date.now()
          })
        });

        if (response.ok) {
          console.log(`✅ Sent message to room ${roomId}:`, messageWithRoom.type);
        } else {
          throw new Error('HTTP request failed');
        }
      } catch (error) {
        console.warn('⚠️ Cross-device signaling failed, using localStorage fallback:', error);
        
        // Fallback to localStorage
        const roomKey = `webrtc_room_${roomId}`;
        const existingData = localStorage.getItem(roomKey);
        const roomData = existingData ? JSON.parse(existingData) : { messages: [], users: [] };
        roomData.messages = [...(roomData.messages || []).slice(-50), messageWithRoom];
        localStorage.setItem(roomKey, JSON.stringify(roomData));
      }

      // Add to local messages immediately
      setMessages((prev) => [...prev.slice(-49), messageWithRoom]);
    },
    [roomId],
  );

  const joinRoom = useCallback(
    async (userId: string) => {
      console.log(`🔗 Joining room ${roomId} as ${userId}`);
      currentUserRef.current = userId;
      
      try {
        // Register user in the room
        const response = await fetch(`https://api.jsonstore.io/b2ae761a65e8c93dbfd5d8b3ffa4c0b1e0e4c5a0a8e95c3d2e1b9e8d7c6b5a4/${roomId}_users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            timestamp: Date.now(),
            action: 'join'
          })
        });

        if (response.ok) {
          console.log(`✅ Successfully joined room ${roomId}`);
          setUsers((prev) => prev.includes(userId) ? prev : [...prev, userId]);
        } else {
          throw new Error('Failed to join room via HTTP');
        }
      } catch (error) {
        console.warn('⚠️ Failed to join room via HTTP, using localStorage:', error);
        
        // Fallback to localStorage
        const roomKey = `webrtc_room_${roomId}`;
        const existingData = localStorage.getItem(roomKey);
        const roomData = existingData ? JSON.parse(existingData) : { messages: [], users: [] };
        if (!roomData.users.includes(userId)) {
          roomData.users.push(userId);
          localStorage.setItem(roomKey, JSON.stringify(roomData));
        }
        setUsers(roomData.users);
      }
    },
    [roomId],
  );

  const leaveRoom = useCallback(
    async (userId: string) => {
      console.log(`👋 Leaving room ${roomId} as ${userId}`);
      
      try {
        // Notify room that user is leaving
        await fetch(`https://api.jsonstore.io/b2ae761a65e8c93dbfd5d8b3ffa4c0b1e0e4c5a0a8e95c3d2e1b9e8d7c6b5a4/${roomId}_users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            timestamp: Date.now(),
            action: 'leave'
          })
        });
      } catch (error) {
        console.warn('Failed to notify room of user leaving:', error);
      }

      setUsers([]);
      setMessages([]);
    },
    [roomId],
  );

  // Poll for room updates
  const pollRoomUpdates = useCallback(async () => {
    try {
      // Poll for messages
      const messagesResponse = await fetch(`https://api.jsonstore.io/b2ae761a65e8c93dbfd5d8b3ffa4c0b1e0e4c5a0a8e95c3d2e1b9e8d7c6b5a4/${roomId}`);
      if (messagesResponse.ok) {
        const data = await messagesResponse.json();
        if (data && typeof data === 'object') {
          // JSONStore returns an object with keys as IDs
          const messageEntries = Object.values(data).filter((entry: unknown) => {
            const typedEntry = entry as { type?: string; data?: SignalingMessage; timestamp?: number };
            return typedEntry.type === 'message' && 
              typedEntry.data && 
              typedEntry.data.userId !== currentUserRef.current &&
              (typedEntry.timestamp || 0) > lastPolledTime.current;
          });

          if (messageEntries.length > 0) {
            const newMessages = messageEntries.map((entry: unknown) => 
              (entry as { data: SignalingMessage }).data
            );
            setMessages((prev) => [...prev.slice(-49), ...newMessages]);
            console.log(`📨 Received ${newMessages.length} new messages`);
          }
        }
      }

      // Poll for users
      const usersResponse = await fetch(`https://api.jsonstore.io/b2ae761a65e8c93dbfd5d8b3ffa4c0b1e0e4c5a0a8e95c3d2e1b9e8d7c6b5a4/${roomId}_users`);
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        if (userData && typeof userData === 'object') {
          // Get active users from the last 5 minutes
          const recentUsers = Object.values(userData)
            .filter((entry: unknown) => {
              const typedEntry = entry as { action?: string; timestamp?: number; userId?: string };
              return typedEntry.action === 'join' && 
                (Date.now() - (typedEntry.timestamp || 0)) < 300000; // 5 minutes
            })
            .map((entry: unknown) => (entry as { userId: string }).userId);

          const uniqueUsers = [...new Set(recentUsers)];
          if (uniqueUsers.length !== users.length || !uniqueUsers.every(u => users.includes(u))) {
            setUsers(uniqueUsers);
            console.log(`👥 Room users updated:`, uniqueUsers);
          }
        }
      }

      lastPolledTime.current = Date.now();

    } catch (error) {
      console.warn('⚠️ Polling failed, trying localStorage fallback:', error);
      
      // Fallback to localStorage
      try {
        const roomKey = `webrtc_room_${roomId}`;
        const roomData = localStorage.getItem(roomKey);
        if (roomData) {
          const data = JSON.parse(roomData);
          if (data.users) setUsers(data.users);
          if (data.messages) {
            const newMessages = data.messages.filter(
              (msg: SignalingMessage) => 
                msg.userId !== currentUserRef.current && 
                (msg.timestamp || 0) > lastPolledTime.current - 10000
            );
            if (newMessages.length > 0) {
              setMessages((prev) => [...prev.slice(-49), ...newMessages]);
            }
          }
        }
      } catch (fallbackError) {
        console.error('Fallback polling also failed:', fallbackError);
      }
    }
  }, [roomId, users]);

  // Initialize signaling
  useEffect(() => {
    console.log(`🚀 Initializing cross-device signaling for room: ${roomId}`);
    
    // Start polling every 2 seconds
    pollingInterval.current = setInterval(pollRoomUpdates, 2000);
    
    // Set connected state
    setTimeout(() => {
      setIsConnected(true);
      setConnectionError(null);
    }, 500);
    
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