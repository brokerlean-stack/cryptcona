import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Withdrawal from "@/models/Withdrawal";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id, status } = await req.json();

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 },
      );
    }

    // If rejection, we should refund the user balance?
    // Usually, the balance is deducted at request time.
    if (status === "REJECTED" && withdrawal.status !== "REJECTED") {
      const user = await User.findById(withdrawal.userId);
      if (user) {
        await User.updateOne({ _id: user._id }, { $inc: { balance: withdrawal.amountLocal } });
      }
    }

    withdrawal.status = status;
    await withdrawal.save();

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
