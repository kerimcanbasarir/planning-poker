"use client";

import { useRoomContext } from "@/context/RoomContext";
import { CardSetType } from "@/types";
import { cardSets } from "@/lib/cardSets";
import VoteCard from "./VoteCard";

interface CardDeckProps {
  cardSetType: CardSetType;
  myVote: string | null;
}

export default function CardDeck({ cardSetType, myVote }: CardDeckProps) {
  const { castVote } = useRoomContext();
  const cards = cardSets[cardSetType].values;

  return (
    <div className="border-t border-gray-800 px-4 py-4">
      <p className="text-center text-xs text-gray-500 mb-3">Choose your estimate</p>
      <div className="flex flex-wrap justify-center gap-3">
        {cards.map((value) => (
          <VoteCard
            key={value}
            value={value}
            isSelected={myVote === value}
            onClick={() => castVote(value)}
          />
        ))}
      </div>
    </div>
  );
}
