import mongoose from "mongoose";
const WeekSchema = new mongoose.Schema(
  {
    week: { type: String, required: true },
    capital: { type: Number, required: true, min: 0.01 },
    profit: { type: Number, required: true },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    bio: { type: String, required: true, maxlength: 1500 },
    region: { type: String, required: true, maxlength: 80 },
    photo: { type: String, required: true },
    currency: { type: String, required: true, default: "USD" },
    active: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
    demoKey: { type: String, unique: true, sparse: true },
    weeks: { type: [WeekSchema], default: [] },
    revision: { type: Number, default: 0 },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);
export default mongoose.models.CopyProfile ||
  mongoose.model("CopyProfile", schema);
