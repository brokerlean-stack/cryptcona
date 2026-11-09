import { randomInt } from "node:crypto";
import PracticeMarket from "@/models/PracticeMarket";
import dbConnect from "./db";
import {
  getMarket,
  peekMarket,
  MARKET_PAIRS,
  type MarketSnapshot,
} from "./marketData";
import { anchoredStep, PRICE_BAND, PRICE_TICK_MS } from "./anchoredPriceMath";
type Snapshot = MarketSnapshot & {
  series: Record<string, { time: number; price: number }[]>;
  referenceAt: number;
};
const root = globalThis as typeof globalThis & {
  anchoredMarketState?: {
    value?: Snapshot;
    pending?: Promise<Snapshot>;
    warming?: Promise<unknown>;
  };
};
const cached = (root.anchoredMarketState ||= {});
const draw = () => randomInt(0, 1000000) / 1000000;
// Continue the disclosed practice path during provider outages, without claiming
// an old reference is live. Beyond one day, a new external reference is required.
export const MAX_REFERENCE_AGE = 24 * 60 * 60 * 1000;
function snapshot(row: any): Snapshot {
  const stale =
    Date.now() - row.referenceAt > MAX_REFERENCE_AGE ||
    Date.now() - row.tick * PRICE_TICK_MS > 30000;
  return {
    quotes: row.quotes,
    series: row.series,
    fetchedAt: row.tick * PRICE_TICK_MS,
    referenceAt: row.referenceAt,
    stale,
    error: stale
      ? "Live reference is unavailable. Generated prices and orders are paused."
      : null,
  };
}
export function peekAnchoredMarket(): MarketSnapshot {
  if (!cached.value)
    return {
      quotes: {},
      fetchedAt: 0,
      stale: true,
      error: "Waiting for anchored prices",
    };
  return {
    ...cached.value,
    stale:
      Date.now() - cached.value.referenceAt > MAX_REFERENCE_AGE ||
      Date.now() - cached.value.fetchedAt > 30000,
  };
}
export async function getAnchoredMarket(): Promise<Snapshot> {
  const tick = Math.floor(Date.now() / PRICE_TICK_MS);
  if (
    cached.value &&
    Math.floor(cached.value.fetchedAt / PRICE_TICK_MS) === tick
  )
    return cached.value;
  if (cached.pending) return cached.pending;
  cached.pending = update(tick)
    .then((value) => {
      cached.value = value;
      return value;
    })
    .finally(() => {
      cached.pending = undefined;
    });
  return cached.pending;
}
async function update(tick: number): Promise<Snapshot> {
  await dbConnect();
  for (let attempt = 0; attempt < 4; attempt++) {
    const row: any = await PracticeMarket.findById("shared-v1").lean();
    if (row && row.tick >= tick) return snapshot(row);
    let reference = peekMarket();
    if (!row || Date.now() - row.referenceAt > MAX_REFERENCE_AGE)
      reference = await getMarket();
    else if (Date.now() - reference.fetchedAt > 10000 && !cached.warming) {
      // Keep animation off the upstream network's critical path.
      cached.warming = getMarket().catch(() => undefined).finally(() => {
        cached.warming = undefined;
      });
    }
    const freshReference =
      !reference.stale && Object.keys(reference.quotes).length === 5 &&
      (!row || reference.fetchedAt >= row.referenceAt);
    if (!freshReference && (!row || Date.now() - row.referenceAt > MAX_REFERENCE_AGE)) {
      if (row) return snapshot(row);
      throw new Error(
        "A live reference price is required before starting the price feed",
      );
    }
    const quotes: Record<string, any> = {},
      series: Record<string, any[]> = {};
    const referenceAt = freshReference ? reference.fetchedAt : row.referenceAt;
    for (const id of Object.keys(MARKET_PAIRS)) {
      const anchor = freshReference
        ? reference.quotes[id].price
        : row.quotes[id].reference;
      const previous = row?.quotes[id]?.price || anchor;
      const price = anchoredStep(previous, anchor, draw(), draw());
      quotes[id] = {
        price,
        bid: price,
        ask: price,
        reference: anchor,
        referenceAt,
        referenceSource: freshReference ? reference.quotes[id].source : row.quotes[id].referenceSource || "Kraken",
        lower: anchor * (1 - PRICE_BAND),
        upper: anchor * (1 + PRICE_BAND),
        change: (price / anchor - 1) * 100,
        changeLabel: "from reference",
        source: "Anchored practice feed",
        fetchedAt: tick * PRICE_TICK_MS,
      };
      series[id] = [
        ...(row?.series[id] || []),
        { time: tick * PRICE_TICK_MS, price },
      ].slice(-240);
    }
    const next = { _id: "shared-v1", tick, referenceAt, quotes, series };
    if (!row) {
      try {
        await PracticeMarket.create(next);
        return snapshot(next);
      } catch (e: any) {
        if (e.code === 11000) continue;
        throw e;
      }
    }
    // CAS makes every browser and every server instance observe one shared tick.
    const result = await PracticeMarket.updateOne(
      { _id: "shared-v1", tick: row.tick },
      { $set: { tick, referenceAt, quotes, series } },
    );
    if (result.modifiedCount) return snapshot(next);
  }
  const current = await PracticeMarket.findById("shared-v1").lean();
  if (!current) throw new Error("Price feed is temporarily unavailable");
  return snapshot(current);
}
