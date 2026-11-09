const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const mod = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("src/lib/simulationCurrency.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports: mod.exports, Intl, Object },
);
const {
  accountCurrency,
  toAccountCurrency,
  formatSimulationMoney,
  SIMULATION_RATES,
} = mod.exports;
test("account amounts convert into signup currency rather than relabel USD", () => {
  assert.equal(toAccountCurrency(100, "NGN"), 150000);
  assert.equal(toAccountCurrency(100, "GBP"), 79);
  assert.match(formatSimulationMoney(100, "NGN"), /NGN.*150,000/);
  assert.equal(accountCurrency("eur"), "EUR");
});
test("all offered signup currencies have explicit presentation rates", () => {
  const source = fs.readFileSync(
    "src/app/register/RegisterContent.tsx",
    "utf8",
  );
  const codes = [...source.matchAll(/value: "([A-Z]{3})"/g)].map((m) => m[1]);
  assert.ok(codes.length > 30);
  for (const code of codes) assert.ok(SIMULATION_RATES[code] > 0, code);
});
