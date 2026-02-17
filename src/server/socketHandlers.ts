import { Server, Socket } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "../types";
import { computeResults } from "../lib/utils";
import * as store from "./roomStore";

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerHandlers(io: TypedServer, socket: TypedSocket) {
  socket.on("room:create", ({ roomName, cardSetType, userName }) => {
    if (!roomName?.trim() || !userName?.trim()) {
      socket.emit("room:error", { message: "Room name and user name are required." });
      return;
    }

    const room = store.createRoom(roomName.trim(), cardSetType || "fibonacci", userName.trim(), socket.id);
    socket.join(room.id);
    socket.emit("room:created", { roomId: room.id });
    broadcastRoomState(io, room.id);
  });

  socket.on("room:join", ({ roomId, userName, isSpectator }) => {
    if (!roomId?.trim() || !userName?.trim()) {
      socket.emit("room:error", { message: "Room ID and user name are required." });
      return;
    }

    const rid = roomId.trim().toLowerCase();

    // Try reconnect first
    const reconnected = store.handleReconnect("", socket.id, rid, userName.trim());
    if (reconnected) {
      socket.join(rid);
      broadcastRoomState(io, rid);
      return;
    }

    if (!store.roomExists(rid)) {
      socket.emit("room:error", { message: "Room not found." });
      return;
    }

    const room = store.joinRoom(rid, userName.trim(), isSpectator ?? false, socket.id);
    if (!room) {
      socket.emit("room:error", { message: "Could not join room." });
      return;
    }

    socket.join(room.id);
    broadcastRoomState(io, room.id);
  });

  socket.on("vote:cast", ({ value }) => {
    const room = store.castVote(socket.id, value);
    if (room) {
      broadcastRoomState(io, room.id);
    }
  });

  socket.on("vote:reveal", () => {
    const room = store.revealVotes(socket.id);
    if (room) {
      broadcastRoomState(io, room.id);
      const results = computeResults(room.participants);
      io.to(room.id).emit("vote:results", results);
    }
  });

  socket.on("vote:reset", () => {
    const room = store.resetVotes(socket.id);
    if (room) {
      broadcastRoomState(io, room.id);
    }
  });

  socket.on("issue:set", ({ issue }) => {
    const room = store.setIssue(socket.id, issue ?? "");
    if (room) {
      broadcastRoomState(io, room.id);
    }
  });

  socket.on("player:move", ({ x, y }) => {
    const result = store.movePlayer(socket.id, x, y);
    if (result) {
      io.to(result.room.id).emit("player:moved", {
        playerId: socket.id,
        x: result.position.x,
        y: result.position.y,
      });
    }
  });

  socket.on("emoji:throw", ({ targetId, emoji }) => {
    const room = store.getRoomBySocketId(socket.id);
    if (!room) return;

    const from = room.participants.get(socket.id);
    const target = room.participants.get(targetId);
    if (!from || !target) return;

    io.to(room.id).emit("emoji:received", {
      id: `emoji-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fromId: socket.id,
      targetId,
      emoji,
      fromPos: from.position,
      toPos: target.position,
    });
  });

  socket.on("skill:use", ({ targetId, skill }) => {
    const room = store.getRoomBySocketId(socket.id);
    if (!room) return;

    const from = room.participants.get(socket.id);
    const target = room.participants.get(targetId);
    if (!from || !target) return;

    io.to(room.id).emit("skill:received", {
      id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fromId: socket.id,
      targetId,
      skill,
      fromPos: from.position,
      toPos: target.position,
    });
  });

  socket.on("disconnect", () => {
    const room = store.handleDisconnect(socket.id);
    if (room) {
      broadcastRoomState(io, room.id);
    }
  });
}

function broadcastRoomState(io: TypedServer, roomId: string) {
  const room = store.getRoom(roomId);
  if (!room) return;

  // Send personalized view to each participant
  for (const p of room.participants.values()) {
    const view = store.toRoomView(room, p.id);
    io.to(p.id).emit("room:state", view);
  }
}
