"use client";

import { ParticipantView, Phase } from "@/types";
import ParticipantCard from "./ParticipantCard";

interface VotingTableProps {
  participants: ParticipantView[];
  phase: Phase;
}

export default function VotingTable({ participants, phase }: VotingTableProps) {
  const voters = participants.filter((p) => !p.isSpectator);
  const spectators = participants.filter((p) => p.isSpectator);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Poker table */}
      <div className="relative">
        <div className="bg-green-900/30 border-2 border-green-800/50 rounded-[60px] px-16 py-12 min-w-[300px] min-h-[180px] flex items-center justify-center">
          <span className="text-green-700/50 text-sm font-medium">
            {phase === "voting" ? "Pick your cards" : "Votes revealed!"}
          </span>
        </div>

        {/* Arrange voters around the table */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {voters.map((p) => (
            <ParticipantCard key={p.id} participant={p} phase={phase} />
          ))}
        </div>
      </div>

      {/* Spectators */}
      {spectators.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-gray-500">Spectators</p>
          <div className="flex flex-wrap justify-center gap-3">
            {spectators.map((p) => (
              <ParticipantCard key={p.id} participant={p} phase={phase} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
