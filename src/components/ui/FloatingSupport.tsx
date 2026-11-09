"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";
import { usePathname } from "next/navigation";

const buildTelegramLink = (contact: string) => {
  const trimmed = contact.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return `https://t.me/${trimmed.replace(/^@/, "")}`;
};

export default function FloatingSupport() {
  const pathname = usePathname();
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Don't show on chat page
  const isChatPage =
    pathname?.includes("/dashboard/chats") || pathname?.includes("/admin");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/public");
        const data = await res.json();
        if (data.telegram) setTelegram(data.telegram);
        if (data.whatsapp) setWhatsapp(data.whatsapp);
      } catch (err) {
        console.error("Failed to fetch support settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Delay visibility slightly
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isChatPage || (!telegram && !whatsapp)) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100]"
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                className="absolute bottom-full right-0 mb-4 w-56 rounded-lg border border-white/10 bg-[#111514]/95 p-2 shadow-2xl backdrop-blur-md"
              >
                {telegram && (
                  <a
                    href={buildTelegramLink(telegram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-semibold tracking-normal text-white transition-all hover:bg-white/10"
                  >
                    <Send size={16} className="text-sky-400" />
                    Telegram
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-semibold tracking-normal text-white transition-all hover:bg-white/10"
                  >
                    <MessageCircle size={16} className="text-green-400" />
                    WhatsApp
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="relative group block"
            aria-label="Open support options"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-sky-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity animate-pulse" />

            {/* Tooltip */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-semibold tracking-normal text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Select Support Channel
            </div>

            {/* Button */}
            <div className="relative w-16 h-16 bg-sky-500 rounded-lg flex items-center justify-center text-white shadow-2xl shadow-sky-500/30 hover:scale-110 active:scale-90 transition-all border-2 border-white/20">
              <MessageCircle size={32} />
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
