import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    _id: String,
    tick: Number,
    referenceAt: Number,
    quotes: mongoose.Schema.Types.Mixed,
    series: mongoose.Schema.Types.Mixed,
  },
  { versionKey: false },
);
export default mongoose.models.PracticeMarket ||
  mongoose.model("PracticeMarket", schema);
