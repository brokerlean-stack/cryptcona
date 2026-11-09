import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    default: "",
  },
  image: {
    type: String, // Authenticated ImageKit media URL; legacy Base64 remains readable.
    default: null,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);
