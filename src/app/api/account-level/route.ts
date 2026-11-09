import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Trade from "@/models/Trade";

// Account levels based on total activity count (deposits + trades + withdrawals)
const LEVELS = [
  { name: "BASIC", min: 0, max: 4, color: "#71717a" }, // zinc
  { name: "SILVER", min: 5, max: 14, color: "#a1a1aa" }, // silver
  { name: "GOLD", min: 15, max: 49, color: "#71efb2" }, // gold
  { name: "PLATINUM", min: 50, max: 99, color: "#7dd3fc" }, // sky
  { name: "PLATINUM PLUS", min: 100, max: Infinity, color: "#c084fc" }, // purple
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = (session.user as any).id;

    // Count all trades (this represents total activity)
    const totalActivity = await Trade.countDocuments({ userId });

    // Determine level
    const level =
      LEVELS.find((l) => totalActivity >= l.min && totalActivity <= l.max) ||
      LEVELS[0];
    const nextLevel = LEVELS.find((l) => l.min > totalActivity);

    // Calculate progress to next level
    let progress = 100;
    let remaining = 0;
    if (nextLevel) {
      const rangeSize = nextLevel.min - level.min;
      const currentProgress = totalActivity - level.min;
      progress = Math.round((currentProgress / rangeSize) * 100);
      remaining = nextLevel.min - totalActivity;
    }

    return NextResponse.json({
      level: level.name,
      color: level.color,
      totalActivity,
      progress,
      remaining,
      nextLevel: nextLevel?.name || null,
    });
  } catch (error: any) {
    console.error("Account Level API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
