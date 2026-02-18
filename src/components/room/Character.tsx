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
  fighterSide?: "high" | "low" | null;
}

// Walking speed: server coordinate units per second
// 100 u/s → short click (150u) = 1.5s, medium (300u) = 3s, long (600u) = 6s
const MOVE_SPEED = 100;

export default function Character({
  participant,
  phase,
  isMe,
  onClickCharacter,
  activeSkillEffect,
  fighterSide,
}: CharacterProps) {
  const { id, name, isSpectator, vote, hasVoted, isConnected, position } = participant;
  const [isWalking, setIsWalking] = useState(false);
  const walkTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Visual position tracking ──────────────────────────────────────
  // Tracks the active CSS transition so we can compute WHERE the character
  // visually IS at any moment. This prevents the "instant teleport on rapid
  // clicks" bug: without this, transition duration was calculated from
  // server-position-delta (old target → new target), but the character was
  // visually mid-walk somewhere else → wrong duration → teleport feeling.
  //
  // With this, we interpolate the character's visual position from the
  // ongoing transition, then compute the REAL visual distance to the new
  // target → correct, consistent walking speed every time.
  const animRef = useRef({
    fromX: position.x,
    fromY: position.y,
    toX: position.x,
    toY: position.y,
    startTime: 0,
    duration: 0,
  });

  function getCurrentVisualPos(): { x: number; y: number } {
    const a = animRef.current;
    if (a.duration <= 0) return { x: a.toX, y: a.toY };
    const elapsed = (performance.now() - a.startTime) / 1000;
    const t = Math.min(1, elapsed / a.duration);
    // Linear interpolation — matches CSS `linear` easing
    return {
      x: a.fromX + (a.toX - a.fromX) * t,
      y: a.fromY + (a.toY - a.fromY) * t,
    };
  }

  // ── Transition calculation ────────────────────────────────────────
  // Distance from VISUAL position to new target.
  // If character is idle: visual == target → dist is full click distance.
  // If character is mid-walk: visual is interpolated → dist is the real
  // remaining/redirected distance → correct transition duration.
  const currentVisual = getCurrentVisualPos();
  const dx = position.x - currentVisual.x;
  const dy = position.y - currentVisual.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const hasMoved = dist > 2;

  // Duration = visual_distance / speed
  // Min 0.35s: even tiny nudges feel deliberate, never "instant"
  // Max 8s: cross-arena walks don't take forever
  const transitionSec = hasMoved ? Math.max(0.35, Math.min(dist / MOVE_SPEED, 8)) : 0;

  useEffect(() => {
    if (hasMoved) {
      // Snapshot visual position as the start of new transition
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
      // Tiny/no movement — update target without animating
      animRef.current.toX = position.x;
      animRef.current.toY = position.y;
      animRef.current.duration = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.x, position.y]);

  // ── Position as percentage ────────────────────────────────────────
  // The key trick for keeping characters fully inside the container:
  //   left: pctX%   +   transform: translate(-pctX%, -pctY%)
  //
  // At pctX=0%:   left=0%, translateX=0%      → left edge at container left   ✓
  // At pctX=50%:  left=50%, translateX=-50%    → centered                      ✓
  // At pctX=100%: left=100%, translateX=-100%  → right edge at container right ✓
  //
  // The character is ALWAYS fully inside, no clipping at edges.
  const pctX = (position.x / ARENA_W) * 100;
  const pctY = (position.y / ARENA_H) * 100;

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
        left: `${pctX}%`,
        top: `${pctY}%`,
        transform: `translate(-${pctX}%, -${pctY}%)`,
        transition: transitionSec > 0
          ? `left ${transitionSec}s linear, top ${transitionSec}s linear, transform ${transitionSec}s linear`
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
      {/* Fighter badge */}
      {fighterSide && (
        <span className={`text-base leading-none mb-0.5 ${fighterSide === "high" ? "fighter-badge-high" : "fighter-badge-low"}`}>&#9876;&#65039;</span>
      )}

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

      {/* Legs with cute shoes */}
      <div className={`flex gap-[4px] ${isWalking ? "character-walking" : ""}`}>
        <div className="character-leg-left relative w-[4px] h-5 bg-gray-400">
          <div className="absolute -bottom-[4px] -left-[3px] w-[10px] h-[6px] bg-amber-700 rounded-t-[2px] rounded-b-[4px]" />
        </div>
        <div className="character-leg-right relative w-[4px] h-5 bg-gray-400">
          <div className="absolute -bottom-[4px] -left-[3px] w-[10px] h-[6px] bg-amber-700 rounded-t-[2px] rounded-b-[4px]" />
        </div>
      </div>

      {/* Name */}
      <span
        className={`text-[10px] mt-1.5 truncate max-w-[70px] text-center font-medium ${
          isMe ? "text-yellow-300" : !isConnected ? "text-gray-600 line-through" : "text-gray-300"
        }`}
        title={name}
      >
        {name}
      </span>
    </div>
  );
}
