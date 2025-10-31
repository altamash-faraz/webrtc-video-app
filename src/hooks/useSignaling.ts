import { useState, useEffect, useCallback } from 'react';
import { SafeStorage } from '@/utils/SafeStorage';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room' | 'user-joined' | 'user-left';
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit | string | unknown;
  roomId?: string;
  userId?: string;
  timestamp?: number;
  id?: string;
}

// Simple WebSocket-based signaling (you can replace with Socket.io or any other solution)
export const useSignaling = (roomId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<SignalingMessage[]>([]);

  // Maximum number of messages to keep in localStorage to prevent quota issues
  const MAX_MESSAGES = 50;
  const CLEANUP_THRESHOLD = 100;

  // Cleanup old messages from localStorage to prevent quota issues
  const cleanupMessages = useCallback((messages: SignalingMessage[]) => {
    if (messages.length > CLEANUP_THRESHOLD) {
      // Keep only the most recent MAX_MESSAGES, prioritizing important message types
      const importantMessages = messages.filter(msg => 
        ['offer', 'answer', 'ice-candidate'].includes(msg.type)
      );
      const recentMessages = importantMessages.slice(-MAX_MESSAGES);
      return recentMessages;
    }
    return messages;
  }, [MAX_MESSAGES, CLEANUP_THRESHOLD]);

  // In a real app, you'd connect to your signaling server
  // For now, we'll simulate it with localStorage for demo purposes
  const sendMessage = useCallback((message: SignalingMessage) => {
    try {
      const messageWithRoom = { 
        ...message, 
        roomId, 
        timestamp: Date.now(),
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Get existing messages and clean them up
      const existingData = SafeStorage.getItem(`room_${roomId}`);
      const existingMessages = existingData ? JSON.parse(existingData) : [];
      const cleanMessages = cleanupMessages(existingMessages);
      const updatedMessages = [...cleanMessages, messageWithRoom];
      
      // Use SafeStorage to handle quota issues automatically
      const saved = SafeStorage.setItem(`room_${roomId}`, JSON.stringify(updatedMessages));
      
      if (!saved) {
        console.warn('Failed to save message to localStorage, continuing without persistence');
        // Don't set error state anymore to prevent re-renders
      }
      
      setMessages(prev => [...prev, messageWithRoom]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Don't set error state anymore to prevent re-renders
    }
  }, [roomId, cleanupMessages]);

  const joinRoom = useCallback((userId: string) => {
    setIsConnected(true);
    sendMessage({ type: 'join-room', userId });
    
    // Simulate other user already in room
    setTimeout(() => {
      setUsers(['user1', userId]);
    }, 1000);
  }, [sendMessage]);

  const leaveRoom = useCallback((userId: string) => {
    sendMessage({ type: 'leave-room', userId });
    setIsConnected(false);
    setUsers([]);
    
    // Clear messages when leaving room to prevent accumulation
    setMessages([]);
    
    // Optional: Clear localStorage for this room (uncomment if you want to clean up)
    // localStorage.removeItem(`room_${roomId}`);
  }, [sendMessage]);

  // Poll for messages (in real app, you'd use WebSocket events)
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      try {
        const roomData = SafeStorage.getItem(`room_${roomId}`);
        const roomMessages = roomData ? JSON.parse(roomData) : [];
        
        // Only process new messages to avoid reprocessing
        setMessages(prevMessages => {
          const currentMessageIds = new Set(prevMessages.map(m => m.id));
          const newMessages = roomMessages.filter((msg: SignalingMessage) => 
            msg.id && !currentMessageIds.has(msg.id)
          );
          
          if (newMessages.length > 0) {
            // Cleanup: if we have too many messages locally, clean them up
            const allMessages = [...prevMessages, ...newMessages];
            if (allMessages.length > MAX_MESSAGES * 2) {
              return allMessages.slice(-MAX_MESSAGES);
            }
            return allMessages;
          }
          
          return prevMessages;
        });
      } catch (error) {
        console.error('Error polling messages:', error);
        // Don't set error state to prevent re-renders
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, roomId, MAX_MESSAGES]);

  return {
    isConnected,
    users,
    messages,
    sendMessage,
    joinRoom,
    leaveRoom,
  };
};