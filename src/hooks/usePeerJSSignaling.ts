import { useState, useEffect, useCallback, useRef } from "react";
import Peer, { DataConnection } from "peerjs";

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

// Production WebRTC signaling using PeerJS with better peer discovery
export const usePeerJSSignaling = (roomId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<SignalingMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const currentUserRef = useRef<string>("");
  const roomDiscoveryRef = useRef<DataConnection | null>(null);

  const sendMessage = useCallback(
    (message: SignalingMessage) => {
      const messageWithRoom = {
        ...message,
        roomId,
        userId: currentUserRef.current,
        timestamp: Date.now(),
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Send to all connected peers
      connectionsRef.current.forEach((conn, peerId) => {
        if (conn.open) {
          try {
            conn.send(messageWithRoom);
            console.log(`Sent message to ${peerId}:`, messageWithRoom.type);
          } catch (error) {
            console.error(`Failed to send message to ${peerId}:`, error);
          }
        }
      });

      // Also add to local messages
      setMessages((prev) => [...prev.slice(-49), messageWithRoom]);
    },
    [roomId],
  );

  const connectToPeer = useCallback((peerId: string) => {
    if (!peerRef.current || connectionsRef.current.has(peerId) || peerId === peerRef.current.id) {
      return;
    }

    console.log(`Attempting to connect to peer: ${peerId}`);
    
    try {
      const conn = peerRef.current.connect(peerId, {
        metadata: { roomId, userId: currentUserRef.current },
      });

      conn.on("open", () => {
        console.log(`Successfully connected to peer: ${peerId}`);
        connectionsRef.current.set(peerId, conn);
        
        // Send join notification
        conn.send({
          type: "user-joined",
          userId: currentUserRef.current,
          roomId,
          timestamp: Date.now(),
        });
      });

      conn.on("data", (data: unknown) => {
        const message = data as SignalingMessage;
        console.log(`Received message from ${peerId}:`, message.type);
        
        if (message.type === "user-joined" && message.userId) {
          setUsers((prev) => {
            if (!prev.includes(message.userId!)) {
              console.log(`User joined: ${message.userId}`);
              return [...prev, message.userId!];
            }
            return prev;
          });
        } else if (message.type === "user-left" && message.userId) {
          setUsers((prev) => {
            console.log(`User left: ${message.userId}`);
            return prev.filter((id) => id !== message.userId);
          });
        } else {
          setMessages((prev) => [...prev.slice(-49), message]);
        }
      });

      conn.on("close", () => {
        console.log(`Connection to ${peerId} closed`);
        connectionsRef.current.delete(peerId);
        setUsers((prev) => prev.filter((id) => id !== peerId && id !== currentUserRef.current));
      });

      conn.on("error", (error) => {
        console.error(`Connection error with ${peerId}:`, error);
        connectionsRef.current.delete(peerId);
      });
    } catch (error) {
      console.error(`Failed to connect to peer ${peerId}:`, error);
    }
  }, [roomId]);

  const joinRoom = useCallback(
    (userId: string) => {
      console.log(`Joining room ${roomId} as ${userId}`);
      currentUserRef.current = userId;
      
      // Add self to users list
      setUsers((prev) => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });

      // Simple peer discovery: try common peer ID patterns for this room
      if (peerRef.current) {
        console.log(`My peer ID: ${peerRef.current.id}`);
        
        // Store our peer ID publicly using a simple approach
        // We'll try to connect to other peers using predictable patterns
        const roomKey = `webrtc-room-${roomId}`;
        
        // Try to broadcast our presence and find other peers
        setTimeout(() => {
          // Try connecting to potential peer IDs
          for (let i = 1; i <= 10; i++) {
            const potentialPeerId = `${roomKey}-user-${i}`;
            if (potentialPeerId !== peerRef.current?.id) {
              setTimeout(() => connectToPeer(potentialPeerId), i * 500);
            }
          }
        }, 2000);

        console.log(`\n🔥 PEER CONNECTION INFO 🔥`);
        console.log(`Room ID: ${roomId}`);
        console.log(`My Peer ID: ${peerRef.current.id}`);
        console.log(`\nTo connect, your friend should:`);
        console.log(`1. Go to the same room: ${roomId}`);
        console.log(`2. Open browser console (F12)`);
        console.log(`3. Run: window.connectToPeer('${peerRef.current.id}')`);
        console.log(`\nYou can also run: window.connectToPeer('THEIR_PEER_ID')`);
        
        // Make connection function globally available for manual connection
        (window as unknown as { connectToPeer: (peerId: string) => void }).connectToPeer = (peerId: string) => {
          console.log(`Manually connecting to peer: ${peerId}`);
          connectToPeer(peerId);
        };
        
        (window as unknown as { myPeerId: string }).myPeerId = peerRef.current.id;
        console.log(`\nYour peer ID is also available as: window.myPeerId`);
      }
    },
    [roomId, connectToPeer],
  );

  const leaveRoom = useCallback(
    (userId: string) => {
      console.log(`Leaving room ${roomId} as ${userId}`);
      
      // Send leave message to all connections
      connectionsRef.current.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send({
              type: "user-left",
              userId,
              roomId,
              timestamp: Date.now(),
            });
          } catch (error) {
            console.error("Error sending leave message:", error);
          }
        }
      });

      // Close all connections
      connectionsRef.current.forEach((conn) => {
        conn.close();
      });
      connectionsRef.current.clear();

      if (roomDiscoveryRef.current) {
        roomDiscoveryRef.current.close();
        roomDiscoveryRef.current = null;
      }

      setUsers([]);
      setMessages([]);
    },
    [roomId],
  );

  // Initialize PeerJS
  useEffect(() => {
    console.log(`Initializing PeerJS for room: ${roomId}`);
    const connectionsMap = connectionsRef.current;
    
    // Create PeerJS instance with random ID
    peerRef.current = new Peer({
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      },
    });

    const peer = peerRef.current;

    peer.on("open", (id) => {
      console.log(`PeerJS connected with ID: ${id}`);
      setIsConnected(true);
      setConnectionError(null);
    });

    peer.on("connection", (conn) => {
      console.log(`Incoming connection from: ${conn.peer}`);
      
      conn.on("open", () => {
        console.log(`Incoming connection established: ${conn.peer}`);
        connectionsMap.set(conn.peer, conn);
        
        // Send our join notification to the new connection
        conn.send({
          type: "user-joined",
          userId: currentUserRef.current,
          roomId,
          timestamp: Date.now(),
        });
      });

      conn.on("data", (data: unknown) => {
        const message = data as SignalingMessage;
        console.log(`Received message from ${conn.peer}:`, message.type);
        
        if (message.type === "user-joined" && message.userId) {
          setUsers((prev) => {
            if (!prev.includes(message.userId!)) {
              console.log(`User joined via incoming connection: ${message.userId}`);
              return [...prev, message.userId!];
            }
            return prev;
          });
        } else if (message.type === "user-left" && message.userId) {
          setUsers((prev) => {
            console.log(`User left via incoming connection: ${message.userId}`);
            return prev.filter((id) => id !== message.userId);
          });
        } else {
          setMessages((prev) => [...prev.slice(-49), message]);
        }
      });

      conn.on("close", () => {
        console.log(`Incoming connection closed: ${conn.peer}`);
        connectionsMap.delete(conn.peer);
        setUsers((prev) => prev.filter((id) => id !== conn.peer && id !== currentUserRef.current));
      });

      conn.on("error", (error) => {
        console.error(`Incoming connection error from ${conn.peer}:`, error);
        connectionsMap.delete(conn.peer);
      });
    });

    peer.on("error", (error) => {
      console.error("PeerJS error:", error);
      if (error.type === 'unavailable-id') {
        // Try again with a different ID
        console.log("Peer ID unavailable, will retry...");
      } else {
        setConnectionError(`Connection error: ${error.message}`);
      }
      setIsConnected(false);
    });

    peer.on("disconnected", () => {
      console.log("PeerJS disconnected, attempting to reconnect...");
      setIsConnected(false);
      
      // Try to reconnect
      setTimeout(() => {
        if (peer && !peer.destroyed) {
          peer.reconnect();
        }
      }, 3000);
    });

    return () => {
      console.log("Cleaning up PeerJS connections");
      // Cleanup
      connectionsMap.forEach((conn) => {
        conn.close();
      });
      connectionsMap.clear();
      
      if (roomDiscoveryRef.current) {
        roomDiscoveryRef.current.close();
      }
      
      if (peer && !peer.destroyed) {
        peer.destroy();
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