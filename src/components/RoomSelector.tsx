"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoomSelector() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const joinRoom = () => {
    if (!username.trim()) {
      alert("Please enter a username");
      return;
    }

    const finalRoomId =
      roomId.trim() || Math.random().toString(36).substring(2, 8).toUpperCase();

    const params = new URLSearchParams({
      username: username.trim(),
      camera: "true",
      microphone: "true",
    });

    router.push(`/room/${finalRoomId}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join Video Call
          </h1>
          <p className="text-gray-600">
            Enter your details to start or join a video call
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            maxLength={50}
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room ID (Optional)
          </label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="Enter room ID or leave blank"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase text-gray-900"
            maxLength={10}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave blank to create a new room
          </p>
        </div>

        <button
          onClick={joinRoom}
          disabled={!username.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all"
        >
          {roomId ? "Join Room" : "Create & Join Room"}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Share your room ID with others to invite them to the call
          </p>
        </div>
      </div>
    </div>
  );
}
