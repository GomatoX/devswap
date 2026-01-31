import { Server } from "socket.io";
import { NextRequest, NextResponse } from "next/server";

// Global socket.io server instance
let io: Server | undefined;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // This route is just for the initial HTTP handshake
  // The actual WebSocket upgrade is handled by the custom server
  return NextResponse.json({ status: "Socket.io server ready" });
}
