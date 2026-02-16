"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";
import { ClientToServerEvents, ServerToClientEvents } from "@/types";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket() {
  const socketRef = useRef<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    if (s.connected) {
      setIsConnected(true);
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
