"use client";

import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { RoomView, VoteResults, ClientToServerEvents, ServerToClientEvents, CardSetType } from "@/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useRoom(socket: TypedSocket | null) {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [results, setResults] = useState<VoteResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    function onRoomState(data: RoomView) {
      setRoom(data);
      setError(null);
      // Clear results when phase changes to voting
      if (data.phase === "voting") {
        setResults(null);
      }
    }
    function onVoteResults(data: VoteResults) {
      setResults(data);
    }
    function onError(data: { message: string }) {
      setError(data.message);
    }

    socket.on("room:state", onRoomState);
    socket.on("vote:results", onVoteResults);
    socket.on("room:error", onError);

    return () => {
      socket.off("room:state", onRoomState);
      socket.off("vote:results", onVoteResults);
      socket.off("room:error", onError);
    };
  }, [socket]);

  const createRoom = useCallback(
    (roomName: string, cardSetType: CardSetType, userName: string) => {
      socket?.emit("room:create", { roomName, cardSetType, userName });
    },
    [socket]
  );

  const joinRoom = useCallback(
    (roomId: string, userName: string, isSpectator: boolean) => {
      socket?.emit("room:join", { roomId, userName, isSpectator });
    },
    [socket]
  );

  const castVote = useCallback(
    (value: string) => {
      socket?.emit("vote:cast", { value });
    },
    [socket]
  );

  const revealVotes = useCallback(() => {
    socket?.emit("vote:reveal");
  }, [socket]);

  const resetVotes = useCallback(() => {
    socket?.emit("vote:reset");
  }, [socket]);

  const setIssue = useCallback(
    (issue: string) => {
      socket?.emit("issue:set", { issue });
    },
    [socket]
  );

  return {
    room,
    results,
    error,
    createRoom,
    joinRoom,
    castVote,
    revealVotes,
    resetVotes,
    setIssue,
  };
}
