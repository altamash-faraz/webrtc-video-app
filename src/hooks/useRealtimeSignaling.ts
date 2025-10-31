import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room' | 'user-joined' | 'user-left';
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit | string | unknown;
  roomId?: string;
  userId?: string;
  timestamp?: number;
  id?: string;
}

// Real-time WebRTC signaling using Socket.IO
export const useRealtimeSignaling = (roomId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<SignalingMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  // Connect to signaling server (you can replace with your own server)
  const SIGNALING_SERVER = process.env.NEXT_PUBLIC_SIGNALING_SERVER || 'https://webrtc-signaling-server.herokuapp.com';
  const SOCKET_DISABLED = SIGNALING_SERVER === 'disabled';

  const sendMessage = useCallback((message: SignalingMessage) => {
    const messageWithRoom = { 
      ...message, 
      roomId, 
      timestamp: Date.now(),
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (!SOCKET_DISABLED && socketRef.current?.connected) {
      // Send via Socket.IO
      socketRef.current.emit('webrtc-message', messageWithRoom);
    } else {
      // Fallback to localStorage for development
      console.warn('Socket not connected, using localStorage fallback');
      try {
        const storageKey = `room_${roomId}`;
        const existingData = localStorage.getItem(storageKey);
        const existingMessages = existingData ? JSON.parse(existingData) : [];
        const updatedMessages = [...existingMessages.slice(-50), messageWithRoom]; // Keep last 50 messages
        localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
        setMessages(prev => [...prev, messageWithRoom]);
      } catch (error) {
        console.error('Fallback localStorage also failed:', error);
      }
    }
  }, [roomId, SOCKET_DISABLED]);

  const joinRoom = useCallback((userId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-room', { roomId, userId });
    } else {
      // Fallback behavior
      console.warn('Socket not connected, using fallback join');
      setUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    }
  }, [roomId]);

  const leaveRoom = useCallback((userId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-room', { roomId, userId });
    }
    setUsers(prev => prev.filter(id => id !== userId));
    setMessages([]);
  }, [roomId]);

  // Initialize socket connection
  useEffect(() => {
    if (SOCKET_DISABLED) {
      console.log('Socket.IO disabled, using localStorage-only mode');
      return;
    }
    
    if (socketRef.current?.connected) return;

    const connectSocket = async () => {
      try {
        socketRef.current = io(SIGNALING_SERVER, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
          console.log('Connected to signaling server');
          setIsConnected(true);
          setConnectionError(null);
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from signaling server');
          setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
          console.error('Signaling server connection error:', error);
          setConnectionError('Failed to connect to signaling server. Using fallback mode.');
          setIsConnected(true);
        });

        // Handle room events
        socket.on('user-joined', (data: { userId: string, roomId: string }) => {
          console.log('User joined:', data.userId);
          setUsers(prev => {
            if (!prev.includes(data.userId)) {
              return [...prev, data.userId];
            }
            return prev;
          });
        });

        socket.on('user-left', (data: { userId: string, roomId: string }) => {
          console.log('User left:', data.userId);
          setUsers(prev => prev.filter(id => id !== data.userId));
        });

        socket.on('room-users', (data: { users: string[] }) => {
          console.log('Room users updated:', data.users);
          setUsers(data.users);
        });

        // Handle WebRTC signaling messages
        socket.on('webrtc-message', (message: SignalingMessage) => {
          console.log('Received WebRTC message:', message.type);
          setMessages(prev => [...prev, message]);
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
        setConnectionError('Failed to initialize signaling. Using fallback mode.');
        setIsConnected(true);
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [SIGNALING_SERVER, SOCKET_DISABLED]);

  // Fallback polling for localStorage when socket is not available
  useEffect(() => {
    if (socketRef.current?.connected || !isConnected) return;

    const interval = setInterval(() => {
      try {
        const roomData = localStorage.getItem(`room_${roomId}`);
        const roomMessages = roomData ? JSON.parse(roomData) : [];
        
        setMessages(prevMessages => {
          const currentMessageIds = new Set(prevMessages.map(m => m.id));
          const newMessages = roomMessages.filter((msg: SignalingMessage) => 
            msg.id && !currentMessageIds.has(msg.id)
          );
          
          if (newMessages.length > 0) {
            const allMessages = [...prevMessages, ...newMessages];
            return allMessages.slice(-50); // Keep last 50 messages
          }
          
          return prevMessages;
        });
      } catch (error) {
        console.error('Error in fallback polling:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, roomId]);

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