import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g. 'whatsapp_number', 'payment_btc', 'payment_eth', 'payment_usdt', 'payment_bank', 'payment_pix'
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.Setting ||
  mongoose.model("Setting", SettingSchema);
