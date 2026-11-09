import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import { sendCustomTemplateEmail } from "@/lib/mail";
import { parseProfitAmount } from "@/lib/profitAmount";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    const profitAmount = parseProfitAmount(payload?.amount);
    const userId = payload?.userId;
    if (
      profitAmount === null ||
      typeof userId !== "string" ||
      !/^[a-f0-9]{24}$/i.test(userId)
    ) {
      return NextResponse.json(
        {
          error:
            "Enter a valid user and a positive profit amount with at most two decimal places",
        },
        { status: 400 },
      );
    }

    const connection = await dbConnect();
    const transaction = await connection.startSession();
    let creditedUser;
    try {
      creditedUser = await transaction.withTransaction(async () => {
        const user = await User.findByIdAndUpdate(
          userId,
          { $inc: { balance: profitAmount } },
          { new: true, session: transaction },
        );
        if (!user) return null;
        // Keep the dashboard profit ledger and spendable balance in sync.
        await Deposit.create(
          [
            {
              userId,
              amountLocal: profitAmount,
              currency: user.currency || "USD",
              method: "AI_PROFIT_CREDIT",
              status: "APPROVED",
              receiptUrl: null,
            },
          ],
          { session: transaction },
        );
        return {
          balance: user.balance,
          currency: user.currency || "USD",
          email: user.email,
        };
      });
    } finally {
      await transaction.endSession();
    }
    if (!creditedUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (
      creditedUser.balance - profitAmount < 10000 &&
      creditedUser.balance >= 10000 &&
      creditedUser.email
    ) {
      await sendCustomTemplateEmail(
        creditedUser.email,
        "Action Required: VIP Signal Required",
        "Signal Purchase Required",
        `Your account profit has reached the 10,000 threshold. To continue trading and enable withdrawals, you must purchase a VIP Signal Subscription immediately. Please contact your account manager to purchase your signal.`,
      ).catch((error) =>
        console.error("Profit credit notification failed:", error),
      );
    }

    return NextResponse.json({
      success: true,
      amount: profitAmount,
      balance: creditedUser.balance,
      currency: creditedUser.currency,
      message: `Profit of ${profitAmount} ${creditedUser.currency} added to user account`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
