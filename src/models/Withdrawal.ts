import mongoose from "mongoose";

const WithdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amountLocal: { type: Number, required: true },
    currency: { type: String, required: true },
    method: { type: String, required: true }, // 'BTC', 'ETH', 'USDT', 'BANK'
    walletAddress: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "UNDER_REVIEW"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Withdrawal ||
  mongoose.model("Withdrawal", WithdrawalSchema);
