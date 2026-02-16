export interface Participant {
  id: string;
  name: string;
  isSpectator: boolean;
  isCreator: boolean;
  vote: string | null;
  isConnected: boolean;
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
}

export interface ParticipantView {
  id: string;
  name: string;
  isSpectator: boolean;
  isCreator: boolean;
  vote: string | null; // null when voting phase and not own vote
  hasVoted: boolean;
  isConnected: boolean;
}

export interface VoteResults {
  average: number | null;
  distribution: Record<string, number>;
}

// Socket events
export interface ClientToServerEvents {
  "room:create": (data: { roomName: string; cardSetType: CardSetType; userName: string }) => void;
  "room:join": (data: { roomId: string; userName: string; isSpectator: boolean }) => void;
  "vote:cast": (data: { value: string }) => void;
  "vote:reveal": () => void;
  "vote:reset": () => void;
  "issue:set": (data: { issue: string }) => void;
}

export interface ServerToClientEvents {
  "room:created": (data: { roomId: string }) => void;
  "room:state": (data: RoomView) => void;
  "room:error": (data: { message: string }) => void;
  "vote:results": (data: VoteResults) => void;
}
