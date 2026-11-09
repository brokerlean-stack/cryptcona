export const ASSETS = [
  {
    id: "BTC",
    name: "Bitcoin",
    pair: "BTC / USD",
    kind: "Crypto",
    base: 64280,
    units: 1,
    leverage: 2,
    vol: 0.0008,
    color: "#f3ab53",
    symbol: "₿",
    digits: 2,
  },
  {
    id: "ETH",
    name: "Ethereum",
    pair: "ETH / USD",
    kind: "Crypto",
    base: 3468,
    units: 1,
    leverage: 2,
    vol: 0.001,
    color: "#b3a1f5",
    symbol: "Ξ",
    digits: 2,
  },
  {
    id: "SOL",
    name: "Solana",
    pair: "SOL / USD",
    kind: "Crypto",
    base: 148.26,
    units: 1,
    leverage: 2,
    vol: 0.0012,
    color: "#83d9c4",
    symbol: "S",
    digits: 2,
  },
  {
    id: "EUR",
    name: "Euro / US Dollar",
    pair: "EUR / USD",
    kind: "Forex",
    base: 1.0842,
    units: 100000,
    leverage: 20,
    vol: 0.00012,
    color: "#88b7f1",
    symbol: "€",
    digits: 5,
  },
  {
    id: "GBP",
    name: "British Pound",
    pair: "GBP / USD",
    kind: "Forex",
    base: 1.2745,
    units: 100000,
    leverage: 20,
    vol: 0.00015,
    color: "#dcabdf",
    symbol: "£",
    digits: 5,
  },
];
export const assetById = (id) => ASSETS.find((a) => a.id === id);
export const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
function random(state) {
  let x = state.seed | 0;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  state.seed = x >>> 0;
  return state.seed / 4294967296;
}
export function createState(now = Date.now()) {
  const state = {
    version: 1,
    seed: 723416,
    cash: 25000,
    prices: {},
    series: {},
    positions: [],
    history: [],
    lastTick: now,
    sequence: 1,
    selected: "BTC",
    theme: "dark",
    paused: false,
  };
  for (const a of ASSETS) {
    let p = a.base * 0.99;
    state.series[a.id] = [];
    for (let i = 0; i < 90; i++) {
      p *= 1 + (random(state) - 0.46) * a.vol * 5;
      state.series[a.id].push(p);
    }
    state.prices[a.id] = p;
  }
  const sample = [
    ["BTC", "BUY", 128.4],
    ["EUR", "SELL", -42.15],
    ["ETH", "BUY", 215.6],
    ["GBP", "SELL", 84.3],
    ["SOL", "BUY", -61.2],
    ["BTC", "SELL", 97.8],
  ];
  sample.forEach(([asset, side, pnl], i) => {
    const a = assetById(asset),
      lots = asset === "ETH" ? 1 : asset === "SOL" ? 10 : 0.1,
      exit = state.prices[asset],
      entry = exit - (pnl / (lots * a.units)) * (side === "BUY" ? 1 : -1);
    state.history.unshift({
      id: "sample-" + i,
      asset,
      side,
      lots,
      units: lots * a.units,
      entry,
      exit,
      pnl,
      openedAt: now - (8 - i) * 3600000,
      closedAt: now - (7 - i) * 3600000,
      reason: "Sample trade",
      sample: true,
    });
    state.cash = round(state.cash + pnl);
  });
  return state;
}
export function quote(state, asset, lots) {
  const a = assetById(asset);
  if (!a) throw new Error("Choose an instrument.");
  if (
    !Number.isFinite(lots) ||
    lots < 0.001 ||
    lots > 100 ||
    Math.abs(lots * 1000 - Math.round(lots * 1000)) > 1e-7
  )
    throw new Error("Lot size must be 0.001–100, with at most 3 decimals.");
  const units = lots * a.units,
    notional = units * state.prices[asset];
  return {
    units,
    notional,
    margin: round(notional / a.leverage),
    leverage: a.leverage,
  };
}
export function pnl(state, p) {
  return round(
    Math.max(
      -p.margin,
      (state.prices[p.asset] - p.entry) * p.units * (p.side === "BUY" ? 1 : -1),
    ),
  );
}
export function metrics(state) {
  const margin = round(state.positions.reduce((n, p) => n + p.margin, 0)),
    unrealized = round(state.positions.reduce((n, p) => n + pnl(state, p), 0)),
    realized = round(state.history.reduce((n, t) => n + t.pnl, 0));
  return {
    margin,
    unrealized,
    realized,
    equity: round(state.cash + margin + unrealized),
    winRate: state.history.length
      ? Math.round(
          (state.history.filter((t) => t.pnl > 0).length /
            state.history.length) *
            100,
        )
      : 0,
  };
}
/** @param {any} state @param {{asset:string,side:string,lots:number,duration?:number,stop?:number|null,take?:number|null}} order @param {number} now */
export function openPosition(
  state,
  { asset, side, lots, duration = 0, stop = null, take = null },
  now = Date.now(),
) {
  if (state.paused)
    throw new Error("Resume the market before opening a position.");
  if (!["BUY", "SELL"].includes(side)) throw new Error("Choose a direction.");
  if (![0, 15, 30, 60, 180].includes(duration))
    throw new Error("Choose a supported duration.");
  if (state.positions.length >= 12)
    throw new Error("Close a position first (12 open positions maximum).");
  const q = quote(state, asset, lots),
    price = state.prices[asset];
  if (q.margin <= 0 || q.margin > state.cash)
    throw new Error("Not enough available funds for this margin.");
  for (const value of [stop, take])
    if (value !== null && (!Number.isFinite(value) || value <= 0))
      throw new Error("Exit prices must be positive.");
  if (stop !== null && (side === "BUY" ? stop >= price : stop <= price))
    throw new Error(
      "Stop loss must be below a buy entry or above a sell entry.",
    );
  if (take !== null && (side === "BUY" ? take <= price : take >= price))
    throw new Error(
      "Take profit must be above a buy entry or below a sell entry.",
    );
  const p = {
    id: "position-" + state.sequence++,
    asset,
    side,
    lots,
    units: q.units,
    margin: q.margin,
    entry: price,
    openedAt: now,
    expiresAt: duration ? now + duration * 1000 : null,
    stop,
    take,
  };
  state.cash = round(state.cash - q.margin);
  state.positions.push(p);
  return p;
}
export function closePosition(
  state,
  id,
  reason = "Closed manually",
  now = Date.now(),
) {
  const index = state.positions.findIndex((p) => p.id === id);
  if (index < 0) return null;
  const p = state.positions[index],
    profit = pnl(state, p);
  state.cash = round(state.cash + p.margin + profit);
  const trade = {
    ...p,
    exit: state.prices[p.asset],
    pnl: profit,
    closedAt: now,
    reason,
  };
  state.positions.splice(index, 1);
  state.history.unshift(trade);
  return trade;
}
export function advance(state, now = Date.now()) {
  if (now <= state.lastTick) return [];
  const elapsed = now - state.lastTick;
  if (state.paused) {
    for (const p of state.positions) if (p.expiresAt) p.expiresAt += elapsed;
    state.lastTick = now;
    return [];
  }
  const closed = [];
  // One synthetic step per rendered tick, including when a tab resumes. No invented offline ticks.
  for (const a of ASSETS) {
    const direction = random(state) < 0.5 ? -1 : 1;
    state.prices[a.id] *= 1 + direction * (0.2 + random(state) * 0.8) * a.vol;
    state.series[a.id].push(state.prices[a.id]);
    state.series[a.id] = state.series[a.id].slice(-90);
  }
  for (const p of [...state.positions]) {
    const price = state.prices[p.asset],
      long = p.side === "BUY";
    let reason = "";
    if (pnl(state, p) <= -p.margin) reason = "Margin limit";
    else if (p.stop !== null && (long ? price <= p.stop : price >= p.stop))
      reason = "Stop loss";
    else if (p.take !== null && (long ? price >= p.take : price <= p.take))
      reason = "Take profit";
    else if (p.expiresAt && now >= p.expiresAt) reason = "Timer completed";
    if (reason) closed.push(closePosition(state, p.id, reason, now));
  }
  state.lastTick = now;
  return closed;
}
export function restoreState(raw, now = Date.now()) {
  try {
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !Number.isFinite(s.lastTick) ||
      !Number.isFinite(s.cash) ||
      s.cash < 0 ||
      !Number.isSafeInteger(s.sequence) ||
      !Number.isFinite(s.seed) ||
      !Array.isArray(s.positions) ||
      !Array.isArray(s.history) ||
      !assetById(s.selected)
    )
      throw 0;
    if (
      s.funding !== undefined &&
      (!Array.isArray(s.funding) ||
        s.funding.some(
          (f) => !Number.isFinite(f.amount) || !Number.isFinite(f.time),
        ))
    )
      throw 0;
    for (const a of ASSETS)
      if (
        !Number.isFinite(s.prices[a.id]) ||
        s.prices[a.id] <= 0 ||
        !Array.isArray(s.series[a.id]) ||
        s.series[a.id].length < 2 ||
        s.series[a.id].some((n) => !Number.isFinite(n) || n <= 0)
      )
        throw 0;
    for (const p of s.positions)
      if (
        !assetById(p.asset) ||
        !["BUY", "SELL"].includes(p.side) ||
        ![p.margin, p.entry, p.units, p.lots, p.openedAt].every(
          Number.isFinite,
        ) ||
        p.margin < 0 ||
        p.entry <= 0 ||
        p.units <= 0 ||
        (p.expiresAt !== null && !Number.isFinite(p.expiresAt))
      )
        throw 0;
    for (const h of s.history)
      if (
        !assetById(h.asset) ||
        ![h.pnl, h.lots, h.entry, h.exit, h.closedAt].every(Number.isFinite)
      )
        throw 0;
    // Freeze timers while the application was closed; prices are never fetched or simulated offline.
    const gap = Math.max(0, now - s.lastTick);
    for (const p of s.positions) if (p.expiresAt) p.expiresAt += gap;
    s.lastTick = now;
    s.theme = s.theme === "light" ? "light" : "dark";
    s.paused = !!s.paused;
    return s;
  } catch {
    return createState(now);
  }
}
