const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  ts = require("typescript"),
  vm = require("node:vm"),
  fs = require("node:fs");
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/lib/simulation.js", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
  { exports: mod.exports, Date, Math, JSON, Number, Error },
);
const {
  createState,
  quote,
  metrics,
  openPosition,
  closePosition,
  advance,
  restoreState,
} = mod.exports;
test("sample portfolio reconciles with starting capital", () => {
  const s = createState(1000);
  assert.equal(s.cash, 25422.75);
  assert.equal(metrics(s).realized, 422.75);
  assert.equal(s.history.length, 6);
});
test("forex and crypto lot sizes reserve correct margin", () => {
  const s = createState(1000);
  s.prices.EUR = 1.1;
  s.prices.BTC = 60000;
  assert.equal(quote(s, "EUR", 0.01).margin, 55);
  assert.equal(quote(s, "BTC", 0.01).margin, 300);
  for (const lots of [0, -1, NaN, Infinity, 0.0001, 101])
    assert.throws(() => quote(s, "BTC", lots));
});
test("positions close once and return reserved margin plus price-based profit", () => {
  const s = createState(1000);
  s.prices.BTC = 60000;
  const cash = s.cash;
  const p = openPosition(s, { asset: "BTC", side: "BUY", lots: 0.01 }, 1000);
  assert.equal(s.cash, cash - 300);
  s.prices.BTC = 61000;
  const result = closePosition(s, p.id);
  assert.equal(result.pnl, 10);
  assert.equal(s.cash, cash + 10);
  assert.equal(closePosition(s, p.id), null);
});
test("short profit is directionally correct; liquidation cannot produce negative cash", () => {
  const s = createState(1000);
  s.prices.BTC = 60000;
  const cash = s.cash,
    p = openPosition(s, { asset: "BTC", side: "SELL", lots: 0.01 }, 1000);
  s.prices.BTC = 59000;
  assert.equal(closePosition(s, p.id).pnl, 10);
  const q = openPosition(s, { asset: "BTC", side: "BUY", lots: 0.1 }, 1000);
  s.prices.BTC = 1;
  const t = closePosition(s, q.id);
  assert.equal(t.pnl, -q.margin);
  assert.equal(s.cash, cash + 10 - q.margin);
});
test("timed orders wait until expiry and pause freezes deadlines", () => {
  const s = createState(1000);
  const p = openPosition(
    s,
    { asset: "BTC", side: "BUY", lots: 0.01, duration: 15 },
    1000,
  );
  advance(s, 2000);
  assert.equal(s.positions.length, 1);
  s.paused = true;
  advance(s, 12000);
  assert.equal(p.expiresAt, 26000);
  s.paused = false;
  advance(s, 25999);
  assert.equal(s.positions.length, 1);
  advance(s, 26000);
  assert.equal(s.positions.length, 0);
  assert.equal(s.history[0].reason, "Timer completed");
});
test("stop loss and take profit directions are validated and triggered", () => {
  const s = createState(1000);
  s.prices.BTC = 60000;
  assert.throws(() =>
    openPosition(s, { asset: "BTC", side: "BUY", lots: 0.01, stop: 61000 }),
  );
  const p = openPosition(
    s,
    { asset: "BTC", side: "BUY", lots: 0.01, take: 60500 },
    1000,
  );
  s.prices.BTC = 61000;
  advance(s, 2000);
  assert.equal(s.history[0].id, p.id);
  assert.equal(s.history[0].reason, "Take profit");
});
test("invalid orders cannot change balance", () => {
  const s = createState(1000),
    cash = s.cash;
  for (const data of [
    { asset: "BTC", side: "BUY", lots: 100 },
    { asset: "BAD", side: "BUY", lots: 0.01 },
    { asset: "BTC", side: "BUY", lots: 0.01, duration: 1 },
  ])
    assert.throws(() => openPosition(s, data));
  assert.equal(s.cash, cash);
});
test("local restore preserves positions while freezing offline timers and repairs malformed data", () => {
  const s = createState(1000),
    p = openPosition(
      s,
      { asset: "BTC", side: "BUY", lots: 0.01, duration: 15 },
      1000,
    );
  const restored = restoreState(JSON.stringify(s), 11000);
  assert.equal(restored.positions[0].expiresAt, p.expiresAt + 10000);
  assert.equal(restored.cash, s.cash);
  assert.equal(restoreState("{broken", 1000).cash, 25422.75);
});
