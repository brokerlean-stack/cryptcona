// Public, keyless data only. Never substitute generated prices on a provider failure.
export const MARKET_PAIRS: Record<string, string> = {
  BTC: "XXBTZUSD",
  ETH: "XETHZUSD",
  SOL: "SOLUSD",
  EUR: "ZEURZUSD",
  GBP: "ZGBPZUSD",
};
export type MarketQuote = {
  referenceAt?: number;
  referenceSource?: string;
  reference?: number;
  lower?: number;
  upper?: number;
  price: number;
  bid: number;
  ask: number;
  change: number;
  fetchedAt: number;
  source: string;
};
export type MarketSnapshot = {
  quotes: Record<string, MarketQuote>;
  stale: boolean;
  error: string | null;
  fetchedAt: number;
};
type Entry<T> = {
  value?: T;
  pending?: Promise<T>;
  retryAt: number;
  error?: unknown;
};
const root = globalThis as typeof globalThis & {
  cryptconaMarketCache?: Map<string, Entry<any>>;
};
const cache = (root.cryptconaMarketCache ||= new Map());
async function cached<T>(
  key: string,
  ttl: number,
  loader: () => Promise<T>,
): Promise<T> {
  let e = cache.get(key);
  if (!e) {
    e = { retryAt: 0 };
    cache.set(key, e);
  }
  if (Date.now() < e.retryAt && e.value !== undefined) return e.value;
  if (Date.now() < e.retryAt && e.error) throw e.error;
  if (e.pending) return e.pending;
  e.pending = loader()
    .then((value) => {
      e.value = value;
      e.error = undefined;
      e.retryAt = Date.now() + ttl;
      return value;
    })
    .catch((error) => {
      e.error = error;
      e.retryAt = Date.now() + 10000;
      if (e.value !== undefined) return e.value;
      throw error;
    })
    .finally(() => {
      e.pending = undefined;
    });
  return e.pending;
}
async function json(url: string, timeout = 8000) {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error("Market provider unavailable");
  return res.json();
}
export function parseTickers(data: any, now = Date.now()): MarketSnapshot {
  if (data.error?.length || !data.result)
    throw new Error("Market provider unavailable");
  const quotes: Record<string, MarketQuote> = {};
  for (const [id, pair] of Object.entries(MARKET_PAIRS)) {
    const t = data.result[pair];
    const price = Number(t?.c?.[0]),
      bid = Number(t?.b?.[0]),
      ask = Number(t?.a?.[0]),
      open = Number(t?.o);
    if (
      ![price, bid, ask, open].every((n) => Number.isFinite(n) && n > 0) ||
      bid > ask
    )
      throw new Error("Invalid market quote");
    quotes[id] = {
      price,
      bid,
      ask,
      change: (price / open - 1) * 100,
      fetchedAt: now,
      source: "Kraken",
    };
  }
  return { quotes, fetchedAt: now, stale: false, error: null };
}
export function parseBackupRates(data: any, now = Date.now()): MarketSnapshot {
  if (data.data?.currency !== "USD") throw new Error("Invalid backup reference");
  const quotes: Record<string, MarketQuote> = {};
  for (const id of Object.keys(MARKET_PAIRS)) {
    const rate = Number(data.data.rates?.[id]);
    if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(1 / rate)) throw new Error("Invalid backup reference");
    const price = 1 / rate;
    quotes[id] = { price, bid: price, ask: price, change: 0, fetchedAt: now, source: "Coinbase reference" };
  }
  return { quotes, fetchedAt: now, stale: false, error: null };
}
export async function getMarket(): Promise<MarketSnapshot> {
  try {
    const value = await cached("tickers", 3000, async () => {
      try { return parseTickers(
        await json(
          "https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD,EURUSD,GBPUSD",
          2500,
        ),
      ); } catch {
        return parseBackupRates(await json("https://api.coinbase.com/v2/exchange-rates?currency=USD", 3500));
      }
    });
    const stale = Date.now() - value.fetchedAt > 30000;
    return {
      ...value,
      stale,
      error: stale
        ? "Market quotes are stale. Orders wait for fresh prices."
        : null,
    };
  } catch {
    return {
      quotes: {},
      fetchedAt: 0,
      stale: true,
      error: "Market prices are unavailable. Please retry shortly.",
    };
  }
}
export function peekMarket(): MarketSnapshot {
  const value = cache.get("tickers")?.value;
  if (!value)
    return {
      quotes: {},
      fetchedAt: 0,
      stale: true,
      error: "Waiting for market prices",
    };
  return { ...value, stale: Date.now() - value.fetchedAt > 30000 };
}
export function peekConversion(currency: string, market: MarketSnapshot) {
  if (currency === "USD")
    return {
      rate: 1,
      date: new Date().toISOString().slice(0, 10),
      source: "USD",
    };
  if (["EUR", "GBP", "BTC"].includes(currency)) {
    try {
      return {
        rate: 1 / (requireQuote(market, currency).reference ?? requireQuote(market, currency).price),
        date: new Date().toISOString().slice(0, 10),
        source: "Kraken",
      };
    } catch { /* Fiat currencies can use the cached daily reference below. */ }
  }
  const value = cache.get("fx:" + currency)?.value;
  return value && Math.abs(Date.now() - Date.parse(value.date)) <= 7 * 86400000
    ? value
    : null;
}
export function requireQuote(market: MarketSnapshot, asset: string) {
  const q = market.quotes[asset];
  if (!q || market.stale || Date.now() - q.fetchedAt > 30000)
    throw new Error(
      "A fresh market quote is required. No funds have been moved.",
    );
  return q;
}
export async function getConversion(currency: string, market: MarketSnapshot) {
  if (currency === "USD")
    return {
      rate: 1,
      date: new Date().toISOString().slice(0, 10),
      source: "USD",
    };
  if (currency === "BTC")
    return {
      rate: 1 / (requireQuote(market, "BTC").reference ?? requireQuote(market, "BTC").price),
      date: new Date().toISOString().slice(0, 10),
      source: "Kraken",
    };
  if (currency === "EUR" || currency === "GBP") {
    try { return {
      rate: 1 / (requireQuote(market, currency).reference ?? requireQuote(market, currency).price),
      date: new Date().toISOString().slice(0, 10),
      source: "Kraken",
    }; } catch { /* Try independent daily FX providers below. */ }
  }
  const result = await cached("fx:" + currency, 3600000, async () => {
    try {
    const data = await json(
      "https://api.frankfurter.dev/v2/rate/USD/" + encodeURIComponent(currency),
      2500,
    );
    if (
      !Number.isFinite(data.rate) ||
      data.rate <= 0 ||
      !Number.isFinite(Date.parse(data.date)) ||
      Math.abs(Date.now() - Date.parse(data.date)) > 7 * 86400000
    )
      throw new Error("Account currency rate unavailable");
    return {
      rate: Number(data.rate),
      date: String(data.date),
      source: "Frankfurter daily reference",
    };
    } catch {
      // Cache one full response for all account currencies, avoiding provider limits.
      const data = await cached("fx:backup:USD", 3600000, async () => {
        const response = await json("https://open.er-api.com/v6/latest/USD", 3500);
        if (response.result !== "success" || response.base_code !== "USD" ||
            !Number.isFinite(response.time_last_update_unix) ||
            Math.abs(Date.now() - response.time_last_update_unix * 1000) > 7 * 86400000)
          throw new Error("Invalid backup exchange rates");
        return response;
      });
      const rate = data.rates?.[currency];
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("Unsupported account currency");
      return { rate, date: new Date(data.time_last_update_unix * 1000).toISOString().slice(0, 10), source: "ExchangeRate-API daily reference" };
    }
  });
  if (Math.abs(Date.now() - Date.parse(result.date)) > 7 * 86400000)
    throw new Error("Account currency rate is outdated");
  return result;
}
export async function getChart(asset: string) {
  const pair = MARKET_PAIRS[asset];
  if (!pair) throw new Error("Unknown instrument");
  return cached("chart:" + asset, 60000, async () => {
    const data = await json(
      "https://api.kraken.com/0/public/OHLC?pair=" + pair + "&interval=1",
    );
    const rows = data.result?.[pair];
    if (data.error?.length || !Array.isArray(rows))
      throw new Error("Chart history unavailable");
    return rows
      .slice(-90)
      .map((r: any) => ({ time: Number(r[0]) * 1000, price: Number(r[4]) }))
      .filter(
        (r: any) =>
          Number.isFinite(r.time) && Number.isFinite(r.price) && r.price > 0,
      );
  });
}
