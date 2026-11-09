import mongoose from "mongoose";

const TradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    asset: { type: String, required: true }, // e.g. BTC/USD, EUR/USD
    paperPositionId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaperPosition', index: true },
    simulation: { type: Boolean, default: false },
    currency: String,
    type: {
      type: String,
      enum: ["BUY", "SELL", "CALL", "PUT"],
      required: true,
    },
    amount: { type: Number, required: true },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number },
    status: {
      type: String,
      enum: ["PENDING", "WIN", "LOSS", "BREAK_EVEN", "CANCELLED"],
      default: "PENDING",
    },
    duration: { type: Number }, // in seconds, for fixed time trades
    payout: { type: Number }, // percentage or fixed amount
  },
  { timestamps: true },
);

export default mongoose.models.Trade || mongoose.model("Trade", TradeSchema);
