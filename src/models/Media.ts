import mongoose from "mongoose";
const schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  fileId: { type: String, required: true },
  filePath: { type: String, required: true },
  purpose: { type: String, enum: ["support", "identity"], required: true },
}, { timestamps: true });
export default mongoose.models.Media || mongoose.model("Media", schema);
