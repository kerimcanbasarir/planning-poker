"use client";

import { useRoomContext } from "@/context/RoomContext";
import { Phase } from "@/types";
import Button from "@/components/ui/Button";

interface ControlPanelProps {
  isCreator: boolean;
  phase: Phase;
}

export default function ControlPanel({ isCreator, phase }: ControlPanelProps) {
  const { revealVotes, resetVotes } = useRoomContext();

  if (!isCreator) return null;

  return (
    <div className="flex justify-center gap-3 px-4 py-3">
      {phase === "voting" ? (
        <Button onClick={revealVotes}>
          Reveal Votes
        </Button>
      ) : (
        <Button onClick={resetVotes} variant="secondary">
          New Round
        </Button>
      )}
    </div>
  );
}
