"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { RoomProvider, useRoomContext } from "@/context/RoomContext";
import JoinGate from "./JoinGate";
import VotingTable from "@/components/room/VotingTable";
import CardDeck from "@/components/room/CardDeck";
import IssueBar from "@/components/room/IssueBar";
import ControlPanel from "@/components/room/ControlPanel";
import ParticipantList from "@/components/room/ParticipantList";
import ResultsPanel from "@/components/room/ResultsPanel";
import InviteLink from "@/components/room/InviteLink";

function RoomContent({ roomId }: { roomId: string }) {
  const [joined, setJoined] = useState(false);
  const handleJoined = useCallback(() => setJoined(true), []);

  if (!joined) {
    return <JoinGate roomId={roomId} onJoined={handleJoined} />;
  }

  return <RoomView />;
}

function RoomView() {
  const { room, results, socket } = useRoomContext();

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading room...</p>
      </div>
    );
  }

  const me = room.participants.find((p) => p.id === socket?.id);
  const isCreator = me?.isCreator ?? false;
  const isSpectator = me?.isSpectator ?? false;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">{room.name}</h1>
          <p className="text-xs text-gray-500">Room: {room.id}</p>
        </div>
        <InviteLink roomId={room.id} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main area */}
        <main className="flex flex-1 flex-col">
          <IssueBar
            currentIssue={room.currentIssue}
            isCreator={isCreator}
          />

          <div className="flex-1 flex items-center justify-center p-4">
            <VotingTable
              participants={room.participants}
              phase={room.phase}
            />
          </div>

          {room.phase === "revealed" && results && (
            <ResultsPanel results={results} />
          )}

          <ControlPanel isCreator={isCreator} phase={room.phase} />

          {!isSpectator && room.phase === "voting" && (
            <CardDeck
              cardSetType={room.cardSetType}
              myVote={me?.vote ?? null}
            />
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-64 border-l border-gray-800 overflow-y-auto hidden lg:block">
          <ParticipantList participants={room.participants} phase={room.phase} />
        </aside>
      </div>
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  return (
    <RoomProvider>
      <RoomContent roomId={roomId} />
    </RoomProvider>
  );
}
