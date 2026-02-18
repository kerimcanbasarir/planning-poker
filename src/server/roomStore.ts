import { Room, Participant, RoomView, ParticipantView, CardSetType, Position } from "../types";
import { generateRoomId } from "../lib/utils";

const rooms = new Map<string, Room>();

// Track which socket is in which room
const socketRoomMap = new Map<string, string>();

// Grace period timers for disconnected users
const disconnectTimers = new Map<string, NodeJS.Timeout>();

// Arena dimensions
const ARENA_W = 800;
const ARENA_H = 500;
const MIN_DISTANCE = 80;
const EDGE_MARGIN = 50;

function getEllipsePosition(index: number, total: number): Position {
  const cx = ARENA_W / 2;
  const cy = ARENA_H / 2;
  const rx = ARENA_W * 0.35;
  const ry = ARENA_H * 0.35;
  const angle = (2 * Math.PI * index) / Math.max(total, 1) - Math.PI / 2;
  return {
    x: Math.round(cx + rx * Math.cos(angle)),
    y: Math.round(cy + ry * Math.sin(angle)),
  };
}

function findSpawnPosition(room: Room): Position {
  const count = room.participants.size;
  // Try the next ellipse slot
  const pos = getEllipsePosition(count, count + 1);
  if (!isColliding(room, pos, "")) return pos;

  // If colliding, search around the ellipse
  for (let i = 0; i < 36; i++) {
    const angle = (2 * Math.PI * i) / 36;
    const cx = ARENA_W / 2;
    const cy = ARENA_H / 2;
    const candidate: Position = {
      x: Math.round(cx + ARENA_W * 0.35 * Math.cos(angle)),
      y: Math.round(cy + ARENA_H * 0.35 * Math.sin(angle)),
    };
    if (!isColliding(room, candidate, "")) return candidate;
  }

  return pos; // fallback
}

function isColliding(room: Room, pos: Position, excludeId: string): boolean {
  for (const p of room.participants.values()) {
    if (p.id === excludeId) continue;
    const dx = p.position.x - pos.x;
    const dy = p.position.y - pos.y;
    if (Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE) return true;
  }
  return false;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function findNearestFreeSpot(room: Room, target: Position, excludeId: string): Position {
  // If not colliding, return as-is
  if (!isColliding(room, target, excludeId)) return target;

  // Search in expanding circles
  for (let radius = MIN_DISTANCE; radius < ARENA_W; radius += 20) {
    for (let angle = 0; angle < 360; angle += 15) {
      const rad = (angle * Math.PI) / 180;
      const candidate: Position = {
        x: clamp(Math.round(target.x + radius * Math.cos(rad)), EDGE_MARGIN, ARENA_W - EDGE_MARGIN),
        y: clamp(Math.round(target.y + radius * Math.sin(rad)), EDGE_MARGIN, ARENA_H - EDGE_MARGIN),
      };
      if (!isColliding(room, candidate, excludeId)) return candidate;
    }
  }
  return target; // fallback
}

export function createRoom(
  roomName: string,
  cardSetType: CardSetType,
  userName: string,
  socketId: string
): Room {
  const id = generateRoomId();

  const room: Room = {
    id,
    name: roomName,
    cardSetType,
    phase: "voting",
    currentIssue: "",
    participants: new Map(),
    creatorId: socketId,
    createdAt: Date.now(),
    fightEnabled: true,
  };

  // Temporarily set room so findSpawnPosition can work
  rooms.set(id, room);

  const creator: Participant = {
    id: socketId,
    name: userName,
    isSpectator: false,
    isCreator: true,
    vote: null,
    isConnected: true,
    position: getEllipsePosition(0, 1),
  };

  room.participants.set(socketId, creator);
  socketRoomMap.set(socketId, id);
  return room;
}

export function joinRoom(
  roomId: string,
  userName: string,
  isSpectator: boolean,
  socketId: string
): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  // If this socket is already in the room, just update connection status
  const existing = room.participants.get(socketId);
  if (existing) {
    existing.isConnected = true;
    existing.name = userName;
    return room;
  }

  const participant: Participant = {
    id: socketId,
    name: userName,
    isSpectator,
    isCreator: false,
    vote: null,
    isConnected: true,
    position: findSpawnPosition(room),
  };

  room.participants.set(socketId, participant);
  socketRoomMap.set(socketId, roomId);
  return room;
}

export function getRoom(roomId: string): Room | null {
  return rooms.get(roomId) || null;
}

export function getRoomBySocketId(socketId: string): Room | null {
  const roomId = socketRoomMap.get(socketId);
  if (!roomId) return null;
  return rooms.get(roomId) || null;
}

export function movePlayer(socketId: string, x: number, y: number): { room: Room; position: Position } | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  const participant = room.participants.get(socketId);
  if (!participant) return null;

  const target: Position = {
    x: clamp(Math.round(x), EDGE_MARGIN, ARENA_W - EDGE_MARGIN),
    y: clamp(Math.round(y), EDGE_MARGIN, ARENA_H - EDGE_MARGIN),
  };

  const finalPos = findNearestFreeSpot(room, target, socketId);
  participant.position = finalPos;

  return { room, position: finalPos };
}

export function castVote(socketId: string, value: string): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  const participant = room.participants.get(socketId);
  if (!participant || participant.isSpectator) return null;

  participant.vote = value;
  return room;
}

export function revealVotes(socketId: string): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room || room.creatorId !== socketId) return null;

  room.phase = "revealed";
  return room;
}

export function resetVotes(socketId: string): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room || room.creatorId !== socketId) return null;

  room.phase = "voting";
  for (const p of room.participants.values()) {
    p.vote = null;
  }
  return room;
}

export function setIssue(socketId: string, issue: string): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room || room.creatorId !== socketId) return null;

  room.currentIssue = issue;
  return room;
}

export function toggleFight(socketId: string): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room || room.creatorId !== socketId) return null;

  room.fightEnabled = !room.fightEnabled;
  return room;
}

export function handleDisconnect(socketId: string): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room) return null;

  const participant = room.participants.get(socketId);
  if (!participant) return null;

  participant.isConnected = false;

  // Grace period: remove after 60 seconds
  const timer = setTimeout(() => {
    removeParticipant(socketId);
  }, 60000);
  disconnectTimers.set(socketId, timer);

  return room;
}

export function handleReconnect(
  oldSocketId: string,
  newSocketId: string,
  roomId: string,
  userName: string
): Room | null {
  const room = rooms.get(roomId);
  if (!room) return null;

  // Check if there's an existing disconnected participant with the same name
  for (const [sid, p] of room.participants.entries()) {
    if (p.name === userName && !p.isConnected) {
      // Clear grace period timer
      const timer = disconnectTimers.get(sid);
      if (timer) {
        clearTimeout(timer);
        disconnectTimers.delete(sid);
      }

      // Transfer participant to new socket
      const wasCreator = p.isCreator;
      room.participants.delete(sid);
      socketRoomMap.delete(sid);

      p.id = newSocketId;
      p.isConnected = true;
      room.participants.set(newSocketId, p);
      socketRoomMap.set(newSocketId, roomId);

      if (wasCreator) {
        room.creatorId = newSocketId;
      }

      return room;
    }
  }

  return null;
}

function removeParticipant(socketId: string): void {
  const room = getRoomBySocketId(socketId);
  if (!room) return;

  const wasCreator = room.creatorId === socketId;
  room.participants.delete(socketId);
  socketRoomMap.delete(socketId);
  disconnectTimers.delete(socketId);

  // If room is empty, delete it
  if (room.participants.size === 0) {
    rooms.delete(room.id);
    return;
  }

  // Transfer creator role if needed
  if (wasCreator) {
    const nextParticipant = Array.from(room.participants.values()).find((p) => p.isConnected);
    if (nextParticipant) {
      nextParticipant.isCreator = true;
      room.creatorId = nextParticipant.id;
    }
  }
}

export function toRoomView(room: Room, forSocketId?: string): RoomView {
  const participants: ParticipantView[] = [];

  for (const p of room.participants.values()) {
    participants.push({
      id: p.id,
      name: p.name,
      isSpectator: p.isSpectator,
      isCreator: p.isCreator,
      vote:
        room.phase === "revealed"
          ? p.vote
          : p.id === forSocketId
            ? p.vote
            : null,
      hasVoted: p.vote !== null,
      isConnected: p.isConnected,
      position: p.position,
    });
  }

  return {
    id: room.id,
    name: room.name,
    cardSetType: room.cardSetType,
    phase: room.phase,
    currentIssue: room.currentIssue,
    participants,
    creatorId: room.creatorId,
    fightEnabled: room.fightEnabled,
  };
}

export function roomExists(roomId: string): boolean {
  return rooms.has(roomId);
}
