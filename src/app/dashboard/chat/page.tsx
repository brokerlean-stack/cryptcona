"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Send,
  Paperclip,
  X,
  User as UserIcon,
  ShieldCheck,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function UserChatPage() {
  const { data: session }: any = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatImage, setChatImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const sendLock = useRef(false);
  const chatEndRef = useRef<null | HTMLDivElement>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("topic") === "profit-goal") setChatInput("Please help me reduce or disable my profit goal. I understand it does not restrict withdrawals."); }, []);

  useEffect(() => {
    if (session?.user) {
      fetchAdminId();
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchAdminId = async () => {
    const res = await fetch("/api/admin/id"); // I'll create this simple helper route
    if (res.ok) {
      const data = await res.json();
      setAdminId(data.id);
    }
  };

  const fetchMessages = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  const handleSendMessage = async () => {
    if (!adminId || (!chatInput.trim() && !chatImage) || sendLock.current) return;
    sendLock.current = true;
    setSending(true);
    try {

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: adminId,
        content: chatInput,
        image: chatImage,
      }),
    });

    if (res.ok) {
      setChatInput("");
      setChatImage(null);
      fetchMessages();
    } else { const data = await res.json(); alert(data.error || "Unable to send message."); }
    } catch { alert("Unable to send message. Please try again."); }
    finally { sendLock.current = false; setSending(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      alert("Choose a PNG, JPEG or WebP image under 5 MB."); return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setChatImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#111514] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#151b18]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-brand-mint flex items-center justify-center text-black font-semibold">
                AM
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-normal">
                Account Manager
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold tracking-normal flex items-center gap-1">
                <ShieldCheck size={10} className="text-brand-mint" /> VIP
                Support Active
              </p>
            </div>
          </div>
        </div>
        <button className="p-2 text-zinc-600">
          <MoreHorizontal size={24} />
        </button>
      </header>

      {/* Chat Body */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 flex flex-col no-scrollbar">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <MessageSquare className="text-zinc-800" size={40} />
            </div>
            <h3 className="text-lg font-semibold tracking-normal">
              Start a Dialogue
            </h3>
            <p className="text-xs text-zinc-600 font-bold tracking-normal mt-2 max-w-xs leading-relaxed">
              Your dedicated account manager is online. Securely discuss your
              portfolio or trade executions.
            </p>
          </div>
        )}

        {messages.map((m: any, idx) => {
          const isMe = m.senderId === session?.user?.id;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] space-y-2`}>
                <div
                  className={`p-4 rounded-lg text-sm font-bold shadow-2xl ${isMe ? "bg-white text-black rounded-br-none" : "bg-zinc-900 text-zinc-100 border border-white/5 rounded-bl-none"}`}
                >
                  {m.content}
                  {m.image && (
                    <img
                      src={m.image}
                      className="mt-2 rounded-lg border border-black/20 max-w-full"
                      alt="Attachment"
                    />
                  )}
                </div>
                <p
                  className={`text-[8px] font-semibold tracking-normal text-zinc-600 ${isMe ? "text-right" : "text-left"}`}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={chatEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-[#151b18] border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {chatImage && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="relative inline-block border-2 border-brand-mint rounded-lg overflow-hidden shadow-2xl"
              >
                <img src={chatImage} className="w-24 h-24 object-cover" />
                <button
                  onClick={() => setChatImage(null)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white backdrop-blur-md"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            <label className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
              <Paperclip className="text-zinc-500" size={20} />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
            <input
              type="text"
              placeholder="MESSAGE ACCOUNT MANAGER..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 min-w-0 bg-black/40 border border-white/5 rounded-lg py-4 px-3 text-xs font-semibold tracking-normal focus:outline-none focus:border-brand-mint/30 transition-all placeholder:text-zinc-700"
            />
            <button
              onClick={handleSendMessage}
              disabled={sending}
              className="w-12 h-12 rounded-lg bg-brand-mint text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-brand-mint/20"
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MessageSquare({
  className,
  size,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
