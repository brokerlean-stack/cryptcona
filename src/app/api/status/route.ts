import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const started = Date.now();
    const connection = await dbConnect();
    await connection.connection.db!.admin().ping();
    return NextResponse.json(
      {
        status: "ok",
        database: "Connected",
        latency: `${Date.now() - started}ms`,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Service temporarily unavailable",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
