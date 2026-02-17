"use client";

import { useEffect, useState } from "react";
import { EmojiAnimation } from "@/types";
import { ARENA_W, ARENA_H } from "@/lib/skills";

interface FlyingEmojiProps {
  animation: EmojiAnimation;
}

export default function FlyingEmoji({ animation }: FlyingEmojiProps) {
  const [phase, setPhase] = useState<"start" | "fly" | "burst">("start");

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("fly"));
    const t = setTimeout(() => setPhase("burst"), 1200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  const fromX = (animation.fromPos.x / ARENA_W) * 100;
  const fromY = (animation.fromPos.y / ARENA_H) * 100;
  const toX = (animation.toPos.x / ARENA_W) * 100;
  const toY = (animation.toPos.y / ARENA_H) * 100;

  const isAtTarget = phase === "fly" || phase === "burst";
  const x = isAtTarget ? toX : fromX;
  const y = isAtTarget ? toY : fromY;

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) scale(${phase === "burst" ? 1.4 : phase === "fly" ? 1 : 0.8})`,
        transition: phase === "start"
          ? "none"
          : "left 1.1s ease-out, top 1.1s ease-out, transform 0.3s ease-out, opacity 0.3s ease-out",
        opacity: phase === "burst" ? 0 : 1,
        fontSize: 20,
        pointerEvents: "none" as const,
        zIndex: 100,
      }}
    >
      {animation.emoji}
    </div>
  );
}
