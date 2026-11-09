import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Setting from "@/models/Setting";

export async function GET() {
  try {
    await dbConnect();
    const settings = await Setting.find({
      key: {
        $in: [
          "telegram_contact",
          "whatsapp_number",
          "subscription_basic_vip_price",
          "subscription_silver_vip_price",
          "subscription_gold_vip_price",
          "subscription_diamond_vip_price",
        ],
      },
    }).lean();
    const telegram =
      settings.find((s) => s.key === "telegram_contact")?.value || "";
    const whatsapp =
      settings.find((s) => s.key === "whatsapp_number")?.value || "";
    const getPrice = (key: string, fallback: number, minimum = 0) => {
      const value = Number(settings.find((s) => s.key === key)?.value);
      if (!Number.isFinite(value) || value <= 0) return fallback;
      return Math.max(value, minimum);
    };
    const subscriptionPrices = {
      basicVip: getPrice("subscription_basic_vip_price", 500, 500),
      silverVip: getPrice("subscription_silver_vip_price", 750, 500),
      goldVip: getPrice("subscription_gold_vip_price", 2500, 500),
      diamondVip: getPrice("subscription_diamond_vip_price", 5000, 500),
    };

    return NextResponse.json({ telegram, whatsapp, subscriptionPrices });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
