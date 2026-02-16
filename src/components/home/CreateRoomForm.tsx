"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoomContext } from "@/context/RoomContext";
import { CardSetType } from "@/types";
import { cardSets } from "@/lib/cardSets";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function CreateRoomForm() {
  const router = useRouter();
  const { socket, isConnected, createRoom, error } = useRoomContext();
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [cardSetType, setCardSetType] = useState<CardSetType>("fibonacci");

  useEffect(() => {
    if (!socket) return;
    function onCreated({ roomId }: { roomId: string }) {
      sessionStorage.setItem("pp_userName", userName);
      sessionStorage.setItem("pp_justCreated", "1");
      router.push(`/room/${roomId}`);
    }
    socket.on("room:created", onCreated);
    return () => {
      socket.off("room:created", onCreated);
    };
  }, [socket, router, userName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || !userName.trim()) return;
    createRoom(roomName.trim(), cardSetType, userName.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-md">
      <Input
        id="userName"
        label="Your Name"
        placeholder="Enter your name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        required
        maxLength={30}
      />
      <Input
        id="roomName"
        label="Room Name"
        placeholder="Sprint 42 Planning"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        required
        maxLength={50}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-300">Card Set</label>
        <div className="flex gap-3">
          {(Object.keys(cardSets) as CardSetType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setCardSetType(type)}
              className={`flex-1 rounded-lg border px-4 py-3 text-center transition-colors ${
                cardSetType === type
                  ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                  : "border-gray-600 bg-gray-800 text-gray-400 hover:border-gray-500"
              }`}
            >
              <div className="font-medium">{cardSets[type].label}</div>
              <div className="mt-1 text-xs text-gray-500">
                {cardSets[type].values.slice(0, 5).join(", ")}...
              </div>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button type="submit" size="lg" disabled={!isConnected}>
        {isConnected ? "Create Room" : "Connecting..."}
      </Button>
    </form>
  );
}
