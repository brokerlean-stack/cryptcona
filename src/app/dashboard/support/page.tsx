import Link from "next/link";
import dbConnect from "@/lib/db";
import Setting from "@/models/Setting";
import { MessageSquare, Send, Phone } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function SupportPage() {
  let telegram = "",
    whatsapp = "";
  try {
    await dbConnect();
    const rows = await Setting.find({
      key: { $in: ["telegram_contact", "whatsapp_number"] },
    }).lean();
    telegram = String(
      rows.find((s) => s.key === "telegram_contact")?.value || "",
    );
    whatsapp = String(
      rows.find((s) => s.key === "whatsapp_number")?.value || "",
    );
  } catch {}
  const telegramUrl = telegram.startsWith("https://")
    ? telegram
    : "https://t.me/" + telegram.replace(/^@/, "");
  return (
    <section>
      <p className="cc-kicker">HERE TO HELP</p>
      <h1 className="text-3xl font-medium">Support</h1>
      <p className="mt-4 text-zinc-400">
        Keep your account questions and conversations in one place.
      </p>
      <div className="cc-actions">
        <Link href="/dashboard/chat" className="cc-button">
          <MessageSquare size={18} />
          Message your team
        </Link>
        {telegram && (
          <a
            href={telegramUrl}
            className="cc-button secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Send size={18} />
            Telegram
          </a>
        )}
        {whatsapp && (
          <a
            href={"https://wa.me/" + whatsapp.replace(/\D/g, "")}
            className="cc-button secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Phone size={18} />
            WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}
