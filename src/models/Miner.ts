import mongoose from "mongoose";

const MinerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    planPriceUSD: { type: Number, required: true },
    purchasePriceLocal: { type: Number, required: true }, // the amount deducted from user
    currency: { type: String, required: true },
    dailyReturnPercentage: { type: Number, default: 0.5 }, // 1% every 2 days = 0.5% daily equivalent
    status: { type: String, enum: ["ACTIVE", "EXPIRED"], default: "ACTIVE" },
    lastPaidAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.models.Miner || mongoose.model("Miner", MinerSchema);
