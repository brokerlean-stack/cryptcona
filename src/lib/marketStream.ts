import type { MarketQuote } from "./marketData";
export const STREAM_SYMBOLS = [
  "BTC/USD",
  "ETH/USD",
  "SOL/USD",
  "EUR/USD",
  "GBP/USD",
];
export type StreamQuote = MarketQuote & { changeLabel: string };
export function parseStreamTicker(
  message: any,
  now = Date.now(),
): Record<string, StreamQuote> {
  const result: Record<string, StreamQuote> = {};
  if (message?.channel !== "ticker" || !Array.isArray(message.data))
    return result;
  for (const tick of message.data) {
    if (!STREAM_SYMBOLS.includes(tick.symbol)) continue;
    if (
      ![tick.last, tick.bid, tick.ask, tick.change_pct].every(
        Number.isFinite,
      ) ||
      tick.last <= 0 ||
      tick.bid <= 0 ||
      tick.ask < tick.bid
    )
      continue;
    result[tick.symbol.split("/")[0]] = {
      price: tick.last,
      bid: tick.bid,
      ask: tick.ask,
      change: tick.change_pct,
      fetchedAt: now,
      source: "Kraken WebSocket",
      changeLabel: "24h",
    };
  }
  return result;
}
