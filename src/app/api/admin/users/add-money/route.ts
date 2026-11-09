import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import { sendBalanceAddedEmail, sendCustomTemplateEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, amount } = await req.json();
    const creditAmount = Number(amount);

    if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findByIdAndUpdate(userId, { $inc: { balance: creditAmount } }, { new: true });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const oldBalance = user.balance - creditAmount;

    if (oldBalance < 10000 && user.balance >= 10000 && user.email) {
      await sendCustomTemplateEmail(
        user.email,
        "Action Required: VIP Signal Required",
        "Signal Purchase Required",
        `Your account profit has reached the 10,000 threshold. To continue trading and enable withdrawals, you must purchase a VIP Signal Subscription immediately. Please contact your account manager to purchase your signal.`,
      );
    }

    // Record as an approved credit so it appears in ledger history without inflating trading P&L.
    await Deposit.create({
      userId,
      amountLocal: creditAmount,
      currency: user.currency || "USD",
      method: "ADMIN_CREDIT",
      status: "APPROVED",
      receiptUrl: null,
    });

    // Send Email
    if (user.email) {
      await sendBalanceAddedEmail(
        user.email,
        creditAmount,
        user.currency || "USD",
      );
    }

    return NextResponse.json({
      success: true,
      message: "Money added successfully",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
