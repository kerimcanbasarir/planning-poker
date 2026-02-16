"use client";

import { RoomProvider } from "@/context/RoomContext";
import CreateRoomForm from "@/components/home/CreateRoomForm";

export default function HomePage() {
  return (
    <RoomProvider>
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Planning Poker</h1>
          <p className="text-gray-400">Estimate stories together with your team in real-time</p>
        </div>
        <CreateRoomForm />
      </div>
    </RoomProvider>
  );
}
