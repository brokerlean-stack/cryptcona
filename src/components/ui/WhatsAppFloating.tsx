"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const buildTelegramLink = (contact: string) => {
  const trimmed = contact.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return `https://t.me/${trimmed.replace(/^@/, "")}`;
};

export default function WhatsAppFloating() {
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
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100] group"
          initial={{ scale: 0, rotate: -45, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
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
                    <Send size={16} className="text-sky-400" /> Telegram
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-xs font-semibold tracking-normal text-white transition-all hover:bg-white/10"
                  >
                    <MessageCircle size={16} className="text-green-400" />{" "}
                    WhatsApp
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="relative">
            <div className="absolute inset-0 bg-sky-500 rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-all animate-pulse" />
            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              aria-label="Open support options"
              className="relative bg-sky-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20"
            >
              <MessageCircle size={28} />
            </button>

            {/* Tooltip */}
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-[#1a211e]/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
              <p className="text-[10px] font-semibold tracking-normal text-white">
                Select Support Channel
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
