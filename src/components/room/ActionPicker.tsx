"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { SkillType } from "@/types";
import { EMOJIS, SKILLS, ARENA_W, ARENA_H } from "@/lib/skills";

interface ActionPickerProps {
  x: number; // server coordinates (character position)
  y: number;
  onEmojiSelect: (emoji: string) => void;
  onSkillSelect: (skill: SkillType) => void;
  onClose: () => void;
}

const FAVORITES_KEY = "poker-emoji-favorites";
const DEFAULT_FAVORITES = ["🔥", "❤️", "💩", "👍", "👎"];

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);

    if (!stored) return DEFAULT_FAVORITES;

    const parsed = JSON.parse(stored) as Record<string, number>;

    const sorted = Object.entries(parsed)
      .sort((a, b) => b[1] - a[1])
      .map(([emoji]) => emoji);

    // defaultları da ekle, tekrar etmeyecek şekilde
    const merged = [
      ...sorted,
      ...DEFAULT_FAVORITES.filter((e) => !sorted.includes(e)),
    ];

    return merged.slice(0, 5);
  } catch {
    return DEFAULT_FAVORITES;
  }
}

function recordUsage(emoji: string) {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    const counts: Record<string, number> = stored ? JSON.parse(stored) : {};
    counts[emoji] = (counts[emoji] || 0) + 1;
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(counts));
  } catch {}
}

export default function ActionPicker({
  x,
  y,
  onEmojiSelect,
  onSkillSelect,
  onClose,
}: ActionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showAllEmojis, setShowAllEmojis] = useState(false);

  // Load favorites ONCE on mount — don't re-sort while user is clicking
  const favorites = useMemo(() => loadFavorites(), []);
  const remainingEmojis = useMemo(
    () => EMOJIS.filter((e) => !favorites.includes(e)),
    [favorites]
  );

  const handleEmoji = (emoji: string) => {
    recordUsage(emoji);
    onEmojiSelect(emoji);
    // favorites are NOT updated here — prevents buttons shifting mid-click
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Smart positioning based on character location in arena
  const charPctX = (x / ARENA_W) * 100;
  const charPctY = (y / ARENA_H) * 100;

  // Vertical: above character by default, below if too close to top
  const showBelow = charPctY < 30;
  const pctY = showBelow ? charPctY + 12 : charPctY - 12;

  // Horizontal: center on character, shift if near edges
  const pctX = Math.max(12, Math.min(88, charPctX));

  // Emoji list opens to the side
  const listOpensRight = charPctX < 60;

  return (
    <div
      ref={ref}
      className="absolute z-50"
      style={{
        left: `${pctX}%`,
        top: `${pctY}%`,
        transform: showBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-1.5" style={{ flexDirection: listOpensRight ? "row" : "row-reverse" }}>
        {/* Main picker */}
        <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-xl shadow-2xl p-2.5">
          {/* Favorites row */}
          <div className="flex items-center gap-1.5 mb-2">
            {favorites.map((emoji, i) => (
              <button
                key={`fav-${i}`}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-600 active:scale-90 transition-all text-lg"
                onClick={() => handleEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
            {/* <button
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-600 transition-colors text-xs text-gray-400 border border-gray-600"
              onClick={() => setShowAllEmojis(!showAllEmojis)}
              title={showAllEmojis ? "Close emoji list" : "All emojis"}
            > */}
              {/* {showAllEmojis ? "\u2715" : "+"} */}
            {/* </button> */}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-600 mb-2" />

          {/* Skills */}
          <div className="flex gap-1 justify-center">
            {(Object.values(SKILLS) as typeof SKILLS[SkillType][]).map((skill) => (
              <button
                key={skill.type}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-gray-600 active:scale-90 transition-all"
                onClick={() => onSkillSelect(skill.type)}
                title={skill.label}
              >
                <span className="text-base">{skill.emoji}</span>
                <span className="text-[8px] text-gray-400">{skill.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emoji list panel — opens to the side */}
        {/* {showAllEmojis && (
          <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-xl shadow-2xl p-3">
            <p className="text-[10px] text-gray-400 mb-2 px-0.5 font-medium">All Emojis</p>
            <div className="grid grid-cols-5 gap-1.5 max-h-[240px] overflow-y-auto pr-1">
              {remainingEmojis.map((emoji, i) => (
                <button
                  key={`all-${i}`}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-600 active:scale-90 transition-all text-xl"
                  onClick={() => handleEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
