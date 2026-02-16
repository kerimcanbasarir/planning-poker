"use client";

import { ParticipantView, Phase } from "@/types";

interface ParticipantListProps {
  participants: ParticipantView[];
  phase: Phase;
}

export default function ParticipantList({ participants, phase }: ParticipantListProps) {
  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Participants ({participants.length})
      </h2>
      <ul className="space-y-2">
        {participants.map((p) => (
          <li key={p.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  p.isConnected ? "bg-green-500" : "bg-gray-600"
                }`}
              />
              <span className={p.isConnected ? "text-gray-200" : "text-gray-500"}>
                {p.name}
                {p.isCreator && (
                  <span className="ml-1 text-xs text-yellow-500" title="Room creator">&#9733;</span>
                )}
                {p.isSpectator && (
                  <span className="ml-1 text-xs text-gray-500">(spectator)</span>
                )}
              </span>
            </div>
            <div>
              {p.isSpectator ? null : phase === "revealed" && p.vote ? (
                <span className="text-indigo-400 font-mono font-bold">{p.vote}</span>
              ) : p.hasVoted ? (
                <span className="text-green-500 text-xs">voted</span>
              ) : (
                <span className="text-gray-600 text-xs">waiting</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
