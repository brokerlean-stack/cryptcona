import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    requestId: { type: String, unique: true, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CopyProfile",
      required: true,
    },
    copySessionId: { type: String, required: true },
    profileName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    note: { type: String, required: true, maxlength: 300 },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: true },
);
export default mongoose.models.CopyCredit ||
  mongoose.model("CopyCredit", schema);
