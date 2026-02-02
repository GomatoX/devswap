"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket-client";
import { Socket } from "socket.io-client";

type Message = {
  id: string;
  content: string;
  senderId: string;
  sender: { id: string; fullName: string | null; avatarUrl: string | null };
  createdAt: string;
};

type TypingUser = {
  userId: string;
  userName: string;
};

export function useSocket(conversationId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const onNewMessageRef = useRef<((message: Message) => void) | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      socket.emit("join-conversation", conversationId);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onNewMessage = (message: Message) => {
      if (onNewMessageRef.current) {
        onNewMessageRef.current(message);
      }
    };

    const onUserTyping = (data: TypingUser) => {
      setTypingUsers((prev) => {
        if (prev.find((u) => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
    };

    const onUserStopTyping = (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new-message", onNewMessage);
    socket.on("user-typing", onUserTyping);
    socket.on("user-stop-typing", onUserStopTyping);

    if (socket.connected) {
      onConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.emit("leave-conversation", conversationId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new-message", onNewMessage);
      socket.off("user-typing", onUserTyping);
      socket.off("user-stop-typing", onUserStopTyping);
    };
  }, [conversationId]);

  // Set message handler
  const onNewMessage = useCallback((handler: (message: Message) => void) => {
    onNewMessageRef.current = handler;
  }, []);

  // Emit a new message
  const emitMessage = useCallback(
    (message: Message) => {
      if (socketRef.current && conversationId) {
        socketRef.current.emit("send-message", {
          conversationId,
          message,
        });
      }
    },
    [conversationId],
  );

  // Emit typing indicator
  const emitTyping = useCallback(
    (userId: string, userName: string) => {
      if (socketRef.current && conversationId) {
        socketRef.current.emit("typing", {
          conversationId,
          userId,
          userName,
        });
      }
    },
    [conversationId],
  );

  // Emit stop typing
  const emitStopTyping = useCallback(
    (userId: string) => {
      if (socketRef.current && conversationId) {
        socketRef.current.emit("stop-typing", {
          conversationId,
          userId,
        });
      }
    },
    [conversationId],
  );

  return {
    isConnected,
    typingUsers,
    onNewMessage,
    emitMessage,
    emitTyping,
    emitStopTyping,
  };
}
