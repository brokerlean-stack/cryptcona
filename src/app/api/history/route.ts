import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Trade from "@/models/Trade";
import Deposit from "@/models/Deposit";
import Withdrawal from "@/models/Withdrawal";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = (session.user as any).id;

    const requested = Number(new URL(req.url).searchParams.get('limit') || 500);
    const limit = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested,500) : 500;
    const [trades, deposits, withdrawals, pendingDeposits, pendingWithdrawals] = await Promise.all([
      Trade.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
      Deposit.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
      Withdrawal.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
      Deposit.countDocuments({userId,status:{$in:['PENDING','UNDER_REVIEW']}}),
      Withdrawal.countDocuments({userId,status:{$in:['PENDING','UNDER_REVIEW']}}),
    ]);

    return NextResponse.json({
      trades,
      deposits,
      withdrawals,
      pendingCount: pendingDeposits + pendingWithdrawals,
    });
  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
