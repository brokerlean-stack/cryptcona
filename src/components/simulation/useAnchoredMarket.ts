"use client";
import { useEffect, useState } from "react";
type Point = { time: number; price: number };
export default function useAnchoredMarket(currency: string, enabled = true) {
  const [quotes, setQuotes] = useState<Record<string, any>>({}),
    [ticks, setTicks] = useState<Record<string, Point[]>>({});
  const [connected, setConnected] = useState(false),
    [stale, setStale] = useState(true);
  const [conversion, setConversion] = useState<any>(null),
    [conversionError, setConversionError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let active = true,
      stream: EventSource | null = null,
      polling = false,
      lastMessage = 0, lastStreamMessage = 0, lastAcceptedTick = 0;
    function accept(data: any) {
      if (!active) return;
      if (data.fetchedAt && data.fetchedAt < lastAcceptedTick) return;
      if (data.fetchedAt) lastAcceptedTick = data.fetchedAt;
      setStale(!!data.stale);
      if (!data.quotes) return;
      setQuotes(data.quotes);
      setConnected(!data.stale);
      lastMessage = Date.now();
      setTicks((previous) => {
        if (data.series) return data.series;
        const next = { ...previous };
        for (const [id, q] of Object.entries(data.quotes) as [string, any][]) {
          const old = previous[id] || [];
          if (!old.length || old[old.length - 1].time < q.fetchedAt)
            next[id] = [...old, { time: q.fetchedAt, price: q.price }].slice(
              -240,
            );
        }
        return next;
      });
    }
    function connect() {
      if (document.hidden || !active) return;
      stream?.close();
      lastStreamMessage = Date.now();
      stream = new EventSource("/api/practice-market");
      stream.onmessage = (e) => {
        lastStreamMessage = Date.now();
        try {
          accept(JSON.parse(e.data));
        } catch {}
      };
      stream.onerror = () => setConnected(false);
    }
    async function fallback() {
      if (!document.hidden && Date.now() - lastStreamMessage > 10000) connect();
      if (document.hidden || polling || Date.now() - lastMessage < 2000) return;
      polling = true;
      try {
        const res = await fetch("/api/practice-market?once=1", {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) accept(await res.json());
        else if (active) setStale(true);
      } catch {
        if (active) setStale(true);
      } finally {
        polling = false;
      }
    }
    function visibility() {
      if (document.hidden) {
        stream?.close();
        setConnected(false);
      } else connect();
    }
    connect();
    const interval = setInterval(fallback, 1000);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      active = false;
      stream?.close();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    let active = true, loading = false, nextRefresh = 0;
    setConversion(null);
    setConversionError("");
    async function load() {
      if (loading || Date.now() < nextRefresh) return;
      loading = true;
      try {
        const res = await fetch(
          "/api/market?currency=" + encodeURIComponent(currency),
          { cache: "no-store", signal: AbortSignal.timeout(10000) },
        );
        const data = await res.json();
        if (!res.ok) throw new Error();
        if (active) {
          setConversion({ ...data.conversion, currency });
          setConversionError("");
        }
        nextRefresh = Date.now() + 60000;
      } catch {
        nextRefresh = Date.now() + 5000;
        if (active)
          setConversionError(
            "Refreshing account exchange rate. Retrying automatically...",
          );
      } finally { loading = false; }
    }
    void load();
    const interval = setInterval(load, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currency, enabled]);
  const usableConversion = conversion?.currency === currency &&
    Number.isFinite(conversion.rate) && conversion.rate > 0 &&
    Math.abs(Date.now() - Date.parse(conversion.date)) <= 7 * 86400000 ? conversion : null;
  return { quotes, ticks, connected, stale, conversion: usableConversion, conversionError };
}
