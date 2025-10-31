import { useState, useRef, useCallback, useMemo } from "react";

interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  isMuted: boolean;
  isVideoOff: boolean;
  signalingState: RTCSignalingState;
  isInitiator: boolean;
}

export const useWebRTC = () => {
  const [state, setState] = useState<WebRTCState>({
    localStream: null,
    remoteStream: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    isMuted: false,
    isVideoOff: false,
    signalingState: "stable",
    isInitiator: false,
  });

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);

  const iceServers = useMemo(
    () => [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
    [],
  );

  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) return;

    peerConnection.current = new RTCPeerConnection({
      iceServers,
    });

    // Handle remote stream
    peerConnection.current.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setState((prev) => ({ ...prev, remoteStream }));
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle connection state changes with debouncing
    peerConnection.current.onconnectionstatechange = () => {
      const connectionState = peerConnection.current?.connectionState;
      setState((prev) => {
        // Only update if state actually changed
        const newIsConnected = connectionState === "connected";
        const newIsConnecting = connectionState === "connecting";
        const newError =
          connectionState === "failed" ? "Connection failed" : null;

        if (
          prev.isConnected !== newIsConnected ||
          prev.isConnecting !== newIsConnecting ||
          prev.error !== newError
        ) {
          return {
            ...prev,
            isConnected: newIsConnected,
            isConnecting: newIsConnecting,
            error: newError,
          };
        }
        return prev;
      });
    };

    // Handle signaling state changes with debouncing
    peerConnection.current.onsignalingstatechange = () => {
      const signalingState = peerConnection.current?.signalingState || "stable";
      setState((prev) => {
        // Only update if state actually changed
        if (prev.signalingState !== signalingState) {
          console.log("Signaling state changed to:", signalingState);
          return { ...prev, signalingState };
        }
        return prev;
      });
    };

    // Create data channel for messaging
    dataChannel.current = peerConnection.current.createDataChannel("messages");

    // Setup ICE candidate handling
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real app, you'd send this to the remote peer via your signaling server
        console.log("ICE candidate:", event.candidate);
      }
    };
  }, [iceServers]);

  const startLocalVideo = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera/microphone access not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.",
        );
      }

      // Check if we're in a secure context for production
      if (typeof window !== "undefined" && !window.isSecureContext) {
        throw new Error(
          "Camera access requires HTTPS. This app works best when deployed to a secure server.",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setState((prev) => ({ ...prev, localStream: stream }));

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      initializePeerConnection();

      // Add tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });

      return stream;
    } catch (error) {
      let errorMessage = "Failed to access camera/microphone";

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Camera/microphone access denied. Please click the camera icon in your browser's address bar and allow permissions, then refresh the page.";
        } else if (error.name === "NotFoundError") {
          errorMessage =
            "No camera/microphone found. Please connect a camera and microphone and refresh the page.";
        } else if (error.name === "NotSupportedError") {
          errorMessage =
            "Camera/microphone not supported. Please use a modern browser like Chrome, Firefox, or Safari.";
        } else if (error.name === "NotReadableError") {
          errorMessage =
            "Camera/microphone is being used by another application. Please close other apps using your camera and try again.";
        } else if (
          error.message.includes("getUserMedia") ||
          error.message.includes("HTTPS")
        ) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({ ...prev, error: errorMessage }));
      throw new Error(errorMessage);
    }
  }, [initializePeerConnection]);

  const createOffer = useCallback(async () => {
    if (!peerConnection.current) return null;

    try {
      // Check current signaling state before creating offer
      const currentState = peerConnection.current.signalingState;
      console.log(
        "Current signaling state before creating offer:",
        currentState,
      );

      // Only create offer if we're in the right state
      if (currentState === "stable") {
        const offer = await peerConnection.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await peerConnection.current.setLocalDescription(offer);
        setState((prev) => ({ ...prev, isInitiator: true }));
        return offer;
      } else {
        console.warn("Cannot create offer in current state:", currentState);
        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to create offer",
      }));
      return null;
    }
  }, []);

  const createAnswer = useCallback(async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current) return null;

    try {
      // Check current signaling state before setting remote description
      const currentState = peerConnection.current.signalingState;
      console.log(
        "Current signaling state before setting remote offer:",
        currentState,
      );

      // Only set remote description if we're in the right state
      if (currentState === "stable" || currentState === "have-local-offer") {
        await peerConnection.current.setRemoteDescription(offer);
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        return answer;
      } else {
        console.warn(
          "Cannot set remote description in current state:",
          currentState,
        );
        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to create answer",
      }));
      return null;
    }
  }, []);

  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      if (!peerConnection.current) return;

      try {
        // Check current signaling state before setting remote description
        const currentState = peerConnection.current.signalingState;
        console.log(
          "Current signaling state before setting remote answer:",
          currentState,
        );

        // Only set remote description if we're in the right state
        if (currentState === "have-local-offer") {
          await peerConnection.current.setRemoteDescription(answer);
        } else {
          console.warn(
            "Cannot set remote answer in current state:",
            currentState,
          );
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to handle answer",
        }));
      }
    },
    [],
  );

  const addIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.addIceCandidate(candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    },
    [],
  );

  const toggleMute = useCallback(() => {
    if (state.localStream) {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newMutedState = !audioTrack.enabled;
        audioTrack.enabled = !newMutedState;

        // Only update state if it actually changed
        setState((prev) => {
          if (prev.isMuted !== newMutedState) {
            return { ...prev, isMuted: newMutedState };
          }
          return prev;
        });
      }
    }
  }, [state.localStream]);

  const toggleVideo = useCallback(() => {
    if (state.localStream) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newVideoOffState = !videoTrack.enabled;
        videoTrack.enabled = !newVideoOffState;

        // Only update state if it actually changed
        setState((prev) => {
          if (prev.isVideoOff !== newVideoOffState) {
            return { ...prev, isVideoOff: newVideoOffState };
          }
          return prev;
        });
      }
    }
  }, [state.localStream]);

  const resetPeerConnection = useCallback(() => {
    console.log("Resetting peer connection...");

    // Close existing connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Clear video elements
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Reset state
    setState((prev) => ({
      ...prev,
      remoteStream: null,
      isConnected: false,
      isConnecting: false,
      signalingState: "stable",
      isInitiator: false,
      error: null,
    }));

    // Reinitialize
    initializePeerConnection();

    // Re-add local tracks if available
    if (state.localStream) {
      state.localStream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, state.localStream!);
      });
    }
  }, [initializePeerConnection, state.localStream]);

  const endCall = useCallback(() => {
    // Stop all tracks
    state.localStream?.getTracks().forEach((track) => track.stop());
    state.remoteStream?.getTracks().forEach((track) => track.stop());

    // Close peer connection
    peerConnection.current?.close();
    peerConnection.current = null;

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // Reset state
    setState({
      localStream: null,
      remoteStream: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      isMuted: false,
      isVideoOff: false,
      signalingState: "stable",
      isInitiator: false,
    });
  }, [state.localStream, state.remoteStream]);

  // Demo mode - works without camera access
  const startDemoMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: "Demo mode: Camera access not available. Using placeholder mode.",
      isConnected: true,
      isConnecting: false,
    }));
    initializePeerConnection();
  }, [initializePeerConnection]);

  return {
    ...state,
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
    peerConnection: peerConnection.current,
  };
};
