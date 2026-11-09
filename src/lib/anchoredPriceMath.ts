export const PRICE_BAND = 0.04;
export const PRICE_TICK_MS = 500;
// Direction is sampled independently of accounts, orders and trade outcomes.
export function anchoredStep(
  previous: number,
  reference: number,
  directionDraw: number,
  sizeDraw: number,
) {
  if (![previous, reference].every((n) => Number.isFinite(n) && n > 0))
    throw new Error("Invalid anchor price");
  const lower = reference * (1 - PRICE_BAND),
    upper = reference * (1 + PRICE_BAND);
  const current = Math.max(lower, Math.min(upper, previous));
  const move =
    reference *
    (0.0004 + Math.max(0, Math.min(1, sizeDraw)) * 0.0012) *
    (directionDraw < 0.5 ? -1 : 1);
  let next = current + move + (reference - current) * 0.02;
  if (next > upper) next = upper - (next - upper);
  if (next < lower) next = lower + (lower - next);
  return Math.max(lower, Math.min(upper, next));
}
