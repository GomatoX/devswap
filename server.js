/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Prepare Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.io
  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://${hostname}:${port}`,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Join a conversation room
    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(
        `📥 Socket ${socket.id} joined conversation:${conversationId}`,
      );
    });

    // Leave a conversation room
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`📤 Socket ${socket.id} left conversation:${conversationId}`);
    });

    // Handle new message
    socket.on("send-message", (data) => {
      // Broadcast to everyone in the conversation except sender
      socket
        .to(`conversation:${data.conversationId}`)
        .emit("new-message", data.message);
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      socket.to(`conversation:${data.conversationId}`).emit("user-typing", {
        userId: data.userId,
        userName: data.userName,
      });
    });

    socket.on("stop-typing", (data) => {
      socket
        .to(`conversation:${data.conversationId}`)
        .emit("user-stop-typing", {
          userId: data.userId,
        });
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io server ready on path /api/socket`);
  });
});
