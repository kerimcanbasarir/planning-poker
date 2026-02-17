"use client";

import { ParticipantView, Phase } from "@/types";
import { useRoomContext } from "@/context/RoomContext";
import { useState, useCallback, useRef, useEffect } from "react";
import { ARENA_W, ARENA_H } from "@/lib/skills";
import Character from "./Character";
import ActionPicker from "./ActionPicker";
import FlyingEmoji from "./FlyingEmoji";
import SkillEffect from "./SkillEffect";

interface VotingTableProps {
  participants: ParticipantView[];
  phase: Phase;
}

// Keyboard movement tuned to match mouse-click walking speed (180 u/s):
// Each step = 50u, interval = 280ms → 50/0.28 = 178 u/s (≈ mouse speed).
// Character.tsx computes transition = 50/180 = 0.278s per step,
// so each CSS transition finishes RIGHT as the next step fires — seamless walking.
const KEYBOARD_STEP = 50;
const KEYBOARD_INTERVAL = 280;

export default function VotingTable({ participants, phase }: VotingTableProps) {
  const {
    socket,
    movePlayer,
    throwEmoji,
    useSkill,
    emojiAnimations,
    skillAnimations,
    activeSkillEffects,
  } = useRoomContext();
  const [pickerTarget, setPickerTarget] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const arenaRef = useRef<HTMLDivElement>(null);

  const myId = socket?.id;

  // Refs for keyboard movement
  const roomRef = useRef(participants);
  roomRef.current = participants;
  const movePlayerRef = useRef(movePlayer);
  movePlayerRef.current = movePlayer;
  const myIdRef = useRef(myId);
  myIdRef.current = myId;

  // WASD / Arrow key movement
  // LOCAL position tracking: avoids reading stale server state between rapid steps.
  // Each step adds to intendedPos immediately, so the character walks smoothly
  // without waiting for server round-trip confirmation.
  useEffect(() => {
    const pressedKeys = new Set<string>();
    let intervalId: number | null = null;
    // Local intended position — initialized from server on first keypress,
    // then updated locally on each step so rapid steps chain correctly.
    let intendedPos: { x: number; y: number } | null = null;

    function getMyServerPos() {
      const me = roomRef.current.find((p) => p.id === myIdRef.current);
      return me?.position;
    }

    function handleMove() {
      // On first step, seed from server; on subsequent steps, use local intended pos
      if (!intendedPos) {
        const serverPos = getMyServerPos();
        if (!serverPos) return;
        intendedPos = { x: serverPos.x, y: serverPos.y };
      }

      let ndx = 0;
      let ndy = 0;
      if (pressedKeys.has("w") || pressedKeys.has("arrowup")) ndy -= KEYBOARD_STEP;
      if (pressedKeys.has("s") || pressedKeys.has("arrowdown")) ndy += KEYBOARD_STEP;
      if (pressedKeys.has("a") || pressedKeys.has("arrowleft")) ndx -= KEYBOARD_STEP;
      if (pressedKeys.has("d") || pressedKeys.has("arrowright")) ndx += KEYBOARD_STEP;

      if (ndx !== 0 || ndy !== 0) {
        // Clamp to arena bounds
        const newX = Math.max(0, Math.min(ARENA_W, intendedPos.x + ndx));
        const newY = Math.max(0, Math.min(ARENA_H, intendedPos.y + ndy));
        intendedPos = { x: newX, y: newY };
        movePlayerRef.current(newX, newY);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
        if (!pressedKeys.has(key)) {
          pressedKeys.add(key);
          if (!intervalId) {
            handleMove();
            intervalId = window.setInterval(handleMove, KEYBOARD_INTERVAL);
          }
        }
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      pressedKeys.delete(key);
      if (pressedKeys.size === 0 && intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        // Reset intended pos so next keypress re-seeds from server
        // (in case server adjusted position due to collision)
        intendedPos = null;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleArenaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!arenaRef.current) return;
      const target = e.target as HTMLElement;
      // Only move when clicking on the arena background (not on characters or picker)
      if (
        target !== arenaRef.current &&
        !target.classList.contains("arena-bg") &&
        !target.closest(".arena-bg")
      ) return;

      const rect = arenaRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * ARENA_W;
      const y = ((e.clientY - rect.top) / rect.height) * ARENA_H;
      movePlayer(x, y);
      setPickerTarget(null);
    },
    [movePlayer]
  );

  const handleCharacterClick = useCallback((participantId: string) => {
    const target = participants.find((p) => p.id === participantId);
    if (!target) return;
    setPickerTarget(participantId);
    setPickerPos({ x: target.position.x, y: target.position.y });
  }, [participants]);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      if (!pickerTarget) return;
      throwEmoji(pickerTarget, emoji);
      // Don't close picker - allow rapid fire
    },
    [pickerTarget, throwEmoji]
  );

  const handleSkillSelect = useCallback(
    (skill: "fireball" | "freeze" | "zap" | "heal") => {
      if (!pickerTarget) return;
      useSkill(pickerTarget, skill);
      // Don't close picker - allow rapid fire
    },
    [pickerTarget, useSkill]
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Arena - fills container, no border */}
      <div
        ref={arenaRef}
        className="relative flex-1 overflow-hidden cursor-crosshair"
        onClick={handleArenaClick}
      >
        {/* Rectangular poker table in center */}
        <div className="arena-bg absolute inset-0 flex items-center justify-center">
          <div
            className="arena-bg bg-green-900/30 border-2 border-green-800/50 rounded-[40px]"
            style={{ width: "25%", height: "50%" }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-green-700/50 text-sm font-medium">
                {phase === "voting" ? "Pick your cards" : "Votes revealed!"}
              </span>
            </div>
          </div>
        </div>

        {/* Characters */}
        {participants.map((p) => (
          <Character
            key={p.id}
            participant={p}
            phase={phase}
            isMe={p.id === myId}
            onClickCharacter={handleCharacterClick}
            activeSkillEffect={activeSkillEffects[p.id] || null}
          />
        ))}

        {/* Action picker popup */}
        {pickerTarget && (
          <ActionPicker
            x={pickerPos.x}
            y={pickerPos.y}
            onEmojiSelect={handleEmojiSelect}
            onSkillSelect={handleSkillSelect}
            onClose={() => setPickerTarget(null)}
          />
        )}

        {/* Flying emojis */}
        {emojiAnimations.map((anim) => (
          <FlyingEmoji key={anim.id} animation={anim} />
        ))}

        {/* Skill effects */}
        {skillAnimations.map((anim) => (
          <SkillEffect key={anim.id} animation={anim} arenaRef={arenaRef} />
        ))}
      </div>
    </div>
  );
}
