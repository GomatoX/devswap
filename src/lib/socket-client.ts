"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketUrl = (): string => {
  // In browser, use current origin (works in both dev and production)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Fallback for SSR (shouldn't be called, but just in case)
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      path: "/api/socket",
      addTrailingSlash: false,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
