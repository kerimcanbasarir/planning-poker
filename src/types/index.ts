export interface Position {
  x: number;
  y: number;
}

export type SkillType = "fireball" | "freeze" | "zap" | "heal";

export interface SkillDef {
  type: SkillType;
  emoji: string;
  label: string;
  color: string;
  cooldown: number; // ms
}

export interface Participant {
  id: string;
  name: string;
  isSpectator: boolean;
  isCreator: boolean;
  vote: string | null;
  isConnected: boolean;
  position: Position;
}

export type Phase = "voting" | "revealed";

export interface Room {
  id: string;
  name: string;
  cardSetType: CardSetType;
  phase: Phase;
  currentIssue: string;
  participants: Map<string, Participant>;
  creatorId: string;
  createdAt: number;
  fightEnabled: boolean;
}

export type CardSetType = "fibonacci" | "tshirt";

export interface CardSet {
  type: CardSetType;
  label: string;
  values: string[];
}

// Serializable version sent to clients
export interface RoomView {
  id: string;
  name: string;
  cardSetType: CardSetType;
  phase: Phase;
  currentIssue: string;
  participants: ParticipantView[];
  creatorId: string;
  fightEnabled: boolean;
}

export interface ParticipantView {
  id: string;
  name: string;
  isSpectator: boolean;
  isCreator: boolean;
  vote: string | null; // null when voting phase and not own vote
  hasVoted: boolean;
  isConnected: boolean;
  position: Position;
}

export interface VoteResults {
  average: number | null;
  distribution: Record<string, number>;
}

// Animation payloads
export interface EmojiAnimation {
  id: string;
  fromId: string;
  targetId: string;
  emoji: string;
  fromPos: Position;
  toPos: Position;
}

export interface SkillAnimation {
  id: string;
  fromId: string;
  targetId: string;
  skill: SkillType;
  fromPos: Position;
  toPos: Position;
}

// Socket events
export interface ClientToServerEvents {
  "room:create": (data: { roomName: string; cardSetType: CardSetType; userName: string }) => void;
  "room:join": (data: { roomId: string; userName: string; isSpectator: boolean }) => void;
  "vote:cast": (data: { value: string }) => void;
  "vote:reveal": () => void;
  "vote:reset": () => void;
  "issue:set": (data: { issue: string }) => void;
  "player:move": (data: { x: number; y: number }) => void;
  "emoji:throw": (data: { targetId: string; emoji: string }) => void;
  "skill:use": (data: { targetId: string; skill: SkillType }) => void;
  "fight:toggle": () => void;
}

export interface ServerToClientEvents {
  "room:created": (data: { roomId: string }) => void;
  "room:state": (data: RoomView) => void;
  "room:error": (data: { message: string }) => void;
  "vote:results": (data: VoteResults) => void;
  "player:moved": (data: { playerId: string; x: number; y: number }) => void;
  "emoji:received": (data: { id: string; fromId: string; targetId: string; emoji: string; fromPos: Position; toPos: Position }) => void;
  "skill:received": (data: { id: string; fromId: string; targetId: string; skill: SkillType; fromPos: Position; toPos: Position }) => void;
}
