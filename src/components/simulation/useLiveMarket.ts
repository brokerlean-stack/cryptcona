"use client";
import { useEffect, useRef, useState } from "react";
import {
  parseStreamTicker,
  STREAM_SYMBOLS,
  type StreamQuote,
} from "@/lib/marketStream";
type Point = { time: number; price: number };
const chartCache = new Map<string, { points: Point[]; at: number }>();
export { chartCache };
export default function useLiveMarket(currency: string, enabled = true) {
  const [quotes, setQuotes] = useState<Record<string, StreamQuote>>({});
  const [ticks, setTicks] = useState<Record<string, Point[]>>({});
  const [connected, setConnected] = useState(false),
    [conversion, setConversion] = useState<any>(null),
    [conversionError, setConversionError] = useState("");
  const quotesRef = useRef<Record<string, StreamQuote>>({});
  useEffect(() => {
    if (!enabled) return;
    let stopped = false,
      socket: WebSocket | null = null,
      retry: ReturnType<typeof setTimeout> | undefined;
    let reconnectDelay = 1000,
      lastMessage = Date.now(),
      dirty = false,
      polling = false;
    const pending = new Set<string>();
    function accept(next: Record<string, StreamQuote>) {
      for (const [id, q] of Object.entries(next)) {
        quotesRef.current[id] = q;
        pending.add(id);
        dirty = true;
      }
    }
    async function poll() {
      if (polling || stopped || document.hidden) return;
      // WebSocket handles the hot path; REST is only the startup/disconnect fallback.
      if (
        socket?.readyState === WebSocket.OPEN &&
        Date.now() - lastMessage < 5000 &&
        Object.keys(quotesRef.current).length === 5
      )
        return;
      polling = true;
      try {
        const res = await fetch("/api/market?quotes=1", {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        const data = await res.json();
        if (res.ok && !stopped) {
          const next: Record<string, StreamQuote> = {};
          for (const [id, q] of Object.entries(data.quotes || {}) as [
            string,
            any,
          ][])
            if (
              !quotesRef.current[id] ||
              q.fetchedAt > quotesRef.current[id].fetchedAt
            )
              next[id] = { ...q, changeLabel: "since UTC open" };
          accept(next);
        }
      } catch {
      } finally {
        polling = false;
      }
    }
    function connect() {
      if (stopped || document.hidden) return;
      socket = new WebSocket("wss://ws.kraken.com/v2");
      socket.onopen = () => {
        reconnectDelay = 1000;
        lastMessage = Date.now();
        socket?.send(
          JSON.stringify({
            method: "subscribe",
            params: {
              channel: "ticker",
              symbol: STREAM_SYMBOLS,
              event_trigger: "bbo",
              snapshot: true,
            },
          }),
        );
      };
      socket.onmessage = (event) => {
        lastMessage = Date.now();
        try {
          const next = parseStreamTicker(JSON.parse(event.data));
          if (Object.keys(next).length) {
            accept(next);
            setConnected(true);
          }
        } catch {}
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        setConnected(false);
        if (!stopped && !document.hidden) {
          retry = setTimeout(connect, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        }
      };
    }
    function visibility() {
      clearTimeout(retry);
      if (document.hidden) {
        socket?.close();
        setConnected(false);
      } else {
        connect();
        void poll();
      }
    }
    connect();
    void poll();
    const pollingTimer = setInterval(() => {
      if (
        socket?.readyState === WebSocket.OPEN &&
        Date.now() - lastMessage > 15000
      )
        socket.close();
      void poll();
    }, 3000);
    const paintTimer = setInterval(() => {
      if (!dirty || document.hidden) return;
      dirty = false;
      const changed = [...pending];
      pending.clear();
      setQuotes({ ...quotesRef.current });
      setTicks((previous) => {
        const next = { ...previous };
        for (const id of changed) {
          const q = quotesRef.current[id];
          next[id] = [
            ...(previous[id] || []),
            { time: q.fetchedAt, price: q.price },
          ].slice(-240);
        }
        return next;
      });
    }, 250);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(pollingTimer);
      clearInterval(paintTimer);
      document.removeEventListener("visibilitychange", visibility);
      socket?.close();
    };
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setConversion(null);
    setConversionError("");
    async function refresh() {
      try {
        const res = await fetch(
          "/api/market?currency=" + encodeURIComponent(currency),
          { cache: "no-store", signal: AbortSignal.timeout(10000) },
        );
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        if (active) {
          setConversion(body.conversion);
          setConversionError("");
        }
      } catch {
        if (active)
          setConversionError(
            "Account currency conversion is unavailable. New orders are paused.",
          );
      }
    }
    void refresh();
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [currency, enabled]);
  const conversionQuote = quotes[currency];
  return {
    quotes,
    ticks,
    connected,
    conversion:
      ["BTC", "EUR", "GBP"].includes(currency) &&
      conversionQuote &&
      Date.now() - conversionQuote.fetchedAt < 30000
        ? {
            rate: 1 / conversionQuote.price,
            source: "Kraken WebSocket",
            date: new Date().toISOString().slice(0, 10),
          }
        : conversion,
    conversionError,
  };
}
