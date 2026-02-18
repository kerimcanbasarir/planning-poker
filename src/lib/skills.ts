import { SkillDef, SkillType } from "@/types";

export const SKILLS: Record<SkillType, SkillDef> = {
  fireball: {
    type: "fireball",
    emoji: "\uD83D\uDD25",
    label: "Fireball",
    color: "#f97316",
    cooldown: 0,
  },
  freeze: {
    type: "freeze",
    emoji: "\u2744\uFE0F",
    label: "Freeze",
    color: "#38bdf8",
    cooldown: 0,
  },
  zap: {
    type: "zap",
    emoji: "\u26A1",
    label: "Zap",
    color: "#facc15",
    cooldown: 0,
  },
  heal: {
    type: "heal",
    emoji: "\uD83D\uDC9A",
    label: "Heal",
    color: "#4ade80",
    cooldown: 0,
  },
};

export const EMOJIS = [
  "\uD83D\uDC4D", "\uD83D\uDC4E", "\uD83C\uDF89", "\uD83D\uDE02", "\uD83E\uDD14",
  "\uD83D\uDC80", "\uD83D\uDD25", "\u2764\uFE0F", "\uD83D\uDC40", "\uD83D\uDE4C",
  "\uD83D\uDE31", "\uD83E\uDD21", "\uD83D\uDCAF", "\u2705", "\u274C",
  "\uD83C\uDFAF", "\uD83D\uDE80", "\uD83C\uDF1F", "\uD83D\uDCA9", "\uD83E\uDD0D",
  "\uD83E\uDD2F", "\uD83E\uDD73", "\uD83D\uDE4A", "\uD83E\uDD1D", "\u2615",
  "\uD83E\uDD26", "\uD83D\uDE0E", "\uD83D\uDC4F", "\uD83D\uDE44", "\uD83D\uDE18",
];

// Arena coordinate system (shared with server)
export const ARENA_W = 800;
export const ARENA_H = 500;
