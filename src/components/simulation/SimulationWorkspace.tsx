"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Sun,
  Moon,
  X,
  Info,
  RefreshCw,
} from "lucide-react";
import Demo, { demoCopy } from "@/components/Demo";
import { ASSETS, assetById } from "@/lib/simulation";
import { formatCurrency } from "@/lib/simulationCurrency";
import { sizedOrderTerms, positionProfit, moneyRound } from "@/lib/tradingMath";
import useTradingAccount from "./useTradingAccount";
import useAnchoredMarket from "./useAnchoredMarket";
import PriceChart from "./PriceChart";
import "./simulation.css";

export default function SimulationWorkspace({
  view = "trading",
}: {
  view?: "trading" | "history";
}) {
  const { data: account, error, busy, refresh, act } = useTradingAccount();
  const live = useAnchoredMarket(
    account?.currency || "USD",
    view === "trading",
  );
  const data = account
    ? {
        ...account,
        conversion: live.conversion || account.conversion,
        conversionError: (live.conversion || account.conversion) ? "" : live.conversionError,
      }
    : null;
  const [selected, setSelected] = useState("BTC"),
    [theme, setTheme] = useState("dark");
  const [lots, setLots] = useState("0.01"),
    [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [sizingMode, setSizingMode] = useState<"lots" | "amount">("lots");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(0),
    [stop, setStop] = useState(""),
    [take, setTake] = useState("");
  const [table, setTable] = useState("positions"),
    [filter, setFilter] = useState("ALL"),
    [range, setRange] = useState(0);
  const [now, setNow] = useState(Date.now()),
    [notice, setNotice] = useState("");
  const guide = useRef<HTMLDialogElement>(null),
    pendingOrder = useRef<{ body: string; requestId: string } | null>(null);
  useEffect(() => {
    try {
      setTheme(
        localStorage.getItem("cryptcona:theme") === "light" ? "light" : "dark",
      );
    } catch {}
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      delete document.documentElement.dataset.simTheme;
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.simTheme = theme;
    try {
      localStorage.setItem("cryptcona:theme", theme);
    } catch {}
  }, [theme]);
  const currency = data?.currency || "USD";
  const money = (n: number | null) =>
    n == null ? "Unavailable" : formatCurrency(n, currency);
  const signed = (n: number | null) =>
    n == null ? "Unavailable" : (n >= 0 ? "+" : "") + money(n);
  const asset = assetById(selected)!;
  const market = {
    ...data?.market,
    quotes: { ...data?.market?.quotes, ...live.quotes },
  };
  const q = market.quotes[selected];
  if (data) {
    data.positions = data.positions.map((p: any) => ({
      ...p,
      unrealized: market.quotes[p.asset]
        ? positionProfit(p, market.quotes[p.asset].price)
        : null,
    }));
    data.unrealized = data.positions.every((p: any) => p.unrealized !== null)
      ? moneyRound(
          data.positions.reduce((n: number, p: any) => n + p.unrealized, 0),
          currency,
        )
      : null;
    data.equity =
      data.unrealized === null
        ? null
        : moneyRound(data.available + data.margin + data.unrealized, currency);
  }
  const stale = live.stale || !q || now - q.fetchedAt > 30000;
  let estimate: ReturnType<typeof sizedOrderTerms> | null = null;
  try {
    if (q && data?.conversion)
      estimate = sizedOrderTerms(
        { asset: selected, sizingMode, lots: Number(lots), amount: Number(amount) },
        q.price,
        data.conversion.rate,
        currency,
      );
  } catch {}
  const chart = (live.ticks[selected] || []).slice(range ? -range * 2 : -240);
  const select = (id: string) => {
    setSelected(id);
    setStop("");
    setTake("");
  };
  async function place(e: React.FormEvent) {
    e.preventDefault();
    const order = {
      action: "open",
      asset: selected,
      side,
      sizingMode,
      ...(sizingMode === "lots" ? { lots: Number(lots) } : { amount: Number(amount) }),
      duration,
      stop: stop ? Number(stop) : null,
      take: take ? Number(take) : null,
    };
    const body = JSON.stringify(order);
    if (pendingOrder.current?.body !== body)
      pendingOrder.current = { body, requestId: crypto.randomUUID() };
    if (await act({ ...order, requestId: pendingOrder.current!.requestId })) {
      pendingOrder.current = null;
      setNotice("Position opened. Margin reserved from your account balance.");
    }
  }
  async function close(id: string) {
    if (await act({ action: "close", id }))
      setNotice(
        "Position closed. Margin and result returned to your account balance.",
      );
  }
  function exportHistory() {
    const rows = [
      [
        "Instrument",
        "Direction",
        "Lots",
        "Entry USD",
        "Exit USD",
        "Profit " + currency,
        "Closed",
        "Reason",
      ],
      ...(data?.history || []).map((t: any) => [
        t.asset,
        t.side,
        t.lots,
        t.entry,
        t.exit,
        t.pnl,
        t.closedAt,
        t.reason,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((v: any) => '"' + String(v).replaceAll('"', '""') + '"')
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cryptcona-trade-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const price = (n: number | undefined, digits = asset.digits) =>
    n == null
      ? "Unavailable"
      : n.toLocaleString("en-US", {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        });
  const historyTable = (rows: any[]) => (
    <div className="sim-table-scroll">
      <table>
        <thead>
          <tr>
            <th>Instrument</th>
            <th>Direction</th>
            <th>Lots</th>
            <th>Entry / exit (USD)</th>
            <th>Realized P&amp;L</th>
            <th>Exit reason</th>
            <th>Closed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <b>{assetById(t.asset)?.pair}</b>
              </td>
              <td className={t.side === "BUY" ? "positive" : "negative"}>
                {t.side === "BUY" ? "Long" : "Short"}
              </td>
              <td>{t.lots}</td>
              <td>
                {price(t.entry, assetById(t.asset)?.digits)}
                <small>{price(t.exit, assetById(t.asset)?.digits)}</small>
              </td>
              <td className={t.pnl >= 0 ? "positive" : "negative"}>
                {signed(t.pnl)}
              </td>
              <td>{t.reason}</td>
              <td>{new Date(t.closedAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="sim-empty">No closed positions match this filter.</p>
      )}
    </div>
  );
  return (
    <div className="simulation-workspace" data-theme={theme}>
      <div className="sim-heading">
        <div>
          <p className="sim-eyebrow">YOUR NEXT MOVE, WITH CLARITY</p>
          <h1>
            {view === "history"
              ? "Every move, in focus."
              : "A view of your market."}
          </h1>
          <p className="sim-lead">
            {view === "history"
              ? "Your account trade history, across devices."
              : "Responsive price movement. One account balance."}
          </p>
        </div>
        <div className="sim-actions">
          <button
            className="sim-icon"
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="sim-icon"
            aria-label="Refresh account"
            onClick={() => void refresh()}
          >
            <RefreshCw size={17} />
          </button>
          <button className="sim-button secondary" onClick={exportHistory}>
            <Download size={15} />
            Export activity
          </button>
        </div>
      </div>
      <div className="sim-disclosure-line">
        <Demo />
        <span>Account currency: {currency}</span>
        <button onClick={() => guide.current?.showModal()} className="sim-link">
          <Info size={14} />
          How it works
        </button>
      </div>
      {error && (
        <p role="alert" className="sim-error">
          {error}
        </p>
      )}
      {!data ? (
        <div className="sim-loading">
          {error ? "Use Refresh account to retry." : "Loading account balance…"}
        </div>
      ) : (
        <>
          <section className="sim-metrics" aria-label="Portfolio metrics">
            {[
              [
                "Portfolio value",
                data.equity,
                "Available + reserved margin + open P&L",
              ],
              [
                "Available funds",
                data.available,
                "Same available balance as your wallet",
              ],
              [
                "Unrealized P&L",
                data.unrealized,
                data.positions.length + " open positions",
              ],
              ["Realized P&L", data.realized, "Closed account trades"],
            ].map(([label, value, note]) => (
              <article key={String(label)}>
                <div className="sim-metric-label">
                  {label}
                  <ArrowUpRight size={13} />
                </div>
                <strong
                  className={
                    String(label).includes("P&L")
                      ? Number(value) >= 0
                        ? "positive"
                        : "negative"
                      : ""
                  }
                >
                  {money(value as number | null)}
                </strong>
                <p>{note}</p>
              </article>
            ))}
          </section>
          <div className="sim-disclosure-line">
            <span>Reserved margin: {money(data.margin)}</span>
            <span>
              {stale
                ? "Waiting for fresh prices"
                : live.connected
                  ? "Anchored price feed"
                  : "Price feed reconnecting"}
              {q?.fetchedAt
                ? " - received " + new Date(q.fetchedAt).toLocaleTimeString()
                : ""}
            </span>
          </div>
          {data.conversionError && (
            <p className="sim-error">{data.conversionError}</p>
          )}
          {view === "history" ? (
            <section className="sim-panel">
              <div className="sim-panel-head">
                <h2>Trade history</h2>
                <select
                  className="sim-select"
                  aria-label="Filter trade direction"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="ALL">All directions</option>
                  <option value="BUY">Long</option>
                  <option value="SELL">Short</option>
                </select>
              </div>
              {historyTable(
                data.history.filter(
                  (t: any) => filter === "ALL" || t.side === filter,
                ),
              )}
              <p className="sim-subtle p-4">
                Showing the latest 500 completed positions.
              </p>
            </section>
          ) : (
            <>
              <div className="sim-trading-grid">
                <section className="sim-panel sim-chart-panel">
                  <div className="sim-panel-head">
                    <div className="sim-instrument">
                      <span
                        className="sim-asset-icon"
                        style={{
                          color: asset.color,
                          background: asset.color + "18",
                        }}
                      >
                        {asset.symbol}
                      </span>
                      <div>
                        <select
                          aria-label="Trading instrument"
                          className="sim-select"
                          value={selected}
                          onChange={(e) => select(e.target.value)}
                        >
                          {ASSETS.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.pair}
                            </option>
                          ))}
                        </select>
                        <p className="sim-subtle">
                          {asset.name} · <Demo variant="anchoredLabel" />
                        </p>
                      </div>
                    </div>
                    <div className="sim-segmented">
                      {[0, 30, 60, 120].map((n) => (
                        <button
                          key={n}
                          className={range === n ? "active" : ""}
                          onClick={() => setRange(n)}
                        >
                          {n === 0 ? "Live" : n + "s"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sim-price">
                    <strong>{price(q?.price)}</strong>
                    <span className={q?.change >= 0 ? "positive" : "negative"}>
                      {q
                        ? (q.change >= 0 ? "+" : "") +
                          q.change.toFixed(2) +
                          "% " +
                          (q.changeLabel || "since UTC open")
                        : "Waiting for provider"}
                    </span>
                  </div>
                  {q?.reference && (
                    <div className="sim-disclosure-line px-5">
                      <span>{now - q.referenceAt > 60000 ? "Cached reference" : "Market reference"}: {price(q.reference)}
                        {q.referenceAt && <> · {Math.max(0, Math.floor((now - q.referenceAt) / 60000))} min ago</>}
                      </span>
                      <span>
                        Range: {price(q.lower)} - {price(q.upper)}
                      </span>
                    </div>
                  )}
                  <PriceChart
                    values={chart.map((p) => p.price)}
                    times={chart.map((p) => p.time)}
                    digits={asset.digits}
                    color={theme === "light" ? "#16825d" : "#78e8ba"}
                  />
                  <div className="sim-disclosure-line px-5">
                    <span>
                      <Demo variant="anchoredChart" />
                    </span>
                    <span>
                      {stale ? (
                        "STALE / UNAVAILABLE"
                      ) : (
                        <Demo variant="anchoredQuote" />
                      )}
                    </span>
                  </div>
                </section>
                <section className="sim-panel sim-order">
                  <div className="sim-panel-head">
                    <h2>New position</h2>
                    <span className="sim-subtle">{currency} account</span>
                  </div>
                  <form className="sim-order-form" onSubmit={place}>
                    <div className="sim-direction-toggle">
                      <button
                        type="button"
                        className={side === "BUY" ? "buy active" : "buy"}
                        onClick={() => setSide("BUY")}
                      >
                        <ArrowUpRight size={16} />
                        Buy / Long
                      </button>
                      <button
                        type="button"
                        className={side === "SELL" ? "sell active" : "sell"}
                        onClick={() => setSide("SELL")}
                      >
                        <ArrowDownRight size={16} />
                        Sell / Short
                      </button>
                    </div>
                    <label className="sim-field">
                      Size trade by
                      <select aria-label="Size trade by" value={sizingMode} onChange={e => setSizingMode(e.target.value as "lots" | "amount")}>
                        <option value="lots">Lots</option>
                        <option value="amount">Amount ({currency})</option>
                      </select>
                    </label>
                    <label className="sim-field">
                      {sizingMode === "lots" ? "Lot size" : `Amount (${currency})`}
                      <input
                        aria-label={sizingMode === "lots" ? "Lot size" : "Trade amount"}
                        type="number"
                        min={sizingMode === "lots" ? "0" : currency === "BTC" ? "0.00000001" : "0.01"}
                        step={sizingMode === "lots" ? "any" : currency === "BTC" ? "0.00000001" : "0.01"}
                        value={sizingMode === "lots" ? lots : amount}
                        onChange={(e) => sizingMode === "lots" ? setLots(e.target.value) : setAmount(e.target.value)}
                        required
                      />
                    </label>
                    {sizingMode === "amount" && <p className="sim-subtle">This amount is reserved from your {currency} balance as margin. Lots are calculated at the execution price.</p>}
                    <p className="sim-subtle">
                      1 lot = {asset.units.toLocaleString()}{" "}
                      {asset.kind === "Crypto" ? "coin" : "base units"} ·{" "}
                      {asset.leverage}:1 leverage
                    </p>
                    <label className="sim-field">
                      Close after
                      <select
                        aria-label="Close after"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                      >
                        <option value={0}>Open ended</option>
                        <option value={15}>15 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={180}>3 minutes</option>
                      </select>
                    </label>
                    <div className="sim-exit-inputs">
                      <label className="sim-field">
                        Stop loss (USD)
                        <input
                          aria-label="Stop loss"
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Optional"
                          value={stop}
                          onChange={(e) => setStop(e.target.value)}
                        />
                      </label>
                      <label className="sim-field">
                        Take profit (USD)
                        <input
                          aria-label="Take profit"
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Optional"
                          value={take}
                          onChange={(e) => setTake(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="sim-order-summary">
                      {sizingMode === "amount" && <div><span>Estimated lots</span><b>{estimate ? estimate.lots.toLocaleString(undefined, { maximumSignificantDigits: 8 }) : "—"}</b></div>}
                      <div>
                        <span>Position units</span>
                        <b>{estimate?.units.toLocaleString() || "—"}</b>
                      </div>
                      <div>
                        <span>Notional value</span>
                        <b>{estimate ? money(estimate.notional) : "—"}</b>
                      </div>
                      <div>
                        <span>Margin required</span>
                        <b>{estimate ? money(estimate.margin) : "—"}</b>
                      </div>
                      <div>
                        <span>Available balance</span>
                        <b>{money(data.available)}</b>
                      </div>
                    </div>
                    {estimate && estimate.margin > data.available && <p role="status" className="sim-error">Insufficient available balance for this trade size.</p>}
                    <button
                      className={
                        "sim-button sim-submit " +
                        (side === "SELL" ? "sell" : "")
                      }
                      disabled={
                        busy ||
                        stale ||
                        !estimate ||
                        estimate.margin > data.available
                      }
                    >
                      {busy
                        ? "Processing…"
                        : side === "BUY"
                          ? "Open long position"
                          : "Open short position"}
                      <ArrowUpRight size={16} />
                    </button>
                    <p className="sim-ticket-note">
                      Orders reserve account funds. Estimates may change before
                      the server receives your order.
                    </p>
                  </form>
                </section>
              </div>
              <section className="sim-panel sim-positions">
                <div className="sim-panel-head">
                  <div className="sim-tabs">
                    <button
                      className={table === "positions" ? "active" : ""}
                      onClick={() => setTable("positions")}
                    >
                      Open positions{" "}
                      <span className="sim-count">{data.positions.length}</span>
                    </button>
                    <button
                      className={table === "history" ? "active" : ""}
                      onClick={() => setTable("history")}
                    >
                      Recent activity
                    </button>
                  </div>
                </div>
                {table === "history" ? (
                  historyTable(data.history.slice(0, 6))
                ) : data.positions.length ? (
                  <div className="sim-table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Instrument</th>
                          <th>Direction / size</th>
                          <th>Entry (USD)</th>
                          <th>Margin</th>
                          <th>P&amp;L</th>
                          <th>Time remaining</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {data.positions.map((p: any) => (
                          <tr key={p.id}>
                            <td>
                              <b>{assetById(p.asset)?.pair}</b>
                              <small>
                                {p.stop ? "SL " + p.stop : "No stop"} ·{" "}
                                {p.take ? "TP " + p.take : "No limit"}
                              </small>
                            </td>
                            <td
                              className={
                                p.side === "BUY" ? "positive" : "negative"
                              }
                            >
                              {p.side === "BUY" ? "Long" : "Short"}
                              <small>{p.lots} lots</small>
                            </td>
                            <td>
                              {price(p.entry, assetById(p.asset)?.digits)}
                            </td>
                            <td>{money(p.margin)}</td>
                            <td
                              className={
                                p.unrealized >= 0 ? "positive" : "negative"
                              }
                            >
                              {signed(p.unrealized)}
                            </td>
                            <td>
                              <span className="sim-timer">
                                {p.expiresAt
                                  ? now >= Date.parse(p.expiresAt)
                                    ? "Awaiting fresh quote"
                                    : Math.ceil(
                                        (Date.parse(p.expiresAt) - now) / 1000,
                                      ) + "s"
                                  : "Open ended"}
                              </span>
                            </td>
                            <td>
                              <button
                                disabled={
                                  busy ||
                                  !market.quotes[p.asset] ||
                                  live.stale ||
                                  now - market.quotes[p.asset].fetchedAt > 30000
                                }
                                className="sim-close"
                                aria-label={
                                  "Close " +
                                  assetById(p.asset)?.pair +
                                  " position"
                                }
                                onClick={() => void close(p.id)}
                              >
                                Close <X size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="sim-empty">
                    <h3>Make room for your next idea.</h3>
                    <p>
                      Choose an instrument and open a position to get started.
                    </p>
                  </div>
                )}
              </section>
              <section>
                <div className="sim-section-title">
                  <h2>On your radar</h2>
                  <Demo variant="market" />
                </div>
                <div className="sim-watchlist">
                  {ASSETS.map((a) => {
                    const tick = market?.quotes?.[a.id];
                    return (
                      <button
                        className={selected === a.id ? "selected" : ""}
                        key={a.id}
                        onClick={() => select(a.id)}
                      >
                        <div>
                          <span
                            className="sim-asset-icon small"
                            style={{
                              color: a.color,
                              background: a.color + "18",
                            }}
                          >
                            {a.symbol}
                          </span>
                          <b>{a.pair}</b>
                          <ArrowUpRight size={14} />
                        </div>
                        <strong>{price(tick?.price, a.digits)}</strong>
                        <span
                          className={
                            tick?.change >= 0 ? "positive" : "negative"
                          }
                        >
                          {tick
                            ? tick.change.toFixed(2) +
                              "% " +
                              (tick.changeLabel || "since UTC open")
                            : "Unavailable"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </>
      )}
      <footer className="sim-footer">
        <Demo variant="local" />
        <div>
          <a href={q?.referenceSource?.includes("Coinbase") ? "https://www.coinbase.com" : "https://www.kraken.com"} target="_blank" rel="noreferrer">
            Reference: {q?.referenceSource || "Market providers"} ↗
          </a>
          <Link href="/dashboard/wallet">Wallet ↗</Link>
        </div>
      </footer>
      <dialog className="sim-dialog" ref={guide}>
        <button
          className="sim-icon sim-dialog-close"
          aria-label={demoCopy.closeDetails}
          onClick={() => guide.current?.close()}
        >
          <X size={18} />
        </button>
        <p className="sim-eyebrow">CLEAR PRICES. CLEAR BALANCES.</p>
        <h2>How trading works</h2>
        <p>
          <Demo />
        </p>
        <h3>Market prices</h3>
        <p>
          <Demo variant="mechanics" />
        </p>
        <h3>Account balance and margin</h3>
        <p>
          <Demo variant="risk" />
        </p>
        <h3>Account currency</h3>
        <p>
          <Demo variant="rates" />
        </p>
        {data?.conversion && (
          <p>
            {data.conversion.source} · {data.conversion.date} · 1 USD ={" "}
            {data.conversion.rate} {currency}
            {data.conversion.source.includes("ExchangeRate-API") && <> · <a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates by ExchangeRate-API</a></>}
          </p>
        )}
        <h3>Timing and history</h3>
        <p>
          <Demo variant="storage" />
        </p>
        <button className="sim-button" onClick={() => guide.current?.close()}>
          Back to the workspace
        </button>
      </dialog>
      {notice && (
        <div className="sim-toast" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
