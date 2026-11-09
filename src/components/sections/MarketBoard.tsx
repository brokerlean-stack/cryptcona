"use client";
import { useEffect, useState } from "react";
import { RefreshCw, ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { ASSETS } from '@/lib/simulation';
import useLiveMarket from '@/components/simulation/useLiveMarket';
type Coin = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  changeLabel?: string;
};
export default function MarketBoard() {
  const live = useLiveMarket('USD');
  const [coins, setCoins] = useState<Coin[]>([]),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch('/api/market?quotes=1', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoins(ASSETS.map(a => ({id:a.id, name:a.name, symbol:a.id, image:a.symbol, current_price:data.quotes[a.id].price, price_change_percentage_24h:data.quotes[a.id].change})));
    } catch {
      setError("Market prices are temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const displayed = ASSETS.map(a => {
    const q = live.quotes[a.id];
    return q ? {id:a.id,name:a.name,symbol:a.id,image:a.symbol,current_price:q.price,price_change_percentage_24h:q.change,changeLabel:q.changeLabel} : coins.find(c=>c.id===a.id);
  }).filter((c): c is Coin => !!c);
  return (
    <section className="cc-section">
      <div className="cc-container">
        <div className="cc-section-head">
          <div>
            <h2>Market watchlist</h2>
            <p>USD exchange quotes from Kraken · {live.connected ? 'live stream' : 'REST fallback'}</p>
          </div>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-2 border border-white/20 p-3 rounded-md">
              <Search size={16} />
              <input
                aria-label="Search assets"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assets"
                className="bg-transparent outline-none w-36 text-sm"
              />
            </label>
            <button
              className="cc-icon-button"
              disabled={loading}
              aria-label="Refresh prices"
              title="Refresh prices"
              onClick={refresh}
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        {error && !live.connected && (
          <p role="alert" className="cc-error">
            {error}
          </p>
        )}
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Symbol</th>
                <th>Price / USD</th>
                <th>Price change</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {displayed
                .filter((c) =>
                  (c.name + c.symbol)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="inline-flex items-center gap-3">
                        <span aria-hidden="true" className="text-brand-mint">{c.image}</span>
                        {c.name}
                      </span>
                    </td>
                    <td>{c.symbol.toUpperCase()}</td>
                    <td>
                      {c.current_price?.toLocaleString(undefined, {
                        minimumFractionDigits: c.id === 'EUR' || c.id === 'GBP' ? 5 : 2,
                        maximumFractionDigits: c.id === 'EUR' || c.id === 'GBP' ? 5 : 2,
                      })}
                    </td>
                    <td
                      className={
                        c.price_change_percentage_24h >= 0
                          ? "text-brand-mint"
                          : "text-rose-400"
                      }
                    >
                      {c.price_change_percentage_24h?.toFixed(2)}% <small>{c.changeLabel || 'since UTC open'}</small>
                    </td>
                    <td>
                      <Link
                        href="/dashboard/trading"
                        aria-label={"Trade " + c.name}
                      >
                        <ArrowUpRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!displayed.length && !error && (
          <p className="cc-empty">
            {loading ? "Loading prices..." : "No matching assets."}
          </p>
        )}
      </div>
    </section>
  );
}
