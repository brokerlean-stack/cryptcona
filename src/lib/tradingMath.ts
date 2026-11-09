import { ASSETS } from "./simulation";
export const moneyRound = (n: number, currency = "USD") => {
  const scale = currency === "BTC" ? 1e8 : 100;
  return Math.round((n + Number.EPSILON) * scale) / scale;
};
export function orderTerms(
  asset: string,
  lots: number,
  price: number,
  rate: number,
  currency: string,
) {
  const a = ASSETS.find((a) => a.id === asset);
  if (
    !a ||
    !Number.isFinite(lots) ||
    lots <= 0
  )
    throw new Error("Enter a positive lot size.");
  if (![price, rate].every((n) => Number.isFinite(n) && n > 0))
    throw new Error("Market price or conversion unavailable");
  const units = lots * a.units,
    notional = units * price * rate;
  const margin = moneyRound(notional / a.leverage, currency);
  if (![units, notional, margin].every(n => Number.isFinite(n) && n > 0 && n <= Number.MAX_SAFE_INTEGER))
    throw new Error("Trade size is too small or too large to calculate accurately.");
  return {
    lots,
    units,
    notional,
    margin,
    leverage: a.leverage,
  };
}
// Amount means account-currency margin to reserve, not leveraged notional.
export function sizedOrderTerms(
  order: { asset: string; sizingMode?: string; lots?: number; amount?: number },
  price: number, rate: number, currency: string,
) {
  const mode = order.sizingMode ?? "lots";
  if (mode === "lots") return orderTerms(order.asset, order.lots as number, price, rate, currency);
  if (mode !== "amount") throw new Error("Choose lots or amount sizing.");
  const amount = order.amount;
  const scale = currency === "BTC" ? 1e8 : 100;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 ||
      amount * scale > Number.MAX_SAFE_INTEGER ||
      Math.abs(amount * scale - Math.round(amount * scale)) > 1e-6)
    throw new Error(`Enter a positive amount with at most ${currency === "BTC" ? 8 : 2} decimals.`);
  const asset = ASSETS.find(a => a.id === order.asset);
  if (!asset || ![price, rate].every(n => Number.isFinite(n) && n > 0))
    throw new Error("Market price or conversion unavailable");
  const lots = amount * asset.leverage / (asset.units * price * rate);
  const terms = orderTerms(order.asset, lots, price, rate, currency);
  return { ...terms, margin: moneyRound(amount, currency) };
}
export function positionProfit(p: any, price: number) {
  return moneyRound(
    Math.max(
      -p.margin,
      (price - p.entry) * p.units * (p.side === "BUY" ? 1 : -1) * p.fxRate,
    ),
    p.currency,
  );
}
export function exitReason(p: any, price: number, now = Date.now()) {
  const long = p.side === "BUY";
  if (positionProfit(p, price) <= -p.margin) return "Margin limit";
  if (p.stop != null && (long ? price <= p.stop : price >= p.stop))
    return "Stop loss";
  if (p.take != null && (long ? price >= p.take : price <= p.take))
    return "Take profit";
  if (p.expiresAt && now >= new Date(p.expiresAt).getTime())
    return "Timer completed";
  return "";
}
