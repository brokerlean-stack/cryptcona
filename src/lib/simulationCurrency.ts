// Fixed presentation rates, not live FX quotes. Preserve the engine's USD ledger
// and convert only account-denominated values for display and export.
export const SIMULATION_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1500,
  ZAR: 18,
  MAD: 10,
  JPY: 150,
  CAD: 1.35,
  AUD: 1.5,
  CHF: 0.88,
  CNY: 7.2,
  INR: 83,
  SGD: 1.34,
  HKD: 7.8,
  NZD: 1.65,
  KRW: 1330,
  MXN: 17,
  SAR: 3.75,
  AED: 3.67,
  THB: 35,
  VND: 24500,
  MYR: 4.7,
  IDR: 15500,
  TRY: 32,
  SEK: 10.4,
  NOK: 10.5,
  DKK: 6.86,
  PLN: 4,
  RUB: 90,
  ARS: 900,
  CLP: 950,
  COP: 3900,
  PEN: 3.7,
  UYU: 39,
  PAB: 1,
  CRC: 520,
  JMD: 155,
  PHP: 56,
  TWD: 32,
  ILS: 3.7,
  KWD: 0.307,
  BHD: 0.376,
  QAR: 3.64,
  HUF: 360,
  CZK: 23,
  RON: 4.6,
  BGN: 1.8,
  HRK: 6.93,
  ISK: 138,
  BTC: 1 / 64000,
  BRL: 5,
  GHS: 15,
  KES: 130,
  UGX: 3800,
  EGP: 48,
  DZD: 134,
  TND: 3.1,
};
export function accountCurrency(value?: string | null) {
  const code = value?.toUpperCase() || "USD";
  return Object.prototype.hasOwnProperty.call(SIMULATION_RATES, code)
    ? code
    : "USD";
}
export function toAccountCurrency(usd: number, currency: string) {
  return usd * SIMULATION_RATES[accountCurrency(currency)];
}
export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    ...(currency === "BTC"
      ? { minimumFractionDigits: 8, maximumFractionDigits: 8 }
      : {}),
  }).format(amount);
}
export function formatSimulationMoney(usd: number, currency: string) {
  return formatCurrency(toAccountCurrency(usd, currency), currency);
}
