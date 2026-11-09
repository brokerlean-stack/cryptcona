import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Deposit from "@/models/Deposit";
import Setting from "@/models/Setting";
import Withdrawal from "@/models/Withdrawal";
import AdminDashboardClient from "./AdminDashboardClient";
import { toClientData } from "@/lib/clientData";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  // Check if the user is authorized (admintrader@cryptcona.pro or role admin)
  if (!session || !session.user) {
    redirect("/login");
  }

  if (!isAdminUser(session.user)) {
    redirect("/dashboard");
  }

  try {
    await dbConnect();

    // Aggregate admin stats
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password -verificationCode -verificationCodeExpiry -resetToken -resetTokenExpiry")
      .sort({ createdAt: -1 })
      .lean();
    const deposits = await Deposit.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    const withdrawals = await Withdrawal.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();
    const requiredSettings = [
      {
        key: "telegram_contact",
        value: "",
        description: "Telegram username or link",
      },
      {
        key: "whatsapp_number",
        value: "",
        description: "WhatsApp contact number",
      },
      {
        key: "subscription_basic_vip_price",
        value: "500",
        description: "Core monthly price in USD",
      },
      {
        key: "subscription_silver_vip_price",
        value: "750",
        description: "Plus monthly price in USD",
      },
      {
        key: "subscription_gold_vip_price",
        value: "2500",
        description: "Pro monthly price in USD",
      },
      {
        key: "subscription_diamond_vip_price",
        value: "5000",
        description: "Private monthly price in USD",
      },
    ];

    for (const setting of requiredSettings) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        { $setOnInsert: setting },
        { upsert: true },
      );
    }

    const settings = await Setting.find().lean();

    const clientProps = toClientData({ users, deposits, withdrawals, settings });

    return (
      <AdminDashboardClient {...clientProps} />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to connect to the database.";

    return (
      <main className="min-h-screen bg-[#111514] text-zinc-100 flex items-center justify-center p-6">
        <section className="w-full max-w-xl border border-red-500/20 bg-red-500/5 rounded-lg p-8">
          <p className="text-[10px] font-semibold tracking-normal text-red-400 mb-3">
            Admin Console
          </p>
          <h1 className="text-3xl font-semibold tracking-normal mb-3">
            Database connection failed
          </h1>
          <p className="text-sm text-zinc-400 leading-6">
            The admin session is valid, but Cryptcona cannot reach MongoDB right
            now.
          </p>
          <pre className="mt-6 overflow-x-auto rounded-lg bg-black/50 border border-white/10 p-4 text-xs text-red-200">
            {message}
          </pre>
        </section>
      </main>
    );
  }
}
