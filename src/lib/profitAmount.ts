export function parseProfitAmount(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isSafeInteger(Math.round(amount * 100))
  )
    return null;
  return amount;
}
