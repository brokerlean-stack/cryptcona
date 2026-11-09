import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Withdrawal from "@/models/Withdrawal";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = (session.user as any).id;
    const { amount, method, walletAddress, withdrawalCode } = await req.json();

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || typeof method !== 'string' || !method.trim() || typeof walletAddress !== 'string' || !walletAddress.trim()) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.withdrawalCode || user.withdrawalCode !== withdrawalCode) {
      return NextResponse.json(
        {
          error:
            "Invalid or missing verification code. Check your email or contact support. Do not pay for a withdrawal code.",
        },
        { status: 400 },
      );
    }

    if (user.balance < amount) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 },
      );
    }

    // Reserve only available cash; concurrent trading cannot spend it again.
    const transaction = await mongoose.startSession();
    let withdrawal, newBalance;
    try {
      await transaction.withTransaction(async () => {
        const updated = await User.findOneAndUpdate(
          { _id: userId, balance: { $gte: amount }, withdrawalCode },
          { $inc: { balance: -amount } },
          { new: true, session: transaction },
        );
        if (!updated) throw new Error('Insufficient available balance or invalid verification code');
        [withdrawal] = await Withdrawal.create([{
          userId, amountLocal: amount, currency: updated.currency, method, walletAddress, status: 'PENDING',
        }], { session: transaction });
        newBalance = updated.balance;
      });
    } finally { await transaction.endSession(); }

    return NextResponse.json({
      success: true,
      withdrawal,
      newBalance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
