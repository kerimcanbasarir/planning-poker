"use client";

import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import {
  RoomView,
  VoteResults,
  ClientToServerEvents,
  ServerToClientEvents,
  CardSetType,
  SkillType,
  EmojiAnimation,
  SkillAnimation,
} from "@/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useRoom(socket: TypedSocket | null) {
  const [room, setRoom] = useState<RoomView | null>(null);
  const [results, setResults] = useState<VoteResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emojiAnimations, setEmojiAnimations] = useState<EmojiAnimation[]>([]);
  const [skillAnimations, setSkillAnimations] = useState<SkillAnimation[]>([]);
  const [activeSkillEffects, setActiveSkillEffects] = useState<Record<string, SkillType>>({});

  useEffect(() => {
    if (!socket) return;

    function onRoomState(data: RoomView) {
      setRoom(data);
      setError(null);
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
    function onPlayerMoved(data: { playerId: string; x: number; y: number }) {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === data.playerId ? { ...p, position: { x: data.x, y: data.y } } : p
          ),
        };
      });
    }
    function onEmojiReceived(data: EmojiAnimation) {
      setEmojiAnimations((prev) => [...prev, data]);
      setTimeout(() => {
        setEmojiAnimations((prev) => prev.filter((e) => e.id !== data.id));
      }, 1200);
    }
    function onSkillReceived(data: SkillAnimation) {
      setSkillAnimations((prev) => [...prev, data]);
      setActiveSkillEffects((prev) => ({ ...prev, [data.targetId]: data.skill }));
      setTimeout(() => {
        setSkillAnimations((prev) => prev.filter((s) => s.id !== data.id));
      }, 1500);
      setTimeout(() => {
        setActiveSkillEffects((prev) => {
          const next = { ...prev };
          delete next[data.targetId];
          return next;
        });
      }, 2000);
    }

    socket.on("room:state", onRoomState);
    socket.on("vote:results", onVoteResults);
    socket.on("room:error", onError);
    socket.on("player:moved", onPlayerMoved);
    socket.on("emoji:received", onEmojiReceived as any);
    socket.on("skill:received", onSkillReceived as any);

    return () => {
      socket.off("room:state", onRoomState);
      socket.off("vote:results", onVoteResults);
      socket.off("room:error", onError);
      socket.off("player:moved", onPlayerMoved);
      socket.off("emoji:received", onEmojiReceived as any);
      socket.off("skill:received", onSkillReceived as any);
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

  const movePlayer = useCallback(
    (x: number, y: number) => {
      socket?.emit("player:move", { x, y });
    },
    [socket]
  );

  const throwEmoji = useCallback(
    (targetId: string, emoji: string) => {
      socket?.emit("emoji:throw", { targetId, emoji });
    },
    [socket]
  );

  const useSkill = useCallback(
    (targetId: string, skill: SkillType) => {
      socket?.emit("skill:use", { targetId, skill });
    },
    [socket]
  );

  return {
    room,
    results,
    error,
    emojiAnimations,
    skillAnimations,
    activeSkillEffects,
    createRoom,
    joinRoom,
    castVote,
    revealVotes,
    resetVotes,
    setIssue,
    movePlayer,
    throwEmoji,
    useSkill,
  };
}
