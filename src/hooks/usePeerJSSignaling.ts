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

// Production WebRTC signaling using PeerJS
export const usePeerJSSignaling = (roomId: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<SignalingMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const currentUserRef = useRef<string>("");

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

      // Store in localStorage as backup
      try {
        const storageKey = `room_${roomId}`;
        const existingData = localStorage.getItem(storageKey);
        const existingMessages = existingData ? JSON.parse(existingData) : [];
        const updatedMessages = [
          ...existingMessages.slice(-50),
          messageWithRoom,
        ];
        localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
      } catch (error) {
        console.error("Failed to store message in localStorage:", error);
      }
    },
    [roomId],
  );

  const connectToPeer = useCallback((peerId: string) => {
    if (!peerRef.current || connectionsRef.current.has(peerId)) return;

    try {
      const conn = peerRef.current.connect(peerId, {
        metadata: { roomId, userId: currentUserRef.current },
      });

      conn.on("open", () => {
        console.log(`Connected to peer: ${peerId}`);
        connectionsRef.current.set(peerId, conn);
        
        setUsers((prev) => {
          if (!prev.includes(peerId)) {
            return [...prev, peerId];
          }
          return prev;
        });

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
        
        if (message.type === "user-joined" && message.userId && !users.includes(message.userId)) {
          setUsers((prev) => {
            if (!prev.includes(message.userId!)) {
              return [...prev, message.userId!];
            }
            return prev;
          });
        } else if (message.type === "user-left") {
          setUsers((prev) => prev.filter((id) => id !== message.userId));
        } else {
          setMessages((prev) => [...prev.slice(-49), message]);
        }
      });

      conn.on("close", () => {
        console.log(`Connection to ${peerId} closed`);
        connectionsRef.current.delete(peerId);
        setUsers((prev) => prev.filter((id) => id !== peerId));
      });

      conn.on("error", (error) => {
        console.error(`Connection error with ${peerId}:`, error);
        connectionsRef.current.delete(peerId);
      });
    } catch (error) {
      console.error(`Failed to connect to peer ${peerId}:`, error);
    }
  }, [roomId, users]);

  const joinRoom = useCallback(
    (userId: string) => {
      currentUserRef.current = userId;
      
      // Add self to users list
      setUsers((prev) => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });

      // Try to connect to existing peers in the room
      // In a real implementation, you'd get this list from a room service
      // For now, we'll use localStorage to share peer IDs
      try {
        const roomPeersKey = `room_peers_${roomId}`;
        const existingPeers = JSON.parse(localStorage.getItem(roomPeersKey) || "[]");
        
        // Add current peer to the room
        if (peerRef.current?.id && !existingPeers.includes(peerRef.current.id)) {
          existingPeers.push(peerRef.current.id);
          localStorage.setItem(roomPeersKey, JSON.stringify(existingPeers));
        }

        // Connect to existing peers
        existingPeers.forEach((peerId: string) => {
          if (peerId !== peerRef.current?.id) {
            connectToPeer(peerId);
          }
        });
      } catch (error) {
        console.error("Error joining room:", error);
      }
    },
    [roomId, connectToPeer],
  );

  const leaveRoom = useCallback(
    (userId: string) => {
      // Send leave message to all connections
      connectionsRef.current.forEach((conn) => {
        if (conn.open) {
          conn.send({
            type: "user-left",
            userId,
            roomId,
            timestamp: Date.now(),
          });
        }
      });

      // Close all connections
      connectionsRef.current.forEach((conn) => {
        conn.close();
      });
      connectionsRef.current.clear();

      // Remove from room peers list
      try {
        const roomPeersKey = `room_peers_${roomId}`;
        const existingPeers = JSON.parse(localStorage.getItem(roomPeersKey) || "[]");
        const updatedPeers = existingPeers.filter((id: string) => id !== peerRef.current?.id);
        localStorage.setItem(roomPeersKey, JSON.stringify(updatedPeers));
      } catch (error) {
        console.error("Error leaving room:", error);
      }

      setUsers([]);
      setMessages([]);
    },
    [roomId],
  );

  // Initialize PeerJS
  useEffect(() => {
    const connectionsMap = connectionsRef.current;
    
    // Create PeerJS instance with configuration
    peerRef.current = new Peer({
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
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
        
        setUsers((prev) => {
          if (!prev.includes(conn.peer)) {
            return [...prev, conn.peer];
          }
          return prev;
        });
      });

      conn.on("data", (data: unknown) => {
        const message = data as SignalingMessage;
        console.log(`Received message from ${conn.peer}:`, message.type);
        
        if (message.type === "user-joined" && message.userId && !users.includes(message.userId)) {
          setUsers((prev) => {
            if (!prev.includes(message.userId!)) {
              return [...prev, message.userId!];
            }
            return prev;
          });
        } else if (message.type === "user-left") {
          setUsers((prev) => prev.filter((id) => id !== message.userId));
        } else {
          setMessages((prev) => [...prev.slice(-49), message]);
        }
      });

      conn.on("close", () => {
        console.log(`Incoming connection closed: ${conn.peer}`);
        connectionsMap.delete(conn.peer);
        setUsers((prev) => prev.filter((id) => id !== conn.peer));
      });
    });

    peer.on("error", (error) => {
      console.error("PeerJS error:", error);
      setConnectionError(`Connection error: ${error.message}`);
      setIsConnected(false);
    });

    peer.on("disconnected", () => {
      console.log("PeerJS disconnected");
      setIsConnected(false);
    });

    return () => {
      // Cleanup
      connectionsMap.forEach((conn) => {
        conn.close();
      });
      connectionsMap.clear();
      
      if (peer && !peer.destroyed) {
        peer.destroy();
      }
    };
  }, [users]);

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