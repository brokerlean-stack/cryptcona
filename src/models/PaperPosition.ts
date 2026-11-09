import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestId: { type: String, required: true },
    asset: String,
    side: String,
    lots: Number,
    sizingMode: { type: String, enum: ["lots", "amount"], default: "lots" },
    units: Number,
    margin: Number,
    currency: String,
    fxRate: Number,
    fxDate: String,
    fxSource: String,
    entry: Number,
    exit: Number,
    pnl: Number,
    quoteSource: { type: String, default: "Kraken" },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
      index: true,
    },
    openedAt: Date,
    closedAt: Date,
    expiresAt: Date,
    stop: Number,
    take: Number,
    reason: String,
  },
  { timestamps: true },
);
schema.index({ userId: 1, requestId: 1 }, { unique: true });
schema.index({ userId: 1, status: 1, closedAt: -1 });
export default mongoose.models.PaperPosition ||
  mongoose.model("PaperPosition", schema);
