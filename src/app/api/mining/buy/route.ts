import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Miner from "@/models/Miner";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = (session.user as any).id;
    const { planName, priceUSD, priceLocal, currency } = await req.json();

    if (!planName || !Number.isFinite(priceUSD) || priceUSD <= 0 || !Number.isFinite(priceLocal) || priceLocal <= 0) {
      return NextResponse.json(
        { error: "Invalid mining contract data" },
        { status: 400 },
      );
    }

    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.balance < priceLocal) {
      return NextResponse.json(
        {
          error: "Insufficient balance to purchase this cloud mining contract",
        },
        { status: 400 },
      );
    }

    // Deduct from balance
    const updated = await User.findOneAndUpdate({ _id: userId, balance: { $gte: priceLocal } }, { $inc: { balance: -priceLocal } }, { new: true });
    if (!updated) return NextResponse.json({ error: 'Insufficient available balance' }, { status: 400 });

    // Create the miner contract
    const miner = await Miner.create({
      userId,
      name: planName,
      planPriceUSD: priceUSD,
      purchasePriceLocal: priceLocal,
      currency: currency || user.currency,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully purchased ${planName}! It will now generate 1% every 48 hours.`,
      newBalance: updated.balance,
      miner,
    });
  } catch (error: any) {
    console.error("Buy Miner Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
