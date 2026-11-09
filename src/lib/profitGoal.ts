import mongoose from "mongoose";
import Trade from "@/models/Trade";
import Deposit from "@/models/Deposit";
export async function recordedNetResult(userId: string) {
  const id = new mongoose.Types.ObjectId(userId);
  const [trades, credits] = await Promise.all([
    Trade.aggregate([{ $match: { userId: id, status: { $in: ["WIN", "LOSS"] } } },
      { $group: { _id: null, total: { $sum: { $subtract: [{ $ifNull: ["$payout", 0] }, "$amount"] } } } }]),
    Deposit.aggregate([{ $match: { userId: id, status: "APPROVED", method: { $in: ["AI_PROFIT_CREDIT", "COPY_PROFIT_CREDIT"] } } },
      { $group: { _id: null, total: { $sum: "$amountLocal" } } }]),
  ]);
  return Math.round(((trades[0]?.total || 0) + (credits[0]?.total || 0)) * 100) / 100;
}
export function goalView(target: number, baseline: number, net: number) {
  const progress = Math.max(0, Math.round((net - baseline) * 100) / 100);
  return { target, progress, percent: target > 0 ? Math.min(100, progress / target * 100) : 0,
    reached: target > 0 && progress >= target };
}
