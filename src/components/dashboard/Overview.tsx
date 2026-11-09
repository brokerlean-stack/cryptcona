"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  History,
  LifeBuoy,
  RefreshCw,
  Wallet,
  Copy,
} from "lucide-react";
import Demo from "@/components/Demo";
import useTradingAccount from "@/components/simulation/useTradingAccount";
import { formatCurrency } from "@/lib/simulationCurrency";
import "@/components/simulation/simulation.css";
import "./overview.css";
type Activity = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  currency: string;
  time: number;
  status: string;
  category: "payments" | "trades";
};
export default function Overview() {
  const { data: session, status } = useSession();
  const {
    data: trading,
    error: tradingError,
    refresh: refreshTrading,
  } = useTradingAccount();
  const [account, setAccount] = useState<any>(null),
    [history, setHistory] = useState<any>({
      deposits: [],
      withdrawals: [],
      trades: [],
    }),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("all");
  const id = session?.user?.id;
  const currency =
    trading?.currency || account?.currency || session?.user?.currency || "USD";
  const refresh = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    setError("");
    void refreshTrading();
    const results = await Promise.allSettled(
      ["/api/history?limit=50"].map(async (path) => {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      }),
    );
    if (results[0].status === "fulfilled") { setHistory(results[0].value); setAccount({name: session?.user?.name}); }
    if (results.some((r) => r.status === "rejected"))
      setError(
        "Some account activity could not be loaded. Please refresh to try again.",
      );
    setBusy(false);
  }, [id, refreshTrading, session?.user?.name]);
  useEffect(() => {
    if (status === "authenticated") void refresh();
  }, [status, refresh]);
  const activities: Activity[] = [
    ...history.deposits.map((d: any) => {
      const credit = [
        "ADMIN_CREDIT",
        "AI_PROFIT_CREDIT",
        "COPY_PROFIT_CREDIT",
      ].includes(d.method);
      return {
        id: "deposit-" + d._id,
        title: credit ? "Account credit" : "Deposit",
        detail: credit
          ? "Manually credited by the account team"
          : String(d.method).replaceAll("_", " "),
        amount: d.amountLocal ?? d.amount ?? 0,
        currency: d.currency || currency,
        time: Date.parse(d.createdAt),
        status: d.status,
        category: "payments" as const,
      };
    }),
    ...history.withdrawals.map((w: any) => ({
      id: "withdrawal-" + w._id,
      title: "Withdrawal",
      detail: String(w.method).replaceAll("_", " "),
      amount: -(w.amountLocal ?? w.amount ?? 0),
      currency: w.currency || currency,
      time: Date.parse(w.createdAt),
      status: w.status,
      category: "payments" as const,
    })),
    ...history.trades.map((t: any) => ({
      id: "account-trade-" + t._id,
      title: t.asset + " · " + t.type,
      detail:
        t.status === "PENDING" ? "Reserved margin" : "Recorded account trade",
      amount: t.status === "CANCELLED" ? 0 : (t.payout ?? 0) - (t.amount ?? 0),
      currency: t.currency || currency,
      time: Date.parse(t.createdAt),
      status: t.status,
      category: "trades" as const,
    })),
  ]
    .filter((a) => Number.isFinite(a.time))
    .sort((a, b) => b.time - a.time);
  const visible = activities
    .filter((a) => filter === "all" || a.category === filter)
    .slice(0, 10);
  const pending = history.pendingCount ?? [...history.deposits, ...history.withdrawals].filter(
    (p: any) => ["PENDING", "UNDER_REVIEW"].includes(p.status),
  ).length;

  const links = [
    {
      href: "/dashboard/trading",
      label: "Start trading",
      description: "Open the trading workspace",
      icon: ChartNoAxesCombined,
    },
    {
      href: "/dashboard/wallet?view=deposit",
      label: "Deposit",
      description: "Choose a payment method",
      icon: ArrowDownLeft,
    },
    {
      href: "/dashboard/wallet?view=withdraw",
      label: "Withdraw",
      description: "Manage withdrawal requests",
      icon: ArrowUpRight,
    },
    {
      href: "/dashboard/history",
      label: "Trade history",
      description: "Review your account trades",
      icon: History,
    },
    {
      href: "/dashboard/copy-trading",
      label: "Copy trading",
      description: "Manage your selected profile",
      icon: Copy,
    },
    {
      href: "/dashboard/support",
      label: "Get support",
      description: "Talk to your account team",
      icon: LifeBuoy,
    },
  ];
  return (
    <div className="simulation-workspace overview-workspace" data-theme="dark">
      <header className="sim-heading">
        <div>
          <p className="sim-eyebrow">YOUR ACCOUNT AT A GLANCE</p>
          <h1>Overview</h1>
          <p className="sim-lead">
            Welcome back,{" "}
            {(account?.name || session?.user?.name || "there").split(" ")[0]}.
            Here’s what’s happening in your account.
          </p>
        </div>
        <div className="sim-actions">
          <button
            className="sim-icon"
            disabled={busy}
            aria-label="Refresh overview"
            onClick={() => void refresh()}
          >
            <RefreshCw size={17} className={busy ? "animate-spin" : ""} />
          </button>
          <Link href="/dashboard/trading" className="sim-button">
            Open trading <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <div className="sim-disclosure-line">
        <Demo />
        <span>Account currency: {currency}</span>
      </div>
      {(error || tradingError) && (
        <p role="alert" className="sim-error mb-5">
          {error || tradingError}
        </p>
      )}
      <section className="sim-metrics" aria-label="Account overview">
        <article>
          <div className="sim-metric-label">
            Available balance
            <Wallet size={14} />
          </div>
          <strong>
            {trading ? formatCurrency(trading.available, currency) : "—"}
          </strong>
          <p>Same balance as wallet and trading</p>
        </article>
        <article>
          <div className="sim-metric-label">
            Pending requests
            <ArrowUpRight size={14} />
          </div>
          <strong>{busy && !account ? "—" : pending}</strong>
          <p>Deposits and withdrawals in review</p>
        </article>
        <article>
          <div className="sim-metric-label">
            Realized P&amp;L
            <ChartNoAxesCombined size={14} />
          </div>
          <strong
            className={
              trading && trading.realized < 0 ? "negative" : "positive"
            }
          >
            {trading ? formatCurrency(trading.realized, currency) : "—"}
          </strong>
          <p>Closed account trades</p>
        </article>
        <article>
          <div className="sim-metric-label">
            Open positions
            <History size={14} />
          </div>
          <strong>{trading?.positions.length || 0}</strong>
          <p>
            <Link href="/dashboard/trading">
              Manage in the trading workspace ↗
            </Link>
          </p>
        </article>
      </section>
      <section className="overview-quick">
        <div className="sim-section-title">
          <h2>Quick actions</h2>
          <span className="sim-subtle">Your next step, one click away</span>
        </div>
        <div className="overview-actions">
          {links.map(({ href, label, description, icon: Icon }) => (
            <Link key={label} href={href} className="overview-action">
              <span className="overview-action-icon">
                <Icon size={20} />
              </span>
              <div>
                <h3>{label}</h3>
                <p>{description}</p>
              </div>
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </div>
      </section>
      <section className="sim-panel overview-recent">
        <div className="sim-panel-head">
          <div>
            <h2>Recent activity</h2>
            <p className="sim-subtle mt-2">
              Payment requests and recorded trading activity
            </p>
          </div>
          <div className="sim-segmented" aria-label="Activity filters">
            {[
              ["all", "All"],
              ["payments", "Payments"],
              ["trades", "Trades"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={filter === value ? "active" : ""}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {visible.length ? (
          <div className="overview-activity-list">
            {visible.map((a) => (
              <article key={a.id} className="overview-activity">
                <span
                  className={
                    "overview-event-icon " +
                    (a.amount < 0 ? "negative" : "positive")
                  }
                >
                  {a.category === "trades" ? (
                    <ChartNoAxesCombined size={18} />
                  ) : a.amount < 0 ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownLeft size={18} />
                  )}
                </span>
                <div className="overview-event-title">
                  <h3>{a.title}</h3>
                  <p>{a.detail}</p>
                </div>
                <div className="overview-event-value">
                  <strong className={a.amount < 0 ? "negative" : "positive"}>
                    {a.amount > 0 ? "+" : ""}
                    {formatCurrency(a.amount, a.currency)}
                  </strong>
                  <span>
                    {new Date(a.time).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span
                  className={
                    "overview-status status-" +
                    a.status.toLowerCase().replaceAll("_", "-")
                  }
                >
                  {a.status.replaceAll("_", " ")}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="sim-empty">
            <h3>{busy ? "Loading activity…" : "No activity yet."}</h3>
            <p>
              {filter === "payments"
                ? "Your deposit and withdrawal requests will appear here."
                : "Your payment requests and closed trades will appear here."}
            </p>
          </div>
        )}
      </section>
      <footer className="sim-footer">
        <span>
          Available balance is shared with your wallet and trading workspace.
        </span>
        <Demo variant="rates" />
      </footer>
    </div>
  );
}
