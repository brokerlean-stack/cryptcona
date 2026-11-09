import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    profilePhoto: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    tradingRevision: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    country: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "pending",
    },
    isVerified: { type: Boolean, default: false },
    subscription: { type: String, default: "none" }, // 'none', 'VIP 1', 'VIP 2', etc.
    verificationCode: { type: String },
    verificationCodeExpiry: { type: Date },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    aiTraderActive: { type: Boolean, default: false },
    aiProfitTarget: { type: Number, default: 0 },
    profitGoal: { type: Number, default: 0, min: 0 },
    profitGoalBaseline: { type: Number, default: 0 },
    termsVersion: { type: String },
    termsAcceptedAt: { type: Date },
    copyProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'CopyProfile', default: null, index: true },
    copyStartedAt: { type: Date, default: null },
    copySessionId: { type: String, default: null },
    // KYC Fields
    withdrawalCode: { type: String },
    kycFront: { type: String },
    kycBack: { type: String },
    kycSelfie: { type: String },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verificationNotes: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
