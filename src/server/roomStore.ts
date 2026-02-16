import { Room, Participant, RoomView, ParticipantView, CardSetType } from "../types";
import { generateRoomId } from "../lib/utils";

const rooms = new Map<string, Room>();

// Track which socket is in which room
const socketRoomMap = new Map<string, string>();

// Grace period timers for disconnected users
const disconnectTimers = new Map<string, NodeJS.Timeout>();

export function createRoom(
  roomName: string,
  cardSetType: CardSetType,
  userName: string,
  socketId: string
): Room {
  const id = generateRoomId();
  const creator: Participant = {
    id: socketId,
    name: userName,
    isSpectator: false,
    isCreator: true,
    vote: null,
    isConnected: true,
  };

  const room: Room = {
    id,
    name: roomName,
    cardSetType,
    phase: "voting",
    currentIssue: "",
    participants: new Map([[socketId, creator]]),
    creatorId: socketId,
    createdAt: Date.now(),
  };

  rooms.set(id, room);
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

export function castVote(socketId: string, value: string): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room || room.phase !== "voting") return null;

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
  };
}

export function roomExists(roomId: string): boolean {
  return rooms.has(roomId);
}
