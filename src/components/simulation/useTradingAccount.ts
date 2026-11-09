"use client";
import {
  createContext,
  createElement,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
function useTradingAccountStore() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const inFlight = useRef(false),
    generation = useRef(0),
    mounted = useRef(false);
  const refresh = useCallback(async (): Promise<void> => {
    if (status !== "authenticated" || inFlight.current || !mounted.current)
      return;
    inFlight.current = true;
    const version = generation.current;
    try {
      const res = await fetch("/api/paper-trading", { cache: "no-store" });
      const value = await res.json();
      if (!res.ok) throw new Error(value.error || "Account unavailable");
      if (version === generation.current) {
        setData(value);
        setError("");
      }
    } catch (e) {
      if (version === generation.current)
        setError(e instanceof Error ? e.message : "Account unavailable");
    } finally {
      inFlight.current = false;
      if (mounted.current && version !== generation.current) void refresh();
    }
  }, [status]);
  useEffect(() => {
    mounted.current = true;
    void refresh();
    const interval = setInterval(
      () => {
        if (!document.hidden) void refresh();
      },
      data?.positions?.length ? 3000 : 15000,
    );
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("cryptcona-account-updated", onFocus);
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("cryptcona-account")
        : null;
    if (channel) channel.onmessage = onFocus;
    return () => {
      mounted.current = false;
      generation.current++;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("cryptcona-account-updated", onFocus);
      channel?.close();
    };
  }, [refresh, session?.user?.id, !!data?.positions?.length]);
  async function act(body: any) {
    setBusy(true);
    generation.current++;
    try {
      const res = await fetch("/api/paper-trading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const value = await res.json();
      if (!res.ok)
        throw new Error(value.error || "Order could not be completed");
      generation.current++;
      setData(value);
      setError("");
      const channel =
        typeof BroadcastChannel !== "undefined"
          ? new BroadcastChannel("cryptcona-account")
          : null;
      channel?.postMessage("updated");
      channel?.close();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order could not be completed");
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { data, error, busy, refresh, act };
}
const AccountContext = createContext<ReturnType<
  typeof useTradingAccountStore
> | null>(null);
export function TradingAccountProvider({ children }: { children: ReactNode }) {
  const account = useTradingAccountStore();
  return createElement(AccountContext.Provider, { value: account }, children);
}
export default function useTradingAccount() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("TradingAccountProvider is required");
  return account;
}
