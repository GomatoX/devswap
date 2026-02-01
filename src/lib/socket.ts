import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

// Socket.io server configuration
export const initSocketServer = (server: NetServer) => {
  const allowedOrigin =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) {
          callback(null, true);
          return;
        }
        // Allow if origin matches configured URL or localhost for dev
        if (origin === allowedOrigin || origin.includes("localhost")) {
          callback(null, true);
          return;
        }
        // Allow same domain (production)
        if (origin.includes("devswap.io")) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a conversation room
    socket.on("join-conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation:${conversationId}`);
    });

    // Leave a conversation room
    socket.on("leave-conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`Socket ${socket.id} left conversation:${conversationId}`);
    });

    // Handle new message
    socket.on(
      "send-message",
      (data: {
        conversationId: string;
        message: {
          id: string;
          content: string;
          senderId: string;
          sender: {
            id: string;
            fullName: string | null;
            avatarUrl: string | null;
          };
          createdAt: string;
        };
      }) => {
        // Broadcast to everyone in the conversation except sender
        socket
          .to(`conversation:${data.conversationId}`)
          .emit("new-message", data.message);
      },
    );

    // Handle typing indicator
    socket.on(
      "typing",
      (data: { conversationId: string; userId: string; userName: string }) => {
        socket.to(`conversation:${data.conversationId}`).emit("user-typing", {
          userId: data.userId,
          userName: data.userName,
        });
      },
    );

    socket.on(
      "stop-typing",
      (data: { conversationId: string; userId: string }) => {
        socket
          .to(`conversation:${data.conversationId}`)
          .emit("user-stop-typing", { userId: data.userId });
      },
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};
