"use client";

import { useState, useEffect } from "react";
import { useRoomContext } from "@/context/RoomContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface JoinGateProps {
  roomId: string;
  onJoined: () => void;
}

export default function JoinGate({ roomId, onJoined }: JoinGateProps) {
  const { isConnected, joinRoom, room, error } = useRoomContext();
  const [userName, setUserName] = useState("");
  const [isSpectator, setIsSpectator] = useState(false);

  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("pp_userName");
    if (saved) setUserName(saved);
  }, []);

  // Auto-join for creator (navigated from create page)
  useEffect(() => {
    if (!isConnected || autoJoinAttempted) return;
    const saved = sessionStorage.getItem("pp_userName");
    const isFromCreate = sessionStorage.getItem("pp_justCreated");
    if (saved && isFromCreate) {
      sessionStorage.removeItem("pp_justCreated");
      setAutoJoinAttempted(true);
      joinRoom(roomId, saved, false);
    }
  }, [isConnected, autoJoinAttempted, joinRoom, roomId]);

  useEffect(() => {
    if (room && room.id === roomId) {
      onJoined();
    }
  }, [room, roomId, onJoined]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;
    sessionStorage.setItem("pp_userName", userName.trim());
    joinRoom(roomId, userName.trim(), isSpectator);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Join Room</h1>
        <p className="text-gray-400">Enter your name to join the planning session</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm">
        <Input
          id="joinName"
          label="Your Name"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
          maxLength={30}
        />
        <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isSpectator}
            onChange={(e) => setIsSpectator(e.target.checked)}
            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm">Join as spectator (can&apos;t vote)</span>
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button type="submit" size="lg" disabled={!isConnected}>
          {isConnected ? "Join Room" : "Connecting..."}
        </Button>
      </form>
    </div>
  );
}
