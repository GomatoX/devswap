import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // This route is just for the initial HTTP handshake
  // The actual WebSocket upgrade is handled by the custom server
  return NextResponse.json({ status: "Socket.io server ready" });
}
