"use client";

import { ParticipantView, Phase } from "@/types";
import { ARENA_W, ARENA_H } from "@/lib/skills";
import { useEffect, useRef, useState } from "react";

interface CharacterProps {
  participant: ParticipantView;
  phase: Phase;
  isMe: boolean;
  onClickCharacter?: (participantId: string) => void;
  activeSkillEffect?: string | null;
}

// Walking speed: server coordinate units per second
// 100 u/s → half-arena (400u) takes 4s, short click (150u) takes 1.5s
const MOVE_SPEED = 100;

// Margin from arena edges (server coords) to keep character fully visible
const EDGE_MARGIN = 50;

export default function Character({
  participant,
  phase,
  isMe,
  onClickCharacter,
  activeSkillEffect,
}: CharacterProps) {
  const { id, name, isSpectator, vote, hasVoted, isConnected, position } = participant;
  const [isWalking, setIsWalking] = useState(false);
  const walkTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Visual position tracking ──
  // Tracks the current CSS transition so we can compute WHERE the character
  // visually IS at any moment. This prevents the "instant teleport on rapid clicks"
  // bug where transition duration was calculated from server-position-delta instead
  // of the actual visual distance.
  const animRef = useRef({
    fromX: position.x,
    fromY: position.y,
    toX: position.x,
    toY: position.y,
    startTime: 0,
    duration: 0,
  });

  // Interpolate current visual position from the active CSS transition.
  // Uses linear interpolation to match CSS `transition-timing-function: linear`.
  function getCurrentVisualPos(): { x: number; y: number } {
    const a = animRef.current;
    if (a.duration <= 0) return { x: a.toX, y: a.toY };
    const elapsed = (performance.now() - a.startTime) / 1000;
    const t = Math.min(1, elapsed / a.duration);
    return {
      x: a.fromX + (a.toX - a.fromX) * t,
      y: a.fromY + (a.toY - a.fromY) * t,
    };
  }

  // ── Transition calculation ──
  // Compute distance from VISUAL position (where the character appears on screen)
  // to the new target. This is the key to consistent movement speed:
  // - Single click: visual pos == idle pos → full distance → proportional duration
  // - Rapid click mid-walk: visual pos == interpolated mid-point → correct remaining distance
  const currentVisual = getCurrentVisualPos();
  const dx = position.x - currentVisual.x;
  const dy = position.y - currentVisual.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const hasMoved = dist > 2;

  // Duration = visual_distance / speed, clamped to [0.35s, 8s]
  // 0.35s min: even tiny nudges feel deliberate
  // Examples at 100 u/s:
  //   50u keyboard step → 0.5s (nice step feel)
  //   200u short click  → 2.0s (calm walk)
  //   500u long click   → 5.0s (long stroll)
  const transitionSec = hasMoved ? Math.max(0.35, Math.min(dist / MOVE_SPEED, 8)) : 0;

  useEffect(() => {
    if (hasMoved) {
      // Snapshot the visual position RIGHT NOW as the transition start point
      const visual = getCurrentVisualPos();
      animRef.current = {
        fromX: visual.x,
        fromY: visual.y,
        toX: position.x,
        toY: position.y,
        startTime: performance.now(),
        duration: transitionSec,
      };

      setIsWalking(true);
      clearTimeout(walkTimerRef.current);
      walkTimerRef.current = setTimeout(
        () => setIsWalking(false),
        transitionSec * 1000 + 80
      );
    } else {
      // Tiny or no movement — just snap the animation target
      animRef.current.toX = position.x;
      animRef.current.toY = position.y;
      animRef.current.duration = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.x, position.y]);

  // Clamp display position so the character never goes outside the arena visually
  const displayX = Math.max(EDGE_MARGIN, Math.min(ARENA_W - EDGE_MARGIN, position.x));
  const displayY = Math.max(EDGE_MARGIN, Math.min(ARENA_H - EDGE_MARGIN, position.y));

  const getCardDisplay = () => {
    if (isSpectator) return null;
    if (phase === "revealed" && vote) return vote;
    if (hasVoted) return "?";
    return null;
  };

  const cardDisplay = getCardDisplay();

  const skillGlowClass =
    activeSkillEffect === "fireball" ? "skill-glow-fire" :
    activeSkillEffect === "freeze" ? "skill-glow-freeze" :
    activeSkillEffect === "zap" ? "skill-glow-zap" :
    activeSkillEffect === "heal" ? "skill-glow-heal" : "";

  return (
    <div
      className={`absolute flex flex-col items-center select-none ${skillGlowClass}`}
      style={{
        left: `${(displayX / ARENA_W) * 100}%`,
        top: `${(displayY / ARENA_H) * 100}%`,
        transform: "translate(-50%, -50%)",
        transition: hasMoved
          ? `left ${transitionSec}s linear, top ${transitionSec}s linear`
          : "none",
        zIndex: 10,
        cursor: isMe ? "default" : "pointer",
        opacity: isConnected ? 1 : 0.4,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isMe && onClickCharacter) {
          onClickCharacter(id);
        }
      }}
    >
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
          ${isMe ? "ring-2 ring-yellow-400/60" : "hover:ring-2 hover:ring-indigo-400/50"}
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

      {/* Legs — taller and more visible */}
      <div className={`flex gap-[3px] ${isWalking ? "character-walking" : ""}`}>
        <div className="character-leg-left w-[4px] h-5 bg-gray-400 rounded-b-full" />
        <div className="character-leg-right w-[4px] h-5 bg-gray-400 rounded-b-full" />
      </div>

      {/* Name */}
      <span
        className={`text-[10px] mt-0.5 truncate max-w-[70px] text-center font-medium ${
          isMe ? "text-yellow-300" : !isConnected ? "text-gray-600 line-through" : "text-gray-300"
        }`}
        title={name}
      >
        {name}
      </span>
    </div>
  );
}
