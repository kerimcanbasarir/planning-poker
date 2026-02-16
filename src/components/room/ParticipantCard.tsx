"use client";

import { ParticipantView, Phase } from "@/types";

interface ParticipantCardProps {
  participant: ParticipantView;
  phase: Phase;
}

export default function ParticipantCard({ participant, phase }: ParticipantCardProps) {
  const { name, isSpectator, vote, hasVoted, isConnected } = participant;

  const getCardDisplay = () => {
    if (isSpectator) return null;
    if (phase === "revealed" && vote) return vote;
    if (hasVoted) return "?";
    return null;
  };

  const cardDisplay = getCardDisplay();

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Card */}
      <div
        className={`
          w-14 h-20 rounded-lg flex items-center justify-center text-sm font-bold
          transition-all duration-300
          ${isSpectator
            ? "border border-dashed border-gray-600 text-gray-500"
            : hasVoted
              ? phase === "revealed"
                ? "bg-indigo-600 text-white border-2 border-indigo-400"
                : "bg-green-600/80 text-green-100 border-2 border-green-500"
              : "bg-gray-800 border-2 border-gray-600 text-gray-500"
          }
        `}
      >
        {isSpectator ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ) : (
          cardDisplay || "-"
        )}
      </div>

      {/* Name */}
      <span
        className={`text-xs truncate max-w-[70px] text-center ${
          !isConnected ? "text-gray-600 line-through" : "text-gray-300"
        }`}
        title={name}
      >
        {name}
      </span>
    </div>
  );
}
