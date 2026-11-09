"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
type Notice = { id: string; title: string; message: string; read: boolean };
export default function NotificationBell({ fetchUrl }: { fetchUrl: string }) {
  const [open, setOpen] = useState(false),
    [items, setItems] = useState<Notice[]>([]);
  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const res = await fetch(fetchUrl);
        if (res.ok && mounted) setItems(await res.json());
      } catch {}
    }
    void refresh();
    const timer = setInterval(refresh, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [fetchUrl]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <div className="relative">
      <button
        className="cc-icon-button relative"
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Bell size={18} />
        {items.some((n) => !n.read) && (
          <span className="absolute right-0 top-0 w-2 h-2 rounded-full bg-brand-mint" />
        )}
      </button>
      {open && (
        <section
          aria-label="Notifications"
          className="fixed sm:absolute top-20 sm:top-full left-4 right-4 sm:left-auto sm:w-80 mt-3 bg-card-bg border border-white/20 rounded-lg z-50"
        >
          <header className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-sm font-medium">Notifications</h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              <X size={16} />
            </button>
          </header>
          <div className="max-h-80 overflow-auto">
            {items.length ? (
              items.map((n) => (
                <Link
                  onClick={() => setOpen(false)}
                  href="/dashboard/chat"
                  key={n.id}
                  className="block p-4 border-b border-white/10"
                >
                  <h3 className="text-sm">{n.title}</h3>
                  <p className="text-xs text-zinc-400 mt-2">{n.message}</p>
                </Link>
              ))
            ) : (
              <p className="cc-empty text-sm">You are all caught up.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
