"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useRoom } from "@/hooks/useRoom";
import { RoomView, VoteResults, CardSetType } from "@/types";
import { Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface RoomContextValue {
  socket: TypedSocket | null;
  isConnected: boolean;
  room: RoomView | null;
  results: VoteResults | null;
  error: string | null;
  createRoom: (roomName: string, cardSetType: CardSetType, userName: string) => void;
  joinRoom: (roomId: string, userName: string, isSpectator: boolean) => void;
  castVote: (value: string) => void;
  revealVotes: () => void;
  resetVotes: () => void;
  setIssue: (issue: string) => void;
}

const RoomContext = createContext<RoomContextValue | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useSocket();
  const roomActions = useRoom(socket);

  return (
    <RoomContext.Provider value={{ socket, isConnected, ...roomActions }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoomContext must be used within RoomProvider");
  return ctx;
}
