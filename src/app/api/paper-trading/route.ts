import { getAnchoredMarket, peekAnchoredMarket } from "@/lib/anchoredMarket";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import {
  getMarket,
  getConversion,
  peekMarket,
  peekConversion,
} from "@/lib/marketData";
import {
  openPaperPosition,
  closePaperPosition,
  settlePaperPositions,
  tradingSnapshot,
} from "@/lib/paperTrading";
async function handle(req?: Request) {
  const auth = await getServerSession(authOptions);
  if (!auth?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await dbConnect();
    // Plain account views never wait for an external quote or FX request.
    let market = req ? await getAnchoredMarket() : peekAnchoredMarket();
    if (!req) {
      const data = await tradingSnapshot(auth.user.id, market);
      if (!data!.positions.length)
        return NextResponse.json(
          {
            ...data,
            conversion: peekConversion(String(data!.currency), market),
            conversionError: null,
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      market = await getAnchoredMarket();
    }
    if (req) {
      const body = await req.json();
      if (body.action === "open")
        await openPaperPosition(auth.user.id, body, market);
      else if (body.action === "close")
        await closePaperPosition(auth.user.id, body.id, market);
      else if (body.action !== "sync")
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    await settlePaperPositions(auth.user.id, market);
    const data = await tradingSnapshot(auth.user.id, market);
    let conversion = null,
      conversionError = null;
    try {
      conversion = req
        ? await getConversion(String(data!.currency), market)
        : peekConversion(String(data!.currency), market);
    } catch {
      conversionError =
        "Account currency conversion is unavailable. New orders are paused.";
    }
    return NextResponse.json(
      { ...data, conversion, conversionError },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Trading is temporarily unavailable",
      },
      { status: 400 },
    );
  }
}
export async function GET() {
  return handle();
}
export async function POST(req: Request) {
  return handle(req);
}
